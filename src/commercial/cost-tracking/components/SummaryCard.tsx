import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
  label: string;
  value: string;
  isOverBudget?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, isOverBudget }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isOverBudget && styles.overBudget]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  overBudget: {
    color: '#ff6b6b',
  },
});
