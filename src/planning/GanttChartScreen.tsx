/**
 * GanttChartScreen - Phase 2 Refactor
 *
 * Enhanced Gantt Chart with database integration, timeline visualization,
 * zoom controls, and critical path highlighting
 * Refactored to use useReducer for state management (4 useState → 1 useReducer, 75% reduction)
 */

import React, { useReducer, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import SiteModel from '../../models/SiteModel';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../models/ItemModel';
import KeyDateModel from '../../models/KeyDateModel';
import { logger } from '../services/LoggingService';
import { useAccessibility } from '../utils/accessibility';
import { usePlanningContext } from './context';

// State management
import {
  ganttChartReducer,
  createGanttChartInitialState,
  type ZoomLevel,
} from './state/gantt-chart';

// Hooks
import { useGanttTimeline } from './gantt-chart/hooks/useGanttTimeline';

// Components
import {
  ZoomControls,
  GanttLegend,
  GanttHeader,
  TaskRow,
  KeyDateMilestoneRow,
} from './gantt-chart/components';

const GanttChartScreen: React.FC = () => {
  // Initialize reducer state
  const [state, dispatch] = useReducer(ganttChartReducer, createGanttChartInitialState());
  const scrollViewRef = useRef<ScrollView>(null);
  const { announce } = useAccessibility();
  const { projectId } = usePlanningContext();

  // State for key dates
  const [keyDates, setKeyDates] = React.useState<KeyDateModel[]>([]);

  // Baseline overlay toggle
  const [showBaseline, setShowBaseline] = React.useState(false);

  // Synchronized horizontal scroll: header is master, all row ScrollViews are slaves
  const rowScrollRefs = useRef<(ScrollView | null)[]>([]);
  const handleScrollX = useCallback((x: number) => {
    rowScrollRefs.current.forEach((ref) => ref?.scrollTo({ x, animated: false }));
  }, []);
  const makeRowScrollRefCallback = useCallback(
    (index: number) => (ref: ScrollView | null) => {
      rowScrollRefs.current[index] = ref;
    },
    []
  );

  // Load items when site changes
  useEffect(() => {
    // Clear row refs whenever the selection changes so stale refs don't linger
    rowScrollRefs.current = [];

    if (!state.selection.selectedSite) {
      dispatch({ type: 'SET_ITEMS', payload: { items: [] } });
      return;
    }

    const loadItems = async () => {
      dispatch({ type: 'START_LOADING' });
      try {
        const siteItems = await database.collections
          .get<ItemModel>('items')
          .query(Q.where('site_id', state.selection.selectedSite!.id))
          .fetch();

        // Sort by start date, then by WBS code
        siteItems.sort((a, b) => {
          const dateCompare = a.plannedStartDate - b.plannedStartDate;
          if (dateCompare !== 0) return dateCompare;
          return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
        });

        dispatch({ type: 'SET_ITEMS', payload: { items: siteItems } });
        announce(`Gantt chart loaded with ${siteItems.length} tasks`);
      } catch (error) {
        logger.error('[Gantt] Error loading items', error as Error);
        dispatch({ type: 'LOADING_ERROR' });
      }
    };

    loadItems();
  }, [state.selection.selectedSite, announce]);

  // Load key dates when project changes
  useEffect(() => {
    const loadKeyDates = async () => {
      if (!projectId) {
        setKeyDates([]);
        return;
      }

      try {
        const projectKeyDates = await database.collections
          .get<KeyDateModel>('key_dates')
          .query(Q.where('project_id', projectId))
          .fetch();

        // Sort by target days
        projectKeyDates.sort((a, b) => a.targetDays - b.targetDays);
        setKeyDates(projectKeyDates);
      } catch (error) {
        logger.error('[Gantt] Error loading key dates', error as Error);
      }
    };

    loadKeyDates();
  }, [projectId]);

  // Site selection handler
  const handleSiteChange = useCallback((site: SiteModel | null) => {
    dispatch({ type: 'SET_SELECTED_SITE', payload: { site } });
  }, []);

  // Zoom level handler
  const handleZoomChange = useCallback((zoomLevel: ZoomLevel) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: { zoomLevel } });
  }, []);

  // Calculate timeline
  const {
    timelineBounds,
    timelineColumns,
    columnWidth,
    totalTimelineWidth,
    todayPosition,
  } = useGanttTimeline(state.data.items, state.selection.zoomLevel);

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <SimpleSiteSelector
            selectedSite={state.selection.selectedSite}
            onSiteChange={handleSiteChange}
            updateContext={false}
          />
        </Card.Content>
      </Card>

      {/* Content gated on site selection */}
      {!state.selection.selectedSite ? (
        <EmptyState
          icon="map-marker-outline"
          title="Select a Site"
          message="Select a site above to view its Gantt chart"
          variant="default"
        />
      ) : state.ui.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <>
          {/* Zoom Controls + Baseline Toggle */}
          <View style={styles.controlsRow}>
            <View style={styles.zoomControlsWrapper}>
              <ZoomControls zoomLevel={state.selection.zoomLevel} onZoomChange={handleZoomChange} />
            </View>
            <Chip
              selected={showBaseline}
              icon="chart-timeline-variant"
              onPress={() => setShowBaseline(v => !v)}
              style={styles.baselineChip}
              accessibilityLabel={showBaseline ? 'Hide baseline overlay' : 'Show baseline overlay'}
            >
              Baseline
            </Chip>
          </View>

          {/* Legend */}
          <GanttLegend showTodayMarker={todayPosition !== null} showBaseline={showBaseline} />

          {/* Gantt Chart */}
          {state.data.items.length === 0 ? (
            <EmptyState
              icon="chart-gantt"
              title="No Tasks"
              message="No schedule items found for this site"
              variant="default"
            />
          ) : (
            <ScrollView
              style={styles.ganttContainer}
              accessible
              accessibilityLabel={`Gantt chart showing ${state.data.items.length} tasks across the project timeline`}
            >
              {/* Header */}
              <GanttHeader
                timelineColumns={timelineColumns}
                columnWidth={columnWidth}
                scrollViewRef={scrollViewRef}
                onScrollX={handleScrollX}
              />

              {/* Tasks */}
              {state.data.items.map((item, index) => (
                <TaskRow
                  key={item.id}
                  item={item}
                  timelineStart={timelineBounds.start}
                  zoomLevel={state.selection.zoomLevel}
                  totalTimelineWidth={totalTimelineWidth}
                  todayPosition={todayPosition}
                  showBaseline={showBaseline}
                  scrollRefCallback={makeRowScrollRefCallback(index)}
                />
              ))}

              {/* Key Date Milestones */}
              {keyDates.length > 0 && (
                <>
                  <View style={styles.keyDateSectionHeader}>
                    <Text style={styles.keyDateSectionTitle}>Key Dates</Text>
                  </View>
                  {keyDates.map((keyDate, kdIndex) => (
                    <KeyDateMilestoneRow
                      key={keyDate.id}
                      keyDate={keyDate}
                      timelineStart={timelineBounds.start}
                      zoomLevel={state.selection.zoomLevel}
                      totalTimelineWidth={totalTimelineWidth}
                      scrollRefCallback={makeRowScrollRefCallback(state.data.items.length + kdIndex)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </>
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  zoomControlsWrapper: {
    flex: 1,
  },
  baselineChip: {
    marginLeft: 4,
    marginRight: 8,
  },
  keyDateSectionHeader: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: '#FFB300',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
  },
  keyDateSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF8F00',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const GanttChartScreenWithBoundary = () => (
  <ErrorBoundary name="GanttChartScreen">
    <GanttChartScreen />
  </ErrorBoundary>
);

export default GanttChartScreenWithBoundary;
