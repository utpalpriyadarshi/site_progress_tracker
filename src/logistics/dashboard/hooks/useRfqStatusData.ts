/**
 * useRfqStatusData Hook
 *
 * Fetches RFQ (Request for Quote) metrics for the selected project.
 * Shows RFQ counts by status and recent activity.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface RfqSummary {
  id: string;
  rfqNumber: string;
  title: string;
  status: string;
  vendorCount: number;
  dueDate: number;
  createdAt: number;
}

export interface RfqStatusData {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  respondedCount: number;
  awardedCount: number;
  expiredCount: number;
  recentRfqs: RfqSummary[];
  avgResponseTime: number; // in days
}

export interface UseRfqStatusResult {
  data: RfqStatusData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useRfqStatusData(): UseRfqStatusResult {
  const { selectedProjectId } = useLogisticsContext();
  const [data, setData] = useState<RfqStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch RFQs
      const rfqs = await database.collections
        .get('rfqs')
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      // Fetch vendor quotes for these RFQs
      const rfqIds = rfqs.map((r: any) => r.id);
      let vendorQuotes: any[] = [];

      if (rfqIds.length > 0) {
        vendorQuotes = await database.collections
          .get('rfq_vendor_quotes')
          .query(Q.where('rfq_id', Q.oneOf(rfqIds)))
          .fetch();
      }

      // Create vendor count map
      const vendorCountMap = new Map<string, number>();
      vendorQuotes.forEach((quote: any) => {
        const count = vendorCountMap.get(quote.rfqId) || 0;
        vendorCountMap.set(quote.rfqId, count + 1);
      });

      const totalCount = rfqs.length;

      const draftCount = rfqs.filter((r: any) =>
        r.status === 'draft' || !r.status
      ).length;

      const sentCount = rfqs.filter((r: any) =>
        r.status === 'sent' || r.status === 'pending'
      ).length;

      const respondedCount = rfqs.filter((r: any) =>
        r.status === 'responded' || r.status === 'quoted'
      ).length;

      const awardedCount = rfqs.filter((r: any) =>
        r.status === 'awarded' || r.status === 'completed'
      ).length;

      const expiredCount = rfqs.filter((r: any) =>
        r.status === 'expired' || r.status === 'cancelled'
      ).length;

      // Get recent RFQs
      const recentRfqs: RfqSummary[] = rfqs
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
        .map((rfq: any) => ({
          id: rfq.id,
          rfqNumber: rfq.rfqNumber || 'N/A',
          title: rfq.title || rfq.description || 'Untitled RFQ',
          status: rfq.status || 'draft',
          vendorCount: vendorCountMap.get(rfq.id) || 0,
          dueDate: rfq.dueDate || rfq.responseDeadline,
          createdAt: rfq.createdAt,
        }));

      // Calculate average response time
      const respondedRfqs = rfqs.filter((r: any) =>
        r.respondedAt && r.sentAt
      );
      let avgResponseTime = 0;
      if (respondedRfqs.length > 0) {
        const totalDays = respondedRfqs.reduce((sum, rfq: any) => {
          const daysDiff = Math.floor((rfq.respondedAt - rfq.sentAt) / (1000 * 60 * 60 * 24));
          return sum + daysDiff;
        }, 0);
        avgResponseTime = Math.round(totalDays / respondedRfqs.length);
      }

      setData({
        totalCount,
        draftCount,
        sentCount,
        respondedCount,
        awardedCount,
        expiredCount,
        recentRfqs,
        avgResponseTime,
      });
    } catch (err) {
      setError('Failed to load RFQ data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useRfqStatusData;
