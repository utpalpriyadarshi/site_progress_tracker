import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

interface FilterChipsProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterToggle: (filterId: string) => void;
  multiSelect?: boolean;
}

/**
 * FilterChips Component
 *
 * A reusable filter chip group with multi-select or single-select mode.
 * Displays horizontally scrollable chips for filtering list data.
 *
 * @param filters - Array of filter options to display
 * @param selectedFilters - Array of currently selected filter IDs
 * @param onFilterToggle - Callback when a filter is toggled
 * @param multiSelect - Allow multiple selections (default: true)
 *
 * @example
 * ```tsx
 * const STATUS_FILTERS: FilterOption[] = [
 *   { id: 'all', label: 'All' },
 *   { id: 'not_started', label: 'Not Started', icon: 'circle-outline' },
 *   { id: 'in_progress', label: 'In Progress', icon: 'progress-clock' },
 *   { id: 'completed', label: 'Completed', icon: 'check-circle' },
 * ];
 *
 * const [selectedStatus, setSelectedStatus] = useState(['all']);
 *
 * <FilterChips
 *   filters={STATUS_FILTERS}
 *   selectedFilters={selectedStatus}
 *   onFilterToggle={(id) => {
 *     if (id === 'all') {
 *       setSelectedStatus(['all']);
 *     } else {
 *       const newFilters = selectedStatus.includes(id)
 *         ? selectedStatus.filter(f => f !== id)
 *         : [...selectedStatus.filter(f => f !== 'all'), id];
 *       setSelectedStatus(newFilters.length === 0 ? ['all'] : newFilters);
 *     }
 *   }}
 * />
 * ```
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  selectedFilters,
  onFilterToggle,
  multiSelect = true,
}) => {
  const handleToggle = (filterId: string) => {
    if (!multiSelect) {
      // Single select mode: only one filter active at a time
      onFilterToggle(filterId);
    } else {
      // Multi-select mode: parent handles the logic
      onFilterToggle(filterId);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isSelected = selectedFilters.includes(filter.id);

          return (
            <Chip
              key={filter.id}
              selected={isSelected}
              onPress={() => handleToggle(filter.id)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                filter.color && isSelected && { backgroundColor: filter.color },
              ]}
              icon={filter.icon}
              textStyle={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
              mode="outlined"
            >
              {filter.label}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
