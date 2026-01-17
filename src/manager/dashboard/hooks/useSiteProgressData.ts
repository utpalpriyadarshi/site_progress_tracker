/**
 * useSiteProgressData Hook
 *
 * Fetches site-by-site progress data with hybrid calculation
 * (60% items + 40% milestones) for the manager's project.
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

export interface SiteProgressItem {
  siteId: string;
  siteName: string;
  supervisorName: string;
  overallProgress: number;
  status: 'on_track' | 'at_risk' | 'delayed';
  criticalIssues: number;
  itemsProgress: number;
  milestonesProgress: number;
}

export interface UseSiteProgressDataResult {
  data: SiteProgressItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useSiteProgressData(): UseSiteProgressDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<SiteProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesData: SiteProgressItem[] = [];

      for (const site of sites) {
        const siteId = site.id;
        const siteName = (site as any).name;

        // Get supervisor name
        const supervisorId = (site as any).supervisorId;
        let supervisorName = 'Unassigned';
        if (supervisorId) {
          try {
            const supervisor = await database.collections.get('users').find(supervisorId);
            supervisorName = (supervisor as any).fullName || (supervisor as any).username;
          } catch (err) {
            supervisorName = 'Unknown';
          }
        }

        // Calculate items progress (weighted)
        const items = await database.collections
          .get('items')
          .query(Q.where('site_id', siteId))
          .fetch();

        let itemsProgress = 0;
        if (items.length > 0) {
          const totalWeightage = items.reduce((sum, item: any) => sum + (item.weightage || 1), 0);
          const weightedProgress = items.reduce((sum, item: any) => {
            const weightage = item.weightage || 1;
            const progress = item.getProgressPercentage ? item.getProgressPercentage() : 0;
            return sum + (weightage * progress);
          }, 0);
          itemsProgress = totalWeightage > 0 ? (weightedProgress / totalWeightage) : 0;
        }

        // Calculate milestones progress for this site
        const milestones = await database.collections
          .get('milestones')
          .query(Q.where('project_id', projectId), Q.where('is_active', true))
          .fetch();

        let milestonesProgress = 0;
        if (milestones.length > 0) {
          const totalMilestoneWeight = milestones.reduce(
            (sum, m: any) => sum + (m.weightage || 0),
            0
          );

          const milestoneProgressRecords = await database.collections
            .get('milestone_progress')
            .query(Q.where('site_id', siteId))
            .fetch();

          const milestoneProgressMap = new Map<string, number>();
          milestoneProgressRecords.forEach((mp: any) => {
            milestoneProgressMap.set(mp.milestoneId, mp.progressPercentage || 0);
          });

          const weightedMilestoneProgress = milestones.reduce((sum, milestone: any) => {
            const progress = milestoneProgressMap.get(milestone.id) || 0;
            return sum + (milestone.weightage * progress);
          }, 0);

          milestonesProgress = totalMilestoneWeight > 0 ? weightedMilestoneProgress / totalMilestoneWeight : 0;
        }

        // Hybrid calculation: 60% items + 40% milestones
        const overallProgress = milestones.length > 0
          ? itemsProgress * 0.6 + milestonesProgress * 0.4
          : itemsProgress;

        // Determine status based on schedule
        const siteStartDate = (site as any).startDate;
        const siteTargetDate = (site as any).targetDate;
        const now = Date.now();

        let status: 'on_track' | 'at_risk' | 'delayed' = 'on_track';

        if (siteStartDate && siteTargetDate) {
          const daysElapsed = Math.floor((now - siteStartDate) / (1000 * 60 * 60 * 24));
          const totalDays = Math.floor((siteTargetDate - siteStartDate) / (1000 * 60 * 60 * 24));
          const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

          if (overallProgress < expectedProgress - 10) {
            status = 'delayed';
          } else if (overallProgress < expectedProgress - 5) {
            status = 'at_risk';
          }
        }

        // Get critical issues count
        const hindrances = await database.collections
          .get('hindrances')
          .query(Q.where('site_id', siteId), Q.where('status', 'open'))
          .fetch();

        const criticalIssues = hindrances.filter(
          (h: any) => h.priority === 'high' || h.priority === 'critical'
        ).length;

        sitesData.push({
          siteId,
          siteName,
          supervisorName,
          overallProgress: Math.round(overallProgress * 10) / 10,
          status,
          criticalIssues,
          itemsProgress: Math.round(itemsProgress),
          milestonesProgress: Math.round(milestonesProgress),
        });
      }

      // Sort by status (delayed first) then by progress
      sitesData.sort((a, b) => {
        const statusOrder = { delayed: 0, at_risk: 1, on_track: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.overallProgress - b.overallProgress;
      });

      setData(sitesData);
    } catch (err) {
      logger.error('[useSiteProgressData] Error fetching data', err as Error);
      setError('Failed to load site progress data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useSiteProgressData;
