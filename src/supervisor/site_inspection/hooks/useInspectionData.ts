import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import SiteInspectionModel from '../../../../models/SiteInspectionModel';
import SiteModel from '../../../../models/SiteModel';
import { SyncService } from '../../../../services/sync/SyncService';
import { logger } from '../../../services/LoggingService';
import { InspectionWithSite } from '../types';

/**
 * Hook options
 */
export interface UseInspectionDataOptions {
  supervisorId: string;
  projectId: string;
  selectedSiteId: string | 'all';
  onError?: (message: string) => void;
  onSyncSuccess?: (count: number) => void;
}

/**
 * Hook return type
 */
export interface UseInspectionDataReturn {
  inspections: InspectionWithSite[];
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

/**
 * Custom hook for loading and managing inspection data
 *
 * Features:
 * - Loads inspections from WatermelonDB
 * - Filters by supervisor, project, and optionally by site
 * - Auto-sync integration (2-second delay after initial load)
 * - Pull-to-refresh with manual sync
 * - Error handling with callbacks
 *
 * @param options - Configuration options
 * @returns Inspections data and refresh handlers
 *
 * @example
 * ```tsx
 * const {
 *   inspections,
 *   loading,
 *   refreshing,
 *   reload,
 *   onRefresh,
 * } = useInspectionData({
 *   supervisorId: user.id,
 *   projectId: site.projectId,
 *   selectedSiteId: 'all',
 *   onError: (msg) => showSnackbar(msg, 'error'),
 *   onSyncSuccess: (count) => showSnackbar(`${count} records synced`, 'success'),
 * });
 * ```
 */
export function useInspectionData(
  options: UseInspectionDataOptions
): UseInspectionDataReturn {
  const {
    supervisorId,
    projectId,
    selectedSiteId,
    onError,
    onSyncSuccess,
  } = options;

  const [inspections, setInspections] = useState<InspectionWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load inspections from database
   */
  const loadInspections = useCallback(async () => {
    try {
      const inspectionsCollection = database.collections.get<SiteInspectionModel>('site_inspections');
      const sitesCollection = database.collections.get<SiteModel>('sites');

      // Build query - filter by project and optionally by site
      const queryConditions = [
        Q.where('inspector_id', supervisorId),
        Q.on('sites', 'project_id', projectId), // Project isolation
      ];

      if (selectedSiteId !== 'all') {
        queryConditions.push(Q.where('site_id', selectedSiteId));
      }

      const fetchedInspections = await inspectionsCollection
        .query(...queryConditions, Q.sortBy('inspection_date', Q.desc))
        .fetch();

      // Fetch related site data
      const inspectionsWithSites: InspectionWithSite[] = [];

      for (const inspection of fetchedInspections) {
        const site = await sitesCollection.find(inspection.siteId);
        logger.debug('Inspection loaded', {
          component: 'useInspectionData',
          inspectionId: inspection.id,
          syncStatus: inspection.appSyncStatus,
        });
        inspectionsWithSites.push({
          inspection,
          site,
        });
      }

      setInspections(inspectionsWithSites);
      setError(null);
    } catch (err) {
      const errorObj = err as Error;
      logger.error('Failed to load inspections', errorObj, {
        component: 'useInspectionData',
        action: 'loadInspections',
        supervisorId,
      });
      setError(errorObj);
      onError?.('Failed to load inspections');
    }
  }, [supervisorId, projectId, selectedSiteId, onError]);

  /**
   * Initialize data loading with auto-sync
   */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadInspections();
      setLoading(false);

      // Auto-sync after 2 seconds
      setTimeout(async () => {
        logger.debug('Auto-sync triggered', { component: 'useInspectionData' });
        try {
          const syncResult = await SyncService.syncUp();
          logger.debug('Auto-sync completed', {
            component: 'useInspectionData',
            syncResult,
          });

          if (syncResult.success && syncResult.syncedRecords > 0) {
            // Silently reload inspections to update UI
            await loadInspections();
            logger.debug('Inspections reloaded after sync', {
              component: 'useInspectionData',
            });
          }
        } catch (err) {
          logger.error('Auto-sync failed', err as Error, {
            component: 'useInspectionData',
          });
        }
      }, 2000);
    };

    init();
  }, [loadInspections]);

  /**
   * Manual refresh with sync
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Perform sync operation to update sync status
      const syncResult = await SyncService.syncUp();
      logger.info('Sync completed', {
        component: 'useInspectionData',
        action: 'onRefresh',
        syncResult,
      });

      // Reload inspections to show updated sync status
      await loadInspections();

      if (syncResult.success && syncResult.syncedRecords > 0) {
        onSyncSuccess?.(syncResult.syncedRecords);
      }
    } catch (err) {
      logger.error('Refresh failed', err as Error, {
        component: 'useInspectionData',
        action: 'onRefresh',
      });
      onError?.('Failed to sync data');
    }
    setRefreshing(false);
  }, [loadInspections, onError, onSyncSuccess]);

  /**
   * Reload inspections without sync
   */
  const reload = useCallback(async () => {
    await loadInspections();
  }, [loadInspections]);

  return {
    inspections,
    loading,
    refreshing,
    error,
    reload,
    onRefresh,
  };
}
