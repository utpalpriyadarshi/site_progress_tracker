import { useReducer, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';
import {
  dashboardReducer,
  initialDashboardState,
  startLoad,
  finishLoad,
  startRefresh as startRefreshAction,
  finishRefresh as finishRefreshAction,
  setStats as setStatsAction,
  setProjectInfo as setProjectInfoAction,
} from '../state';

// Re-export types for backward compatibility
export type { ProjectStats, ProjectInfo } from '../state';

export const useDashboardData = (projectId: string | null) => {
  // Replace 4 useState hooks with single useReducer
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const loadProjectInfo = useCallback(async () => {
    if (!projectId) return;

    try {
      const project = await database.collections.get('projects').find(projectId);
      dispatch(setProjectInfoAction({
        name: (project as any).name,
        startDate: (project as any).startDate,
        endDate: (project as any).endDate,
        status: (project as any).status,
        client: (project as any).client,
        budget: (project as any).budget,
      }));
    } catch (error) {
      logger.error('[useDashboardData] Error loading project info', error as Error);
    }
  }, [projectId]);

  const calculateHybridProgress = useCallback(async (): Promise<number> => {
    if (!projectId) return 0;

    try {
      // Get all sites
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      if (sites.length === 0) return 0;

      let totalItemsProgress = 0;
      let totalMilestonesProgress = 0;

      // Calculate for each site
      for (const site of sites) {
        // Items progress (0-100 for this site)
        const items = await database.collections
          .get('items')
          .query(Q.where('site_id', site.id))
          .fetch();

        if (items.length > 0) {
          const completedItems = items.filter(
            (item: any) => item.completedQuantity >= item.plannedQuantity
          ).length;
          const itemsProgress = (completedItems / items.length) * 100;
          totalItemsProgress += itemsProgress;
        }

        // Milestones progress (0-100 for this site)
        const milestones = await database.collections
          .get('site_milestones')
          .query(Q.where('site_id', site.id))
          .fetch();

        if (milestones.length > 0) {
          const completedMilestones = milestones.filter(
            (m: any) => m.isCompleted || m.actualCompletionPercentage >= 100
          ).length;
          const milestonesProgress = (completedMilestones / milestones.length) * 100;
          totalMilestonesProgress += milestonesProgress;
        }
      }

      // Average across sites
      const avgItemsProgress = totalItemsProgress / sites.length;
      const avgMilestonesProgress = totalMilestonesProgress / sites.length;

      // Hybrid: 60% items + 40% milestones
      return avgItemsProgress * 0.6 + avgMilestonesProgress * 0.4;
    } catch (error) {
      logger.error('[useDashboardData] Error calculating hybrid progress', error as Error);
      return 0;
    }
  }, [projectId]);

  const calculateBudgetUtilization = useCallback(async (): Promise<number> => {
    if (!projectId) return 0;

    try {
      const project = await database.collections.get('projects').find(projectId);
      const projectBudget = (project as any).budget || 0;

      if (projectBudget === 0) return 0;

      // Get all BOMs for this project
      const boms = await database.collections
        .get('boms')
        .query(Q.where('project_id', projectId))
        .fetch();

      let totalSpent = 0;
      for (const bom of boms) {
        const bomItems = await database.collections
          .get('bom_items')
          .query(Q.where('bom_id', bom.id))
          .fetch();

        bomItems.forEach((item: any) => {
          totalSpent += (item.unitCost || 0) * (item.quantity || 0);
        });
      }

      return (totalSpent / projectBudget) * 100;
    } catch (error) {
      logger.error('[useDashboardData] Error calculating budget utilization', error as Error);
      return 0;
    }
  }, [projectId]);

  const calculateStats = useCallback(async () => {
    if (!projectId) return;

    try {
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalSites = sites.length;
      const now = Date.now();
      const sitesOnSchedule = sites.filter((s) => {
        return (s as any).targetDate && (s as any).targetDate >= now;
      }).length;
      const sitesDelayed = totalSites - sitesOnSchedule;

      const overallCompletion = await calculateHybridProgress();
      const siteIds = sites.map((s) => s.id);

      // Open hindrances
      const hindrances = await database.collections
        .get('hindrances')
        .query(Q.where('site_id', Q.oneOf(siteIds)), Q.where('status', 'open'))
        .fetch();

      // Critical path items at risk
      const items = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const criticalPathItemsAtRisk = items.filter((item: any) => {
        return (
          item.isCriticalPath &&
          item.completedQuantity < item.plannedQuantity &&
          item.plannedEndDate < now
        );
      }).length;

      // Upcoming milestones (next 30 days)
      const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
      const upcomingMilestones = await database.collections
        .get('site_milestones')
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('target_date', Q.between(now, thirtyDaysFromNow)),
          Q.where('is_completed', false)
        )
        .fetch();

      const budgetUtilization = await calculateBudgetUtilization();

      dispatch(setStatsAction({
        overallCompletion,
        sitesOnSchedule,
        sitesDelayed,
        totalSites,
        budgetUtilization,
        openHindrances: hindrances.length,
        pendingApprovals: 0, // TODO: Implement approvals logic
        deliveryOnTrack: 0, // TODO: Implement delivery tracking
        deliveryDelayed: 0,
        criticalPathItemsAtRisk,
        upcomingMilestones: upcomingMilestones.length,
        activeSupervisors: sites.length, // Simplified: 1 supervisor per site
      }));
    } catch (error) {
      logger.error('[useDashboardData] Error calculating stats', error as Error);
    }
  }, [projectId, calculateHybridProgress, calculateBudgetUtilization]);

  const loadDashboardData = useCallback(async () => {
    try {
      dispatch(startLoad());
      await Promise.all([loadProjectInfo(), calculateStats()]);
    } catch (error) {
      logger.error('[useDashboardData] Error loading data', error as Error);
    } finally {
      dispatch(finishLoad());
    }
  }, [loadProjectInfo, calculateStats]);

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
    } else {
      dispatch(finishLoad());
    }
  }, [projectId, loadDashboardData]);

  const onRefresh = useCallback(async () => {
    dispatch(startRefreshAction());
    await loadDashboardData();
    dispatch(finishRefreshAction());
  }, [loadDashboardData]);

  // Return interface - map from nested state to flat interface (no breaking changes!)
  return {
    loading: state.loading.initial,
    refreshing: state.loading.refreshing,
    stats: state.data.stats,
    projectInfo: state.data.projectInfo,
    onRefresh,
  };
};
