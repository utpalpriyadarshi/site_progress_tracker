/**
 * useWBSProgressData Hook
 *
 * Computes Work Breakdown Structure progress from cached items in PlanningContext.
 * No individual DB queries — processes allItems in-memory.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import { PHASE_ORDER, PHASE_LABELS } from '../../utils/phaseConstants';
import type { WBSPhase, WBSSummary } from '../widgets/WBSProgressWidget';

// ==================== Types ====================

interface UseWBSProgressResult {
  phases: WBSPhase[];
  summary: WBSSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching WBS progress data
 *
 * Groups items by project phase from the shared dashboard cache in standard
 * phase order and calculates progress metrics for each phase.
 */
export function useWBSProgressData(): UseWBSProgressResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const result = useMemo(() => {
    if (!dashboardCache.dataReady) {
      return { phases: [] as WBSPhase[], summary: null as WBSSummary | null };
    }

    const { allItems } = dashboardCache;

    if (allItems.length === 0) {
      return { phases: [] as WBSPhase[], summary: null as WBSSummary | null };
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

    // Transform to WBSPhase type
    const transformedPhases: WBSPhase[] = PHASE_ORDER
      .filter((phase) => phaseGroups.has(phase))
      .map((phase) => {
        const items = phaseGroups.get(phase)!;
        return {
          id: phase,
          name: PHASE_LABELS[phase] || phase,
          totalItems: items.length,
          completedItems: items.filter((i) => i.status === 'completed').length,
          inProgressItems: items.filter((i) => i.status === 'in_progress').length,
          notStartedItems: items.filter((i) => i.status === 'not_started').length,
        };
      });

    // Add 'other' phase if it exists
    if (phaseGroups.has('other')) {
      const items = phaseGroups.get('other')!;
      transformedPhases.push({
        id: 'other',
        name: PHASE_LABELS['other'],
        totalItems: items.length,
        completedItems: items.filter((i) => i.status === 'completed').length,
        inProgressItems: items.filter((i) => i.status === 'in_progress').length,
        notStartedItems: items.filter((i) => i.status === 'not_started').length,
      });
    }

    // Calculate summary
    const totalItems = allItems.length;
    const completedItems = allItems.filter((i) => i.status === 'completed').length;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      phases: transformedPhases,
      summary: {
        totalPhases: transformedPhases.length,
        totalItems,
        completedItems,
        overallProgress,
      } as WBSSummary,
    };
  }, [dashboardCache]);

  return {
    ...result,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
