/**
 * useWBSProgressData Hook
 *
 * Fetches and manages Work Breakdown Structure (WBS) progress data for the dashboard widget.
 * Groups items by project phase and calculates progress metrics.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
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
 * Groups items by project phase in the standard phase order and calculates
 * progress metrics for each phase including item counts by status.
 *
 * @returns {UseWBSProgressResult} WBS phase data, summary, loading state, error, and refresh function
 */
export function useWBSProgressData(): UseWBSProgressResult {
  const { projectId, sites } = usePlanningContext();
  const [phases, setPhases] = useState<WBSPhase[]>([]);
  const [summary, setSummary] = useState<WBSSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setPhases([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setPhases([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      // Query all items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const allItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Group items by project phase
      const phaseGroups = new Map<string, ItemModel[]>();
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

      setPhases(transformedPhases);
      setSummary({
        totalPhases: transformedPhases.length,
        totalItems,
        completedItems,
        overallProgress,
      });
    } catch (err) {
      console.error('Error loading WBS progress:', err);
      setError('Failed to load WBS data');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { phases, summary, loading, error, refresh: fetchData };
}
