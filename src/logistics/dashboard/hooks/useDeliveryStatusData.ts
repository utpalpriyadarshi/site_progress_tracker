/**
 * useDeliveryStatusData Hook
 *
 * Fetches delivery metrics for the selected project.
 * Shows pending, in-transit, and completed deliveries.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface DeliveryItem {
  id: string;
  description: string;
  status: 'pending' | 'in_transit' | 'delivered';
  scheduledDate: number;
  actualDate?: number;
  vendor?: string;
}

export interface DeliveryStatusData {
  pendingCount: number;
  inTransitCount: number;
  deliveredCount: number;
  totalCount: number;
  upcomingDeliveries: DeliveryItem[];
  onTimeRate: number;
}

export interface UseDeliveryStatusResult {
  data: DeliveryStatusData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useDeliveryStatusData(): UseDeliveryStatusResult {
  const { selectedProjectId } = useLogisticsContext();
  const [data, setData] = useState<DeliveryStatusData | null>(null);
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

      // Fetch purchase orders to derive delivery data
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      // Map PO statuses to delivery statuses
      const deliveries: DeliveryItem[] = purchaseOrders.map((po: any) => {
        let status: 'pending' | 'in_transit' | 'delivered' = 'pending';

        if (po.status === 'delivered' || po.status === 'completed') {
          status = 'delivered';
        } else if (po.status === 'shipped' || po.status === 'in_transit') {
          status = 'in_transit';
        }

        return {
          id: po.id,
          description: po.description || `PO-${po.poNumber || 'N/A'}`,
          status,
          scheduledDate: po.expectedDeliveryDate || po.createdAt,
          actualDate: po.actualDeliveryDate,
          vendor: po.vendorName,
        };
      });

      const pendingCount = deliveries.filter(d => d.status === 'pending').length;
      const inTransitCount = deliveries.filter(d => d.status === 'in_transit').length;
      const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

      // Get upcoming deliveries (pending or in-transit, sorted by date)
      const now = Date.now();
      const upcomingDeliveries = deliveries
        .filter(d => d.status !== 'delivered')
        .sort((a, b) => a.scheduledDate - b.scheduledDate)
        .slice(0, 5);

      // Calculate on-time rate
      const completedDeliveries = deliveries.filter(d => d.status === 'delivered');
      const onTimeDeliveries = completedDeliveries.filter(d => {
        if (!d.actualDate || !d.scheduledDate) return true;
        return d.actualDate <= d.scheduledDate;
      });
      const onTimeRate = completedDeliveries.length > 0
        ? Math.round((onTimeDeliveries.length / completedDeliveries.length) * 100)
        : 100;

      setData({
        pendingCount,
        inTransitCount,
        deliveredCount,
        totalCount: deliveries.length,
        upcomingDeliveries,
        onTimeRate,
      });
    } catch (err) {
      setError('Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useDeliveryStatusData;
