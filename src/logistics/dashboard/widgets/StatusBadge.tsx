/**
 * StatusBadge Component
 *
 * Custom status badge using View+Text instead of react-native-paper Chip.
 * This avoids text clipping issues that occur with Chip component.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default'
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'approved'
  | 'rejected';

export interface StatusBadgeProps {
  /** Status type that determines the badge color */
  status: StatusType;
  /** Label text to display */
  label: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional custom style */
  style?: object;
}

// ==================== Constants ====================

const STATUS_COLORS: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: COLORS.SUCCESS_BG, text: '#2E7D32' },
  in_stock: { bg: COLORS.SUCCESS_BG, text: '#2E7D32' },
  delivered: { bg: COLORS.SUCCESS_BG, text: '#2E7D32' },
  approved: { bg: COLORS.SUCCESS_BG, text: '#2E7D32' },
  warning: { bg: COLORS.WARNING_BG, text: '#E65100' },
  low_stock: { bg: COLORS.WARNING_BG, text: '#E65100' },
  in_transit: { bg: COLORS.WARNING_BG, text: '#E65100' },
  pending: { bg: COLORS.WARNING_BG, text: '#E65100' },
  error: { bg: COLORS.ERROR_BG, text: '#C62828' },
  out_of_stock: { bg: COLORS.ERROR_BG, text: '#C62828' },
  rejected: { bg: COLORS.ERROR_BG, text: '#C62828' },
  info: { bg: COLORS.INFO_BG, text: '#1565C0' },
  default: { bg: '#F5F5F5', text: '#616161' },
};

const SIZE_STYLES = {
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    minHeight: 20,
  },
  medium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    minHeight: 24,
  },
  large: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    fontSize: 14,
    minHeight: 28,
  },
};

// ==================== Component ====================

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
  style,
}) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.default;
  const sizeStyle = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          paddingVertical: sizeStyle.paddingVertical,
          minHeight: sizeStyle.minHeight,
        },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: sizeStyle.fontSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StatusBadge;
