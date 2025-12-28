import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Divider } from 'react-native-paper';
import { ReportCard } from './ReportCard';

interface CashFlowCardProps {
  totalRevenue: number;
  totalCosts: number;
  netCashFlow: number;
}

export const CashFlowCard: React.FC<CashFlowCardProps> = ({
  totalRevenue,
  totalCosts,
  netCashFlow,
}) => {
  return (
    <ReportCard>
      <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Revenue (Paid Invoices):</Text>
          <Text style={[styles.value, styles.positive]}>
            ${totalRevenue.toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Costs:</Text>
          <Text style={styles.value}>${totalCosts.toLocaleString()}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.labelBold}>Net Cash Flow:</Text>
          <Text
            style={[
              styles.valueBold,
              netCashFlow >= 0 ? styles.positive : styles.negative,
            ]}
          >
            ${Math.abs(netCashFlow).toLocaleString()}
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
  },
  divider: {
    marginVertical: 12,
  },
  positive: {
    color: '#4CAF50',
  },
  negative: {
    color: '#ff6b6b',
  },
});
