/**
 * DoorsPackageListSkeleton Component
 *
 * Loading skeleton for DOORS Package list view.
 * Matches the layout of DoorsPackageCard component.
 *
 * @example
 * ```tsx
 * // Default - 5 skeleton cards
 * <DoorsPackageListSkeleton />
 *
 * // Custom count
 * <DoorsPackageListSkeleton count={3} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * Props for DoorsPackageListSkeleton
 */
export interface DoorsPackageListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Optional style overrides */
  style?: ViewStyle;
}

/**
 * Single Package Card Skeleton
 */
const PackageCardSkeleton: React.FC = () => (
  <Card mode="elevated" style={styles.card}>
    <Card.Content>
      {/* Header with DOORS ID, site name, and dual badges */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width={140} height={18} marginBottom={8} />
          <Skeleton width="70%" height={14} />
        </View>
        <View style={styles.badges}>
          <Skeleton width={90} height={24} borderRadius={12} marginBottom={4} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
      </View>

      {/* Detail rows */}
      <View style={styles.detailsSection}>
        <Skeleton width="100%" height={14} marginBottom={8} />
        <Skeleton width="95%" height={14} marginBottom={8} />
        <Skeleton width="85%" height={14} marginBottom={8} />
        <Skeleton width="90%" height={14} marginBottom={8} />
        <Skeleton width="80%" height={14} marginBottom={8} />
        <Skeleton width="75%" height={14} />
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Skeleton width={130} height={36} borderRadius={4} />
      </View>
    </Card.Content>
  </Card>
);

/**
 * DoorsPackageListSkeleton Component
 */
const DoorsPackageListSkeleton: React.FC<DoorsPackageListSkeletonProps> = ({ count = 5, style }) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <PackageCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  detailsSection: {
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
});

export default DoorsPackageListSkeleton;
