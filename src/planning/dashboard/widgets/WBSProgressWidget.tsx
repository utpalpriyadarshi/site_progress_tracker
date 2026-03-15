/**
 * WBSProgressWidget Component
 *
 * Unified WBS progress widget combining:
 *   - Summary tab  : overall %, schedule counts (completed/on-track/delayed),
 *                    project timeline  (was ScheduleOverviewWidget)
 *   - By Phase tab : stacked phase bars per phase  (original WBSProgressWidget)
 *
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, ProgressBar, SegmentedButtons } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import { COLORS } from '../../../theme/colors';
import type { ScheduleOverview } from './ScheduleOverviewWidget';

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
  // By Phase tab
  phases: WBSPhase[];
  summary: WBSSummary | null;
  // Summary tab (schedule overview data)
  overview?: ScheduleOverview | null;
  projectProgress?: number | null;
  onPressCompleted?: () => void;
  onPressOnTrack?: () => void;
  onPressDelayed?: () => void;
  // Shared
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

type ActiveTab = 'summary' | 'by_phase';

// ==================== Component ====================

const WBSProgressWidget: React.FC<WBSProgressWidgetProps> = ({
  phases,
  summary,
  overview = null,
  projectProgress = null,
  onPressCompleted,
  onPressOnTrack,
  onPressDelayed,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  const formatDate = (date: Date): string =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getProgressColor = (delayed: number, total: number): string => {
    const delayedPct = total > 0 ? (delayed / total) * 100 : 0;
    if (delayedPct > 20) return COLORS.ERROR;
    if (delayedPct > 10) return COLORS.WARNING;
    return theme.colors.primary;
  };

  // ── Summary tab ────────────────────────────────────────────────────────────
  const renderSummaryContent = () => {
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

    const displayProgress =
      projectProgress != null && projectProgress > 0
        ? parseFloat(projectProgress.toFixed(1))
        : parseFloat(overview.overallProgress.toFixed(1));

    const progressColor = getProgressColor(overview.delayedItems, overview.totalItems);

    return (
      <View>
        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="headlineMedium" style={[styles.progressValue, { color: progressColor }]}>
              {displayProgress.toFixed(1)}%
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

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={onPressCompleted}
            activeOpacity={0.7}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${overview.completedItems} completed items, tap to view list`}
          >
            <Icon name="check-circle" size={20} color={COLORS.SUCCESS} />
            <Text variant="titleMedium" style={styles.statValue}>{overview.completedItems}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={onPressOnTrack}
            activeOpacity={0.7}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${overview.onTrackItems} items on track, tap to view list`}
          >
            <Icon name="clock-check-outline" size={20} color={theme.colors.primary} />
            <Text variant="titleMedium" style={styles.statValue}>{overview.onTrackItems}</Text>
            <Text variant="labelSmall" style={styles.statLabel}>On Track</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statItem}
            onPress={onPressDelayed}
            activeOpacity={0.7}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${overview.delayedItems} delayed items, tap to view list`}
          >
            <Icon name="clock-alert-outline" size={20} color={COLORS.ERROR} />
            <Text
              variant="titleMedium"
              style={[styles.statValue, overview.delayedItems > 0 && { color: COLORS.ERROR }]}
            >
              {overview.delayedItems}
            </Text>
            <Text variant="labelSmall" style={styles.statLabel}>Delayed</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline */}
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
              { color: overview.daysRemaining < 30 ? COLORS.WARNING : theme.colors.primary },
            ]}
          >
            {overview.daysRemaining} days remaining
          </Text>
        </View>
      </View>
    );
  };

  // ── By Phase tab ───────────────────────────────────────────────────────────
  const renderPhaseBar = (phase: WBSPhase) => {
    const total = phase.totalItems || 1;
    const completedWidth  = (phase.completedItems  / total) * 100;
    const inProgressWidth = (phase.inProgressItems / total) * 100;
    const notStartedWidth = (phase.notStartedItems / total) * 100;

    return (
      <View
        key={phase.id}
        style={styles.phaseRow}
        accessible
        accessibilityLabel={`${phase.name}: ${phase.completedItems} completed, ${phase.inProgressItems} in progress, ${phase.notStartedItems} not started`}
      >
        <Text variant="bodySmall" style={styles.phaseName} numberOfLines={1}>
          {phase.name}
        </Text>
        <View style={styles.barContainer}>
          <View style={styles.stackedBar}>
            {completedWidth  > 0 && <View style={[styles.barSegment, styles.completedSegment,  { width: `${completedWidth}%`  }]} />}
            {inProgressWidth > 0 && <View style={[styles.barSegment, styles.inProgressSegment, { width: `${inProgressWidth}%` }]} />}
            {notStartedWidth > 0 && <View style={[styles.barSegment, styles.notStartedSegment, { width: `${notStartedWidth}%` }]} />}
          </View>
          <Text variant="labelSmall" style={styles.phaseProgress}>
            {phase.completedItems}/{phase.totalItems}
          </Text>
        </View>
      </View>
    );
  };

  const renderByPhaseContent = () => {
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
        {/* Overall header */}
        <View style={styles.headerRow}>
          <View style={styles.overallProgress}>
            <Text variant="headlineSmall" style={styles.byPhaseProgressValue}>
              {summary.overallProgress}%
            </Text>
            <Text variant="labelSmall" style={styles.progressLabel}>Overall</Text>
          </View>
          <View style={styles.itemsCount}>
            <Text variant="titleMedium" style={styles.itemsValue}>
              {summary.completedItems}/{summary.totalItems}
            </Text>
            <Text variant="labelSmall" style={styles.itemsLabel}>Items Complete</Text>
          </View>
        </View>

        {/* Phase bars */}
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
            <Text variant="labelSmall" style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.inProgressSegment]} />
            <Text variant="labelSmall" style={styles.legendText}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.notStartedSegment]} />
            <Text variant="labelSmall" style={styles.legendText}>Not Started</Text>
          </View>
        </View>
      </View>
    );
  };

  // ── Widget shell ───────────────────────────────────────────────────────────
  const overallPct = overview
    ? (projectProgress != null && projectProgress > 0
        ? projectProgress.toFixed(1)
        : overview.overallProgress.toFixed(1))
    : summary?.overallProgress ?? 0;

  return (
    <BaseWidget
      title="WBS Progress"
      icon="sitemap"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={`WBS Progress widget, ${overallPct}% complete`}
    >
      <SegmentedButtons
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ActiveTab)}
        style={styles.segmentedButtons}
        buttons={[
          { value: 'summary',  label: 'Summary',  icon: 'chart-bar'  },
          { value: 'by_phase', label: 'By Phase', icon: 'view-list'  },
        ]}
      />

      <View style={styles.tabContent}>
        {activeTab === 'summary' ? renderSummaryContent() : renderByPhaseContent()}
      </View>
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  segmentedButtons: {
    marginBottom: 12,
  },
  tabContent: {
    minHeight: 120,
  },
  // Summary tab
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
  // By Phase tab
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
  byPhaseProgressValue: {
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
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
    backgroundColor: COLORS.SUCCESS,
  },
  inProgressSegment: {
    backgroundColor: COLORS.INFO,
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

const WBSProgressWidgetMemo = React.memo(WBSProgressWidget);
export { WBSProgressWidgetMemo as WBSProgressWidget };
export default WBSProgressWidgetMemo;
