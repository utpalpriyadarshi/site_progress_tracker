import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';

interface QuantitySectionProps {
  quantity: string;
  completedQuantity: string;
  unit: string;
  weightage: string;
  onQuantityChange: (value: string) => void;
  onCompletedQuantityChange: (value: string) => void;
  onUnitChange: (text: string) => void;
  onWeightageChange: (value: string) => void;
  error?: string;
}

export const QuantitySection: React.FC<QuantitySectionProps> = ({
  quantity,
  completedQuantity,
  unit,
  weightage,
  onQuantityChange,
  onCompletedQuantityChange,
  onUnitChange,
  onWeightageChange,
  error,
}) => {
  // Calculate progress percentage
  const progress = quantity && parseFloat(quantity) > 0
    ? Math.min(100, Math.round((parseFloat(completedQuantity) / parseFloat(quantity)) * 100))
    : 0;

  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Quantity & Progress
      </Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <TextInput
            label="Planned Quantity *"
            value={quantity}
            onChangeText={onQuantityChange}
            mode="outlined"
            keyboardType="number-pad"
            error={!!error}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextInput
            label="Completed Quantity"
            value={completedQuantity}
            onChangeText={onCompletedQuantityChange}
            mode="outlined"
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TextInput
        label="Unit of Measurement"
        value={unit}
        onChangeText={onUnitChange}
        mode="outlined"
        placeholder="e.g., Set, Meter, Cubic Meter"
        style={styles.marginTop}
      />

      <TextInput
        label="Weightage (%)"
        value={weightage}
        onChangeText={onWeightageChange}
        mode="outlined"
        keyboardType="number-pad"
        placeholder="e.g., 10, 15, 20"
        style={styles.marginTop}
      />

      <HelperText type="info">
        Progress: {progress}%
      </HelperText>
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  marginTop: {
    marginTop: 8,
  },
});
