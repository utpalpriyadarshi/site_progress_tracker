import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ABCCategory } from '../../../services/InventoryOptimizationService';
import { getABCColor, ABC_LABELS } from '../utils';

interface ABCCategoryChipProps {
  category: ABCCategory;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * ABCCategoryChip Component
 *
 * Color-coded chip displaying ABC analysis category.
 * Category A (red) = High value items
 * Category B (orange) = Medium value items
 * Category C (green) = Low value items
 *
 * Extracted from InventoryManagementScreen.tsx Phase 3.
 */
export const ABCCategoryChip: React.FC<ABCCategoryChipProps> = ({
  category,
  size = 'medium',
  showLabel = false,
}) => {
  const backgroundColor = getABCColor(category);
  const label = showLabel ? ABC_LABELS[category] : category;

  const chipStyle = [
    styles.chip,
    { backgroundColor },
    size === 'small' && styles.chipSmall,
    size === 'large' && styles.chipLarge,
  ];

  const textStyle = [
    styles.text,
    size === 'small' && styles.textSmall,
    size === 'large' && styles.textLarge,
  ];

  return (
    <View style={chipStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  chipLarge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  textSmall: {
    fontSize: 10,
  },
  textLarge: {
    fontSize: 14,
  },
});
