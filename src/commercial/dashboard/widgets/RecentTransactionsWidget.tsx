import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { COLORS } from '../../../theme/colors';

/**
 * RecentTransactionsWidget Component
 *
 * Displays recent financial transactions with:
 * - List of last 5 transactions (costs + invoices)
 * - Type indicator (cost/invoice)
 * - Quick action buttons
 * - "View All" link
 *
 * @example
 * ```tsx
 * <RecentTransactionsWidget
 *   transactions={[
 *     { id: '1', type: 'cost', description: 'Materials', amount: 5000, date: Date.now(), category: 'material' },
 *     { id: '2', type: 'invoice', description: 'Invoice #123', amount: 15000, date: Date.now(), status: 'pending' },
 *   ]}
 *   onPress={() => navigation.navigate('CostTracking')}
 *   onTransactionPress={(tx) => handleTransactionPress(tx)}
 * />
 * ```
 */

export type TransactionType = 'cost' | 'invoice';

export interface Transaction {
  /** Unique identifier */
  id: string;
  /** Transaction type */
  type: TransactionType;
  /** Description or title */
  description: string;
  /** Amount */
  amount: number;
  /** Timestamp */
  date: number;
  /** Category (for costs) */
  category?: string;
  /** Status (for invoices) */
  status?: 'pending' | 'paid' | 'overdue';
}

export interface RecentTransactionsWidgetProps {
  /** List of recent transactions */
  transactions: Transaction[];
  /** Maximum transactions to display */
  maxItems?: number;
  /** Handler for widget tap ("View All") */
  onPress?: () => void;
  /** Handler for transaction tap */
  onTransactionPress?: (transaction: Transaction) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
}

const TYPE_CONFIG = {
  cost: {
    icon: '💸',
    color: '#ff6b6b',
    label: 'Cost',
  },
  invoice: {
    icon: '📄',
    color: COLORS.INFO,
    label: 'Invoice',
  },
};

const STATUS_CONFIG = {
  pending: { color: COLORS.WARNING, label: 'Pending' },
  paid: { color: COLORS.SUCCESS, label: 'Paid' },
  overdue: { color: '#ff6b6b', label: 'Overdue' },
};

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  maxItems = 5,
  onPress,
  onTransactionPress,
  loading = false,
  error = null,
}) => {
  // Sort by date (most recent first) and limit
  const displayTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, maxItems);
  }, [transactions, maxItems]);

  const isEmpty = transactions.length === 0;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const accessibilityLabel = useMemo(() => {
    if (isEmpty) return 'Recent transactions widget, no transactions';

    return `Recent transactions, showing ${displayTransactions.length} items`;
  }, [isEmpty, displayTransactions.length]);

  const renderTransaction = (transaction: Transaction, index: number) => {
    const { id, type, description, amount, date, category, status } = transaction;
    const config = TYPE_CONFIG[type];

    const isClickable = !!onTransactionPress;

    const content = (
      <View style={[styles.transactionItem, index > 0 && styles.transactionBorder]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.topRow}>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
            <Text style={[styles.amount, type === 'cost' && styles.costAmount]}>
              {type === 'cost' ? '-' : ''}
              {formatCurrency(amount)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.metaRow}>
              <Text style={[styles.typeBadge, { color: config.color }]}>
                {config.label}
              </Text>
              {category && (
                <Text style={styles.category}> · {category}</Text>
              )}
              {status && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_CONFIG[status].color + '20' },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: STATUS_CONFIG[status].color }]}
                  >
                    {STATUS_CONFIG[status].label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(date)}</Text>
          </View>
        </View>
      </View>
    );

    if (isClickable) {
      return (
        <TouchableOpacity
          key={id}
          onPress={() => onTransactionPress(transaction)}
          accessibilityRole="button"
          accessibilityLabel={`${config.label}: ${description}, ${formatCurrency(amount)}, ${formatDate(date)}. Tap to view details.`}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return <View key={id}>{content}</View>;
  };

  return (
    <BaseWidget
      title="Recent Transactions"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No transactions recorded yet"
      emptyIcon="📋"
      accessibilityLabel={accessibilityLabel}
      headerRight={
        transactions.length > maxItems && onPress ? (
          <TouchableOpacity
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="View all transactions"
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        ) : null
      }
    >
      <View style={styles.content}>
        {displayTransactions.map((tx, index) => renderTransaction(tx, index))}

        {/* View All Button (at bottom) */}
        {transactions.length > 0 && onPress && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="View all transactions"
          >
            <Text style={styles.viewAllButtonText}>View All Transactions</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {},
  viewAllText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  transactionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  detailsContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  description: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  costAmount: {
    color: '#ff6b6b',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  category: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
});
