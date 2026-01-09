/**
 * DesignRfqListSkeleton Component
 *
 * Loading skeleton for Design RFQ list view.
 * Matches the layout of DesignRfqCard component.
 *
 * @example
 * ```tsx
 * // Default - 5 skeleton cards
 * <DesignRfqListSkeleton />
 *
 * // Custom count
 * <DesignRfqListSkeleton count={3} />
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * Props for DesignRfqListSkeleton
 */
export interface DesignRfqListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Optional style overrides */
  style?: ViewStyle;
}

/**
 * Single RFQ Card Skeleton
 */
const RfqCardSkeleton: React.FC = () => (
  <Card style={styles.card}>
    <Card.Content>
      {/* Header with RFQ number, title, and status chip */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={16} marginBottom={8} />
          <Skeleton width="80%" height={18} />
        </View>
        <Skeleton width={80} height={28} borderRadius={14} />
      </View>

      {/* Detail rows */}
      <View style={styles.detailsSection}>
        <Skeleton width="100%" height={14} marginBottom={8} />
        <Skeleton width="100%" height={14} marginBottom={8} />
        <Skeleton width="100%" height={14} marginBottom={8} />
        <Skeleton width="90%" height={14} marginBottom={8} />
        <Skeleton width="85%" height={14} marginBottom={8} />
        <Skeleton width="80%" height={14} marginBottom={8} />
        <Skeleton width="75%" height={14} marginBottom={8} />
        <Skeleton width="70%" height={14} />
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <Skeleton width={120} height={36} borderRadius={4} />
      </View>
    </Card.Content>
  </Card>
);

/**
 * DesignRfqListSkeleton Component
 */
const DesignRfqListSkeleton: React.FC<DesignRfqListSkeletonProps> = ({ count = 5, style }) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <RfqCardSkeleton key={index} />
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
  detailsSection: {
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
});

export default DesignRfqListSkeleton;
