/**
 * GanttChartScreen - Refactored
 *
 * Enhanced Gantt Chart with database integration, timeline visualization,
 * zoom controls, and critical path highlighting
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import SiteModel from '../../models/SiteModel';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Hooks
import { useGanttData } from './gantt-chart/hooks/useGanttData';
import { useGanttTimeline } from './gantt-chart/hooks/useGanttTimeline';

// Components
import {
  ZoomControls,
  GanttLegend,
  GanttHeader,
  TaskRow,
} from './gantt-chart/components';

// Types and constants
import { ZoomLevel } from './gantt-chart/utils/ganttConstants';

const GanttChartScreen: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const scrollViewRef = useRef<ScrollView>(null);

  // Load items data
  const { items, loading } = useGanttData(selectedSite);

  // Calculate timeline
  const {
    timelineBounds,
    timelineColumns,
    columnWidth,
    totalTimelineWidth,
    todayPosition,
  } = useGanttTimeline(items, zoomLevel);

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
          <ZoomControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />

          {/* Legend */}
          <GanttLegend showTodayMarker={todayPosition !== null} />

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
              <GanttHeader
                timelineColumns={timelineColumns}
                columnWidth={columnWidth}
                scrollViewRef={scrollViewRef}
              />

              {/* Tasks */}
              {items.map((item) => (
                <TaskRow
                  key={item.id}
                  item={item}
                  timelineStart={timelineBounds.start}
                  zoomLevel={zoomLevel}
                  totalTimelineWidth={totalTimelineWidth}
                  todayPosition={todayPosition}
                />
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
});

// Wrap with ErrorBoundary for graceful error handling
const GanttChartScreenWithBoundary = () => (
  <ErrorBoundary name="GanttChartScreen">
    <GanttChartScreen />
  </ErrorBoundary>
);

export default GanttChartScreenWithBoundary;
