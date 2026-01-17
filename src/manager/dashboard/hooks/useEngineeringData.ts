/**
 * useEngineeringData Hook
 *
 * Fetches engineering progress data including PM200 milestone,
 * DOORS packages, requirements compliance, and RFQ status.
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

export interface EngineeringData {
  pm200Progress: number;
  pm200Status: 'not_started' | 'in_progress' | 'completed';
  totalDoors: number;
  doorsApproved: number;
  doorsUnderReview: number;
  doorsOpenIssues: number;
  totalRequirements: number;
  compliantRequirements: number;
  compliancePercentage: number;
  totalRfqs: number;
  rfqsQuotesReceived: number;
  rfqsUnderEvaluation: number;
  rfqsAwarded: number;
}

export interface UseEngineeringDataResult {
  data: EngineeringData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useEngineeringData(): UseEngineeringDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<EngineeringData | null>(null);
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

      // Get PM200 milestone progress
      const pm200Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM200'))
        .fetch();

      let pm200Progress = 0;
      let pm200Status: 'not_started' | 'in_progress' | 'completed' = 'not_started';

      if (pm200Milestone.length > 0) {
        const milestoneId = pm200Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm200Progress = Math.round(totalProgress / progressRecords.length);

          if (pm200Progress === 0) {
            pm200Status = 'not_started';
          } else if (pm200Progress < 100) {
            pm200Status = 'in_progress';
          } else {
            pm200Status = 'completed';
          }
        }
      }

      // Get DOORS packages data
      const doorsPackages = await database.collections.get('doors_packages').query().fetch();
      const totalDoors = doorsPackages.length;

      let doorsApproved = 0;
      let doorsUnderReview = 0;
      let doorsOpenIssues = 0;

      doorsPackages.forEach((pkg: any) => {
        if (pkg.status === 'approved') {
          doorsApproved++;
        } else if (pkg.status === 'under_review') {
          doorsUnderReview++;
        } else if (pkg.status === 'open_issues') {
          doorsOpenIssues++;
        }
      });

      // Get requirements data
      const allRequirements = await database.collections
        .get('doors_requirements')
        .query()
        .fetch();
      const totalRequirements = allRequirements.length;
      const compliantRequirements = allRequirements.filter(
        (req: any) => req.complianceStatus === 'compliant'
      ).length;
      const compliancePercentage = totalRequirements > 0
        ? Math.round((compliantRequirements / totalRequirements) * 100)
        : 0;

      // Get RFQ data
      const allRfqs = await database.collections.get('rfqs').query().fetch();
      const totalRfqs = allRfqs.length;

      let rfqsQuotesReceived = 0;
      let rfqsUnderEvaluation = 0;
      let rfqsAwarded = 0;

      allRfqs.forEach((rfq: any) => {
        if (rfq.status === 'quotes_received') {
          rfqsQuotesReceived++;
        } else if (rfq.status === 'evaluated') {
          rfqsUnderEvaluation++;
        } else if (rfq.status === 'awarded') {
          rfqsAwarded++;
        }
      });

      setData({
        pm200Progress,
        pm200Status,
        totalDoors,
        doorsApproved,
        doorsUnderReview,
        doorsOpenIssues,
        totalRequirements,
        compliantRequirements,
        compliancePercentage,
        totalRfqs,
        rfqsQuotesReceived,
        rfqsUnderEvaluation,
        rfqsAwarded,
      });
    } catch (err) {
      logger.error('[useEngineeringData] Error fetching data', err as Error);
      setError('Failed to load engineering data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useEngineeringData;
