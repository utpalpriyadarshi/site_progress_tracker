/**
 * useCriticalPathData Hook
 *
 * Computes critical path items from cached items in PlanningContext.
 * No individual DB queries — filters allItems in-memory.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import type { CriticalPathItem } from '../widgets/CriticalPathWidget';

// ==================== Types ====================

interface UseCriticalPathResult {
  items: CriticalPathItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching critical path items
 *
 * Filters items marked as critical path from the shared dashboard cache.
 * Calculates risk levels based on delays, due dates, and float days.
 */
export function useCriticalPathData(): UseCriticalPathResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const items = useMemo(() => {
    if (!dashboardCache.dataReady) return [];

    const { allItems } = dashboardCache;
    const now = Date.now();

    return allItems
      .filter((item) => item.isCriticalPath && item.status !== 'completed')
      .sort((a, b) => a.plannedEndDate - b.plannedEndDate)
      .map((item) => {
        const daysUntilDue = Math.ceil((item.plannedEndDate - now) / 86400000);
        const isDelayed = item.status === 'delayed' || daysUntilDue < 0;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (isDelayed || daysUntilDue < 0) {
          riskLevel = 'high';
        } else if (daysUntilDue < 7 || (item.floatDays !== undefined && item.floatDays < 3)) {
          riskLevel = 'medium';
        }

        return {
          id: item.id,
          name: item.name,
          riskLevel,
          delayImpact: isDelayed ? Math.abs(daysUntilDue) : 0,
          progress: item.getProgressPercentage(),
          dueDate: new Date(item.plannedEndDate),
        };
      });
  }, [dashboardCache]);

  return {
    items,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
