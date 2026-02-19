import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';

export interface BaseWidgetProps {
  id: string;
  title: string;
  subtitle?: string;
  refreshable?: boolean;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  loading?: boolean;
  error?: Error | null;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  testID?: string;
}

/**
 * BaseWidget - Foundation component for all dashboard widgets
 *
 * Provides consistent styling, loading states, error handling, and refresh
 * functionality for all dashboard widgets.
 *
 * Features:
 * - Loading state with spinner
 * - Error state with retry
 * - Optional refresh functionality
 * - Consistent accessibility props
 * - Size variants (small, medium, large)
 */
export const BaseWidget: React.FC<BaseWidgetProps> = ({
  id,
  title,
  subtitle,
  refreshable = false,
  onRefresh,
  onPress,
  loading = false,
  error = null,
  children,
  size = 'medium',
  testID,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderContent = () => {
    if (loading || isRefreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>Failed to load data</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {refreshable && onRefresh && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return children;
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card
        style={[styles.card, styles[`${size}Card`]]}
        accessible
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${onPress ? '. Double tap to navigate' : ''}`}
        testID={testID || `widget-${id}`}
      >
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {refreshable && onRefresh && !loading && !error && (
              <TouchableOpacity
                onPress={handleRefresh}
                disabled={isRefreshing}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Refresh ${title}`}
                accessibilityHint="Double tap to refresh widget data"
              >
                <Text style={styles.refreshIcon}>{isRefreshing ? '⏳' : '🔄'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {renderContent()}
        </Card.Content>
      </Card>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    marginBottom: 12,
  },
  smallCard: {
    minHeight: 120,
  },
  mediumCard: {
    minHeight: 180,
  },
  largeCard: {
    minHeight: 260,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  refreshIcon: {
    fontSize: 20,
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
