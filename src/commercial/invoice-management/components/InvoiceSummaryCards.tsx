import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrencySmart } from '../../../utils/currencyFormatter';

interface InvoiceSummaryCardsProps {
  totalInvoices: number;
  totalAmount: number;
  pendingAmount: number;
  overdueCount: number;
}

export const InvoiceSummaryCards: React.FC<InvoiceSummaryCardsProps> = ({
  totalInvoices,
  totalAmount,
  pendingAmount,
  overdueCount,
}) => {
  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Invoices</Text>
        <Text style={styles.summaryValue}>{totalInvoices}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Amount</Text>
        <Text style={styles.summaryValue}>{formatCurrencySmart(totalAmount)}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Pending</Text>
        <Text style={[styles.summaryValue, { color: '#FFA500' }]}>
          {formatCurrencySmart(pendingAmount)}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Overdue</Text>
        <Text style={[styles.summaryValue, { color: '#ff6b6b' }]}>{overdueCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
