import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReportSyncStatusProps {
  isOnline: boolean;
  isSyncing: boolean;
}

/**
 * ReportSyncStatus Component
 *
 * Displays the current sync status of reports in the Appbar header.
 * Uses a coloured dot + white text to match the dark header background.
 */
export const ReportSyncStatus: React.FC<ReportSyncStatusProps> = ({
  isOnline,
  isSyncing,
}) => {
  let dotColor: string;
  let label: string;

  if (isSyncing) {
    dotColor = '#FFD54F'; // amber
    label = 'Syncing…';
  } else if (isOnline) {
    dotColor = '#69F0AE'; // light green — visible on dark bg
    label = 'Online';
  } else {
    dotColor = '#FF5252'; // light red
    label = 'Offline';
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
