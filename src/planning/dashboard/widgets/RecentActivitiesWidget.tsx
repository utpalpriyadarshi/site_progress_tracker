/**
 * RecentActivitiesWidget Component
 *
 * Shows last 10 planning actions with timestamps and action types.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

export type ActivityType = 'created' | 'updated' | 'completed' | 'deleted' | 'status_changed';

export interface Activity {
  id: string;
  type: ActivityType;
  itemName: string;
  itemType: 'schedule' | 'milestone' | 'wbs' | 'resource';
  timestamp: Date;
  user?: string;
}

export interface RecentActivitiesWidgetProps {
  activities: Activity[];
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({
  activities,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();

  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'created':
        return 'plus-circle';
      case 'updated':
        return 'pencil-circle';
      case 'completed':
        return 'check-circle';
      case 'deleted':
        return 'delete-circle';
      case 'status_changed':
        return 'swap-horizontal-circle';
      default:
        return 'information';
    }
  };

  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case 'created':
        return COLORS.SUCCESS;
      case 'updated':
        return COLORS.INFO;
      case 'completed':
        return '#8BC34A';
      case 'deleted':
        return COLORS.ERROR;
      case 'status_changed':
        return COLORS.WARNING;
      default:
        return theme.colors.outline;
    }
  };

  const getActivityLabel = (type: ActivityType): string => {
    switch (type) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'completed':
        return 'Completed';
      case 'deleted':
        return 'Deleted';
      case 'status_changed':
        return 'Status Changed';
      default:
        return 'Modified';
    }
  };

  const getItemTypeIcon = (itemType: string): string => {
    switch (itemType) {
      case 'schedule':
        return 'calendar';
      case 'milestone':
        return 'flag';
      case 'wbs':
        return 'sitemap';
      case 'resource':
        return 'account-group';
      default:
        return 'file';
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <View
      style={styles.activityRow}
      accessible
      accessibilityLabel={`${getActivityLabel(item.type)} ${item.itemName}, ${formatTimestamp(item.timestamp)}`}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getActivityColor(item.type)}20` },
        ]}
      >
        <Icon
          name={getActivityIcon(item.type)}
          size={18}
          color={getActivityColor(item.type)}
        />
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text
            variant="bodyMedium"
            style={styles.itemName}
            numberOfLines={1}
          >
            {item.itemName}
          </Text>
          <Text variant="labelSmall" style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>

        <View style={styles.activityMeta}>
          <View style={styles.actionBadge}>
            <Text
              variant="labelSmall"
              style={[styles.actionLabel, { color: getActivityColor(item.type) }]}
            >
              {getActivityLabel(item.type)}
            </Text>
          </View>
          <View style={styles.itemTypeBadge}>
            <Icon
              name={getItemTypeIcon(item.itemType)}
              size={12}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="labelSmall" style={styles.itemTypeLabel}>
              {item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    if (activities.length === 0) {
      return (
        <EmptyState
          icon="history"
          title="No Recent Activity"
          message="Planning activities will appear here as you work"
          variant="compact"
        />
      );
    }

    return (
      <FlatList
        data={activities.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderActivity}
        scrollEnabled={false}
        accessible
        accessibilityLabel={`Recent activities, ${activities.length} items`}
      />
    );
  };

  return (
    <BaseWidget
      title="Recent Activities"
      icon="history"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel={`Recent Activities widget, ${activities.length} activities`}
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  timestamp: {
    opacity: 0.6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  actionLabel: {
    fontWeight: '600',
  },
  itemTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemTypeLabel: {
    opacity: 0.7,
  },
});

const RecentActivitiesWidgetMemo = React.memo(RecentActivitiesWidget);
export { RecentActivitiesWidgetMemo as RecentActivitiesWidget };
export default RecentActivitiesWidgetMemo;
