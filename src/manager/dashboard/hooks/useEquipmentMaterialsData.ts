/**
 * useEquipmentMaterialsData Hook
 *
 * Fetches equipment and materials data including PM300/PM400 progress,
 * purchase orders, and delivery status.
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

export interface EquipmentMaterialsData {
  pm300Progress: number;
  pm300Status: 'not_started' | 'in_progress' | 'completed';
  pm400Progress: number;
  pm400Status: 'not_started' | 'in_progress' | 'completed';
  totalPOs: number;
  posDraft: number;
  posIssued: number;
  posInProgress: number;
  posDelivered: number;
  posClosed: number;
  totalPOValue: number;
  upcomingDeliveries: number;
  delayedDeliveries: number;
}

export interface UseEquipmentMaterialsDataResult {
  data: EquipmentMaterialsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useEquipmentMaterialsData(): UseEquipmentMaterialsDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<EquipmentMaterialsData | null>(null);
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

      // Get PM300 (Procurement) milestone progress
      const pm300 = await getMilestoneProgress('PM300');

      // Get PM400 (Manufacturing) milestone progress
      const pm400 = await getMilestoneProgress('PM400');

      // Get Purchase Orders data
      const allPOs = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalPOs = allPOs.length;
      let posDraft = 0;
      let posIssued = 0;
      let posInProgress = 0;
      let posDelivered = 0;
      let posClosed = 0;
      let totalPOValue = 0;

      allPOs.forEach((po: any) => {
        totalPOValue += po.poValue || 0;

        switch (po.status) {
          case 'draft':
            posDraft++;
            break;
          case 'issued':
            posIssued++;
            break;
          case 'in_progress':
            posInProgress++;
            break;
          case 'delivered':
            posDelivered++;
            break;
          case 'closed':
            posClosed++;
            break;
        }
      });

      // Calculate delivery metrics
      const now = Date.now();
      const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

      let upcomingDeliveries = 0;
      let delayedDeliveries = 0;

      allPOs.forEach((po: any) => {
        const expectedDelivery = po.expectedDeliveryDate;
        const actualDelivery = po.actualDeliveryDate;

        // Upcoming deliveries (next 30 days)
        if (expectedDelivery && expectedDelivery >= now && expectedDelivery <= thirtyDaysFromNow) {
          if (!actualDelivery) {
            upcomingDeliveries++;
          }
        }

        // Delayed deliveries
        if (expectedDelivery && expectedDelivery < now && !actualDelivery) {
          delayedDeliveries++;
        }
      });

      setData({
        pm300Progress: pm300.progress,
        pm300Status: pm300.status,
        pm400Progress: pm400.progress,
        pm400Status: pm400.status,
        totalPOs,
        posDraft,
        posIssued,
        posInProgress,
        posDelivered,
        posClosed,
        totalPOValue,
        upcomingDeliveries,
        delayedDeliveries,
      });
    } catch (err) {
      logger.error('[useEquipmentMaterialsData] Error fetching data', err as Error);
      setError('Failed to load equipment/materials data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useEquipmentMaterialsData;
