import React from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SyncStatus } from '../../hooks/useOfflineSync';

interface HeaderSyncButtonProps {
  syncStatus: SyncStatus;
  isOnline: boolean;
  pendingCount?: number;
  onPress: () => void;
}

/**
 * HeaderSyncButton
 *
 * A sync action button styled for dark Appbar headers.
 * Uses white icon + coloured dot — consistent with the dark primary header.
 *
 * States:
 *   syncing  → white ActivityIndicator
 *   offline  → faded white cloud-off icon (disabled)
 *   pending  → white cloud-upload icon + amber dot
 *   idle     → white cloud-check icon + green dot
 *   error    → white cloud-alert icon + red dot
 */
export const HeaderSyncButton: React.FC<HeaderSyncButtonProps> = ({
  syncStatus,
  isOnline,
  pendingCount = 0,
  onPress,
}) => {
  const isDisabled = !isOnline || syncStatus === 'syncing';

  if (syncStatus === 'syncing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={20} color="#FFFFFF" />
      </View>
    );
  }

  let iconName: string;
  let dotColor: string;

  if (!isOnline) {
    iconName = 'cloud-off-outline';
    dotColor = '#FF5252';
  } else if (syncStatus === 'error') {
    iconName = 'cloud-alert';
    dotColor = '#FF5252';
  } else if (pendingCount > 0) {
    iconName = 'cloud-upload-outline';
    dotColor = '#FFD54F';
  } else if (syncStatus === 'success') {
    iconName = 'cloud-check-outline';
    dotColor = '#69F0AE';
  } else {
    iconName = 'cloud-sync-outline';
    dotColor = '#69F0AE';
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      <Icon
        name={iconName}
        size={22}
        color={isDisabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
      />
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
