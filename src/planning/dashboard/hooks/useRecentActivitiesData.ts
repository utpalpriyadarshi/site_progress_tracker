/**
 * useRecentActivitiesData Hook
 *
 * Fetches recent activities using item IDs from the shared dashboard cache.
 * Still queries progress_logs directly (unique to this hook), but uses
 * cached allItems for item ID resolution instead of a separate items query.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useMemo } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
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
 * Uses cached allItems from PlanningContext for item IDs and names,
 * then queries progress_logs (1 query — the only DB query this hook makes).
 */
export function useRecentActivitiesData(): UseRecentActivitiesResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();
  const { allItems, dataReady } = dashboardCache;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stable key: join IDs into a string so the effect only re-runs when the
  // actual set of item IDs changes, not on every new array reference.
  const itemIds = useMemo(() => allItems.map(i => i.id), [allItems]);
  const itemIdsKey = useMemo(() => itemIds.join(','), [itemIds]);
  const itemNameMap = useMemo(() => new Map(allItems.map(i => [i.id, i.name])), [allItems]);

  useEffect(() => {
    if (!dataReady || itemIds.length === 0) {
      setActivities([]);
      setLoading(!dataReady);
      return;
    }

    let cancelled = false;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const logsCollection = database.collections.get<ProgressLogModel>('progress_logs');
        const recentLogs = await logsCollection
          .query(
            Q.where('item_id', Q.oneOf(itemIds)),
            Q.sortBy('date', Q.desc),
            Q.take(10)
          )
          .fetch();

        if (cancelled) return;

        const transformedActivities: Activity[] = recentLogs.slice(0, 5).map((log) => ({
          id: log.id,
          type: 'updated' as const,
          itemName: itemNameMap.get(log.itemId) || 'Unknown Item',
          itemType: 'schedule' as const,
          timestamp: new Date(log.date),
        }));

        setActivities(transformedActivities);
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading recent activities:', err);
          setError('Failed to load recent activities');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [dataReady, itemIdsKey, itemIds, itemNameMap]);

  return { activities, loading, error, refresh: refreshDashboard };
}
