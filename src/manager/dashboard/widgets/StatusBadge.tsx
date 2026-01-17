/**
 * StatusBadge Component
 *
 * Custom status badge using View+Text instead of react-native-paper Chip.
 * This avoids text clipping issues that occur with Chip component.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

// ==================== Types ====================

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default' | 'delayed' | 'on_track' | 'at_risk';

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
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  on_track: { bg: '#E8F5E9', text: '#2E7D32' },
  warning: { bg: '#FFF3E0', text: '#E65100' },
  at_risk: { bg: '#FFF3E0', text: '#E65100' },
  error: { bg: '#FFEBEE', text: '#C62828' },
  delayed: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
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
