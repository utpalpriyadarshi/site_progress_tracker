/**
 * QuantitySection Component
 *
 * Planned quantity, completed quantity, unit, and progress display
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';

interface QuantitySectionProps {
  quantity: string;
  completedQuantity: string;
  unit: string;
  errors: Record<string, string>;
  isLocked: boolean;
  onQuantityChange: (value: string) => void;
  onCompletedQuantityChange: (value: string) => void;
  onUnitChange: (text: string) => void;
}

export const QuantitySection: React.FC<QuantitySectionProps> = ({
  quantity,
  completedQuantity,
  unit,
  errors,
  isLocked,
  onQuantityChange,
  onCompletedQuantityChange,
  onUnitChange,
}) => {
  // Calculate progress percentage
  const progressPercentage = quantity && parseFloat(quantity) > 0
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
            error={!!errors.quantity}
            disabled={isLocked}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextInput
            label="Completed Quantity"
            value={completedQuantity}
            onChangeText={onCompletedQuantityChange}
            mode="outlined"
            keyboardType="number-pad"
            disabled={isLocked}
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
        disabled={isLocked}
      />

      <HelperText type="info">
        Progress: {progressPercentage}%
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
