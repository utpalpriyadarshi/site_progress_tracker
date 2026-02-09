/**
 * useUpcomingMilestonesData Hook
 *
 * Fetches and manages upcoming milestones data for the dashboard widget.
 * Queries items marked as milestones and transforms them for display.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
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
 * Queries items marked as milestones for the assigned project's sites.
 * Filters out completed milestones and limits to top 5 upcoming.
 *
 * @returns {UseMilestonesResult} Milestones data, loading state, error, and refresh function
 */
export function useUpcomingMilestonesData(): UseMilestonesResult {
  const { projectId, sites } = usePlanningContext();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // Query items marked as milestones for project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const milestoneItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_milestone', true),
          Q.sortBy('planned_end_date', Q.asc)
        )
        .fetch();

      // Transform to Milestone type - only upcoming (not completed)
      const now = Date.now();
      const transformedMilestones: Milestone[] = milestoneItems
        .filter((item) => item.status !== 'completed')
        .slice(0, 5) // Limit to 5
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

      setMilestones(transformedMilestones);
    } catch (err) {
      console.error('Error loading milestones:', err);
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { milestones, loading, error, refresh: fetchData };
}
