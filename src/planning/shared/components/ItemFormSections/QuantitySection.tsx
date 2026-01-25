/**
 * QuantitySection Component (Shared)
 *
 * Planned quantity, completed quantity, unit, weightage, and progress display.
 * Used by both ItemCreation and ItemEdit screens.
 *
 * @version 1.0.0
 * @since Phase 3 Code Improvements
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';

interface QuantitySectionProps {
  quantity: string;
  completedQuantity: string;
  unit: string;
  onQuantityChange: (value: string) => void;
  onCompletedQuantityChange: (value: string) => void;
  onUnitChange: (text: string) => void;
  /** Optional weightage field (typically used in creation) */
  weightage?: string;
  onWeightageChange?: (value: string) => void;
  errors?: Record<string, string>;
  /** When true, all fields are disabled (edit mode for locked items) */
  isLocked?: boolean;
}

export const QuantitySection: React.FC<QuantitySectionProps> = ({
  quantity,
  completedQuantity,
  unit,
  onQuantityChange,
  onCompletedQuantityChange,
  onUnitChange,
  weightage,
  onWeightageChange,
  errors = {},
  isLocked = false,
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

      {/* Weightage field (optional - typically used in creation) */}
      {onWeightageChange && (
        <TextInput
          label="Weightage (%)"
          value={weightage || ''}
          onChangeText={onWeightageChange}
          mode="outlined"
          keyboardType="number-pad"
          placeholder="e.g., 10, 15, 20"
          style={styles.marginTop}
          disabled={isLocked}
        />
      )}

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

export default QuantitySection;
