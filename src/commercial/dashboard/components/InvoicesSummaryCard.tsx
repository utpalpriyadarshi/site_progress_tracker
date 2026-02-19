import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { InvoicesSummary } from '../utils';
import { COLORS } from '../../../theme/colors';

interface InvoicesSummaryCardProps {
  invoicesSummary: InvoicesSummary;
}

export const InvoicesSummaryCard: React.FC<InvoicesSummaryCardProps> = ({ invoicesSummary }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Invoices Overview</Text>
        <View style={styles.invoicesSummaryContainer}>
          <View style={styles.invoiceItem}>
            <Text style={styles.invoiceCount}>{invoicesSummary.total}</Text>
            <Text style={styles.invoiceLabel}>Total</Text>
          </View>
          <View style={styles.invoiceItem}>
            <Text style={[styles.invoiceCount, styles.positiveValue]}>
              {invoicesSummary.paid}
            </Text>
            <Text style={styles.invoiceLabel}>Paid</Text>
            <Text style={styles.invoiceAmount}>
              ${invoicesSummary.totalPaid.toLocaleString()}
            </Text>
          </View>
          <View style={styles.invoiceItem}>
            <Text style={[styles.invoiceCount, { color: '#FFA500' }]}>
              {invoicesSummary.pending}
            </Text>
            <Text style={styles.invoiceLabel}>Pending</Text>
            <Text style={styles.invoiceAmount}>
              ${invoicesSummary.totalPending.toLocaleString()}
            </Text>
          </View>
          <View style={styles.invoiceItem}>
            <Text style={[styles.invoiceCount, styles.negativeValue]}>
              {invoicesSummary.overdue}
            </Text>
            <Text style={styles.invoiceLabel}>Overdue</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  invoicesSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  invoiceItem: {
    alignItems: 'center',
  },
  invoiceCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  invoiceAmount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  positiveValue: {
    color: COLORS.SUCCESS,
  },
  negativeValue: {
    color: '#ff6b6b',
  },
});
