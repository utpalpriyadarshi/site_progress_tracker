/**
 * Badge Component
 *
 * Small colored badge for displaying status, severity, effort levels, etc.
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../../theme/colors';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'primary'
  | 'secondary';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  backgroundColor,
  style,
}) => {
  const bgColor = backgroundColor || getVariantColor(variant);

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const getVariantColor = (variant: BadgeVariant): string => {
  switch (variant) {
    case 'success':
      return COLORS.SUCCESS;
    case 'warning':
      return COLORS.WARNING;
    case 'error':
      return '#FF6B6B';
    case 'info':
      return COLORS.INFO;
    case 'primary':
      return COLORS.INFO;
    case 'secondary':
      return COLORS.DISABLED;
    default:
      return '#999';
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
});
