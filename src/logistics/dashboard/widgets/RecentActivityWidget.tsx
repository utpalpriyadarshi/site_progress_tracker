/**
 * RecentActivityWidget
 *
 * Displays recent logistics activity: material updates,
 * POs, deliveries, RFQs, and DOORS packages.
 *
 * WCAG 2.1 AA Accessibility:
 * - Screen reader announcements on data load
 * - Proper accessibility labels and roles
 * - Semantic structure for screen readers
 *
 * @version 1.1.0
 * @since Logistics Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { useRecentActivityData, ActivityItem } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helper ====================

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return '';

  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== Component ====================

export const RecentActivityWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useRecentActivityData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      if (data.activities.length > 0) {
        announce(`Recent activity loaded: ${data.activities.length} recent updates`);
      } else {
        announce('No recent activity to display');
      }
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `Recent activity: ${data.totalCount} activities`
    : 'Recent activity loading';

  const isEmpty = !loading && !error && (!data || data.activities.length === 0);

  const renderActivityItem = (activity: ActivityItem, index: number) => (
    <View
      key={activity.id}
      style={[
        styles.activityItem,
        index < (data?.activities.length || 0) - 1 && styles.activityItemBorder,
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}: ${activity.description}, ${formatTimeAgo(activity.timestamp)}`}
      accessibilityHint="Double tap to view details"
    >
      <View style={[styles.iconContainer, { backgroundColor: `${activity.color}20` }]}>
        <Icon name={activity.icon} size={18} color={activity.color} />
      </View>
      <View style={styles.activityContent}>
        <Text variant="bodySmall" style={styles.activityTitle}>
          {activity.title}
        </Text>
        <Text variant="labelSmall" style={styles.activityDesc} numberOfLines={1}>
          {activity.description}
        </Text>
      </View>
      <Text variant="labelSmall" style={styles.activityTime}>
        {formatTimeAgo(activity.timestamp)}
      </Text>
    </View>
  );

  return (
    <BaseWidget
      title="Recent Activity"
      icon="history"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'history',
        title: 'No Recent Activity',
        message: 'Activity from materials, POs, and RFQs will appear here.',
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && data.activities.length > 0 && (
        <View style={styles.container}>
          <View style={styles.activityList}>
            {data.activities.slice(0, 6).map((activity, index) =>
              renderActivityItem(activity, index)
            )}
          </View>

          {/* Activity Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text variant="labelSmall" style={styles.legendText}>Materials</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text variant="labelSmall" style={styles.legendText}>POs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
              <Text variant="labelSmall" style={styles.legendText}>RFQs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#00BCD4' }]} />
              <Text variant="labelSmall" style={styles.legendText}>DOORS</Text>
            </View>
          </View>
        </View>
      )}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '500',
  },
  activityDesc: {
    opacity: 0.6,
    marginTop: 1,
  },
  activityTime: {
    opacity: 0.5,
    fontSize: 10,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  emptyText: {
    opacity: 0.6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    opacity: 0.6,
    fontSize: 10,
  },
});

export default RecentActivityWidget;
