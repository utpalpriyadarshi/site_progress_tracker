import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InventoryStatus } from '../../../services/InventoryOptimizationService';
import { getStatusColor, STATUS_LABELS } from '../utils';

interface StockLevelBadgeProps {
  status: InventoryStatus;
  size?: 'small' | 'medium' | 'large';
}

/**
 * StockLevelBadge Component
 *
 * Color-coded badge displaying inventory status.
 * Supports different sizes for various contexts.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 3.
 */
export const StockLevelBadge: React.FC<StockLevelBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const backgroundColor = getStatusColor(status);
  const label = STATUS_LABELS[status] || status.toUpperCase();

  const badgeStyle = [
    styles.badge,
    { backgroundColor },
    size === 'small' && styles.badgeSmall,
    size === 'large' && styles.badgeLarge,
  ];

  const textStyle = [
    styles.text,
    size === 'small' && styles.textSmall,
    size === 'large' && styles.textLarge,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeLarge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 12,
  },
});
