/**
 * Key Date Status Badge Component
 *
 * Displays the status of a key date with appropriate color coding.
 * Uses custom View+Text pattern matching the Planning StatusBadge component
 * for uniform styling across all Planning screens.
 *
 * @version 2.0.0
 * @since Phase 5b - Key Dates UI
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const label = (KEY_DATE_STATUS_LABELS[status] || 'Unknown').toUpperCase();
  const badgeStyle = compact ? styles.badgeCompact : styles.badgeMedium;
  const textStyle = compact ? styles.textCompact : styles.textMedium;

  return (
    <View
      style={[styles.badgeBase, badgeStyle, { backgroundColor }]}
      accessible={true}
      accessibilityLabel={`Status: ${label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.textBase, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
    minHeight: 28,
  },
  badgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 70,
    minHeight: 24,
  },
  textBase: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textMedium: {
    fontSize: 12,
  },
  textCompact: {
    fontSize: 11,
  },
});

export default KeyDateStatusBadge;
