import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard, SkeletonHeader } from '../../../components/skeletons';

export interface DashboardSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for Manager Dashboard Screen.
 * Mirrors the structure of the actual dashboard with KPIs, sections, and charts.
 *
 * @example
 * ```tsx
 * import { DashboardSkeleton } from '../shared';
 *
 * if (loading) {
 *   return <DashboardSkeleton />;
 * }
 * ```
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <SkeletonHeader variant="large" showAction style={styles.header} />

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="100%" height={80} borderRadius={8} />
          </View>
        ))}
      </View>

      {/* Engineering Section */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <View style={styles.chartRow}>
          <Skeleton width="48%" height={120} borderRadius={8} />
          <Skeleton width="48%" height={120} borderRadius={8} />
        </View>
      </View>

      {/* Site Progress Section */}
      <View style={styles.section}>
        <Skeleton width="35%" height={20} marginBottom={12} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.progressItem}>
            <Skeleton width="30%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Financial Section */}
      <View style={styles.section}>
        <Skeleton width="30%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={200} borderRadius={8} />
      </View>

      {/* Bottom Sections */}
      <View style={styles.section}>
        <SkeletonCard lines={3} showActions variant="compact" />
        <SkeletonCard lines={3} showActions variant="compact" />
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
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    width: '48%',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    marginBottom: 16,
  },
});
