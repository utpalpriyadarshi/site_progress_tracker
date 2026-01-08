/**
 * Sync-related type definitions for Admin shared components
 */

/**
 * Sync status information
 */
export interface SyncStatus {
  /** Whether device is online */
  isOnline: boolean;
  /** Last successful sync timestamp */
  lastSyncTime: number;
  /** Whether sync is currently in progress */
  syncInProgress: boolean;
  /** Number of pending changes */
  pendingChanges: number;
  /** Number of sync errors */
  syncErrors: number;
  /** Next scheduled sync time (optional) */
  nextSyncTime?: number;
}

/**
 * Detailed sync information
 */
export interface SyncDetails {
  /** Number of records uploaded in last sync */
  uploadedRecords: number;
  /** Number of records downloaded in last sync */
  downloadedRecords: number;
  /** Number of conflicts resolved */
  conflictsResolved: number;
  /** Number of failed records */
  failedRecords: number;
  /** Sync duration in milliseconds */
  syncDuration: number;
}

/**
 * SyncStatusPanel component props
 */
export interface SyncStatusPanelProps {
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Detailed sync information (optional) */
  syncDetails?: SyncDetails;
  /** Callback when sync button is pressed */
  onSync?: () => void;
  /** Callback when view logs button is pressed */
  onViewLogs?: () => void;
  /** Whether to show detailed sync information */
  showDetails?: boolean;
  /** Panel display variant */
  variant?: 'compact' | 'detailed';
}
