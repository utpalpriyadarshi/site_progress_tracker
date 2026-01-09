/**
 * MilestoneListSkeleton - Loading skeleton for milestone lists
 *
 * Provides a loading placeholder that matches the MilestoneCard layout,
 * showing multiple skeleton cards in a list format.
 *
 * @example
 * ```tsx
 * {loading ? (
 *   <MilestoneListSkeleton count={5} />
 * ) : (
 *   milestones.map(m => <MilestoneCard key={m.id} milestone={m} />)
 * )}
 * ```
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * MilestoneListSkeleton Props
 */
export interface MilestoneListSkeletonProps {
  /**
   * Number of skeleton cards to display
   * @default 5
   */
  count?: number;

  /**
   * Whether to show filter chips at the top
   * @default true
   */
  showFilters?: boolean;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * Individual milestone card skeleton
 */
const MilestoneCardSkeleton: React.FC = () => (
  <View style={styles.card}>
    {/* Header */}
    <View style={styles.cardHeader}>
      <View style={styles.cardInfo}>
        <Skeleton width="30%" height={14} marginBottom={4} />
        <Skeleton width="80%" height={18} marginBottom={4} />
        <Skeleton width="60%" height={12} marginBottom={0} />
      </View>
      <Skeleton width={80} height={28} borderRadius={14} marginBottom={0} />
    </View>

    {/* Progress Section */}
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Skeleton width="20%" height={14} marginBottom={0} />
        <Skeleton width="15%" height={14} marginBottom={0} />
      </View>
      <Skeleton width="100%" height={8} borderRadius={4} marginBottom={0} />
    </View>

    {/* Dates Section */}
    <View style={styles.datesSection}>
      <View style={styles.dateRow}>
        <Skeleton width="30%" height={12} marginBottom={0} />
        <Skeleton width="35%" height={12} marginBottom={0} />
      </View>
      <View style={styles.dateRow}>
        <Skeleton width="30%" height={12} marginBottom={0} />
        <Skeleton width="35%" height={12} marginBottom={0} />
      </View>
      <Skeleton width="45%" height={12} marginBottom={0} />
    </View>

    {/* Notes Section */}
    <View style={styles.notesSection}>
      <Skeleton width="15%" height={12} marginBottom={4} />
      <Skeleton width="90%" height={12} marginBottom={2} />
      <Skeleton width="70%" height={12} marginBottom={0} />
    </View>

    {/* Actions */}
    <View style={styles.actions}>
      <Skeleton width={80} height={36} borderRadius={4} marginBottom={0} />
      <Skeleton width={80} height={36} borderRadius={4} marginBottom={0} />
    </View>
  </View>
);

/**
 * MilestoneListSkeleton Component
 */
export const MilestoneListSkeleton: React.FC<MilestoneListSkeletonProps> = ({
  count = 5,
  showFilters = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Header Section */}
      {showFilters && (
        <View style={styles.header}>
          <Skeleton width="50%" height={24} marginBottom={16} />
          <View style={styles.filterRow}>
            <Skeleton width={80} height={32} borderRadius={16} marginBottom={0} />
            <Skeleton width={90} height={32} borderRadius={16} marginBottom={0} />
            <Skeleton width={100} height={32} borderRadius={16} marginBottom={0} />
          </View>
        </View>
      )}

      {/* Milestone Cards */}
      <View style={styles.list}>
        {Array.from({ length: count }).map((_, index) => (
          <MilestoneCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datesSection: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notesSection: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
