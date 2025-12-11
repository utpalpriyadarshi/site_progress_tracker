import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import HindranceModel from '../../../../models/HindranceModel';
import SiteModel from '../../../../models/SiteModel';
import ItemModel from '../../../../models/ItemModel';
import { logger } from '../../../services/LoggingService';
import { HindranceWithDetails } from '../types';

interface UseHindranceDataProps {
  supervisorId: string;
  projectId: string;
  selectedSiteId: string | null;
  onError: (message: string) => void;
}

export const useHindranceData = ({
  supervisorId,
  projectId,
  selectedSiteId,
  onError,
}: UseHindranceDataProps) => {
  const [hindrances, setHindrances] = useState<HindranceWithDetails[]>([]);
  const [siteItems, setSiteItems] = useState<ItemModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load hindrances for the selected site
  const loadHindrances = async () => {
    try {
      const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const itemsCollection = database.collections.get<ItemModel>('items');

      // Build query - filter by project and optionally by site
      const queryConditions = [
        Q.where('reported_by', supervisorId),
        Q.on('sites', 'project_id', projectId), // Project isolation
      ];

      if (selectedSiteId !== 'all') {
        queryConditions.push(Q.where('site_id', selectedSiteId));
      }

      const fetchedHindrances = await hindrancesCollection
        .query(...queryConditions, Q.sortBy('reported_at', Q.desc))
        .fetch();

      // Fetch related data
      const hindrancesWithDetails: HindranceWithDetails[] = [];

      for (const hindrance of fetchedHindrances) {
        const site = await sitesCollection.find(hindrance.siteId);
        let item: ItemModel | undefined;

        if (hindrance.itemId) {
          try {
            item = await itemsCollection.find(hindrance.itemId);
          } catch (e) {
            // Item might not exist
          }
        }

        hindrancesWithDetails.push({
          hindrance,
          site,
          item,
        });
      }

      setHindrances(hindrancesWithDetails);
    } catch (error) {
      logger.error('Failed to load hindrances', error as Error, {
        component: 'useHindranceData',
        action: 'loadHindrances',
        supervisorId,
      });
      onError('Failed to load hindrances');
    }
  };

  // Load site items for dropdown
  const loadSiteItems = async (siteId: string) => {
    if (siteId === 'all') {
      setSiteItems([]);
      return;
    }

    try {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const items = await itemsCollection
        .query(Q.where('site_id', siteId))
        .fetch();

      setSiteItems(items);
    } catch (error) {
      logger.error('Failed to load site items', error as Error, {
        component: 'useHindranceData',
        action: 'loadSiteItems',
        siteId,
      });
    }
  };

  // Sync pending hindrances
  const syncPendingHindrances = async () => {
    try {
      // Get all pending hindrances
      const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
      const pendingHindrances = await hindrancesCollection
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      // Update all pending hindrances to synced
      await database.write(async () => {
        for (const hindrance of pendingHindrances) {
          await hindrance.update((h) => {
            h.appSyncStatus = 'synced';
          });
        }
      });

      logger.info('Hindrances synced successfully', {
        component: 'useHindranceData',
        action: 'syncPendingHindrances',
        count: pendingHindrances.length,
      });
    } catch (error) {
      logger.error('Failed to sync hindrances', error as Error, {
        component: 'useHindranceData',
        action: 'syncPendingHindrances',
      });
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await syncPendingHindrances(); // Sync pending items
    await loadHindrances(); // Reload to show updated status
    setRefreshing(false);
  };

  // Auto-load hindrances when dependencies change
  useEffect(() => {
    loadHindrances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorId, selectedSiteId]);

  // Load items when site changes
  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== 'all') {
      loadSiteItems(selectedSiteId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

  return {
    hindrances,
    siteItems,
    refreshing,
    loadHindrances,
    onRefresh,
  };
};
