/**
 * useRecentActivitiesData Hook
 *
 * Fetches and manages recent activities data for the dashboard widget.
 * Queries recent progress logs and transforms them for activity display.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import ProgressLogModel from '../../../../models/ProgressLogModel';
import { usePlanningContext } from '../../context';
import type { Activity } from '../widgets/RecentActivitiesWidget';

// ==================== Types ====================

interface UseRecentActivitiesResult {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching recent activities
 *
 * Queries progress logs for the assigned project's items and transforms
 * them into activity records for display in the recent activities widget.
 *
 * @returns {UseRecentActivitiesResult} Activities data, loading state, error, and refresh function
 */
export function useRecentActivitiesData(): UseRecentActivitiesResult {
  const { projectId, sites } = usePlanningContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Get items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const projectItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const itemIds = projectItems.map((i) => i.id);

      if (itemIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Query recent progress logs
      const logsCollection = database.collections.get<ProgressLogModel>('progress_logs');
      const recentLogs = await logsCollection
        .query(
          Q.where('item_id', Q.oneOf(itemIds)),
          Q.sortBy('date', Q.desc),
          Q.take(10)
        )
        .fetch();

      // Create a map of item IDs to names
      const itemNameMap = new Map(projectItems.map((i) => [i.id, i.name]));

      // Transform to Activity type
      const transformedActivities: Activity[] = recentLogs.slice(0, 5).map((log) => ({
        id: log.id,
        type: 'updated' as const,
        itemName: itemNameMap.get(log.itemId) || 'Unknown Item',
        itemType: 'schedule' as const,
        timestamp: new Date(log.date),
      }));

      setActivities(transformedActivities);
    } catch (err) {
      console.error('Error loading recent activities:', err);
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { activities, loading, error, refresh: fetchData };
}
