/**
 * RiskSection Component (Shared)
 *
 * Dependency risk level selection and risk notes.
 * Used by both ItemCreation and ItemEdit screens.
 *
 * @version 1.0.0
 * @since Phase 3 Code Improvements
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, TextInput } from 'react-native-paper';

type RiskLevel = 'low' | 'medium' | 'high';

interface RiskSectionProps {
  dependencyRisk: RiskLevel | '';
  riskNotes: string;
  onRiskChange: (risk: RiskLevel) => void;
  onRiskNotesChange: (text: string) => void;
  /** When true, all fields are disabled (edit mode for locked items) */
  isLocked?: boolean;
}

export const RiskSection: React.FC<RiskSectionProps> = ({
  dependencyRisk,
  riskNotes,
  onRiskChange,
  onRiskNotesChange,
  isLocked = false,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Dependency Risk
      </Text>

      <View style={styles.chipContainer}>
        <Chip
          selected={dependencyRisk === 'low'}
          onPress={() => onRiskChange('low')}
          style={styles.chip}
          disabled={isLocked}
        >
          Low
        </Chip>
        <Chip
          selected={dependencyRisk === 'medium'}
          onPress={() => onRiskChange('medium')}
          style={styles.chip}
          disabled={isLocked}
        >
          Medium
        </Chip>
        <Chip
          selected={dependencyRisk === 'high'}
          onPress={() => onRiskChange('high')}
          style={styles.chip}
          disabled={isLocked}
        >
          High
        </Chip>
      </View>

      {dependencyRisk !== 'low' && (
        <TextInput
          label="Risk Notes"
          value={riskNotes}
          onChangeText={onRiskNotesChange}
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Describe the risk and mitigation plan"
          style={styles.marginTop}
          disabled={isLocked}
        />
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  marginTop: {
    marginTop: 8,
  },
});

export default RiskSection;
