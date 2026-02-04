/**
 * ScheduleOverviewWidget Component
 *
 * Timeline summary with % complete, progress bar, on-track vs delayed items.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';

// ==================== Types ====================

export interface ScheduleOverview {
  totalItems: number;
  completedItems: number;
  onTrackItems: number;
  delayedItems: number;
  overallProgress: number; // 0-100
  projectStartDate: Date;
  projectEndDate: Date;
  daysRemaining: number;
}

export interface ScheduleOverviewWidgetProps {
  overview: ScheduleOverview | null;
  projectProgress?: number | null;
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const ScheduleOverviewWidget: React.FC<ScheduleOverviewWidgetProps> = ({
  overview,
  projectProgress = null,
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
      year: 'numeric',
    });
  };

  const getProgressColor = (progress: number, delayed: number, total: number): string => {
    const delayedPercentage = total > 0 ? (delayed / total) * 100 : 0;
    if (delayedPercentage > 20) return '#F44336';
    if (delayedPercentage > 10) return '#FF9800';
    return theme.colors.primary;
  };

  const renderContent = () => {
    if (!overview || overview.totalItems === 0) {
      return (
        <EmptyState
          icon="calendar-blank"
          title="No Schedule Items"
          message="Start planning by creating your first schedule item"
          variant="compact"
          actionText="Create Schedule Item"
          onAction={onPress}
        />
      );
    }

    // Use KD-weighted project progress when available, otherwise fall back to item average
    const displayProgress = projectProgress != null && projectProgress > 0
      ? Math.round(projectProgress)
      : overview.overallProgress;

    const progressColor = getProgressColor(
      displayProgress,
      overview.delayedItems,
      overview.totalItems
    );

    return (
      <View>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="headlineMedium" style={[styles.progressValue, { color: progressColor }]}>
              {displayProgress}%
            </Text>
            <Text variant="bodySmall" style={styles.progressLabel}>
              {projectProgress != null && projectProgress > 0
                ? 'Project Progress (KD Weighted)'
                : 'Overall Progress'}
            </Text>
          </View>
          <ProgressBar
            progress={displayProgress / 100}
            color={progressColor}
            style={styles.progressBar}
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={styles.statItem}
            accessible
            accessibilityLabel={`${overview.completedItems} completed items`}
          >
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text variant="titleMedium" style={styles.statValue}>
              {overview.completedItems}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              Completed
            </Text>
          </View>

          <View
            style={styles.statItem}
            accessible
            accessibilityLabel={`${overview.onTrackItems} items on track`}
          >
            <Icon name="clock-check-outline" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.statValue}>
              {overview.onTrackItems}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              On Track
            </Text>
          </View>

          <View
            style={styles.statItem}
            accessible
            accessibilityLabel={`${overview.delayedItems} delayed items`}
          >
            <Icon name="clock-alert-outline" size={20} color="#F44336" />
            <Text variant="titleMedium" style={[styles.statValue, overview.delayedItems > 0 && { color: '#F44336' }]}>
              {overview.delayedItems}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>
              Delayed
            </Text>
          </View>
        </View>

        {/* Timeline Info */}
        <View style={styles.timelineInfo}>
          <View style={styles.dateRange}>
            <Text variant="labelSmall" style={styles.dateLabel}>
              {formatDate(overview.projectStartDate)}
            </Text>
            <View style={styles.dateLine} />
            <Text variant="labelSmall" style={styles.dateLabel}>
              {formatDate(overview.projectEndDate)}
            </Text>
          </View>
          <Text
            variant="labelMedium"
            style={[
              styles.daysRemaining,
              { color: overview.daysRemaining < 30 ? '#FF9800' : theme.colors.primary },
            ]}
          >
            {overview.daysRemaining} days remaining
          </Text>
        </View>
      </View>
    );
  };

  return (
    <BaseWidget
      title="Schedule Overview"
      icon="calendar-clock"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={
        overview
          ? `Schedule Overview widget, ${projectProgress != null && projectProgress > 0 ? Math.round(projectProgress) : overview.overallProgress}% complete, ${overview.delayedItems} delayed items`
          : 'Schedule Overview widget, no data'
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  progressValue: {
    fontWeight: 'bold',
  },
  progressLabel: {
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 2,
  },
  timelineInfo: {
    alignItems: 'center',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  dateLabel: {
    opacity: 0.7,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  daysRemaining: {
    fontWeight: '600',
  },
});

export default ScheduleOverviewWidget;
