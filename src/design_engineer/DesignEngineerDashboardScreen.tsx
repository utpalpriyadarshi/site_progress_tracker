import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, ProgressBar, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { MetricCard } from '../supervisor/dashboard/components/MetricCard';
import { QuickActionButton } from '../supervisor/dashboard/components/QuickActionButton';
import { AlertsSection } from '../supervisor/dashboard/components/AlertsSection';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useSiteDocProgressData } from './dashboard/hooks/useSiteDocProgressData';
import { SiteProgressWidget } from '../planning/dashboard/widgets/SiteProgressWidget';
import { logger } from '../services/LoggingService';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import TutorialModal from '../tutorial/TutorialModal';
import designerTutorialSteps from '../tutorial/designerTutorialSteps';
import TutorialService from '../services/TutorialService';

/**
 * DesignEngineerDashboardScreen (v6.0 - Dual-Scope Dashboard)
 *
 * Shows two sections:
 * - "My Work": Metrics scoped to engineer's assigned sites
 * - "Project Overview": Full project-wide metrics
 *
 * Alerts are generated from "My Work" data only.
 */

const DesignEngineerDashboardScreen = () => {
  const { projectId, projectName, engineerId } = useDesignEngineerContext();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuth();

  // Dual-scope dashboard data hook
  const { myMetrics, projectMetrics, alerts, kdDocProgress, loading, error, refresh } = useDashboardData(projectId, engineerId);
  const siteDocProgress = useSiteDocProgressData(projectId, engineerId);

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

  // Show empty state only when BOTH scopes have no data at all
  const hasNoData =
    !loading &&
    myMetrics &&
    projectMetrics &&
    myMetrics.totalDesignDocs === 0 &&
    myMetrics.doorsPackages === 0 &&
    myMetrics.designRfqs === 0 &&
    projectMetrics.totalDesignDocs === 0 &&
    projectMetrics.doorsPackages === 0 &&
    projectMetrics.designRfqs === 0;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
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
              <Text variant="headlineSmall">Welcome, {user?.fullName || user?.username || 'Engineer'}!</Text>
            </View>

            {/* ===== MY WORK SECTION ===== */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                My Work
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                Scoped to your assigned sites
              </Text>
            </View>

            {/* My Work Metrics Grid */}
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design Documents"
                value={myMetrics?.totalDesignDocs || 0}
                icon="description"
                color="#2196F3"
                loading={loading}
                onPress={() => navigation.navigate('DesignDocuments' as never)}
              />
              <MetricCard
                title="DOORS Packages"
                value={myMetrics?.doorsPackages || 0}
                icon="folder-open"
                color="#673AB7"
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design RFQs"
                value={myMetrics?.designRfqs || 0}
                icon="request-quote"
                color="#FF9800"
                loading={loading}
                onPress={() => navigation.navigate('DesignRfqs' as never)}
              />
              <MetricCard
                title="Compliance Rate"
                value={`${myMetrics?.complianceRate || 0}%`}
                icon="verified"
                color={
                  (myMetrics?.complianceRate || 0) >= (myMetrics?.complianceTarget || 80)
                    ? '#4CAF50'
                    : '#F44336'
                }
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

            {/* My Work - Document Status Breakdown */}
            {myMetrics && myMetrics.totalDesignDocs > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Document Status
                </Text>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Draft"
                    value={myMetrics.draftDocs}
                    icon="edit"
                    color="#9E9E9E"
                    loading={loading}
                  />
                  <MetricCard
                    title="Submitted"
                    value={myMetrics.submittedDocs}
                    icon="send"
                    color="#2196F3"
                    loading={loading}
                  />
                </View>
                <View style={styles.metricsGrid}>
                  <MetricCard
                    title="Approved"
                    value={myMetrics.approvedDocs}
                    icon="check-circle"
                    color="#4CAF50"
                    loading={loading}
                  />
                  <MetricCard
                    title="Rejected"
                    value={myMetrics.rejectedDocs}
                    icon="cancel"
                    color="#F44336"
                    loading={loading}
                  />
                </View>
              </View>
            )}

            {/* Site Docs Progress Widget */}
            <View style={styles.section}>
              <SiteProgressWidget
                sites={siteDocProgress.sites}
                loading={siteDocProgress.loading}
                error={siteDocProgress.error}
                docsOnly
                onRefresh={siteDocProgress.refresh}
              />
            </View>

            {/* Key Date Progress Section */}
            {kdDocProgress.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Key Date Progress
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  Your design document contribution to project milestones
                </Text>
                {kdDocProgress.map((kd) => (
                  <Card key={kd.keyDateId} style={styles.kdProgressCard}>
                    <Card.Content>
                      <View style={styles.kdProgressHeader}>
                        <View style={styles.kdProgressInfo}>
                          <Text style={styles.kdCode}>{kd.keyDateCode}</Text>
                          <Text style={styles.kdDescription} numberOfLines={1}>
                            {kd.keyDateDescription}
                          </Text>
                        </View>
                        <Text style={[
                          styles.kdProgressValue,
                          { color: kd.docProgress >= 100 ? '#4CAF50' : kd.docProgress > 0 ? '#2196F3' : '#999' },
                        ]}>
                          {Math.round(kd.docProgress)}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={kd.docProgress / 100}
                        color={kd.docProgress >= 100 ? '#4CAF50' : '#2196F3'}
                        style={styles.kdProgressBar}
                      />
                      <Text style={styles.kdProgressDetail}>
                        {kd.approvedDocs}/{kd.totalDocs} documents approved
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}

            {/* Alerts & Notifications (from My Work data) */}
            {alerts.length > 0 && (
              <AlertsSection
                alerts={alerts}
                onAlertPress={(alert) => {
                  logger.debug('[Dashboard] Alert pressed:', alert);
                  if (alert.id.includes('doc')) {
                    navigation.navigate('DesignDocuments' as never);
                  } else if (alert.id.includes('doors') || alert.id.includes('compliance')) {
                    navigation.navigate('DoorsPackages' as never);
                  }
                }}
              />
            )}

            {/* ===== PROJECT OVERVIEW SECTION ===== */}
            <View style={styles.projectOverviewHeader}>
              <Text variant="titleMedium" style={styles.projectOverviewTitle}>
                Project Overview
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                All project-wide totals
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design Documents"
                subtitle="Project total"
                value={projectMetrics?.totalDesignDocs || 0}
                icon="description"
                color="#90CAF9"
                loading={loading}
                onPress={() => navigation.navigate('DesignDocuments' as never)}
              />
              <MetricCard
                title="DOORS Packages"
                subtitle="Project total"
                value={projectMetrics?.doorsPackages || 0}
                icon="folder-open"
                color="#B39DDB"
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Design RFQs"
                subtitle="Project total"
                value={projectMetrics?.designRfqs || 0}
                icon="request-quote"
                color="#FFCC80"
                loading={loading}
                onPress={() => navigation.navigate('DesignRfqs' as never)}
              />
              <MetricCard
                title="Compliance Rate"
                subtitle="Project total"
                value={`${projectMetrics?.complianceRate || 0}%`}
                icon="verified"
                color={
                  (projectMetrics?.complianceRate || 0) >= (projectMetrics?.complianceTarget || 80)
                    ? '#81C784'
                    : '#E57373'
                }
                loading={loading}
                onPress={() => navigation.navigate('DoorsPackages' as never)}
              />
            </View>

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
    marginBottom: 4,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#999',
  },
  projectOverviewHeader: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  projectOverviewTitle: {
    marginHorizontal: 16,
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#666',
  },
  kdProgressCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 1,
  },
  kdProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kdProgressInfo: {
    flex: 1,
    marginRight: 12,
  },
  kdCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  kdDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  kdProgressValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  kdProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  kdProgressDetail: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
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
