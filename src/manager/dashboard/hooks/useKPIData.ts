/**
 * useKPIData Hook
 *
 * Fetches KPI metrics for the manager's assigned project.
 * Calculates overall completion, site status, budget utilization, and more.
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

export interface KPIData {
  overallCompletion: number;
  sitesOnSchedule: number;
  sitesDelayed: number;
  totalSites: number;
  budgetUtilization: number;
  openHindrances: number;
  pendingApprovals: number;
  deliveryOnTrack: number;
  deliveryDelayed: number;
  criticalPathItemsAtRisk: number;
  upcomingMilestones: number;
  activeSupervisors: number;
  projectBudget: number;
}

export interface UseKPIDataResult {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useKPIData(): UseKPIDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<KPIData | null>(null);
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

      // Get project info for budget
      const project = await database.collections.get('projects').find(projectId);
      const projectBudget = (project as any)?.budget || 0;

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalSites = sites.length;
      const siteIds = sites.map(s => s.id);

      if (totalSites === 0) {
        setData({
          overallCompletion: 0,
          sitesOnSchedule: 0,
          sitesDelayed: 0,
          totalSites: 0,
          budgetUtilization: 0,
          openHindrances: 0,
          pendingApprovals: 0,
          deliveryOnTrack: 0,
          deliveryDelayed: 0,
          criticalPathItemsAtRisk: 0,
          upcomingMilestones: 0,
          activeSupervisors: 0,
          projectBudget,
        });
        return;
      }

      // Calculate site schedule status
      const now = Date.now();
      const sitesOnSchedule = sites.filter((s: any) => {
        return s.targetDate && s.targetDate >= now;
      }).length;
      const sitesDelayed = totalSites - sitesOnSchedule;

      // Get all items for these sites
      const items = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Calculate weighted items progress
      const totalWeightage = items.reduce((sum, item: any) => sum + (item.weightage || 1), 0);
      const weightedProgress = items.reduce((sum, item: any) => {
        const weightage = item.weightage || 1;
        const progress = item.getProgressPercentage ? item.getProgressPercentage() : 0;
        return sum + (weightage * progress);
      }, 0);
      const itemsProgress = totalWeightage > 0 ? (weightedProgress / totalWeightage) : 0;

      // Get milestones progress
      const milestones = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('is_active', true))
        .fetch();

      let milestonesProgress = 0;
      if (milestones.length > 0) {
        const totalMilestoneWeight = milestones.reduce((sum, m: any) => sum + (m.weightage || 0), 0);
        const milestoneProgressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('project_id', projectId))
          .fetch();

        const milestoneProgressMap = new Map<string, number[]>();
        milestoneProgressRecords.forEach((mp: any) => {
          if (!milestoneProgressMap.has(mp.milestoneId)) {
            milestoneProgressMap.set(mp.milestoneId, []);
          }
          milestoneProgressMap.get(mp.milestoneId)!.push(mp.progressPercentage || 0);
        });

        const weightedMilestoneProgress = milestones.reduce((sum, milestone: any) => {
          const progressArray = milestoneProgressMap.get(milestone.id) || [0];
          const avgProgress = progressArray.reduce((a, b) => a + b, 0) / progressArray.length;
          return sum + (milestone.weightage * avgProgress);
        }, 0);

        milestonesProgress = totalMilestoneWeight > 0 ? weightedMilestoneProgress / totalMilestoneWeight : 0;
      }

      // Hybrid calculation: 60% items + 40% milestones
      const overallCompletion = milestones.length > 0
        ? Math.round((itemsProgress * 0.6 + milestonesProgress * 0.4) * 10) / 10
        : Math.round(itemsProgress * 10) / 10;

      // Get open hindrances
      const hindrances = await database.collections
        .get('hindrances')
        .query(Q.where('site_id', Q.oneOf(siteIds)), Q.where('status', 'open'))
        .fetch();
      const openHindrances = hindrances.length;

      // Get critical path items at risk
      const criticalPathItemsAtRisk = items.filter((item: any) => {
        return item.isCriticalPath && (item.dependencyRisk === 'high' || item.dependencyRisk === 'medium');
      }).length;

      // Get purchase orders for delivery status
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const deliveryOnTrack = purchaseOrders.filter((po: any) => {
        if (!po.expectedDeliveryDate) return true;
        if (po.actualDeliveryDate) return true;
        return po.expectedDeliveryDate >= Date.now();
      }).length;
      const deliveryDelayed = purchaseOrders.length - deliveryOnTrack;

      // Get upcoming milestones (next 30 days)
      const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const milestoneProgressRecords = await database.collections
        .get('milestone_progress')
        .query(
          Q.where('project_id', projectId),
          Q.where('status', Q.oneOf(['not_started', 'in_progress']))
        )
        .fetch();

      const upcomingMilestones = milestoneProgressRecords.filter((mp: any) => {
        return mp.plannedEndDate && mp.plannedEndDate <= thirtyDaysFromNow && mp.plannedEndDate >= Date.now();
      }).length;

      // Calculate budget utilization
      const totalSpent = purchaseOrders.reduce((sum, po: any) => sum + (po.poValue || 0), 0);
      const budgetUtilization = projectBudget > 0 ? Math.round((totalSpent / projectBudget) * 1000) / 10 : 0;

      // Get active supervisors
      let activeSupervisors = 0;
      try {
        const supervisorRoles = await database.collections
          .get('roles')
          .query(Q.where('name', 'Supervisor'))
          .fetch();

        if (supervisorRoles.length > 0) {
          const supervisors = await database.collections
            .get('users')
            .query(
              Q.where('project_id', projectId),
              Q.where('role_id', supervisorRoles[0].id)
            )
            .fetch();
          activeSupervisors = supervisors.length;
        }
      } catch (err) {
        logger.warn('[useKPIData] Error fetching supervisors', err as Error);
      }

      setData({
        overallCompletion,
        sitesOnSchedule,
        sitesDelayed,
        totalSites,
        budgetUtilization,
        openHindrances,
        pendingApprovals: 0, // Future implementation
        deliveryOnTrack,
        deliveryDelayed,
        criticalPathItemsAtRisk,
        upcomingMilestones,
        activeSupervisors,
        projectBudget,
      });
    } catch (err) {
      logger.error('[useKPIData] Error fetching KPI data', err as Error);
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useKPIData;
