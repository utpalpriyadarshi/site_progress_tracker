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

import React, { useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme, Portal, Dialog, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useAccessibility } from '../../utils/accessibility';
import { useAuth } from '../../auth/AuthContext';
import { usePlanningContext } from '../context';
import { dashboardReducer, initialState } from './dashboardReducer';
import TutorialModal from '../../tutorial/TutorialModal';
import plannerTutorialSteps from '../../tutorial/plannerTutorialSteps';
import TutorialService from '../../services/TutorialService';

// Widgets
import {
  UpcomingMilestonesWidget,
  CriticalPathWidget,
  ScheduleOverviewWidget,
  RecentActivitiesWidget,
  ResourceUtilizationWidget,
  WBSProgressWidget,
  ProjectProgressWidget,
  KeyDateProgressChartWidget,
  KDTimelineProgressWidget,
  SiteProgressWidget,
} from './widgets';

// Hooks
import {
  useUpcomingMilestonesData,
  useCriticalPathData,
  useScheduleOverviewData,
  useRecentActivitiesData,
  useResourceUtilizationData,
  useWBSProgressData,
  useProjectProgressData,
  useKDProgressChartData,
  useKDTimelineProgressData,
  useSiteProgressData,
} from './hooks';
import { COLORS } from '../../theme/colors';
import { EmptyState } from '../../components/common/EmptyState';
import { SpinnerLoading } from '../../components/common/LoadingState';

// ==================== Component ====================

const PlanningDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { announce } = useAccessibility();
  const { user } = useAuth();
  const { dashboardCache, refreshDashboard, loading: contextLoading, error: contextError, sites } = usePlanningContext();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const route = useRoute<any>();

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialInitialStep, setTutorialInitialStep] = useState(0);

  // Progressive loading state for staggered widget rendering
  const [loadPriority2, setLoadPriority2] = useState(false);
  const [loadPriority3, setLoadPriority3] = useState(false);

  // Unlinked docs modal
  const [showUnlinkedModal, setShowUnlinkedModal] = useState(false);

  // Site name map built from context sites (covers all project sites)
  const allSiteNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    sites.forEach(s => { map[s.id] = (s as any).name; });
    return map;
  }, [sites]);

  // Schedule status drill-down modal
  const [scheduleModal, setScheduleModal] = useState<{
    visible: boolean;
    status: string;
    title: string;
    color: string;
  }>({ visible: false, status: '', title: '', color: '' });

  // Items filtered by the currently selected schedule status
  const scheduleModalItems = useMemo(() => {
    if (!scheduleModal.visible || !dashboardCache.allItems) return [];
    return dashboardCache.allItems.filter(item => {
      const s = (item as any).status;
      if (scheduleModal.status === 'completed') return s === 'completed';
      if (scheduleModal.status === 'delayed') return s === 'delayed';
      if (scheduleModal.status === 'on_track') return s === 'in_progress' || s === 'not_started';
      return false;
    });
  }, [scheduleModal.visible, scheduleModal.status, dashboardCache.allItems]);

  // Check if tutorial should be shown on mount or when triggered from drawer
  useEffect(() => {
    const checkTutorial = async () => {
      if (!user) return;
      // Triggered from drawer "Tutorial" item
      if (route.params?.showTutorial) {
        setTutorialInitialStep(0);
        setShowTutorial(true);
        return;
      }
      // First-login auto-show
      const shouldShow = await TutorialService.shouldShowTutorial(user.userId, 'planner');
      if (shouldShow) {
        const progress = await TutorialService.getTutorialProgress(user.userId, 'planner');
        setTutorialInitialStep(progress.currentStep);
        setShowTutorial(true);
      }
    };
    checkTutorial();
  }, [user, route.params?.showTutorial]);

  const handleTutorialDismiss = useCallback(async () => {
    if (user) {
      await TutorialService.dismissTutorial(user.userId, 'planner', tutorialInitialStep);
    }
    setShowTutorial(false);
  }, [user, tutorialInitialStep]);

  const handleTutorialComplete = useCallback(async () => {
    if (user) {
      await TutorialService.markTutorialCompleted(user.userId, 'planner');
    }
    setShowTutorial(false);
  }, [user]);

  const handleTutorialStepChange = useCallback(async (step: number) => {
    if (user) {
      await TutorialService.markStepCompleted(user.userId, 'planner', step);
    }
  }, [user]);

  // Progressive widget loading: minimal stagger so priority-1 widgets paint first
  useEffect(() => {
    // Priority 2 widgets load after first paint (next frame)
    const timer1 = setTimeout(() => setLoadPriority2(true), 0);
    // Priority 3 widgets load shortly after
    const timer2 = setTimeout(() => setLoadPriority3(true), 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Format current date like Supervisor dashboard
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Widget data hooks
  const milestones = useUpcomingMilestonesData();
  const criticalPath = useCriticalPathData();
  const scheduleOverview = useScheduleOverviewData();
  const recentActivities = useRecentActivitiesData();
  const resourceUtilization = useResourceUtilizationData();
  const wbsProgress = useWBSProgressData();
  const projectProgressData = useProjectProgressData();

  const kdProgressChart = useKDProgressChartData();
  const kdTimelineProgress = useKDTimelineProgressData();
  const siteProgress = useSiteProgressData();

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
    !wbsProgress.loading &&
    !projectProgressData.loading &&
    !kdProgressChart.loading &&
    !kdTimelineProgress.loading &&
    !siteProgress.loading;

  // Announce when dashboard is loaded
  useEffect(() => {
    if (allWidgetsLoaded && state.loading) {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
      announce('Planning Dashboard loaded with 10 widgets');
    }
  }, [allWidgetsLoaded, state.loading, announce]);

  // Handle pull-to-refresh — single context refresh replaces 10 individual calls
  const handleRefresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    announce('Refreshing dashboard');

    await refreshDashboard();

    dispatch({ type: 'SET_REFRESHING', payload: false });
    dispatch({ type: 'SET_LAST_UPDATED', payload: new Date() });
    announce('Dashboard refreshed');
  }, [refreshDashboard, announce]);

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

  // Schedule stat drill-down handlers
  const handleScheduleCompleted = useCallback(() => {
    setScheduleModal({ visible: true, status: 'completed', title: 'Completed Items', color: COLORS.SUCCESS });
  }, []);
  const handleScheduleOnTrack = useCallback(() => {
    setScheduleModal({ visible: true, status: 'on_track', title: 'On Track Items', color: '#1976D2' });
  }, []);
  const handleScheduleDelayed = useCallback(() => {
    setScheduleModal({ visible: true, status: 'delayed', title: 'Delayed Items', color: COLORS.ERROR });
  }, []);

  // Render widgets in grid layout with progressive loading
  const renderWidgets = () => {
    // Priority 1: Critical widgets - load immediately
    const widgets = [
      <ScheduleOverviewWidget
        key="schedule"
        overview={scheduleOverview.overview}
        projectProgress={projectProgressData.projectProgress}
        loading={scheduleOverview.loading || projectProgressData.loading}
        error={scheduleOverview.error}
        onPress={navigateToSchedule}
        onRefresh={scheduleOverview.refresh}
        onPressCompleted={handleScheduleCompleted}
        onPressOnTrack={handleScheduleOnTrack}
        onPressDelayed={handleScheduleDelayed}
      />,
      <ProjectProgressWidget
        key="projectProgress"
        projectProgress={projectProgressData.projectProgress}
        kdBreakdown={projectProgressData.kdBreakdown}
        loading={projectProgressData.loading}
        error={projectProgressData.error}
        onPress={navigateToSchedule}
        onRefresh={projectProgressData.refresh}
      />,
    ];

    // Priority 2: High priority widgets - load after 500ms
    if (loadPriority2) {
      widgets.push(
        <KeyDateProgressChartWidget
          key="kdProgressChart"
          keyDates={kdProgressChart.keyDates}
          projectStartDate={kdProgressChart.projectStartDate}
          loading={kdProgressChart.loading}
          error={kdProgressChart.error}
          onPress={navigateToSchedule}
          onRefresh={kdProgressChart.refresh}
        />,
        <KDTimelineProgressWidget
          key="kdTimelineProgress"
          timelineData={kdTimelineProgress.timelineData}
          loading={kdTimelineProgress.loading}
          error={kdTimelineProgress.error}
          onPress={navigateToSchedule}
          onRefresh={kdTimelineProgress.refresh}
        />,
        <SiteProgressWidget
          key="siteProgress"
          sites={siteProgress.sites}
          loading={siteProgress.loading}
          error={siteProgress.error}
          onRefresh={siteProgress.refresh}
        />,
        <UpcomingMilestonesWidget
          key="milestones"
          milestones={milestones.milestones}
          loading={milestones.loading}
          error={milestones.error}
          onPress={navigateToMilestones}
          onRefresh={milestones.refresh}
        />
      );
    }

    // Priority 3: Normal priority widgets - load after 1000ms
    if (loadPriority3) {
      widgets.push(
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
        />
      );
    }

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

  // Block only on contextLoading (auth + project lookup). Once the project is known,
  // let the dashboard render — each widget manages its own loading skeleton via
  // dashboardCache.dataReady inside its hook, so no full-screen wait is needed.
  if (contextLoading) {
    return (
      <View style={styles.container}>
        <SpinnerLoading message="Loading project data..." />
      </View>
    );
  }

  // Show error state when no project is assigned (or other context-level errors)
  if (contextError) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="folder-alert-outline"
          title="No Project Assigned"
          message={contextError}
          helpText="Ask your Admin to assign you to a project in Role Management."
          variant="large"
        />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel="Planning Dashboard"
    >
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
        {/* Welcome Header - Similar to Supervisor Dashboard */}
        <View style={styles.header}>
          <Text variant="bodyLarge" style={styles.dateText}>
            {currentDate}
          </Text>
          <Text variant="headlineSmall" style={styles.greeting}>
            Welcome, {user?.fullName || user?.username || 'Planner'}!
          </Text>
        </View>

        {/* Unlinked Documents Alert — tap to see which docs */}
        {projectProgressData.unlinkedDocCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => setShowUnlinkedModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`${projectProgressData.unlinkedDocCount} unlinked documents. Tap to view details.`}
          >
            <Icon name="alert-circle-outline" size={18} color="#E65100" />
            <Text style={styles.alertBannerText}>
              {projectProgressData.unlinkedDocCount} document(s) not linked to any Key Date — tap to view
            </Text>
            <Icon name="chevron-right" size={16} color="#E65100" />
          </TouchableOpacity>
        )}

        {renderWidgets()}
      </ScrollView>

      {/* Tutorial Modal */}
      <TutorialModal
        visible={showTutorial}
        steps={plannerTutorialSteps}
        initialStep={tutorialInitialStep}
        onDismiss={handleTutorialDismiss}
        onComplete={handleTutorialComplete}
        onStepChange={handleTutorialStepChange}
      />

      {/* Unlinked Documents Detail Modal */}
      <Portal>
        <Dialog visible={showUnlinkedModal} onDismiss={() => setShowUnlinkedModal(false)}>
          <Dialog.Title>Unlinked Design Documents</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 360 }}>
            <ScrollView>
              {projectProgressData.unlinkedDocs.map(doc => (
                <View key={doc.id} style={styles.unlinkedDocRow}>
                  <Icon name="file-document-outline" size={16} color="#E65100" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.unlinkedDocTitle} numberOfLines={2}>{doc.title}</Text>
                    <Text style={styles.unlinkedDocMeta}>
                      {doc.documentType}
                      {doc.siteId
                        ? ` · ${allSiteNameMap[doc.siteId] ?? 'Unknown Site'}`
                        : ' · No site assigned'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowUnlinkedModal(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Schedule Status Drill-Down Modal */}
      <Portal>
        <Dialog
          visible={scheduleModal.visible}
          onDismiss={() => setScheduleModal(s => ({ ...s, visible: false }))}
        >
          <Dialog.Title style={{ color: scheduleModal.color }}>
            {scheduleModal.title} ({scheduleModalItems.length})
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400 }}>
            <ScrollView>
              {scheduleModalItems.length === 0 ? (
                <Text style={styles.scheduleModalEmpty}>No items in this category.</Text>
              ) : (
                scheduleModalItems.map(item => {
                  const itemAny = item as any;
                  const siteName = itemAny.siteId
                    ? (allSiteNameMap[itemAny.siteId] ?? 'Unknown Site')
                    : 'No site';
                  const progress = Math.round(item.getProgressPercentage());
                  return (
                    <View key={item.id} style={styles.scheduleItemRow}>
                      <View style={[styles.scheduleItemDot, { backgroundColor: scheduleModal.color }]} />
                      <View style={styles.scheduleItemInfo}>
                        <Text style={styles.scheduleItemName} numberOfLines={2}>{itemAny.name}</Text>
                        <Text style={styles.scheduleItemMeta}>{siteName} · {progress}%</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setScheduleModal(s => ({ ...s, visible: false }))}>Close</Button>
            <Button onPress={() => { setScheduleModal(s => ({ ...s, visible: false })); navigateToSchedule(); }}>
              View Schedule
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  dateText: {
    color: '#666',
  },
  greeting: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING_BG,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  alertBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },
  unlinkedDocRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unlinkedDocTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  unlinkedDocMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  scheduleModalEmpty: {
    padding: 16,
    textAlign: 'center',
    color: '#888',
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  scheduleItemInfo: {
    flex: 1,
  },
  scheduleItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  scheduleItemMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
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
