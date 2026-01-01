import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { getStatusColor } from '../utils';

interface StatusChipProps {
  status: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  return (
    <Chip
      style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
      textStyle={styles.statusChipText}
    >
      {status.replace('_', ' ').toUpperCase()}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    marginLeft: 10,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
