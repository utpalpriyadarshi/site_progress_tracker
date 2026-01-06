import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface FinancialChartsSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * FinancialChartsSkeleton Component
 *
 * Loading skeleton for Financial Reports Screen.
 * Shows placeholders for:
 * - Project header
 * - Date range filter (start/end date buttons)
 * - Profitability overview card
 * - Budget variance chart
 * - Cost distribution chart
 * - Cash flow analysis card
 * - Invoices summary card
 * - Export section
 *
 * @example
 * ```tsx
 * import { FinancialChartsSkeleton } from '@/commercial/shared';
 *
 * if (loading) {
 *   return <FinancialChartsSkeleton />;
 * }
 * ```
 */
export const FinancialChartsSkeleton: React.FC<FinancialChartsSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="60%" height={24} />
      </View>

      {/* Date Range Filter */}
      <View style={styles.dateFilterContainer}>
        <Skeleton width="30%" height={14} marginBottom={12} />
        <View style={styles.dateRow}>
          <View style={styles.dateButton}>
            <Skeleton width="100%" height={48} borderRadius={8} />
          </View>
          <Skeleton width={40} height={48} borderRadius={8} marginBottom={0} />
          <View style={styles.dateButton}>
            <Skeleton width="100%" height={48} borderRadius={8} />
          </View>
        </View>
        <Skeleton width={100} height={36} borderRadius={4} marginBottom={0} style={styles.clearButton} />
      </View>

      {/* Profitability Overview Card */}
      <View style={styles.card}>
        <Skeleton width="50%" height={20} marginBottom={16} />
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="60%" height={12} />
          </View>
          <View style={styles.metricItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="60%" height={12} />
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="60%" height={12} />
          </View>
          <View style={styles.metricItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="60%" height={12} />
          </View>
        </View>
      </View>

      {/* Budget Variance Chart Card */}
      <View style={styles.card}>
        <Skeleton width="45%" height={20} marginBottom={16} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.varianceItem}>
            <View style={styles.varianceHeader}>
              <Skeleton width="35%" height={16} />
              <Skeleton width="25%" height={16} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={4} marginBottom={4} />
            <View style={styles.varianceDetails}>
              <Skeleton width="30%" height={12} />
              <Skeleton width="30%" height={12} />
              <Skeleton width="30%" height={12} />
            </View>
          </View>
        ))}
      </View>

      {/* Cost Distribution Chart Card */}
      <View style={styles.card}>
        <Skeleton width="40%" height={20} marginBottom={20} />
        {/* Pie Chart Placeholder */}
        <View style={styles.chartCenter}>
          <Skeleton width={180} height={180} borderRadius={90} marginBottom={20} />
        </View>
        {/* Legend */}
        <View style={styles.legendContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.legendItem}>
              <Skeleton width={16} height={16} borderRadius={8} marginBottom={0} />
              <Skeleton width="60%" height={14} marginBottom={0} style={styles.legendText} />
              <Skeleton width="25%" height={14} marginBottom={0} />
            </View>
          ))}
        </View>
      </View>

      {/* Cash Flow Analysis Card */}
      <View style={styles.card}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        <View style={styles.cashFlowRow}>
          <View style={styles.cashFlowItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="70%" height={12} />
          </View>
          <View style={styles.cashFlowItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} marginBottom={4} />
            <Skeleton width="70%" height={12} />
          </View>
        </View>
        <View style={styles.netCashFlow}>
          <Skeleton width="40%" height={14} marginBottom={8} />
          <Skeleton width="60%" height={36} />
        </View>
      </View>

      {/* Invoices Summary Card */}
      <View style={styles.card}>
        <Skeleton width="45%" height={20} marginBottom={16} />
        <View style={styles.invoiceGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.invoiceItem}>
              <Skeleton width="100%" height={14} marginBottom={8} />
              <Skeleton width="100%" height={28} marginBottom={4} />
              <Skeleton width="70%" height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Export Section */}
      <View style={styles.card}>
        <Skeleton width="35%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={14} marginBottom={4} />
        <Skeleton width="80%" height={14} />
      </View>

      {/* Bottom Padding */}
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
  dateFilterContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flex: 1,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  varianceItem: {
    marginBottom: 20,
  },
  varianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  varianceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendText: {
    marginLeft: 8,
    flex: 1,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cashFlowItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  netCashFlow: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  invoiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  invoiceItem: {
    width: '48%',
    marginBottom: 16,
  },
  bottomPadding: {
    height: 32,
  },
});
