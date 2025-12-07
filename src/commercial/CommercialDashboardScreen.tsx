import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card, Chip, Divider, ProgressBar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';

/**
 * CommercialDashboardScreen (v2.11 Phase 5 - Sprint 8)
 *
 * Commercial Manager dashboard with key financial metrics overview.
 *
 * Features:
 * - Project budget summary (total, spent, remaining)
 * - Budget health indicator (progress bar)
 * - Category-wise spending breakdown
 * - Recent costs summary
 * - Invoices status overview (pending, paid, overdue)
 * - Cash flow indicator
 * - Quick alerts (over-budget categories, overdue invoices)
 * - Navigation to detail screens
 */

interface DashboardData {
  budgetSummary: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    percentageUsed: number;
  };
  categoryBreakdown: Array<{
    category: string;
    budget: number;
    spent: number;
    percentage: number;
    isOverBudget: boolean;
  }>;
  recentCosts: Array<{
    description: string;
    amount: number;
    date: number;
    category: string;
  }>;
  invoicesSummary: {
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    totalPending: number;
    totalPaid: number;
  };
  cashFlow: {
    revenue: number;
    costs: number;
    net: number;
  };
  alerts: Array<{
    type: 'warning' | 'danger' | 'info';
    message: string;
  }>;
}

const CommercialDashboardScreen = () => {
  const { projectId, projectName, refreshTrigger } = useCommercial();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[Dashboard] Loading dashboard data for project:', projectId);

      // Load budgets
      const budgetsCollection = database.collections.get('budgets');
      const budgets = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Load costs
      const costsCollection = database.collections.get('costs');
      const costs = await costsCollection
        .query(Q.where('project_id', projectId), Q.sortBy('cost_date', Q.desc))
        .fetch();

      // Load invoices
      const invoicesCollection = database.collections.get('invoices');
      const invoices = await invoicesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Calculate Budget Summary
      const totalBudget = budgets.reduce((sum, b: any) => sum + b.allocatedAmount, 0);
      const totalSpent = costs.reduce((sum, c: any) => sum + c.amount, 0);
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      const budgetSummary = {
        totalBudget,
        totalSpent,
        remaining,
        percentageUsed,
      };

      // Calculate Category Breakdown
      const categories = ['labor', 'material', 'equipment', 'other'];
      const categoryBreakdown = categories.map((category) => {
        const budget = budgets
          .filter((b: any) => b.category === category)
          .reduce((sum, b: any) => sum + b.allocatedAmount, 0);

        const spent = costs
          .filter((c: any) => c.category === category)
          .reduce((sum, c: any) => sum + c.amount, 0);

        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        const isOverBudget = spent > budget;

        return {
          category,
          budget,
          spent,
          percentage,
          isOverBudget,
        };
      });

      // Get Recent Costs (last 5)
      const recentCosts = costs.slice(0, 5).map((cost: any) => ({
        description: cost.description,
        amount: cost.amount,
        date: cost.costDate,
        category: cost.category,
      }));

      // Calculate Invoices Summary
      const today = Date.now();
      const totalPending = invoices
        .filter((inv: any) => inv.paymentStatus === 'pending')
        .reduce((sum, inv: any) => sum + inv.amount, 0);

      const totalPaid = invoices
        .filter((inv: any) => inv.paymentStatus === 'paid')
        .reduce((sum, inv: any) => sum + inv.amount, 0);

      const overdueInvoices = invoices.filter((inv: any) => {
        const dueDate = inv.invoiceDate + (30 * 24 * 60 * 60 * 1000);
        return inv.paymentStatus === 'pending' && today > dueDate;
      });

      const invoicesSummary = {
        total: invoices.length,
        pending: invoices.filter((inv: any) => inv.paymentStatus === 'pending').length,
        paid: invoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
        overdue: overdueInvoices.length,
        totalPending,
        totalPaid,
      };

      // Calculate Cash Flow
      const cashFlow = {
        revenue: totalPaid,
        costs: totalSpent,
        net: totalPaid - totalSpent,
      };

      // Generate Alerts
      const alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }> = [];

      // Over-budget alerts
      categoryBreakdown.forEach((cat) => {
        if (cat.isOverBudget && cat.budget > 0) {
          alerts.push({
            type: 'danger',
            message: `${getCategoryLabel(cat.category)} is over budget by $${(cat.spent - cat.budget).toLocaleString()}`,
          });
        }
      });

      // Overdue invoices alert
      if (overdueInvoices.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${overdueInvoices.length} invoice(s) are overdue`,
        });
      }

      // Budget warning (>80% used)
      if (percentageUsed > 80 && percentageUsed <= 100) {
        alerts.push({
          type: 'warning',
          message: `Project budget is ${percentageUsed.toFixed(0)}% utilized`,
        });
      }

      // Budget exceeded
      if (percentageUsed > 100) {
        alerts.push({
          type: 'danger',
          message: `Project budget exceeded by $${Math.abs(remaining).toLocaleString()}`,
        });
      }

      // Positive cash flow
      if (cashFlow.net > 0) {
        alerts.push({
          type: 'info',
          message: `Positive cash flow: $${cashFlow.net.toLocaleString()}`,
        });
      }

      setDashboardData({
        budgetSummary,
        categoryBreakdown,
        recentCosts,
        invoicesSummary,
        cashFlow,
        alerts,
      });

      console.log('[Dashboard] Dashboard data loaded successfully');
    } catch (error) {
      console.error('[Dashboard] Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  // Reload dashboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        loadDashboardData();
      }
    }, [projectId, loadDashboardData])
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      labor: 'Labor',
      material: 'Materials',
      equipment: 'Equipment',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      labor: '#2196F3',
      material: '#4CAF50',
      equipment: '#FF9800',
      other: '#9C27B0',
    };
    return colors[category] || '#757575';
  };

  const getAlertIcon = (type: 'warning' | 'danger' | 'info') => {
    const icons: Record<string, string> = {
      danger: '🚨',
      warning: '⚠️',
      info: '✅',
    };
    return icons[type] || 'ℹ️';
  };

  const getAlertColor = (type: 'warning' | 'danger' | 'info') => {
    const colors: Record<string, string> = {
      danger: '#ff6b6b',
      warning: '#FFA500',
      info: '#4CAF50',
    };
    return colors[type] || '#666';
  };

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No dashboard data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Text style={styles.subtitle}>Financial Dashboard</Text>
      </View>

      {/* Alerts */}
      {dashboardData.alerts.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Alerts</Text>
            {dashboardData.alerts.map((alert, index) => (
              <View
                key={index}
                style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.type) }]}
              >
                <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
                <Text style={[styles.alertText, { color: getAlertColor(alert.type) }]}>
                  {alert.message}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Budget Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Budget Summary</Text>
          <View style={styles.budgetSummaryContainer}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Budget:</Text>
              <Text style={styles.budgetValue}>
                ${dashboardData.budgetSummary.totalBudget.toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Spent:</Text>
              <Text style={styles.budgetValue}>
                ${dashboardData.budgetSummary.totalSpent.toLocaleString()}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabelBold}>Remaining:</Text>
              <Text style={[
                styles.budgetValueBold,
                dashboardData.budgetSummary.remaining < 0 && styles.negativeValue
              ]}>
                ${Math.abs(dashboardData.budgetSummary.remaining).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Budget Utilization</Text>
              <Text style={[
                styles.progressPercentage,
                dashboardData.budgetSummary.percentageUsed > 100 && styles.negativeValue
              ]}>
                {dashboardData.budgetSummary.percentageUsed.toFixed(1)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(dashboardData.budgetSummary.percentageUsed / 100, 1)}
              color={dashboardData.budgetSummary.percentageUsed > 100 ? '#ff6b6b' : '#007AFF'}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Category Breakdown */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {dashboardData.categoryBreakdown.map((cat) => (
            <View key={cat.category} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Chip
                  style={[styles.categoryChip, { backgroundColor: getCategoryColor(cat.category) }]}
                  textStyle={styles.categoryChipText}
                >
                  {getCategoryLabel(cat.category)}
                </Chip>
                {cat.isOverBudget && (
                  <Chip mode="flat" style={styles.overBudgetChip} textStyle={styles.overBudgetText}>
                    OVER
                  </Chip>
                )}
              </View>
              <View style={styles.categoryDetails}>
                <Text style={styles.categoryAmount}>
                  ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
                </Text>
                <Text style={[
                  styles.categoryPercentage,
                  cat.isOverBudget && styles.negativeValue
                ]}>
                  {cat.percentage.toFixed(0)}%
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(cat.percentage / 100, 1)}
                color={cat.isOverBudget ? '#ff6b6b' : getCategoryColor(cat.category)}
                style={styles.categoryProgressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Cash Flow Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Cash Flow</Text>
          <View style={styles.cashFlowContainer}>
            <View style={styles.cashFlowItem}>
              <Text style={styles.cashFlowLabel}>Revenue</Text>
              <Text style={[styles.cashFlowValue, styles.positiveValue]}>
                ${dashboardData.cashFlow.revenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.cashFlowItem}>
              <Text style={styles.cashFlowLabel}>Costs</Text>
              <Text style={styles.cashFlowValue}>
                ${dashboardData.cashFlow.costs.toLocaleString()}
              </Text>
            </View>
            <View style={styles.cashFlowItem}>
              <Text style={styles.cashFlowLabelBold}>Net</Text>
              <Text style={[
                styles.cashFlowValueBold,
                dashboardData.cashFlow.net >= 0 ? styles.positiveValue : styles.negativeValue
              ]}>
                ${Math.abs(dashboardData.cashFlow.net).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Invoices Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Invoices Overview</Text>
          <View style={styles.invoicesSummaryContainer}>
            <View style={styles.invoiceItem}>
              <Text style={styles.invoiceCount}>{dashboardData.invoicesSummary.total}</Text>
              <Text style={styles.invoiceLabel}>Total</Text>
            </View>
            <View style={styles.invoiceItem}>
              <Text style={[styles.invoiceCount, styles.positiveValue]}>
                {dashboardData.invoicesSummary.paid}
              </Text>
              <Text style={styles.invoiceLabel}>Paid</Text>
              <Text style={styles.invoiceAmount}>
                ${dashboardData.invoicesSummary.totalPaid.toLocaleString()}
              </Text>
            </View>
            <View style={styles.invoiceItem}>
              <Text style={[styles.invoiceCount, { color: '#FFA500' }]}>
                {dashboardData.invoicesSummary.pending}
              </Text>
              <Text style={styles.invoiceLabel}>Pending</Text>
              <Text style={styles.invoiceAmount}>
                ${dashboardData.invoicesSummary.totalPending.toLocaleString()}
              </Text>
            </View>
            <View style={styles.invoiceItem}>
              <Text style={[styles.invoiceCount, styles.negativeValue]}>
                {dashboardData.invoicesSummary.overdue}
              </Text>
              <Text style={styles.invoiceLabel}>Overdue</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Costs */}
      {dashboardData.recentCosts.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Recent Costs</Text>
            {dashboardData.recentCosts.map((cost, index) => (
              <View key={index} style={styles.recentCostItem}>
                <View style={styles.recentCostHeader}>
                  <Text style={styles.recentCostDescription} numberOfLines={1}>
                    {cost.description}
                  </Text>
                  <Text style={styles.recentCostAmount}>
                    ${cost.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.recentCostFooter}>
                  <Chip
                    style={[styles.miniCategoryChip, { backgroundColor: getCategoryColor(cost.category) }]}
                    textStyle={styles.miniCategoryChipText}
                  >
                    {getCategoryLabel(cost.category)}
                  </Chip>
                  <Text style={styles.recentCostDate}>
                    {new Date(cost.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  budgetSummaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  budgetLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  negativeValue: {
    color: '#ff6b6b',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  overBudgetChip: {
    backgroundColor: '#fff3cd',
  },
  overBudgetText: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 11,
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 13,
    color: '#666',
  },
  categoryPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  cashFlowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cashFlowItem: {
    alignItems: 'center',
  },
  cashFlowLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cashFlowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cashFlowLabelBold: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cashFlowValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  invoicesSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  invoiceItem: {
    alignItems: 'center',
  },
  invoiceCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  invoiceAmount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  recentCostItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentCostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentCostDescription: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  recentCostAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recentCostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCategoryChip: {
    height: 24,
    maxWidth: '70%',
  },
  miniCategoryChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  recentCostDate: {
    fontSize: 11,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
});

export default CommercialDashboardScreen;
