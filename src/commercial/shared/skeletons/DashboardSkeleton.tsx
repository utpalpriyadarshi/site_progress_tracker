import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard } from '../../../components/skeletons';

export interface DashboardSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for Commercial Dashboard Screen.
 * Shows placeholders for:
 * - Project header
 * - Alerts section
 * - Budget summary card
 * - Category breakdown chart
 * - Cash flow card
 * - Invoices summary card
 * - Recent costs list
 *
 * @example
 * ```tsx
 * import { DashboardSkeleton } from '@/commercial/shared';
 *
 * if (loading) {
 *   return <DashboardSkeleton />;
 * }
 * ```
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="60%" height={24} />
      </View>

      {/* Alerts Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width="30%" height={18} marginBottom={0} style={styles.titleSkeleton} />
        </View>
        <View style={styles.alertItem}>
          <Skeleton width="100%" height={14} marginBottom={4} />
          <Skeleton width="80%" height={14} />
        </View>
        <View style={styles.alertItem}>
          <Skeleton width="100%" height={14} marginBottom={4} />
          <Skeleton width="70%" height={14} />
        </View>
      </View>

      {/* Budget Summary Card */}
      <View style={styles.card}>
        <Skeleton width="40%" height={18} marginBottom={16} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Skeleton width="80%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={28} />
          </View>
          <View style={styles.summaryItem}>
            <Skeleton width="80%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={28} />
          </View>
          <View style={styles.summaryItem}>
            <Skeleton width="80%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={28} />
          </View>
        </View>
        {/* Progress Bar */}
        <Skeleton width="100%" height={8} borderRadius={4} style={styles.progressBar} />
        <Skeleton width="60%" height={14} marginBottom={0} />
      </View>

      {/* Category Breakdown Card */}
      <View style={styles.card}>
        <Skeleton width="50%" height={18} marginBottom={16} />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="25%" height={16} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={4} marginBottom={4} />
            <Skeleton width="60%" height={12} />
          </View>
        ))}
      </View>

      {/* Cash Flow Card */}
      <View style={styles.card}>
        <Skeleton width="30%" height={18} marginBottom={16} />
        <View style={styles.cashFlowRow}>
          <View style={styles.cashFlowItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} />
          </View>
          <View style={styles.cashFlowItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} />
          </View>
          <View style={styles.cashFlowItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={32} />
          </View>
        </View>
      </View>

      {/* Invoices Summary Card */}
      <View style={styles.card}>
        <Skeleton width="45%" height={18} marginBottom={16} />
        <View style={styles.invoiceRow}>
          <View style={styles.invoiceItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={24} marginBottom={4} />
            <Skeleton width="80%" height={12} />
          </View>
          <View style={styles.invoiceItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={24} marginBottom={4} />
            <Skeleton width="80%" height={12} />
          </View>
          <View style={styles.invoiceItem}>
            <Skeleton width="100%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={24} marginBottom={4} />
            <Skeleton width="80%" height={12} />
          </View>
        </View>
      </View>

      {/* Recent Costs Card */}
      <View style={styles.card}>
        <Skeleton width="35%" height={18} marginBottom={16} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.costItem}>
            <View style={styles.costContent}>
              <Skeleton width="70%" height={16} marginBottom={4} />
              <Skeleton width="50%" height={12} />
            </View>
            <Skeleton width="30%" height={18} />
          </View>
        ))}
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
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSkeleton: {
    marginLeft: 8,
  },
  alertItem: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  progressBar: {
    marginTop: 12,
    marginBottom: 8,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cashFlowItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  costContent: {
    flex: 1,
  },
  bottomPadding: {
    height: 32,
  },
});
