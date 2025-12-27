import React, { useState, useEffect } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { useBomData } from '../shared/hooks/useBomData';
import LogisticsOptimizationService, {
  OptimizationRecommendation,
  PerformanceMetrics,
  PredictiveInsight,
  CostAnalysis,
} from '../services/LogisticsOptimizationService';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import DoorsStatisticsService, { DoorsKPIs } from '../services/DoorsStatisticsService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';


/**
 * LogisticsDashboardScreen
 *
 * Unified logistics dashboard providing:
 * - Executive overview with key KPIs
 * - Critical alerts and pending actions
 * - Performance metrics and trends
 * - Optimization recommendations
 * - Quick navigation to detailed tabs
 *
 * Week 1: Foundation with core KPIs
 * Week 6: Enhanced with advanced analytics
 */

const LogisticsDashboardScreen = () => {
  const {
    selectedProjectId,
    setSelectedProjectId,
    projects,
    materials,
    loading,
    refreshing,
    alerts,
    pendingActions,
    kpis,
    refresh,
    acknowledgeAlert,
    dismissAlert,
  } = useLogistics();

  const {
    boms,
    bomItems,
    loading: bomLoading,
    refresh: refreshBoms,
  } = useBomData(selectedProjectId || '');

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [doorsKPIs, setDoorsKPIs] = useState<DoorsKPIs | null>(null);
  const [doorsPackages, setDoorsPackages] = useState<DoorsPackageModel[]>([]);

  // Load DOORS packages
  useEffect(() => {
    if (selectedProjectId) {
      const loadDoorsPackages = async () => {
        try {
          logger.debug('[Dashboard] Loading DOORS packages for project:', selectedProjectId);
          const packagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
          const packages = await packagesCollection.query(
            Q.where('project_id', selectedProjectId)
          ).fetch();
          logger.debug(`[Dashboard] Found ${packages.length} DOORS packages`);
          setDoorsPackages(packages);

          // Calculate DOORS KPIs
          if (packages.length > 0) {
            const kpis = DoorsStatisticsService.calculateKPIs(packages);
            logger.debug('[Dashboard] DOORS KPIs calculated:', kpis);
            setDoorsKPIs(kpis);
          } else {
            logger.debug('[Dashboard] No DOORS packages found, KPIs will not display');
            setDoorsKPIs(null);
          }
        } catch (error) {
          logger.error('[Dashboard] Error loading DOORS packages:', error);
        }
      };

      loadDoorsPackages();
    }
  }, [selectedProjectId]);

  // Calculate analytics when data changes
  useEffect(() => {
    if (materials.length > 0) {
      // Generate recommendations
      const recs = LogisticsOptimizationService.generateRecommendations(
        materials,
        boms,
        bomItems
      );
      setRecommendations(recs.slice(0, 5)); // Top 5 recommendations

      // Calculate performance metrics
      const metrics = LogisticsOptimizationService.calculatePerformanceMetrics(
        materials,
        bomItems
      );
      setPerformanceMetrics(metrics);

      // Generate predictive insights
      const insights = LogisticsOptimizationService.generatePredictiveInsights(
        materials,
        bomItems
      );
      setPredictiveInsights(insights);

      // Analyze costs
      const costs = LogisticsOptimizationService.analyzeCosts(materials);
      setCostAnalysis(costs);
    }
  }, [materials, boms, bomItems]);

  const handleRefresh = async () => {
    await Promise.all([refresh(), refreshBoms()]);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getSeverityBgColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#FFEBEE';
      case 'high':
        return '#FFF3E0';
      case 'medium':
        return '#FFF8E1';
      case 'low':
        return '#E3F2FD';
      default:
        return '#F5F5F5';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const renderProjectSelector = () => {
    if (projects.length === 0) return null;

    return (
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Project:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {projects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectChip,
                selectedProjectId === project.id && styles.projectChipActive,
              ]}
              onPress={() => setSelectedProjectId(project.id)}
            >
              <Text
                style={[
                  styles.projectChipText,
                  selectedProjectId === project.id && styles.projectChipTextActive,
                ]}
              >
                {project.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderKPICards = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiScroll}>
        {/* Material KPIs */}
        <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
          <Text style={styles.kpiValue}>{kpis.totalMaterialsTracked}</Text>
          <Text style={styles.kpiLabel}>Materials Tracked</Text>
          {kpis.materialsAtRisk > 0 && (
            <Text style={styles.kpiSubtext}>{kpis.materialsAtRisk} at risk</Text>
          )}
        </View>

        <View style={[styles.kpiCard, styles.kpiCardWarning]}>
          <Text style={styles.kpiValue}>{kpis.procurementCycleTime}d</Text>
          <Text style={styles.kpiLabel}>Procurement Cycle</Text>
          <Text style={styles.kpiSubtext}>Average days</Text>
        </View>

        {/* Equipment KPIs */}
        <View style={[styles.kpiCard]}>
          <Text style={styles.kpiValue}>{kpis.totalEquipment}</Text>
          <Text style={styles.kpiLabel}>Total Equipment</Text>
          <Text style={styles.kpiSubtext}>{kpis.equipmentAvailability.toFixed(0)}% available</Text>
        </View>

        {/* Delivery KPIs */}
        <View style={[styles.kpiCard, styles.kpiCardSuccess]}>
          <Text style={styles.kpiValue}>{kpis.onTimeDeliveryRate.toFixed(0)}%</Text>
          <Text style={styles.kpiLabel}>On-Time Delivery</Text>
          <Text style={styles.kpiSubtext}>{kpis.deliveriesThisWeek} this week</Text>
        </View>

        {/* Inventory KPIs */}
        <View style={[styles.kpiCard, styles.kpiCardInfo]}>
          <Text style={styles.kpiValue}>₹{(kpis.totalInventoryValue / 100000).toFixed(1)}L</Text>
          <Text style={styles.kpiLabel}>Inventory Value</Text>
          <Text style={styles.kpiSubtext}>Turnover: {kpis.inventoryTurnover.toFixed(1)}x</Text>
        </View>

        {/* Stock Accuracy */}
        <View style={[styles.kpiCard]}>
          <Text style={styles.kpiValue}>{kpis.stockAccuracy.toFixed(0)}%</Text>
          <Text style={styles.kpiLabel}>Stock Accuracy</Text>
        </View>
      </ScrollView>
    );
  };

  const renderDoorsMetrics = () => {
    if (!doorsKPIs || doorsKPIs.totalPackages === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 DOORS Requirements Management</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{doorsKPIs.totalPackages}</Text>
            <Text style={styles.metricLabel}>DOORS Packages</Text>
            {doorsKPIs.criticalPackages > 0 && (
              <Text style={[styles.metricSubtext, { color: '#F44336' }]}>
                {doorsKPIs.criticalPackages} critical
              </Text>
            )}
          </View>

          <View style={styles.metricItem}>
            <Text style={[
              styles.metricValue,
              {
                color: doorsKPIs.averageCompliance >= 95 ? '#4CAF50' :
                       doorsKPIs.averageCompliance >= 80 ? '#FF9800' : '#F44336'
              }
            ]}>
              {doorsKPIs.averageCompliance.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Avg Compliance</Text>
            <Text style={styles.metricSubtext}>
              {doorsKPIs.compliantRequirements}/{doorsKPIs.totalRequirements} requirements
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{doorsKPIs.approvedPackages}</Text>
            <Text style={styles.metricLabel}>Approved</Text>
            <Text style={styles.metricSubtext}>
              {doorsKPIs.pendingReview} under review
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{doorsKPIs.packagesWithPO}</Text>
            <Text style={styles.metricLabel}>With PO</Text>
            <Text style={styles.metricSubtext}>Procurement active</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCriticalAlerts = () => {
    const criticalAlerts = alerts
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .slice(0, 3);

    if (criticalAlerts.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critical Alerts</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No critical alerts</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Critical Alerts ({criticalAlerts.length})</Text>
        {criticalAlerts.map(alert => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              { borderLeftColor: getSeverityColor(alert.severity) },
            ]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertTitleRow}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityBgColor(alert.severity) },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: getSeverityColor(alert.severity) },
                    ]}
                  >
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.alertDescription}>{alert.description}</Text>
            </View>
            <Text style={styles.alertAction}>Action: {alert.recommendedAction}</Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => acknowledgeAlert(alert.id)}
              >
                <Text style={styles.alertButtonText}>Acknowledge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={() => dismissAlert(alert.id)}
              >
                <Text style={styles.alertButtonTextSecondary}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPendingActions = () => {
    const topActions = pendingActions
      .filter(a => a.status === 'pending')
      .slice(0, 3);

    if (topActions.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Actions</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No pending actions</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Actions ({topActions.length})</Text>
        {topActions.map(action => (
          <View key={action.id} style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(action.priority) },
                ]}
              >
                <Text style={styles.priorityText}>{action.priority.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.actionDescription}>{action.description}</Text>
            <Text style={styles.actionDue}>
              Due: {new Date(action.dueDate).toLocaleDateString()}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (recommendations.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optimization Recommendations</Text>
        {recommendations.map(rec => (
          <View key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recHeader}>
              <Text style={styles.recTitle}>{rec.title}</Text>
              {rec.estimatedSavings > 0 && (
                <Text style={styles.recSavings}>
                  Save ₹{(rec.estimatedSavings / 1000).toFixed(1)}K
                </Text>
              )}
            </View>
            <Text style={styles.recDescription}>{rec.description}</Text>
            <Text style={styles.recAction}>→ {rec.actionRequired}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {performanceMetrics.overallEfficiency.toFixed(0)}%
            </Text>
            <Text style={styles.metricLabel}>Overall Efficiency</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {performanceMetrics.materialUtilization.toFixed(0)}%
            </Text>
            <Text style={styles.metricLabel}>Material Utilization</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {performanceMetrics.deliveryReliability.toFixed(0)}%
            </Text>
            <Text style={styles.metricLabel}>Delivery Reliability</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>
              {performanceMetrics.inventoryTurnover.toFixed(1)}x
            </Text>
            <Text style={styles.metricLabel}>Inventory Turnover</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCostAnalysis = () => {
    if (!costAnalysis) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Analysis</Text>
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Total Cost:</Text>
            <Text style={styles.costValue}>₹{(costAnalysis.totalCost / 100000).toFixed(2)}L</Text>
          </View>
          <View style={styles.costBreakdown}>
            <View style={styles.costBreakdownRow}>
              <Text style={styles.costBreakdownLabel}>Procurement:</Text>
              <Text style={styles.costBreakdownValue}>
                ₹{(costAnalysis.breakdown.procurement / 100000).toFixed(2)}L
              </Text>
            </View>
            <View style={styles.costBreakdownRow}>
              <Text style={styles.costBreakdownLabel}>Delivery:</Text>
              <Text style={styles.costBreakdownValue}>
                ₹{(costAnalysis.breakdown.delivery / 100000).toFixed(2)}L
              </Text>
            </View>
            <View style={styles.costBreakdownRow}>
              <Text style={styles.costBreakdownLabel}>Storage:</Text>
              <Text style={styles.costBreakdownValue}>
                ₹{(costAnalysis.breakdown.storage / 100000).toFixed(2)}L
              </Text>
            </View>
          </View>
          <View style={[styles.costRow, styles.costSavings]}>
            <Text style={styles.costLabel}>Potential Savings:</Text>
            <Text style={[styles.costValue, styles.costSavingsValue]}>
              ₹{(costAnalysis.potentialSavings / 100000).toFixed(2)}L
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading logistics dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Project Selector */}
      {renderProjectSelector()}

      {/* KPI Cards */}
      {renderKPICards()}

      {/* DOORS Metrics */}
      {renderDoorsMetrics()}

      {/* Critical Alerts */}
      {renderCriticalAlerts()}

      {/* Pending Actions */}
      {renderPendingActions()}

      {/* Optimization Recommendations */}
      {renderRecommendations()}

      {/* Performance Metrics */}
      {renderPerformanceMetrics()}

      {/* Cost Analysis */}
      {renderCostAnalysis()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectorContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  projectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  projectChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  projectChipText: {
    fontSize: 14,
    color: '#666',
  },
  projectChipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  kpiScroll: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kpiCard: {
    minWidth: 140,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    alignItems: 'center',
  },
  kpiCardPrimary: {
    backgroundColor: '#E3F2FD',
  },
  kpiCardSuccess: {
    backgroundColor: '#E8F5E9',
  },
  kpiCardWarning: {
    backgroundColor: '#FFF3E0',
  },
  kpiCardInfo: {
    backgroundColor: '#F3E5F5',
  },
  kpiCardDoors: {
    backgroundColor: '#E1F5FE',
  },
  kpiCardDoorsCompliance: {
    backgroundColor: '#FFF9C4',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  kpiSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertHeader: {
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
  },
  alertAction: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '500',
  },
  alertActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  alertButtonTextSecondary: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  actionDue: {
    fontSize: 12,
    color: '#999',
  },
  recommendationCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  recSavings: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  recDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  recAction: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricItem: {
    width: '50%',
    padding: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  metricSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  costCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  costBreakdown: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  costBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  costBreakdownLabel: {
    fontSize: 12,
    color: '#666',
  },
  costBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  costSavings: {
    paddingTop: 8,
  },
  costSavingsValue: {
    color: '#4CAF50',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const LogisticsDashboardScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - LogisticsDashboardScreen">
    <LogisticsDashboardScreen />
  </ErrorBoundary>
);

export default LogisticsDashboardScreenWithBoundary;
