/**
 * useUpcomingMilestonesData Hook
 *
 * Computes upcoming milestones from cached items in PlanningContext.
 * No individual DB queries — filters allItems in-memory.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import type { Milestone } from '../widgets/UpcomingMilestonesWidget';

// ==================== Types ====================

interface UseMilestonesResult {
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching upcoming milestones
 *
 * Filters items marked as milestones from the shared dashboard cache.
 * Excludes completed milestones and limits to top 5 upcoming.
 */
export function useUpcomingMilestonesData(): UseMilestonesResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const milestones = useMemo(() => {
    if (!dashboardCache.dataReady) return [];

    const { allItems } = dashboardCache;
    const now = Date.now();

    return allItems
      .filter((item) => item.isMilestone && item.status !== 'completed')
      .sort((a, b) => a.plannedEndDate - b.plannedEndDate)
      .slice(0, 5)
      .map((item) => {
        const daysRemaining = Math.ceil((item.plannedEndDate - now) / 86400000);
        return {
          id: item.id,
          name: item.name,
          dueDate: new Date(item.plannedEndDate),
          status: item.status as 'planned' | 'in_progress' | 'completed' | 'delayed',
          daysRemaining: Math.max(0, daysRemaining),
        };
      });
  }, [dashboardCache]);

  return {
    milestones,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
