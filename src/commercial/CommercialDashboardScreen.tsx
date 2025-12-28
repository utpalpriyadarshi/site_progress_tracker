import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCommercial } from './context/CommercialContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useDashboardData } from './dashboard/hooks';
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
 */

const CommercialDashboardScreen = () => {
  const { projectId, projectName, refreshTrigger } = useCommercial();
  const { dashboardData, loading, loadDashboardData } = useDashboardData(projectId);

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
      </View>

      {/* All Cards */}
      <AlertsCard alerts={dashboardData.alerts} />
      <BudgetSummaryCard budgetSummary={dashboardData.budgetSummary} />
      <CategoryBreakdownCard categoryBreakdown={dashboardData.categoryBreakdown} />
      <CashFlowCard cashFlow={dashboardData.cashFlow} />
      <InvoicesSummaryCard invoicesSummary={dashboardData.invoicesSummary} />
      <RecentCostsCard recentCosts={dashboardData.recentCosts} />

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
