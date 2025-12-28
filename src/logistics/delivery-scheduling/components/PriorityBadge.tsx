/**
 * PriorityBadge Component
 *
 * Reusable priority badge for deliveries
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeliveryPriority } from '../../../services/DeliverySchedulingService';
import { getPriorityColor } from '../utils/deliveryFormatters';

interface PriorityBadgeProps {
  priority: DeliveryPriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const backgroundColor = getPriorityColor(priority);

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{priority.toUpperCase()}</Text>
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
