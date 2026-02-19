/**
 * DuplicateDocumentsDialog.tsx
 *
 * Dialog for handling duplicate document numbers during copy operation
 * Similar to DuplicateItemsDialog pattern
 *
 * Features:
 * - Shows list of duplicate document numbers
 * - Options to skip duplicates or create all
 * - Clear explanation of consequences
 *
 * @version 1.0
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, Button, Text, Divider, Chip } from 'react-native-paper';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface DuplicateDocumentsDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Array of duplicate document numbers */
  duplicateNumbers: string[];

  /** Callback when user chooses to skip duplicates */
  onSkip: () => void;

  /** Callback when user chooses to create all (including duplicates) */
  onCreateAll: () => void;

  /** Callback when user cancels */
  onCancel: () => void;
}

// ==================== Component ====================

export const DuplicateDocumentsDialog: React.FC<DuplicateDocumentsDialogProps> = ({
  visible,
  duplicateNumbers,
  onSkip,
  onCreateAll,
  onCancel,
}) => {
  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={styles.dialog}
      >
        <Dialog.Title style={styles.title}>Duplicate Documents Found</Dialog.Title>

        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Warning message */}
            <Text variant="bodyMedium" style={styles.message}>
              The following document numbers already exist in the destination site:
            </Text>

            {/* Duplicate list */}
            <View style={styles.duplicateList}>
              {duplicateNumbers.map((docNumber, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  icon="file-document-alert"
                  style={styles.duplicateChip}
                  textStyle={styles.duplicateText}
                >
                  {docNumber}
                </Chip>
              ))}
            </View>

            <Divider style={styles.divider} />

            {/* Options explanation */}
            <View style={styles.optionsSection}>
              <Text variant="titleSmall" style={styles.optionsTitle}>
                How would you like to proceed?
              </Text>

              {/* Skip option */}
              <View style={styles.optionCard}>
                <Text variant="labelLarge" style={styles.optionLabel}>
                  ✓ Skip Duplicates
                </Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Copy only documents that don't exist in the destination.
                  {duplicateNumbers.length} document(s) will be skipped.
                </Text>
              </View>

              {/* Create all option */}
              <View style={styles.optionCard}>
                <Text variant="labelLarge" style={styles.optionLabel}>
                  ⚠️ Create All
                </Text>
                <Text variant="bodySmall" style={styles.optionDescription}>
                  Create duplicate documents with the same document numbers.
                  You will have multiple documents with identical numbers.
                </Text>
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.actions}>
          <Button onPress={onCancel}>
            Cancel
          </Button>
          <Button
            mode="outlined"
            onPress={onCreateAll}
            style={styles.createAllButton}
          >
            Create All
          </Button>
          <Button
            mode="contained"
            onPress={onSkip}
            style={styles.skipButton}
          >
            Skip Duplicates
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D32F2F',
  },
  scrollArea: {
    paddingHorizontal: 0,
    maxHeight: 500,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  message: {
    marginBottom: 16,
    lineHeight: 22,
    color: '#666',
  },
  duplicateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  duplicateChip: {
    marginBottom: 4,
    backgroundColor: COLORS.ERROR_BG,
    borderColor: '#EF5350',
  },
  duplicateText: {
    color: '#C62828',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  optionsSection: {
    marginBottom: 8,
  },
  optionsTitle: {
    marginBottom: 12,
    fontWeight: '600',
    color: '#333',
  },
  optionCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.INFO,
  },
  optionLabel: {
    marginBottom: 4,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    color: '#666',
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createAllButton: {
    marginLeft: 8,
  },
  skipButton: {
    marginLeft: 8,
  },
});

export default DuplicateDocumentsDialog;
