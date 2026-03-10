/**
 * SyncStatusPanel - Shared Component
 * Display sync status and monitoring information
 *
 * Features:
 * - Online/offline status indicator
 * - Last sync time with relative display
 * - Sync progress bar (if in progress)
 * - Pending changes count
 * - Error count with warnings
 * - Manual sync button
 * - View logs button
 * - Next scheduled sync time
 * - Detailed sync statistics (optional)
 * - Compact and detailed variants
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, ProgressBar, Chip, Divider } from 'react-native-paper';
import type { SyncStatusPanelProps } from '../types';
import { COLORS } from '../../../theme/colors';

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  syncStatus,
  syncDetails,
  onSync,
  onViewLogs,
  showDetails = false,
  variant = 'detailed',
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Auto-refresh current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = currentTime;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get status color
  const getStatusColor = () => {
    if (!syncStatus.isOnline) return COLORS.DISABLED;
    if (syncStatus.syncErrors > 0) return '#f44336';
    if (syncStatus.pendingChanges > 0) return COLORS.WARNING;
    return COLORS.SUCCESS;
  };

  // Get status label
  const getStatusLabel = () => {
    if (!syncStatus.isOnline) return 'OFFLINE';
    if (syncStatus.syncInProgress) return 'SYNCING';
    if (syncStatus.syncErrors > 0) return 'ERRORS';
    if (syncStatus.pendingChanges > 0) return 'PENDING';
    return 'SYNCED';
  };

  // Render compact variant
  if (variant === 'compact') {
    const statusColor = getStatusColor();

    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <View style={styles.compactContainer}>
            {/* Status Indicator */}
            <View style={styles.compactLeft}>
              <View style={styles.compactHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
              </View>
              <Text style={styles.lastSyncCompact}>
                {formatRelativeTime(syncStatus.lastSyncTime)}
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.compactRight}>
              {syncStatus.pendingChanges > 0 && (
                <Chip
                  mode="flat"
                  style={styles.pendingChip}
                  textStyle={styles.pendingText}
                  compact
                >
                  {syncStatus.pendingChanges}
                </Chip>
              )}
              {onSync && !syncStatus.syncInProgress && (
                <Button mode="text" onPress={onSync} compact>
                  Sync
                </Button>
              )}
            </View>
          </View>

          {/* Progress Bar (if syncing) */}
          {syncStatus.syncInProgress && (
            <ProgressBar indeterminate color={statusColor} style={styles.progressBar} />
          )}
        </Card.Content>
      </Card>
    );
  }

  // Render detailed variant
  const statusColor = getStatusColor();

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Sync Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {getStatusLabel()}
              </Text>
            </View>
          </View>
          <Chip
            mode="flat"
            style={[styles.onlineChip, { backgroundColor: statusColor + '20' }]}
            textStyle={[styles.onlineText, { color: statusColor }]}
            icon={syncStatus.isOnline ? 'cloud-check' : 'cloud-off'}
          >
            {syncStatus.isOnline ? 'ONLINE' : 'OFFLINE'}
          </Chip>
        </View>

        {/* Sync Progress (if in progress) */}
        {syncStatus.syncInProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Syncing data...</Text>
            <ProgressBar indeterminate color={statusColor} style={styles.progressBar} />
          </View>
        )}

        {/* Last Sync Time */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Sync</Text>
          <Text style={styles.infoValue}>
            {formatRelativeTime(syncStatus.lastSyncTime)}
            <Text style={styles.infoSubtext}> ({formatDate(syncStatus.lastSyncTime)})</Text>
          </Text>
        </View>

        {/* Next Sync Time */}
        {syncStatus.nextSyncTime && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Sync</Text>
            <Text style={styles.infoValue}>
              {formatRelativeTime(Date.now() + (syncStatus.nextSyncTime - Date.now()))}
            </Text>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{syncStatus.pendingChanges}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, syncStatus.syncErrors > 0 && styles.errorValue]}>
              {syncStatus.syncErrors}
            </Text>
            <Text style={styles.statLabel}>Errors</Text>
          </View>
        </View>

        {/* Detailed Sync Information */}
        {showDetails && syncDetails && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Last Sync Details</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{syncDetails.uploadedRecords}</Text>
                  <Text style={styles.detailLabel}>Uploaded</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{syncDetails.downloadedRecords}</Text>
                  <Text style={styles.detailLabel}>Downloaded</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailValue}>{syncDetails.conflictsResolved}</Text>
                  <Text style={styles.detailLabel}>Conflicts</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailValue, syncDetails.failedRecords > 0 && styles.errorValue]}>
                    {syncDetails.failedRecords}
                  </Text>
                  <Text style={styles.detailLabel}>Failed</Text>
                </View>
              </View>
              <Text style={styles.durationText}>
                Duration: {formatDuration(syncDetails.syncDuration)}
              </Text>
            </View>
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {onSync && (
            <Button
              mode="contained"
              onPress={onSync}
              disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
              style={styles.actionButton}
              icon="sync"
            >
              {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
          {onViewLogs && (
            <Button
              mode="outlined"
              onPress={onViewLogs}
              style={styles.actionButton}
              icon="text-box"
            >
              View Logs
            </Button>
          )}
        </View>

        {/* Error Warning */}
        {syncStatus.syncErrors > 0 && (
          <View style={styles.errorWarning}>
            <Text style={styles.errorWarningText}>
              ⚠️ {syncStatus.syncErrors} sync error{syncStatus.syncErrors > 1 ? 's' : ''} detected. Check logs for details.
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },

  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastSyncCompact: {
    fontSize: 12,
    color: '#666',
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingChip: {
    backgroundColor: COLORS.WARNING,
  },
  pendingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Detailed variant styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  onlineChip: {
    alignSelf: 'flex-start',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Progress section
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 11,
    color: '#999',
    fontWeight: '400',
  },

  divider: {
    marginVertical: 12,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.INFO,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorValue: {
    color: '#f44336',
  },

  // Details section
  detailsSection: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.INFO,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },

  // Error warning
  errorWarning: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorWarningText: {
    fontSize: 12,
    color: '#e65100',
  },
});
