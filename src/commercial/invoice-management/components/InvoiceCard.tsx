import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, Button } from 'react-native-paper';
import { Invoice } from '../hooks';
import { StatusChip } from './StatusChip';
import { COLORS } from '../../../theme/colors';
import { formatCurrencySmart } from '../../../utils/currencyFormatter';

interface InvoiceCardProps {
  invoice: Invoice;
  onMarkPaid: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onMarkPaid,
  onEdit,
  onDelete,
}) => {
  const isOverdue = invoice.paymentStatus === 'overdue';
  const isPaid = invoice.paymentStatus === 'paid';

  return (
    <Card mode="elevated" style={styles.invoiceCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
            <Text style={styles.vendorName}>{invoice.vendorName}</Text>
          </View>
          <StatusChip status={invoice.paymentStatus} />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{formatCurrencySmart(invoice.amount)}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>PO #:</Text>
            <Text style={styles.detailValue}>{invoice.poId}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Invoice Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </Text>
          </View>

          {invoice.paymentDate && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Payment Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(invoice.paymentDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {isOverdue && (
            <Chip mode="flat" style={styles.overdueChip} textStyle={styles.overdueChipText}>
              ⚠️ OVERDUE
            </Chip>
          )}
        </View>

        <View style={styles.cardActions}>
          {!isPaid && (
            <Button
              mode="text"
              onPress={() => onMarkPaid(invoice)}
              compact
              textColor={COLORS.SUCCESS}
            >
              Mark Paid
            </Button>
          )}
          <Button mode="text" onPress={() => onEdit(invoice)} compact textColor="#007AFF">
            Edit
          </Button>
          <Button mode="text" onPress={() => onDelete(invoice)} compact textColor="#ff6b6b">
            Delete
          </Button>
        </View>

        <Text style={styles.timestamp}>
          Created: {new Date(invoice.createdAt).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  invoiceCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vendorName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  overdueChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginTop: 4,
  },
  overdueChipText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
