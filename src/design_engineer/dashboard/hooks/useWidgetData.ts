import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';
import type {
  DoorsPackageStatus,
  RfqStatusData,
  ComplianceData,
  ProcessingTimeData,
  RecentActivity,
} from '../types/dashboard';

/**
 * Custom hooks for fetching dashboard widget data
 */

/**
 * Fetches DOORS package status data
 */
export const useDoorsStatusData = (projectId: string | null) => {
  const [data, setData] = useState<DoorsPackageStatus>({
    pending: 0,
    received: 0,
    reviewed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const doorsCollection = database.collections.get('doors_packages');
      const packages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const pending = packages.filter((pkg: any) => pkg.status === 'pending').length;
      const received = packages.filter((pkg: any) => pkg.status === 'received').length;
      const reviewed = packages.filter((pkg: any) => pkg.status === 'reviewed').length;

      setData({
        pending,
        received,
        reviewed,
        total: packages.length,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch DOORS status');
      logger.error('[useDoorsStatusData] Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Fetches RFQ status data
 */
export const useRfqStatusData = (projectId: string | null) => {
  const [data, setData] = useState<RfqStatusData>({
    draft: 0,
    issued: 0,
    awarded: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rfqCollection = database.collections.get('rfqs');
      const rfqs = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

      const draft = rfqs.filter((rfq: any) => rfq.status === 'draft').length;
      const issued = rfqs.filter((rfq: any) => rfq.status === 'issued').length;
      const awarded = rfqs.filter((rfq: any) => rfq.status === 'awarded').length;

      setData({
        draft,
        issued,
        awarded,
        total: rfqs.length,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch RFQ status');
      logger.error('[useRfqStatusData] Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Fetches compliance data
 */
export const useComplianceData = (projectId: string | null) => {
  const [data, setData] = useState<ComplianceData>({
    rate: 0,
    target: 80,
    reviewed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const doorsCollection = database.collections.get('doors_packages');
      const packages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const reviewed = packages.filter((pkg: any) => pkg.status === 'reviewed').length;
      const total = packages.length;
      const rate = total > 0 ? Math.round((reviewed / total) * 100) : 0;

      setData({
        rate,
        target: 80,
        reviewed,
        total,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch compliance data');
      logger.error('[useComplianceData] Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Fetches processing time data
 */
export const useProcessingTimeData = (projectId: string | null) => {
  const [data, setData] = useState<ProcessingTimeData>({
    average: 0,
    benchmark: 7,
    trend: 'stable',
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const doorsCollection = database.collections.get('doors_packages');
      const packages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      let totalProcessingDays = 0;
      let processedCount = 0;

      packages.forEach((pkg: any) => {
        if (pkg.receivedDate && pkg.reviewedDate) {
          const processingTime = (pkg.reviewedDate - pkg.receivedDate) / (1000 * 60 * 60 * 24);
          totalProcessingDays += processingTime;
          processedCount++;
        }
      });

      const average = processedCount > 0 ? Math.round(totalProcessingDays / processedCount) : 0;

      setData({
        average,
        benchmark: 7,
        trend: 'stable', // TODO: Calculate trend from historical data
        history: [], // TODO: Populate with historical data
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch processing time');
      logger.error('[useProcessingTimeData] Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Fetches recent activity data
 */
export const useRecentActivityData = (projectId: string | null, limit: number = 10) => {
  const [data, setData] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const activities: RecentActivity[] = [];

      // Fetch recent DOORS packages
      const doorsCollection = database.collections.get('doors_packages');
      const packages = await doorsCollection
        .query(Q.where('project_id', projectId), Q.sortBy('created_at', Q.desc), Q.take(5))
        .fetch();

      packages.forEach((pkg: any) => {
        activities.push({
          id: pkg.id,
          type: 'package',
          title: pkg.doorsId || 'Unknown Package',
          status: pkg.status || 'pending',
          timestamp: pkg.createdAt || Date.now(),
          action: `Package ${pkg.status || 'created'}`,
        });
      });

      // Fetch recent RFQs
      const rfqCollection = database.collections.get('rfqs');
      const rfqs = await rfqCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('rfq_type', 'design'),
          Q.sortBy('created_at', Q.desc),
          Q.take(5)
        )
        .fetch();

      rfqs.forEach((rfq: any) => {
        activities.push({
          id: rfq.id,
          type: 'rfq',
          title: rfq.rfqNumber || 'Unknown RFQ',
          status: rfq.status || 'draft',
          timestamp: rfq.createdAt || Date.now(),
          action: `RFQ ${rfq.status || 'created'}`,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setData(activities.slice(0, limit));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch recent activity');
      logger.error('[useRecentActivityData] Error:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
