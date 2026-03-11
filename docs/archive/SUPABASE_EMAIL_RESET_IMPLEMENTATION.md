# Supabase Email Reset - Implementation Guide

**Document Version**: 1.0
**Created**: 2025-12-23
**Status**: Implementation Ready
**Related**: PASSWORD_RESET_PLAN_V2.0_RECOMMENDATION.md

---

## Overview

This guide provides step-by-step instructions for implementing email-based password reset using Supabase for the Site Progress Tracker app.

### Why Supabase?
- ✅ FREE tier (50,000 monthly active users)
- ✅ Email authentication built-in
- ✅ No backend server management needed
- ✅ Production-ready security
- ✅ Setup time: 1-2 days

### What You'll Build:
1. Supabase project setup
2. Email authentication configuration
3. React Native integration
4. Password reset flow (email-based)
5. User profile with email management

**Timeline**: 3-5 days for complete implementation

---

## Phase 1: Supabase Project Setup (Day 1 - 2 hours)

### Step 1.1: Create Supabase Account

1. **Go to**: https://supabase.com
2. **Click**: "Start your project"
3. **Sign up** with GitHub (recommended) or email
4. **Verify** your email address

### Step 1.2: Create New Project

1. **Click**: "New Project"
2. **Fill in details**:
   ```
   Organization: Create new (or select existing)
   Project Name: site-progress-tracker
   Database Password: [Generate strong password - SAVE THIS!]
   Region: Choose closest to your users
   Pricing Plan: Free
   ```
3. **Click**: "Create new project"
4. **Wait**: ~2 minutes for project to initialize

### Step 1.3: Get Project Credentials

Once project is ready:

1. **Go to**: Project Settings → API
2. **Copy and save** these values:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
   ```

3. **Create** `.env` file in project root:
   ```bash
   # .env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Add to** `.gitignore`:
   ```
   .env
   .env.local
   ```

---

## Phase 2: Configure Email Authentication (Day 1 - 1 hour)

### Step 2.1: Enable Email Provider

1. **Go to**: Authentication → Providers
2. **Find**: Email provider (should be enabled by default)
3. **Confirm** these settings:
   ```
   Enable Email provider: ON
   Confirm email: ON (recommended)
   Secure email change: ON
   ```

### Step 2.2: Configure Email Templates

1. **Go to**: Authentication → Email Templates
2. **Customize** "Reset Password" template:

```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>Click the link below to reset your password for Site Progress Tracker:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>This link expires in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p>Best regards,<br>Site Progress Tracker Team</p>
```

3. **Customize** "Confirm Signup" template:

```html
<h2>Welcome to Site Progress Tracker!</h2>

<p>Hi {{ .Data.username }},</p>

<p>Thank you for signing up! Click the link below to confirm your email address:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>

<p>This link expires in 24 hours.</p>

<p>Best regards,<br>Site Progress Tracker Team</p>
```

4. **Save** templates

### Step 2.3: Configure Redirect URLs

1. **Go to**: Authentication → URL Configuration
2. **Add** redirect URLs for your app:
   ```
   Site URL: https://your-app-domain.com

   Redirect URLs (add all):
   - myapp://reset-password
   - myapp://auth-callback
   - http://localhost:19006/reset-password (for Expo development)
   - http://localhost:3000/reset-password (for web testing)
   ```

3. **Save** configuration

---

## Phase 3: Install Dependencies (Day 1 - 30 min)

### Step 3.1: Install Supabase Client

```bash
npm install @supabase/supabase-js

# For React Native deep linking
npm install react-native-url-polyfill

# For secure storage of tokens
npm install @react-native-async-storage/async-storage

# For environment variables
npm install react-native-dotenv
```

### Step 3.2: Configure TypeScript (if using)

Create `src/types/supabase.ts`:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

---

## Phase 4: Create Supabase Service (Day 1-2 - 2 hours)

### Step 4.1: Create Supabase Client

Create `src/services/supabase/supabaseClient.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { Database } from '../../types/supabase';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Step 4.2: Create Authentication Service

Create `src/services/supabase/SupabaseAuthService.ts`:

```typescript
import { supabase } from './supabaseClient';
import { LoggingService } from '../LoggingService';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
}

class SupabaseAuthService {
  private static instance: SupabaseAuthService;
  private logger: LoggingService;

  private constructor() {
    this.logger = LoggingService.getInstance();
  }

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      this.logger.info('Sending password reset email', {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
        email,
      });

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) {
        this.logger.error('Password reset email failed', error, {
          component: 'SupabaseAuthService',
          action: 'sendPasswordResetEmail',
          email,
        });

        return {
          success: false,
          message: 'Failed to send reset email. Please try again.',
          error,
        };
      }

      this.logger.info('Password reset email sent successfully', {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
        email,
      });

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      this.logger.error('Unexpected error sending password reset', error as Error, {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Update user password (after clicking email link)
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      this.logger.info('Updating user password', {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
      });

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this.logger.error('Password update failed', error, {
          component: 'SupabaseAuthService',
          action: 'updatePassword',
        });

        return {
          success: false,
          message: 'Failed to update password. Please try again.',
          error,
        };
      }

      this.logger.info('Password updated successfully', {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
        userId: data.user?.id,
      });

      return {
        success: true,
        message: 'Password updated successfully.',
        user: data.user,
      };
    } catch (error) {
      this.logger.error('Unexpected error updating password', error as Error, {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      this.logger.info('Signing in with email', {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
        email,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.error('Sign in failed', error, {
          component: 'SupabaseAuthService',
          action: 'signInWithEmail',
          email,
        });

        return {
          success: false,
          message: 'Invalid email or password.',
          error,
        };
      }

      this.logger.info('Sign in successful', {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
        userId: data.user?.id,
      });

      return {
        success: true,
        message: 'Signed in successfully.',
        user: data.user,
      };
    } catch (error) {
      this.logger.error('Unexpected error signing in', error as Error, {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResult> {
    try {
      this.logger.info('Signing out user', {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.logger.error('Sign out failed', error, {
          component: 'SupabaseAuthService',
          action: 'signOut',
        });

        return {
          success: false,
          message: 'Failed to sign out.',
          error,
        };
      }

      this.logger.info('Sign out successful', {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      return {
        success: true,
        message: 'Signed out successfully.',
      };
    } catch (error) {
      this.logger.error('Unexpected error signing out', error as Error, {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default SupabaseAuthService.getInstance();
```

---

## Phase 5: Create UI Screens (Day 2-3 - 6 hours)

### Step 5.1: Forgot Password Screen

Create `src/screens/auth/ForgotPasswordScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Portal, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import SupabaseAuthService from '../../services/supabase/SupabaseAuthService';
import { LoadingOverlay } from '../../components/LoadingOverlay';

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
      const result = await SupabaseAuthService.sendPasswordResetEmail(email);

      if (result.success) {
        setEmailSent(true);
        setSnackbarMessage('Password reset email sent! Check your inbox.');
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to send reset email. Please try again.');
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

      <LoadingOverlay
        visible={loading}
        message="Sending reset email..."
      />

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
```

### Step 5.2: Reset Password Screen

Create `src/screens/auth/ResetPasswordScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Portal, Snackbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import SupabaseAuthService from '../../services/supabase/SupabaseAuthService';
import { LoadingOverlay } from '../../components/LoadingOverlay';

export const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

    try {
      const result = await SupabaseAuthService.updatePassword(newPassword);

      if (result.success) {
        setSnackbarMessage('Password reset successful! Redirecting...');
        setSnackbarVisible(true);

        // Navigate to login or home after 2 seconds
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 2000);
      } else {
        setSnackbarMessage(result.message);
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Failed to reset password. Please try again.');
      setSnackbarVisible(true);
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
          <HelperText type="info" visible>
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

      <LoadingOverlay
        visible={loading}
        message="Resetting password..."
      />

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
  requirements: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  button: {
    marginTop: 16,
  },
});
```

### Step 5.3: Update Login Screen

Add "Forgot Password?" link to existing `src/screens/auth/LoginScreen.tsx`:

```typescript
// Add this import at the top
import { TouchableOpacity } from 'react-native';

// Add this after the password input field
<TouchableOpacity
  onPress={() => navigation.navigate('ForgotPassword' as never)}
  style={styles.forgotPasswordLink}
>
  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
</TouchableOpacity>

// Add to styles
const styles = StyleSheet.create({
  // ... existing styles ...
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

---

## Phase 6: Configure Deep Linking (Day 3 - 2 hours)

### Step 6.1: Configure App Deep Links

**For Expo projects**, update `app.json`:

```json
{
  "expo": {
    "scheme": "myapp",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "myapp",
              "host": "reset-password"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.siteprogresstracker",
      "associatedDomains": ["applinks:myapp"]
    }
  }
}
```

**For bare React Native**, update:

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" android:host="reset-password" />
</intent-filter>
```

**iOS** (`ios/YourApp/Info.plist`):
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

### Step 6.2: Handle Deep Links in Navigation

Update your navigation configuration:

```typescript
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

const linking = {
  prefixes: ['myapp://', 'https://yourapp.com'],
  config: {
    screens: {
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Login: 'login',
      // ... other screens
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      {/* Your navigation stack */}
    </NavigationContainer>
  );
}
```

---

## Phase 7: Testing (Day 4 - 4 hours)

### Test Case 1: Send Password Reset Email

```
Steps:
1. Open app
2. Navigate to Login screen
3. Click "Forgot Password?"
4. Enter valid email address
5. Click "Send Reset Link"

Expected:
✅ Success message appears
✅ Email received within 1 minute
✅ Email contains reset link
✅ Link format: myapp://reset-password?token=...

Actual: [ ]
```

### Test Case 2: Invalid Email Address

```
Steps:
1. Open Forgot Password screen
2. Enter invalid email (e.g., "notanemail")
3. Click "Send Reset Link"

Expected:
✅ Error message: "Please enter a valid email address"
✅ No email sent

Actual: [ ]
```

### Test Case 3: Reset Password with Valid Link

```
Steps:
1. Receive password reset email
2. Click link in email
3. App opens to Reset Password screen
4. Enter new password (meets requirements)
5. Confirm new password
6. Click "Reset Password"

Expected:
✅ Success message appears
✅ Redirected to Login screen
✅ Can log in with new password
✅ Old password no longer works

Actual: [ ]
```

### Test Case 4: Password Requirements Validation

```
Steps:
1. Open Reset Password screen
2. Try passwords:
   - "abc" (too short)
   - "abcdefgh" (no uppercase, no number)
   - "Abcdefgh" (no number)
   - "Abcdefg1" (valid)

Expected:
✅ Shows appropriate error messages
✅ Password strength indicator works
✅ Can't submit until valid

Actual: [ ]
```

### Test Case 5: Expired Reset Link

```
Steps:
1. Request password reset
2. Wait > 1 hour
3. Click reset link

Expected:
✅ Error message: "Reset link has expired"
✅ Option to request new link

Actual: [ ]
```

### Test Case 6: Rate Limiting

```
Steps:
1. Request password reset
2. Immediately request again
3. Request 3rd time
4. Request 4th time

Expected:
✅ First 3 requests succeed
✅ 4th request blocked with message
✅ Generic success shown (security)

Actual: [ ]
```

---

## Phase 8: User Migration Strategy (Day 4-5 - 4 hours)

### Option A: Add Email to Existing Users

**Database Migration** (`src/database/migrations/v35_add_email_to_users.ts`):

```typescript
import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const v35Migration = {
  toVersion: 35,
  steps: [
    addColumns({
      table: 'users',
      columns: [
        { name: 'email', type: 'string', isOptional: true },
        { name: 'supabase_user_id', type: 'string', isOptional: true },
        { name: 'email_verified', type: 'boolean', isOptional: false },
      ],
    }),
  ],
};
```

**Update UserModel** (`src/database/models/UserModel.ts`):

```typescript
export class User extends Model {
  static table = 'users';

  // ... existing fields ...

  @field('email') email?: string;
  @field('supabase_user_id') supabaseUserId?: string;
  @field('email_verified') emailVerified!: boolean;

  // ... rest of model ...
}
```

### Option B: Email Collection Flow

Create a screen to collect emails from existing users:

```typescript
// src/screens/profile/AddEmailScreen.tsx

export const AddEmailScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEmail = async () => {
    setLoading(true);

    try {
      // Update local user record
      await database.write(async () => {
        await currentUser.update((user: any) => {
          user.email = email;
          user.emailVerified = false;
        });
      });

      // Send verification email via Supabase
      // (Implementation depends on your sync strategy)

      Alert.alert(
        'Email Added',
        'Please check your email to verify your address.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... UI implementation ...
  );
};
```

---

## Phase 9: Production Deployment Checklist

### Pre-Launch Checklist

- [ ] **Supabase Production Project**
  - [ ] Create separate production project
  - [ ] Configure production redirect URLs
  - [ ] Customize email templates with branding
  - [ ] Set up custom domain for emails (optional)

- [ ] **Security**
  - [ ] Environment variables secured
  - [ ] API keys not committed to git
  - [ ] Rate limiting enabled (Supabase default: 3 requests/hour)
  - [ ] Email verification required

- [ ] **Testing**
  - [ ] All test cases passed
  - [ ] Tested on iOS and Android
  - [ ] Deep linking works correctly
  - [ ] Email delivery confirmed

- [ ] **User Communication**
  - [ ] Email existing users about new feature
  - [ ] Provide instructions for adding email
  - [ ] FAQ document prepared

- [ ] **Monitoring**
  - [ ] Supabase dashboard bookmarked
  - [ ] Set up email alerts for auth errors
  - [ ] Log monitoring configured

---

## Troubleshooting Guide

### Issue: Email Not Received

**Possible Causes:**
1. Email in spam folder
2. Incorrect email address
3. Supabase email rate limit hit
4. Email provider blocking

**Solutions:**
```
1. Check Supabase Dashboard → Authentication → Users
   - Verify email was sent
   - Check email logs

2. Check spam folder

3. Try different email provider (Gmail, Outlook)

4. Check Supabase logs for errors
```

### Issue: Deep Link Not Working

**Possible Causes:**
1. App scheme not configured
2. Link format incorrect
3. Navigation not set up

**Solutions:**
```
1. Verify app.json or AndroidManifest.xml has correct scheme

2. Test deep link manually:
   adb shell am start -W -a android.intent.action.VIEW \
     -d "myapp://reset-password?token=test"

3. Check navigation linking configuration

4. Ensure ResetPassword screen is in navigation stack
```

### Issue: "Invalid Token" Error

**Possible Causes:**
1. Token expired (> 1 hour)
2. Token already used
3. User not found

**Solutions:**
```
1. Request new reset email

2. Check Supabase Dashboard → Authentication → Users
   - Verify user exists
   - Check last sign in

3. Contact support if persistent
```

---

## Next Steps After Implementation

### Immediate (Week 1):
1. ✅ Monitor email delivery rates
2. ✅ Track password reset usage
3. ✅ Collect user feedback
4. ✅ Fix any reported issues

### Short-term (Month 1):
1. ✅ Implement TOTP authenticator (Phase 3 from v2.0 plan)
2. ✅ Add email change functionality
3. ✅ Implement password strength requirements
4. ✅ Add security notifications

### Long-term (Month 2-3):
1. ⚠️ Consider SMS reset (if needed)
2. ⚠️ Implement 2FA with TOTP
3. ⚠️ Add account recovery options
4. ⚠️ Security audit

---

## Support & Resources

### Supabase Documentation:
- Auth Guide: https://supabase.com/docs/guides/auth
- Password Reset: https://supabase.com/docs/guides/auth/passwords
- React Native: https://supabase.com/docs/guides/getting-started/tutorials/with-react-native

### React Navigation Deep Linking:
- Guide: https://reactnavigation.org/docs/deep-linking/

### Community Support:
- Supabase Discord: https://discord.supabase.com
- Stack Overflow: Tag [supabase]

---

## Estimated Timeline Summary

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Supabase project setup | 2 hours |
| 2 | Email authentication config | 1 hour |
| 3 | Install dependencies | 30 min |
| 4 | Create Supabase service | 2 hours |
| 5 | Create UI screens | 6 hours |
| 6 | Configure deep linking | 2 hours |
| 7 | Testing | 4 hours |
| 8 | User migration | 4 hours |
| 9 | Production deployment | 2 hours |
| **TOTAL** | | **~24 hours (3-4 days)** |

---

**Ready to start?** Let's begin with Phase 1: Supabase Project Setup!

**Questions before we proceed?**
