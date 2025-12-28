/**
 * Badge Component
 *
 * Small colored badge for displaying status, severity, effort levels, etc.
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

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
      return '#4CAF50';
    case 'warning':
      return '#FF9800';
    case 'error':
      return '#FF6B6B';
    case 'info':
      return '#2196F3';
    case 'primary':
      return '#2196F3';
    case 'secondary':
      return '#9E9E9E';
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
