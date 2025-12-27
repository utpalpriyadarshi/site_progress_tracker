import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { STATUS_COLORS, DEFAULT_STATUS_COLOR } from '../utils/bomConstants';

interface BomStatusChipProps {
  status: string;
}

/**
 * BomStatusChip - Displays BOM status with appropriate color
 */
export const BomStatusChip: React.FC<BomStatusChipProps> = ({ status }) => {
  const statusColors = STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;

  return (
    <Chip
      mode="flat"
      style={[styles.statusChip, { backgroundColor: statusColors.bg }]}
      textStyle={[styles.statusChipText, { color: statusColors.text }]}
    >
      {status.toUpperCase()}
    </Chip>
  );
};

const styles = StyleSheet.create({
  statusChip: {
    height: 28,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
});
