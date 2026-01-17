/**
 * useRecentActivityData Hook
 *
 * Fetches recent logistics activity for the selected project.
 * Aggregates activity from materials, POs, deliveries, and RFQs.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export type ActivityType = 'material' | 'purchase_order' | 'delivery' | 'rfq' | 'doors' | 'inventory';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: number;
  icon: string;
  color: string;
}

export interface RecentActivityData {
  activities: ActivityItem[];
  totalCount: number;
}

export interface UseRecentActivityResult {
  data: RecentActivityData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Helper ====================

function getActivityIcon(type: ActivityType): string {
  switch (type) {
    case 'material':
      return 'package-variant';
    case 'purchase_order':
      return 'clipboard-list';
    case 'delivery':
      return 'truck-delivery';
    case 'rfq':
      return 'file-document-outline';
    case 'doors':
      return 'door';
    case 'inventory':
      return 'warehouse';
    default:
      return 'information';
  }
}

function getActivityColor(type: ActivityType): string {
  switch (type) {
    case 'material':
      return '#2196F3';
    case 'purchase_order':
      return '#4CAF50';
    case 'delivery':
      return '#FF9800';
    case 'rfq':
      return '#9C27B0';
    case 'doors':
      return '#00BCD4';
    case 'inventory':
      return '#795548';
    default:
      return '#607D8B';
  }
}

// ==================== Hook ====================

export function useRecentActivityData(): UseRecentActivityResult {
  const { selectedProjectId } = useLogisticsContext();
  const [data, setData] = useState<RecentActivityData | null>(null);
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

      const activities: ActivityItem[] = [];

      // Fetch recent materials updates
      const materials = await database.collections
        .get('materials')
        .query(
          Q.where('project_id', selectedProjectId),
          Q.sortBy('updated_at', Q.desc),
          Q.take(5)
        )
        .fetch();

      materials.forEach((m: any) => {
        activities.push({
          id: `material_${m.id}`,
          type: 'material',
          title: 'Material Updated',
          description: m.name || 'Material record updated',
          timestamp: m.updatedAt || m.createdAt,
          icon: getActivityIcon('material'),
          color: getActivityColor('material'),
        });
      });

      // Fetch recent purchase orders
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(
          Q.where('project_id', selectedProjectId),
          Q.sortBy('updated_at', Q.desc),
          Q.take(5)
        )
        .fetch();

      purchaseOrders.forEach((po: any) => {
        activities.push({
          id: `po_${po.id}`,
          type: 'purchase_order',
          title: `PO ${po.status || 'Updated'}`,
          description: po.description || `PO-${po.poNumber || 'N/A'}`,
          timestamp: po.updatedAt || po.createdAt,
          icon: getActivityIcon('purchase_order'),
          color: getActivityColor('purchase_order'),
        });
      });

      // Fetch recent RFQs
      const rfqs = await database.collections
        .get('rfqs')
        .query(
          Q.where('project_id', selectedProjectId),
          Q.sortBy('updated_at', Q.desc),
          Q.take(5)
        )
        .fetch();

      rfqs.forEach((rfq: any) => {
        activities.push({
          id: `rfq_${rfq.id}`,
          type: 'rfq',
          title: `RFQ ${rfq.status || 'Updated'}`,
          description: rfq.title || rfq.description || `RFQ-${rfq.rfqNumber || 'N/A'}`,
          timestamp: rfq.updatedAt || rfq.createdAt,
          icon: getActivityIcon('rfq'),
          color: getActivityColor('rfq'),
        });
      });

      // Fetch recent DOORS packages
      const doorsPackages = await database.collections
        .get('doors_packages')
        .query(
          Q.where('project_id', selectedProjectId),
          Q.sortBy('updated_at', Q.desc),
          Q.take(5)
        )
        .fetch();

      doorsPackages.forEach((pkg: any) => {
        activities.push({
          id: `doors_${pkg.id}`,
          type: 'doors',
          title: 'DOORS Package Updated',
          description: pkg.name || pkg.description || `Package ${pkg.packageNumber || 'N/A'}`,
          timestamp: pkg.updatedAt || pkg.createdAt,
          icon: getActivityIcon('doors'),
          color: getActivityColor('doors'),
        });
      });

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Take top 10
      const recentActivities = activities.slice(0, 10);

      setData({
        activities: recentActivities,
        totalCount: activities.length,
      });
    } catch (err) {
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useRecentActivityData;
