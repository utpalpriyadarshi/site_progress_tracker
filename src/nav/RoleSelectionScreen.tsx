import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type AuthStackParamList = {
  Login: undefined;
  RoleSelection: {
    userId: string;
    username: string;
  };
};

type RoleSelectionScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'RoleSelection'
>;

type RoleSelectionScreenRouteProp = RouteProp<
  AuthStackParamList,
  'RoleSelection'
>;

type Props = {
  navigation: RoleSelectionScreenNavigationProp;
  route: RoleSelectionScreenRouteProp;
};

const RoleSelectionScreen = ({ navigation, route }: Props) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: 'supervisor', name: 'Supervisor', description: 'Manage daily reports and material tracking' },
    { id: 'manager', name: 'Manager', description: 'Oversee projects and generate reports' },
    { id: 'planning', name: 'Planning', description: 'Create schedules and Gantt charts' },
    { id: 'logistics', name: 'Logistics', description: 'Handle material and equipment logistics' },
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to appropriate dashboard based on selected role
      switch (selectedRole) {
        case 'supervisor':
          navigation.navigate('Supervisor');
          break;
        case 'manager':
          navigation.navigate('Manager');
          break;
        case 'planning':
          navigation.navigate('Planning');
          break;
        case 'logistics':
          navigation.navigate('Logistics');
          break;
        default:
          Alert.alert('Error', 'Invalid role selected');
          setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to navigate to dashboard');
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>
      <Text style={styles.subtitle}>Choose the role you want to operate under</Text>
      
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
  title: {
    fontSize: 28,
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