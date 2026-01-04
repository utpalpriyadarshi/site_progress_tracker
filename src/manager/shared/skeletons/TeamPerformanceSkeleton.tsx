import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard } from '../../../components/skeletons';

export interface TeamPerformanceSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * TeamPerformanceSkeleton Component
 *
 * Loading skeleton for Team Performance Screen.
 * Shows skeleton for performance metrics, charts, and team member cards.
 *
 * @example
 * ```tsx
 * import { TeamPerformanceSkeleton } from '../shared';
 *
 * if (loading) {
 *   return <TeamPerformanceSkeleton />;
 * }
 * ```
 */
export const TeamPerformanceSkeleton: React.FC<TeamPerformanceSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header with Team Selector */}
      <View style={styles.header}>
        <Skeleton width="50%" height={24} marginBottom={12} />
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        <View style={styles.metricsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.metricCard}>
              <Skeleton width="60%" height={14} marginBottom={8} />
              <Skeleton width="80%" height={32} marginBottom={4} />
              <Skeleton width="40%" height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Activity Chart */}
      <View style={styles.chartSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        <Skeleton width="100%" height={250} borderRadius={8} />
      </View>

      {/* Team Member Cards */}
      <View style={styles.teamSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard
            key={i}
            showAvatar
            lines={2}
            variant="compact"
            style={styles.teamCard}
          />
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
    marginBottom: 16,
  },
  metricsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  teamSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  teamCard: {
    marginBottom: 12,
  },
});
