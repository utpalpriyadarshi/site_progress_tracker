import React, { useReducer, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MetricCard from './components/MetricCard';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import {
  designEngineerDashboardReducer,
  createDashboardInitialState,
} from './state';

/**
 * DesignEngineerDashboardScreen (v3.0 - Refactored)
 *
 * Dashboard for Design Engineer role showing key metrics and summaries.
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
 *
 * Refactoring improvements:
 * - Extracted metric card to separate component
 * - Extracted metrics loading to custom hook
 * - Extracted types to separate file
 * - Simplified component structure
 */

const DesignEngineerDashboardScreen = () => {
  const { projectId, projectName, engineerId, refreshTrigger } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designEngineerDashboardReducer, createDashboardInitialState());

  // Load metrics
  useEffect(() => {
    loadMetrics();
  }, [projectId, engineerId, refreshTrigger]);

  const loadMetrics = async () => {
    if (!projectId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[Dashboard] Loading metrics for project:', projectId);

      const doorsCollection = database.collections.get('doors_packages');
      const allPackages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const pendingPackages = allPackages.filter((pkg: any) => pkg.status === 'pending').length;
      const receivedPackages = allPackages.filter((pkg: any) => pkg.status === 'received').length;
      const reviewedPackages = allPackages.filter((pkg: any) => pkg.status === 'reviewed').length;

      const rfqCollection = database.collections.get('rfqs');
      const allRfqs = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

      const draftRfqs = allRfqs.filter((rfq: any) => rfq.status === 'draft').length;
      const issuedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'issued').length;
      const awardedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'awarded').length;

      const complianceRate = allPackages.length > 0 ? (reviewedPackages / allPackages.length) * 100 : 0;

      let totalProcessingDays = 0;
      let processedCount = 0;

      allPackages.forEach((pkg: any) => {
        if (pkg.receivedDate && pkg.reviewedDate) {
          const processingTime = (pkg.reviewedDate - pkg.receivedDate) / (1000 * 60 * 60 * 24);
          totalProcessingDays += processingTime;
          processedCount++;
        }
      });

      const avgProcessingDays = processedCount > 0 ? Math.round(totalProcessingDays / processedCount) : 0;

      dispatch({
        type: 'SET_METRICS',
        payload: {
          metrics: {
            totalDoorsPackages: allPackages.length,
            pendingPackages,
            receivedPackages,
            reviewedPackages,
            totalDesignRfqs: allRfqs.length,
            draftRfqs,
            issuedRfqs,
            awardedRfqs,
            complianceRate: Math.round(complianceRate),
            avgProcessingDays,
          },
        },
      });

      logger.debug('[Dashboard] Metrics loaded:', {
        packages: allPackages.length,
        rfqs: allRfqs.length,
      });
    } catch (error) {
      logger.error('[Dashboard] Error loading metrics:', error);
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

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

  if (state.ui.loading) {
    return (
      <ErrorBoundary>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.projectName}>{projectName}</Text>
          <Text style={styles.roleLabel}>Design Engineer Dashboard</Text>
        </View>

        {renderSectionHeader('DOORS Packages', '📦')}
        <View style={styles.metricsRow}>
          <MetricCard title="Total Packages" value={state.data.metrics.totalDoorsPackages} subtitle="100 req/pkg" color="#007AFF" />
          <MetricCard title="Pending" value={state.data.metrics.pendingPackages} subtitle="Not received" color="#FFA500" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard title="Received" value={state.data.metrics.receivedPackages} subtitle="Under review" color="#2196F3" />
          <MetricCard title="Reviewed" value={state.data.metrics.reviewedPackages} subtitle="Completed" color="#4CAF50" />
        </View>

        {renderSectionHeader('Design RFQs', '📝')}
        <View style={styles.metricsRow}>
          <MetricCard title="Total RFQs" value={state.data.metrics.totalDesignRfqs} subtitle="Pre-PM200" color="#007AFF" />
          <MetricCard title="Draft" value={state.data.metrics.draftRfqs} subtitle="Not issued" color="#9E9E9E" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard title="Issued" value={state.data.metrics.issuedRfqs} subtitle="Awaiting quotes" color="#2196F3" />
          <MetricCard title="Awarded" value={state.data.metrics.awardedRfqs} subtitle="Completed" color="#4CAF50" />
        </View>

        {renderSectionHeader('Performance Metrics', '📊')}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Compliance Rate"
            value={`${state.data.metrics.complianceRate}%`}
            subtitle="Reviewed / Total"
            color={state.data.metrics.complianceRate >= 80 ? '#4CAF50' : state.data.metrics.complianceRate >= 50 ? '#FFA500' : '#F44336'}
          />
          <MetricCard
            title="Avg Processing"
            value={`${state.data.metrics.avgProcessingDays}`}
            subtitle="Days to review"
            color={
              state.data.metrics.avgProcessingDays <= 7 ? '#4CAF50' : state.data.metrics.avgProcessingDays <= 14 ? '#FFA500' : '#F44336'
            }
          />
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>Design Engineer Role</Text>
            <Text style={styles.infoText}>• Manage DOORS packages (100 requirements per equipment/material)</Text>
            <Text style={styles.infoText}>• Create Design RFQs for engineering phase (pre-PM200)</Text>
            <Text style={styles.infoText}>• Track design compliance and review progress</Text>
            <Text style={styles.infoText}>• One design engineer assigned per project</Text>
          </Card.Content>
        </Card>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionText}>View DOORS Packages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>View Design RFQs</Text>
          </TouchableOpacity>
        </View>

        {state.data.metrics.totalDoorsPackages === 0 && state.data.metrics.totalDesignRfqs === 0 && (
          <Card style={styles.emptyStateCard}>
            <Card.Content>
              <Text style={styles.emptyStateTitle}>Getting Started</Text>
              <Text style={styles.emptyStateText}>
                No DOORS packages or Design RFQs found. Use the tabs above to create your first package or RFQ.
              </Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 6,
    lineHeight: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  emptyStateCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFF8E1',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#EF6C00',
    lineHeight: 20,
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  bottomPadding: {
    height: 40,
  },
});

export default DesignEngineerDashboardScreen;
