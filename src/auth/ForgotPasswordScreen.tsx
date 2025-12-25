import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Portal, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import PasswordResetService from '../services/PasswordResetService';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    setLoading(true);

    try {
      const result = await PasswordResetService.sendPasswordResetRequest(email);

      if (result.success) {
        setEmailSent(true);
        setSnackbarMessage('Password reset email sent! Check your inbox.');
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to send reset request. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineMedium" style={styles.title}>
            Check Your Email
          </Text>

          <Text variant="bodyLarge" style={styles.successMessage}>
            We've sent a password reset link to:
          </Text>

          <Text variant="bodyLarge" style={styles.emailText}>
            {email}
          </Text>

          <Text variant="bodyMedium" style={styles.instructions}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </Text>

          <Text variant="bodyMedium" style={styles.instructions}>
            Don't see the email? Check your spam folder.
          </Text>

          <Button
            mode="outlined"
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
            style={styles.button}
          >
            Send Another Email
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
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
          Forgot Password?
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <TextInput
          label="Email Address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={!!emailError}
          style={styles.input}
          mode="outlined"
        />

        {emailError ? (
          <HelperText type="error" visible={!!emailError}>
            {emailError}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSendResetEmail}
          disabled={loading}
          loading={loading}
          style={styles.button}
        >
          Send Reset Link
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Login
        </Button>
      </ScrollView>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={5000}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  button: {
    marginTop: 16,
  },
  successMessage: {
    marginBottom: 16,
    color: '#666',
  },
  emailText: {
    marginBottom: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  instructions: {
    marginBottom: 16,
    color: '#666',
  },
});
