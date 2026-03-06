import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../../theme/colors';

type Discipline = 'all' | 'tss' | 'ohe' | 'general';

const DISCIPLINE_CHIPS: { id: Discipline; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'tss',     label: 'TSS' },
  { id: 'ohe',     label: 'OHE' },
  { id: 'general', label: 'General' },
];

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDiscipline?: Discipline;
  onDisciplineChange?: (discipline: Discipline) => void;
  // kept for backward compat — ignored
  selectedCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
}

/**
 * SearchAndFilters — discipline chip row + search bar.
 * Category filter removed: Metro categories don't map to BOM item data.
 */
export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedDiscipline = 'all',
  onDisciplineChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Discipline filter chips */}
      <View style={styles.chipRow}>
        {DISCIPLINE_CHIPS.map((chip) => {
          const active = selectedDiscipline === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onDisciplineChange?.(chip.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => onSearchChange('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
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
});
