import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';

/**
 * QuickStatsWidget Component
 *
 * Displays quick statistics with navigation:
 * - Total Projects
 * - Total Sites
 * - Total Users
 * - Total Items
 */

export interface QuickStatsData {
  totalProjects: number;
  totalSites: number;
  totalUsers: number;
  totalItems: number;
}

export interface QuickStatsWidgetProps {
  /** Stats data */
  stats: QuickStatsData;
  /** Handler for project stat tap */
  onProjectsPress?: () => void;
  /** Handler for users stat tap */
  onUsersPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

interface StatItemProps {
  value: number;
  label: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, icon, color, onPress }) => {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? {
        onPress,
        activeOpacity: 0.7,
        accessibilityRole: 'button' as const,
        accessibilityLabel: `${label}: ${value}. Tap to manage.`,
      }
    : {
        accessibilityLabel: `${label}: ${value}`,
      };

  return (
    <Container style={styles.statItem} {...containerProps}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {onPress && <Text style={styles.tapHint}>Tap to manage</Text>}
    </Container>
  );
};

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  stats,
  onProjectsPress,
  onUsersPress,
  loading = false,
  error = null,
}) => {
  const isEmpty =
    stats.totalProjects === 0 &&
    stats.totalSites === 0 &&
    stats.totalUsers === 0 &&
    stats.totalItems === 0;

  const accessibilityLabel = useMemo(() => {
    const parts = [
      'Quick Statistics',
      `${stats.totalProjects} projects`,
      `${stats.totalSites} sites`,
      `${stats.totalUsers} users`,
      `${stats.totalItems} items`,
    ];
    return parts.join('. ');
  }, [stats]);

  return (
    <BaseWidget
      title="Quick Stats"
      subtitle="System overview"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No data in the system yet"
      emptyIcon="📈"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.content}>
        <View style={styles.statsRow}>
          <StatItem
            value={stats.totalProjects}
            label="Projects"
            icon="📁"
            color="#2196F3"
            onPress={onProjectsPress}
          />
          <StatItem
            value={stats.totalSites}
            label="Sites"
            icon="🏗️"
            color="#4CAF50"
          />
        </View>
        <View style={styles.statsRow}>
          <StatItem
            value={stats.totalUsers}
            label="Users"
            icon="👤"
            color="#9C27B0"
            onPress={onUsersPress}
          />
          <StatItem
            value={stats.totalItems}
            label="Items"
            icon="📋"
            color="#FF9800"
          />
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tapHint: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 4,
  },
});
