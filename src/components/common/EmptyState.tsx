/**
 * EmptyState Component
 *
 * Displays empty state with icon, title, message, and optional action
 * Used when lists or screens have no data to display
 *
 * Features:
 * - Large icon display
 * - Title and message text
 * - Optional action button
 * - Centered layout
 * - Customizable styling
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="inbox"
 *   title="No Reports Yet"
 *   message="Create your first daily report by tapping the + button below"
 *   actionText="Create Report"
 *   onAction={() => openCreateDialog()}
 * />
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.4
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ==================== Types ====================

export interface EmptyStateProps {
  /** Icon name (MaterialCommunityIcons) */
  icon: string;

  /** Main title text */
  title: string;

  /** Descriptive message */
  message: string;

  /** Optional action button text */
  actionText?: string;

  /** Optional action button callback */
  onAction?: () => void;

  /** Icon size (default: 64) */
  iconSize?: number;

  /** Icon color (default: theme disabled color) */
  iconColor?: string;

  /** Custom container style */
  containerStyle?: any;
}

// ==================== Component ====================

/**
 * EmptyState Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionText,
  onAction,
  iconSize = 64,
  iconColor,
  containerStyle,
}) => {
  const theme = useTheme();
  const defaultIconColor = iconColor || theme.colors.onSurfaceDisabled;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Icon */}
      <Icon name={icon} size={iconSize} color={defaultIconColor} style={styles.icon} />

      {/* Title */}
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>

      {/* Message */}
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>

      {/* Action Button */}
      {actionText && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
});
