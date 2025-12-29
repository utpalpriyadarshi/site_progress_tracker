/**
 * Status Chip Component
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { STATUS_COLORS, STATUS_LABELS } from '../utils';

interface StatusChipProps {
  status: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const backgroundColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.not_started;
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'UNKNOWN';

  return (
    <Chip
      mode="flat"
      style={[styles.statusChip, { backgroundColor }]}
      textStyle={styles.statusChipText}
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    marginLeft: 8,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
  },
});
