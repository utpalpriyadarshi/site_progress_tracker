/**
 * Key Date Progress Bar Component
 *
 * Displays progress percentage with category-specific color.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { KeyDateCategory, KeyDateStatus } from '../../../../models/KeyDateModel';
import { KEY_DATE_CATEGORY_COLORS, KEY_DATE_STATUS_COLORS } from '../utils/keyDateConstants';

interface KeyDateProgressBarProps {
  progressPercentage: number;
  category: KeyDateCategory;
  status: KeyDateStatus;
  showLabel?: boolean;
}

export const KeyDateProgressBar: React.FC<KeyDateProgressBarProps> = ({
  progressPercentage,
  category,
  status,
  showLabel = true,
}) => {
  const progress = progressPercentage / 100;

  // Use status color if delayed, otherwise use category color
  const barColor =
    status === 'delayed'
      ? KEY_DATE_STATUS_COLORS.delayed
      : KEY_DATE_CATEGORY_COLORS[category] || '#666666';

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>
          Progress: {progressPercentage.toFixed(0)}%
        </Text>
      )}
      <ProgressBar
        progress={progress}
        color={barColor}
        style={styles.progressBar}
        accessibilityLabel={`Progress: ${progressPercentage.toFixed(0)} percent`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
});

export default KeyDateProgressBar;
