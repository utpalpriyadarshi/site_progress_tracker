/**
 * FormDialog Component
 *
 * Reusable dialog wrapper for form inputs
 * Provides consistent UI for all form dialogs across the app
 *
 * Features:
 * - Scrollable content area for long forms
 * - Standard Save/Cancel actions
 * - Optional save button disable
 * - Consistent styling
 * - Portal-based rendering
 *
 * @example
 * ```tsx
 * <FormDialog
 *   visible={dialogVisible}
 *   title="Update Progress"
 *   onClose={closeDialog}
 *   onSave={handleSave}
 *   saveDisabled={!isValid}
 * >
 *   <TextInput label="Quantity" value={quantity} onChangeText={setQuantity} />
 *   <TextInput label="Notes" value={notes} onChangeText={setNotes} />
 * </FormDialog>
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.3
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Dialog, Portal, Button, useTheme } from 'react-native-paper';

// ==================== Types ====================

export interface FormDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Dialog title */
  title: string;

  /** Callback when dialog should close (Cancel button or backdrop tap) */
  onClose: () => void;

  /** Callback when Save button is pressed */
  onSave: () => void;

  /** Form content */
  children: React.ReactNode;

  /** Disable save button (for validation) */
  saveDisabled?: boolean;

  /** Custom save button text (default: "Save") */
  saveText?: string;

  /** Custom cancel button text (default: "Cancel") */
  cancelText?: string;

  /** Show loading state on save button */
  saveLoading?: boolean;

  /** Max height for scrollable content (default: 400) */
  maxHeight?: number;

  /** Dismiss on backdrop press (default: true) */
  dismissable?: boolean;
}

// ==================== Component ====================

/**
 * FormDialog Component
 */
export const FormDialog: React.FC<FormDialogProps> = ({
  visible,
  title,
  onClose,
  onSave,
  children,
  saveDisabled = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  saveLoading = false,
  maxHeight = 400,
  dismissable = true,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={dismissable ? onClose : undefined}
        style={styles.dialog}
      >
        {/* Dialog Title */}
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>

        {/* Scrollable Content Area */}
        <Dialog.ScrollArea style={[styles.scrollArea, { maxHeight }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>
        </Dialog.ScrollArea>

        {/* Action Buttons */}
        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onClose}
            textColor={theme.colors.onSurface}
            disabled={saveLoading}
          >
            {cancelText}
          </Button>

          <Button
            mode="contained"
            onPress={onSave}
            disabled={saveDisabled}
            loading={saveLoading}
            style={styles.saveButton}
          >
            {saveText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveButton: {
    marginLeft: 8,
  },
});
