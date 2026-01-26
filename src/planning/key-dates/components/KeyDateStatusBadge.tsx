/**
 * Key Date Status Badge Component
 *
 * Displays the status of a key date with appropriate color coding.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { KeyDateStatus } from '../../../../models/KeyDateModel';
import { KEY_DATE_STATUS_COLORS, KEY_DATE_STATUS_LABELS } from '../utils/keyDateConstants';

interface KeyDateStatusBadgeProps {
  status: KeyDateStatus;
  compact?: boolean;
}

export const KeyDateStatusBadge: React.FC<KeyDateStatusBadgeProps> = ({
  status,
  compact = false,
}) => {
  const backgroundColor = KEY_DATE_STATUS_COLORS[status] || KEY_DATE_STATUS_COLORS.not_started;
  const label = KEY_DATE_STATUS_LABELS[status] || 'Unknown';

  return (
    <Chip
      mode="flat"
      style={[styles.badge, { backgroundColor }]}
      textStyle={[styles.badgeText, compact && styles.compactText]}
      compact={compact}
      accessibilityLabel={`Status: ${label}`}
      accessibilityRole="text"
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  badge: {
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  compactText: {
    fontSize: 10,
  },
});

export default KeyDateStatusBadge;
