/**
 * useCriticalPathData Hook
 *
 * Fetches and manages critical path items data for the dashboard widget.
 * Queries items marked as critical path and calculates risk levels.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import { usePlanningContext } from '../../context';
import type { CriticalPathItem } from '../widgets/CriticalPathWidget';

// ==================== Types ====================

interface UseCriticalPathResult {
  items: CriticalPathItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching critical path items
 *
 * Queries items marked as critical path for the assigned project's sites.
 * Calculates risk levels based on delays, due dates, and float days.
 *
 * @returns {UseCriticalPathResult} Critical path items data, loading state, error, and refresh function
 */
export function useCriticalPathData(): UseCriticalPathResult {
  const { projectId, sites } = usePlanningContext();
  const [items, setItems] = useState<CriticalPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Query critical path items
      const itemsCollection = database.collections.get<ItemModel>('items');
      const criticalItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_critical_path', true),
          Q.where('status', Q.notEq('completed')),
          Q.sortBy('planned_end_date', Q.asc)
        )
        .fetch();

      // Transform to CriticalPathItem type
      const now = Date.now();
      const transformedItems: CriticalPathItem[] = criticalItems.map((item) => {
        const daysUntilDue = Math.ceil((item.plannedEndDate - now) / 86400000);
        const isDelayed = item.status === 'delayed' || daysUntilDue < 0;

        // Determine risk level based on delay and float
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (isDelayed || daysUntilDue < 0) {
          riskLevel = 'high';
        } else if (daysUntilDue < 7 || (item.floatDays !== undefined && item.floatDays < 3)) {
          riskLevel = 'medium';
        }

        return {
          id: item.id,
          name: item.name,
          riskLevel,
          delayImpact: isDelayed ? Math.abs(daysUntilDue) : 0,
          progress: item.getProgressPercentage(),
          dueDate: new Date(item.plannedEndDate),
        };
      });

      setItems(transformedItems);
    } catch (err) {
      console.error('Error loading critical path:', err);
      setError('Failed to load critical path data');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refresh: fetchData };
}
