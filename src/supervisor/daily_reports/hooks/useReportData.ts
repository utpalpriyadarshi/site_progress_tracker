import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../../../models/ItemModel';
import SiteModel from '../../../../models/SiteModel';
import { ItemWithSite, ItemPhotoCounts } from '../types';
import { logger } from '../../../services/LoggingService';

interface UseReportDataParams {
  supervisorId: string;
  selectedSiteId: string;
  sites: SiteModel[];
  items: ItemModel[];
}

interface UseReportDataReturn {
  itemsWithSites: ItemWithSite[];
  itemPhotoCounts: ItemPhotoCounts;
  refreshing: boolean;
  loadPhotoCounts: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

/**
 * useReportData Hook
 *
 * Manages data fetching and transformation for daily reports
 * - Maps items to their sites
 * - Loads photo counts for today's progress logs
 * - Provides pull-to-refresh functionality
 */
export const useReportData = ({
  supervisorId,
  selectedSiteId,
  sites,
  items,
}: UseReportDataParams): UseReportDataReturn => {
  const [itemsWithSites, setItemsWithSites] = useState<ItemWithSite[]>([]);
  const [itemPhotoCounts, setItemPhotoCounts] = useState<ItemPhotoCounts>({});
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load photo counts for today's progress logs
   */
  const loadPhotoCounts = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    try {
      const todaysLogs = await database.collections
        .get('progress_logs')
        .query(
          Q.where('date', Q.gte(startOfDay)),
          Q.where('date', Q.lte(endOfDay)),
          Q.where('reported_by', supervisorId)
        )
        .fetch();

      const counts: ItemPhotoCounts = {};
      todaysLogs.forEach((log: any) => {
        try {
          const logPhotos = JSON.parse(log.photos || '[]');
          if (Array.isArray(logPhotos) && logPhotos.length > 0) {
            counts[log.itemId] = logPhotos.length;
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      setItemPhotoCounts(counts);
    } catch (error) {
      logger.error('Failed to load photo counts', error as Error, {
        component: 'useReportData',
        action: 'loadPhotoCounts',
        supervisorId,
      });
    }
  }, [supervisorId]);

  /**
   * Map items to their site names and filter by selected site
   */
  useEffect(() => {
    const mapItemsToSites = async () => {
      const mapped: ItemWithSite[] = [];

      // Filter items based on selected site
      const filteredItems =
        selectedSiteId === 'all'
          ? items
          : items.filter(item => item.siteId === selectedSiteId);

      for (const item of filteredItems) {
        const site = sites.find(s => s.id === item.siteId);
        mapped.push({
          item,
          siteName: site?.name || 'Unknown Site',
        });
      }
      setItemsWithSites(mapped);
    };

    mapItemsToSites();
  }, [items, sites, selectedSiteId]);

  /**
   * Load photo counts when items or supervisorId changes
   */
  useEffect(() => {
    loadPhotoCounts();
  }, [items, supervisorId, loadPhotoCounts]);

  /**
   * Pull-to-refresh handler
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotoCounts();
    setRefreshing(false);
  }, [loadPhotoCounts]);

  return {
    itemsWithSites,
    itemPhotoCounts,
    refreshing,
    loadPhotoCounts,
    onRefresh,
  };
};
