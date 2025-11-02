/**
 * SyncMonitoringScreen - Admin sync monitoring and management
 * Week 8, Day 5: Admin screen for sync monitoring
 *
 * Features:
 * - Real-time sync status
 * - Sync queue view
 * - Dead letter queue management
 * - Manual sync controls
 * - Network status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../models/database';
import SyncQueueModel from '../../models/SyncQueueModel';
import { SyncService } from '../../services/sync/SyncService';
import AutoSyncManager, { SyncState } from '../../services/sync/AutoSyncManager';
import NetworkMonitor from '../../services/network/NetworkMonitor';
import { useSnackbar } from '../components/Snackbar';
import { Q } from '@nozbe/watermelondb';

export const SyncMonitoringScreen: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(AutoSyncManager.getSyncState());
  const [isConnected, setIsConnected] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [deadLetterCount, setDeadLetterCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadData();

    // Subscribe to sync state changes
    const unsubscribeSync = AutoSyncManager.addListener((state) => {
      setSyncState(state);
    });

    // Subscribe to network changes
    const unsubscribeNetwork = NetworkMonitor.addListener((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubscribeSync();
      unsubscribeNetwork();
    };
  }, []);

  const loadData = async () => {
    try {
      // Get sync queue count
      const queueItems = await database.collections
        .get<SyncQueueModel>('sync_queue')
        .query(Q.where('synced_at', null))
        .fetchCount();
      setQueueCount(queueItems);

      // Get dead letter queue count
      const deadLetterItems = await SyncService.getDeadLetterQueue();
      setDeadLetterCount(deadLetterItems.length);

      // Get network status
      const connected = await NetworkMonitor.isConnected();
      setIsConnected(connected);
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleManualSync = async () => {
    if (!isConnected) {
      showSnackbar('No network connection', 'warning');
      return;
    }

    showSnackbar('Starting manual sync...', 'info');
    const success = await AutoSyncManager.manualSync();

    if (success) {
      showSnackbar('Sync completed', 'success');
      await loadData();
    } else {
      showSnackbar('Sync failed', 'error');
    }
  };

  const handleProcessQueue = async () => {
    if (!isConnected) {
      showSnackbar('No network connection', 'warning');
      return;
    }

    showSnackbar('Processing sync queue...', 'info');
    const result = await SyncService.processSyncQueue();

    if (result.success) {
      showSnackbar(`Processed ${result.syncedRecords} items`, 'success');
      await loadData();
    } else {
      showSnackbar(`Failed: ${result.message}`, 'error');
    }
  };

  const handleClearDeadLetter = async () => {
    const count = await SyncService.clearDeadLetterQueue();
    showSnackbar(`Cleared ${count} dead letter items`, 'success');
    await loadData();
  };

  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getSyncStatusColor = (): string => {
    if (!isConnected) return '#999';
    if (syncState.isSyncing) return '#2196F3';
    if (!syncState.lastSyncSuccess) return '#F44336';
    return '#4CAF50';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.title}>Sync Monitoring</Text>

      {/* Network Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name={isConnected ? 'wifi' : 'wifi-off'} size={24} color={isConnected ? '#4CAF50' : '#999'} />
            <Text style={styles.cardTitle}>Network Status</Text>
          </View>

          <View style={styles.statusRow}>
            <Chip mode="flat" style={{ backgroundColor: isConnected ? '#E8F5E9' : '#F5F5F5' }}>
              {isConnected ? 'Online' : 'Offline'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Sync Status Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="sync" size={24} color={getSyncStatusColor()} />
            <Text style={styles.cardTitle}>Sync Status</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Chip mode="flat" style={{ backgroundColor: getSyncStatusColor() + '20' }}>
              {syncState.isSyncing ? 'Syncing' : syncState.lastSyncSuccess ? 'Synced' : 'Failed'}
            </Chip>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Last Sync:</Text>
            <Text style={styles.value}>{formatTimestamp(syncState.lastSyncAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Syncs:</Text>
            <Text style={styles.value}>{syncState.syncCount}</Text>
          </View>

          {syncState.lastSyncError && (
            <View style={styles.errorRow}>
              <Icon name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.errorText}>{syncState.lastSyncError}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Sync Queue Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="format-list-bulleted" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Sync Queue</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Pending Items:</Text>
            <Chip mode="flat" style={{ backgroundColor: queueCount > 0 ? '#FFF3E0' : '#E8F5E9' }}>
              {queueCount}
            </Chip>
          </View>

          <Button
            mode="contained"
            onPress={handleProcessQueue}
            disabled={!isConnected || queueCount === 0}
            icon="play"
            style={styles.button}
          >
            Process Queue
          </Button>
        </Card.Content>
      </Card>

      {/* Dead Letter Queue Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="skull" size={24} color="#F44336" />
            <Text style={styles.cardTitle}>Dead Letter Queue</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Failed Items:</Text>
            <Chip mode="flat" style={{ backgroundColor: deadLetterCount > 0 ? '#FFEBEE' : '#E8F5E9' }}>
              {deadLetterCount}
            </Chip>
          </View>

          <Text style={styles.helpText}>
            Items that failed after 10 retry attempts are moved here for manual review.
          </Text>

          <Button
            mode="outlined"
            onPress={handleClearDeadLetter}
            disabled={deadLetterCount === 0}
            icon="delete"
            style={styles.button}
            textColor="#F44336"
          >
            Clear Dead Letter Queue
          </Button>
        </Card.Content>
      </Card>

      {/* Manual Controls Card */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="cog" size={24} color="#673AB7" />
            <Text style={styles.cardTitle}>Manual Controls</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleManualSync}
            disabled={!isConnected || syncState.isSyncing}
            icon="sync"
            style={styles.button}
          >
            Manual Sync
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              AutoSyncManager.pause();
              showSnackbar('Auto-sync paused', 'info');
            }}
            icon="pause"
            style={styles.button}
          >
            Pause Auto-Sync
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              AutoSyncManager.resume();
              showSnackbar('Auto-sync resumed', 'success');
            }}
            icon="play"
            style={styles.button}
          >
            Resume Auto-Sync
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#FFF',
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  statusRow: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 8,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 12,
  },
});

export default SyncMonitoringScreen;
