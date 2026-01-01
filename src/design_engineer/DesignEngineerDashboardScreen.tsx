import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { database } from '../../models/database';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';

/**
 * DesignEngineerDashboardScreen (v2.11)
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
 */

interface DashboardMetrics {
  totalDoorsPackages: number;
  pendingPackages: number;
  receivedPackages: number;
  reviewedPackages: number;
  totalDesignRfqs: number;
  draftRfqs: number;
  issuedRfqs: number;
  awardedRfqs: number;
  complianceRate: number;
  avgProcessingDays: number;
}

const DesignEngineerDashboardScreen = () => {
  const { projectId, projectName, engineerId, refreshTrigger } = useDesignEngineerContext();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDoorsPackages: 0,
    pendingPackages: 0,
    receivedPackages: 0,
    reviewedPackages: 0,
    totalDesignRfqs: 0,
    draftRfqs: 0,
    issuedRfqs: 0,
    awardedRfqs: 0,
    complianceRate: 0,
    avgProcessingDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [projectId, engineerId, refreshTrigger]);

  const loadMetrics = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('[Dashboard] Loading metrics for project:', projectId);

      // Fetch DOORS packages
      const doorsCollection = database.collections.get('doors_packages');
      const allPackages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const pendingPackages = allPackages.filter((pkg: any) => pkg.status === 'pending').length;
      const receivedPackages = allPackages.filter((pkg: any) => pkg.status === 'received').length;
      const reviewedPackages = allPackages.filter((pkg: any) => pkg.status === 'reviewed').length;

      // Fetch Design RFQs
      const rfqCollection = database.collections.get('rfqs');
      const allRfqs = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

      const draftRfqs = allRfqs.filter((rfq: any) => rfq.status === 'draft').length;
      const issuedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'issued').length;
      const awardedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'awarded').length;

      // Calculate compliance rate (reviewed / total packages)
      const complianceRate = allPackages.length > 0 ? (reviewedPackages / allPackages.length) * 100 : 0;

      // Calculate average processing time (received to reviewed)
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

      setMetrics({
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
      });

      logger.debug('[Dashboard] Metrics loaded:', {
        packages: allPackages.length,
        rfqs: allRfqs.length,
      });
    } catch (error) {
      logger.error('[Dashboard] Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    color: string = '#007AFF'
  ) => (
    <Card style={styles.metricCard}>
      <Card.Content>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (!projectId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No project assigned</Text>
        <Text style={styles.errorSubtext}>Please contact your administrator to assign a project</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Text style={styles.roleLabel}>Design Engineer Dashboard</Text>
      </View>

      {/* DOORS Packages Section */}
      {renderSectionHeader('DOORS Packages', '📦')}
      <View style={styles.metricsRow}>
        {renderMetricCard('Total Packages', metrics.totalDoorsPackages, '100 req/pkg', '#007AFF')}
        {renderMetricCard('Pending', metrics.pendingPackages, 'Not received', '#FFA500')}
      </View>
      <View style={styles.metricsRow}>
        {renderMetricCard('Received', metrics.receivedPackages, 'Under review', '#2196F3')}
        {renderMetricCard('Reviewed', metrics.reviewedPackages, 'Completed', '#4CAF50')}
      </View>

      {/* Design RFQs Section */}
      {renderSectionHeader('Design RFQs', '📝')}
      <View style={styles.metricsRow}>
        {renderMetricCard('Total RFQs', metrics.totalDesignRfqs, 'Pre-PM200', '#007AFF')}
        {renderMetricCard('Draft', metrics.draftRfqs, 'Not issued', '#9E9E9E')}
      </View>
      <View style={styles.metricsRow}>
        {renderMetricCard('Issued', metrics.issuedRfqs, 'Awaiting quotes', '#2196F3')}
        {renderMetricCard('Awarded', metrics.awardedRfqs, 'Completed', '#4CAF50')}
      </View>

      {/* Performance Metrics Section */}
      {renderSectionHeader('Performance Metrics', '📊')}
      <View style={styles.metricsRow}>
        {renderMetricCard(
          'Compliance Rate',
          `${metrics.complianceRate}%`,
          'Reviewed / Total',
          metrics.complianceRate >= 80 ? '#4CAF50' : metrics.complianceRate >= 50 ? '#FFA500' : '#F44336'
        )}
        {renderMetricCard(
          'Avg Processing',
          `${metrics.avgProcessingDays}`,
          'Days to review',
          metrics.avgProcessingDays <= 7 ? '#4CAF50' : metrics.avgProcessingDays <= 14 ? '#FFA500' : '#F44336'
        )}
      </View>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>Design Engineer Role</Text>
          <Text style={styles.infoText}>
            • Manage DOORS packages (100 requirements per equipment/material)
          </Text>
          <Text style={styles.infoText}>• Create Design RFQs for engineering phase (pre-PM200)</Text>
          <Text style={styles.infoText}>• Track design compliance and review progress</Text>
          <Text style={styles.infoText}>• One design engineer assigned per project</Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
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

      {/* Status Summary */}
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
  metricCard: {
    flex: 1,
    elevation: 2,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
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
