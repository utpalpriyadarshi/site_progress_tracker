/**
 * StatusFilterChips Component
 *
 * Filter chips for delivery status
 */

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { StatusFilter, STATUS_FILTER_OPTIONS } from '../utils/deliveryConstants';

interface StatusFilterChipsProps {
  selectedFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

export const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
    >
      {STATUS_FILTER_OPTIONS.map(({ status, label }) => {
        const isActive = selectedFilter === status;
        return (
          <TouchableOpacity
            key={status}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onFilterChange(status)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
  textActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
