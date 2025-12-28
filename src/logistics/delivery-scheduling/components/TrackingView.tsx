/**
 * TrackingView Component
 *
 * Displays real-time tracking for in-transit deliveries
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DeliverySchedule } from '../../../services/DeliverySchedulingService';
import { formatTime } from '../utils/deliveryFormatters';

interface TrackingViewProps {
  deliveries: DeliverySchedule[];
}

export const TrackingView: React.FC<TrackingViewProps> = ({ deliveries }) => {
  const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit');

  if (inTransitDeliveries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No deliveries in transit</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {inTransitDeliveries.map(delivery => (
        <View key={delivery.id} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.number}>{delivery.deliveryNumber}</Text>
              <Text style={styles.material}>{delivery.materialName}</Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressCircleText}>{delivery.progressPercentage}%</Text>
            </View>
          </View>

          {/* Tracking Route */}
          <View style={styles.route}>
            {/* Start Point */}
            <View style={styles.point}>
              <View style={[styles.dot, styles.dotComplete]} />
              <View style={styles.info}>
                <Text style={styles.label}>From</Text>
                <Text style={styles.location}>{delivery.supplierLocation}</Text>
              </View>
            </View>

            <View style={styles.line} />

            {/* Current Location */}
            {delivery.currentLocation && (
              <>
                <View style={styles.point}>
                  <View style={[styles.dot, styles.dotCurrent]} />
                  <View style={styles.info}>
                    <Text style={styles.label}>Current</Text>
                    <Text style={styles.location}>{delivery.currentLocation}</Text>
                    <Text style={styles.time}>Updated: {formatTime(delivery.lastUpdated!)}</Text>
                  </View>
                </View>
                <View style={styles.line} />
              </>
            )}

            {/* Destination */}
            <View style={styles.point}>
              <View style={[styles.dot, styles.dotPending]} />
              <View style={styles.info}>
                <Text style={styles.label}>To</Text>
                <Text style={styles.location}>{delivery.siteAddress}</Text>
                <Text style={styles.time}>ETA: {formatTime(delivery.estimatedDeliveryTime)}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.driver}>Driver: {delivery.driverName}</Text>
            <Text style={styles.vehicle}>Vehicle: {delivery.vehicleType}</Text>
          </View>
        </View>
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
    marginBottom: 16,
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
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  route: {
    paddingVertical: 8,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  dotComplete: {
    backgroundColor: '#10b981',
  },
  dotCurrent: {
    backgroundColor: '#3b82f6',
  },
  dotPending: {
    backgroundColor: '#d1d5db',
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: '#d1d5db',
    marginLeft: 5,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
  },
  location: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  driver: {
    fontSize: 12,
    color: '#666',
  },
  vehicle: {
    fontSize: 12,
    color: '#666',
  },
});
