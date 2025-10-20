/**
 * CategorySelector - Dropdown component for selecting item category
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Menu, Button, ActivityIndicator } from 'react-native-paper';
import { database } from '../../../models/database';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategorySelectorProps {
  value: string;
  onSelect: (categoryId: string) => void;
  error?: string;
  disabled?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onSelect,
  error,
  disabled = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Find and set selected category when value changes
    if (value && categories.length > 0) {
      const category = categories.find(c => c.id === value);
      setSelectedCategory(category || null);
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesCollection = database.collections.get('categories');
      const fetchedCategories = await categoriesCollection.query().fetch();

      const categoryData: Category[] = fetchedCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
      }));

      setCategories(categoryData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    onSelect(category.id);
    setMenuVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => !disabled && setMenuVisible(true)}
            icon="chevron-down"
            contentStyle={styles.buttonContent}
            style={[
              styles.button,
              error ? styles.buttonError : null,
            ]}
            disabled={disabled}
          >
            {selectedCategory ? selectedCategory.name : 'Select Category *'}
          </Button>
        }
      >
        <ScrollView style={styles.menuScroll}>
          {categories.map((category) => (
            <Menu.Item
              key={category.id}
              onPress={() => handleSelectCategory(category)}
              title={category.name}
              titleStyle={
                selectedCategory?.id === category.id
                  ? styles.selectedMenuItem
                  : null
              }
              leadingIcon={
                selectedCategory?.id === category.id ? 'check' : undefined
              }
            />
          ))}
        </ScrollView>
      </Menu>

      {selectedCategory && selectedCategory.description && (
        <Text variant="bodySmall" style={styles.description}>
          {selectedCategory.description}
        </Text>
      )}

      {error && (
        <Text variant="bodySmall" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  button: {
    justifyContent: 'flex-start',
  },
  buttonError: {
    borderColor: '#B00020',
  },
  buttonContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  menuScroll: {
    maxHeight: 300,
  },
  selectedMenuItem: {
    fontWeight: 'bold',
    color: '#6200EE',
  },
  description: {
    marginTop: 4,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    marginTop: 4,
    color: '#B00020',
  },
});

export default CategorySelector;
