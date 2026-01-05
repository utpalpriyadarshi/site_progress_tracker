import React, { useReducer, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCommercial } from './context/CommercialContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { dashboardReducer, initialDashboardState } from './state/dashboard/dashboardReducer';
import { dashboardActions } from './state/dashboard/dashboardActions';
import {
  calculateBudgetSummary,
  calculateCategoryBreakdown,
  calculateInvoicesSummary,
  calculateCashFlow,
  generateAlerts,
} from './dashboard/utils';
import type { RecentCost } from './state/dashboard/dashboardReducer';
import {
  AlertsCard,
  BudgetSummaryCard,
  CategoryBreakdownCard,
  CashFlowCard,
  InvoicesSummaryCard,
  RecentCostsCard,
} from './dashboard/components';

/**
 * CommercialDashboardScreen (v2.11 Phase 5 - Sprint 8) - REFACTORED
 * Phase 2 Task 2.1 - State Management Refactor
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
 *
 * Refactored: 2025-12-28
 * - Reduced from 806 → ~220 lines (73% reduction)
 * - Extracted 6 card components, 1 hook, 2 utils
 * - Improved maintainability and separation of concerns
 *
 * Phase 2 Refactor: 2026-01-05
 * - Consolidated hook state into useReducer
 * - Centralized state management
 */

const CommercialDashboardScreen = () => {
  const { projectId, projectName, refreshTrigger } = useCommercial();
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

  const loadDashboardData = useCallback(async () => {
    if (!projectId) {
      dispatch(dashboardActions.setLoading(false));
      return;
    }

    try {
      dispatch(dashboardActions.setLoading(true));
      logger.debug('[Dashboard] Loading dashboard data for project:', projectId);

      // Load all data in parallel
      const budgetsCollection = database.collections.get('budgets');
      const costsCollection = database.collections.get('costs');
      const invoicesCollection = database.collections.get('invoices');

      const [budgets, costs, invoices] = await Promise.all([
        budgetsCollection.query(Q.where('project_id', projectId)).fetch(),
        costsCollection
          .query(Q.where('project_id', projectId), Q.sortBy('cost_date', Q.desc))
          .fetch(),
        invoicesCollection.query(Q.where('project_id', projectId)).fetch(),
      ]);

      // Calculate all metrics
      const budgetSummary = calculateBudgetSummary(budgets, costs);
      const categoryBreakdown = calculateCategoryBreakdown(budgets, costs);
      const invoicesSummary = calculateInvoicesSummary(invoices);
      const cashFlow = calculateCashFlow(invoicesSummary.totalPaid, budgetSummary.totalSpent);

      // Get recent costs (last 5)
      const recentCosts: RecentCost[] = costs.slice(0, 5).map((cost: any) => ({
        description: cost.description,
        amount: cost.amount,
        date: cost.costDate,
        category: cost.category,
      }));

      // Generate alerts
      const alerts = generateAlerts(
        categoryBreakdown,
        invoicesSummary.overdue,
        budgetSummary.percentageUsed,
        budgetSummary.remaining,
        cashFlow.net
      );

      dispatch(dashboardActions.setDashboardData({
        budgetSummary,
        categoryBreakdown,
        recentCosts,
        invoicesSummary,
        cashFlow,
        alerts,
      }));

      logger.debug('[Dashboard] Dashboard data loaded successfully');
    } catch (error) {
      logger.error('[Dashboard] Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      dispatch(dashboardActions.setLoading(false));
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

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  if (state.ui.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!state.data.dashboardData) {
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
      </View>

      {/* All Cards */}
      <AlertsCard alerts={state.data.dashboardData.alerts} />
      <BudgetSummaryCard budgetSummary={state.data.dashboardData.budgetSummary} />
      <CategoryBreakdownCard categoryBreakdown={state.data.dashboardData.categoryBreakdown} />
      <CashFlowCard cashFlow={state.data.dashboardData.cashFlow} />
      <InvoicesSummaryCard invoicesSummary={state.data.dashboardData.invoicesSummary} />
      <RecentCostsCard recentCosts={state.data.dashboardData.recentCosts} />

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

export default function CommercialDashboardScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="CommercialDashboardScreen">
      <CommercialDashboardScreen {...props} />
    </ErrorBoundary>
  );
}
