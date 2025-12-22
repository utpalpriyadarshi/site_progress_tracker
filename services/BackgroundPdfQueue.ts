import { Database, Q } from '@nozbe/watermelondb';
import DailyReportModel, { PdfGenerationStatus } from '../models/DailyReportModel';
import SiteModel from '../models/SiteModel';
import ItemModel from '../models/ItemModel';
import ProgressLogModel from '../models/ProgressLogModel';
import HindranceModel from '../models/HindranceModel';
import SiteInspectionModel from '../models/SiteInspectionModel';
import { ReportPdfService } from './pdf/ReportPdfService';
import { logger } from '../src/services/LoggingService';

/**
 * Background queue for async PDF generation with retry logic
 * Phase B: Share Button Photo Issue fix - Async PDF Generation
 */
class BackgroundPdfQueue {
  private static instance: BackgroundPdfQueue;
  private database: Database | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly MAX_ATTEMPTS = 3;
  private readonly PROCESS_INTERVAL_MS = 10000; // 10 seconds
  private readonly BATCH_SIZE = 5; // Process 5 reports at a time

  private constructor() {
    logger.info('BackgroundPdfQueue instance created', {
      component: 'BackgroundPdfQueue',
      action: 'constructor',
    });
  }

  static getInstance(): BackgroundPdfQueue {
    if (!BackgroundPdfQueue.instance) {
      BackgroundPdfQueue.instance = new BackgroundPdfQueue();
    }
    return BackgroundPdfQueue.instance;
  }

  /**
   * Initialize queue with database instance
   */
  initialize(database: Database): void {
    this.database = database;
    logger.info('BackgroundPdfQueue initialized', {
      component: 'BackgroundPdfQueue',
      action: 'initialize',
    });
  }

  /**
   * Start processing queue at regular intervals
   */
  startProcessing(intervalMs = this.PROCESS_INTERVAL_MS): void {
    if (this.processingInterval) {
      logger.warn('Queue processing already started', {
        component: 'BackgroundPdfQueue',
        action: 'startProcessing',
      });
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    logger.info('Queue processing started', {
      component: 'BackgroundPdfQueue',
      action: 'startProcessing',
      intervalMs,
    });

    // Process immediately on start
    this.processQueue();
  }

  /**
   * Stop processing queue
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;

      logger.info('Queue processing stopped', {
        component: 'BackgroundPdfQueue',
        action: 'stopProcessing',
      });
    }
  }

  /**
   * Add report to PDF generation queue
   */
  async enqueueReport(reportId: string): Promise<void> {
    if (!this.database) {
      throw new Error('BackgroundPdfQueue not initialized');
    }

    const reportsCollection = this.database.get<DailyReportModel>('daily_reports');
    const report = await reportsCollection.find(reportId);

    await this.database.write(async () => {
      await report.update((r: any) => {
        r.pdfGenerationStatus = 'pending';
        r.pdfGenerationAttempts = 0;
        r.pdfLastAttemptTimestamp = null;
      });
    });

    logger.info('Report enqueued for PDF generation', {
      component: 'BackgroundPdfQueue',
      action: 'enqueueReport',
      reportId,
      reportDate: report.reportDate,
    });

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Process pending PDF generation tasks
   */
  private async processQueue(): Promise<void> {
    if (!this.database || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const reportsCollection = this.database.get<DailyReportModel>('daily_reports');

      // Find reports needing PDF generation
      const pendingReports = await reportsCollection
        .query(
          Q.where('pdf_generation_status', 'pending'),
          Q.sortBy('submitted_at', Q.asc),
          Q.take(this.BATCH_SIZE)
        )
        .fetch();

      if (pendingReports.length === 0) {
        return; // Nothing to process
      }

      logger.info('Processing PDF queue', {
        component: 'BackgroundPdfQueue',
        action: 'processQueue',
        pendingCount: pendingReports.length,
      });

      // Process each report
      for (const report of pendingReports) {
        await this.generatePdfForReport(report);
      }

    } catch (error) {
      logger.error('Queue processing error', error as Error, {
        component: 'BackgroundPdfQueue',
        action: 'processQueue',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate PDF for a single report with retry logic
   */
  private async generatePdfForReport(report: DailyReportModel): Promise<void> {
    if (!this.database) return;

    const attemptNumber = report.pdfGenerationAttempts + 1;

    try {
      // Update status to generating
      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfGenerationStatus = 'generating';
          r.pdfGenerationAttempts = attemptNumber;
          r.pdfLastAttemptTimestamp = Date.now();
        });
      });

      logger.info('Starting PDF generation', {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.reportDate,
        attemptNumber,
        maxAttempts: this.MAX_ATTEMPTS,
      });

      // Fetch full report data with items
      const reportData = await this.fetchReportData(report);

      // Debug: Log what we're passing to PDF service
      logger.debug('Report data prepared for PDF generation', {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        itemCount: reportData.items.length,
        itemsWithPhotos: reportData.items.filter(({ progressLog }) =>
          progressLog && progressLog.photos && progressLog.photos !== '[]'
        ).map(({ item, progressLog }) => ({
          itemName: item.name,
          photosField: progressLog!.photos?.substring(0, 100),
        })),
      });

      // Generate PDF
      const pdfPath = await ReportPdfService.generateComprehensiveReport(reportData);

      // Success - update report
      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfPath = pdfPath;
          r.pdfGenerationStatus = 'completed';
          r.pdfErrorMessage = null;
          r.pdfErrorTimestamp = null;
        });
      });

      logger.info('PDF generation completed', {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.reportDate,
        attemptNumber,
        pdfPath,
      });

    } catch (error) {
      // Failure - determine if should retry
      const shouldRetry = attemptNumber < this.MAX_ATTEMPTS;
      const newStatus: PdfGenerationStatus = shouldRetry ? 'pending' : 'failed';

      // Count photos for diagnostics
      let photoCount = 0;
      try {
        const reportData = await this.fetchReportData(report);
        photoCount = reportData.items.reduce((total: number, itemData: any) => {
          if (!itemData.progressLog || !itemData.progressLog.photos) return total;
          try {
            const photos = JSON.parse(itemData.progressLog.photos);
            return total + (Array.isArray(photos) ? photos.length : 0);
          } catch {
            return total;
          }
        }, 0);
      } catch {
        // Ignore error during photo counting
      }

      await this.database.write(async () => {
        await report.update((r: any) => {
          r.pdfGenerationStatus = newStatus;
          r.pdfErrorMessage = (error as Error).message;
          r.pdfErrorTimestamp = Date.now();
          r.pdfPhotoCount = photoCount;
        });
      });

      logger.error('PDF generation failed', error as Error, {
        component: 'BackgroundPdfQueue',
        action: 'generatePdfForReport',
        reportId: report.id,
        reportDate: report.reportDate,
        attemptNumber,
        maxAttempts: this.MAX_ATTEMPTS,
        willRetry: shouldRetry,
        nextStatus: newStatus,
        photoCount,
      });

      // If will retry, schedule with exponential backoff
      if (shouldRetry) {
        const backoffMs = Math.pow(2, attemptNumber) * 1000; // 2s, 4s, 8s
        logger.info('Scheduling PDF retry with backoff', {
          component: 'BackgroundPdfQueue',
          action: 'generatePdfForReport',
          reportId: report.id,
          attemptNumber,
          backoffMs,
        });
        setTimeout(() => this.processQueue(), backoffMs);
      }
    }
  }

  /**
   * Fetch complete report data for PDF generation
   * Matches ComprehensiveReportData interface from ReportPdfService
   */
  private async fetchReportData(report: DailyReportModel): Promise<any> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    // Get report date range for fetching related data
    const reportDate = new Date(report.reportDate);
    reportDate.setHours(0, 0, 0, 0);
    const startOfDay = reportDate.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    // Fetch site
    const sitesCollection = this.database.get<SiteModel>('sites');
    const site = await sitesCollection.find(report.siteId);

    // Fetch all items for this site
    const itemsCollection = this.database.get<ItemModel>('items');
    const siteItems = await itemsCollection
      .query(Q.where('site_id', report.siteId))
      .fetch();

    // Fetch progress logs for today for this site's items
    const progressLogsCollection = this.database.get<ProgressLogModel>('progress_logs');
    const siteItemIds = siteItems.map(item => item.id);

    const todayLogs = await progressLogsCollection
      .query(
        Q.where('date', Q.gte(startOfDay)),
        Q.where('date', Q.lte(endOfDay)),
        Q.where('reported_by', report.supervisorId)
      )
      .fetch();

    logger.debug('Fetched progress logs for PDF generation', {
      component: 'BackgroundPdfQueue',
      action: 'fetchReportData',
      reportId: report.id,
      siteId: report.siteId,
      totalLogsFound: todayLogs.length,
      siteItemsCount: siteItems.length,
      dateRange: { startOfDay, endOfDay },
      supervisorId: report.supervisorId,
    });

    // Filter logs to only include those for this site's items
    const siteLogsOnly = todayLogs.filter(log =>
      siteItemIds.includes((log as any).itemId)
    );

    logger.debug('Filtered progress logs for site', {
      component: 'BackgroundPdfQueue',
      action: 'fetchReportData',
      reportId: report.id,
      siteId: report.siteId,
      siteLogsCount: siteLogsOnly.length,
      siteItemIds: siteItemIds.slice(0, 5), // First 5 for debugging
      logItemIds: siteLogsOnly.map(log => (log as any).itemId).slice(0, 5),
    });

    // Match items with their progress logs (get LATEST log if duplicates exist)
    const itemsWithLogs = siteItems.map(item => {
      // Find ALL logs for this item
      const itemLogs = siteLogsOnly.filter(log => (log as any).itemId === item.id);

      // Get the LATEST log (highest date) - important for duplicate logs
      const progressLog = itemLogs.length > 0
        ? itemLogs.reduce((latest, current) =>
            current.date > latest.date ? current : latest
          )
        : null;

      const hasPhotos = progressLog && progressLog.photos && progressLog.photos !== '[]';

      if (progressLog) {
        logger.debug('Item matched with progress log', {
          component: 'BackgroundPdfQueue',
          action: 'fetchReportData',
          itemId: item.id,
          itemName: item.name,
          hasProgressLog: true,
          hasPhotos,
          duplicateLogsCount: itemLogs.length,
          photos: progressLog.photos?.substring(0, 100), // First 100 chars
          logDate: progressLog.date,
        });
      }

      return {
        item,
        progressLog: progressLog || null,
      };
    });

    // Fetch hindrances for today
    const hindrancesCollection = this.database.get<HindranceModel>('hindrances');
    const todayHindrances = await hindrancesCollection
      .query(
        Q.where('site_id', report.siteId),
        Q.where('reported_at', Q.gte(startOfDay)),
        Q.where('reported_at', Q.lte(endOfDay))
      )
      .fetch();

    // Fetch inspection for today
    const inspectionsCollection = this.database.get<SiteInspectionModel>('site_inspections');
    const todayInspections = await inspectionsCollection
      .query(
        Q.where('site_id', report.siteId),
        Q.where('inspection_date', Q.gte(startOfDay)),
        Q.where('inspection_date', Q.lte(endOfDay))
      )
      .fetch();

    return {
      site,
      items: itemsWithLogs,
      hindrances: todayHindrances,
      inspection: todayInspections[0] || null,
      supervisorName: `Supervisor ${report.supervisorId}`,
      reportDate: new Date(report.reportDate),
    };
  }

  /**
   * Manually retry failed PDF generation
   */
  async retryPdfGeneration(reportId: string): Promise<void> {
    if (!this.database) {
      throw new Error('BackgroundPdfQueue not initialized');
    }

    const reportsCollection = this.database.get<DailyReportModel>('daily_reports');
    const report = await reportsCollection.find(reportId);

    if (!report.canRetryPdf) {
      throw new Error('Report cannot be retried (max attempts reached or not in failed state)');
    }

    await this.database.write(async () => {
      await report.update((r: any) => {
        r.pdfGenerationStatus = 'pending';
        // Keep existing attempt count for retry
      });
    });

    logger.info('PDF generation manually retried', {
      component: 'BackgroundPdfQueue',
      action: 'retryPdfGeneration',
      reportId,
      currentAttempts: report.pdfGenerationAttempts,
    });

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    generating: number;
    completed: number;
    failed: number;
  }> {
    if (!this.database) {
      return { pending: 0, generating: 0, completed: 0, failed: 0 };
    }

    const reportsCollection = this.database.get<DailyReportModel>('daily_reports');

    const [pending, generating, completed, failed] = await Promise.all([
      reportsCollection.query(Q.where('pdf_generation_status', 'pending')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'generating')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'completed')).fetchCount(),
      reportsCollection.query(Q.where('pdf_generation_status', 'failed')).fetchCount(),
    ]);

    return { pending, generating, completed, failed };
  }
}

// Export singleton instance
export const backgroundPdfQueue = BackgroundPdfQueue.getInstance();
export default backgroundPdfQueue;
