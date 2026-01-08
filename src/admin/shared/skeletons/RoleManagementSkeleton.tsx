import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface RoleManagementSkeletonProps {
  /**
   * Number of user card skeletons to display
   * @default 6
   */
  count?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * RoleManagementSkeleton Component
 *
 * Loading skeleton for Role Management Screen.
 * Shows placeholders for:
 * - Search bar
 * - Filter chips (role, project, status)
 * - User cards with avatar, name, email, role badge, and actions
 *
 * @example
 * ```tsx
 * import { RoleManagementSkeleton } from '@/admin/shared';
 *
 * if (loading) {
 *   return <RoleManagementSkeleton count={8} />;
 * }
 * ```
 */
export const RoleManagementSkeleton: React.FC<RoleManagementSkeletonProps> = ({
  count = 6,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Skeleton width="100%" height={56} borderRadius={4} marginBottom={0} />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        <Skeleton width={90} height={32} borderRadius={16} marginBottom={0} style={styles.filterChip} />
        <Skeleton width={110} height={32} borderRadius={16} marginBottom={0} style={styles.filterChip} />
        <Skeleton width={95} height={32} borderRadius={16} marginBottom={0} style={styles.filterChip} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Skeleton width="80%" height={12} marginBottom={8} />
          <Skeleton width="60%" height={28} marginBottom={0} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width="80%" height={12} marginBottom={8} />
          <Skeleton width="60%" height={28} marginBottom={0} />
        </View>
      </View>

      {/* User Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.userCard}>
          {/* Avatar */}
          <Skeleton width={56} height={56} borderRadius={28} marginBottom={0} />

          {/* User Info */}
          <View style={styles.cardContent}>
            {/* Name */}
            <Skeleton width="60%" height={18} marginBottom={6} />
            {/* Username */}
            <Skeleton width="45%" height={14} marginBottom={6} />
            {/* Email */}
            <Skeleton width="75%" height={14} marginBottom={8} />
            {/* Role Badge */}
            <Skeleton width="35%" height={24} borderRadius={12} marginBottom={0} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Skeleton width={32} height={32} borderRadius={16} marginBottom={8} />
            <Skeleton width={32} height={32} borderRadius={16} marginBottom={8} />
            <Skeleton width={32} height={32} borderRadius={16} marginBottom={0} />
          </View>
        </View>
      ))}

      {/* FAB placeholder */}
      <View style={styles.fabPlaceholder}>
        <Skeleton width={56} height={56} borderRadius={28} marginBottom={0} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Search Section
  searchSection: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginRight: 8,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    marginRight: 16,
  },

  // User Card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  cardContent: {
    flex: 1,
    marginLeft: 12,
  },

  // Actions
  actions: {
    marginLeft: 12,
    alignItems: 'center',
  },

  // FAB Placeholder
  fabPlaceholder: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
