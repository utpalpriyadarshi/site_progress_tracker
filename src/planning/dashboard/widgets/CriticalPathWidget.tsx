/**
 * CriticalPathWidget Component
 *
 * Lists critical path items with red indicator and delay impact.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';

// ==================== Constants ====================

/**
 * Risk level priority order for sorting
 * Lower value = higher priority
 */
const RISK_ORDER = {
  high: 0,
  medium: 1,
  low: 2,
} as const;

// ==================== Types ====================

export interface CriticalPathItem {
  id: string;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  delayImpact: number; // days
  progress: number; // 0-100
  dueDate: Date;
}

export interface CriticalPathWidgetProps {
  items: CriticalPathItem[];
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const CriticalPathWidget: React.FC<CriticalPathWidgetProps> = ({
  items,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return theme.colors.outline;
    }
  };

  const getRiskIcon = (risk: string): string => {
    switch (risk) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'check-circle';
      default:
        return 'help-circle';
    }
  };

  // Memoize sorted items to prevent unnecessary re-sorting
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]),
    [items]
  );

  const renderItem = ({ item }: { item: CriticalPathItem }) => (
    <View
      style={styles.itemRow}
      accessible
      accessibilityLabel={`${item.name}, ${item.riskLevel} risk, ${item.progress}% complete, ${item.delayImpact} day delay impact`}
    >
      <View style={styles.riskIndicator}>
        <Icon
          name={getRiskIcon(item.riskLevel)}
          size={18}
          color={getRiskColor(item.riskLevel)}
        />
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text
            variant="bodyMedium"
            style={styles.itemName}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            variant="labelSmall"
            style={[styles.delayImpact, { color: getRiskColor(item.riskLevel) }]}
          >
            {item.delayImpact > 0 ? `+${item.delayImpact}d impact` : 'On track'}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={item.progress / 100}
            color={getRiskColor(item.riskLevel)}
            style={styles.progressBar}
          />
          <Text variant="labelSmall" style={styles.progressText}>
            {item.progress}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon="check-decagram"
          title="No Critical Items"
          message="All tasks are on track with no critical path issues"
          variant="compact"
        />
      );
    }

    return (
      <View>
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryBadge, { backgroundColor: '#FFEBEE' }]}
            accessible
            accessibilityLabel={`${items.filter((i) => i.riskLevel === 'high').length} high risk items`}
          >
            <Icon name="alert-circle" size={14} color="#F44336" />
            <Text variant="labelSmall" style={{ color: '#F44336', marginLeft: 4 }}>
              {items.filter((i) => i.riskLevel === 'high').length} High
            </Text>
          </View>
          <View
            style={[styles.summaryBadge, { backgroundColor: '#FFF3E0' }]}
            accessible
            accessibilityLabel={`${items.filter((i) => i.riskLevel === 'medium').length} medium risk items`}
          >
            <Icon name="alert" size={14} color="#FF9800" />
            <Text variant="labelSmall" style={{ color: '#FF9800', marginLeft: 4 }}>
              {items.filter((i) => i.riskLevel === 'medium').length} Medium
            </Text>
          </View>
        </View>

        <FlatList
          data={sortedItems.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          accessible
          accessibilityLabel={`Critical path items, ${items.length} items`}
        />
      </View>
    );
  };

  return (
    <BaseWidget
      title="Critical Path"
      icon="road-variant"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={`Critical Path widget, ${items.filter((i) => i.riskLevel === 'high').length} high risk items`}
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  riskIndicator: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  delayImpact: {
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressText: {
    width: 32,
    textAlign: 'right',
    opacity: 0.7,
  },
});

export default CriticalPathWidget;
