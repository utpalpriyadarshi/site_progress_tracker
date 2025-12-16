import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

interface ReportSyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
}

/**
 * ReportSyncStatus Component
 *
 * Displays the current sync status of reports
 * Shows one of three states: Syncing, Online, or Offline
 */
export const ReportSyncStatus: React.FC<ReportSyncStatusProps> = ({
  isOnline,
  isSyncing,
}) => {
  if (isSyncing) {
    return (
      <View style={styles.container}>
        <Chip icon="sync" mode="outlined">
          Syncing...
        </Chip>
      </View>
    );
  }

  if (isOnline) {
    return (
      <View style={styles.container}>
        <Chip icon="cloud-check" mode="outlined" style={styles.onlineChip}>
          Online
        </Chip>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Chip icon="cloud-off-outline" mode="outlined" style={styles.offlineChip}>
        Offline
      </Chip>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineChip: {
    backgroundColor: '#E8F5E9',
  },
  offlineChip: {
    backgroundColor: '#FFEBEE',
  },
});
