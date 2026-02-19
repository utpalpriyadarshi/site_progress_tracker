import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { COLORS } from '../../../theme/colors';

interface StatusChipProps {
  isActive: boolean;
}

export const StatusChip: React.FC<StatusChipProps> = ({ isActive }) => {
  return (
    <Chip
      style={[
        styles.statusChip,
        { backgroundColor: isActive ? COLORS.SUCCESS : COLORS.ERROR },
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
