import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';

/**
 * SystemHealthWidget Component
 *
 * Displays system health status including:
 * - Database connection status
 * - Sync service status
 * - Network connectivity
 * - Last backup time
 */

export interface HealthStatus {
  database: 'healthy' | 'degraded' | 'offline';
  sync: 'active' | 'paused' | 'error';
  network: 'online' | 'offline';
  lastBackup?: number; // timestamp
}

export interface SystemHealthWidgetProps {
  /** Health status data */
  health: HealthStatus;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

const STATUS_CONFIG = {
  database: {
    healthy: { color: '#4CAF50', label: 'Healthy', icon: '✓' },
    degraded: { color: '#FF9800', label: 'Degraded', icon: '!' },
    offline: { color: '#F44336', label: 'Offline', icon: '✗' },
  },
  sync: {
    active: { color: '#4CAF50', label: 'Active', icon: '↻' },
    paused: { color: '#FF9800', label: 'Paused', icon: '⏸' },
    error: { color: '#F44336', label: 'Error', icon: '✗' },
  },
  network: {
    online: { color: '#4CAF50', label: 'Online', icon: '●' },
    offline: { color: '#F44336', label: 'Offline', icon: '○' },
  },
};

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  health,
  onPress,
  loading = false,
  error = null,
}) => {
  const formatLastBackup = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const overallStatus = useMemo(() => {
    if (health.database === 'offline' || health.sync === 'error' || health.network === 'offline') {
      return { color: '#F44336', label: 'Critical' };
    }
    if (health.database === 'degraded' || health.sync === 'paused') {
      return { color: '#FF9800', label: 'Warning' };
    }
    return { color: '#4CAF50', label: 'All Systems Operational' };
  }, [health]);

  const accessibilityLabel = useMemo(() => {
    const parts = [
      `System Health: ${overallStatus.label}`,
      `Database: ${STATUS_CONFIG.database[health.database].label}`,
      `Sync: ${STATUS_CONFIG.sync[health.sync].label}`,
      `Network: ${STATUS_CONFIG.network[health.network].label}`,
      `Last backup: ${formatLastBackup(health.lastBackup)}`,
    ];
    return parts.join('. ');
  }, [health, overallStatus]);

  const renderStatusRow = (
    label: string,
    status: string,
    config: { color: string; label: string; icon: string }
  ) => (
    <View style={styles.statusRow} key={label}>
      <Text style={styles.statusLabel}>{label}</Text>
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    </View>
  );

  return (
    <BaseWidget
      title="System Health"
      subtitle={overallStatus.label}
      loading={loading}
      error={error}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view system monitoring"
      headerRight={
        <View style={[styles.overallIndicator, { backgroundColor: overallStatus.color }]} />
      }
    >
      <View style={styles.content}>
        {renderStatusRow('Database', health.database, STATUS_CONFIG.database[health.database])}
        {renderStatusRow('Sync Service', health.sync, STATUS_CONFIG.sync[health.sync])}
        {renderStatusRow('Network', health.network, STATUS_CONFIG.network[health.network])}

        <View style={styles.divider} />

        <View style={styles.backupRow}>
          <Text style={styles.backupLabel}>Last Backup</Text>
          <Text style={styles.backupValue}>{formatLastBackup(health.lastBackup)}</Text>
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  overallIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  backupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backupLabel: {
    fontSize: 13,
    color: '#999',
  },
  backupValue: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});
