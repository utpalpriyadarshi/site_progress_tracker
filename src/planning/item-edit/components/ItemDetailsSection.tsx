/**
 * ItemDetailsSection Component
 *
 * Item name, category, and phase selection fields
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import CategorySelector from '../../components/CategorySelector';
import PhaseSelector from '../../components/PhaseSelector';

interface ItemDetailsSectionProps {
  name: string;
  categoryId: string;
  phase: string;
  errors: Record<string, string>;
  isLocked: boolean;
  onNameChange: (text: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onPhaseChange: (phase: string) => void;
}

export const ItemDetailsSection: React.FC<ItemDetailsSectionProps> = ({
  name,
  categoryId,
  phase,
  errors,
  isLocked,
  onNameChange,
  onCategoryChange,
  onPhaseChange,
}) => {
  return (
    <>
      {/* Item Name */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Item Details
        </Text>
        <TextInput
          label="Item Name *"
          value={name}
          onChangeText={onNameChange}
          mode="outlined"
          error={!!errors.name}
          placeholder="e.g., Power Transformer Installation"
          disabled={isLocked}
        />
        {errors.name && (
          <HelperText type="error">{errors.name}</HelperText>
        )}
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Category *
        </Text>
        <CategorySelector
          value={categoryId}
          onSelect={onCategoryChange}
          error={errors.categoryId}
          disabled={isLocked}
        />
      </View>

      {/* Phase Selection */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Project Phase *
        </Text>
        <PhaseSelector
          value={phase as any}
          onSelect={(selectedPhase) => onPhaseChange(selectedPhase as string)}
          disabled={isLocked}
        />
      </View>
    </>
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
