import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { DesignerHeader } from '../components/common/DesignerHeader';
import { MetricCard } from '../supervisor/dashboard/components/MetricCard';
import { QuickActionButton } from '../supervisor/dashboard/components/QuickActionButton';
import { AlertsSection } from '../supervisor/dashboard/components/AlertsSection';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { logger } from '../services/LoggingService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import TutorialModal from '../tutorial/TutorialModal';
import designerTutorialSteps from '../tutorial/designerTutorialSteps';
import TutorialService from '../services/TutorialService';

/**
 * DesignEngineerDashboardScreen (v5.0 - Aligned with Supervisor Pattern)
 *
 * Dashboard for Design Engineer role showing key metrics and summaries.
 *
 * Latest Improvements:
 * - Unified useDashboardData hook (replaces 6 individual widget hooks)
 * - Consistent header with DesignerHeader component
 * - MetricCard-based layout (replaces custom widgets)
 * - Quick Actions section for common tasks
 * - Alerts & Notifications section
 * - Pull-to-refresh support
 * - Improved performance and maintainability
 *
 * KPIs:
 * - Total Design Documents (draft/submitted/approved/rejected)
 * - DOORS Packages (pending/received/reviewed)
 * - Design RFQs (draft/issued/awarded)
 * - Compliance rate and processing time
 *
 * Design Engineer Responsibilities:
 * - Manage design documents and DOORS packages
 * - Create and manage Design RFQs (engineering phase, pre-PM200)
 * - Track design compliance and engineering progress
 * - One design engineer per project
 */

const DesignEngineerDashboardScreen = () => {
  const { projectId, projectName } = useDesignEngineerContext();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();

  // Unified dashboard data hook
  const { metrics, alerts, loading, error, refresh } = useDashboardData(projectId);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialInitialStep, setTutorialInitialStep] = useState(0);

  // Check if tutorial should be shown on mount or when triggered from header
  useEffect(() => {
    const checkTutorial = async () => {
      if (!user) return;
      // Triggered from header "Tutorial" menu item
      if (route.params?.showTutorial) {
        setTutorialInitialStep(0);
        setShowTutorial(true);
        return;
      }
      // First-login auto-show
      const shouldShow = await TutorialService.shouldShowTutorial(user.userId, 'design_engineer');
      if (shouldShow) {
        const progress = await TutorialService.getTutorialProgress(user.userId, 'design_engineer');
        setTutorialInitialStep(progress.currentStep);
        setShowTutorial(true);
      }
    };
    checkTutorial();
  }, [user, route.params?.showTutorial]);

  const handleTutorialDismiss = useCallback(async () => {
    if (user) {
      await TutorialService.dismissTutorial(user.userId, 'design_engineer', tutorialInitialStep);
    }
    setShowTutorial(false);
  }, [user, tutorialInitialStep]);

  const handleTutorialComplete = useCallback(async () => {
    if (user) {
      await TutorialService.markTutorialCompleted(user.userId, 'design_engineer');
    }
    setShowTutorial(false);
  }, [user]);

  const handleTutorialStepChange = useCallback(async (step: number) => {
    if (user) {
      await TutorialService.markStepCompleted(user.userId, 'design_engineer', step);
    }
  }, [user]);

  if (!projectId) {
    return (
      <ErrorBoundary>
        <View style={styles.centerContainer}>
          <Text variant="headlineSmall" style={styles.errorText}>
            No project assigned
          </Text>
          <Text variant="bodyMedium" style={styles.errorSubtext}>
            Please contact your administrator to assign a project
          </Text>
        </View>
      </ErrorBoundary>
    );
  }

  logger.debug('[Dashboard] Rendering with project:', projectId);

  // Check if we should show welcome empty state
  const hasNoData =
    !loading &&
    metrics &&
    metrics.totalDesignDocs === 0 &&
    metrics.doorsPackages === 0 &&
    metrics.designRfqs === 0;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <DesignerHeader
          title="Dashboard"
          subtitle={projectName}
          onRefresh={refresh}
          refreshing={loading}
        />

        {hasNoData ? (
          <EmptyState
            icon="rocket-launch"
            title="Welcome to Design Engineer Dashboard"
            message="Get started by creating your first design document, DOORS package, or RFQ"
            helpText="Design documents track engineering deliverables. DOORS packages track requirements (100 per package). Design RFQs manage vendor quotes during the engineering phase."
            tips={[
              'Start with design documents to track engineering deliverables',
              'Create DOORS packages to organize engineering requirements',
              'Use Design RFQs to request quotes from vendors',
              'Monitor compliance and processing times on this dashboard',
            ]}
            actionText="Create Design Document"
            onAction={() => navigation.navigate('DesignDocuments' as never)}
            secondaryActionText="Create DOORS Package"
            onSecondaryAction={() => navigation.navigate('DoorsPackages' as never)}
            variant="large"
          />
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text variant="bodyLarge">{new Date().toLocaleDateString()}</Text>
              <Text variant="headlineSmall">Welcome, {user?.fullName}!</Text>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design Documents"
                value={metrics?.totalDesignDocs || 0}
                icon="description"
                color="#2196F3"
                loading={loading}
                onPress={() => navigation.navigate('DesignDocuments' as never)}
              />
              <MetricCard
                title="DOORS Packages"
                value={metrics?.doorsPackages || 0}
                icon="folder-open"
                color="#673AB7"
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design RFQs"
                value={metrics?.designRfqs || 0}
                icon="request-quote"
                color="#FF9800"
                loading={loading}
                onPress={() => navigation.navigate('DesignRfqs' as never)}
              />
              <MetricCard
                title="Compliance Rate"
                value={`${metrics?.complianceRate || 0}%`}
                icon="verified"
                color={
                  (metrics?.complianceRate || 0) >= (metrics?.complianceTarget || 80)
                    ? '#4CAF50'
                    : '#F44336'
                }
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

            {/* Document Status Breakdown */}
            {metrics && metrics.totalDesignDocs > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Document Status
                </Text>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Draft"
                    value={metrics.draftDocs}
                    icon="edit"
                    color="#9E9E9E"
                    loading={loading}
                  />
                  <MetricCard
                    title="Submitted"
                    value={metrics.submittedDocs}
                    icon="send"
                    color="#2196F3"
                    loading={loading}
                  />
                </View>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Approved"
                    value={metrics.approvedDocs}
                    icon="check-circle"
                    color="#4CAF50"
                    loading={loading}
                  />
                  <MetricCard
                    title="Rejected"
                    value={metrics.rejectedDocs}
                    icon="cancel"
                    color="#F44336"
                    loading={loading}
                  />
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Quick Actions
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
                <QuickActionButton
                  icon="description"
                  label="Design Docs"
                  color="#2196F3"
                  onPress={() => navigation.navigate('DesignDocuments' as never)}
                />
                <QuickActionButton
                  icon="folder-open"
                  label="DOORS Packages"
                  color="#673AB7"
                  onPress={() => navigation.navigate('DoorsPackages' as never)}
                />
                <QuickActionButton
                  icon="request-quote"
                  label="Design RFQs"
                  color="#FF9800"
                  onPress={() => navigation.navigate('DesignRfqs' as never)}
                />
                <QuickActionButton
                  icon="location-on"
                  label="My Sites"
                  color="#4CAF50"
                  onPress={() => navigation.navigate('Sites' as never)}
                />
              </ScrollView>
            </View>

            {/* Alerts & Notifications */}
            {alerts.length > 0 && (
              <AlertsSection
                alerts={alerts}
                onAlertPress={(alert) => {
                  logger.debug('[Dashboard] Alert pressed:', alert);
                  // Handle alert navigation based on alert ID
                  if (alert.id.includes('doc')) {
                    navigation.navigate('DesignDocuments' as never);
                  } else if (alert.id.includes('doors') || alert.id.includes('compliance')) {
                    navigation.navigate('DoorsPackages' as never);
                  }
                }}
              />
            )}
          </ScrollView>
        )}

        {/* Tutorial Modal */}
        <TutorialModal
          visible={showTutorial}
          steps={designerTutorialSteps}
          initialStep={tutorialInitialStep}
          onDismiss={handleTutorialDismiss}
          onComplete={handleTutorialComplete}
          onStepChange={handleTutorialStepChange}
        />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  quickActionsScroll: {
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#999',
    textAlign: 'center',
  },
});

export default DesignEngineerDashboardScreen;
