/**
 * NetworkMonitor - Network connectivity monitoring service
 * Week 8, Day 3: NetInfo integration for network state management
 *
 * Features:
 * - Real-time network state monitoring
 * - Connection type detection (wifi, cellular, none)
 * - Network change listeners
 * - Sync trigger on network restore
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { SyncService } from '../sync/SyncService';
import TokenStorage from '../storage/TokenStorage';

type NetworkListener = (isConnected: boolean, connectionType: string) => void;

export class NetworkMonitor {
  private static listeners: NetworkListener[] = [];
  private static currentState: NetInfoState | null = null;
  private static unsubscribe: (() => void) | null = null;
  private static autoSyncEnabled: boolean = true;

  /**
   * Initialize network monitoring
   * Week 8, Day 3: Start listening to network changes
   */
  static initialize(): void {
    console.log('📡 Initializing network monitor...');

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      this.handleNetworkChange(state);
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.currentState = state;
      console.log(`📡 Initial network state: ${this.getConnectionInfo(state)}`);
    });
  }

  /**
   * Handle network state changes
   * Week 8, Day 3: Trigger sync when network is restored
   */
  private static handleNetworkChange(state: NetInfoState): void {
    const wasConnected = this.currentState?.isConnected || false;
    const isConnected = state.isConnected || false;

    // Log network change
    console.log(`📡 Network changed: ${this.getConnectionInfo(state)}`);

    // Notify all listeners
    this.notifyListeners(isConnected, state.type);

    // Trigger auto-sync when network is restored (offline → online)
    if (!wasConnected && isConnected && this.autoSyncEnabled) {
      console.log('🔄 Network restored! Triggering auto-sync...');
      this.triggerAutoSync();
    }

    // Update current state
    this.currentState = state;
  }

  /**
   * Trigger automatic sync when network is available
   * Week 8, Day 3: Auto-sync on network restore
   * Fix: Week 8, Day 5 - Check authentication first
   */
  private static async triggerAutoSync(): Promise<void> {
    try {
      // Check if user is authenticated
      const accessToken = await TokenStorage.getAccessToken();
      if (!accessToken) {
        console.log('🔄 Auto-sync skipped: Not authenticated');
        return;
      }

      // Wait a moment for network to stabilize
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔄 Starting auto-sync (network restored)...');

      // Run bidirectional sync
      await SyncService.syncDown();
      await SyncService.syncUp();

      console.log('✅ Auto-sync completed successfully');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  }

  /**
   * Get formatted connection information
   */
  private static getConnectionInfo(state: NetInfoState): string {
    if (!state.isConnected) {
      return 'Offline';
    }

    const type = state.type.toUpperCase();
    const details = state.details as any;

    if (details?.cellularGeneration) {
      return `${type} (${details.cellularGeneration})`;
    }

    return type;
  }

  /**
   * Add network change listener
   * Week 8, Day 3: Subscribe to network changes
   */
  static addListener(listener: NetworkListener): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of network change
   */
  private static notifyListeners(isConnected: boolean, connectionType: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(isConnected, connectionType);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Check if currently connected to network
   * Week 8, Day 3: Query current network state
   */
  static async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected || false;
  }

  /**
   * Get current network state
   * Week 8, Day 3: Detailed network information
   */
  static async getNetworkState(): Promise<{
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean | null;
    details: any;
  }> {
    const state = await NetInfo.fetch();

    return {
      isConnected: state.isConnected || false,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      details: state.details,
    };
  }

  /**
   * Enable/disable auto-sync on network restore
   * Week 8, Day 3: Toggle auto-sync behavior
   */
  static setAutoSyncEnabled(enabled: boolean): void {
    this.autoSyncEnabled = enabled;
    console.log(`📡 Auto-sync ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if auto-sync is enabled
   */
  static isAutoSyncEnabled(): boolean {
    return this.autoSyncEnabled;
  }

  /**
   * Clean up network monitoring
   * Week 8, Day 3: Stop listening to network changes
   */
  static cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.listeners = [];
    this.currentState = null;

    console.log('📡 Network monitor cleaned up');
  }

  /**
   * Manually trigger sync if network is available
   * Week 8, Day 3: User-initiated sync
   * Fix: Week 8, Day 5 - Check authentication first
   */
  static async manualSync(): Promise<boolean> {
    try {
      // Check if user is authenticated
      const accessToken = await TokenStorage.getAccessToken();
      if (!accessToken) {
        console.log('🔄 Manual sync skipped: Not authenticated');
        return false;
      }

      const isConnected = await this.isConnected();

      if (!isConnected) {
        console.warn('⚠️  Cannot sync: No network connection');
        return false;
      }

      console.log('🔄 Starting manual sync...');
      await SyncService.syncDown();
      await SyncService.syncUp();
      console.log('✅ Manual sync completed');

      return true;
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      return false;
    }
  }
}

export default NetworkMonitor;
