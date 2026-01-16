/**
 * ResourceUtilizationWidget Component
 *
 * Resource allocation chart showing over/under allocated resources.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';

// ==================== Types ====================

export interface Resource {
  id: string;
  name: string;
  type: 'labor' | 'equipment' | 'material';
  allocated: number; // percentage
  available: number; // hours or units
  utilized: number; // hours or units
}

export interface ResourceSummary {
  totalResources: number;
  overAllocated: number;
  optimallyAllocated: number;
  underAllocated: number;
}

export interface ResourceUtilizationWidgetProps {
  resources: Resource[];
  summary: ResourceSummary | null;
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const ResourceUtilizationWidget: React.FC<ResourceUtilizationWidgetProps> = ({
  resources,
  summary,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const getAllocationColor = (allocated: number): string => {
    if (allocated > 100) return '#F44336'; // Over-allocated
    if (allocated >= 80) return '#4CAF50'; // Optimal
    if (allocated >= 50) return '#FF9800'; // Under-utilized
    return '#9E9E9E'; // Low utilization
  };

  const getAllocationLabel = (allocated: number): string => {
    if (allocated > 100) return 'Over';
    if (allocated >= 80) return 'Optimal';
    if (allocated >= 50) return 'Under';
    return 'Low';
  };

  const getResourceTypeIcon = (type: string): string => {
    switch (type) {
      case 'labor':
        return 'account-hard-hat';
      case 'equipment':
        return 'excavator';
      case 'material':
        return 'package-variant';
      default:
        return 'help-circle';
    }
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <View
      style={styles.resourceRow}
      accessible
      accessibilityLabel={`${item.name}, ${item.type}, ${item.allocated}% allocated, ${getAllocationLabel(item.allocated)}`}
    >
      <View style={styles.resourceInfo}>
        <View style={styles.resourceHeader}>
          <Icon
            name={getResourceTypeIcon(item.type)}
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.resourceIcon}
          />
          <Text
            variant="bodyMedium"
            style={styles.resourceName}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>

        <View style={styles.allocationContainer}>
          <ProgressBar
            progress={Math.min(item.allocated / 100, 1)}
            color={getAllocationColor(item.allocated)}
            style={styles.progressBar}
          />
          <Text
            variant="labelSmall"
            style={[
              styles.allocationText,
              { color: getAllocationColor(item.allocated) },
            ]}
          >
            {item.allocated}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (!summary || resources.length === 0) {
      return (
        <EmptyState
          icon="account-group"
          title="No Resources Assigned"
          message="Add resources to track allocation and utilization"
          variant="compact"
          actionText="Add Resource"
          onAction={onPress}
        />
      );
    }

    return (
      <View>
        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryItem, { backgroundColor: '#FFEBEE' }]}
            accessible
            accessibilityLabel={`${summary.overAllocated} over-allocated resources`}
          >
            <Icon name="arrow-up-bold" size={14} color="#F44336" />
            <Text variant="labelSmall" style={{ color: '#F44336' }}>
              {summary.overAllocated} Over
            </Text>
          </View>
          <View
            style={[styles.summaryItem, { backgroundColor: '#E8F5E9' }]}
            accessible
            accessibilityLabel={`${summary.optimallyAllocated} optimally allocated resources`}
          >
            <Icon name="check" size={14} color="#4CAF50" />
            <Text variant="labelSmall" style={{ color: '#4CAF50' }}>
              {summary.optimallyAllocated} Optimal
            </Text>
          </View>
          <View
            style={[styles.summaryItem, { backgroundColor: '#FFF3E0' }]}
            accessible
            accessibilityLabel={`${summary.underAllocated} under-allocated resources`}
          >
            <Icon name="arrow-down-bold" size={14} color="#FF9800" />
            <Text variant="labelSmall" style={{ color: '#FF9800' }}>
              {summary.underAllocated} Under
            </Text>
          </View>
        </View>

        {/* Resource List */}
        <FlatList
          data={resources.slice(0, 4)}
          keyExtractor={(item) => item.id}
          renderItem={renderResource}
          scrollEnabled={false}
          accessible
          accessibilityLabel={`Resources, ${resources.length} items`}
        />
      </View>
    );
  };

  return (
    <BaseWidget
      title="Resource Utilization"
      icon="account-group"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={
        summary
          ? `Resource Utilization widget, ${summary.overAllocated} over-allocated, ${summary.optimallyAllocated} optimal`
          : 'Resource Utilization widget, no data'
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 6,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  resourceRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resourceIcon: {
    marginRight: 8,
  },
  resourceName: {
    flex: 1,
    fontWeight: '500',
  },
  allocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  allocationText: {
    width: 36,
    textAlign: 'right',
    fontWeight: '600',
  },
});

export default ResourceUtilizationWidget;
