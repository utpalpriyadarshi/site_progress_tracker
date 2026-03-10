/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for Design Engineer Dashboard.
 * Matches the layout of DesignEngineerDashboardScreen.
 *
 * @example
 * ```tsx
 * // Default skeleton
 * <DashboardSkeleton />
 *
 * // Custom stats count
 * <DashboardSkeleton statsCount={6} />
 * ```
 */

import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';
import { Skeleton } from '../../../components/skeletons/Skeleton';

/**
 * Props for DashboardSkeleton
 */
export interface DashboardSkeletonProps {
  /** Number of stats cards per section */
  statsCount?: number;
  /** Optional style overrides */
  style?: ViewStyle;
}

/**
 * Single Metric Card Skeleton
 */
const MetricCardSkeleton: React.FC = () => (
  <Card mode="elevated" style={styles.metricCard}>
    <Card.Content>
      <Skeleton width="60%" height={14} marginBottom={8} />
      <Skeleton width={60} height={32} marginBottom={4} />
      <Skeleton width="40%" height={12} />
    </Card.Content>
  </Card>
);

/**
 * Section Header Skeleton
 */
const SectionHeaderSkeleton: React.FC = () => (
  <View style={styles.sectionHeader}>
    <Skeleton width={24} height={24} borderRadius={12} />
    <Skeleton width={150} height={18} style={{ marginLeft: 8 }} />
  </View>
);

/**
 * Info Card Skeleton
 */
const InfoCardSkeleton: React.FC = () => (
  <Card mode="elevated" style={styles.infoCard}>
    <Card.Content>
      <Skeleton width={150} height={16} marginBottom={12} />
      <Skeleton width="100%" height={14} marginBottom={6} />
      <Skeleton width="95%" height={14} marginBottom={6} />
      <Skeleton width="90%" height={14} marginBottom={6} />
      <Skeleton width="85%" height={14} />
    </Card.Content>
  </Card>
);

/**
 * Quick Action Button Skeleton
 */
const QuickActionSkeleton: React.FC = () => (
  <View style={styles.quickActionButton}>
    <Skeleton width={24} height={24} borderRadius={12} />
    <Skeleton width={150} height={16} style={{ marginLeft: 12 }} />
  </View>
);

/**
 * DashboardSkeleton Component
 */
const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ statsCount = 2, style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={200} height={24} marginBottom={4} />
        <Skeleton width={180} height={14} />
      </View>

      {/* DOORS Packages Section */}
      <SectionHeaderSkeleton />
      <View style={styles.metricsRow}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>
      <View style={styles.metricsRow}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Design RFQs Section */}
      <SectionHeaderSkeleton />
      <View style={styles.metricsRow}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>
      <View style={styles.metricsRow}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Performance Metrics Section */}
      <SectionHeaderSkeleton />
      <View style={styles.metricsRow}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Info Card */}
      <InfoCardSkeleton />

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Skeleton width={120} height={18} marginBottom={12} />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    elevation: 2,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  bottomPadding: {
    height: 40,
  },
});

export default DashboardSkeleton;
