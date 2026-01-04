import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface BomListSkeletonProps {
  /**
   * Number of BOM card skeletons to show
   * @default 5
   */
  count?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * BomListSkeleton Component
 *
 * Loading skeleton for BOM Management Screen.
 * Shows skeleton cards that match the structure of BOM cards.
 *
 * @example
 * ```tsx
 * import { BomListSkeleton } from '../shared';
 *
 * if (loading && boms.length === 0) {
 *   return <BomListSkeleton count={5} />;
 * }
 * ```
 */
export const BomListSkeleton: React.FC<BomListSkeletonProps> = ({
  count = 5,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width="50%" height={28} marginBottom={8} />
        <View style={styles.filterRow}>
          <Skeleton width="30%" height={36} borderRadius={4} />
          <Skeleton width="30%" height={36} borderRadius={4} />
        </View>
      </View>

      {/* BOM Cards */}
      <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.bomCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Skeleton width="60%" height={18} marginBottom={4} />
              <Skeleton width={80} height={24} borderRadius={12} />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Skeleton width="40%" height={14} marginBottom={8} />
              <Skeleton width="50%" height={14} marginBottom={8} />
              <View style={styles.statsRow}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="30%" height={14} />
              </View>
            </View>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              <Skeleton width={70} height={32} borderRadius={4} />
              <Skeleton width={70} height={32} borderRadius={4} />
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  listContainer: {
    padding: 16,
  },
  bomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
