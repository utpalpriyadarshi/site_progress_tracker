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
import { Text, Card, ActivityIndicator } from 'react-native-paper';
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
import { useThrottle } from '../utils/performance';
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

  // Load items when site changes
  useEffect(() => {
    const loadItems = async () => {
      if (!state.selection.selectedSite) {
        dispatch({ type: 'SET_ITEMS', payload: { items: [] } });
        return;
      }

      dispatch({ type: 'START_LOADING' });
      try {
        const siteItems = await database.collections
          .get<ItemModel>('items')
          .query(Q.where('site_id', state.selection.selectedSite.id))
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
          />
        </Card.Content>
      </Card>

      {state.selection.selectedSite && (
        <>
          {/* Zoom Controls */}
          <ZoomControls zoomLevel={state.selection.zoomLevel} onZoomChange={handleZoomChange} />

          {/* Legend */}
          <GanttLegend showTodayMarker={todayPosition !== null} />

          {/* Gantt Chart */}
          {state.ui.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1976D2" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : state.data.items.length === 0 ? (
            <EmptyState
              icon="chart-gantt"
              title="No Tasks for Gantt View"
              message="Add schedule items with dependencies to see Gantt visualization"
              helpText="Create items in the WBS tab to see them here"
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
              />

              {/* Tasks */}
              {state.data.items.map((item) => (
                <TaskRow
                  key={item.id}
                  item={item}
                  timelineStart={timelineBounds.start}
                  zoomLevel={state.selection.zoomLevel}
                  totalTimelineWidth={totalTimelineWidth}
                  todayPosition={todayPosition}
                />
              ))}

              {/* Key Date Milestones */}
              {keyDates.length > 0 && (
                <>
                  <View style={styles.keyDateSectionHeader}>
                    <Text style={styles.keyDateSectionTitle}>Key Dates</Text>
                  </View>
                  {keyDates.map((keyDate) => (
                    <KeyDateMilestoneRow
                      key={keyDate.id}
                      keyDate={keyDate}
                      timelineStart={timelineBounds.start}
                      zoomLevel={state.selection.zoomLevel}
                      totalTimelineWidth={totalTimelineWidth}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </>
      )}

      {!state.selection.selectedSite && (
        <EmptyState
          icon="office-building-outline"
          title="Select a Site"
          message="Please select a site to view the Gantt chart"
          variant="large"
        />
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
