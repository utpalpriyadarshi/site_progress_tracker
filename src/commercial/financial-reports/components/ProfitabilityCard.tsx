import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import { ReportCard } from './ReportCard';
import { COLORS } from '../../../theme/colors';

interface ProfitabilityCardProps {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  profitMargin: number;
}

export const ProfitabilityCard: React.FC<ProfitabilityCardProps> = ({
  totalBudget,
  totalSpent,
  remaining,
  profitMargin,
}) => {
  return (
    <ReportCard>
      <Text style={styles.sectionTitle}>Profitability Overview</Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Budget:</Text>
          <Text style={styles.value}>${totalBudget.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Spent:</Text>
          <Text style={styles.value}>${totalSpent.toLocaleString()}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.labelBold}>Remaining:</Text>
          <Text style={[styles.valueBold, remaining < 0 && styles.negative]}>
            ${Math.abs(remaining).toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.labelBold}>Profit Margin:</Text>
          <Text style={[styles.valueBold, profitMargin < 0 && styles.negative]}>
            {profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>
    </ReportCard>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  container: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  labelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  valueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  divider: {
    marginVertical: 12,
  },
  negative: {
    color: '#ff6b6b',
  },
});
