import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import PhaseSelector from '../../components/PhaseSelector';

import { ProjectPhase } from '../../../../models/ItemModel';

interface PhaseSectionProps {
  phase: string;
  onPhaseSelect: (phase: ProjectPhase) => void;
}

export const PhaseSection: React.FC<PhaseSectionProps> = ({
  phase,
  onPhaseSelect,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Project Phase *
      </Text>
      <PhaseSelector
        value={phase as ProjectPhase}
        onSelect={onPhaseSelect}
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
