/**
 * BaseWidget Component
 *
 * Consistent wrapper component for all dashboard widgets.
 * Provides loading, error, and refresh states with accessibility support.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ==================== Types ====================

export interface BaseWidgetProps {
  /** Widget title */
  title: string;

  /** Widget icon (MaterialCommunityIcons) */
  icon: string;

  /** Loading state */
  loading?: boolean;

  /** Error message */
  error?: string | null;

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
  onPress,
  onRetry,
  onRefresh,
  accessibilityLabel,
  accessibilityHint,
  children,
}) => {
  const theme = useTheme();

  const defaultAccessibilityLabel = `${title} widget${loading ? ', loading' : ''}${error ? `, error: ${error}` : ''}`;
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
});

export default BaseWidget;
