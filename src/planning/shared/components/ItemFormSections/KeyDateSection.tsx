/**
 * KeyDateSection Component (Shared)
 *
 * Key Date linking section for item forms.
 * Allows items to be linked to project key dates for tracking.
 * Used by both ItemCreation and ItemEdit screens.
 *
 * @version 1.0.0
 * @since Phase 5c - Key Dates Integration
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { KeyDateSelector } from '../../../key-dates/components';

interface KeyDateSectionProps {
  projectId: string;
  keyDateId: string | null;
  onKeyDateChange: (keyDateId: string | null) => void;
  /** When true, the selector is disabled (edit mode for locked items) */
  isLocked?: boolean;
}

export const KeyDateSection: React.FC<KeyDateSectionProps> = ({
  projectId,
  keyDateId,
  onKeyDateChange,
  isLocked = false,
}) => {
  // Don't render if no project is selected
  if (!projectId) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Key Date Linking
      </Text>
      <Text variant="bodySmall" style={styles.helperText}>
        Link this item to a project key date for timeline tracking
      </Text>
      <KeyDateSelector
        projectId={projectId}
        selectedKeyDateId={keyDateId}
        onSelect={onKeyDateChange}
        disabled={isLocked}
        label=""
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
});

export default KeyDateSection;
