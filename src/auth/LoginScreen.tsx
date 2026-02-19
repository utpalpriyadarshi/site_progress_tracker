import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, UserRole } from './AuthContext';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import AuthService from '../../services/auth/AuthService';
import { checkLatestSession } from '../../scripts/testCheckSessions';
import AutoSyncManager from '../../services/sync/AutoSyncManager';
import { COLORS } from '../theme/colors';

type AuthStackParamList = {
  Login: undefined;
  RoleSelection: {
    userId: string;
    username: string;
  };
};

type RootStackParamList = {
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
  CommercialManager: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'RoleSelection'> &
  StackNavigationProp<RootStackParamList>;

const LoginScreen = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
  const { showSnackbar } = useSnackbar();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const { login, selectRole, getLastSelectedRole } = useAuth();

  const navigateToScreen = (screenName: keyof RootStackParamList) => {
    navigation.reset({
      index: 0,
      routes: [{ name: screenName }],
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showSnackbar('Please enter both username and password', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      console.log('LoginScreen: Attempting login with AuthService...');

      // Use AuthService for JWT-based authentication
      const result = await AuthService.login(username, password);

      if (!result.success) {
        showSnackbar(result.error || 'Login failed', 'error');
        setIsLoading(false);
        return;
      }

      if (!result.user || !result.tokens) {
        showSnackbar('Invalid login response', 'error');
        setIsLoading(false);
        return;
      }

      console.log('LoginScreen: Login successful, updating context...');

      // Save user data and JWT tokens to context
      await login(
        result.user.id,
        result.user.username,
        [result.user.role as UserRole],
        {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          accessTokenExpiry: result.tokens.accessTokenExpiry,
          refreshTokenExpiry: result.tokens.refreshTokenExpiry,
        }
      );

      // Debug: Check session in database (Week 3 Testing)
      console.log('LoginScreen: Checking session in database...');
      await checkLatestSession();

      // Week 8 Fix: Start auto-sync after successful login
      console.log('LoginScreen: Starting auto-sync after login...');
      AutoSyncManager.startAfterLogin();

      // Navigate based on role
      const roleMap: Record<string, keyof RootStackParamList> = {
        admin: 'Admin',
        supervisor: 'Supervisor',
        manager: 'Manager',
        planner: 'Planning',
        logistics: 'Logistics',
        designengineer: 'DesignEngineer',
        commercialmanager: 'CommercialManager',
      };

      const screenName = roleMap[result.user.role];
      if (screenName) {
        console.log('LoginScreen: Navigating to', screenName);
        navigateToScreen(screenName);
      } else {
        showSnackbar('Unknown role type', 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('LoginScreen: Login error:', error);
      showSnackbar('An error occurred during login', 'error');
      setIsLoading(false);
    }
  };

  const handleDefaultLogin = (user: string, pass: string): void => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Construction Tracker</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword' as never)}
          style={styles.forgotPasswordLink}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Demo section - only visible in development builds */}
      {__DEV__ && (
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Users (Dev Only)</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoButton, styles.adminButton]}
              onPress={() => handleDefaultLogin('admin', 'Admin@2025')}
            >
              <Text style={styles.demoButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDefaultLogin('supervisor', 'Supervisor@2025')}
            >
              <Text style={styles.demoButtonText}>Supervisor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDefaultLogin('manager', 'Manager@2025')}
            >
              <Text style={styles.demoButtonText}>Manager</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.demoButtons, styles.demoButtonsSecondRow]}>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDefaultLogin('planner', 'Planner@2025')}
            >
              <Text style={styles.demoButtonText}>Planner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDefaultLogin('logistics', 'Logistics@2025')}
            >
              <Text style={styles.demoButtonText}>Logistics</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Credentials dialog - only visible in development builds */}
      {__DEV__ && (
        <>
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setShowCredentialsDialog(true)}>
              <Text style={styles.linkText}>Show Default Credentials</Text>
            </TouchableOpacity>
          </View>

          <ConfirmDialog
            visible={showCredentialsDialog}
            title="Default Test Accounts"
            message="• admin / Admin@2025
• supervisor / Supervisor@2025
• manager / Manager@2025
• planner / Planner@2025
• logistics / Logistics@2025"
            confirmText="OK"
            onConfirm={() => setShowCredentialsDialog(false)}
            onCancel={() => setShowCredentialsDialog(false)}
            destructive={false}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    marginBottom: 16,
    borderRadius: 4,
    fontSize: 16,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoSection: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoButtonsSecondRow: {
    marginTop: 10,
  },
  demoButton: {
    flex: 1,
    backgroundColor: '#4CD964',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: COLORS.ERROR,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default LoginScreen;