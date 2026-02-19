/**
 * OfflineIndicator Component
 *
 * Persistent indicator for offline mode with sync queue counter
 * Appears at the top of screens when device is offline
 *
 * Features:
 * - Shows when offline with visual feedback
 * - Displays pending sync count
 * - Animated slide-in/out transition
 * - Color-coded status (offline = warning, pending = info)
 * - Tap to trigger manual sync
 *
 * @example
 * ```tsx
 * <OfflineIndicator
 *   isOnline={isOnline}
 *   pendingCount={pendingCount}
 *   onSync={handleSync}
 * />
 * ```
 *
 * @version 1.0 - Phase 3, Task 3.5
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface OfflineIndicatorProps {
  /** Is device currently online */
  isOnline: boolean;

  /** Number of items pending sync */
  pendingCount: number;

  /** Callback when user taps to sync */
  onSync?: () => void;

  /** Show even when online but have pending items */
  showWhenPending?: boolean;

  /** Custom message when offline */
  offlineMessage?: string;

  /** Custom message when pending */
  pendingMessage?: string;
}

// ==================== Component ====================

/**
 * OfflineIndicator Component
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  pendingCount,
  onSync,
  showWhenPending = true,
  offlineMessage = 'You are offline',
  pendingMessage,
}) => {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  // Determine if indicator should be visible
  const shouldShow = !isOnline || (showWhenPending && pendingCount > 0);

  // Determine indicator type
  const isOffline = !isOnline;
  const hasPending = pendingCount > 0;

  // Slide animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: shouldShow ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [shouldShow, slideAnim]);

  // Don't render if not needed
  if (!shouldShow) {
    return null;
  }

  // Determine colors and icon based on state
  const backgroundColor = isOffline
    ? theme.colors.errorContainer || COLORS.ERROR_BG
    : hasPending
    ? theme.colors.tertiaryContainer || COLORS.INFO_BG
    : theme.colors.surfaceVariant || '#F5F5F5';

  const textColor = isOffline
    ? theme.colors.onErrorContainer || '#C62828'
    : hasPending
    ? theme.colors.onTertiaryContainer || '#01579B'
    : theme.colors.onSurfaceVariant || '#666';

  const iconName = isOffline ? 'wifi-off' : hasPending ? 'cloud-sync-outline' : 'cloud-check';

  // Build message - show pending count even when offline
  const message = isOffline && hasPending
    ? `You're offline. ${pendingCount} item${pendingCount !== 1 ? 's' : ''} will sync automatically when reconnected.`
    : isOffline
    ? offlineMessage
    : hasPending
    ? pendingMessage || `${pendingCount} item${pendingCount !== 1 ? 's' : ''} pending sync...`
    : 'All synced';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onSync}
        disabled={!onSync || isOffline}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {/* Icon */}
          <Icon name={iconName} size={20} color={textColor} style={styles.icon} />

          {/* Message */}
          <Text variant="bodyMedium" style={[styles.message, { color: textColor }]}>
            {message}
          </Text>

          {/* Pending Count Badge */}
          {hasPending && (
            <View style={[styles.badge, { backgroundColor: textColor }]}>
              <Text variant="labelSmall" style={[styles.badgeText, { color: backgroundColor }]}>
                {pendingCount}
              </Text>
            </View>
          )}

          {/* Sync Action Hint */}
          {!isOffline && onSync && (
            <Text variant="labelSmall" style={[styles.hint, { color: textColor }]}>
              Tap to sync
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  touchable: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontWeight: '500',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  hint: {
    marginLeft: 12,
    opacity: 0.8,
    fontStyle: 'italic',
  },
});
