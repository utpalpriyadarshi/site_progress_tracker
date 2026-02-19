/**
 * GanttChartView - Reusable Gantt chart visualization component
 *
 * A comprehensive Gantt chart component that displays tasks/items on a timeline
 * with support for different view modes, zoom levels, and interactive features.
 *
 * @example
 * ```tsx
 * <GanttChartView
 *   items={state.data.items}
 *   startDate={state.timeline.startDate}
 *   endDate={state.timeline.endDate}
 *   visibleRange={state.timeline.visibleRange}
 *   viewMode={state.ui.viewMode}
 *   zoomLevel={state.ui.zoomLevel}
 *   selectedItem={state.data.selectedItem}
 *   onSelectItem={handleSelectItem}
 *   onItemPress={handleItemPress}
 *   showCriticalPath
 *   showMilestones
 *   height={400}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { GanttChartViewProps, GanttViewMode, GanttHeaderDate } from '../types';
import ItemModel from '../../../../models/ItemModel';
import { COLORS } from '../../../theme/colors';

dayjs.extend(isBetween);

// Constants
const TASK_ROW_HEIGHT = 60;
const TIMELINE_HEADER_HEIGHT = 50;
const ITEM_NAME_COLUMN_WIDTH = 200;
const DEFAULT_COLUMN_WIDTH = 60;
const TODAY_MARKER_COLOR = COLORS.INFO;
const CRITICAL_PATH_COLOR = '#d32f2f';
const PROGRESS_COLOR = COLORS.SUCCESS;
const MILESTONE_COLOR = COLORS.WARNING;

/**
 * Column widths for different zoom levels
 */
const getColumnWidth = (zoomLevel: number, viewMode: GanttViewMode): number => {
  const baseWidths = {
    day: 60,
    week: 80,
    month: 120,
  };
  return baseWidths[viewMode] * zoomLevel;
};

/**
 * Generate timeline header dates based on view mode and date range
 */
const generateHeaderDates = (
  startDate: Date,
  endDate: Date,
  viewMode: GanttViewMode
): GanttHeaderDate[] => {
  const headers: GanttHeaderDate[] = [];
  let current = dayjs(startDate).startOf(viewMode === 'day' ? 'day' : viewMode);
  const end = dayjs(endDate);
  const today = dayjs().startOf('day');

  while (current.isBefore(end) || current.isSame(end)) {
    const isToday = current.isSame(today, 'day');

    let label = '';
    if (viewMode === 'day') {
      label = current.format('MMM DD');
    } else if (viewMode === 'week') {
      label = `W${current.week()} ${current.format('MMM')}`;
    } else {
      label = current.format('MMM YYYY');
    }

    headers.push({
      date: current.toDate(),
      label,
      isToday,
    });

    if (viewMode === 'day') {
      current = current.add(1, 'day');
    } else if (viewMode === 'week') {
      current = current.add(1, 'week');
    } else {
      current = current.add(1, 'month');
    }
  }

  return headers;
};

/**
 * Calculate task bar position and width
 */
const calculateBarLayout = (
  item: ItemModel,
  startDate: Date,
  viewMode: GanttViewMode,
  columnWidth: number
): { left: number; width: number } => {
  const timelineStart = dayjs(startDate);
  const itemStart = dayjs(item.plannedStartDate);
  const itemEnd = dayjs(item.plannedEndDate);

  let diffDays = 0;
  let durationDays = 0;

  if (viewMode === 'day') {
    diffDays = itemStart.diff(timelineStart, 'day');
    durationDays = itemEnd.diff(itemStart, 'day') + 1;
  } else if (viewMode === 'week') {
    diffDays = itemStart.diff(timelineStart, 'week');
    durationDays = itemEnd.diff(itemStart, 'week') + 1;
  } else {
    diffDays = itemStart.diff(timelineStart, 'month');
    durationDays = itemEnd.diff(itemStart, 'month') + 1;
  }

  const left = diffDays * columnWidth;
  const width = Math.max(durationDays * columnWidth, 20); // Minimum 20px

  return { left, width };
};

/**
 * Calculate today marker position
 */
const calculateTodayPosition = (
  startDate: Date,
  viewMode: GanttViewMode,
  columnWidth: number
): number => {
  const timelineStart = dayjs(startDate);
  const today = dayjs().startOf('day');

  let diffDays = 0;
  if (viewMode === 'day') {
    diffDays = today.diff(timelineStart, 'day');
  } else if (viewMode === 'week') {
    diffDays = today.diff(timelineStart, 'week');
  } else {
    diffDays = today.diff(timelineStart, 'month');
  }

  return diffDays * columnWidth;
};

/**
 * Main GanttChartView component
 */
export const GanttChartView: React.FC<GanttChartViewProps> = ({
  items,
  startDate,
  endDate,
  visibleRange,
  viewMode,
  zoomLevel,
  selectedItem,
  onSelectItem,
  onItemPress,
  showCriticalPath = true,
  showMilestones = true,
  showDependencies = false, // Not yet implemented
  height = 400,
  style,
}) => {
  // Calculate column width based on zoom level
  const columnWidth = useMemo(() => {
    return getColumnWidth(zoomLevel, viewMode);
  }, [zoomLevel, viewMode]);

  // Generate timeline headers
  const headerDates = useMemo(() => {
    return generateHeaderDates(startDate, endDate, viewMode);
  }, [startDate, endDate, viewMode]);

  // Calculate total timeline width
  const timelineWidth = headerDates.length * columnWidth;

  // Calculate today marker position
  const todayPosition = useMemo(() => {
    return calculateTodayPosition(startDate, viewMode, columnWidth);
  }, [startDate, viewMode, columnWidth]);

  // Filter items to show
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (!showMilestones && item.isMilestone) {
        return false;
      }
      return true;
    });
  }, [items, showMilestones]);

  return (
    <Surface style={[styles.container, style, { height }]}>
      <View style={styles.header}>
        {/* Left column header */}
        <View style={[styles.headerCell, styles.nameColumn]}>
          <Text variant="labelMedium" style={styles.headerText}>Item</Text>
        </View>

        {/* Timeline header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.timelineHeader}>
            {headerDates.map((header, index) => (
              <View
                key={index}
                style={[
                  styles.timelineCell,
                  { width: columnWidth },
                  header.isToday && styles.todayHeader,
                ]}
              >
                <Text variant="labelSmall" style={styles.timelineCellText}>
                  {header.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Items list */}
      <ScrollView style={styles.itemsContainer}>
        {visibleItems.map((item) => {
          const { left, width } = calculateBarLayout(item, startDate, viewMode, columnWidth);
          const progress = item.getProgressPercentage();
          const isCritical = showCriticalPath && item.isOnCriticalPath();
          const phaseColor = item.getPhaseColor();
          const isSelected = selectedItem?.id === item.id;
          const isMilestone = item.isMilestone;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onItemPress(item)}
              style={[styles.itemRow, isSelected && styles.selectedRow]}
              activeOpacity={0.7}
            >
              {/* Item name column */}
              <View style={[styles.itemNameCell, styles.nameColumn]}>
                <Text variant="bodySmall" numberOfLines={2} style={styles.itemName}>
                  {item.name}
                </Text>
                {isCritical && (
                  <Text variant="labelSmall" style={styles.criticalBadge}>
                    Critical
                  </Text>
                )}
              </View>

              {/* Timeline area */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.timelineArea, { width: timelineWidth }]}>
                  {/* Today marker */}
                  {todayPosition >= 0 && todayPosition <= timelineWidth && (
                    <View style={[styles.todayMarker, { left: todayPosition }]} />
                  )}

                  {/* Task bar or milestone marker */}
                  {isMilestone ? (
                    <View
                      style={[
                        styles.milestoneMarker,
                        {
                          left: left + width / 2 - 10,
                          borderColor: MILESTONE_COLOR,
                        },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.taskBar,
                        {
                          left,
                          width,
                          backgroundColor: phaseColor + '30',
                          borderColor: isCritical ? CRITICAL_PATH_COLOR : phaseColor,
                          borderWidth: isCritical ? 3 : 1,
                        },
                      ]}
                    >
                      {/* Progress overlay */}
                      {progress > 0 && (
                        <View
                          style={[
                            styles.progressOverlay,
                            {
                              width: `${progress}%`,
                              backgroundColor: PROGRESS_COLOR,
                            },
                          ]}
                        />
                      )}
                      {width > 50 && (
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>
            </TouchableOpacity>
          );
        })}

        {visibleItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={styles.emptyText}>
              No items to display
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendIcon, { backgroundColor: PROGRESS_COLOR }]} />
          <Text variant="labelSmall">Progress</Text>
        </View>
        {showCriticalPath && (
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, { borderColor: CRITICAL_PATH_COLOR, borderWidth: 2 }]} />
            <Text variant="labelSmall">Critical Path</Text>
          </View>
        )}
        {showMilestones && (
          <View style={styles.legendRow}>
            <View style={[styles.legendIcon, styles.milestoneLegendIcon, { borderColor: MILESTONE_COLOR }]} />
            <Text variant="labelSmall">Milestone</Text>
          </View>
        )}
        <View style={styles.legendRow}>
          <View style={[styles.legendIcon, { backgroundColor: TODAY_MARKER_COLOR }]} />
          <Text variant="labelSmall">Today</Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
    borderRadius: 8,
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
  headerText: {
    fontWeight: 'bold',
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
  timelineCellText: {
    fontSize: 10,
    fontWeight: '600',
  },
  todayHeader: {
    backgroundColor: TODAY_MARKER_COLOR + '20',
  },
  itemsContainer: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    height: TASK_ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedRow: {
    backgroundColor: COLORS.INFO_BG,
  },
  itemNameCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemName: {
    fontWeight: '500',
  },
  criticalBadge: {
    color: CRITICAL_PATH_COLOR,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timelineArea: {
    height: TASK_ROW_HEIGHT,
    position: 'relative',
  },
  todayMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: TODAY_MARKER_COLOR,
    zIndex: 10,
  },
  taskBar: {
    position: 'absolute',
    height: 30,
    top: 15,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    zIndex: 1,
  },
  milestoneMarker: {
    position: 'absolute',
    top: 20,
    width: 20,
    height: 20,
    borderWidth: 3,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#999',
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
  legendIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
  milestoneLegendIcon: {
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    backgroundColor: '#FFF',
  },
});
