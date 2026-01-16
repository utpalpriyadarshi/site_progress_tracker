/**
 * UpcomingMilestonesWidget Component
 *
 * Shows next 5 milestones with dates and visual timeline indicator.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';

// ==================== Types ====================

export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: string;
  daysRemaining: number;
}

export interface UpcomingMilestonesWidgetProps {
  milestones: Milestone[];
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const UpcomingMilestonesWidget: React.FC<UpcomingMilestonesWidgetProps> = ({
  milestones,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemainingColor = (days: number): string => {
    if (days < 0) return theme.colors.error;
    if (days <= 7) return '#FF9800';
    if (days <= 14) return '#FFC107';
    return theme.colors.primary;
  };

  const renderMilestone = ({ item, index }: { item: Milestone; index: number }) => (
    <View
      accessible
      accessibilityLabel={`${item.name}, due ${formatDate(item.dueDate)}, ${item.daysRemaining} days remaining, status ${item.status}`}
    >
      <View style={styles.milestoneRow}>
        <View style={styles.timelineIndicator}>
          <View
            style={[
              styles.dot,
              { backgroundColor: getDaysRemainingColor(item.daysRemaining) },
            ]}
          />
          {index < milestones.length - 1 && (
            <View style={[styles.line, { backgroundColor: theme.colors.outlineVariant }]} />
          )}
        </View>

        <View style={styles.milestoneContent}>
          <View style={styles.milestoneHeader}>
            <Text
              variant="bodyMedium"
              style={styles.milestoneName}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <StatusBadge status={item.status} size="small" />
          </View>

          <View style={styles.milestoneDetails}>
            <View style={styles.dateContainer}>
              <Icon name="calendar" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.dateText}>
                {formatDate(item.dueDate)}
              </Text>
            </View>

            <Text
              variant="labelSmall"
              style={[
                styles.daysRemaining,
                { color: getDaysRemainingColor(item.daysRemaining) },
              ]}
            >
              {item.daysRemaining < 0
                ? `${Math.abs(item.daysRemaining)}d overdue`
                : `${item.daysRemaining}d remaining`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (milestones.length === 0) {
      return (
        <EmptyState
          icon="flag-checkered"
          title="No Upcoming Milestones"
          message="Create milestones to track important project dates"
          variant="compact"
          actionText="Add Milestone"
          onAction={onPress}
        />
      );
    }

    return (
      <FlatList
        data={milestones.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderMilestone}
        scrollEnabled={false}
        accessible
        accessibilityLabel={`Upcoming milestones, ${milestones.length} items`}
      />
    );
  };

  return (
    <BaseWidget
      title="Upcoming Milestones"
      icon="flag-checkered"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={`Upcoming Milestones widget, ${milestones.length} milestones`}
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  milestoneRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    minHeight: 48,
  },
  timelineIndicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 32,
  },
  milestoneName: {
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  milestoneDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    opacity: 0.7,
  },
  daysRemaining: {
    fontWeight: '600',
  },
});

export default UpcomingMilestonesWidget;
