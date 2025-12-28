import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { getCategoryColor } from '../utils';

interface CategoryChipProps {
  category: string;
  label: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ category, label }) => {
  return (
    <Chip
      style={[styles.chip, { backgroundColor: getCategoryColor(category) }]}
      textStyle={styles.chipText}
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
