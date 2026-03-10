import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Portal, Snackbar } from 'react-native-paper';
import { SpinnerLoading } from '../components/common/LoadingState';
import { useNavigation, useRoute } from '@react-navigation/native';
import PasswordResetService from '../services/PasswordResetService';
import { useSnackbar } from '../hooks/useSnackbar';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { token?: string; email?: string } | undefined;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!params?.token || !params?.email) {
        setErrorMessage('Invalid reset link. Missing token or email.');
        setTokenValid(false);
        setValidatingToken(false);
        return;
      }

      const result = await PasswordResetService.validateToken(params.token, params.email);
      setTokenValid(result.valid);
      if (!result.valid) {
        setErrorMessage(result.message);
      }
      setValidatingToken(false);
    };

    validateToken();
  }, [params?.token, params?.email]);

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    return null;
  };

  const handleResetPassword = async () => {
    // Validate new password
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    setLoading(true);

    if (!params?.token || !params?.email) {
      showSnackbar('Invalid reset link.');
      setLoading(false);
      return;
    }

    try {
      const result = await PasswordResetService.resetPassword(
        params.token,
        params.email,
        newPassword
      );

      if (result.success) {
        showSnackbar('Password reset successful! Redirecting...');

        // Navigate to login after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 2000);
      } else {
        showSnackbar(result.message);
      }
    } catch (error) {
      showSnackbar('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): string => {
    if (!newPassword) return '';

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const isLongEnough = newPassword.length >= 8;

    const strength = [hasUppercase, hasLowercase, hasNumber, hasSpecial, isLongEnough]
      .filter(Boolean).length;

    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    if (strength <= 4) return 'Strong';
    return 'Very Strong';
  };

  const getPasswordStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength === 'Weak') return '#f44336';
    if (strength === 'Medium') return '#ff9800';
    if (strength === 'Strong') return '#4caf50';
    if (strength === 'Very Strong') return '#2196f3';
    return '#666';
  };

  // Show loading while validating token
  if (validatingToken) {
    return <SpinnerLoading message="Validating reset link..." />;
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={[styles.title, { color: '#f44336' }]}>
            Invalid Reset Link
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            {errorMessage}
          </Text>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('ForgotPassword' as never)}
            style={styles.button}
          >
            Request New Reset Link
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login' as never)}
            style={styles.button}
          >
            Back to Login
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Reset Your Password
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your new password below.
        </Text>

        <TextInput
          label="New Password"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
          autoCapitalize="none"
          error={!!passwordError}
          style={styles.input}
          mode="outlined"
        />

        {newPassword && !passwordError ? (
          <HelperText type="info" visible style={{ color: getPasswordStrengthColor() }}>
            Password strength: {getPasswordStrength()}
          </HelperText>
        ) : null}

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
          autoCapitalize="none"
          error={!!passwordError}
          style={styles.input}
          mode="outlined"
        />

        {passwordError ? (
          <HelperText type="error" visible={!!passwordError}>
            {passwordError}
          </HelperText>
        ) : null}

        <Text variant="bodySmall" style={styles.requirements}>
          Password requirements:
          {'\n'}• At least 8 characters
          {'\n'}• One uppercase letter
          {'\n'}• One lowercase letter
          {'\n'}• One number
        </Text>

        <Button
          mode="contained"
          onPress={handleResetPassword}
          disabled={loading || !newPassword || !confirmPassword}
          loading={loading}
          style={styles.button}
        >
          Reset Password
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login' as never)}
          style={styles.button}
        >
          Back to Login
        </Button>
      </ScrollView>

      <Portal>
        <Snackbar {...snackbarProps} duration={5000} />
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  requirements: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  button: {
    marginTop: 16,
  },
});
