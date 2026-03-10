/**
 * InvoiceCard - Shared Component
 * Reusable invoice card with multiple variants and configurable actions
 *
 * Features:
 * - Status badge with color coding
 * - Payment progress indicator
 * - Due date with overdue warning
 * - Multiple variants (default, compact, detailed)
 * - Configurable action buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Button, ProgressBar } from 'react-native-paper';
import type { InvoiceCardProps } from '../types';
import { COLORS } from '../../../theme/colors';

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onPress,
  onEdit,
  onDelete,
  onMarkPaid,
  showActions = true,
  variant = 'default',
}) => {
  const isOverdue = invoice.paymentStatus === 'overdue';
  const isPaid = invoice.paymentStatus === 'paid';
  const isPending = invoice.paymentStatus === 'pending';

  // Calculate payment progress
  const paidAmount = invoice.paidAmount || 0;
  const paymentProgress = invoice.amount > 0 ? paidAmount / invoice.amount : 0;

  // Get status color
  const getStatusColor = () => {
    switch (invoice.paymentStatus) {
      case 'paid':
        return COLORS.SUCCESS;
      case 'overdue':
        return '#f44336';
      case 'pending':
        return '#FFA726';
      default:
        return COLORS.DISABLED;
    }
  };

  // Get status label
  const getStatusLabel = () => {
    return invoice.paymentStatus.toUpperCase();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(invoice) : undefined}>
        <Card.Content>
          <View style={styles.compactHeader}>
            <View style={styles.compactInfo}>
              <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
              <Text style={styles.vendorNameCompact}>{invoice.vendorName}</Text>
            </View>
            <View style={styles.compactRight}>
              <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
                textStyle={[styles.statusText, { color: getStatusColor() }]}
                compact
              >
                {getStatusLabel()}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(invoice) : undefined}>
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
              <Text style={styles.vendorName}>{invoice.vendorName}</Text>
              <Text style={styles.poId}>PO: {invoice.poId}</Text>
            </View>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
              textStyle={[styles.statusText, { color: getStatusColor() }]}
            >
              {getStatusLabel()}
            </Chip>
          </View>

          {/* Details Section */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValueLarge}>{formatCurrency(invoice.amount)}</Text>
            </View>

            {paidAmount > 0 && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid:</Text>
                  <Text style={[styles.detailValue, { color: COLORS.SUCCESS }]}>
                    {formatCurrency(paidAmount)}
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={paymentProgress}
                    color={COLORS.SUCCESS}
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>{(paymentProgress * 100).toFixed(0)}% paid</Text>
                </View>
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.invoiceDate)}</Text>
            </View>

            {invoice.paymentDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Date:</Text>
                <Text style={styles.detailValue}>{formatDate(invoice.paymentDate)}</Text>
              </View>
            )}

            {invoice.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.detailLabel}>Notes:</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </View>
            )}

            {isOverdue && (
              <Chip mode="flat" style={styles.overdueChip} textStyle={styles.overdueText}>
                ⚠️ OVERDUE
              </Chip>
            )}
          </View>

          {/* Actions */}
          {showActions && (
            <View style={styles.actions}>
              {!isPaid && onMarkPaid && (
                <Button mode="text" onPress={() => onMarkPaid(invoice)} textColor={COLORS.SUCCESS} compact>
                  Mark Paid
                </Button>
              )}
              {onEdit && (
                <Button mode="text" onPress={() => onEdit(invoice)} textColor="#007AFF" compact>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button mode="text" onPress={() => onDelete(invoice)} textColor="#f44336" compact>
                  Delete
                </Button>
              )}
            </View>
          )}

          <Text style={styles.timestamp}>Created: {formatDate(invoice.createdAt)}</Text>
        </Card.Content>
      </Card>
    );
  }

  // Render default variant
  return (
    <Card mode="elevated" style={styles.card} onPress={onPress ? () => onPress(invoice) : undefined}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
            <Text style={styles.vendorName}>{invoice.vendorName}</Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
            textStyle={[styles.statusText, { color: getStatusColor() }]}
          >
            {getStatusLabel()}
          </Chip>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{formatCurrency(invoice.amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO #:</Text>
            <Text style={styles.detailValue}>{invoice.poId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Date:</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.invoiceDate)}</Text>
          </View>

          {invoice.paymentDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.paymentDate)}</Text>
            </View>
          )}

          {isOverdue && (
            <Chip mode="flat" style={styles.overdueChip} textStyle={styles.overdueText}>
              ⚠️ OVERDUE
            </Chip>
          )}
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {!isPaid && onMarkPaid && (
              <Button mode="text" onPress={() => onMarkPaid(invoice)} textColor={COLORS.SUCCESS} compact>
                Mark Paid
              </Button>
            )}
            {onEdit && (
              <Button mode="text" onPress={() => onEdit(invoice)} textColor="#007AFF" compact>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button mode="text" onPress={() => onDelete(invoice)} textColor="#f44336" compact>
                Delete
              </Button>
            )}
          </View>
        )}

        <Text style={styles.timestamp}>Created: {formatDate(invoice.createdAt)}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactRight: {
    alignItems: 'flex-end',
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
  vendorNameCompact: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  poId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailRow: {
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
    fontWeight: '600',
    color: '#333',
  },
  detailValueLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  overdueChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginTop: 8,
  },
  overdueText: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
