import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Title,
  Paragraph,
  TextInput,
  Button,
  Card,
  Divider,
} from 'react-native-paper';
import { useAuth } from './AuthContext';
import { useSnackbar } from '../components/Snackbar';
import PasswordResetService from '../services/PasswordResetService';
import {
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordRequirements,
} from '../../utils/passwordValidator';
import { COLORS } from '../theme/colors';

/**
 * PasswordChangeScreen
 *
 * Allows users to change their own password
 * v2.2 - Activity 1, Week 3, Day 15
 *
 * Features:
 * - Current password verification
 * - Password strength validation
 * - Password reuse prevention
 * - Real-time password strength meter
 * - Password visibility toggle
 */

const PasswordChangeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!user) {
      showSnackbar('User not found', 'error');
      return;
    }

    // Validate all fields filled
    if (!currentPassword || !newPassword || !confirmPassword) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      showSnackbar(
        `Password validation failed:\n${validation.errors.join('\n')}`,
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await (PasswordResetService as any).changePasswordByUser(
        user.userId,
        currentPassword,
        newPassword
      );

      if (result.success) {
        showSnackbar('Password changed successfully! Please login again.', 'success');
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showSnackbar(result.details || result.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showSnackbar('Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = newPassword.length > 0 ? calculatePasswordStrength(newPassword) : null;

  return (
    <ScrollView style={styles.container}>
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Change Password</Title>
          <Paragraph style={styles.subtitle}>
            Update your password to keep your account secure
          </Paragraph>

          <Divider style={styles.divider} />

          {/* Current Password */}
          <TextInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            mode="outlined"
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
          />

          {/* New Password */}
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            mode="outlined"
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon
                icon={showNewPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
          />

          {/* Password Strength Meter */}
          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <Paragraph style={styles.strengthLabel}>
                Password Strength: <strong>{passwordStrength.label}</strong>
              </Paragraph>
              <View style={styles.strengthBarContainer}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Confirm Password */}
          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showNewPassword}
            mode="outlined"
            style={styles.input}
            disabled={loading}
          />

          {/* Password Match Error */}
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Paragraph style={styles.errorText}>Passwords do not match</Paragraph>
          )}

          <Divider style={styles.divider} />

          {/* Password Requirements */}
          <Paragraph style={styles.requirementsTitle}>Password Requirements:</Paragraph>
          {getPasswordRequirements().map((req, index) => (
            <Paragraph key={index} style={styles.requirement}>
              • {req}
            </Paragraph>
          ))}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleChangePassword}
              loading={loading}
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              style={styles.button}
            >
              Change Password
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Security Notice */}
      <Card mode="elevated" style={styles.noticeCard}>
        <Card.Content>
          <Paragraph style={styles.noticeText}>
            🔒 <strong>Security Notice:</strong> After changing your password, you will need to login
            again with your new password. All active sessions will be terminated.
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  strengthContainer: {
    marginBottom: 16,
    marginTop: -8,
  },
  strengthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  button: {
    minWidth: 120,
  },
  noticeCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: COLORS.WARNING_BG,
    elevation: 2,
  },
  noticeText: {
    fontSize: 12,
    color: '#E65100',
  },
});

export default PasswordChangeScreen;
