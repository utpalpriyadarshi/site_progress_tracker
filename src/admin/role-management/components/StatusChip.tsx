import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface StatusChipProps {
  isActive: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({ isActive }) => {
  return (
    <Chip
      style={[
        styles.statusChip,
        { backgroundColor: isActive ? '#4CAF50' : '#F44336' },
      ]}
      textStyle={styles.statusChipText}
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
