import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { InventoryStats } from '../hooks/useInventoryStats';
import { formatCurrencyM } from '../utils';

interface StatCardsProps {
  stats: InventoryStats;
}

/**
 * StatCards Component
 *
 * Horizontal scrollable cards displaying inventory statistics.
 * Shows total items, value, stock levels, and ABC categories.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 3.
 */
export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const cards = [
    {
      value: stats.totalItems.toString(),
      label: 'Total Items',
      color: '#3b82f6',
    },
    {
      value: formatCurrencyM(stats.totalValue),
      label: 'Total Value',
      color: '#10b981',
    },
    {
      value: stats.lowStock.toString(),
      label: 'Low Stock',
      color: '#f59e0b',
    },
    {
      value: stats.outOfStock.toString(),
      label: 'Out of Stock',
      color: '#ef4444',
    },
    {
      value: stats.overstocked.toString(),
      label: 'Overstocked',
      color: '#3b82f6',
    },
    {
      value: stats.categoryA.toString(),
      label: 'Category A',
      color: '#dc2626',
    },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {cards.map((card, index) => (
        <View key={index} style={styles.card}>
          <Text style={[styles.value, { color: card.color }]}>{card.value}</Text>
          <Text style={styles.label}>{card.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
