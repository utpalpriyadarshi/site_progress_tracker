import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface AdminDashboardSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * AdminDashboardSkeleton Component
 *
 * Loading skeleton for Admin Dashboard Screen.
 * Shows placeholders for:
 * - Dashboard header
 * - Role switcher card
 * - Statistics cards (Total Projects, Sites, Users, Items)
 * - Management action cards (Project Management, User Management)
 * - Migration cards (Password Migration, Category Migration)
 * - Database reset card
 *
 * @example
 * ```tsx
 * import { AdminDashboardSkeleton } from '@/admin/shared';
 *
 * if (loading) {
 *   return <AdminDashboardSkeleton />;
 * }
 * ```
 */
export const AdminDashboardSkeleton: React.FC<AdminDashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Dashboard Header */}
      <View style={styles.header}>
        <Skeleton width="60%" height={28} marginBottom={8} />
        <Skeleton width="75%" height={16} marginBottom={0} />
      </View>

      {/* Role Switcher Card */}
      <View style={styles.card}>
        <Skeleton width="40%" height={18} marginBottom={12} />
        <View style={styles.roleRow}>
          <Skeleton width={80} height={80} borderRadius={8} marginBottom={0} style={styles.roleItem} />
          <Skeleton width={80} height={80} borderRadius={8} marginBottom={0} style={styles.roleItem} />
          <Skeleton width={80} height={80} borderRadius={8} marginBottom={0} style={styles.roleItem} />
        </View>
      </View>

      {/* Statistics Cards - Row 1 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={4} />
          <Skeleton width="60%" height={12} marginBottom={0} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={4} />
          <Skeleton width="60%" height={12} marginBottom={0} />
        </View>
      </View>

      {/* Statistics Cards - Row 2 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={4} />
          <Skeleton width="60%" height={12} marginBottom={0} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={4} />
          <Skeleton width="60%" height={12} marginBottom={0} />
        </View>
      </View>

      {/* Project Management Card */}
      <View style={styles.managementCard}>
        <View style={styles.managementHeader}>
          <Skeleton width={32} height={32} borderRadius={16} marginBottom={0} />
          <View style={styles.managementText}>
            <Skeleton width="70%" height={18} marginBottom={6} />
            <Skeleton width="90%" height={14} marginBottom={0} />
          </View>
        </View>
        <Skeleton width="40%" height={40} borderRadius={4} marginBottom={0} />
      </View>

      {/* User Management Card */}
      <View style={styles.managementCard}>
        <View style={styles.managementHeader}>
          <Skeleton width={32} height={32} borderRadius={16} marginBottom={0} />
          <View style={styles.managementText}>
            <Skeleton width="70%" height={18} marginBottom={6} />
            <Skeleton width="90%" height={14} marginBottom={0} />
          </View>
        </View>
        <Skeleton width="40%" height={40} borderRadius={4} marginBottom={0} />
      </View>

      {/* Password Migration Card */}
      <View style={styles.migrationCard}>
        <View style={styles.migrationHeader}>
          <Skeleton width={28} height={28} borderRadius={14} marginBottom={0} />
          <View style={styles.migrationText}>
            <Skeleton width="65%" height={18} marginBottom={6} />
            <Skeleton width="85%" height={14} marginBottom={0} />
          </View>
        </View>
        <View style={styles.migrationStatus}>
          <Skeleton width="50%" height={12} marginBottom={4} />
          <Skeleton width="70%" height={14} marginBottom={0} />
        </View>
        <Skeleton width="35%" height={36} borderRadius={4} marginBottom={0} />
      </View>

      {/* Category Migration Card */}
      <View style={styles.migrationCard}>
        <View style={styles.migrationHeader}>
          <Skeleton width={28} height={28} borderRadius={14} marginBottom={0} />
          <View style={styles.migrationText}>
            <Skeleton width="65%" height={18} marginBottom={6} />
            <Skeleton width="85%" height={14} marginBottom={0} />
          </View>
        </View>
        <Skeleton width="35%" height={36} borderRadius={4} marginBottom={0} />
      </View>

      {/* Database Reset Card */}
      <View style={styles.resetCard}>
        <View style={styles.resetHeader}>
          <Skeleton width={28} height={28} borderRadius={14} marginBottom={0} />
          <View style={styles.resetText}>
            <Skeleton width="55%" height={18} marginBottom={6} />
            <Skeleton width="100%" height={14} marginBottom={4} />
            <Skeleton width="80%" height={14} marginBottom={0} />
          </View>
        </View>
        <Skeleton width="35%" height={40} borderRadius={4} marginBottom={0} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 8,
  },

  // Card
  card: {
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

  // Role Switcher
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleItem: {
    marginRight: 12,
    marginBottom: 12,
  },

  // Statistics Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Management Card
  managementCard: {
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
  managementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  managementText: {
    flex: 1,
    marginLeft: 12,
  },

  // Migration Card
  migrationCard: {
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
  migrationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  migrationText: {
    flex: 1,
    marginLeft: 12,
  },
  migrationStatus: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },

  // Database Reset Card
  resetCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  resetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resetText: {
    flex: 1,
    marginLeft: 12,
  },
});
