import React from 'react';
import { StyleSheet } from 'react-native';
import { Menu, Button } from 'react-native-paper';
import { COST_CATEGORIES, getCategoryLabel } from '../utils';

interface CategoryFilterMenuProps {
  visible: boolean;
  onDismiss: () => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilterMenu: React.FC<CategoryFilterMenuProps> = ({
  visible,
  onDismiss,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <Menu
      visible={visible}
      onDismiss={onDismiss}
      anchor={
        <Button mode="outlined" onPress={onDismiss} style={styles.filterButton}>
          {selectedCategory ? getCategoryLabel(selectedCategory) : 'All Categories'}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => {
          onSelectCategory(null);
          onDismiss();
        }}
        title="All Categories"
      />
      {COST_CATEGORIES.map((cat) => (
        <Menu.Item
          key={cat.value}
          onPress={() => {
            onSelectCategory(cat.value);
            onDismiss();
          }}
          title={cat.label}
        />
      ))}
    </Menu>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    borderColor: '#007AFF',
  },
});
