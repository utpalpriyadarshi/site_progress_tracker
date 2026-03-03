import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';

/**
 * useDashboardData Hook
 *
 * Fetches and manages dashboard metrics, alerts, and per-site progress.
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 */

interface DashboardMetrics {
  activeSites: number;
  todayProgress: number;
  pendingItems: number;
  reportsSubmitted: number;
  materialsShortage: number;
  openHindrances: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  itemId?: string;
}

export interface SiteProgressEntry {
  id: string;
  name: string;
  location: string;
  progress: number;
  itemCount: number;
}

interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  siteProgress: SiteProgressEntry[];
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
  const [siteProgress, setSiteProgress] = useState<SiteProgressEntry[]>([]);
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
      // allSupervisorItems replaces the pending-only items query — we derive pendingItems count from it
      const [sitesCollection, progressLogsCollection, allSupervisorItems, reportsCollection, hindrancesCollection] =
        await Promise.all([
          // Active sites for this supervisor
          database.collections
            .get('sites')
            .query(Q.where('supervisor_id', supervisorId))
            .fetch(),

          // Today's progress updates
          database.collections
            .get('progress_logs')
            .query(Q.where('date', Q.gte(startOfTodayTimestamp)))
            .fetch(),

          // ALL items from supervisor's sites (used for pending count + site progress)
          database.collections
            .get('items')
            .query(Q.on('sites', 'supervisor_id', supervisorId))
            .fetch(),

          // Today's submitted reports
          database.collections
            .get('daily_reports')
            .query(
              Q.where('supervisor_id', supervisorId),
              Q.where('submitted_at', Q.gte(startOfTodayTimestamp))
            )
            .fetch(),

          // Open hindrances reported by this supervisor
          database.collections
            .get('hindrances')
            .query(Q.where('reported_by', supervisorId))
            .fetch(),
        ]);

      // Materials shortage — query after we have item IDs
      const supervisorItemIds = (allSupervisorItems as any[]).map(i => i.id);
      const materialsCollection = supervisorItemIds.length > 0
        ? await database.collections
            .get('materials')
            .query(Q.where('item_id', Q.oneOf(supervisorItemIds)))
            .fetch()
        : [];

      // Derive pending count from the full items list
      const pendingCount = (allSupervisorItems as any[]).filter(
        (item) => item.completedQuantity < item.plannedQuantity
      ).length;

      const materialsShortage = (materialsCollection as any[]).filter(
        m => (m as any).status === 'shortage'
      ).length;

      const openHindrances = (hindrancesCollection as any[]).filter(
        h => (h as any).status === 'open' || (h as any).status === 'in_progress'
      ).length;

      setMetrics({
        activeSites: sitesCollection.length,
        todayProgress: progressLogsCollection.length,
        pendingItems: pendingCount,
        reportsSubmitted: reportsCollection.length,
        materialsShortage,
        openHindrances,
      });

      // Group items by site ID
      const itemsBySiteId: Record<string, any[]> = {};
      for (const item of allSupervisorItems as any[]) {
        if (!itemsBySiteId[item.siteId]) itemsBySiteId[item.siteId] = [];
        itemsBySiteId[item.siteId].push(item);
      }

      // Calculate per-site progress (weightage-based, same formula as planning)
      const siteProgressData: SiteProgressEntry[] = (sitesCollection as any[])
        .map((site) => {
          const siteItems: any[] = itemsBySiteId[site.id] || [];
          const totalWeightage = siteItems.reduce((sum, item) => sum + (item.weightage || 0), 0);
          let progress = 0;
          if (totalWeightage > 0) {
            progress =
              siteItems.reduce(
                (sum, item) => sum + (item.weightage || 0) * item.getProgressPercentage(),
                0
              ) / totalWeightage;
          }
          return {
            id: site.id,
            name: site.name || 'Unnamed Site',
            location: site.location || '',
            progress: Math.round(progress * 100) / 100,
            itemCount: siteItems.length,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      setSiteProgress(siteProgressData);

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
    siteProgress,
    loading,
    error,
    refresh,
  };
};
