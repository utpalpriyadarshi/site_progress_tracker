import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * InventoryItemCard
 *
 * Reusable card component for displaying inventory items with location and quantity
 * Used across Logistics screens for consistent inventory UI
 *
 * Features:
 * - Location hierarchy display (site, warehouse, rack, bin)
 * - Status badge with color coding
 * - Last movement indicator
 * - Transfer and adjust quantity actions
 * - Value display (optional)
 * - History timeline (optional)
 *
 * @example
 * ```tsx
 * <InventoryItemCard
 *   item={{
 *     id: '1',
 *     materialCode: 'MAT-001',
 *     materialName: 'Steel Beams',
 *     quantity: 150,
 *     unit: 'pieces',
 *     location: {
 *       site: 'Site A',
 *       warehouse: 'WH-01',
 *       rack: 'R-03',
 *       bin: 'B-12',
 *     },
 *     status: 'available',
 *     lastMovement: {
 *       type: 'in',
 *       quantity: 50,
 *       date: Date.now() - 86400000,
 *       user: 'John Doe',
 *     },
 *     value: 15000,
 *   }}
 *   onPress={(id) => console.log('View item:', id)}
 *   onAdjustQuantity={(item) => console.log('Adjust:', item)}
 *   onTransfer={(item) => console.log('Transfer:', item)}
 *   showActions={true}
 *   showLocation={true}
 *   showHistory={true}
 * />
 * ```
 */

export interface InventoryItem {
  id: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  location: {
    site: string;
    warehouse: string;
    rack?: string;
    bin?: string;
  };
  status: 'available' | 'reserved' | 'in-transit' | 'damaged';
  lastMovement?: {
    type: 'in' | 'out' | 'transfer';
    quantity: number;
    date: number;
    user: string;
  };
  value?: number;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  onPress?: (id: string) => void;
  onAdjustQuantity?: (item: InventoryItem) => void;
  onTransfer?: (item: InventoryItem) => void;
  showActions?: boolean;
  showLocation?: boolean;
  showHistory?: boolean;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onPress,
  onAdjustQuantity,
  onTransfer,
  showActions = false,
  showLocation = true,
  showHistory = false,
}) => {
  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'available':
        return COLORS.SUCCESS;
      case 'reserved':
        return COLORS.WARNING;
      case 'in-transit':
        return COLORS.INFO;
      case 'damaged':
        return COLORS.ERROR;
      default:
        return COLORS.DISABLED;
    }
  };

  const getStatusLabel = (status: InventoryItem['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'in-transit':
        return 'In Transit';
      case 'damaged':
        return 'Damaged';
      default:
        return 'Unknown';
    }
  };

  const getMovementIcon = (type: 'in' | 'out' | 'transfer') => {
    switch (type) {
      case 'in':
        return '↓';
      case 'out':
        return '↑';
      case 'transfer':
        return '⇄';
      default:
        return '•';
    }
  };

  const getMovementColor = (type: 'in' | 'out' | 'transfer') => {
    switch (type) {
      case 'in':
        return COLORS.SUCCESS;
      case 'out':
        return COLORS.ERROR;
      case 'transfer':
        return COLORS.INFO;
      default:
        return COLORS.DISABLED;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handlePress = () => {
    if (onPress) {
      onPress(item.id);
    }
  };

  const handleAdjustQuantity = () => {
    if (onAdjustQuantity) {
      onAdjustQuantity(item);
    }
  };

  const handleTransfer = () => {
    if (onTransfer) {
      onTransfer(item);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Status Indicator */}
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.code}>{item.materialCode}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.materialName}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {/* Quantity & Value Row */}
        <View style={styles.quantityRow}>
          <Text style={styles.quantity}>
            {item.quantity} {item.unit}
          </Text>
          {item.value && (
            <Text style={styles.value}>{formatValue(item.value)}</Text>
          )}
        </View>

        {/* Location Hierarchy */}
        {showLocation && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Location:</Text>
            <View style={styles.locationHierarchy}>
              <Text style={styles.locationText}>{item.location.site}</Text>
              <Text style={styles.locationSeparator}>›</Text>
              <Text style={styles.locationText}>{item.location.warehouse}</Text>
              {item.location.rack && (
                <>
                  <Text style={styles.locationSeparator}>›</Text>
                  <Text style={styles.locationText}>{item.location.rack}</Text>
                </>
              )}
              {item.location.bin && (
                <>
                  <Text style={styles.locationSeparator}>›</Text>
                  <Text style={styles.locationText}>{item.location.bin}</Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Last Movement */}
        {showHistory && item.lastMovement && (
          <View style={styles.movementContainer}>
            <View
              style={[
                styles.movementIcon,
                { backgroundColor: getMovementColor(item.lastMovement.type) },
              ]}
            >
              <Text style={styles.movementIconText}>
                {getMovementIcon(item.lastMovement.type)}
              </Text>
            </View>
            <View style={styles.movementDetails}>
              <Text style={styles.movementText}>
                {item.lastMovement.type === 'in' && 'Received '}
                {item.lastMovement.type === 'out' && 'Dispatched '}
                {item.lastMovement.type === 'transfer' && 'Transferred '}
                {item.lastMovement.quantity} {item.unit}
              </Text>
              <Text style={styles.movementDate}>
                {formatDate(item.lastMovement.date)} • {item.lastMovement.user}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actionsRow}>
            {onAdjustQuantity && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAdjustQuantity}
              >
                <Text style={styles.actionText}>Adjust Qty</Text>
              </TouchableOpacity>
            )}
            {onTransfer && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={handleTransfer}
              >
                <Text style={styles.actionTextPrimary}>Transfer</Text>
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
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantity: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  locationHierarchy: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.INFO,
    fontWeight: '500',
  },
  locationSeparator: {
    fontSize: 12,
    color: '#BDBDBD',
    marginHorizontal: 4,
  },
  movementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  movementIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  movementIconText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  movementDetails: {
    flex: 1,
  },
  movementText: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 11,
    color: '#757575',
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
    borderColor: COLORS.INFO,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.INFO,
    borderColor: COLORS.INFO,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.INFO,
    fontWeight: '600',
  },
  actionTextPrimary: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default InventoryItemCard;
