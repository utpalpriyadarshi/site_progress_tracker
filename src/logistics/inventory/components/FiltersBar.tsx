import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { StatusFilter, ABCFilter, STATUS_LABELS } from '../utils';

interface FiltersBarProps {
  searchQuery: string;
  statusFilter: StatusFilter;
  abcFilter: ABCFilter;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onABCFilterChange: (filter: ABCFilter) => void;
}

/**
 * FiltersBar Component
 *
 * Combined search and filter controls for inventory management.
 * Includes search input, status filters, and ABC category filters.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 3.
 */
export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  statusFilter,
  abcFilter,
  onSearchChange,
  onStatusFilterChange,
  onABCFilterChange,
}) => {
  const statusFilters: Array<{ value: StatusFilter; label: string }> = [
    { value: 'all', label: 'All Status' },
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'overstocked', label: 'Overstocked' },
  ];

  const abcFilters: Array<{ value: ABCFilter; label: string }> = [
    { value: 'all', label: 'All ABC' },
    { value: 'A', label: 'Category A' },
    { value: 'B', label: 'Category B' },
    { value: 'C', label: 'Category C' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search inventory..."
        placeholderTextColor="#9ca3af"
        value={searchQuery}
        onChangeText={onSearchChange}
      />

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {statusFilters.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, statusFilter === value && styles.filterChipActive]}
            onPress={() => onStatusFilterChange(value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === value && styles.filterChipTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ABC Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {abcFilters.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, abcFilter === value && styles.filterChipActive]}
            onPress={() => onABCFilterChange(value)}
          >
            <Text
              style={[
                styles.filterChipText,
                abcFilter === value && styles.filterChipTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterScrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
});
