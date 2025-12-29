/**
 * RiskSection Component
 *
 * Dependency risk level selection and risk notes
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';

interface RiskSectionProps {
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
  isLocked: boolean;
  onRiskChange: (risk: 'low' | 'medium' | 'high') => void;
  onRiskNotesChange: (text: string) => void;
}

export const RiskSection: React.FC<RiskSectionProps> = ({
  dependencyRisk,
  riskNotes,
  isLocked,
  onRiskChange,
  onRiskNotesChange,
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
