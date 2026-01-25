/**
 * CriticalPathSection Component (Shared)
 *
 * Milestone and Critical Path toggles with float days field.
 * Used by both ItemCreation and ItemEdit screens.
 *
 * @version 1.0.0
 * @since Phase 3 Code Improvements
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip } from 'react-native-paper';

interface CriticalPathSectionProps {
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  onMilestoneToggle: () => void;
  onCriticalPathToggle: () => void;
  onFloatDaysChange: (value: string) => void;
  /** When true, all fields are disabled (edit mode for locked items) */
  isLocked?: boolean;
}

export const CriticalPathSection: React.FC<CriticalPathSectionProps> = ({
  isMilestone,
  isCriticalPath,
  floatDays,
  onMilestoneToggle,
  onCriticalPathToggle,
  onFloatDaysChange,
  isLocked = false,
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

export default CriticalPathSection;
