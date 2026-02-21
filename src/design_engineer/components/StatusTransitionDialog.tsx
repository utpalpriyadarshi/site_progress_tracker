import React, { useState, useEffect } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Dialog, Button, TextInput, Paragraph } from 'react-native-paper';

export type TransitionStage = 'received' | 'reviewed' | 'approved' | 'closed';

interface StatusTransitionDialogProps {
  visible: boolean;
  stage: TransitionStage;
  onConfirm: (data: { remarks: string }) => void;
  onDismiss: () => void;
}

const STAGE_CONFIG: Record<TransitionStage, { title: string; prompt: string; label: string; action: string }> = {
  received: {
    title: 'Mark as Received',
    prompt: 'Add remarks about receiving this DOORS package.',
    label: 'Received Remarks (optional)',
    action: 'Mark Received',
  },
  reviewed: {
    title: 'Mark as Reviewed',
    prompt: 'Add your review observations for this DOORS package.',
    label: 'Review Observations (optional)',
    action: 'Mark Reviewed',
  },
  approved: {
    title: 'Approve Package',
    prompt: 'Add approval remarks for this DOORS package.',
    label: 'Approval Remarks (optional)',
    action: 'Approve',
  },
  closed: {
    title: 'Close Package',
    prompt: 'Add closure remarks before closing this package.',
    label: 'Closure Remarks (optional)',
    action: 'Close Package',
  },
};

const StatusTransitionDialog: React.FC<StatusTransitionDialogProps> = ({
  visible,
  stage,
  onConfirm,
  onDismiss,
}) => {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (visible) {
      setRemarks('');
    }
  }, [visible]);

  const config = STAGE_CONFIG[stage];

  const handleConfirm = () => {
    onConfirm({ remarks });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{config.title}</Dialog.Title>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <Dialog.Content>
            <Paragraph>{config.prompt}</Paragraph>
            <TextInput
              label={config.label}
              value={remarks}
              onChangeText={setRemarks}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
        </KeyboardAvoidingView>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleConfirm}>{config.action}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  input: {
    marginTop: 8,
  },
});

export default StatusTransitionDialog;
