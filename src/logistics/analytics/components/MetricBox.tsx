/**
 * MetricBox Component
 *
 * Small box for displaying a metric label and value
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface MetricBoxProps {
  label: string;
  value?: string | number;
  valueColor?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const MetricBox: React.FC<MetricBoxProps> = ({
  label,
  value,
  valueColor = '#212121',
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {children ? (
        children
      ) : (
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
});
