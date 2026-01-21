/**
 * BaseWidget Component
 *
 * Consistent wrapper component for all Logistics dashboard widgets.
 * Provides loading, error, empty, and refresh states with accessibility support.
 *
 * Phase 3 Task 3.3: Enhanced Empty States
 * - Context-aware empty state support
 * - Helpful messaging and action buttons
 * - Compact variant for widget display
 *
 * @version 1.1.0
 * @since Logistics Phase 3
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ==================== Types ====================

export interface WidgetEmptyStateProps {
  /** Icon name for empty state */
  icon: string;
  /** Empty state title */
  title: string;
  /** Empty state message */
  message: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Optional action callback */
  onAction?: () => void;
}

export interface BaseWidgetProps {
  /** Widget title */
  title: string;

  /** Widget icon (MaterialCommunityIcons) */
  icon: string;

  /** Loading state */
  loading?: boolean;

  /** Error message */
  error?: string | null;

  /** Empty state configuration (shown when isEmpty is true) */
  emptyState?: WidgetEmptyStateProps;

  /** Whether the widget data is empty */
  isEmpty?: boolean;

  /** Callback when widget is tapped */
  onPress?: () => void;

  /** Callback for retry on error */
  onRetry?: () => void;

  /** Callback for refresh */
  onRefresh?: () => void;

  /** Custom accessibility label */
  accessibilityLabel?: string;

  /** Custom accessibility hint */
  accessibilityHint?: string;

  /** Widget content */
  children: React.ReactNode;
}

// ==================== Component ====================

export const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  icon,
  loading = false,
  error = null,
  emptyState,
  isEmpty = false,
  onPress,
  onRetry,
  onRefresh,
  accessibilityLabel,
  accessibilityHint,
  children,
}) => {
  const theme = useTheme();

  const defaultAccessibilityLabel = `${title} widget${loading ? ', loading' : ''}${error ? `, error: ${error}` : ''}${isEmpty ? ', no data' : ''}`;
  const defaultAccessibilityHint = onPress ? 'Double tap to view details' : undefined;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={styles.loadingText}>
            Loading...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={32} color={theme.colors.error} />
          <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              style={styles.retryButton}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Retry loading"
            >
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                Tap to Retry
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    // Empty state handling
    if (isEmpty && emptyState) {
      return (
        <View
          style={styles.emptyStateContent}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${emptyState.title}. ${emptyState.message}`}
        >
          <Icon
            name={emptyState.icon}
            size={36}
            color={theme.colors.onSurfaceDisabled}
            style={styles.emptyIcon}
          />
          <Text variant="titleSmall" style={styles.emptyTitle}>
            {emptyState.title}
          </Text>
          <Text variant="bodySmall" style={styles.emptyMessage}>
            {emptyState.message}
          </Text>
          {emptyState.actionLabel && emptyState.onAction && (
            <Pressable
              onPress={emptyState.onAction}
              style={styles.emptyActionButton}
              accessible
              accessibilityRole="button"
              accessibilityLabel={emptyState.actionLabel}
              accessibilityHint="Double tap to perform this action"
            >
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {emptyState.actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      );
    }

    return children;
  };

  const CardContent = () => (
    <Card style={styles.card} mode="elevated">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon
            name={icon}
            size={20}
            color={theme.colors.primary}
            style={styles.icon}
          />
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>
        {onRefresh && !loading && !error && (
          <IconButton
            icon="refresh"
            size={18}
            onPress={onRefresh}
            accessible
            accessibilityLabel={`Refresh ${title}`}
            accessibilityRole="button"
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </Card>
  );

  if (onPress && !loading && !error) {
    return (
      <Pressable
        onPress={onPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
        accessibilityHint={accessibilityHint || defaultAccessibilityHint}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        <CardContent />
      </Pressable>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel || defaultAccessibilityLabel}
    >
      <CardContent />
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
  },
  pressable: {
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    minHeight: 80,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    opacity: 0.6,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    padding: 8,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptyIcon: {
    marginBottom: 8,
    opacity: 0.6,
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.8,
  },
  emptyMessage: {
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 18,
    maxWidth: 200,
  },
  emptyActionButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});

export default BaseWidget;
