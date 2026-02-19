import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { COLORS } from '../../../theme/colors';

/**
 * UserActivityWidget Component
 *
 * Displays user activity metrics including:
 * - Active users count
 * - Recent logins
 * - New users this week
 * - Role distribution
 */

export interface RoleDistribution {
  role: string;
  count: number;
  color: string;
}

export interface UserActivityData {
  activeUsers: number;
  totalUsers: number;
  newUsersThisWeek: number;
  recentLogins: number; // Last 24 hours
  roleDistribution: RoleDistribution[];
}

export interface UserActivityWidgetProps {
  /** User activity data */
  data: UserActivityData;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  admin: COLORS.STATUS_EVALUATED,
  manager: COLORS.INFO,
  supervisor: COLORS.SUCCESS,
  commercial: COLORS.WARNING,
  logistics: '#00BCD4',
  planning: '#E91E63',
  design_engineer: '#795548',
  default: COLORS.DISABLED,
};

export const UserActivityWidget: React.FC<UserActivityWidgetProps> = ({
  data,
  onPress,
  loading = false,
  error = null,
}) => {
  const isEmpty = data.totalUsers === 0;

  const accessibilityLabel = useMemo(() => {
    if (isEmpty) return 'User Activity widget, no users';
    const parts = [
      `User Activity`,
      `${data.activeUsers} of ${data.totalUsers} users active`,
      `${data.recentLogins} logins in last 24 hours`,
      `${data.newUsersThisWeek} new users this week`,
    ];
    return parts.join('. ');
  }, [data, isEmpty]);

  const activePercentage = data.totalUsers > 0
    ? Math.round((data.activeUsers / data.totalUsers) * 100)
    : 0;

  const renderRoleBar = () => {
    // Filter out invalid role entries
    const validRoles = data.roleDistribution.filter(r => r && r.role && typeof r.role === 'string');
    const total = validRoles.reduce((sum, r) => sum + r.count, 0);
    if (total === 0) return null;

    return (
      <View style={styles.roleBarContainer}>
        <View style={styles.roleBar}>
          {validRoles.map((role) => {
            const width = (role.count / total) * 100;
            if (width === 0) return null;
            return (
              <View
                key={role.role}
                style={[
                  styles.roleSegment,
                  {
                    width: `${width}%`,
                    backgroundColor: ROLE_COLORS[role.role] || ROLE_COLORS.default,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.roleLegend}>
          {validRoles.slice(0, 4).map((role) => (
            <View key={role.role} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: ROLE_COLORS[role.role] || ROLE_COLORS.default },
                ]}
              />
              <Text style={styles.legendText}>
                {role.role.replace('_', ' ')} ({role.count})
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <BaseWidget
      title="User Activity"
      subtitle={`${data.activeUsers} active users`}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No users in the system"
      emptyIcon="👥"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to manage users"
    >
      <View style={styles.content}>
        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.recentLogins}</Text>
            <Text style={styles.metricLabel}>Logins (24h)</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{data.newUsersThisWeek}</Text>
            <Text style={styles.metricLabel}>New (7d)</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: COLORS.SUCCESS }]}>
              {activePercentage}%
            </Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
        </View>

        {/* Role Distribution */}
        {renderRoleBar()}
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f0f0f0',
  },
  roleBarContainer: {
    marginTop: 4,
  },
  roleBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  roleSegment: {
    height: '100%',
  },
  roleLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    textTransform: 'capitalize',
  },
});
