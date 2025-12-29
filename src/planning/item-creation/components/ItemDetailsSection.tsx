import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';

interface ItemDetailsSectionProps {
  name: string;
  onNameChange: (text: string) => void;
  error?: string;
}

export const ItemDetailsSection: React.FC<ItemDetailsSectionProps> = ({
  name,
  onNameChange,
  error,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Item Details
      </Text>
      <TextInput
        label="Item Name *"
        value={name}
        onChangeText={onNameChange}
        mode="outlined"
        error={!!error}
        placeholder="e.g., Power Transformer Installation"
      />
      {error && (
        <HelperText type="error">{error}</HelperText>
      )}
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
