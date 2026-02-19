import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportCard } from './ReportCard';
import { COLORS } from '../../../theme/colors';

interface InvoicesSummaryCardProps {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

export const InvoicesSummaryCard: React.FC<InvoicesSummaryCardProps> = ({
  total,
  paid,
  pending,
  overdue,
}) => {
  return (
    <ReportCard>
      <Text style={styles.sectionTitle}>Invoices Summary</Text>
      <View style={styles.container}>
        <View style={styles.item}>
          <Text style={styles.value}>{total}</Text>
          <Text style={styles.label}>Total Invoices</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, styles.positive]}>{paid}</Text>
          <Text style={styles.label}>Paid</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, styles.warning]}>{pending}</Text>
          <Text style={styles.label}>Pending</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, styles.negative]}>{overdue}</Text>
          <Text style={styles.label}>Overdue</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  positive: {
    color: COLORS.SUCCESS,
  },
  warning: {
    color: '#FFA500',
  },
  negative: {
    color: '#ff6b6b',
  },
});
