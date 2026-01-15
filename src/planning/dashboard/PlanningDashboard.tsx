/**
 * PlanningDashboard Screen
 *
 * Main dashboard for the Planning role with widget-based overview.
 * Provides at-a-glance view of milestones, critical path, schedule,
 * activities, resources, and WBS progress.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useReducer, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useAccessibility } from '../../utils/accessibility';
import { dashboardReducer, initialState } from './dashboardReducer';

// Widgets
import {
  UpcomingMilestonesWidget,
  CriticalPathWidget,
  ScheduleOverviewWidget,
  RecentActivitiesWidget,
  ResourceUtilizationWidget,
  WBSProgressWidget,
} from './widgets';

// Hooks
import {
  useUpcomingMilestonesData,
  useCriticalPathData,
  useScheduleOverviewData,
  useRecentActivitiesData,
  useResourceUtilizationData,
  useWBSProgressData,
} from './hooks';

// ==================== Component ====================

const PlanningDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { announce } = useAccessibility();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Widget data hooks
  const milestones = useUpcomingMilestonesData();
  const criticalPath = useCriticalPathData();
  const scheduleOverview = useScheduleOverviewData();
  const recentActivities = useRecentActivitiesData();
  const resourceUtilization = useResourceUtilizationData();
  const wbsProgress = useWBSProgressData();

  // Calculate layout: 2 columns on tablets, 1 column on phones
  const isTablet = width >= 768;
  const columnCount = isTablet ? 2 : 1;

  // Check if all widgets are loaded
  const allWidgetsLoaded =
    !milestones.loading &&
    !criticalPath.loading &&
    !scheduleOverview.loading &&
    !recentActivities.loading &&
    !resourceUtilization.loading &&
    !wbsProgress.loading;

  // Announce when dashboard is loaded
  useEffect(() => {
    if (allWidgetsLoaded && state.loading) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
      announce('Planning Dashboard loaded with 6 widgets');
    }
  }, [allWidgetsLoaded, state.loading, announce]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    announce('Refreshing dashboard');

    // Refresh all widget data
    await Promise.all([
      milestones.refresh(),
      criticalPath.refresh(),
      scheduleOverview.refresh(),
      recentActivities.refresh(),
      resourceUtilization.refresh(),
      wbsProgress.refresh(),
    ]);

    dispatch({ type: 'SET_REFRESHING', payload: false });
    dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
    announce('Dashboard refreshed');
  }, [
    milestones,
    criticalPath,
    scheduleOverview,
    recentActivities,
    resourceUtilization,
    wbsProgress,
    announce,
  ]);

  // Navigation handlers
  const navigateToMilestones = useCallback(() => {
    navigation.navigate('MilestoneTracking');
  }, [navigation]);

  const navigateToSchedule = useCallback(() => {
    navigation.navigate('Schedule');
  }, [navigation]);

  const navigateToResources = useCallback(() => {
    navigation.navigate('Resources');
  }, [navigation]);

  const navigateToWBS = useCallback(() => {
    navigation.navigate('WBS');
  }, [navigation]);

  const navigateToGantt = useCallback(() => {
    navigation.navigate('Gantt');
  }, [navigation]);

  // Render widgets in grid layout
  const renderWidgets = () => {
    const widgets = [
      <ScheduleOverviewWidget
        key="schedule"
        overview={scheduleOverview.overview}
        loading={scheduleOverview.loading}
        error={scheduleOverview.error}
        onPress={navigateToSchedule}
        onRefresh={scheduleOverview.refresh}
      />,
      <UpcomingMilestonesWidget
        key="milestones"
        milestones={milestones.milestones}
        loading={milestones.loading}
        error={milestones.error}
        onPress={navigateToMilestones}
        onRefresh={milestones.refresh}
      />,
      <CriticalPathWidget
        key="critical"
        items={criticalPath.items}
        loading={criticalPath.loading}
        error={criticalPath.error}
        onPress={navigateToGantt}
        onRefresh={criticalPath.refresh}
      />,
      <WBSProgressWidget
        key="wbs"
        phases={wbsProgress.phases}
        summary={wbsProgress.summary}
        loading={wbsProgress.loading}
        error={wbsProgress.error}
        onPress={navigateToWBS}
        onRefresh={wbsProgress.refresh}
      />,
      <ResourceUtilizationWidget
        key="resources"
        resources={resourceUtilization.resources}
        summary={resourceUtilization.summary}
        loading={resourceUtilization.loading}
        error={resourceUtilization.error}
        onPress={navigateToResources}
        onRefresh={resourceUtilization.refresh}
      />,
      <RecentActivitiesWidget
        key="activities"
        activities={recentActivities.activities}
        loading={recentActivities.loading}
        error={recentActivities.error}
        onRefresh={recentActivities.refresh}
      />,
    ];

    if (isTablet) {
      // Two-column grid layout for tablets
      const rows = [];
      for (let i = 0; i < widgets.length; i += 2) {
        rows.push(
          <View key={i} style={styles.row}>
            <View style={styles.column}>{widgets[i]}</View>
            {widgets[i + 1] && <View style={styles.column}>{widgets[i + 1]}</View>}
          </View>
        );
      }
      return rows;
    }

    // Single column layout for phones
    return widgets;
  };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel="Planning Dashboard"
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Text variant="titleLarge" style={styles.headerTitle}>
          Planning Dashboard
        </Text>
        {state.lastUpdated && (
          <Text variant="labelSmall" style={styles.lastUpdated}>
            Updated {formatTimeAgo(state.lastUpdated)}
          </Text>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        accessible
        accessibilityLabel="Dashboard widgets, pull to refresh"
      >
        {renderWidgets()}
      </ScrollView>
    </View>
  );
};

// ==================== Helper Functions ====================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
  },
  lastUpdated: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
});

// ==================== Export ====================

const PlanningDashboardWithBoundary: React.FC = () => (
  <ErrorBoundary name="PlanningDashboard">
    <PlanningDashboardScreen />
  </ErrorBoundary>
);

export default PlanningDashboardWithBoundary;
