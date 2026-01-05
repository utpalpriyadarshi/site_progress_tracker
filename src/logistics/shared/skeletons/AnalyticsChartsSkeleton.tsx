import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard } from '../../../components/skeletons';

export interface AnalyticsChartsSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * AnalyticsChartsSkeleton Component
 *
 * Loading skeleton for Logistics Analytics Screen.
 * Shows placeholders for period selector, KPI cards, charts, and data tables.
 *
 * Features:
 * - Period selector tabs
 * - KPI cards grid (4 cards)
 * - Multiple chart placeholders
 * - Table/list placeholders
 * - Matches actual analytics screen layout
 *
 * @example
 * ```tsx
 * import { AnalyticsChartsSkeleton } from '../shared/skeletons';
 *
 * if (loading) {
 *   return <AnalyticsChartsSkeleton />;
 * }
 * ```
 */
export const AnalyticsChartsSkeleton: React.FC<AnalyticsChartsSkeletonProps> = ({
  style,
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="60%" height={14} marginBottom={8} />
            <Skeleton width="80%" height={32} marginBottom={4} />
            <Skeleton width="40%" height={12} />
          </View>
        ))}
      </View>

      {/* Main Chart Section */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={250} borderRadius={8} />
      </View>

      {/* Secondary Charts */}
      <View style={styles.section}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        <View style={styles.chartRow}>
          <Skeleton width="48%" height={180} borderRadius={8} />
          <Skeleton width="48%" height={180} borderRadius={8} />
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.section}>
        <Skeleton width="45%" height={20} marginBottom={12} />
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.statCard}>
              <Skeleton width="70%" height={12} marginBottom={6} />
              <Skeleton width="90%" height={24} marginBottom={4} />
              <Skeleton width="50%" height={10} />
            </View>
          ))}
        </View>
      </View>

      {/* Data Table/List */}
      <View style={styles.section}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} lines={2} variant="compact" />
        ))}
      </View>

      {/* Bottom Summary Section */}
      <View style={styles.section}>
        <Skeleton width="35%" height={20} marginBottom={12} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Skeleton width="100%" height={16} marginBottom={6} />
            <Skeleton width="80%" height={28} />
          </View>
          <View style={styles.summaryItem}>
            <Skeleton width="100%" height={16} marginBottom={6} />
            <Skeleton width="80%" height={28} />
          </View>
          <View style={styles.summaryItem}>
            <Skeleton width="100%" height={16} marginBottom={6} />
            <Skeleton width="80%" height={28} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
  },
});
