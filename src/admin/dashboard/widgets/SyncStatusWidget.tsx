import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { COLORS } from '../../../theme/colors';

/**
 * SyncStatusWidget Component
 *
 * Displays sync status including:
 * - Sync queue count
 * - Dead letter queue count
 * - Last sync timestamp
 * - Quick sync action
 */

export interface SyncStatusData {
  isSyncing: boolean;
  lastSyncAt?: number;
  lastSyncSuccess: boolean;
  queueCount: number;
  deadLetterCount: number;
  syncCount: number;
}

export interface SyncStatusWidgetProps {
  /** Sync status data */
  data: SyncStatusData;
  /** Is network connected */
  isConnected: boolean;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Handler for manual sync */
  onSyncPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

export const SyncStatusWidget: React.FC<SyncStatusWidgetProps> = ({
  data,
  isConnected,
  onPress,
  onSyncPress,
  loading = false,
  error = null,
}) => {
  const formatLastSync = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const syncStatus = useMemo(() => {
    if (!isConnected) return { color: COLORS.DISABLED, label: 'Offline', icon: '○' };
    if (data.isSyncing) return { color: COLORS.INFO, label: 'Syncing...', icon: '↻' };
    if (!data.lastSyncSuccess) return { color: COLORS.ERROR, label: 'Failed', icon: '✗' };
    if (data.queueCount > 0) return { color: COLORS.WARNING, label: 'Pending', icon: '!' };
    return { color: COLORS.SUCCESS, label: 'Synced', icon: '✓' };
  }, [data, isConnected]);

  const accessibilityLabel = useMemo(() => {
    const parts = [
      `Sync Status: ${syncStatus.label}`,
      `${data.queueCount} items in queue`,
      `${data.deadLetterCount} failed items`,
      `Last sync: ${formatLastSync(data.lastSyncAt)}`,
      `Total syncs: ${data.syncCount}`,
    ];
    return parts.join('. ');
  }, [data, syncStatus]);

  return (
    <BaseWidget
      title="Sync Status"
      subtitle={syncStatus.label}
      loading={loading}
      error={error}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view sync monitoring"
      headerRight={
        <View style={[styles.statusIndicator, { backgroundColor: syncStatus.color }]}>
          <Text style={styles.statusIcon}>{syncStatus.icon}</Text>
        </View>
      }
    >
      <View style={styles.content}>
        {/* Queue Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[
              styles.statValue,
              data.queueCount > 0 && styles.warningValue,
            ]}>
              {data.queueCount}
            </Text>
            <Text style={styles.statLabel}>Queue</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[
              styles.statValue,
              data.deadLetterCount > 0 && styles.errorValue,
            ]}>
              {data.deadLetterCount}
            </Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{data.syncCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Last Sync */}
        <View style={styles.lastSyncRow}>
          <Text style={styles.lastSyncLabel}>Last sync:</Text>
          <Text style={styles.lastSyncValue}>{formatLastSync(data.lastSyncAt)}</Text>
        </View>

        {/* Sync Button */}
        {onSyncPress && (
          <TouchableOpacity
            style={[
              styles.syncButton,
              (!isConnected || data.isSyncing) && styles.syncButtonDisabled,
            ]}
            onPress={onSyncPress}
            disabled={!isConnected || data.isSyncing}
            accessibilityRole="button"
            accessibilityLabel="Manual sync"
            accessibilityState={{ disabled: !isConnected || data.isSyncing }}
          >
            <Text style={[
              styles.syncButtonText,
              (!isConnected || data.isSyncing) && styles.syncButtonTextDisabled,
            ]}>
              {data.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  warningValue: {
    color: COLORS.WARNING,
  },
  errorValue: {
    color: COLORS.ERROR,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lastSyncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastSyncLabel: {
    fontSize: 13,
    color: '#999',
  },
  lastSyncValue: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  syncButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  syncButtonTextDisabled: {
    color: '#999',
  },
});
