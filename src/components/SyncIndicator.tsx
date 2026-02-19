/**
 * SyncIndicator - Visual sync status indicator
 * Week 8, Day 5: Sync status UI component
 *
 * Features:
 * - Real-time sync status display
 * - Network connection indicator
 * - Last sync timestamp
 * - Sync error display
 * - Manual sync button
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AutoSyncManager, { SyncState } from '../../services/sync/AutoSyncManager';
import NetworkMonitor from '../../services/network/NetworkMonitor';
import { useSnackbar } from './Snackbar';
import { COLORS } from '../theme/colors';

interface SyncIndicatorProps {
  showDetails?: boolean; // Show last sync time and error details
  compact?: boolean; // Compact mode (just icon)
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  showDetails = true,
  compact = false,
}) => {
  const [syncState, setSyncState] = useState<SyncState>(AutoSyncManager.getSyncState());
  const [isConnected, setIsConnected] = useState(true);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    // Subscribe to sync state changes
    const unsubscribeSync = AutoSyncManager.addListener((state) => {
      setSyncState(state);
    });

    // Subscribe to network changes
    const unsubscribeNetwork = NetworkMonitor.addListener((connected) => {
      setIsConnected(connected);
    });

    // Get initial network state
    NetworkMonitor.isConnected().then(setIsConnected);

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isConnected) {
      showSnackbar('No network connection', 'warning');
      return;
    }

    if (syncState.isSyncing) {
      showSnackbar('Sync already in progress', 'info');
      return;
    }

    showSnackbar('Starting sync...', 'info');
    const success = await AutoSyncManager.manualSync();

    if (success) {
      showSnackbar('Sync completed successfully', 'success');
    } else {
      showSnackbar('Sync failed', 'error');
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;

    // Less than 1 minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }

    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours}h ago`;
    }

    // More than 24 hours
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getSyncIcon = (): string => {
    if (!isConnected) return 'cloud-off-outline';
    if (syncState.isSyncing) return 'sync';
    if (!syncState.lastSyncSuccess) return 'cloud-alert';
    return 'cloud-check';
  };

  const getSyncColor = (): string => {
    if (!isConnected) return '#999';
    if (syncState.isSyncing) return COLORS.INFO;
    if (!syncState.lastSyncSuccess) return COLORS.ERROR;
    return COLORS.SUCCESS;
  };

  const getSyncText = (): string => {
    if (!isConnected) return 'Offline';
    if (syncState.isSyncing) return 'Syncing...';
    if (!syncState.lastSyncSuccess) return 'Sync failed';
    return 'Synced';
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handleManualSync} disabled={syncState.isSyncing || !isConnected}>
        <View style={styles.compactContainer}>
          {syncState.isSyncing ? (
            <ActivityIndicator size="small" color={getSyncColor()} />
          ) : (
            <Icon name={getSyncIcon()} size={24} color={getSyncColor()} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleManualSync} disabled={syncState.isSyncing || !isConnected}>
      <View style={styles.container}>
        <View style={styles.statusRow}>
          {syncState.isSyncing ? (
            <ActivityIndicator size="small" color={getSyncColor()} style={styles.icon} />
          ) : (
            <Icon name={getSyncIcon()} size={20} color={getSyncColor()} style={styles.icon} />
          )}

          <Text style={[styles.statusText, { color: getSyncColor() }]}>{getSyncText()}</Text>
        </View>

        {showDetails && (
          <View style={styles.detailsRow}>
            {syncState.lastSyncAt > 0 && (
              <Text style={styles.detailText}>Last sync: {formatTimestamp(syncState.lastSyncAt)}</Text>
            )}

            {syncState.lastSyncError && (
              <Text style={styles.errorText} numberOfLines={1}>
                Error: {syncState.lastSyncError}
              </Text>
            )}

            {syncState.syncCount > 0 && (
              <Text style={styles.detailText}>Total syncs: {syncState.syncCount}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
  },
  compactContainer: {
    padding: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 4,
  },
});

export default SyncIndicator;
