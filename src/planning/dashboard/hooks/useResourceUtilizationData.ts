/**
 * useResourceUtilizationData Hook
 *
 * Computes resource utilization metrics from cached items in PlanningContext.
 * No individual DB queries — processes allItems in-memory.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import { PHASE_RESOURCE_LABELS } from '../../utils/phaseConstants';
import type { Resource, ResourceSummary } from '../widgets/ResourceUtilizationWidget';

// ==================== Types ====================

interface UseResourceUtilizationResult {
  resources: Resource[];
  summary: ResourceSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching resource utilization data
 *
 * Groups items by project phase from the shared dashboard cache and
 * calculates utilization metrics. Treats phases as "resources".
 */
export function useResourceUtilizationData(): UseResourceUtilizationResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const result = useMemo(() => {
    if (!dashboardCache.dataReady) {
      return { resources: [] as Resource[], summary: null as ResourceSummary | null };
    }

    const { allItems } = dashboardCache;

    if (allItems.length === 0) {
      return { resources: [] as Resource[], summary: null as ResourceSummary | null };
    }

    // Group items by project phase
    const phaseGroups = new Map<string, typeof allItems>();
    allItems.forEach((item) => {
      const phase = item.projectPhase || 'other';
      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, []);
      }
      phaseGroups.get(phase)!.push(item);
    });

    const transformedResources: Resource[] = [];
    let overAllocated = 0;
    let optimallyAllocated = 0;
    let underAllocated = 0;

    phaseGroups.forEach((items, phase) => {
      const totalItems = items.length;
      const inProgress = items.filter((i) => i.status === 'in_progress').length;
      const completed = items.filter((i) => i.status === 'completed').length;

      const utilization = totalItems > 0 ? Math.round((inProgress / totalItems) * 100) : 0;
      const allocated = totalItems > 0 ? Math.round(((inProgress + completed) / totalItems) * 100) : 0;

      if (allocated > 90) {
        overAllocated++;
      } else if (allocated > 50) {
        optimallyAllocated++;
      } else {
        underAllocated++;
      }

      transformedResources.push({
        id: phase,
        name: PHASE_RESOURCE_LABELS[phase] || phase,
        type: 'labor',
        allocated,
        available: 100,
        utilized: utilization,
      });
    });

    return {
      resources: transformedResources,
      summary: {
        totalResources: phaseGroups.size,
        overAllocated,
        optimallyAllocated,
        underAllocated,
      } as ResourceSummary,
    };
  }, [dashboardCache]);

  return {
    ...result,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
