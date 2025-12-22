/**
 * LoadingOverlay Component
 *
 * Full-screen loading overlay with spinner and message
 * Blocks user interaction while async operations are in progress
 *
 * Features:
 * - Full-screen semi-transparent overlay
 * - Activity indicator
 * - Optional loading message
 * - Portal-based rendering (appears above all content)
 * - Blocks touches
 *
 * @example
 * ```tsx
 * <LoadingOverlay
 *   visible={isSubmitting}
 *   message="Submitting report..."
 * />
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.4
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, ActivityIndicator, Text, useTheme } from 'react-native-paper';

// ==================== Types ====================

export interface LoadingOverlayProps {
  /** Overlay visibility */
  visible: boolean;

  /** Optional loading message */
  message?: string;

  /** Optional sub-message (Phase B: for additional context) */
  subMessage?: string;

  /** Indicator size (default: 'large') */
  size?: 'small' | 'large' | number;

  /** Custom indicator color */
  indicatorColor?: string;

  /** Overlay background opacity (default: 0.7) */
  overlayOpacity?: number;
}

// ==================== Component ====================

/**
 * LoadingOverlay Component
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  subMessage,
  size = 'large',
  indicatorColor,
  overlayOpacity = 0.7,
}) => {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Portal>
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          },
        ]}
      >
        <View style={styles.container}>
          {/* Activity Indicator */}
          <ActivityIndicator
            size={size}
            color={indicatorColor || theme.colors.primary}
            style={styles.indicator}
          />

          {/* Loading Message */}
          {message && (
            <Text variant="bodyLarge" style={styles.message}>
              {message}
            </Text>
          )}

          {/* Sub-message (Phase B: additional context) */}
          {subMessage && (
            <Text variant="bodySmall" style={styles.subMessage}>
              {subMessage}
            </Text>
          )}
        </View>
      </View>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  indicator: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    color: '#333',
  },
  subMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontSize: 12,
  },
});
