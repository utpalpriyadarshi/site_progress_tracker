import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { RecentActivity } from '../types/dashboard';

export interface RecentActivityWidgetProps {
  data: RecentActivity[];
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onItemPress?: (item: RecentActivity) => void;
  testID?: string;
}

/**
 * RecentActivityWidget - Displays recent activity feed
 *
 * Shows:
 * - Recent DOORS packages (received/reviewed)
 * - Recent Design RFQs (issued/awarded)
 * - Timestamp and status for each activity
 * - Interactive - taps navigate to item details
 *
 * Target LOC: ~140
 */
export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onItemPress,
  testID,
}) => {
  const getTypeIcon = (type: 'package' | 'rfq') => {
    return type === 'package' ? '📦' : '📝';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: '#FFA500',
      received: '#2196F3',
      reviewed: '#4CAF50',
      draft: '#9E9E9E',
      issued: '#2196F3',
      awarded: '#4CAF50',
    };
    return statusColors[status.toLowerCase()] || '#666';
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderActivityItem = (item: RecentActivity, index: number) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.activityItem, index === data.length - 1 && styles.lastItem]}
      onPress={() => onItemPress?.(item)}
      disabled={!onItemPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.type === 'package' ? 'DOORS Package' : 'Design RFQ'} ${item.title}, ${item.action}, Status: ${item.status}, ${formatTimestamp(item.timestamp)}`}
      accessibilityHint={onItemPress ? 'Double tap to view details' : undefined}
      activeOpacity={onItemPress ? 0.7 : 1}
    >
      <View style={styles.activityIcon}>
        <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.activityAction} numberOfLines={1}>
          {item.action}
        </Text>
        <View style={styles.activityMeta}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {data.map((item, index) => renderActivityItem(item, index))}
      </ScrollView>
    );
  };

  return (
    <BaseWidget
      id="recent-activity"
      title="Recent Activity"
      subtitle={data.length > 0 ? `${data.length} ${data.length === 1 ? 'item' : 'items'}` : undefined}
      refreshable={!!onRefresh}
      onRefresh={onRefresh}
      loading={loading}
      error={error}
      size="large"
      testID={testID}
    >
      {renderContent()}
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 300,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityAction: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
