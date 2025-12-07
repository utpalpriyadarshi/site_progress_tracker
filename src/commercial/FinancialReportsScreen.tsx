import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';

/**
 * FinancialReportsScreen (v2.11 Phase 5 - Sprint 7)
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

interface ReportData {
  budgetByCategory: Array<{ category: string; allocated: number; spent: number; variance: number }>;
  costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
  invoicesSummary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  cashFlow: {
    totalRevenue: number; // paid invoices
    totalCosts: number;
    netCashFlow: number;
  };
  profitability: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    profitMargin: number;
  };
}

const FinancialReportsScreen = () => {
  const { projectId, projectName, startDate, setStartDate, endDate, setEndDate } = useCommercial();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const loadReportData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[Reports] Loading report data for project:', projectId);

      // Load budgets
      const budgetsCollection = database.collections.get('budgets');
      const budgets = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Load costs with date filtering
      const costsCollection = database.collections.get('costs');
      let costsQuery = costsCollection.query(Q.where('project_id', projectId));

      if (startDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.gte(startDate.getTime()))
        );
      }
      if (endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.lte(endDate.getTime()))
        );
      }
      if (startDate && endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('cost_date', Q.gte(startDate.getTime())),
            Q.where('cost_date', Q.lte(endDate.getTime()))
          )
        );
      }

      const costs = await costsQuery.fetch();

      // Load invoices with date filtering
      const invoicesCollection = database.collections.get('invoices');
      let invoicesQuery = invoicesCollection.query(Q.where('project_id', projectId));

      if (startDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.gte(startDate.getTime()))
        );
      }
      if (endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.lte(endDate.getTime()))
        );
      }
      if (startDate && endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('invoice_date', Q.gte(startDate.getTime())),
            Q.where('invoice_date', Q.lte(endDate.getTime()))
          )
        );
      }

      const invoices = await invoicesQuery.fetch();

      // Calculate Budget Variance by Category
      const categories = ['labor', 'material', 'equipment', 'other'];
      const budgetByCategory = categories.map((category) => {
        const allocated = budgets
          .filter((b: any) => b.category === category)
          .reduce((sum, b: any) => sum + b.allocatedAmount, 0);

        const spent = costs
          .filter((c: any) => c.category === category)
          .reduce((sum, c: any) => sum + c.amount, 0);

        return {
          category,
          allocated,
          spent,
          variance: allocated - spent,
        };
      });

      // Calculate Costs by Category (with percentages)
      const totalCosts = costs.reduce((sum, c: any) => sum + c.amount, 0);
      const costsByCategory = categories.map((category) => {
        const amount = costs
          .filter((c: any) => c.category === category)
          .reduce((sum, c: any) => sum + c.amount, 0);

        return {
          category,
          amount,
          percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0,
        };
      });

      // Calculate Invoices Summary
      const today = Date.now();
      const invoicesSummary = {
        total: invoices.length,
        paid: invoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
        pending: invoices.filter((inv: any) => inv.paymentStatus === 'pending').length,
        overdue: invoices.filter((inv: any) => {
          const dueDate = inv.invoiceDate + (30 * 24 * 60 * 60 * 1000);
          return inv.paymentStatus === 'pending' && today > dueDate;
        }).length,
      };

      // Calculate Cash Flow
      const totalRevenue = invoices
        .filter((inv: any) => inv.paymentStatus === 'paid')
        .reduce((sum, inv: any) => sum + inv.amount, 0);

      const cashFlow = {
        totalRevenue,
        totalCosts,
        netCashFlow: totalRevenue - totalCosts,
      };

      // Calculate Profitability
      const totalBudget = budgets.reduce((sum, b: any) => sum + b.allocatedAmount, 0);
      const totalSpent = costs.reduce((sum, c: any) => sum + c.amount, 0);
      const remaining = totalBudget - totalSpent;
      const profitMargin = totalBudget > 0 ? ((remaining / totalBudget) * 100) : 0;

      const profitability = {
        totalBudget,
        totalSpent,
        remaining,
        profitMargin,
      };

      setReportData({
        budgetByCategory,
        costsByCategory,
        invoicesSummary,
        cashFlow,
        profitability,
      });

      console.log('[Reports] Report data loaded successfully');
    } catch (error) {
      console.error('[Reports] Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [projectId, startDate, endDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

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

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
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
        <Text style={styles.subtitle}>Financial Reports</Text>
      </View>

      {/* Date Range Filter */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Date Range Filter</Text>
          <View style={styles.dateFilterContainer}>
            <View style={styles.datePickerRow}>
              <Text style={styles.dateLabel}>Start Date:</Text>
              <Button
                mode="outlined"
                onPress={() => setShowStartDatePicker(true)}
                style={styles.dateButton}
              >
                {startDate ? startDate.toLocaleDateString() : 'All Time'}
              </Button>
            </View>

            <View style={styles.datePickerRow}>
              <Text style={styles.dateLabel}>End Date:</Text>
              <Button
                mode="outlined"
                onPress={() => setShowEndDatePicker(true)}
                style={styles.dateButton}
              >
                {endDate ? endDate.toLocaleDateString() : 'All Time'}
              </Button>
            </View>

            {(startDate || endDate) && (
              <Button mode="text" onPress={handleClearDates} textColor="#007AFF">
                Clear Filters
              </Button>
            )}
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </Card.Content>
      </Card>

      {/* Profitability Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Profitability Overview</Text>
          <View style={styles.profitabilityContainer}>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Total Budget:</Text>
              <Text style={styles.profitValue}>
                ${reportData.profitability.totalBudget.toLocaleString()}
              </Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>Total Spent:</Text>
              <Text style={styles.profitValue}>
                ${reportData.profitability.totalSpent.toLocaleString()}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.profitRow}>
              <Text style={styles.profitLabelBold}>Remaining:</Text>
              <Text style={[
                styles.profitValueBold,
                reportData.profitability.remaining < 0 && styles.negativeValue
              ]}>
                ${Math.abs(reportData.profitability.remaining).toLocaleString()}
              </Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabelBold}>Profit Margin:</Text>
              <Text style={[
                styles.profitValueBold,
                reportData.profitability.profitMargin < 0 && styles.negativeValue
              ]}>
                {reportData.profitability.profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Budget Variance Report */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Budget Variance by Category</Text>
          {reportData.budgetByCategory.map((item) => (
            <View key={item.category} style={styles.varianceItem}>
              <View style={styles.varianceHeader}>
                <Chip
                  style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
                  textStyle={styles.categoryChipText}
                >
                  {getCategoryLabel(item.category)}
                </Chip>
                {item.variance < 0 && (
                  <Chip mode="flat" style={styles.overBudgetChip} textStyle={styles.overBudgetText}>
                    OVER BUDGET
                  </Chip>
                )}
              </View>
              <View style={styles.varianceDetails}>
                <View style={styles.varianceRow}>
                  <Text style={styles.varianceLabel}>Allocated:</Text>
                  <Text style={styles.varianceValue}>${item.allocated.toLocaleString()}</Text>
                </View>
                <View style={styles.varianceRow}>
                  <Text style={styles.varianceLabel}>Spent:</Text>
                  <Text style={styles.varianceValue}>${item.spent.toLocaleString()}</Text>
                </View>
                <Divider style={styles.miniDivider} />
                <View style={styles.varianceRow}>
                  <Text style={styles.varianceLabelBold}>Variance:</Text>
                  <Text style={[
                    styles.varianceValueBold,
                    item.variance < 0 && styles.negativeValue
                  ]}>
                    ${Math.abs(item.variance).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Cost Distribution */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Cost Distribution by Category</Text>
          {reportData.costsByCategory.map((item) => (
            <View key={item.category} style={styles.distributionItem}>
              <View style={styles.distributionHeader}>
                <Chip
                  style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
                  textStyle={styles.categoryChipText}
                >
                  {getCategoryLabel(item.category)}
                </Chip>
                <Text style={styles.percentageText}>{item.percentage.toFixed(1)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.percentage}%`,
                      backgroundColor: getCategoryColor(item.category),
                    },
                  ]}
                />
              </View>
              <Text style={styles.amountText}>${item.amount.toLocaleString()}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Cash Flow Analysis */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
          <View style={styles.cashFlowContainer}>
            <View style={styles.cashFlowRow}>
              <Text style={styles.cashFlowLabel}>Total Revenue (Paid Invoices):</Text>
              <Text style={[styles.cashFlowValue, styles.positiveValue]}>
                ${reportData.cashFlow.totalRevenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.cashFlowRow}>
              <Text style={styles.cashFlowLabel}>Total Costs:</Text>
              <Text style={styles.cashFlowValue}>
                ${reportData.cashFlow.totalCosts.toLocaleString()}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.cashFlowRow}>
              <Text style={styles.cashFlowLabelBold}>Net Cash Flow:</Text>
              <Text style={[
                styles.cashFlowValueBold,
                reportData.cashFlow.netCashFlow >= 0 ? styles.positiveValue : styles.negativeValue
              ]}>
                ${Math.abs(reportData.cashFlow.netCashFlow).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Invoices Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Invoices Summary</Text>
          <View style={styles.invoicesSummaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{reportData.invoicesSummary.total}</Text>
              <Text style={styles.summaryLabel}>Total Invoices</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.positiveValue]}>
                {reportData.invoicesSummary.paid}
              </Text>
              <Text style={styles.summaryLabel}>Paid</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: '#FFA500' }]}>
                {reportData.invoicesSummary.pending}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, styles.negativeValue]}>
                {reportData.invoicesSummary.overdue}
              </Text>
              <Text style={styles.summaryLabel}>Overdue</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Export Options (Future) */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Export Report</Text>
          <Text style={styles.exportNote}>
            Export functionality (PDF/Excel) will be available in future updates.
          </Text>
        </Card.Content>
      </Card>

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
  dateFilterContainer: {
    gap: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginLeft: 12,
    borderColor: '#007AFF',
  },
  profitabilityContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profitLabel: {
    fontSize: 14,
    color: '#666',
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  profitLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profitValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    marginVertical: 12,
  },
  miniDivider: {
    marginVertical: 8,
  },
  varianceItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  varianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  varianceDetails: {
    paddingLeft: 8,
  },
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  varianceLabel: {
    fontSize: 13,
    color: '#666',
  },
  varianceValue: {
    fontSize: 13,
    color: '#333',
  },
  varianceLabelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  varianceValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#ff6b6b',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  cashFlowContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cashFlowLabel: {
    fontSize: 14,
    color: '#666',
  },
  cashFlowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cashFlowLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cashFlowValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  invoicesSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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

export default FinancialReportsScreen;
