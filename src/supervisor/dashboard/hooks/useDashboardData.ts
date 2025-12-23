import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';

/**
 * useDashboardData Hook
 *
 * Fetches and manages dashboard metrics and alerts
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 */

interface DashboardMetrics {
  activeSites: number;
  todayProgress: number;
  pendingItems: number;
  reportsSubmitted: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  itemId?: string;
}

interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const generateAlerts = async (supervisorId: string): Promise<Alert[]> => {
  const alerts: Alert[] = [];

  try {
    // Alert 1: Items exceeding planned quantity - ONLY from supervisor's sites
    const exceedingItems = await database.collections
      .get('items')
      .query(
        Q.where('completed_quantity', Q.gt(Q.column('planned_quantity'))),
        Q.on('sites', 'supervisor_id', supervisorId)
      )
      .fetch();

    if (exceedingItems.length > 0) {
      alerts.push({
        id: 'exceeding-items',
        type: 'warning',
        title: 'Items Exceeding Planned',
        message: `${exceedingItems.length} item(s) have completed quantity exceeding planned quantity`,
      });
    }

    // Alert 2: Pending items (could add threshold-based alerts here) - ONLY from supervisor's sites
    const pendingItems = await database.collections
      .get('items')
      .query(
        Q.where('completed_quantity', Q.lt(Q.column('planned_quantity'))),
        Q.on('sites', 'supervisor_id', supervisorId)
      )
      .fetch();

    if (pendingItems.length > 10) {
      alerts.push({
        id: 'many-pending-items',
        type: 'info',
        title: 'Multiple Pending Items',
        message: `You have ${pendingItems.length} items pending completion`,
      });
    }

    // Add more alerts as needed based on business logic
  } catch (err) {
    console.error('Error generating alerts:', err);
  }

  return alerts;
};

export const useDashboardData = (supervisorId: string): UseDashboardDataReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfTodayTimestamp = startOfToday.getTime();

      // Fetch all data in parallel using Promise.all
      const [sitesCollection, progressLogsCollection, itemsCollection, reportsCollection] =
        await Promise.all([
          // Active sites
          database.collections
            .get('sites')
            .query(Q.where('supervisor_id', supervisorId))
            .fetch(),

          // Today's progress updates
          database.collections
            .get('progress_logs')
            .query(Q.where('date', Q.gte(startOfTodayTimestamp)))
            .fetch(),

          // Pending items (completed < planned) - ONLY from supervisor's sites
          database.collections
            .get('items')
            .query(
              Q.where('completed_quantity', Q.lt(Q.column('planned_quantity'))),
              Q.on('sites', 'supervisor_id', supervisorId)
            )
            .fetch(),

          // Today's submitted reports
          database.collections
            .get('daily_reports')
            .query(
              Q.where('supervisor_id', supervisorId),
              Q.where('submitted_at', Q.gte(startOfTodayTimestamp))
            )
            .fetch(),
        ]);

      setMetrics({
        activeSites: sitesCollection.length,
        todayProgress: progressLogsCollection.length,
        pendingItems: itemsCollection.length,
        reportsSubmitted: reportsCollection.length,
      });

      // Generate alerts based on data
      const generatedAlerts = await generateAlerts(supervisorId);
      setAlerts(generatedAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [supervisorId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    alerts,
    loading,
    error,
    refresh,
  };
};
