/**
 * WBSProgressWidget Component
 *
 * WBS completion by phase with stacked bar chart visualization.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';

// ==================== Types ====================

export interface WBSPhase {
  id: string;
  name: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
}

export interface WBSSummary {
  totalPhases: number;
  totalItems: number;
  completedItems: number;
  overallProgress: number;
}

export interface WBSProgressWidgetProps {
  phases: WBSPhase[];
  summary: WBSSummary | null;
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const WBSProgressWidget: React.FC<WBSProgressWidgetProps> = ({
  phases,
  summary,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const renderPhaseBar = (phase: WBSPhase) => {
    const total = phase.totalItems || 1; // Avoid division by zero
    const completedWidth = (phase.completedItems / total) * 100;
    const inProgressWidth = (phase.inProgressItems / total) * 100;
    const notStartedWidth = (phase.notStartedItems / total) * 100;

    return (
      <View
        key={phase.id}
        style={styles.phaseRow}
        accessible
        accessibilityLabel={`${phase.name}: ${phase.completedItems} completed, ${phase.inProgressItems} in progress, ${phase.notStartedItems} not started`}
      >
        <Text
          variant="bodySmall"
          style={styles.phaseName}
          numberOfLines={1}
        >
          {phase.name}
        </Text>

        <View style={styles.barContainer}>
          <View style={styles.stackedBar}>
            {completedWidth > 0 && (
              <View
                style={[
                  styles.barSegment,
                  styles.completedSegment,
                  { width: `${completedWidth}%` },
                ]}
              />
            )}
            {inProgressWidth > 0 && (
              <View
                style={[
                  styles.barSegment,
                  styles.inProgressSegment,
                  { width: `${inProgressWidth}%` },
                ]}
              />
            )}
            {notStartedWidth > 0 && (
              <View
                style={[
                  styles.barSegment,
                  styles.notStartedSegment,
                  { width: `${notStartedWidth}%` },
                ]}
              />
            )}
          </View>

          <Text variant="labelSmall" style={styles.phaseProgress}>
            {phase.completedItems}/{phase.totalItems}
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (!summary || phases.length === 0) {
      return (
        <EmptyState
          icon="sitemap"
          title="No WBS Structure"
          message="Create a work breakdown structure to track progress by phase"
          variant="compact"
          actionText="Create WBS"
          onAction={onPress}
        />
      );
    }

    return (
      <View>
        {/* Overall Progress Header */}
        <View style={styles.headerRow}>
          <View style={styles.overallProgress}>
            <Text variant="headlineSmall" style={styles.progressValue}>
              {summary.overallProgress}%
            </Text>
            <Text variant="labelSmall" style={styles.progressLabel}>
              Overall
            </Text>
          </View>
          <View style={styles.itemsCount}>
            <Text variant="titleMedium" style={styles.itemsValue}>
              {summary.completedItems}/{summary.totalItems}
            </Text>
            <Text variant="labelSmall" style={styles.itemsLabel}>
              Items Complete
            </Text>
          </View>
        </View>

        {/* Phase Bars */}
        <View
          style={styles.phasesContainer}
          accessible
          accessibilityLabel={`WBS phases, ${phases.length} phases`}
        >
          {phases.slice(0, 5).map(renderPhaseBar)}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.completedSegment]} />
            <Text variant="labelSmall" style={styles.legendText}>
              Completed
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.inProgressSegment]} />
            <Text variant="labelSmall" style={styles.legendText}>
              In Progress
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.notStartedSegment]} />
            <Text variant="labelSmall" style={styles.legendText}>
              Not Started
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <BaseWidget
      title="WBS Progress"
      icon="sitemap"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={
        summary
          ? `WBS Progress widget, ${summary.overallProgress}% overall, ${summary.totalPhases} phases`
          : 'WBS Progress widget, no data'
      }
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  overallProgress: {
    alignItems: 'center',
  },
  progressValue: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressLabel: {
    opacity: 0.7,
  },
  itemsCount: {
    alignItems: 'center',
  },
  itemsValue: {
    fontWeight: '600',
  },
  itemsLabel: {
    opacity: 0.7,
  },
  phasesContainer: {
    marginBottom: 12,
  },
  phaseRow: {
    marginBottom: 10,
  },
  phaseName: {
    marginBottom: 4,
    fontWeight: '500',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginRight: 8,
  },
  barSegment: {
    height: '100%',
  },
  completedSegment: {
    backgroundColor: '#4CAF50',
  },
  inProgressSegment: {
    backgroundColor: '#2196F3',
  },
  notStartedSegment: {
    backgroundColor: '#E0E0E0',
  },
  phaseProgress: {
    width: 40,
    textAlign: 'right',
    opacity: 0.7,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    opacity: 0.7,
  },
});

export default WBSProgressWidget;
