/**
 * InventoryStatusWidget
 *
 * Displays inventory status: total items, low stock alerts,
 * stock value, and category breakdown.
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
import { useInventoryStatusData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const InventoryStatusWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useInventoryStatusData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      const lowStockAlert = data.lowStockCount > 0
        ? `, ${data.lowStockCount} items are low on stock`
        : '';
      const outOfStockAlert = data.outOfStockCount > 0
        ? `, ${data.outOfStockCount} items are out of stock`
        : '';
      announce(`Inventory loaded: ${data.totalItems} total items${lowStockAlert}${outOfStockAlert}`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `Inventory status: ${data.totalItems} total items, ${data.lowStockCount} low stock, ${data.outOfStockCount} out of stock`
    : 'Inventory status loading';

  const isEmpty = !loading && !error && (!data || data.totalItems === 0);

  return (
    <BaseWidget
      title="Inventory Status"
      icon="package-variant"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'package-variant-closed',
        title: 'No Inventory Items',
        message: 'Start tracking inventory by adding your first item.',
        actionLabel: 'Add Item',
        onAction: () => {
          // Navigate to add inventory - can be customized via props
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Main Metric */}
          <View style={styles.mainMetric}>
            <Text variant="displaySmall" style={[styles.mainValue, { color: theme.colors.primary }]}>
              {data.totalItems}
            </Text>
            <Text variant="bodyMedium" style={styles.mainLabel}>
              Total Items
            </Text>
          </View>

          {/* Status Badges */}
          <View style={styles.statusRow}>
            <StatusBadge
              status="in_stock"
              label={`${data.inStockCount} In Stock`}
              size="small"
            />
            <StatusBadge
              status="low_stock"
              label={`${data.lowStockCount} Low Stock`}
              size="small"
            />
            <StatusBadge
              status="out_of_stock"
              label={`${data.outOfStockCount} Out`}
              size="small"
            />
          </View>

          {/* Stock Value */}
          <View style={styles.valueRow}>
            <Text variant="labelMedium" style={styles.label}>
              Total Stock Value
            </Text>
            <Text variant="titleMedium" style={styles.value}>
              {formatCurrency(data.totalValue)}
            </Text>
          </View>

          {/* Top Categories */}
          {data.categoryBreakdown.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Top Categories
              </Text>
              <View
                style={styles.categoriesList}
                accessible
                accessibilityRole="list"
                accessibilityLabel={`Top ${Math.min(3, data.categoryBreakdown.length)} inventory categories`}
              >
                {data.categoryBreakdown.slice(0, 3).map((cat, index) => (
                  <View
                    key={index}
                    style={styles.categoryItem}
                    accessible
                    accessibilityRole="text"
                    accessibilityLabel={`${cat.category}: ${cat.count} items`}
                  >
                    <Text variant="bodySmall" style={styles.categoryName} numberOfLines={1}>
                      {cat.category}
                    </Text>
                    <Text variant="bodySmall" style={styles.categoryCount}>
                      {cat.count}
                    </Text>
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
  mainMetric: {
    alignItems: 'center',
    marginBottom: 4,
  },
  mainValue: {
    fontWeight: '700',
  },
  mainLabel: {
    opacity: 0.7,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '600',
  },
  categoriesSection: {
    paddingTop: 8,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  categoriesList: {
    gap: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
    opacity: 0.8,
  },
  categoryCount: {
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InventoryStatusWidget;
