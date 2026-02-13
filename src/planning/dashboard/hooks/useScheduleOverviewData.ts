/**
 * useScheduleOverviewData Hook
 *
 * Computes schedule overview metrics from cached items in PlanningContext.
 * No individual DB queries — processes allItems in-memory.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import type { ScheduleOverview } from '../widgets/ScheduleOverviewWidget';

// ==================== Types ====================

interface UseScheduleOverviewResult {
  overview: ScheduleOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching schedule overview
 *
 * Computes overall project metrics from the shared dashboard cache including
 * progress, status counts, and timeline information.
 */
export function useScheduleOverviewData(): UseScheduleOverviewResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const overview = useMemo(() => {
    if (!dashboardCache.dataReady) return null;

    const { allItems } = dashboardCache;
    if (allItems.length === 0) return null;

    const totalItems = allItems.length;
    const completedItems = allItems.filter((i) => i.status === 'completed').length;
    const delayedItems = allItems.filter((i) => i.status === 'delayed').length;
    const onTrackItems = allItems.filter(
      (i) => i.status === 'in_progress' || i.status === 'not_started'
    ).length;

    const totalProgress = allItems.reduce((sum, item) => sum + item.getProgressPercentage(), 0);
    const overallProgress = Math.round(totalProgress / totalItems);

    const startDates = allItems.map((i) => i.plannedStartDate).filter(Boolean);
    const endDates = allItems.map((i) => i.plannedEndDate).filter(Boolean);

    const projectStartDate = startDates.length > 0
      ? new Date(Math.min(...startDates))
      : new Date();
    const projectEndDate = endDates.length > 0
      ? new Date(Math.max(...endDates))
      : new Date(Date.now() + 180 * 86400000);

    const daysRemaining = Math.max(0, Math.ceil((projectEndDate.getTime() - Date.now()) / 86400000));

    return {
      totalItems,
      completedItems,
      onTrackItems,
      delayedItems,
      overallProgress,
      projectStartDate,
      projectEndDate,
      daysRemaining,
    };
  }, [dashboardCache]);

  return {
    overview,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
