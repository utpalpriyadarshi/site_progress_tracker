/**
 * StatusBadge Component
 *
 * Reusable status badge for deliveries
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStatus } from '../../../services/DeliverySchedulingService';
import { getStatusColor } from '../utils/deliveryFormatters';

interface StatusBadgeProps {
  status: DeliveryStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const backgroundColor = getStatusColor(status);

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
