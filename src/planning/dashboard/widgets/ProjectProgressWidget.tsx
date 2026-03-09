/**
 * ProjectProgressWidget Component
 *
 * Displays overall project progress as a weighted rollup of Key Date progress,
 * with a breakdown list showing each KD's weightage and progress.
 *
 * @version 1.0.0
 * @since Planning Phase 5c
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import type { KDBreakdownItem } from '../hooks';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

export interface ProjectProgressWidgetProps {
  projectProgress: number;
  kdBreakdown: KDBreakdownItem[];
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Helpers ====================

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    not_started: COLORS.DISABLED,
    in_progress: COLORS.INFO,
    completed: COLORS.SUCCESS,
    delayed: COLORS.ERROR,
  };
  return colors[status] || COLORS.DISABLED;
};

const getProgressBarColor = (progress: number): string => {
  if (progress >= 100) return COLORS.SUCCESS;
  if (progress >= 50) return COLORS.INFO;
  if (progress > 0) return COLORS.WARNING;
  return COLORS.DISABLED;
};

// ==================== Component ====================

const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({
  projectProgress,
  kdBreakdown,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const renderKDItem = ({ item }: { item: KDBreakdownItem }) => {
    const statusColor = getStatusColor(item.status);
    const barColor = getProgressBarColor(item.progress);

    return (
      <View style={styles.kdRow}>
        <View style={styles.kdHeader}>
          <View style={styles.kdCodeContainer}>
            <Icon name="circle" size={10} color={statusColor} style={styles.statusDot} />
            <Text variant="labelLarge" style={styles.kdCode}>{item.code}</Text>
          </View>
          <Text variant="labelSmall" style={styles.kdWeightage}>
            {item.weightage}%
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.kdDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.kdProgressRow}>
          <ProgressBar
            progress={Math.min(item.progress, 100) / 100}
            color={barColor}
            style={styles.kdProgressBar}
          />
          <Text variant="labelSmall" style={[styles.kdProgressText, { color: barColor }]}>
            {item.progress.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (kdBreakdown.length === 0) {
      return (
        <EmptyState
          icon="chart-arc"
          title="No Key Dates"
          message="Add key dates with weightage to see project progress"
          variant="compact"
          actionText="Go to Key Dates"
          onAction={onPress}
        />
      );
    }

    const progressColor = getProgressBarColor(projectProgress);

    return (
      <View>
        {/* Overall Progress */}
        <View style={styles.overallSection}>
          <Text variant="headlineMedium" style={[styles.overallValue, { color: progressColor }]}>
            {projectProgress.toFixed(1)}%
          </Text>
          <Text variant="bodySmall" style={styles.overallLabel}>
            Project Progress (KD Weighted)
          </Text>
          <ProgressBar
            progress={Math.min(projectProgress, 100) / 100}
            color={progressColor}
            style={styles.overallBar}
          />
        </View>

        {/* KD Breakdown */}
        <View style={styles.breakdownSection}>
          <View style={styles.breakdownHeader}>
            <Text variant="labelMedium" style={styles.breakdownTitle}>Key Date Breakdown</Text>
            <Text variant="labelSmall" style={styles.breakdownSubtitle}>Weightage</Text>
          </View>
          {kdBreakdown.map((item) => (
            <View key={item.id}>{renderKDItem({ item })}</View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <BaseWidget
      title="Project Progress"
      icon="chart-arc"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={
        kdBreakdown.length > 0
          ? `Project Progress widget, ${Math.round(projectProgress)}% complete from ${kdBreakdown.length} key dates`
          : 'Project Progress widget, no data'
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  overallSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  overallValue: {
    fontWeight: 'bold',
  },
  overallLabel: {
    opacity: 0.7,
    marginBottom: 8,
  },
  overallBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  breakdownSection: {
    marginTop: 4,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  breakdownTitle: {
    fontWeight: '600',
  },
  breakdownSubtitle: {
    opacity: 0.6,
  },
  kdRow: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  kdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kdCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    marginRight: 6,
  },
  kdCode: {
    fontWeight: '600',
  },
  kdWeightage: {
    opacity: 0.6,
    fontWeight: '500',
  },
  kdDescription: {
    opacity: 0.7,
    marginTop: 2,
    marginLeft: 16,
  },
  kdProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 16,
  },
  kdProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  kdProgressText: {
    marginLeft: 8,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
});

const ProjectProgressWidgetMemo = React.memo(ProjectProgressWidget);
export { ProjectProgressWidgetMemo as ProjectProgressWidget };
export default ProjectProgressWidgetMemo;
