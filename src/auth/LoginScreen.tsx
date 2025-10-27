import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, UserRole } from './AuthContext';
import { database } from '../../models/database';
import UserModel from '../../models/UserModel';
import { Q } from '@nozbe/watermelondb';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import bcrypt from 'react-native-bcrypt';

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
      // Query user from database
      const users = await database.collections
        .get<UserModel>('users')
        .query(Q.where('username', username))
        .fetch();

      if (users.length === 0) {
        showSnackbar('Invalid username or password', 'error');
        setIsLoading(false);
        return;
      }

      const user = users[0];

      // Check password using bcrypt (v2.2)
      // All users now have hashed passwords after migration
      const isPasswordValid = await new Promise<boolean>((resolve) => {
        bcrypt.compare(password, user.passwordHash, (err: Error | undefined, result: boolean) => {
          if (err) {
            console.error('Bcrypt compare error:', err);
            resolve(false);
          } else {
            resolve(result);
          }
        });
      });

      if (!isPasswordValid) {
        showSnackbar('Invalid username or password', 'error');
        setIsLoading(false);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        showSnackbar('Your account has been deactivated. Please contact an administrator.', 'error');
        setIsLoading(false);
        return;
      }

      // Get user's role
      const role = await user.role.fetch();
      if (!role) {
        showSnackbar('Unable to determine user role', 'error');
        setIsLoading(false);
        return;
      }

      // Simulate API call delay
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Save user data to context (still using old auth system for compatibility)
      await login(user.id, user.username, [role.name.toLowerCase() as UserRole]);

      // Navigate based on role
      if (role.name === 'Admin') {
        navigateToScreen('Admin');
      } else if (role.name === 'Supervisor') {
        navigateToScreen('Supervisor');
      } else if (role.name === 'Manager') {
        navigateToScreen('Manager');
      } else if (role.name === 'Planner') {
        navigateToScreen('Planning');
      } else if (role.name === 'Logistics') {
        navigateToScreen('Logistics');
      } else {
        showSnackbar('Unknown role type', 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
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
          style={[styles.loginButton, isLoading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>Demo Users</Text>
        <View style={styles.demoButtons}>
          <TouchableOpacity
            style={[styles.demoButton, styles.adminButton]}
            onPress={() => handleDefaultLogin('admin', 'admin123')}
          >
            <Text style={styles.demoButtonText}>Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => handleDefaultLogin('supervisor', 'supervisor123')}
          >
            <Text style={styles.demoButtonText}>Supervisor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => handleDefaultLogin('manager', 'manager123')}
          >
            <Text style={styles.demoButtonText}>Manager</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.demoButtons, styles.demoButtonsSecondRow]}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => handleDefaultLogin('planner', 'planner123')}
          >
            <Text style={styles.demoButtonText}>Planner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => handleDefaultLogin('logistics', 'logistics123')}
          >
            <Text style={styles.demoButtonText}>Logistics</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setShowCredentialsDialog(true)}>
          <Text style={styles.linkText}>Show Default Credentials</Text>
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showCredentialsDialog}
        title="Default Test Accounts"
        message="• admin / admin123
• supervisor / supervisor123
• manager / manager123
• planner / planner123
• logistics / logistics123"
        confirmText="OK"
        onConfirm={() => setShowCredentialsDialog(false)}
        onCancel={() => setShowCredentialsDialog(false)}
        destructive={false}
      />
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
    backgroundColor: '#F44336',
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