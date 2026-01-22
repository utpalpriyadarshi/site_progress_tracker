import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';

/**
 * BaseWidget Component
 *
 * Base component for all dashboard widgets with:
 * - Consistent styling and layout
 * - Loading, error, and empty states
 * - Accessibility support
 * - Interactive tap handlers
 *
 * @example
 * ```tsx
 * <BaseWidget
 *   title="Budget Health"
 *   subtitle="Current period"
 *   onPress={() => navigation.navigate('BudgetManagement')}
 *   accessibilityLabel="Budget health widget"
 *   accessibilityHint="Tap to view budget details"
 * >
 *   <BudgetHealthContent data={data} />
 * </BaseWidget>
 * ```
 */

export interface BaseWidgetProps {
  /** Widget title */
  title: string;
  /** Optional subtitle (e.g., period info) */
  subtitle?: string;
  /** Loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether the widget has no data */
  isEmpty?: boolean;
  /** Message to show when empty */
  emptyMessage?: string;
  /** Icon to display in empty state */
  emptyIcon?: string;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Handler for refresh action */
  onRefresh?: () => void;
  /** Accessibility label for the widget */
  accessibilityLabel?: string;
  /** Accessibility hint describing the action */
  accessibilityHint?: string;
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Header right action (e.g., refresh button) */
  headerRight?: React.ReactNode;
  /** Widget content */
  children: React.ReactNode;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({
  title,
  subtitle,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available',
  emptyIcon = '📊',
  onPress,
  onRefresh,
  accessibilityLabel,
  accessibilityHint,
  style,
  headerRight,
  children,
}) => {
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.stateText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          {onRefresh && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              accessibilityRole="button"
              accessibilityLabel="Retry loading data"
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyIcon}>{emptyIcon}</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return children;
  };

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        accessibilityRole: 'button' as const,
        accessibilityLabel: accessibilityLabel || title,
        accessibilityHint: accessibilityHint || 'Tap to view details',
      }
    : {
        accessibilityRole: 'region' as const,
        accessibilityLabel: accessibilityLabel || title,
      };

  return (
    <Container style={[styles.container, style]} {...containerProps}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    minHeight: 60,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
