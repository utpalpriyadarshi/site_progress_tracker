import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { METRO_MATERIAL_CATEGORIES } from '../utils/materialTrackingConstants';

interface CategoryFiltersProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

/**
 * CategoryFilters Component
 *
 * Standalone horizontal scrollable category filter chips.
 * Displays Metro Railway Material Categories with icons and colors.
 *
 * Extracted from MaterialTrackingScreen for reusability.
 */
export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {METRO_MATERIAL_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id || (!selectedCategory && category.id === 'all');
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipActive,
                isSelected && { backgroundColor: category.color },
              ]}
              onPress={() => onCategoryChange(category.id === 'all' ? null : category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    borderColor: 'transparent',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryNameActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
