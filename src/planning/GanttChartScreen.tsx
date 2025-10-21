/**
 * GanttChartScreen - Phase 2.4
 *
 * Enhanced Gantt Chart with database integration, timeline visualization,
 * zoom controls, and critical path highlighting
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);

type ZoomLevel = 'day' | 'week' | 'month';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TASK_HEIGHT = 60;
const TIMELINE_HEIGHT = 50;
const LEFT_COLUMN_WIDTH = 200;

const GanttChartScreen: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');

  const scrollViewRef = useRef<ScrollView>(null);

  // Load items when site changes
  const loadItems = useCallback(async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const siteItems = await database.collections
        .get<ItemModel>('items')
        .query(Q.where('site_id', selectedSite.id))
        .fetch();

      // Sort by start date, then by WBS code
      siteItems.sort((a, b) => {
        const dateCompare = a.plannedStartDate - b.plannedStartDate;
        if (dateCompare !== 0) return dateCompare;
        return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      });

      setItems(siteItems);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedSite) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedSite, loadItems]);

  // Calculate timeline boundaries
  const getTimelineBounds = () => {
    if (items.length === 0) {
      const today = dayjs();
      return {
        start: today.subtract(7, 'day').startOf('day'),
        end: today.add(30, 'day').endOf('day'),
      };
    }

    const dates = items.flatMap(item => [
      item.plannedStartDate,
      item.plannedEndDate,
    ]);

    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);

    // Add padding
    const start = dayjs(minDate).subtract(3, 'day').startOf('day');
    const end = dayjs(maxDate).add(3, 'day').endOf('day');

    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineBounds();

  // Calculate timeline columns based on zoom level
  const getTimelineColumns = () => {
    const columns: Array<{ date: dayjs.Dayjs; label: string; isWeekend?: boolean }> = [];
    let current = timelineStart;

    while (current.isBefore(timelineEnd) || current.isSame(timelineEnd)) {
      if (zoomLevel === 'day') {
        columns.push({
          date: current,
          label: current.format('MMM DD'),
          isWeekend: current.day() === 0 || current.day() === 6,
        });
        current = current.add(1, 'day');
      } else if (zoomLevel === 'week') {
        columns.push({
          date: current,
          label: `W${current.week()}`,
        });
        current = current.add(1, 'week');
      } else {
        columns.push({
          date: current,
          label: current.format('MMM YYYY'),
        });
        current = current.add(1, 'month');
      }
    }

    return columns;
  };

  const timelineColumns = getTimelineColumns();
  const columnWidth = zoomLevel === 'day' ? 60 : zoomLevel === 'week' ? 80 : 120;
  const totalTimelineWidth = timelineColumns.length * columnWidth;

  // Calculate task bar position and width
  const getTaskBarLayout = (item: ItemModel) => {
    const itemStart = dayjs(item.plannedStartDate);
    const itemEnd = dayjs(item.plannedEndDate);

    // Calculate position from timeline start
    let left = 0;
    if (zoomLevel === 'day') {
      left = itemStart.diff(timelineStart, 'day') * columnWidth;
    } else if (zoomLevel === 'week') {
      left = itemStart.diff(timelineStart, 'week', true) * columnWidth;
    } else {
      left = itemStart.diff(timelineStart, 'month', true) * columnWidth;
    }

    // Calculate width based on duration
    let width = 0;
    if (zoomLevel === 'day') {
      width = itemEnd.diff(itemStart, 'day') * columnWidth;
    } else if (zoomLevel === 'week') {
      width = itemEnd.diff(itemStart, 'week', true) * columnWidth;
    } else {
      width = itemEnd.diff(itemStart, 'month', true) * columnWidth;
    }

    // Minimum width for visibility
    width = Math.max(width, 20);

    return { left, width };
  };

  // Get today marker position
  const getTodayPosition = () => {
    const today = dayjs();
    if (today.isBefore(timelineStart) || today.isAfter(timelineEnd)) {
      return null;
    }

    if (zoomLevel === 'day') {
      return today.diff(timelineStart, 'day') * columnWidth;
    } else if (zoomLevel === 'week') {
      return today.diff(timelineStart, 'week', true) * columnWidth;
    } else {
      return today.diff(timelineStart, 'month', true) * columnWidth;
    }
  };

  const todayPosition = getTodayPosition();

  // Render timeline header
  const renderTimeline = () => (
    <View style={styles.timelineHeader}>
      {timelineColumns.map((col, index) => (
        <View
          key={index}
          style={[
            styles.timelineColumn,
            { width: columnWidth },
            col.isWeekend && styles.weekendColumn,
          ]}
        >
          <Text style={styles.timelineText}>{col.label}</Text>
        </View>
      ))}
    </View>
  );

  // Render task bar
  const renderTaskBar = (item: ItemModel) => {
    const { left, width } = getTaskBarLayout(item);
    const phaseColor = item.getPhaseColor();
    const progress = item.getProgressPercentage();
    const isCritical = item.isOnCriticalPath();

    // Progress bar color - green for all phases
    const progressColor = '#4CAF50';

    return (
      <View key={item.id} style={styles.taskRow}>
        {/* Left column: Task info */}
        <View style={styles.taskInfoColumn}>
          <Text style={styles.taskName} numberOfLines={1}>
            {item.wbsCode} - {item.name}
          </Text>
          <View style={styles.taskMetadata}>
            <Chip compact style={[styles.phaseChip, { backgroundColor: phaseColor + '20' }]}>
              <Text style={[styles.phaseText, { color: phaseColor }]}>
                {item.getPhaseLabel()}
              </Text>
            </Chip>
            {isCritical && (
              <Chip compact style={styles.criticalChip}>
                <Text style={styles.criticalText}>Critical</Text>
              </Chip>
            )}
          </View>
        </View>

        {/* Right column: Timeline */}
        <View style={[styles.taskBarContainer, { width: totalTimelineWidth }]}>
          <View
            style={[
              styles.taskBar,
              {
                left,
                width,
                backgroundColor: phaseColor + '30', // Light phase color as background
                borderColor: isCritical ? '#d32f2f' : phaseColor,
                borderWidth: isCritical ? 3 : 1,
              },
            ]}
          >
            {/* Progress overlay - green fill */}
            {progress > 0 && (
              <View
                style={[
                  styles.progressOverlay,
                  {
                    width: `${progress}%`,
                    backgroundColor: progressColor,
                  },
                ]}
              />
            )}
            <Text style={styles.taskBarText} numberOfLines={1}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <SimpleSiteSelector
            selectedSite={selectedSite}
            onSiteChange={setSelectedSite}
          />
        </Card.Content>
      </Card>

      {selectedSite && (
        <>
          {/* Zoom Controls */}
          <Card style={styles.controlsCard}>
            <Card.Content>
              <SegmentedButtons
                value={zoomLevel}
                onValueChange={(value) => setZoomLevel(value as ZoomLevel)}
                buttons={[
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                ]}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {/* Legend */}
          <Card style={styles.legendCard}>
            <Card.Content>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Progress</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: '#d32f2f', borderWidth: 3 }]} />
                  <Text style={styles.legendText}>Critical Path</Text>
                </View>
                {todayPosition !== null && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.legendText}>Today</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Gantt Chart */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1976D2" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : items.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  No items found for this site. Create items in the WBS tab to see them here.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <ScrollView style={styles.ganttContainer}>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={[styles.taskInfoColumn, styles.headerColumn]}>
                  <Text style={styles.headerText}>Task</Text>
                </View>
                <ScrollView
                  horizontal
                  ref={scrollViewRef}
                  showsHorizontalScrollIndicator={true}
                  style={{ width: SCREEN_WIDTH - LEFT_COLUMN_WIDTH }}
                >
                  {renderTimeline()}
                </ScrollView>
              </View>

              {/* Tasks */}
              {items.map((item) => (
                <View key={item.id} style={styles.taskRowWrapper}>
                  <View style={styles.taskInfoColumn}>
                    <Text style={styles.taskName} numberOfLines={1}>
                      {item.wbsCode} - {item.name}
                    </Text>
                    <View style={styles.taskMetadata}>
                      <Chip
                        compact
                        style={[
                          styles.phaseChip,
                          { backgroundColor: item.getPhaseColor() + '20' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.phaseText,
                            { color: item.getPhaseColor() },
                          ]}
                        >
                          {item.getPhaseLabel()}
                        </Text>
                      </Chip>
                      {item.isOnCriticalPath() && (
                        <Chip compact style={styles.criticalChip}>
                          <Text style={styles.criticalText}>Critical</Text>
                        </Chip>
                      )}
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={false}
                    style={{ width: SCREEN_WIDTH - LEFT_COLUMN_WIDTH }}
                  >
                    <View style={[styles.taskBarContainer, { width: totalTimelineWidth }]}>
                      {/* Today marker */}
                      {todayPosition !== null && (
                        <View
                          style={[
                            styles.todayMarker,
                            { left: todayPosition },
                          ]}
                        />
                      )}

                      {/* Task bar */}
                      {(() => {
                        const { left, width } = getTaskBarLayout(item);
                        const progress = item.getProgressPercentage();
                        const isCritical = item.isOnCriticalPath();
                        const phaseColor = item.getPhaseColor();
                        const progressColor = '#4CAF50';

                        return (
                          <View
                            style={[
                              styles.taskBar,
                              {
                                left,
                                width,
                                backgroundColor: phaseColor + '30',
                                borderColor: isCritical ? '#d32f2f' : phaseColor,
                                borderWidth: isCritical ? 3 : 1,
                              },
                            ]}
                          >
                            {/* Progress overlay - green fill */}
                            {progress > 0 && (
                              <View
                                style={[
                                  styles.progressOverlay,
                                  {
                                    width: `${progress}%`,
                                    backgroundColor: progressColor,
                                  },
                                ]}
                              />
                            )}
                            {width > 50 && (
                              <Text style={styles.taskBarText} numberOfLines={1}>
                                {Math.round(progress)}%
                              </Text>
                            )}
                          </View>
                        );
                      })()}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {!selectedSite && (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
              Please select a site to view the Gantt chart
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  selectorCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  controlsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  legendCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  ganttContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 2,
    borderBottomColor: '#999',
  },
  headerColumn: {
    backgroundColor: '#e0e0e0',
    borderRightWidth: 2,
    borderRightColor: '#999',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 14,
    padding: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    height: TIMELINE_HEIGHT,
  },
  timelineColumn: {
    borderRightWidth: 1,
    borderRightColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekendColumn: {
    backgroundColor: '#f0f0f0',
  },
  timelineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  taskRowWrapper: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: TASK_HEIGHT,
  },
  taskRow: {
    flexDirection: 'row',
    minHeight: TASK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taskInfoColumn: {
    width: LEFT_COLUMN_WIDTH,
    padding: 8,
    borderRightWidth: 2,
    borderRightColor: '#999',
    justifyContent: 'center',
  },
  taskName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  phaseChip: {
    height: 20,
  },
  phaseText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  criticalChip: {
    height: 20,
    backgroundColor: '#ffebee',
  },
  criticalText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  taskBarContainer: {
    height: TASK_HEIGHT,
    position: 'relative',
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
  taskBarText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    zIndex: 1,
  },
  todayMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#2196F3',
    zIndex: 10,
  },
});

export default GanttChartScreen;
