/**
 * ConfirmDialog Component (Enhanced)
 *
 * Reusable confirmation dialog for critical actions
 * Enhanced version with more customization options
 *
 * Features:
 * - Async action support with loading state
 * - Destructive action styling
 * - Customizable button text and colors
 * - Optional icon support
 * - Consistent styling with other dialogs
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   visible={showDeleteConfirm}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmText="Delete"
 *   cancelText="Cancel"
 *   destructive={true}
 *   onConfirm={async () => {
 *     await deleteItem();
 *     setShowDeleteConfirm(false);
 *   }}
 *   onCancel={() => setShowDeleteConfirm(false)}
 * />
 * ```
 *
 * @version 2.0 - Phase 2, Task 2.2.3 (Enhanced from original)
 */

import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Paragraph, useTheme } from 'react-native-paper';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface ConfirmDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Dialog title */
  title: string;

  /** Confirmation message */
  message: string;

  /** Confirm button text (default: "Confirm") */
  confirmText?: string;

  /** Cancel button text (default: "Cancel") */
  cancelText?: string;

  /** Callback when confirmed (can be async) */
  onConfirm: () => void | Promise<void>;

  /** Callback when cancelled */
  onCancel: () => void;

  /** Show destructive styling (red color) */
  destructive?: boolean;

  /** Custom confirm button color (overrides destructive) */
  confirmColor?: string;

  /** Dismiss on backdrop press (default: true) */
  dismissable?: boolean;

  /** Show confirm button as contained (default: text) */
  containedConfirm?: boolean;
}

// ==================== Component ====================

/**
 * ConfirmDialog Component
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
  confirmColor,
  dismissable = true,
  containedConfirm = false,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  /**
   * Handle confirm action with loading state
   */
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('ConfirmDialog: Error during confirmation', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get confirm button color
   */
  const getConfirmColor = (): string => {
    if (confirmColor) return confirmColor;
    if (destructive) return COLORS.ERROR; // Red for destructive
    return theme.colors.primary;
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={dismissable && !loading ? onCancel : undefined}
        style={styles.dialog}
      >
        {/* Title */}
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>

        {/* Message */}
        <Dialog.Content>
          <Paragraph style={styles.message}>{message}</Paragraph>
        </Dialog.Content>

        {/* Actions */}
        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onCancel}
            disabled={loading}
            textColor={theme.colors.onSurface}
          >
            {cancelText}
          </Button>

          <Button
            onPress={handleConfirm}
            loading={loading}
            disabled={loading}
            mode={containedConfirm ? 'contained' : 'text'}
            buttonColor={containedConfirm ? getConfirmColor() : undefined}
            textColor={containedConfirm ? undefined : getConfirmColor()}
            style={styles.confirmButton}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmButton: {
    marginLeft: 8,
  },
});

// Export as default for backward compatibility
export default ConfirmDialog;
