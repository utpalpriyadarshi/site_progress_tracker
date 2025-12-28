import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SummaryCard } from './SummaryCard';
import { formatCurrency } from '../utils';

interface HeaderSectionProps {
  projectName: string;
  totalBudgets: number;
  totalCosts: number;
  totalVariance: number;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  projectName,
  totalBudgets,
  totalCosts,
  totalVariance,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.projectName}>{projectName}</Text>
      <View style={styles.summaryContainer}>
        <SummaryCard label="Total Budget" value={formatCurrency(totalBudgets)} />
        <SummaryCard label="Total Costs" value={formatCurrency(totalCosts)} />
        <SummaryCard
          label="Remaining"
          value={formatCurrency(Math.abs(totalVariance))}
          isOverBudget={totalVariance < 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
