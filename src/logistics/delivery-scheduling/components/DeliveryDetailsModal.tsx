/**
 * DeliveryDetailsModal Component
 *
 * Modal displaying comprehensive delivery information
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { DeliverySchedule } from '../../../services/DeliverySchedulingService';
import { formatDate, formatTime } from '../utils/deliveryFormatters';

interface DeliveryDetailsModalProps {
  delivery: DeliverySchedule | null;
  visible: boolean;
  onClose: () => void;
}

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({
  delivery,
  visible,
  onClose,
}) => {
  if (!delivery) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{delivery.deliveryNumber}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scroll}>
            <Text style={styles.sectionTitle}>Material</Text>
            <Text style={styles.text}>{delivery.materialName}</Text>
            <Text style={styles.subtext}>
              {delivery.quantity} {delivery.unit} • {delivery.category}
            </Text>

            <Text style={styles.sectionTitle}>Supplier</Text>
            <Text style={styles.text}>{delivery.supplierName}</Text>
            <Text style={styles.subtext}>{delivery.supplierLocation}</Text>

            <Text style={styles.sectionTitle}>Destination</Text>
            <Text style={styles.text}>{delivery.siteName}</Text>
            <Text style={styles.subtext}>{delivery.siteAddress}</Text>

            <Text style={styles.sectionTitle}>Schedule</Text>
            <Text style={styles.text}>
              Scheduled: {formatDate(delivery.scheduledDate)}{' '}
              {formatTime(delivery.estimatedDeliveryTime)}
            </Text>
            {delivery.actualDeliveryTime && (
              <Text style={styles.subtext}>
                Actual: {formatDate(delivery.actualDeliveryTime)}{' '}
                {formatTime(delivery.actualDeliveryTime)}
              </Text>
            )}
            <Text style={styles.subtext}>Lead Time: {delivery.leadTimeDays} days</Text>

            <Text style={styles.sectionTitle}>Logistics</Text>
            <Text style={styles.text}>Distance: {delivery.distanceKm.toFixed(0)} km</Text>
            <Text style={styles.text}>
              Duration: {delivery.estimatedDurationHours.toFixed(1)} hours
            </Text>
            {delivery.driverName && (
              <Text style={styles.text}>Driver: {delivery.driverName}</Text>
            )}
            {delivery.vehicleType && (
              <Text style={styles.text}>Vehicle: {delivery.vehicleType}</Text>
            )}

            <Text style={styles.sectionTitle}>Cost</Text>
            <Text style={styles.text}>
              Transport: ₹{delivery.transportCost.toFixed(2)}
            </Text>
            <Text style={styles.text}>
              Handling: ₹{delivery.handlingCost.toFixed(2)}
            </Text>
            <Text style={styles.text}>Total: ₹{delivery.totalCost.toFixed(2)}</Text>

            <Text style={styles.sectionTitle}>Site Readiness</Text>
            <Text style={[styles.text, { color: delivery.siteReady ? '#10b981' : '#ef4444' }]}>
              {delivery.siteReady ? '✓ Site Ready' : '✗ Site Not Ready'}
            </Text>
            <Text
              style={[styles.text, { color: delivery.storageAvailable ? '#10b981' : '#ef4444' }]}
            >
              {delivery.storageAvailable ? '✓ Storage Available' : '✗ Storage Full'}
            </Text>
            {delivery.siteReadinessNotes && (
              <Text style={styles.subtext}>{delivery.siteReadinessNotes}</Text>
            )}

            {delivery.notes && (
              <>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.text}>{delivery.notes}</Text>
              </>
            )}
          </ScrollView>

          {/* Footer Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  close: {
    fontSize: 24,
    color: '#666',
  },
  scroll: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
