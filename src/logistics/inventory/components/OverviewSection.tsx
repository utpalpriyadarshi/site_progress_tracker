import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { InventoryItem } from '../../../services/InventoryOptimizationService';
import { getStatusColor, getABCColor } from '../utils';
import { StockLevelBadge } from './StockLevelBadge';
import { ABCCategoryChip } from './ABCCategoryChip';

interface OverviewSectionProps {
  items: InventoryItem[];
  onItemPress?: (item: InventoryItem) => void;
}

/**
 * OverviewSection Component
 *
 * Displays inventory items as detailed cards with:
 * - Material name, category, and badges
 * - Stock levels and availability
 * - Visual stock level indicator
 * - Turnover and age metrics
 *
 * Extracted from InventoryManagementScreen.tsx Phase 4.
 */
export const OverviewSection: React.FC<OverviewSectionProps> = ({
  items,
  onItemPress,
}) => {
  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No inventory items found</Text>
      </View>
    );
  }

  const renderInventoryCard = (item: InventoryItem) => {
    const stockPercent = Math.min((item.quantity / item.maxStock) * 100, 100);
    const reorderPercent = (item.reorderLevel / item.maxStock) * 100;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => onItemPress?.(item)}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{item.materialName}</Text>
            <Text style={styles.subtitle}>{item.category}</Text>
          </View>
          <View style={styles.headerRight}>
            <StockLevelBadge status={item.status} size="small" />
            {item.abcCategory && (
              <ABCCategoryChip category={item.abcCategory} size="small" />
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.locationName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>
              {item.quantity.toLocaleString()} {item.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Available:</Text>
            <Text style={styles.detailValue}>
              {item.availableQuantity.toLocaleString()} {item.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Value:</Text>
            <Text style={styles.detailValue}>₹{item.totalValue.toLocaleString()}</Text>
          </View>
        </View>

        {/* Stock Level Bar */}
        <View style={styles.stockLevelContainer}>
          <View style={styles.stockLevelBar}>
            <View
              style={[
                styles.stockLevelFill,
                {
                  width: `${stockPercent}%`,
                  backgroundColor: getStatusColor(item.status),
                },
              ]}
            />
            <View
              style={[
                styles.reorderMarker,
                { left: `${reorderPercent}%` },
              ]}
            />
          </View>
          <View style={styles.stockLevelLabels}>
            <Text style={styles.stockLevelLabel}>
              Reorder: {item.reorderLevel} {item.unit}
            </Text>
            <Text style={styles.stockLevelLabel}>
              Max: {item.maxStock} {item.unit}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Turnover: {item.turnoverRate}x/year • Age: {item.ageInDays} days
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.scroll}>
      {items.map(item => renderInventoryCard(item))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  stockLevelContainer: {
    marginBottom: 12,
  },
  stockLevelBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  stockLevelFill: {
    height: '100%',
    borderRadius: 4,
  },
  reorderMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#dc2626',
  },
  stockLevelLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockLevelLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
