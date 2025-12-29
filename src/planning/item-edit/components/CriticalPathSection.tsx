/**
 * CriticalPathSection Component
 *
 * Milestone and Critical Path toggles with float days field
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';

interface CriticalPathSectionProps {
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  isLocked: boolean;
  onMilestoneToggle: () => void;
  onCriticalPathToggle: () => void;
  onFloatDaysChange: (value: string) => void;
}

export const CriticalPathSection: React.FC<CriticalPathSectionProps> = ({
  isMilestone,
  isCriticalPath,
  floatDays,
  isLocked,
  onMilestoneToggle,
  onCriticalPathToggle,
  onFloatDaysChange,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Critical Path & Risk
      </Text>

      <View style={styles.chipContainer}>
        <Chip
          selected={isMilestone}
          onPress={onMilestoneToggle}
          style={styles.chip}
          icon={isMilestone ? 'star' : 'star-outline'}
          disabled={isLocked}
        >
          Milestone
        </Chip>

        <Chip
          selected={isCriticalPath}
          onPress={onCriticalPathToggle}
          style={styles.chip}
          icon={isCriticalPath ? 'alert-circle' : 'alert-circle-outline'}
          disabled={isLocked}
        >
          Critical Path
        </Chip>
      </View>

      {!isCriticalPath && (
        <TextInput
          label="Float Days"
          value={floatDays}
          onChangeText={onFloatDaysChange}
          mode="outlined"
          keyboardType="number-pad"
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
