import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { getStatusColor, getStatusLabel } from '../utils';

interface StatusChipProps {
  status: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  return (
    <Chip
      style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
      textStyle={styles.statusChipText}
    >
      {getStatusLabel(status)}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
