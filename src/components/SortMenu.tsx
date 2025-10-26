import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, IconButton, Divider } from 'react-native-paper';

export interface SortOption {
  id: string;
  label: string;
  icon?: string;
}

interface SortMenuProps {
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (sortId: string) => void;
  sortDirection?: 'asc' | 'desc';
  onDirectionChange?: (direction: 'asc' | 'desc') => void;
}

/**
 * SortMenu Component
 *
 * A reusable dropdown menu for sorting list data with optional direction toggle.
 * Uses React Native Paper's Menu component for Material Design styling.
 *
 * @param sortOptions - Array of sort options to display
 * @param currentSort - Currently selected sort option ID
 * @param onSortChange - Callback when sort option changes
 * @param sortDirection - Current sort direction ('asc' or 'desc')
 * @param onDirectionChange - Optional callback for direction changes
 *
 * @example
 * ```tsx
 * const SORT_OPTIONS: SortOption[] = [
 *   { id: 'name', label: 'Name', icon: 'format-letter-case' },
 *   { id: 'date', label: 'Date', icon: 'calendar' },
 *   { id: 'progress', label: 'Progress', icon: 'chart-line' },
 * ];
 *
 * const [sortBy, setSortBy] = useState('name');
 * const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
 *
 * <SortMenu
 *   sortOptions={SORT_OPTIONS}
 *   currentSort={sortBy}
 *   onSortChange={setSortBy}
 *   sortDirection={sortDirection}
 *   onDirectionChange={setSortDirection}
 * />
 * ```
 */
export const SortMenu: React.FC<SortMenuProps> = ({
  sortOptions,
  currentSort,
  onSortChange,
  sortDirection = 'asc',
  onDirectionChange,
}) => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSortChange = (sortId: string) => {
    onSortChange(sortId);
    closeMenu();
  };

  const handleDirectionChange = (direction: 'asc' | 'desc') => {
    if (onDirectionChange) {
      onDirectionChange(direction);
      closeMenu();
    }
  };

  // Get icon for sort direction
  const getSortIcon = () => {
    if (!onDirectionChange) return 'sort';
    return sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending';
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <IconButton
            icon={getSortIcon()}
            size={24}
            onPress={openMenu}
            style={styles.button}
          />
        }
      >
        {/* Sort Options */}
        {sortOptions.map((option) => (
          <Menu.Item
            key={option.id}
            title={option.label}
            onPress={() => handleSortChange(option.id)}
            leadingIcon={option.icon}
            trailingIcon={currentSort === option.id ? 'check' : undefined}
          />
        ))}

        {/* Direction Toggle (if callback provided) */}
        {onDirectionChange && (
          <>
            <Divider />
            <Menu.Item
              title="Ascending"
              onPress={() => handleDirectionChange('asc')}
              leadingIcon="sort-ascending"
              trailingIcon={sortDirection === 'asc' ? 'check' : undefined}
            />
            <Menu.Item
              title="Descending"
              onPress={() => handleDirectionChange('desc')}
              leadingIcon="sort-descending"
              trailingIcon={sortDirection === 'desc' ? 'check' : undefined}
            />
          </>
        )}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    margin: 0,
  },
});
