/**
 * useScheduleOverviewData Hook
 *
 * Fetches and manages schedule overview data for the dashboard widget.
 * Calculates overall project metrics and progress statistics.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
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
 * Queries all items for the assigned project's sites and calculates
 * overall project metrics including progress, status counts, and timeline.
 *
 * @returns {UseScheduleOverviewResult} Schedule overview data, loading state, error, and refresh function
 */
export function useScheduleOverviewData(): UseScheduleOverviewResult {
  const { projectId, sites } = usePlanningContext();
  const [overview, setOverview] = useState<ScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setOverview(null);
        setLoading(false);
        return;
      }

      // Query all items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const allItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      if (allItems.length === 0) {
        setOverview(null);
        setLoading(false);
        return;
      }

      // Calculate metrics
      const totalItems = allItems.length;
      const completedItems = allItems.filter((i) => i.status === 'completed').length;
      const delayedItems = allItems.filter((i) => i.status === 'delayed').length;
      const onTrackItems = allItems.filter(
        (i) => i.status === 'in_progress' || i.status === 'not_started'
      ).length;

      // Calculate overall progress (weighted by item progress)
      const totalProgress = allItems.reduce((sum, item) => sum + item.getProgressPercentage(), 0);
      const overallProgress = Math.round(totalProgress / totalItems);

      // Get project date range from items
      const startDates = allItems.map((i) => i.plannedStartDate).filter(Boolean);
      const endDates = allItems.map((i) => i.plannedEndDate).filter(Boolean);

      const projectStartDate = startDates.length > 0
        ? new Date(Math.min(...startDates))
        : new Date();
      const projectEndDate = endDates.length > 0
        ? new Date(Math.max(...endDates))
        : new Date(Date.now() + 180 * 86400000);

      const daysRemaining = Math.max(0, Math.ceil((projectEndDate.getTime() - Date.now()) / 86400000));

      setOverview({
        totalItems,
        completedItems,
        onTrackItems,
        delayedItems,
        overallProgress,
        projectStartDate,
        projectEndDate,
        daysRemaining,
      });
    } catch (err) {
      console.error('Error loading schedule overview:', err);
      setError('Failed to load schedule overview');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, loading, error, refresh: fetchData };
}
