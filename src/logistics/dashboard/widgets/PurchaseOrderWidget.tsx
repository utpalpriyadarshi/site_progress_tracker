/**
 * PurchaseOrderWidget
 *
 * Displays purchase order status: open POs, approval pending,
 * total value, and recent orders.
 *
 * WCAG 2.1 AA Accessibility:
 * - Screen reader announcements on data load
 * - Proper accessibility labels and roles
 * - Semantic structure for screen readers
 *
 * @version 1.1.0
 * @since Logistics Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { usePurchaseOrderData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helper ====================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusType(status: string): 'pending' | 'in_transit' | 'delivered' | 'default' {
  switch (status) {
    case 'pending':
    case 'pending_approval':
    case 'draft':
      return 'pending';
    case 'approved':
    case 'shipped':
    case 'in_transit':
      return 'in_transit';
    case 'completed':
    case 'delivered':
      return 'delivered';
    default:
      return 'default';
  }
}

// ==================== Component ====================

export const PurchaseOrderWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = usePurchaseOrderData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      const pendingAlert = data.approvalPendingCount > 0
        ? `, ${data.approvalPendingCount} pending approval`
        : '';
      announce(`Purchase orders loaded: ${data.openCount} open orders${pendingAlert}, total value ${formatCurrency(data.totalValue)}`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `Purchase orders: ${data.openCount} open, ${data.approvalPendingCount} pending approval, total value ${formatCurrency(data.totalValue)}`
    : 'Purchase orders loading';

  const totalOrders = data ? (data.openCount + data.approvalPendingCount + data.completedCount) : 0;
  const isEmpty = !loading && !error && (!data || totalOrders === 0);

  return (
    <BaseWidget
      title="Purchase Orders"
      icon="clipboard-list"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'clipboard-text-outline',
        title: 'No Purchase Orders',
        message: 'Create your first purchase order to start tracking.',
        actionLabel: 'Create PO',
        onAction: () => {
          // Navigate to create PO
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {data.openCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Open
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: '#FF9800' }]}>
                {data.approvalPendingCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Pending
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: '#4CAF50' }]}>
                {data.completedCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Completed
              </Text>
            </View>
          </View>

          {/* Total Value */}
          <View style={styles.valueRow}>
            <Text variant="labelMedium" style={styles.label}>
              Total PO Value
            </Text>
            <Text variant="titleLarge" style={[styles.totalValue, { color: theme.colors.primary }]}>
              {formatCurrency(data.totalValue)}
            </Text>
          </View>

          {/* Recent Orders */}
          {data.recentOrders.length > 0 && (
            <View style={styles.recentSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Recent Orders
              </Text>
              <View style={styles.ordersList}>
                {data.recentOrders.slice(0, 3).map((order) => (
                  <View key={order.id} style={styles.orderItem}>
                    <View style={styles.orderInfo}>
                      <Text variant="bodySmall" style={styles.orderNumber}>
                        PO-{order.poNumber}
                      </Text>
                      <Text variant="labelSmall" style={styles.orderVendor} numberOfLines={1}>
                        {order.vendorName}
                      </Text>
                    </View>
                    <View style={styles.orderMeta}>
                      <StatusBadge
                        status={getStatusType(order.status)}
                        label={order.status.replace(/_/g, ' ')}
                        size="small"
                      />
                      <Text variant="labelSmall" style={styles.orderAmount}>
                        {formatCurrency(order.totalAmount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: '700',
  },
  summaryLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  label: {
    opacity: 0.7,
  },
  totalValue: {
    fontWeight: '700',
  },
  recentSection: {
    paddingTop: 4,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  ordersList: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  orderInfo: {
    flex: 1,
    marginRight: 8,
  },
  orderNumber: {
    fontWeight: '600',
  },
  orderVendor: {
    opacity: 0.6,
    marginTop: 2,
  },
  orderMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderAmount: {
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default PurchaseOrderWidget;
