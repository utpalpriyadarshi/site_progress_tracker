/**
 * Hook for managing Gantt chart data loading
 */

import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../../../models/ItemModel';
import SiteModel from '../../../../models/SiteModel';
import { logger } from '../../../services/LoggingService';

export interface UseGanttDataReturn {
  items: ItemModel[];
  loading: boolean;
  loadItems: () => Promise<void>;
}

/**
 * Custom hook for loading and managing Gantt chart items
 */
export const useGanttData = (selectedSite: SiteModel | null): UseGanttDataReturn => {
  const [items, setItems] = useState<ItemModel[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = useCallback(async () => {
    if (!selectedSite) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const siteItems = await database.collections
        .get<ItemModel>('items')
        .query(Q.where('site_id', selectedSite.id))
        .fetch();

      // Sort by start date, then by WBS code
      siteItems.sort((a, b) => {
        const dateCompare = a.plannedStartDate - b.plannedStartDate;
        if (dateCompare !== 0) return dateCompare;
        return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      });

      setItems(siteItems);
    } catch (error) {
      logger.error('[Gantt] Error loading items', error as Error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return { items, loading, loadItems };
};
