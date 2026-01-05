import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard } from '../../../components/skeletons';

export interface DeliveryCalendarSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}

/**
 * DeliveryCalendarSkeleton Component
 *
 * Loading skeleton for Delivery Scheduling Screen.
 * Shows calendar grid and delivery list placeholders.
 *
 * Features:
 * - Calendar header with navigation
 * - Weekday headers
 * - Calendar grid (35 day cells)
 * - Delivery list items
 * - Filter section
 *
 * @example
 * ```tsx
 * import { DeliveryCalendarSkeleton } from '../shared/skeletons';
 *
 * if (loading) {
 *   return <DeliveryCalendarSkeleton />;
 * }
 * ```
 */
export const DeliveryCalendarSkeleton: React.FC<DeliveryCalendarSkeletonProps> = ({
  style,
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
    >
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width="60%" height={24} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>

      {/* View Mode Selector */}
      <View style={styles.viewModeSelector}>
        <Skeleton width="30%" height={32} borderRadius={16} />
        <Skeleton width="30%" height={32} borderRadius={16} />
        <Skeleton width="30%" height={32} borderRadius={16} />
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={styles.weekdayCell}>
            <Skeleton width={40} height={20} />
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {Array.from({ length: 35 }).map((_, i) => (
          <View key={i} style={styles.dayCell}>
            <Skeleton width={32} height={32} borderRadius={16} marginBottom={4} />
            {/* Delivery Indicators */}
            {i % 4 === 0 && (
              <View style={styles.deliveryIndicators}>
                <Skeleton width={6} height={6} borderRadius={3} />
                <Skeleton width={6} height={6} borderRadius={3} />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statItem}>
            <Skeleton width={8} height={8} borderRadius={4} marginBottom={4} />
            <Skeleton width="80%" height={10} />
          </View>
        ))}
      </View>

      {/* Delivery List Section */}
      <View style={styles.deliverySection}>
        <View style={styles.sectionHeader}>
          <Skeleton width="50%" height={20} />
          <Skeleton width={80} height={32} borderRadius={4} />
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChips}>
          <Skeleton width="22%" height={28} borderRadius={14} />
          <Skeleton width="22%" height={28} borderRadius={14} />
          <Skeleton width="22%" height={28} borderRadius={14} />
          <Skeleton width="22%" height={28} borderRadius={14} />
        </View>

        {/* Delivery Cards */}
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} lines={3} showActions variant="compact" />
        ))}
      </View>

      {/* Summary Footer */}
      <View style={styles.summaryFooter}>
        <Skeleton width="40%" height={18} marginBottom={8} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Skeleton width="100%" height={14} marginBottom={4} />
            <Skeleton width="70%" height={20} />
          </View>
          <View style={styles.summaryItem}>
            <Skeleton width="100%" height={14} marginBottom={4} />
            <Skeleton width="70%" height={20} />
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  viewModeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  deliveryIndicators: {
    flexDirection: 'row',
    gap: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  deliverySection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
  },
});
