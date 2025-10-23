/**
 * Dialog Types and Interfaces
 * Used for confirmation dialogs and critical user decisions
 */

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  destructive?: boolean; // If true, confirm button will be red
}
