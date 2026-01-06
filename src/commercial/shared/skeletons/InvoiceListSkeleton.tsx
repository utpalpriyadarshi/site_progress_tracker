import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface InvoiceListSkeletonProps {
  /**
   * Number of invoice card skeletons to display
   * @default 5
   */
  count?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * InvoiceListSkeleton Component
 *
 * Loading skeleton for Invoice Management Screen.
 * Shows placeholders for:
 * - Project header
 * - Summary cards (Total, Pending, Overdue)
 * - Search bar
 * - Filter chips
 * - Invoice cards list
 *
 * @example
 * ```tsx
 * import { InvoiceListSkeleton } from '@/commercial/shared';
 *
 * if (loading) {
 *   return <InvoiceListSkeleton count={6} />;
 * }
 * ```
 */
export const InvoiceListSkeleton: React.FC<InvoiceListSkeletonProps> = ({
  count = 5,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header with project name */}
      <View style={styles.header}>
        <Skeleton width="50%" height={18} marginBottom={12} />

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Skeleton width="60%" height={12} marginBottom={8} />
            <Skeleton width="80%" height={24} marginBottom={4} />
            <Skeleton width="50%" height={10} />
          </View>
          <View style={styles.summaryCard}>
            <Skeleton width="60%" height={12} marginBottom={8} />
            <Skeleton width="80%" height={24} marginBottom={4} />
            <Skeleton width="50%" height={10} />
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Skeleton width="60%" height={12} marginBottom={8} />
            <Skeleton width="80%" height={24} marginBottom={4} />
            <Skeleton width="50%" height={10} />
          </View>
          <View style={styles.summaryCard}>
            <Skeleton width="60%" height={12} marginBottom={8} />
            <Skeleton width="80%" height={24} marginBottom={4} />
            <Skeleton width="50%" height={10} />
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        {/* Search Bar */}
        <Skeleton width="100%" height={48} borderRadius={8} marginBottom={12} />

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <Skeleton width={80} height={32} borderRadius={16} marginBottom={0} style={styles.chip} />
          <Skeleton width={70} height={32} borderRadius={16} marginBottom={0} style={styles.chip} />
          <Skeleton width={90} height={32} borderRadius={16} marginBottom={0} style={styles.chip} />
          <Skeleton width={75} height={32} borderRadius={16} marginBottom={0} style={styles.chip} />
        </View>
      </View>

      {/* Invoice Cards */}
      <View style={styles.listContent}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.invoiceCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Skeleton width="45%" height={16} />
              <Skeleton width={80} height={24} borderRadius={12} />
            </View>

            {/* Vendor and PO Info */}
            <View style={styles.cardRow}>
              <Skeleton width={16} height={16} borderRadius={8} marginBottom={0} />
              <Skeleton width="60%" height={14} marginBottom={0} style={styles.rowText} />
            </View>
            <View style={styles.cardRow}>
              <Skeleton width={16} height={16} borderRadius={8} marginBottom={0} />
              <Skeleton width="50%" height={14} marginBottom={0} style={styles.rowText} />
            </View>

            {/* Amount and Date */}
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Skeleton width="100%" height={12} marginBottom={4} />
                <Skeleton width="100%" height={20} />
              </View>
              <View style={styles.footerItem}>
                <Skeleton width="100%" height={12} marginBottom={4} />
                <Skeleton width="100%" height={16} />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Skeleton width={70} height={32} borderRadius={4} marginBottom={0} style={styles.actionButton} />
              <Skeleton width={70} height={32} borderRadius={4} marginBottom={0} style={styles.actionButton} />
              <Skeleton width={90} height={32} borderRadius={4} marginBottom={0} />
            </View>
          </View>
        ))}
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowText: {
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
  },
});
