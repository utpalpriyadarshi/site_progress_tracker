/**
 * useOfflineSync Hook
 *
 * Unified sync logic with offline detection for all screens
 * Provides network monitoring and sync state management
 *
 * Features:
 * - Real-time online/offline detection with NetInfo
 * - Sync status tracking (idle, syncing, error)
 * - Pending count management
 * - Auto-sync with configurable interval
 * - Manual sync trigger
 * - Error handling
 *
 * @example
 * ```typescript
 * const { isOnline, syncStatus, pendingCount, sync } = useOfflineSync({
 *   onSync: async () => {
 *     await SyncService.syncUp();
 *   },
 *   autoSync: true,
 *   syncInterval: 60000, // 1 minute
 * });
 *
 * // Manual sync
 * await sync();
 *
 * // UI feedback
 * {!isOnline && <Text>Offline Mode</Text>}
 * {syncStatus === 'syncing' && <ActivityIndicator />}
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../services/LoggingService';
import { COLORS } from '../theme/colors';

// ==================== Types ====================

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  syncedCount?: number;
  error?: Error | string;
}

/**
 * useOfflineSync options
 */
export interface UseOfflineSyncOptions {
  /** Function to call when syncing */
  onSync: () => Promise<SyncResult | void>;

  /** Enable automatic syncing */
  autoSync?: boolean;

  /** Auto-sync interval in milliseconds (default: 60000 = 1 minute) */
  syncInterval?: number;

  /** Sync only when online (default: true) */
  syncOnlyWhenOnline?: boolean;

  /** Callback when sync succeeds */
  onSyncSuccess?: (result?: SyncResult) => void;

  /** Callback when sync fails */
  onSyncError?: (error: Error | string) => void;

  /** Callback when network status changes */
  onNetworkChange?: (isOnline: boolean) => void;

  /** Component name for logging */
  componentName?: string;
}

/**
 * useOfflineSync return value
 */
export interface UseOfflineSyncReturn {
  /** Current online/offline status */
  isOnline: boolean;

  /** Current sync status */
  syncStatus: SyncStatus;

  /** Number of pending items to sync */
  pendingCount: number;

  /** Manually trigger sync */
  sync: () => Promise<void>;

  /** Set pending count */
  setPendingCount: (count: number) => void;

  /** Last sync timestamp */
  lastSyncTime: number | null;

  /** Check if currently syncing */
  isSyncing: boolean;
}

// ==================== Hook ====================

/**
 * useOfflineSync Hook
 *
 * @param options - Configuration options
 * @returns Sync state and functions
 */
export const useOfflineSync = ({
  onSync,
  autoSync = false,
  syncInterval = 60000,
  syncOnlyWhenOnline = true,
  onSyncSuccess,
  onSyncError,
  onNetworkChange,
  componentName = 'useOfflineSync',
}: UseOfflineSyncOptions): UseOfflineSyncReturn => {
  // ==================== State ====================

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Refs for cleanup and interval management
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // ==================== Network Monitoring ====================

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;

      if (isMountedRef.current) {
        setIsOnline(online);

        logger.info('Network status changed', {
          component: componentName,
          isOnline: online,
          connectionType: state.type,
        });

        // Notify callback
        if (onNetworkChange) {
          onNetworkChange(online);
        }

        // Auto-sync when coming back online
        if (online && autoSync && pendingCount > 0) {
          logger.info('Auto-syncing after reconnection', {
            component: componentName,
            pendingCount,
          });
          sync();
        }
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [autoSync, pendingCount, onNetworkChange, componentName, sync]);

  // ==================== Sync Function ====================

  /**
   * Perform sync operation
   */
  const sync = useCallback(async () => {
    // Check if already syncing
    if (syncStatus === 'syncing') {
      logger.debug('Sync already in progress, skipping', {
        component: componentName,
      });
      return;
    }

    // Check online status if required
    if (syncOnlyWhenOnline && !isOnline) {
      const errorMsg = 'Cannot sync while offline';
      logger.warn(errorMsg, { component: componentName });

      if (onSyncError) {
        onSyncError(errorMsg);
      }

      return;
    }

    // Start syncing
    setSyncStatus('syncing');

    logger.info('Sync started', {
      component: componentName,
      isOnline,
      pendingCount,
    });

    try {
      // Call sync function
      const result = await onSync();

      if (!isMountedRef.current) return;

      // Handle result
      const syncResult: SyncResult =
        result && typeof result === 'object' ? result : { success: true };

      if (syncResult.success !== false) {
        setSyncStatus('success');
        setLastSyncTime(Date.now());

        // Update pending count if provided
        if (syncResult.syncedCount !== undefined) {
          setPendingCount(prev =>
            Math.max(0, prev - syncResult.syncedCount!)
          );
        }

        logger.info('Sync completed successfully', {
          component: componentName,
          syncedCount: syncResult.syncedCount,
          duration: Date.now(),
        });

        // Notify success callback
        if (onSyncSuccess) {
          onSyncSuccess(syncResult);
        }

        // Reset to idle after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setSyncStatus('idle');
          }
        }, 2000);
      } else {
        throw new Error(
          typeof syncResult.error === 'string'
            ? syncResult.error
            : syncResult.error?.message || 'Sync failed'
        );
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      setSyncStatus('error');

      const errorMsg =
        error instanceof Error ? error.message : String(error);

      logger.error('Sync failed', error as Error, {
        component: componentName,
        isOnline,
      });

      // Notify error callback
      if (onSyncError) {
        onSyncError(errorMsg);
      }

      // Reset to idle after 3 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setSyncStatus('idle');
        }
      }, 3000);
    }
  }, [
    syncStatus,
    syncOnlyWhenOnline,
    isOnline,
    pendingCount,
    onSync,
    onSyncSuccess,
    onSyncError,
    componentName,
  ]);

  // ==================== Auto-Sync ====================

  useEffect(() => {
    // Clear existing interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Setup auto-sync if enabled
    if (autoSync && isOnline) {
      logger.info('Auto-sync enabled', {
        component: componentName,
        interval: syncInterval,
      });

      syncIntervalRef.current = setInterval(() => {
        if (isMountedRef.current && pendingCount > 0) {
          logger.debug('Auto-sync triggered', {
            component: componentName,
            pendingCount,
          });
          sync();
        }
      }, syncInterval);
    }

    // Cleanup
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [autoSync, isOnline, syncInterval, pendingCount, sync, componentName]);

  // ==================== Cleanup ====================

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ==================== Return ====================

  return {
    isOnline,
    syncStatus,
    pendingCount,
    sync,
    setPendingCount,
    lastSyncTime,
    isSyncing: syncStatus === 'syncing',
  };
};

// ==================== Utility Functions ====================

/**
 * Format last sync time for display
 */
export const formatLastSyncTime = (timestamp: number | null): string => {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/**
 * Get sync status color
 */
export const getSyncStatusColor = (status: SyncStatus): string => {
  switch (status) {
    case 'idle':
      return '#666';
    case 'syncing':
      return COLORS.INFO;
    case 'success':
      return COLORS.SUCCESS;
    case 'error':
      return COLORS.ERROR;
    default:
      return '#666';
  }
};

/**
 * Get sync status icon name
 */
export const getSyncStatusIcon = (
  status: SyncStatus
): string => {
  switch (status) {
    case 'idle':
      return 'cloud-outline';
    case 'syncing':
      return 'cloud-sync';
    case 'success':
      return 'cloud-check';
    case 'error':
      return 'cloud-alert';
    default:
      return 'cloud-outline';
  }
};
