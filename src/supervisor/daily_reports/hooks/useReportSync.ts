import { useState, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../../../models/SiteModel';
import ItemModel from '../../../../models/ItemModel';
import HindranceModel from '../../../../models/HindranceModel';
import SiteInspectionModel from '../../../../models/SiteInspectionModel';
import ProgressLogModel from '../../../../models/ProgressLogModel';
import { ReportPdfService } from '../../../../services/pdf/ReportPdfService';
import { logger } from '../../../services/LoggingService';
import { ReportSubmissionResult } from '../types';

interface UseReportSyncParams {
  supervisorId: string;
  sites: SiteModel[];
  items: ItemModel[];
  isOnline: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onWarning: (message: string) => void;
}

interface UseReportSyncReturn {
  isSyncing: boolean;
  showOfflineConfirm: boolean;
  setShowOfflineConfirm: (show: boolean) => void;
  handleSubmitAllReports: () => Promise<void>;
  submitReports: () => Promise<void>;
}

/**
 * useReportSync Hook
 *
 * Manages report submission and synchronization
 * - Submits daily progress reports
 * - Generates PDF reports for each site
 * - Handles offline mode
 * - Creates daily_reports records
 */
export const useReportSync = ({
  supervisorId,
  sites,
  items,
  isOnline,
  onSuccess,
  onError,
  onWarning,
}: UseReportSyncParams): UseReportSyncReturn => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOfflineConfirm, setShowOfflineConfirm] = useState(false);

  /**
   * Submit reports (creates daily_reports and generates PDFs)
   */
  const submitReports = useCallback(async () => {
    setIsSyncing(true);
    let progressLogs: any[] = [];

    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

      // Get all pending progress logs for today
      progressLogs = await database.collections
        .get('progress_logs')
        .query(
          Q.where('sync_status', 'pending'),
          Q.where('date', Q.gte(startOfDay)),
          Q.where('date', Q.lte(endOfDay)),
          Q.where('reported_by', supervisorId)
        )
        .fetch();

      if (progressLogs.length === 0) {
        onWarning(
          'No pending progress updates to submit for today. Update some items first'
        );
        setIsSyncing(false);
        return;
      }

      // Group logs by site
      const logsBySite: { [siteId: string]: typeof progressLogs } = {};
      for (const log of progressLogs) {
        const item = items.find(i => i.id === (log as any).itemId);
        if (item) {
          const siteId = item.siteId;
          if (!logsBySite[siteId]) {
            logsBySite[siteId] = [];
          }
          logsBySite[siteId].push(log);
        }
      }

      // Generate reports for each site
      let totalReportsGenerated = 0;
      const reportPaths: string[] = [];

      await database.write(async () => {
        for (const siteId of Object.keys(logsBySite)) {
          const site = sites.find(s => s.id === siteId);
          if (!site) continue;

          const siteLogs = logsBySite[siteId];
          const siteItems = items.filter(i => i.siteId === siteId);

          // Calculate total progress for site
          const totalProgress =
            siteItems.length > 0
              ? siteItems.reduce((sum, item) => {
                  const progress =
                    item.plannedQuantity > 0
                      ? (item.completedQuantity / item.plannedQuantity) * 100
                      : 0;
                  return sum + progress;
                }, 0) / siteItems.length
              : 0;

          // Generate PDF report
          let pdfPath = '';
          try {
            const itemsWithLogs = siteItems.map(item => ({
              item,
              progressLog:
                (siteLogs.find(
                  log => (log as any).itemId === item.id
                ) as ProgressLogModel) || null,
            }));

            // Collect today's hindrances for this site
            const todayHindrances = (await database.collections
              .get('hindrances')
              .query(
                Q.where('site_id', siteId),
                Q.where('reported_at', Q.gte(startOfDay)),
                Q.where('reported_at', Q.lte(endOfDay))
              )
              .fetch()) as HindranceModel[];

            // Collect today's inspection for this site
            const todayInspections = (await database.collections
              .get('site_inspections')
              .query(
                Q.where('site_id', siteId),
                Q.where('inspection_date', Q.gte(startOfDay)),
                Q.where('inspection_date', Q.lte(endOfDay))
              )
              .fetch()) as SiteInspectionModel[];

            pdfPath = await ReportPdfService.generateComprehensiveReport({
              site,
              items: itemsWithLogs,
              hindrances: todayHindrances,
              inspection: todayInspections[0] || null,
              supervisorName: `Supervisor ${supervisorId}`,
              reportDate: new Date(),
            });
            reportPaths.push(pdfPath);

            logger.info('PDF report generated successfully', {
              component: 'useReportSync',
              action: 'submitReports',
              pdfPath,
              siteId,
            });
          } catch (pdfError) {
            logger.error('PDF generation failed', pdfError as Error, {
              component: 'useReportSync',
              action: 'submitReports',
              siteId,
            });
            onWarning('Report saved but PDF generation failed');
            // Continue even if PDF generation fails
          }

          // Create daily report record
          await database.collections.get('daily_reports').create((report: any) => {
            report.siteId = siteId;
            report.supervisorId = supervisorId;
            report.reportDate = startOfDay;
            report.submittedAt = new Date().getTime();
            report.totalItems = siteLogs.length;
            report.totalProgress = totalProgress;
            report.pdfPath = pdfPath;
            report.notes = `${siteLogs.length} items updated`;
            report.appSyncStatus = isOnline ? 'synced' : 'pending';
          });

          totalReportsGenerated++;
        }

        // Mark all progress logs as synced
        if (isOnline) {
          for (const log of progressLogs) {
            await log.update((l: any) => {
              l.appSyncStatus = 'synced';
            });
          }
        }
      });

      const reportDate = new Date().toLocaleDateString();
      const pdfStatus =
        reportPaths.length > 0 ? ` - ${reportPaths.length} PDF(s) generated` : '';
      const message = isOnline
        ? `${totalReportsGenerated} daily report(s) submitted - ${progressLogs.length} updates for ${reportDate}${pdfStatus}`
        : `${totalReportsGenerated} report(s) saved locally - ${progressLogs.length} updates for ${reportDate}${pdfStatus}`;

      onSuccess(message);

      if (reportPaths.length > 0) {
        logger.info('PDF reports generated', {
          component: 'useReportSync',
          action: 'submitReports',
          count: reportPaths.length,
          paths: reportPaths,
        });
      }
    } catch (error) {
      logger.error('Failed to submit reports', error as Error, {
        component: 'useReportSync',
        action: 'submitReports',
        progressLogCount: progressLogs.length,
      });
      onError('Failed to submit reports: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  }, [supervisorId, sites, items, isOnline, onSuccess, onError, onWarning]);

  /**
   * Handle submit all reports button click
   * Shows confirmation if offline
   */
  const handleSubmitAllReports = useCallback(async () => {
    if (!isOnline) {
      setShowOfflineConfirm(true);
    } else {
      await submitReports();
    }
  }, [isOnline, submitReports]);

  return {
    isSyncing,
    showOfflineConfirm,
    setShowOfflineConfirm,
    handleSubmitAllReports,
    submitReports,
  };
};
