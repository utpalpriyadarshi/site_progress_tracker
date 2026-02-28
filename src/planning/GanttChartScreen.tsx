/**
 * GanttChartScreen - Phase 2 Refactor
 *
 * Enhanced Gantt Chart with database integration, timeline visualization,
 * zoom controls, and critical path highlighting.
 * Refactored to use useReducer for state management (4 useState → 1 useReducer, 75% reduction).
 *
 * Sub-tabs: Tasks | Key Dates
 * - Tasks tab: item Gantt bars with progress, critical path, baseline overlay
 * - Key Dates tab: diamond milestone markers on the same timeline engine
 */

import React, { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Text, Card, ActivityIndicator, Chip, SegmentedButtons } from 'react-native-paper';
import dayjs from 'dayjs';
import SiteModel from '../../models/SiteModel';
import KeyDateModel from '../../models/KeyDateModel';
import ItemModel from '../../models/ItemModel';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { useAccessibility } from '../utils/accessibility';
import { usePlanningContext } from './context';
import { type TimelineBounds } from './gantt-chart/utils/ganttCalculations';

// State management
import {
  ganttChartReducer,
  createGanttChartInitialState,
  type ZoomLevel,
  type GanttSubTab,
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
  const [state, dispatch] = useReducer(ganttChartReducer, createGanttChartInitialState());
  const scrollViewRef = useRef<ScrollView>(null);
  const { announce } = useAccessibility();
  const { projectId } = usePlanningContext();

  // Key dates state
  const [keyDates, setKeyDates] = React.useState<KeyDateModel[]>([]);

  // Baseline overlay toggle (Tasks tab only)
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

  // Sub-tab handler — also resets scroll refs so stale positions don't linger
  const handleSubTabChange = useCallback((tab: string) => {
    rowScrollRefs.current = [];
    dispatch({ type: 'SET_SUB_TAB', payload: { tab: tab as GanttSubTab } });
  }, []);

  // Tasks timeline (driven by loaded items)
  const taskTimeline = useGanttTimeline(state.data.items, state.selection.zoomLevel);

  // Key Dates timeline bounds — derived from key date target dates
  const keyDateBounds = useMemo((): TimelineBounds | undefined => {
    if (keyDates.length === 0) return undefined;
    const timestamps = keyDates.map((kd) =>
      kd.targetDate ? kd.targetDate : dayjs().add(kd.targetDays, 'day').valueOf()
    );
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    return {
      start: dayjs(minTs).subtract(7, 'day').startOf('day'),
      end: dayjs(maxTs).add(14, 'day').endOf('day'),
    };
  }, [keyDates]);

  // Key Dates timeline (driven by key date target dates)
  const kdTimeline = useGanttTimeline([], state.selection.zoomLevel, keyDateBounds);

  // Pick the active timeline based on current sub-tab
  const isKeyDateTab = state.selection.activeSubTab === 'key_dates';
  const activeTimeline = isKeyDateTab ? kdTimeline : taskTimeline;

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

      {/* Sub-tab switcher: Tasks | Key Dates */}
      <SegmentedButtons
        value={state.selection.activeSubTab}
        onValueChange={handleSubTabChange}
        buttons={[
          { value: 'tasks', label: 'Tasks', icon: 'format-list-bulleted' },
          { value: 'key_dates', label: 'Key Dates', icon: 'flag-checkered' },
        ]}
        style={styles.subTabButtons}
      />

      {/* Zoom Controls + Baseline Toggle — always visible */}
      <View style={styles.controlsRow}>
        <View style={styles.zoomControlsWrapper}>
          <ZoomControls zoomLevel={state.selection.zoomLevel} onZoomChange={handleZoomChange} />
        </View>
        {!isKeyDateTab && (
          <Chip
            selected={showBaseline}
            icon="chart-timeline-variant"
            onPress={() => setShowBaseline(v => !v)}
            style={styles.baselineChip}
            accessibilityLabel={showBaseline ? 'Hide baseline overlay' : 'Show baseline overlay'}
          >
            Baseline
          </Chip>
        )}
      </View>

      {/* Legend — variant changes per tab */}
      <GanttLegend
        showTodayMarker={activeTimeline.todayPosition !== null}
        showBaseline={!isKeyDateTab && showBaseline}
        variant={isKeyDateTab ? 'key_dates' : 'tasks'}
      />

      {/* Content */}
      {state.ui.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : !state.selection.selectedSite ? (
        <EmptyState
          icon="map-marker-outline"
          title="Select a Site"
          message="Select a site above to view its Gantt chart"
          variant="default"
        />
      ) : isKeyDateTab ? (
        // ── Key Dates tab ──
        keyDates.length === 0 ? (
          <EmptyState
            icon="flag-checkered"
            title="No Key Dates"
            message="No key dates found for this project"
            variant="default"
          />
        ) : (
          <ScrollView
            style={styles.ganttContainer}
            accessible
            accessibilityLabel={`Key dates Gantt showing ${keyDates.length} milestones`}
          >
            <GanttHeader
              timelineColumns={kdTimeline.timelineColumns}
              columnWidth={kdTimeline.columnWidth}
              scrollViewRef={scrollViewRef}
              onScrollX={handleScrollX}
              leftColumnLabel="Key Date"
            />
            {keyDates.map((keyDate, kdIndex) => (
              <KeyDateMilestoneRow
                key={keyDate.id}
                keyDate={keyDate}
                timelineStart={kdTimeline.timelineBounds.start}
                zoomLevel={state.selection.zoomLevel}
                totalTimelineWidth={kdTimeline.totalTimelineWidth}
                scrollRefCallback={makeRowScrollRefCallback(kdIndex)}
              />
            ))}
          </ScrollView>
        )
      ) : (
        // ── Tasks tab ──
        state.data.items.length === 0 ? (
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
            <GanttHeader
              timelineColumns={taskTimeline.timelineColumns}
              columnWidth={taskTimeline.columnWidth}
              scrollViewRef={scrollViewRef}
              onScrollX={handleScrollX}
              leftColumnLabel="Task"
            />
            {state.data.items.map((item, index) => (
              <TaskRow
                key={item.id}
                item={item}
                timelineStart={taskTimeline.timelineBounds.start}
                zoomLevel={state.selection.zoomLevel}
                totalTimelineWidth={taskTimeline.totalTimelineWidth}
                todayPosition={taskTimeline.todayPosition}
                showBaseline={showBaseline}
                scrollRefCallback={makeRowScrollRefCallback(index)}
              />
            ))}
          </ScrollView>
        )
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
  subTabButtons: {
    marginHorizontal: 16,
    marginBottom: 4,
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
});

// Wrap with ErrorBoundary for graceful error handling
const GanttChartScreenWithBoundary = () => (
  <ErrorBoundary name="GanttChartScreen">
    <GanttChartScreen />
  </ErrorBoundary>
);

export default GanttChartScreenWithBoundary;
