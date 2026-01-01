import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Title,
  Paragraph,
  TextInput,
  Button,
  Divider,
} from 'react-native-paper';
import UserModel from '../../../../models/UserModel';
import {
  calculatePasswordStrength,
  getPasswordRequirements,
} from '../../../../utils/passwordValidator';

interface PasswordResetDialogProps {
  visible: boolean;
  userToReset: UserModel | null;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  loading: boolean;
  onDismiss: () => void;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onTogglePasswordVisibility: () => void;
  onResetPassword: () => void;
}

export const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({
  visible,
  userToReset,
  newPassword,
  confirmPassword,
  showPassword,
  loading,
  onDismiss,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onTogglePasswordVisibility,
  onResetPassword,
}) => {
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    !loading && newPassword && confirmPassword && passwordsMatch;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
        <ScrollView>
          <Title style={styles.modalTitle}>Reset Password</Title>
          <Paragraph style={styles.modalSubtitle}>
            Reset password for: {userToReset?.fullName} ({userToReset?.username})
          </Paragraph>
          <Divider style={{ marginVertical: 16 }} />

          <Paragraph style={styles.requirementsTitle}>Password Requirements:</Paragraph>
          {getPasswordRequirements().map((req, index) => (
            <Paragraph key={index} style={styles.requirement}>
              • {req}
            </Paragraph>
          ))}

          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={onNewPasswordChange}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={onTogglePasswordVisibility}
              />
            }
          />

          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <Paragraph style={styles.strengthLabel}>
                Password Strength: {calculatePasswordStrength(newPassword).label}
              </Paragraph>
              <View
                style={[
                  styles.strengthBar,
                  {
                    width: `${(calculatePasswordStrength(newPassword).score / 6) * 100}%`,
                    backgroundColor: calculatePasswordStrength(newPassword).color,
                  },
                ]}
              />
            </View>
          )}

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={styles.input}
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Paragraph style={styles.errorText}>Passwords do not match</Paragraph>
          )}

          <View style={styles.dialogActions}>
            <Button onPress={onDismiss} disabled={loading}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={onResetPassword}
              loading={loading}
              disabled={!canSubmit}
            >
              Reset Password
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  input: {
    marginBottom: 15,
  },
  strengthContainer: {
    marginBottom: 15,
  },
  strengthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
});
