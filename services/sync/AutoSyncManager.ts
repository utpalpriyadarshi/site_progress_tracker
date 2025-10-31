/**
 * AutoSyncManager - Automatic synchronization trigger manager
 * Week 8, Day 4: Auto-sync implementation
 *
 * Features:
 * - Auto-sync on app launch
 * - Auto-sync on network change (offline → online)
 * - Auto-sync every 5 minutes (configurable interval)
 * - Sync state management
 * - Error handling and logging
 */

import { AppState, AppStateStatus } from 'react-native';
import { SyncService } from './SyncService';
import NetworkMonitor from '../network/NetworkMonitor';

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: number;
  lastSyncSuccess: boolean;
  lastSyncError: string | null;
  syncCount: number;
}

type SyncStateListener = (state: SyncState) => void;

export class AutoSyncManager {
  private static intervalId: NodeJS.Timeout | null = null;
  private static syncState: SyncState = {
    isSyncing: false,
    lastSyncAt: 0,
    lastSyncSuccess: true,
    lastSyncError: null,
    syncCount: 0,
  };
  private static listeners: SyncStateListener[] = [];
  private static networkUnsubscribe: (() => void) | null = null;
  private static appStateSubscription: any = null;

  /**
   * Sync interval configuration (5 minutes)
   */
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Initialize auto-sync manager
   * Week 8, Day 4: Setup all auto-sync triggers
   */
  static initialize(): void {
    console.log('🤖 Initializing AutoSyncManager...');

    // 1. Trigger: App launch sync
    this.performAppLaunchSync();

    // 2. Trigger: Network change sync (via NetworkMonitor)
    this.setupNetworkSync();

    // 3. Trigger: Periodic sync (every 5 minutes)
    this.startPeriodicSync();

    // 4. Trigger: App state change (foreground)
    this.setupAppStateSync();

    console.log(`✅ AutoSyncManager initialized (interval: ${this.SYNC_INTERVAL / 1000}s)`);
  }

  /**
   * Trigger 1: App launch sync
   * Week 8, Day 4: Sync when app starts
   */
  private static async performAppLaunchSync(): Promise<void> {
    console.log('🚀 App Launch: Triggering initial sync...');

    try {
      const isConnected = await NetworkMonitor.isConnected();

      if (!isConnected) {
        console.log('⚠️  App Launch: No network connection, skipping sync');
        return;
      }

      // Wait a moment for app to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      await this.performSync('App Launch');
    } catch (error) {
      console.error('❌ App Launch sync failed:', error);
    }
  }

  /**
   * Trigger 2: Network change sync
   * Week 8, Day 4: Sync when network is restored
   */
  private static setupNetworkSync(): void {
    console.log('📡 Setting up network change sync...');

    this.networkUnsubscribe = NetworkMonitor.addListener((isConnected, connectionType) => {
      if (isConnected) {
        console.log(`📡 Network restored (${connectionType}): Triggering sync...`);
        // NetworkMonitor already triggers sync, but we update state here
        this.updateSyncState({ lastSyncAt: Date.now() });
      }
    });
  }

  /**
   * Trigger 3: Periodic sync (every 5 minutes)
   * Week 8, Day 4: Background sync at regular intervals
   */
  private static startPeriodicSync(): void {
    console.log(`⏰ Starting periodic sync (every ${this.SYNC_INTERVAL / 1000}s)...`);

    this.intervalId = setInterval(async () => {
      try {
        const isConnected = await NetworkMonitor.isConnected();

        if (!isConnected) {
          console.log('⏰ Periodic sync: No network connection, skipping');
          return;
        }

        // Don't sync if already syncing
        if (this.syncState.isSyncing) {
          console.log('⏰ Periodic sync: Already syncing, skipping');
          return;
        }

        await this.performSync('Periodic');
      } catch (error) {
        console.error('❌ Periodic sync failed:', error);
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Trigger 4: App state change sync (background → foreground)
   * Week 8, Day 4: Sync when app comes to foreground
   */
  private static setupAppStateSync(): void {
    console.log('📱 Setting up app state change sync...');

    let previousAppState: AppStateStatus = AppState.currentState;

    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // Detect background → foreground transition
      if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground: Checking sync...');

        try {
          const isConnected = await NetworkMonitor.isConnected();

          if (!isConnected) {
            console.log('📱 App foreground: No network connection, skipping sync');
            return;
          }

          // Only sync if last sync was more than 1 minute ago
          const timeSinceLastSync = Date.now() - this.syncState.lastSyncAt;
          const oneMinute = 60 * 1000;

          if (timeSinceLastSync > oneMinute) {
            await this.performSync('App Foreground');
          } else {
            console.log(`📱 App foreground: Last sync was ${Math.floor(timeSinceLastSync / 1000)}s ago, skipping`);
          }
        } catch (error) {
          console.error('❌ App foreground sync failed:', error);
        }
      }

      previousAppState = nextAppState;
    });
  }

  /**
   * Perform sync operation with state management
   * Week 8, Day 4: Execute sync and update state
   */
  private static async performSync(trigger: string): Promise<void> {
    console.log(`🔄 [${trigger}] Starting sync...`);

    // Update state: syncing started
    this.updateSyncState({
      isSyncing: true,
      lastSyncError: null,
    });

    try {
      // Perform bidirectional sync
      await SyncService.syncDown();
      await SyncService.syncUp();

      // Process sync queue with retry logic
      const queueResult = await SyncService.processSyncQueue();

      // Update state: sync succeeded
      this.updateSyncState({
        isSyncing: false,
        lastSyncAt: Date.now(),
        lastSyncSuccess: true,
        lastSyncError: null,
        syncCount: this.syncState.syncCount + 1,
      });

      console.log(`✅ [${trigger}] Sync completed (${queueResult.syncedRecords} records)`);
    } catch (error: any) {
      // Update state: sync failed
      this.updateSyncState({
        isSyncing: false,
        lastSyncAt: Date.now(),
        lastSyncSuccess: false,
        lastSyncError: error.message || String(error),
      });

      console.error(`❌ [${trigger}] Sync failed:`, error);
    }
  }

  /**
   * Update sync state and notify listeners
   */
  private static updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.notifyListeners();
  }

  /**
   * Add sync state listener
   * Week 8, Day 4: Subscribe to sync state changes
   */
  static addListener(listener: SyncStateListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of sync state change
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.syncState });
      } catch (error) {
        console.error('Error in sync state listener:', error);
      }
    });
  }

  /**
   * Get current sync state
   * Week 8, Day 4: Query sync status
   */
  static getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Manually trigger sync
   * Week 8, Day 4: User-initiated sync
   */
  static async manualSync(): Promise<boolean> {
    try {
      const isConnected = await NetworkMonitor.isConnected();

      if (!isConnected) {
        console.warn('⚠️  Cannot sync: No network connection');
        this.updateSyncState({
          lastSyncError: 'No network connection',
        });
        return false;
      }

      if (this.syncState.isSyncing) {
        console.warn('⚠️  Cannot sync: Already syncing');
        return false;
      }

      await this.performSync('Manual');
      return true;
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return false;
    }
  }

  /**
   * Stop auto-sync (cleanup)
   * Week 8, Day 4: Stop all auto-sync triggers
   */
  static stop(): void {
    console.log('🛑 Stopping AutoSyncManager...');

    // Stop periodic sync
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop network monitoring
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    // Stop app state monitoring
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Clear listeners
    this.listeners = [];

    console.log('✅ AutoSyncManager stopped');
  }

  /**
   * Pause/resume auto-sync
   * Week 8, Day 4: Temporarily disable auto-sync
   */
  static pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏸️  Auto-sync paused');
    }
  }

  static resume(): void {
    if (!this.intervalId) {
      this.startPeriodicSync();
      console.log('▶️  Auto-sync resumed');
    }
  }

  /**
   * Check if auto-sync is running
   */
  static isRunning(): boolean {
    return this.intervalId !== null;
  }
}

export default AutoSyncManager;
