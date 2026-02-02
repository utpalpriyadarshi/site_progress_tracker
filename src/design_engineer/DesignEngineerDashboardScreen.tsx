import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { DashboardLayout } from './dashboard/DashboardLayout';
import {
  DesignDocStatusWidget,
  DoorsPackageStatusWidget,
  RfqStatusWidget,
  ComplianceMetricWidget,
  ProcessingTimeWidget,
  RecentActivityWidget,
} from './dashboard/widgets';
import {
  useDesignDocStatusData,
  useDoorsStatusData,
  useRfqStatusData,
  useComplianceData,
  useProcessingTimeData,
  useRecentActivityData,
} from './dashboard/hooks';
import { logger } from '../services/LoggingService';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

/**
 * DesignEngineerDashboardScreen (v4.0 - Phase 3 Widget System)
 *
 * Dashboard for Design Engineer role showing key metrics and summaries.
 *
 * Phase 3 Improvements:
 * - Modular widget system with BaseWidget
 * - Interactive dashboard widgets
 * - Enhanced visualizations (charts, progress circles)
 * - Improved accessibility
 * - Refresh capability per widget
 * - Recent activity feed
 *
 * KPIs:
 * - Total DOORS Packages (100 requirements each)
 * - Pending/Received/Reviewed packages
 * - Total Design RFQs
 * - Draft/Issued/Awarded RFQs
 * - Design compliance rate
 * - Average processing time
 *
 * Design Engineer Responsibilities:
 * - Manage DOORS packages (100 requirements per equipment/material)
 * - Create and manage Design RFQs (engineering phase, pre-PM200)
 * - Track design compliance and engineering progress
 * - One design engineer per project
 */

const DesignEngineerDashboardScreen = () => {
  const { projectId, projectName } = useDesignEngineerContext();
  const navigation = useNavigation();
  const { logout } = useAuth();

  // Fetch widget data using custom hooks
  const designDocStatus = useDesignDocStatusData(projectId);
  const doorsStatus = useDoorsStatusData(projectId);
  const rfqStatus = useRfqStatusData(projectId);
  const compliance = useComplianceData(projectId);
  const processingTime = useProcessingTimeData(projectId);
  const recentActivity = useRecentActivityData(projectId, 10);

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  if (!projectId) {
    return (
      <ErrorBoundary>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No project assigned</Text>
          <Text style={styles.errorSubtext}>Please contact your administrator to assign a project</Text>
        </View>
      </ErrorBoundary>
    );
  }

  logger.debug('[Dashboard] Rendering with project:', projectId);

  // Check if we should show welcome empty state
  const hasNoData =
    !designDocStatus.loading &&
    !doorsStatus.loading &&
    !rfqStatus.loading &&
    designDocStatus.data.total === 0 &&
    doorsStatus.data.total === 0 &&
    rfqStatus.data.total === 0;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.projectName}>{projectName}</Text>
              <Text style={styles.roleLabel}>Design Engineer Dashboard</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasNoData ? (
          <EmptyState
            icon="rocket-launch"
            title="Welcome to Design Engineer Dashboard"
            message="Get started by creating your first DOORS Package or Design RFQ"
            helpText="DOORS packages track engineering requirements (100 per package). Design RFQs manage vendor quotes during the engineering phase."
            tips={[
              'Start with DOORS packages to organize engineering requirements',
              'Create Design RFQs to request quotes from vendors',
              'Track compliance and processing times on this dashboard',
            ]}
            actionText="Create DOORS Package"
            onAction={() => navigation.navigate('DoorsPackages' as never)}
            secondaryActionText="Create Design RFQ"
            onSecondaryAction={() => navigation.navigate('DesignRfqs' as never)}
            variant="large"
          />
        ) : (
          <DashboardLayout spacing={16}>
            <DesignDocStatusWidget
              data={designDocStatus.data}
              loading={designDocStatus.loading}
              error={designDocStatus.error}
              onRefresh={designDocStatus.refetch}
              onPress={() => navigation.navigate('DesignDocuments' as never)}
            />

            <DoorsPackageStatusWidget
              data={doorsStatus.data}
              loading={doorsStatus.loading}
              error={doorsStatus.error}
              onRefresh={doorsStatus.refetch}
              onPress={() => navigation.navigate('DoorsPackages' as never)}
            />

            <RfqStatusWidget
              data={rfqStatus.data}
              loading={rfqStatus.loading}
              error={rfqStatus.error}
              onRefresh={rfqStatus.refetch}
              onPress={() => navigation.navigate('DesignRfqs' as never)}
            />

            <ComplianceMetricWidget
              data={compliance.data}
              loading={compliance.loading}
              error={compliance.error}
              onRefresh={compliance.refetch}
              onPress={() => navigation.navigate('DoorsPackages' as never)}
            />

            <ProcessingTimeWidget
              data={processingTime.data}
              loading={processingTime.loading}
              error={processingTime.error}
              onRefresh={processingTime.refetch}
              onPress={() => navigation.navigate('DoorsPackages' as never)}
            />

            <RecentActivityWidget
              data={recentActivity.data}
              loading={recentActivity.loading}
              error={recentActivity.error}
              onRefresh={recentActivity.refetch}
            />
          </DashboardLayout>
        )}
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
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default DesignEngineerDashboardScreen;
