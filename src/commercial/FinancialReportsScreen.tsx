import React, { useReducer, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useCommercial } from './context/CommercialContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { financialReportsReducer, initialFinancialReportsState } from './state/reports/financialReportsReducer';
import { financialReportsActions } from './state/reports/financialReportsActions';
import {
  calculateBudgetVariance,
  calculateCostDistribution,
  calculateInvoicesSummary,
  calculateCashFlow,
  calculateProfitability,
} from './financial-reports/utils';
import {
  DateRangeFilter,
  ProfitabilityCard,
  BudgetVarianceCard,
  CostDistributionCard,
  CashFlowCard,
  InvoicesSummaryCard,
  ReportCard,
} from './financial-reports/components';
import { FinancialChartsSkeleton } from './shared';

/**
 * FinancialReportsScreen (v2.20 - Refactored)
 * Phase 2 Task 2.1 - State Management Refactor
 *
 * Commercial Manager views comprehensive financial reports.
 *
 * Features:
 * - Budget Variance Report (allocated vs actual by category)
 * - Cost Analysis by Category (pie chart data)
 * - Cash Flow Analysis (invoices paid vs pending)
 * - Profitability Analysis (budget remaining)
 * - Date Range Filtering
 * - Export capability (future: PDF/Excel)
 */

const FinancialReportsScreen = () => {
  const { projectId, projectName, startDate, setStartDate, endDate, setEndDate } = useCommercial();
  const [state, dispatch] = useReducer(financialReportsReducer, initialFinancialReportsState);

  const loadReportData = useCallback(async () => {
    if (!projectId) {
      dispatch(financialReportsActions.setLoading(false));
      return;
    }

    try {
      dispatch(financialReportsActions.setLoading(true));
      logger.debug('[Reports] Loading report data for project', { projectId });

      // Load budgets
      const budgetsCollection = database.collections.get('budgets');
      const budgets = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Load costs with date filtering
      const costsCollection = database.collections.get('costs');
      let costsQuery = costsCollection.query(Q.where('project_id', projectId));

      if (startDate && endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('cost_date', Q.gte(startDate.getTime())),
            Q.where('cost_date', Q.lte(endDate.getTime()))
          )
        );
      } else if (startDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.gte(startDate.getTime()))
        );
      } else if (endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.lte(endDate.getTime()))
        );
      }

      const costs = await costsQuery.fetch();

      // Load invoices with date filtering
      const invoicesCollection = database.collections.get('invoices');
      let invoicesQuery = invoicesCollection.query(Q.where('project_id', projectId));

      if (startDate && endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('invoice_date', Q.gte(startDate.getTime())),
            Q.where('invoice_date', Q.lte(endDate.getTime()))
          )
        );
      } else if (startDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.gte(startDate.getTime()))
        );
      } else if (endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.lte(endDate.getTime()))
        );
      }

      const invoices = await invoicesQuery.fetch();

      // Calculate all report sections
      const budgetByCategory = calculateBudgetVariance(budgets, costs);
      const costsByCategory = calculateCostDistribution(costs);
      const invoicesSummary = calculateInvoicesSummary(invoices);
      const cashFlow = calculateCashFlow(invoices, costs);
      const profitability = calculateProfitability(budgets, costs);

      dispatch(financialReportsActions.setReportData({
        budgetByCategory,
        costsByCategory,
        invoicesSummary,
        cashFlow,
        profitability,
      }));

      logger.debug('[Reports] Report data loaded successfully');
    } catch (error) {
      logger.error('[Reports] Error loading report data', error as Error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      dispatch(financialReportsActions.setLoading(false));
    }
  }, [projectId, startDate, endDate]);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    dispatch(financialReportsActions.setShowStartDatePicker(Platform.OS === 'ios'));
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    dispatch(financialReportsActions.setShowEndDatePicker(Platform.OS === 'ios'));
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  if (state.ui.loading) {
    return <FinancialChartsSkeleton />;
  }

  if (!state.data.reportData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No report data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
      </View>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        showStartDatePicker={state.ui.showStartDatePicker}
        showEndDatePicker={state.ui.showEndDatePicker}
        setShowStartDatePicker={(show) => dispatch(financialReportsActions.setShowStartDatePicker(show))}
        setShowEndDatePicker={(show) => dispatch(financialReportsActions.setShowEndDatePicker(show))}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        handleClearDates={handleClearDates}
      />

      {/* Profitability Overview */}
      <ProfitabilityCard
        totalBudget={state.data.reportData.profitability.totalBudget}
        totalSpent={state.data.reportData.profitability.totalSpent}
        remaining={state.data.reportData.profitability.remaining}
        profitMargin={state.data.reportData.profitability.profitMargin}
      />

      {/* Budget Variance Report */}
      <BudgetVarianceCard budgetByCategory={state.data.reportData.budgetByCategory} />

      {/* Cost Distribution */}
      <CostDistributionCard costsByCategory={state.data.reportData.costsByCategory} />

      {/* Cash Flow Analysis */}
      <CashFlowCard
        totalRevenue={state.data.reportData.cashFlow.totalRevenue}
        totalCosts={state.data.reportData.cashFlow.totalCosts}
        netCashFlow={state.data.reportData.cashFlow.netCashFlow}
      />

      {/* Invoices Summary */}
      <InvoicesSummaryCard
        total={state.data.reportData.invoicesSummary.total}
        paid={state.data.reportData.invoicesSummary.paid}
        pending={state.data.reportData.invoicesSummary.pending}
        overdue={state.data.reportData.invoicesSummary.overdue}
      />

      {/* Export Options (Future) */}
      <ReportCard>
        <Text style={styles.sectionTitle}>Export Report</Text>
        <Text style={styles.exportNote}>
          Export functionality (PDF/Excel) will be available in future updates.
        </Text>
      </ReportCard>

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  exportNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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

export default function FinancialReportsScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="FinancialReportsScreen">
      <FinancialReportsScreen {...props} />
    </ErrorBoundary>
  );
}
