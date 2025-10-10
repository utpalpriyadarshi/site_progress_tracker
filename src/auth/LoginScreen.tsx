import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth, UserRole } from './AuthContext';

type AuthStackParamList = {
  Login: undefined;
  RoleSelection: {
    userId: string;
    username: string;
  };
};

type RootStackParamList = {
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'RoleSelection'> &
  StackNavigationProp<RootStackParamList>;

const LoginScreen = ({ navigation }: { navigation: LoginScreenNavigationProp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, selectRole, getLastSelectedRole } = useAuth();

  const defaultUsers: { [key: string]: { password: string; availableRoles: UserRole[] } } = {
    'admin': { password: 'admin123', availableRoles: ['manager', 'supervisor', 'planning', 'logistics'] },
    'manager': { password: 'manager123', availableRoles: ['manager'] },
    'supervisor': { password: 'supervisor123', availableRoles: ['supervisor'] },
    'planner': { password: 'planner123', availableRoles: ['planning'] },
    'logistics': { password: 'logistics123', availableRoles: ['logistics'] },
  };

  const navigateToRole = (role: UserRole) => {
    const roleMap: Record<UserRole, keyof RootStackParamList> = {
      supervisor: 'Supervisor',
      manager: 'Manager',
      planning: 'Planning',
      logistics: 'Logistics',
    };

    navigation.reset({
      index: 0,
      routes: [{ name: roleMap[role] }],
    });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Check if the user exists in our default users
      const user = defaultUsers[username];

      if (!user || user.password !== password) {
        Alert.alert('Login Failed', 'Invalid username or password');
        setIsLoading(false);
        return;
      }

      // Simulate API call delay
      await new Promise<void>(resolve => setTimeout(resolve, 500));

      // Save user data to context
      await login(username, username, user.availableRoles);

      // Option 1: Single role user - auto-navigate directly
      if (user.availableRoles.length === 1) {
        const singleRole = user.availableRoles[0];
        await selectRole(singleRole);
        navigateToRole(singleRole);
        return;
      }

      // Option 2: Multi-role user - check for last selected role
      const lastRole = await getLastSelectedRole();
      if (lastRole && user.availableRoles.includes(lastRole)) {
        // Auto-navigate to last used role
        await selectRole(lastRole);
        navigateToRole(lastRole);
        return;
      }

      // Option 3: No last role - show role selection screen
      navigation.replace('RoleSelection', {
        userId: username,
        username: username
      });
    } catch (error) {
      Alert.alert('Login Failed', 'Network error occurred');
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
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Default test accounts:\\n\\n- supervisor / supervisor123\\n- manager / manager123\\n- planner / planner123\\n- logistics / logistics123')}>
          <Text style={styles.linkText}>Show Default Credentials</Text>
        </TouchableOpacity>
      </View>
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
  demoButton: {
    flex: 1,
    backgroundColor: '#4CD964',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
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