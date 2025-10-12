import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import AdminDashboardScreen from '../admin/AdminDashboardScreen';
import ProjectManagementScreen from '../admin/ProjectManagementScreen';
import RoleManagementScreen from '../admin/RoleManagementScreen';
import { AdminProvider } from '../admin/context/AdminContext';
import { useAuth } from '../auth/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  ProjectManagement: undefined;
  RoleManagement: undefined;
};

type AdminNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Admin'>;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminNavigator: React.FC<AdminNavigatorProps> = ({ navigation: parentNavigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <AdminProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconSymbol = '';

            if (route.name === 'AdminDashboard') {
              iconSymbol = '🏠';
            } else if (route.name === 'ProjectManagement') {
              iconSymbol = '📁';
            } else if (route.name === 'RoleManagement') {
              iconSymbol = '👥';
            }

            return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      >
        <Tab.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            title: 'Dashboard',
            headerShown: true,
            headerTitle: 'Admin Dashboard',
          }}
        />
        <Tab.Screen
          name="ProjectManagement"
          component={ProjectManagementScreen}
          options={{
            title: 'Projects',
            headerShown: true,
            headerTitle: 'Project Management',
          }}
        />
        <Tab.Screen
          name="RoleManagement"
          component={RoleManagementScreen}
          options={{
            title: 'Users',
            headerShown: true,
            headerTitle: 'User & Role Management',
          }}
        />
      </Tab.Navigator>
    </AdminProvider>
  );
};

export default AdminNavigator;
