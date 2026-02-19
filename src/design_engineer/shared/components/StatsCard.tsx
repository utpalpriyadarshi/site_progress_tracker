/**
 * StatsCard Component
 *
 * Reusable statistics card for displaying dashboard metrics.
 * Supports icons, trend indicators, and compact layouts.
 *
 * @example
 * ```tsx
 * // Default variant with all features
 * <StatsCard
 *   title="Pending RFQs"
 *   value={15}
 *   subtitle="This week"
 *   icon="file-document-outline"
 *   trend={{ value: 12, direction: 'up' }}
 *   onPress={handleViewRfqs}
 *   color={COLORS.INFO}
 * />
 *
 * // Compact variant
 * <StatsCard
 *   title="Total Packages"
 *   value={45}
 *   variant="compact"
 *   color={COLORS.SUCCESS}
 * />
 * ```
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StatsCardProps } from '../types';
import { COLORS } from '../../../theme/colors';

/**
 * Get trend icon based on direction
 */
const getTrendIcon = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return 'trending-up';
    case 'down':
      return 'trending-down';
    case 'neutral':
      return 'trending-neutral';
    default:
      return 'trending-neutral';
  }
};

/**
 * Get trend color based on direction
 */
const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return COLORS.SUCCESS;
    case 'down':
      return COLORS.ERROR;
    case 'neutral':
      return COLORS.DISABLED;
    default:
      return COLORS.DISABLED;
  }
};

/**
 * StatsCard Component
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  onPress,
  variant = 'default',
  color = '#007AFF',
  style,
}) => {
  const isCompact = variant === 'compact';

  const cardContent = (
    <>
      {/* Icon - Only in default variant */}
      {icon && !isCompact && (
        <View style={styles.iconContainer}>
          <Icon name={icon} size={32} color={color} />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
        <Text style={[styles.value, { color }, isCompact && styles.valueCompact]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        {subtitle && <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>{subtitle}</Text>}
      </View>

      {/* Trend Indicator - Only in default variant */}
      {trend && !isCompact && (
        <View style={styles.trendContainer}>
          <Icon
            name={getTrendIcon(trend.direction)}
            size={24}
            color={getTrendColor(trend.direction)}
          />
          <Text style={[styles.trendValue, { color: getTrendColor(trend.direction) }]}>
            {trend.value}%
          </Text>
        </View>
      )}

      {/* Compact icon - Small icon in top right */}
      {icon && isCompact && (
        <View style={styles.compactIcon}>
          <Icon name={icon} size={20} color={color} />
        </View>
      )}
    </>
  );

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.flex, style]}>
        <Card style={[styles.card, isCompact && styles.cardCompact]}>
          <Card.Content style={[styles.cardContent, isCompact && styles.cardContentCompact]}>
            {cardContent}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  // Otherwise, render normal card
  return (
    <View style={[styles.flex, style]}>
      <Card style={[styles.card, isCompact && styles.cardCompact]}>
        <Card.Content style={[styles.cardContent, isCompact && styles.cardContentCompact]}>
          {cardContent}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    elevation: 2,
    height: '100%',
  },
  cardCompact: {
    minHeight: 100,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  cardContentCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minHeight: 80,
    position: 'relative',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  valueCompact: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
  },
  subtitleCompact: {
    fontSize: 10,
  },
  trendContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  compactIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

export default StatsCard;
