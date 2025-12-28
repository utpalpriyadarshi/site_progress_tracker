import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StockTransfer } from '../../../services/InventoryOptimizationService';

interface TransfersViewProps {
  transfers: StockTransfer[];
}

/**
 * TransfersView Component
 *
 * Displays stock transfers between locations with:
 * - Transfer number and material
 * - Status and priority badges
 * - Route visualization (from/to locations)
 * - Transfer details (quantity, cost, reason)
 * - Timeline information
 *
 * Extracted from InventoryManagementScreen.tsx Phase 4.
 */
export const TransfersView: React.FC<TransfersViewProps> = ({ transfers }) => {
  const getTransferStatusColor = (status: string): string => {
    switch (status) {
      case 'received':
        return '#10b981';
      case 'in_transit':
        return '#3b82f6';
      case 'approved':
        return '#8b5cf6';
      case 'requested':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      default:
        return '#9ca3af';
    }
  };

  if (transfers.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No transfers found</Text>
      </View>
    );
  }

  const renderTransferCard = (transfer: StockTransfer) => {
    return (
      <View key={transfer.id} style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.transferNumber}>{transfer.transferNumber}</Text>
            <Text style={styles.material}>{transfer.materialName}</Text>
          </View>
          <View style={styles.badges}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getTransferStatusColor(transfer.status) },
              ]}
            >
              <Text style={styles.badgeText}>{transfer.status.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(transfer.priority) },
              ]}
            >
              <Text style={styles.badgeText}>{transfer.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.routePoint}>
            <View style={styles.dot} />
            <View>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeLocation}>{transfer.fromLocationName}</Text>
            </View>
          </View>
          <View style={styles.arrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.routePoint}>
            <View style={styles.dot} />
            <View>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeLocation}>{transfer.toLocationName}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Quantity: {transfer.quantity} {transfer.unit}
          </Text>
          <Text style={styles.detailText}>
            Transport Cost: ₹{transfer.transportCost.toLocaleString()}
          </Text>
          <Text style={styles.detailText}>Reason: {transfer.reason}</Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <Text style={styles.timelineText}>
            Requested: {new Date(transfer.requestedDate).toLocaleDateString()}
          </Text>
          {transfer.receivedDate && (
            <Text style={styles.timelineText}>
              Received: {new Date(transfer.receivedDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.scroll}>
      {transfers.map(transfer => renderTransferCard(transfer))}
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
    marginBottom: 16,
  },
  transferNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 2,
  },
  material: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  badges: {
    gap: 4,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  priorityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  routeLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  routeLocation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  arrow: {
    paddingHorizontal: 8,
  },
  arrowText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  details: {
    marginBottom: 12,
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
  },
  timeline: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    gap: 4,
  },
  timelineText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
