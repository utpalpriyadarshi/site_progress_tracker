/**
 * ConfirmDialog Component
 * Reusable confirmation dialog for critical actions
 */

import React, { useState } from 'react';
import { Dialog, Portal, Button, Paragraph } from 'react-native-paper';
import { ConfirmDialogProps } from './types';

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onCancel}
            disabled={loading}
            textColor="#666"
          >
            {cancelText}
          </Button>
          <Button
            onPress={handleConfirm}
            loading={loading}
            disabled={loading}
            textColor={destructive ? '#F44336' : '#2196F3'}
            mode="text"
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmDialog;
