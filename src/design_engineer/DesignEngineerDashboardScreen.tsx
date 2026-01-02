import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import MetricCard from './components/MetricCard';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';

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
  const { metrics, loading } = useDashboardMetrics(projectId, engineerId, refreshTrigger);

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

  if (loading) {
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
          <MetricCard title="Total Packages" value={metrics.totalDoorsPackages} subtitle="100 req/pkg" color="#007AFF" />
          <MetricCard title="Pending" value={metrics.pendingPackages} subtitle="Not received" color="#FFA500" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard title="Received" value={metrics.receivedPackages} subtitle="Under review" color="#2196F3" />
          <MetricCard title="Reviewed" value={metrics.reviewedPackages} subtitle="Completed" color="#4CAF50" />
        </View>

        {renderSectionHeader('Design RFQs', '📝')}
        <View style={styles.metricsRow}>
          <MetricCard title="Total RFQs" value={metrics.totalDesignRfqs} subtitle="Pre-PM200" color="#007AFF" />
          <MetricCard title="Draft" value={metrics.draftRfqs} subtitle="Not issued" color="#9E9E9E" />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard title="Issued" value={metrics.issuedRfqs} subtitle="Awaiting quotes" color="#2196F3" />
          <MetricCard title="Awarded" value={metrics.awardedRfqs} subtitle="Completed" color="#4CAF50" />
        </View>

        {renderSectionHeader('Performance Metrics', '📊')}
        <View style={styles.metricsRow}>
          <MetricCard
            title="Compliance Rate"
            value={`${metrics.complianceRate}%`}
            subtitle="Reviewed / Total"
            color={metrics.complianceRate >= 80 ? '#4CAF50' : metrics.complianceRate >= 50 ? '#FFA500' : '#F44336'}
          />
          <MetricCard
            title="Avg Processing"
            value={`${metrics.avgProcessingDays}`}
            subtitle="Days to review"
            color={
              metrics.avgProcessingDays <= 7 ? '#4CAF50' : metrics.avgProcessingDays <= 14 ? '#FFA500' : '#F44336'
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

        {metrics.totalDoorsPackages === 0 && metrics.totalDesignRfqs === 0 && (
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
