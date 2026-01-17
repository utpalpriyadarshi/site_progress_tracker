/**
 * useTestingData Hook
 *
 * Fetches testing and commissioning data including PM500/PM600 progress,
 * SAT/FAT inspections, and test results.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useManagerContext } from '../../context/ManagerContext';
import { logger } from '../../../services/LoggingService';

// ==================== Types ====================

export interface TestingData {
  pm500Progress: number;
  pm500Status: 'not_started' | 'in_progress' | 'completed';
  pm600Progress: number;
  pm600Status: 'not_started' | 'in_progress' | 'completed';
  totalInspections: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
  inspectionsPending: number;
  satCompleted: number;
  satPending: number;
  fatCompleted: number;
  fatPending: number;
  testPassRate: number;
  upcomingInspections: number;
  overdueInspections: number;
}

export interface UseTestingDataResult {
  data: TestingData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useTestingData(): UseTestingDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<TestingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Helper function to get milestone progress
      const getMilestoneProgress = async (milestoneCode: string) => {
        const milestone = await database.collections
          .get('milestones')
          .query(Q.where('project_id', projectId), Q.where('milestone_code', milestoneCode))
          .fetch();

        let progress = 0;
        let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';

        if (milestone.length > 0) {
          const milestoneId = milestone[0].id;
          const progressRecords = await database.collections
            .get('milestone_progress')
            .query(Q.where('milestone_id', milestoneId))
            .fetch();

          if (progressRecords.length > 0) {
            const totalProgress = progressRecords.reduce(
              (sum, record: any) => sum + (record.progressPercentage || 0),
              0
            );
            progress = Math.round(totalProgress / progressRecords.length);

            if (progress === 0) {
              status = 'not_started';
            } else if (progress < 100) {
              status = 'in_progress';
            } else {
              status = 'completed';
            }
          }
        }

        return { progress, status };
      };

      // Get PM500 (Testing) milestone progress
      const pm500 = await getMilestoneProgress('PM500');

      // Get PM600 (Commissioning) milestone progress
      const pm600 = await getMilestoneProgress('PM600');

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();
      const siteIds = sites.map(s => s.id);

      // Get inspections data
      let totalInspections = 0;
      let inspectionsPassed = 0;
      let inspectionsFailed = 0;
      let inspectionsPending = 0;
      let satCompleted = 0;
      let satPending = 0;
      let fatCompleted = 0;
      let fatPending = 0;
      let upcomingInspections = 0;
      let overdueInspections = 0;

      if (siteIds.length > 0) {
        try {
          const inspections = await database.collections
            .get('inspections')
            .query(Q.where('site_id', Q.oneOf(siteIds)))
            .fetch();

          totalInspections = inspections.length;
          const now = Date.now();
          const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

          inspections.forEach((inspection: any) => {
            // Count by result
            if (inspection.result === 'passed') {
              inspectionsPassed++;
            } else if (inspection.result === 'failed') {
              inspectionsFailed++;
            } else {
              inspectionsPending++;
            }

            // Count by type (SAT/FAT)
            if (inspection.type === 'sat') {
              if (inspection.result === 'passed') {
                satCompleted++;
              } else {
                satPending++;
              }
            } else if (inspection.type === 'fat') {
              if (inspection.result === 'passed') {
                fatCompleted++;
              } else {
                fatPending++;
              }
            }

            // Upcoming and overdue
            const scheduledDate = inspection.scheduledDate;
            if (scheduledDate && !inspection.result) {
              if (scheduledDate >= now && scheduledDate <= sevenDaysFromNow) {
                upcomingInspections++;
              } else if (scheduledDate < now) {
                overdueInspections++;
              }
            }
          });
        } catch (err) {
          // Inspections table may not exist yet
          logger.warn('[useTestingData] Inspections table not available', err as Error);
        }
      }

      // Calculate test pass rate
      const completedTests = inspectionsPassed + inspectionsFailed;
      const testPassRate = completedTests > 0
        ? Math.round((inspectionsPassed / completedTests) * 100)
        : 0;

      setData({
        pm500Progress: pm500.progress,
        pm500Status: pm500.status,
        pm600Progress: pm600.progress,
        pm600Status: pm600.status,
        totalInspections,
        inspectionsPassed,
        inspectionsFailed,
        inspectionsPending,
        satCompleted,
        satPending,
        fatCompleted,
        fatPending,
        testPassRate,
        upcomingInspections,
        overdueInspections,
      });
    } catch (err) {
      logger.error('[useTestingData] Error fetching data', err as Error);
      setError('Failed to load testing data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useTestingData;
