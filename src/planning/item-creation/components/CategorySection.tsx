import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import CategorySelector from '../../components/CategorySelector';

interface CategorySectionProps {
  categoryId: string;
  onCategorySelect: (categoryId: string) => void;
  error?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  onCategorySelect,
  error,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Category *
      </Text>
      <CategorySelector
        value={categoryId}
        onSelect={onCategorySelect}
        error={error}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
});
