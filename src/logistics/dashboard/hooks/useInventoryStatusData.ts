/**
 * useInventoryStatusData Hook
 *
 * Fetches inventory metrics for the selected project.
 * Uses LogisticsContext for project filtering.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface InventoryStatusData {
  totalItems: number;
  totalValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: { category: string; count: number }[];
}

export interface UseInventoryStatusResult {
  data: InventoryStatusData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useInventoryStatusData(): UseInventoryStatusResult {
  const { selectedProjectId, materials } = useLogisticsContext();
  const [data, setData] = useState<InventoryStatusData | null>(null);
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

      // Use materials from context (already filtered by project)
      const projectMaterials = materials;

      // Calculate metrics
      const totalItems = projectMaterials.length;
      const totalValue = projectMaterials.reduce((sum, m) => {
        const quantity = m.quantityAvailable || 0;
        const unitCost = (m as any).unitCost || 0;
        return sum + (quantity * unitCost);
      }, 0);

      const inStockCount = projectMaterials.filter(m => {
        const available = m.quantityAvailable || 0;
        const required = m.quantityRequired || 0;
        const reorderLevel = required * 0.3; // 30% threshold
        return available > reorderLevel;
      }).length;

      const lowStockCount = projectMaterials.filter(m => {
        const available = m.quantityAvailable || 0;
        const required = m.quantityRequired || 0;
        const reorderLevel = required * 0.3;
        return available > 0 && available <= reorderLevel;
      }).length;

      const outOfStockCount = projectMaterials.filter(m => {
        return (m.quantityAvailable || 0) === 0;
      }).length;

      // Category breakdown
      const categoryMap = new Map<string, number>();
      projectMaterials.forEach(m => {
        const category = (m as any).category || 'Uncategorized';
        const count = categoryMap.get(category) || 0;
        categoryMap.set(category, count + 1);
      });
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      setData({
        totalItems,
        totalValue,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        categoryBreakdown,
      });
    } catch (err) {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, materials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useInventoryStatusData;
