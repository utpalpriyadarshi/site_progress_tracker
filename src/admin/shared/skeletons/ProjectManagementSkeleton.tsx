import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from '../../../components/skeletons';

export interface ProjectManagementSkeletonProps {
  /**
   * Number of project card skeletons to display
   * @default 4
   */
  count?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * ProjectManagementSkeleton Component
 *
 * Loading skeleton for Project Management Screen.
 * Shows placeholders for:
 * - Header with title and subtitle
 * - Project cards with name, client, status, dates, budget, and metrics
 * - Progress bars
 *
 * @example
 * ```tsx
 * import { ProjectManagementSkeleton } from '@/admin/shared';
 *
 * if (loading) {
 *   return <ProjectManagementSkeleton count={5} />;
 * }
 * ```
 */
export const ProjectManagementSkeleton: React.FC<ProjectManagementSkeletonProps> = ({
  count = 4,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width="55%" height={28} marginBottom={8} />
        <Skeleton width="70%" height={16} marginBottom={0} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={0} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width="70%" height={14} marginBottom={8} />
          <Skeleton width="50%" height={32} marginBottom={0} />
        </View>
      </View>

      {/* Project Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.projectCard}>
          {/* Project Header */}
          <View style={styles.projectHeader}>
            <View style={styles.projectTitleSection}>
              <Skeleton width={140} height={18} marginBottom={6} />
              <Skeleton width={180} height={14} marginBottom={0} />
            </View>
            <Skeleton width={85} height={28} borderRadius={14} marginBottom={0} />
          </View>

          {/* Date Range */}
          <View style={styles.dateSection}>
            <View style={styles.dateItem}>
              <Skeleton width="80%" height={12} marginBottom={6} />
              <Skeleton width="100%" height={16} marginBottom={0} />
            </View>
            <View style={styles.dateItem}>
              <Skeleton width="80%" height={12} marginBottom={6} />
              <Skeleton width="100%" height={16} marginBottom={0} />
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Skeleton width="100%" height={6} borderRadius={3} marginBottom={8} />
            <Skeleton width="60%" height={12} marginBottom={0} />
          </View>

          {/* Budget Section */}
          <View style={styles.budgetSection}>
            <Skeleton width="25%" height={14} marginBottom={0} />
            <Skeleton width="35%" height={20} marginBottom={0} />
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Skeleton width="100%" height={24} marginBottom={4} />
              <Skeleton width="70%" height={12} marginBottom={0} />
            </View>
            <View style={styles.metricItem}>
              <Skeleton width="100%" height={24} marginBottom={4} />
              <Skeleton width="70%" height={12} marginBottom={0} />
            </View>
            <View style={styles.metricItem}>
              <Skeleton width="100%" height={24} marginBottom={4} />
              <Skeleton width="70%" height={12} marginBottom={0} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <Skeleton width="45%" height={36} borderRadius={4} marginBottom={0} />
            <Skeleton width="45%" height={36} borderRadius={4} marginBottom={0} />
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

  // Header
  header: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },

  // Project Card
  projectCard: {
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

  // Project Header
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectTitleSection: {
    flex: 1,
    marginRight: 12,
  },

  // Date Section
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
    marginRight: 8,
  },

  // Progress Section
  progressSection: {
    marginBottom: 12,
  },

  // Budget Section
  budgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // FAB Placeholder
  fabPlaceholder: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
