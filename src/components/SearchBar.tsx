import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchBar Component
 *
 * A reusable search input with debouncing to prevent excessive filtering operations.
 * Uses React Native Paper's Searchbar for consistent Material Design styling.
 *
 * @param value - Current search value (controlled)
 * @param onChangeText - Callback fired after debounce delay
 * @param placeholder - Placeholder text (default: "Search...")
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 *
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search items..."
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Debounce logic: only call onChangeText after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeText(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChangeText]);

  // Sync external changes (e.g., when parent resets the search)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View style={styles.container}>
      <PaperSearchbar
        placeholder={placeholder}
        value={localValue}
        onChangeText={setLocalValue}
        style={styles.searchbar}
        iconColor="#666"
        clearIcon="close"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#fff',
  },
});
