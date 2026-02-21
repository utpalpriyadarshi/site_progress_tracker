import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Q } from '@nozbe/watermelondb';
import AutoSyncManager from '../../services/sync/AutoSyncManager';
import { database } from '../../models/database';

interface SyncHeaderButtonProps {
  tintColor?: string;
}

/**
 * A header button that triggers a manual sync, reflects syncing state,
 * and shows a badge with the number of pending-sync items.
 */
const SyncHeaderButton: React.FC<SyncHeaderButtonProps> = ({ tintColor = '#FFF' }) => {
  const [isSyncing, setIsSyncing] = useState(() => AutoSyncManager.getSyncState().isSyncing);
  const [pendingCount, setPendingCount] = useState(0);

  // Subscribe to sync state changes
  useEffect(() => {
    return AutoSyncManager.addListener((state) => {
      setIsSyncing(state.isSyncing);
    });
  }, []);

  // Poll pending sync queue every 10 seconds
  useEffect(() => {
    const loadPending = async () => {
      try {
        const count = await database.collections
          .get('sync_queue')
          .query(Q.where('synced_at', Q.eq(null)))
          .fetchCount();
        setPendingCount(count);
      } catch {
        // Ignore errors (e.g. db not ready)
      }
    };

    loadPending();
    const interval = setInterval(loadPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = () => {
    if (!isSyncing) {
      AutoSyncManager.manualSync();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isSyncing}
      style={styles.button}
      accessibilityLabel={
        isSyncing
          ? 'Syncing…'
          : pendingCount > 0
          ? `Sync now — ${pendingCount} pending`
          : 'Sync now'
      }
      accessibilityRole="button"
    >
      <Icon
        name={isSyncing ? 'loading' : 'sync'}
        size={22}
        color={isSyncing ? `${tintColor}80` : tintColor}
      />
      {pendingCount > 0 && !isSyncing && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default SyncHeaderButton;
