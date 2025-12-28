/**
 * AnalyticsCard Component
 *
 * Reusable card container for analytics content with consistent styling
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface AnalyticsCardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
});
