/**
 * usePurchaseOrderData Hook
 *
 * Fetches purchase order metrics for the selected project.
 * Shows open POs, approval pending, and total value.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  vendorName: string;
  status: string;
  totalAmount: number;
  createdAt: number;
}

export interface PurchaseOrderData {
  totalCount: number;
  openCount: number;
  approvalPendingCount: number;
  completedCount: number;
  totalValue: number;
  recentOrders: PurchaseOrderSummary[];
  statusBreakdown: { status: string; count: number }[];
}

export interface UsePurchaseOrderResult {
  data: PurchaseOrderData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function usePurchaseOrderData(): UsePurchaseOrderResult {
  const { selectedProjectId } = useLogisticsContext();
  const [data, setData] = useState<PurchaseOrderData | null>(null);
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

      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      const totalCount = purchaseOrders.length;

      const openCount = purchaseOrders.filter((po: any) =>
        ['draft', 'pending', 'approved', 'shipped', 'in_transit'].includes(po.status)
      ).length;

      const approvalPendingCount = purchaseOrders.filter((po: any) =>
        po.status === 'pending' || po.status === 'pending_approval'
      ).length;

      const completedCount = purchaseOrders.filter((po: any) =>
        ['completed', 'delivered'].includes(po.status)
      ).length;

      const totalValue = purchaseOrders.reduce((sum, po: any) => {
        return sum + (po.totalAmount || 0);
      }, 0);

      // Get recent orders
      const recentOrders: PurchaseOrderSummary[] = purchaseOrders
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
        .map((po: any) => ({
          id: po.id,
          poNumber: po.poNumber || 'N/A',
          vendorName: po.vendorName || 'Unknown',
          status: po.status,
          totalAmount: po.totalAmount || 0,
          createdAt: po.createdAt,
        }));

      // Status breakdown
      const statusMap = new Map<string, number>();
      purchaseOrders.forEach((po: any) => {
        const status = po.status || 'unknown';
        const count = statusMap.get(status) || 0;
        statusMap.set(status, count + 1);
      });
      const statusBreakdown = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      setData({
        totalCount,
        openCount,
        approvalPendingCount,
        completedCount,
        totalValue,
        recentOrders,
        statusBreakdown,
      });
    } catch (err) {
      setError('Failed to load purchase order data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default usePurchaseOrderData;
