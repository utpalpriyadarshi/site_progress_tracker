import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useCommercial } from './context/CommercialContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useReportData, useDateFilter } from './financial-reports/hooks';
import {
  DateRangeFilter,
  ProfitabilityCard,
  BudgetVarianceCard,
  CostDistributionCard,
  CashFlowCard,
  InvoicesSummaryCard,
  ReportCard,
} from './financial-reports/components';

/**
 * FinancialReportsScreen (v2.20 - Refactored)
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

  const { loading, reportData, loadReportData } = useReportData(projectId, startDate, endDate);

  const {
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDates,
  } = useDateFilter(startDate, endDate, setStartDate, setEndDate);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading financial reports...</Text>
      </View>
    );
  }

  if (!reportData) {
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
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        setShowStartDatePicker={setShowStartDatePicker}
        setShowEndDatePicker={setShowEndDatePicker}
        handleStartDateChange={handleStartDateChange}
        handleEndDateChange={handleEndDateChange}
        handleClearDates={handleClearDates}
      />

      {/* Profitability Overview */}
      <ProfitabilityCard
        totalBudget={reportData.profitability.totalBudget}
        totalSpent={reportData.profitability.totalSpent}
        remaining={reportData.profitability.remaining}
        profitMargin={reportData.profitability.profitMargin}
      />

      {/* Budget Variance Report */}
      <BudgetVarianceCard budgetByCategory={reportData.budgetByCategory} />

      {/* Cost Distribution */}
      <CostDistributionCard costsByCategory={reportData.costsByCategory} />

      {/* Cash Flow Analysis */}
      <CashFlowCard
        totalRevenue={reportData.cashFlow.totalRevenue}
        totalCosts={reportData.cashFlow.totalCosts}
        netCashFlow={reportData.cashFlow.netCashFlow}
      />

      {/* Invoices Summary */}
      <InvoicesSummaryCard
        total={reportData.invoicesSummary.total}
        paid={reportData.invoicesSummary.paid}
        pending={reportData.invoicesSummary.pending}
        overdue={reportData.invoicesSummary.overdue}
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
