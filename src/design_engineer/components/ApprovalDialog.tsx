import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Dialog, Button, TextInput, Paragraph } from 'react-native-paper';

interface ApprovalDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  action: 'submit' | 'approve' | 'approve_with_comment' | 'reject' | null;
  comment: string;
  onCommentChange: (comment: string) => void;
}

const getActionTitle = (action: ApprovalDialogProps['action']): string => {
  switch (action) {
    case 'submit':
      return 'Submit Document';
    case 'approve':
      return 'Approve Document';
    case 'approve_with_comment':
      return 'Approve with Comment';
    case 'reject':
      return 'Reject Document';
    default:
      return '';
  }
};

const getActionMessage = (action: ApprovalDialogProps['action']): string => {
  switch (action) {
    case 'submit':
      return 'Are you sure you want to submit this document for approval?';
    case 'approve':
      return 'Are you sure you want to approve this document?';
    case 'approve_with_comment':
      return 'Please provide a comment for approval:';
    case 'reject':
      return 'Please provide a reason for rejection:';
    default:
      return '';
  }
};

const requiresComment = (action: ApprovalDialogProps['action']): boolean => {
  return action === 'approve_with_comment' || action === 'reject';
};

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  action,
  comment,
  onCommentChange,
}) => {
  const needsComment = requiresComment(action);
  const isConfirmDisabled = needsComment && !comment.trim();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{getActionTitle(action)}</Dialog.Title>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <Dialog.Content>
            <Paragraph>{getActionMessage(action)}</Paragraph>
            {needsComment && (
              <TextInput
                label="Comment *"
                value={comment}
                onChangeText={onCommentChange}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            )}
          </Dialog.Content>
        </KeyboardAvoidingView>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm} disabled={isConfirmDisabled}>
            Confirm
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  input: {
    marginTop: 12,
  },
});

export default ApprovalDialog;
