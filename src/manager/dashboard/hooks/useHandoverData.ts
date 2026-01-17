/**
 * useHandoverData Hook
 *
 * Fetches handover status data including PM700 progress,
 * documentation completion, and punch list items.
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

export interface HandoverData {
  pm700Progress: number;
  pm700Status: 'not_started' | 'in_progress' | 'completed';
  totalDocuments: number;
  documentsApproved: number;
  documentsUnderReview: number;
  documentsPending: number;
  documentationProgress: number;
  totalPunchListItems: number;
  punchListOpen: number;
  punchListInProgress: number;
  punchListClosed: number;
  punchListCritical: number;
  sitesReadyForHandover: number;
  sitesAwaitingHandover: number;
  handoverProgress: number;
}

export interface UseHandoverDataResult {
  data: HandoverData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useHandoverData(): UseHandoverDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<HandoverData | null>(null);
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

      // Get PM700 (Handover) milestone progress
      const pm700Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM700'))
        .fetch();

      let pm700Progress = 0;
      let pm700Status: 'not_started' | 'in_progress' | 'completed' = 'not_started';

      if (pm700Milestone.length > 0) {
        const milestoneId = pm700Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm700Progress = Math.round(totalProgress / progressRecords.length);

          if (pm700Progress === 0) {
            pm700Status = 'not_started';
          } else if (pm700Progress < 100) {
            pm700Status = 'in_progress';
          } else {
            pm700Status = 'completed';
          }
        }
      }

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();
      const siteIds = sites.map(s => s.id);

      // Get documentation data
      let totalDocuments = 0;
      let documentsApproved = 0;
      let documentsUnderReview = 0;
      let documentsPending = 0;

      try {
        const documents = await database.collections
          .get('documents')
          .query(Q.where('project_id', projectId))
          .fetch();

        totalDocuments = documents.length;

        documents.forEach((doc: any) => {
          if (doc.status === 'approved') {
            documentsApproved++;
          } else if (doc.status === 'under_review') {
            documentsUnderReview++;
          } else {
            documentsPending++;
          }
        });
      } catch (err) {
        // Documents table may not exist
        logger.warn('[useHandoverData] Documents table not available', err as Error);
      }

      const documentationProgress = totalDocuments > 0
        ? Math.round((documentsApproved / totalDocuments) * 100)
        : 0;

      // Get punch list items
      let totalPunchListItems = 0;
      let punchListOpen = 0;
      let punchListInProgress = 0;
      let punchListClosed = 0;
      let punchListCritical = 0;

      if (siteIds.length > 0) {
        try {
          const punchListItems = await database.collections
            .get('punch_list_items')
            .query(Q.where('site_id', Q.oneOf(siteIds)))
            .fetch();

          totalPunchListItems = punchListItems.length;

          punchListItems.forEach((item: any) => {
            if (item.status === 'open') {
              punchListOpen++;
            } else if (item.status === 'in_progress') {
              punchListInProgress++;
            } else if (item.status === 'closed') {
              punchListClosed++;
            }

            if (item.priority === 'critical' && item.status !== 'closed') {
              punchListCritical++;
            }
          });
        } catch (err) {
          // Punch list table may not exist
          logger.warn('[useHandoverData] Punch list table not available', err as Error);
        }
      }

      // Calculate sites ready for handover
      // A site is ready when PM700 is complete (>= 95%) and no critical punch list items
      let sitesReadyForHandover = 0;
      let sitesAwaitingHandover = 0;

      for (const site of sites) {
        const siteId = site.id;

        // Check site's PM700 progress
        const siteProgressRecords = await database.collections
          .get('milestone_progress')
          .query(
            Q.where('site_id', siteId),
            Q.where('milestone_id', pm700Milestone[0]?.id || '')
          )
          .fetch();

        let siteHandoverProgress = 0;
        if (siteProgressRecords.length > 0) {
          siteHandoverProgress = (siteProgressRecords[0] as any).progressPercentage || 0;
        }

        // Check for critical punch list items
        let hasCriticalPunchItems = false;
        try {
          const sitePunchItems = await database.collections
            .get('punch_list_items')
            .query(
              Q.where('site_id', siteId),
              Q.where('priority', 'critical'),
              Q.where('status', Q.notEq('closed'))
            )
            .fetch();
          hasCriticalPunchItems = sitePunchItems.length > 0;
        } catch (err) {
          // Table may not exist
        }

        if (siteHandoverProgress >= 95 && !hasCriticalPunchItems) {
          sitesReadyForHandover++;
        } else if (siteHandoverProgress > 0) {
          sitesAwaitingHandover++;
        }
      }

      // Overall handover progress
      const handoverProgress = Math.round(
        (pm700Progress * 0.4) +
        (documentationProgress * 0.3) +
        (totalPunchListItems > 0
          ? ((punchListClosed / totalPunchListItems) * 100 * 0.3)
          : pm700Progress * 0.3)
      );

      setData({
        pm700Progress,
        pm700Status,
        totalDocuments,
        documentsApproved,
        documentsUnderReview,
        documentsPending,
        documentationProgress,
        totalPunchListItems,
        punchListOpen,
        punchListInProgress,
        punchListClosed,
        punchListCritical,
        sitesReadyForHandover,
        sitesAwaitingHandover,
        handoverProgress,
      });
    } catch (err) {
      logger.error('[useHandoverData] Error fetching data', err as Error);
      setError('Failed to load handover data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useHandoverData;
