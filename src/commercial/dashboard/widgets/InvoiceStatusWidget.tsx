import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { COLORS } from '../../../theme/colors';
import { formatCurrencySmart } from '../../../utils/currencyFormatter';

/**
 * InvoiceStatusWidget Component
 *
 * Displays invoice status breakdown with:
 * - Stacked bar showing pending/paid/overdue
 * - Count badges for each status
 * - Overdue alert indicator
 * - Tap to navigate to InvoiceManagement screen
 * - Accessibility label with status breakdown
 *
 * @example
 * ```tsx
 * <InvoiceStatusWidget
 *   total={25}
 *   pending={10}
 *   paid={12}
 *   overdue={3}
 *   totalPending={50000}
 *   totalPaid={120000}
 *   onPress={() => navigation.navigate('InvoiceManagement')}
 *   onStatusPress={(status) => navigation.navigate('InvoiceManagement', { filter: status })}
 * />
 * ```
 */

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface InvoiceStatusWidgetProps {
  /** Total number of invoices */
  total: number;
  /** Number of pending invoices */
  pending: number;
  /** Number of paid invoices */
  paid: number;
  /** Number of overdue invoices */
  overdue: number;
  /** Total pending amount */
  totalPending?: number;
  /** Total paid amount */
  totalPaid?: number;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Handler for status tap (to filter by status) */
  onStatusPress?: (status: InvoiceStatus) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Period label */
  periodLabel?: string;
}

const STATUS_COLORS = {
  pending: COLORS.WARNING,
  paid: COLORS.SUCCESS,
  overdue: '#ff6b6b',
};

const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const InvoiceStatusWidget: React.FC<InvoiceStatusWidgetProps> = ({
  total,
  pending,
  paid,
  overdue,
  totalPending,
  totalPaid,
  onPress,
  onStatusPress,
  loading = false,
  error = null,
  periodLabel,
}) => {
  const isEmpty = total === 0;

  // Calculate percentages for stacked bar
  const { pendingPercent, paidPercent, overduePercent } = useMemo(() => {
    if (total === 0) return { pendingPercent: 0, paidPercent: 0, overduePercent: 0 };

    return {
      pendingPercent: (pending / total) * 100,
      paidPercent: (paid / total) * 100,
      overduePercent: (overdue / total) * 100,
    };
  }, [total, pending, paid, overdue]);

  const accessibilityLabel = useMemo(() => {
    if (isEmpty) return 'Invoice status widget, no invoices';

    const parts = [
      `Invoice status: ${total} total invoices`,
      `${paid} paid`,
      `${pending} pending`,
      overdue > 0 ? `${overdue} overdue, requires attention` : 'none overdue',
    ];
    return parts.join(', ');
  }, [isEmpty, total, paid, pending, overdue]);

  const renderStatusItem = (
    status: InvoiceStatus,
    count: number,
    amount?: number
  ) => {
    const color = STATUS_COLORS[status];
    const label = STATUS_LABELS[status];
    const isClickable = onStatusPress && count > 0;

    const content = (
      <View style={styles.statusItem}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <Text style={styles.statusLabel}>{label}</Text>
          {status === 'overdue' && count > 0 && (
            <Text style={styles.alertIcon}>⚠️</Text>
          )}
        </View>
        <Text style={[styles.statusCount, { color }]}>{count}</Text>
        {amount !== undefined && (
          <Text style={styles.statusAmount}>{formatCurrencySmart(amount)}</Text>
        )}
      </View>
    );

    if (isClickable) {
      return (
        <TouchableOpacity
          key={status}
          style={styles.statusTouchable}
          onPress={() => onStatusPress(status)}
          accessibilityRole="button"
          accessibilityLabel={`${count} ${label.toLowerCase()} invoices${amount ? `, ${formatCurrencySmart(amount)}` : ''}. Tap to filter.`}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View key={status} style={styles.statusTouchable}>
        {content}
      </View>
    );
  };

  return (
    <BaseWidget
      title="Invoice Status"
      subtitle={periodLabel}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No invoices recorded"
      emptyIcon="📄"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view all invoices"
      headerRight={
        total > 0 ? (
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{total} total</Text>
          </View>
        ) : null
      }
    >
      <View style={styles.content}>
        {/* Stacked Progress Bar */}
        <View style={styles.stackedBar} accessibilityLabel="Invoice distribution bar">
          {paidPercent > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  width: `${paidPercent}%`,
                  backgroundColor: STATUS_COLORS.paid,
                  borderTopLeftRadius: 4,
                  borderBottomLeftRadius: 4,
                },
              ]}
            />
          )}
          {pendingPercent > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  width: `${pendingPercent}%`,
                  backgroundColor: STATUS_COLORS.pending,
                },
              ]}
            />
          )}
          {overduePercent > 0 && (
            <View
              style={[
                styles.barSegment,
                {
                  width: `${overduePercent}%`,
                  backgroundColor: STATUS_COLORS.overdue,
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                },
              ]}
            />
          )}
        </View>

        {/* Status Breakdown */}
        <View style={styles.statusContainer}>
          {renderStatusItem('paid', paid, totalPaid)}
          {renderStatusItem('pending', pending, totalPending)}
          {renderStatusItem('overdue', overdue)}
        </View>

        {/* Overdue Alert */}
        {overdue > 0 && (
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>
              {overdue} invoice{overdue > 1 ? 's' : ''} require{overdue === 1 ? 's' : ''} immediate attention
            </Text>
          </View>
        )}
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {},
  totalBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  stackedBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusTouchable: {
    flex: 1,
  },
  statusItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  alertIcon: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusAmount: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  alertContainer: {
    marginTop: 12,
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  alertText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
  },
});
