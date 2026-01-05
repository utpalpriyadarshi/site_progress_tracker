import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * MaterialCard
 *
 * Reusable card component for displaying material details with stock status
 * Used across Logistics screens for consistent material UI
 *
 * Features:
 * - Stock status indicator with color coding
 * - Quantity with unit display
 * - Category badge
 * - Optional action buttons (Edit, Request More)
 * - Stock level progress bar
 * - Compact/detailed variants
 *
 * @example
 * ```tsx
 * <MaterialCard
 *   material={{
 *     id: '1',
 *     code: 'MAT-001',
 *     name: 'Steel Beams',
 *     category: 'Structural',
 *     quantity: 150,
 *     unit: 'pieces',
 *     stockStatus: 'in-stock',
 *     minQuantity: 50,
 *     maxQuantity: 200,
 *     location: 'Warehouse A',
 *     supplier: 'Steel Co.',
 *   }}
 *   onPress={(id) => console.log('View material:', id)}
 *   onEdit={(material) => console.log('Edit:', material)}
 *   showActions={true}
 *   variant="detailed"
 *   showStock={true}
 * />
 * ```
 */

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock' | 'on-order';
  minQuantity?: number;
  maxQuantity?: number;
  location?: string;
  supplier?: string;
  cost?: number;
  lastUpdated?: number;
}

interface MaterialCardProps {
  material: Material;
  onPress?: (id: string) => void;
  onEdit?: (material: Material) => void;
  onRequestMore?: (material: Material) => void;
  showActions?: boolean;
  showStock?: boolean;
  variant?: 'default' | 'compact';
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onPress,
  onEdit,
  onRequestMore,
  showActions = false,
  showStock = true,
  variant = 'default',
}) => {
  const getStatusColor = (status: Material['stockStatus']) => {
    switch (status) {
      case 'in-stock':
        return '#4CAF50';
      case 'low-stock':
        return '#FF9800';
      case 'out-of-stock':
        return '#F44336';
      case 'on-order':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: Material['stockStatus']) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      case 'on-order':
        return 'On Order';
      default:
        return 'Unknown';
    }
  };

  const getStockLevel = () => {
    if (!material.minQuantity || !material.maxQuantity) {
      return 0;
    }
    const range = material.maxQuantity - material.minQuantity;
    const current = material.quantity - material.minQuantity;
    return Math.max(0, Math.min(100, (current / range) * 100));
  };

  const handlePress = () => {
    if (onPress) {
      onPress(material.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(material);
    }
  };

  const handleRequestMore = () => {
    if (onRequestMore) {
      onRequestMore(material);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Status Indicator */}
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor(material.stockStatus) },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.code}>{material.code}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {material.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(material.stockStatus) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(material.stockStatus)}
            </Text>
          </View>
        </View>

        {/* Category & Quantity Row */}
        <View style={styles.detailsRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{material.category}</Text>
          </View>
          <Text style={styles.quantity}>
            {material.quantity} {material.unit}
          </Text>
        </View>

        {/* Stock Level Progress Bar */}
        {showStock && material.minQuantity && material.maxQuantity && (
          <View style={styles.stockContainer}>
            <Text style={styles.stockLabel}>Stock Level</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStockLevel()}%`,
                    backgroundColor: getStatusColor(material.stockStatus),
                  },
                ]}
              />
            </View>
            <Text style={styles.stockRange}>
              Min: {material.minQuantity} | Max: {material.maxQuantity}
            </Text>
          </View>
        )}

        {/* Additional Info (non-compact) */}
        {!isCompact && (
          <View style={styles.infoRow}>
            {material.location && (
              <Text style={styles.infoText}>📍 {material.location}</Text>
            )}
            {material.supplier && (
              <Text style={styles.infoText}>🏢 {material.supplier}</Text>
            )}
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actionsRow}>
            {onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onRequestMore && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleRequestMore}
              >
                <Text style={styles.actionTextPrimary}>Request More</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompact: {
    marginVertical: 4,
  },
  statusIndicator: {
    width: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  code: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  stockContainer: {
    marginBottom: 8,
  },
  stockLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockRange: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#616161',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  actionButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  actionText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  actionTextPrimary: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default MaterialCard;
