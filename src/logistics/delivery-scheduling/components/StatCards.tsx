/**
 * StatCards Component
 *
 * Scrollable statistics cards for delivery overview
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DeliveryStatistics } from '../hooks/useDeliveryData';

interface StatCardsProps {
  stats: DeliveryStatistics;
}

interface StatItem {
  label: string;
  value: number;
  color?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const statItems: StatItem[] = [
    { label: 'Total', value: stats.total },
    { label: 'Scheduled', value: stats.scheduled, color: '#f59e0b' },
    { label: 'In Transit', value: stats.inTransit, color: '#3b82f6' },
    { label: 'Delivered', value: stats.delivered, color: '#10b981' },
    { label: 'Delayed', value: stats.delayed, color: '#ef4444' },
    { label: 'Critical', value: stats.critical, color: '#dc2626' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {statItems.map((item, index) => (
        <View key={index} style={styles.card}>
          <Text style={[styles.value, item.color && { color: item.color }]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  card: {
    marginLeft: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
