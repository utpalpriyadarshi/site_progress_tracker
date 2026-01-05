import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface InventoryGridSkeletonProps {
  /**
   * Number of inventory items to display
   * @default 6
   */
  count?: number;
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * InventoryGridSkeleton Component
 *
 * Loading skeleton for Inventory Management Screen.
 * Shows grid of inventory item placeholders with search and filters.
 *
 * Features:
 * - Search bar placeholder
 * - Filter buttons
 * - Grid of inventory cards
 * - Stock status indicators
 * - Configurable item count
 *
 * @example
 * ```tsx
 * import { InventoryGridSkeleton } from '../shared/skeletons';
 *
 * if (loading) {
 *   return <InventoryGridSkeleton count={8} />;
 * }
 * ```
 */
export const InventoryGridSkeleton: React.FC<InventoryGridSkeletonProps> = ({
  count = 6,
  style,
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      {/* Search and Filters Header */}
      <View style={styles.header}>
        {/* Search Bar */}
        <Skeleton width="100%" height={48} borderRadius={8} marginBottom={12} />

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <Skeleton width="28%" height={36} borderRadius={18} />
          <Skeleton width="28%" height={36} borderRadius={18} />
          <Skeleton width="28%" height={36} borderRadius={18} />
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <Skeleton width="60%" height={12} marginBottom={6} />
            <Skeleton width="80%" height={24} />
          </View>
        ))}
      </View>

      {/* Inventory Grid */}
      <View style={styles.grid}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.gridItem}>
            {/* Status Indicator */}
            <View style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <Skeleton width="30%" height={12} marginBottom={4} />
                <Skeleton width={60} height={24} borderRadius={12} />
              </View>

              <Skeleton width="90%" height={18} marginBottom={8} />
              <Skeleton width="70%" height={14} marginBottom={12} />

              {/* Stock Level Bar */}
              <View style={styles.stockSection}>
                <Skeleton width="45%" height={10} marginBottom={6} />
                <Skeleton width="100%" height={6} borderRadius={3} marginBottom={4} />
                <View style={styles.stockLabels}>
                  <Skeleton width="25%" height={9} />
                  <Skeleton width="25%" height={9} />
                </View>
              </View>

              {/* Location & Actions */}
              <View style={styles.cardFooter}>
                <Skeleton width="60%" height={12} />
                <Skeleton width={70} height={28} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Load More Button */}
      <View style={styles.loadMoreContainer}>
        <Skeleton width="40%" height={44} borderRadius={8} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockSection: {
    marginBottom: 12,
  },
  stockLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
