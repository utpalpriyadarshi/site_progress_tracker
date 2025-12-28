/**
 * ScheduleView Component
 *
 * Displays delivery schedules with detailed cards
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { DeliverySchedule } from '../../../services/DeliverySchedulingService';
import { StatusBadge, PriorityBadge } from './';
import { formatDate, formatTime } from '../utils/deliveryFormatters';

interface ScheduleViewProps {
  deliveries: DeliverySchedule[];
  onDeliveryPress: (delivery: DeliverySchedule) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  deliveries,
  onDeliveryPress,
}) => {
  if (deliveries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No deliveries found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {deliveries.map(delivery => (
        <TouchableOpacity
          key={delivery.id}
          style={styles.card}
          onPress={() => onDeliveryPress(delivery)}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.number}>{delivery.deliveryNumber}</Text>
              <Text style={styles.material}>{delivery.materialName}</Text>
            </View>
            <View style={styles.badges}>
              <StatusBadge status={delivery.status} />
              <View style={styles.badgeSpacing} />
              <PriorityBadge priority={delivery.priority} />
            </View>
          </View>

          {/* Details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>
                {delivery.quantity} {delivery.unit}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Supplier:</Text>
              <Text style={styles.detailValue}>{delivery.supplierName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Site:</Text>
              <Text style={styles.detailValue}>{delivery.siteName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled:</Text>
              <Text style={styles.detailValue}>
                {formatDate(delivery.scheduledDate)} {formatTime(delivery.estimatedDeliveryTime)}
              </Text>
            </View>

            {/* Progress bar for in-transit deliveries */}
            {delivery.status === 'in_transit' && delivery.progressPercentage !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${delivery.progressPercentage}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{delivery.progressPercentage}%</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {delivery.distanceKm.toFixed(0)} km • ₹{delivery.totalCost.toFixed(0)}
            </Text>
            {!delivery.siteReady && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>⚠️ Site Not Ready</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
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
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  number: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  material: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
  },
  badgeSpacing: {
    height: 4,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  warningBadge: {
    backgroundColor: '#fff3cd',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '600',
  },
});
