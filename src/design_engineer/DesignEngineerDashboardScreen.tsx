import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { DashboardLayout } from './dashboard/DashboardLayout';
import {
  DoorsPackageStatusWidget,
  RfqStatusWidget,
  ComplianceMetricWidget,
  ProcessingTimeWidget,
  RecentActivityWidget,
} from './dashboard/widgets';
import {
  useDoorsStatusData,
  useRfqStatusData,
  useComplianceData,
  useProcessingTimeData,
  useRecentActivityData,
} from './dashboard/hooks';
import { logger } from '../services/LoggingService';

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

  // Fetch widget data using custom hooks
  const doorsStatus = useDoorsStatusData(projectId);
  const rfqStatus = useRfqStatusData(projectId);
  const compliance = useComplianceData(projectId);
  const processingTime = useProcessingTimeData(projectId);
  const recentActivity = useRecentActivityData(projectId, 10);

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

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.roleLabel}>Design Engineer Dashboard</Text>
        </View>

        <DashboardLayout spacing={16}>
          <DoorsPackageStatusWidget
            data={doorsStatus.data}
            loading={doorsStatus.loading}
            error={doorsStatus.error}
            onRefresh={doorsStatus.refetch}
          />

          <RfqStatusWidget
            data={rfqStatus.data}
            loading={rfqStatus.loading}
            error={rfqStatus.error}
            onRefresh={rfqStatus.refetch}
          />

          <ComplianceMetricWidget
            data={compliance.data}
            loading={compliance.loading}
            error={compliance.error}
            onRefresh={compliance.refetch}
          />

          <ProcessingTimeWidget
            data={processingTime.data}
            loading={processingTime.loading}
            error={processingTime.error}
            onRefresh={processingTime.refetch}
          />

          <RecentActivityWidget
            data={recentActivity.data}
            loading={recentActivity.loading}
            error={recentActivity.error}
            onRefresh={recentActivity.refetch}
          />
        </DashboardLayout>
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
    padding: 20,
    paddingTop: 16,
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
