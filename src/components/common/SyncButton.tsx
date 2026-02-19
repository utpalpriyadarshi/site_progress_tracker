/**
 * SyncButton Component
 *
 * Manual sync button with loading state and visual feedback
 * Shows sync status with color-coded icons
 *
 * Features:
 * - Icon-only or with label variants
 * - Loading animation during sync
 * - Color-coded status (idle, syncing, success, error)
 * - Disabled when offline
 * - Shows pending count
 * - Last sync time display
 *
 * @example
 * ```tsx
 * <SyncButton
 *   syncStatus="idle"
 *   isOnline={isOnline}
 *   pendingCount={5}
 *   onPress={handleSync}
 *   showLabel
 * />
 * ```
 *
 * @version 1.0 - Phase 3, Task 3.5
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Button, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SyncStatus, formatLastSyncTime, getSyncStatusColor, getSyncStatusIcon } from '../../hooks/useOfflineSync';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface SyncButtonProps {
  /** Current sync status */
  syncStatus: SyncStatus;

  /** Is device online */
  isOnline: boolean;

  /** Number of pending items */
  pendingCount?: number;

  /** Last sync timestamp */
  lastSyncTime?: number | null;

  /** Callback when pressed */
  onPress: () => void;

  /** Show label with icon (default: false = icon only) */
  showLabel?: boolean;

  /** Variant: 'icon' | 'button' (default: 'icon') */
  variant?: 'icon' | 'button';

  /** Show pending count badge */
  showPendingCount?: boolean;

  /** Show last sync time */
  showLastSyncTime?: boolean;

  /** Disabled state */
  disabled?: boolean;

  /** Size for icon variant (default: 24) */
  size?: number;
}

// ==================== Component ====================

/**
 * SyncButton Component
 */
export const SyncButton: React.FC<SyncButtonProps> = ({
  syncStatus,
  isOnline,
  pendingCount = 0,
  lastSyncTime,
  onPress,
  showLabel = false,
  variant = 'icon',
  showPendingCount = false,
  showLastSyncTime = false,
  disabled = false,
  size = 24,
}) => {
  const theme = useTheme();

  // Determine if button should be disabled
  const isDisabled = disabled || !isOnline || syncStatus === 'syncing';

  // Get status color and icon - override to orange when offline
  const statusColor = !isOnline ? COLORS.WARNING : getSyncStatusColor(syncStatus);
  const statusIcon = !isOnline ? 'cloud-off-outline' : getSyncStatusIcon(syncStatus);

  // Build label text
  const getLabelText = () => {
    if (syncStatus === 'syncing') return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (pendingCount > 0) return 'Sync Now';
    return 'Sync';
  };

  // Icon variant
  if (variant === 'icon') {
    return (
      <View style={styles.iconContainer}>
        {syncStatus === 'syncing' ? (
          <ActivityIndicator size={size} color={statusColor} style={styles.activityIndicator} />
        ) : (
          <View>
            <IconButton
              icon={statusIcon}
              size={size}
              iconColor={statusColor}
              onPress={onPress}
              disabled={isDisabled}
            />
            {/* Pending Count Badge */}
            {showPendingCount && pendingCount > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                <Text variant="labelSmall" style={styles.badgeText}>
                  {pendingCount > 99 ? '99+' : pendingCount}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Last Sync Time */}
        {showLastSyncTime && lastSyncTime && (
          <Text variant="labelSmall" style={styles.lastSyncText}>
            {formatLastSyncTime(lastSyncTime)}
          </Text>
        )}
      </View>
    );
  }

  // Button variant
  return (
    <View style={styles.buttonContainer}>
      <Button
        mode="outlined"
        onPress={onPress}
        disabled={isDisabled}
        icon={syncStatus === 'syncing' ? undefined : statusIcon}
        loading={syncStatus === 'syncing'}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {showLabel ? getLabelText() : ''}
      </Button>

      {/* Pending Count */}
      {showPendingCount && pendingCount > 0 && (
        <View style={styles.pendingCount}>
          <Icon name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={styles.pendingCountText}>
            {pendingCount} pending
          </Text>
        </View>
      )}

      {/* Last Sync Time */}
      {showLastSyncTime && lastSyncTime && (
        <Text variant="labelSmall" style={[styles.lastSyncText, styles.lastSyncTextButton]}>
          Last sync: {formatLastSyncTime(lastSyncTime)}
        </Text>
      )}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  activityIndicator: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  lastSyncText: {
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    minWidth: 120,
  },
  buttonContent: {
    paddingHorizontal: 8,
  },
  pendingCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  pendingCountText: {
    opacity: 0.7,
  },
  lastSyncTextButton: {
    marginTop: 8,
  },
});
