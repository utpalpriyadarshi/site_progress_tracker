import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { AuthStackParamList, RootStackParamList } from './types';
import { useAuth, UserRole } from '../auth/AuthContext';
import { useSnackbar } from '../components/Snackbar';

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'RoleSelection'
> & 
StackNavigationProp<RootStackParamList>; // Adding the root stack navigation for role navigation

type RoleSelectionScreenRouteProp = RouteProp<
  AuthStackParamList,
  'RoleSelection'
>;

type Props = {
  navigation: RoleSelectionScreenNavigationProp;
  route: RoleSelectionScreenRouteProp;
};

const RoleSelectionScreen = ({ navigation, route }: Props) => {
  const { showSnackbar } = useSnackbar();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, selectRole, logout, getLastSelectedRole } = useAuth();

  const allRoles = [
    { id: 'supervisor' as UserRole, name: 'Supervisor', description: 'Manage daily reports and material tracking' },
    { id: 'manager' as UserRole, name: 'Manager', description: 'Oversee projects and generate reports' },
    { id: 'planning' as UserRole, name: 'Planning', description: 'Create schedules and Gantt charts' },
    { id: 'logistics' as UserRole, name: 'Logistics', description: 'Handle material and equipment logistics' },
  ];

  // Filter roles to only show roles available to the current user
  const roles = allRoles.filter(role => user?.availableRoles.includes(role.id));

  // Load last selected role on mount
  useEffect(() => {
    loadLastRole();
  }, []);

  const loadLastRole = async () => {
    const lastRole = await getLastSelectedRole();
    if (lastRole && user?.availableRoles.includes(lastRole)) {
      setSelectedRole(lastRole);
    }
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      showSnackbar('Please select a role', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

      // Save selected role to context
      await selectRole(selectedRole);

      // Navigate to appropriate dashboard based on selected role
      const roleMap: Record<UserRole, keyof RootStackParamList> = {
        supervisor: 'Supervisor',
        manager: 'Manager',
        planning: 'Planning',
        logistics: 'Logistics',
      };

      navigation.reset({
        index: 0,
        routes: [{ name: roleMap[selectedRole] }],
      });
    } catch (error) {
      showSnackbar('Failed to navigate to dashboard', 'error');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      showSnackbar('Failed to logout', 'error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>
            {user ? `Logged in as ${user.username}` : 'Choose the role you want to operate under'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <Text style={[
              styles.roleName,
              selectedRole === role.id && styles.selectedRoleName,
            ]}>
              {role.name}
            </Text>
            <Text style={styles.roleDescription}>
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedRole && styles.disabledButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={handleRoleSelection}
        disabled={!selectedRole || isLoading}
      >
        <Text style={styles.continueButtonText}>
          {isLoading ? 'Loading...' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logoutButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  rolesContainer: {
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedRoleCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  roleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  selectedRoleName: {
    color: '#007AFF',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoleSelectionScreen;