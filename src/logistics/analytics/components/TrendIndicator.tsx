/**
 * TrendIndicator Component
 *
 * Visual indicator for trend direction (increasing, decreasing, stable, volatile)
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../theme/colors';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: number;
  showValue?: boolean;
  style?: ViewStyle;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  direction,
  value,
  showValue = false,
  style,
}) => {
  const backgroundColor = getTrendColor(direction);
  const iconName = getTrendIcon(direction);

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Icon name={iconName} size={16} color="#FFF" />
      {showValue && value !== undefined && (
        <Text style={styles.value}>{value.toFixed(1)}%</Text>
      )}
    </View>
  );
};

const getTrendColor = (direction: TrendDirection): string => {
  switch (direction) {
    case 'increasing':
      return '#FF6B6B';
    case 'decreasing':
      return COLORS.SUCCESS;
    case 'stable':
      return COLORS.INFO;
    case 'volatile':
      return COLORS.WARNING;
    default:
      return '#999';
  }
};

const getTrendIcon = (direction: TrendDirection): string => {
  switch (direction) {
    case 'increasing':
      return 'trending-up';
    case 'decreasing':
      return 'trending-down';
    case 'stable':
      return 'trending-flat';
    case 'volatile':
      return 'show-chart';
    default:
      return 'trending-flat';
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  value: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 4,
  },
});
