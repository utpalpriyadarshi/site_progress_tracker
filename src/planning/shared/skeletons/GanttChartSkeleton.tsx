/**
 * GanttChartSkeleton - Loading skeleton for GanttChartView component
 *
 * Provides a loading placeholder that matches the Gantt chart layout with
 * timeline header and horizontal task bars.
 *
 * @example
 * ```tsx
 * {loading ? (
 *   <GanttChartSkeleton barCount={8} />
 * ) : (
 *   <GanttChartView {...props} />
 * )}
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * GanttChartSkeleton Props
 */
export interface GanttChartSkeletonProps {
  /**
   * Number of task bars to display
   * @default 8
   */
  barCount?: number;

  /**
   * Number of timeline columns to show
   * @default 10
   */
  columnCount?: number;

  /**
   * Height of the skeleton
   * @default 400
   */
  height?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * Individual Gantt bar skeleton with varying widths and positions
 */
interface GanttBarSkeletonProps {
  index: number;
  columnWidth: number;
}

const GanttBarSkeleton: React.FC<GanttBarSkeletonProps> = ({ index, columnWidth }) => {
  // Vary the bar positions and widths for visual interest
  const startColumn = index % 3; // 0, 1, or 2
  const duration = 2 + (index % 4); // 2-5 columns wide
  const left = startColumn * columnWidth;
  const width = duration * columnWidth - 10;

  return (
    <View style={styles.taskRow}>
      {/* Task name column */}
      <View style={styles.nameColumn}>
        <Skeleton width="80%" height={14} marginBottom={4} />
        <Skeleton width="40%" height={10} marginBottom={0} />
      </View>

      {/* Timeline area with bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.timelineArea}>
          <View
            style={[
              styles.taskBar,
              {
                left,
                width,
              },
            ]}
          >
            <Skeleton width="100%" height={30} borderRadius={4} marginBottom={0} shimmer={false} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * GanttChartSkeleton Component
 */
export const GanttChartSkeleton: React.FC<GanttChartSkeletonProps> = ({
  barCount = 8,
  columnCount = 10,
  height = 400,
  style,
}) => {
  const columnWidth = 60;

  return (
    <View style={[styles.container, { height }, style]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Left column header */}
        <View style={[styles.headerCell, styles.nameColumn]}>
          <Skeleton width="50%" height={14} marginBottom={0} />
        </View>

        {/* Timeline header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.timelineHeader}>
            {Array.from({ length: columnCount }).map((_, index) => (
              <View
                key={index}
                style={[styles.timelineCell, { width: columnWidth }]}
              >
                <Skeleton width="70%" height={12} marginBottom={0} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Zoom Controls */}
      <View style={styles.controls}>
        <Skeleton width={100} height={32} borderRadius={4} marginBottom={0} />
        <View style={styles.zoomButtons}>
          <Skeleton width={36} height={36} borderRadius={18} marginBottom={0} />
          <Skeleton width={36} height={36} borderRadius={18} marginBottom={0} />
        </View>
      </View>

      {/* Task Bars */}
      <ScrollView style={styles.barsContainer}>
        {Array.from({ length: barCount }).map((_, index) => (
          <GanttBarSkeleton key={index} index={index} columnWidth={columnWidth} />
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <Skeleton width={16} height={16} borderRadius={2} marginBottom={0} />
          <Skeleton width={60} height={12} marginBottom={0} />
        </View>
        <View style={styles.legendRow}>
          <Skeleton width={16} height={16} borderRadius={2} marginBottom={0} />
          <Skeleton width={80} height={12} marginBottom={0} />
        </View>
        <View style={styles.legendRow}>
          <Skeleton width={16} height={16} borderRadius={2} marginBottom={0} />
          <Skeleton width={70} height={12} marginBottom={0} />
        </View>
      </View>
    </View>
  );
};

const TIMELINE_HEADER_HEIGHT = 50;
const TASK_ROW_HEIGHT = 60;
const ITEM_NAME_COLUMN_WIDTH = 200;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  headerCell: {
    height: TIMELINE_HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  nameColumn: {
    width: ITEM_NAME_COLUMN_WIDTH,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  timelineHeader: {
    flexDirection: 'row',
    height: TIMELINE_HEADER_HEIGHT,
  },
  timelineCell: {
    height: TIMELINE_HEADER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  zoomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  barsContainer: {
    flex: 1,
  },
  taskRow: {
    flexDirection: 'row',
    height: TASK_ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineArea: {
    height: TASK_ROW_HEIGHT,
    width: 600, // Fixed width for horizontal scroll
    position: 'relative',
  },
  taskBar: {
    position: 'absolute',
    top: 15,
    height: 30,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
