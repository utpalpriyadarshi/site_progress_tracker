import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * MetricCard Component
 *
 * Displays a single KPI metric with icon, value, and optional trend
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 */

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  loading = false,
  onPress,
}) => {
  if (loading) {
    return <MetricCardSkeleton />;
  }

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Icon name={icon} size={24} color={color} />
          {trend && (
            <View style={[styles.trend, { backgroundColor: color + '20' }]}>
              <Icon
                name={trend.direction === 'up' ? 'arrow-upward' : 'arrow-downward'}
                size={12}
                color={color}
              />
              <Text style={[styles.trendText, { color }]}>{trend.value}%</Text>
            </View>
          )}
        </View>
        <Text variant="displaySmall" style={styles.value}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={styles.title}>
          {title}
        </Text>
      </Card.Content>
    </Card>
  );
};

const MetricCardSkeleton: React.FC = () => {
  // Reuse Phase 2 skeleton pattern
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={[styles.skeleton, styles.iconSkeleton]} />
        <View style={[styles.skeleton, styles.valueSkeleton]} />
        <View style={[styles.skeleton, styles.titleSkeleton]} />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  title: {
    color: '#666',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    marginBottom: 8,
  },
  valueSkeleton: {
    width: '60%',
    height: 32,
    marginVertical: 4,
  },
  titleSkeleton: {
    width: '80%',
    height: 14,
  },
});
