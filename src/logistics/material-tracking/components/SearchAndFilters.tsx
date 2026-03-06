import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { METRO_MATERIAL_CATEGORIES } from '../utils/materialTrackingConstants';
import { COLORS } from '../../../theme/colors';

type Discipline = 'all' | 'tss' | 'ohe' | 'general';

const DISCIPLINE_CHIPS: { id: Discipline; label: string; icon: string }[] = [
  { id: 'all',     label: 'All',     icon: '📦' },
  { id: 'tss',     label: 'TSS',     icon: '⚡' },
  { id: 'ohe',     label: 'OHE',     icon: '🔌' },
  { id: 'general', label: 'General', icon: '🔧' },
];

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedDiscipline?: Discipline;
  onDisciplineChange?: (discipline: Discipline) => void;
}

/**
 * SearchAndFilters Component
 *
 * Combined search bar with category filter chips.
 * Extracted from MaterialTrackingScreen for reusability.
 */
export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDiscipline = 'all',
  onDisciplineChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Discipline filter chips — TSS / OHE / General */}
      {onDisciplineChange && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.disciplineRow}
        >
          {DISCIPLINE_CHIPS.map((chip) => {
            const isActive = selectedDiscipline === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, styles.disciplineChip, isActive && styles.disciplineChipActive]}
                onPress={() => onDisciplineChange(chip.id)}
              >
                <Text style={styles.filterIcon}>{chip.icon}</Text>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Search bar - compact with clear button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onSearchChange('')}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters - horizontal chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
      >
        {METRO_MATERIAL_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                isSelected && styles.filterChipActive,
              ]}
              onPress={() => onCategoryChange(isSelected ? null : category.id)}
            >
              <Text style={styles.filterIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.filterText,
                  isSelected && styles.filterTextActive,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.INFO,
  },
  disciplineRow: {
    paddingBottom: 6,
  },
  disciplineChip: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    backgroundColor: '#f8f8f8',
  },
  disciplineChipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
