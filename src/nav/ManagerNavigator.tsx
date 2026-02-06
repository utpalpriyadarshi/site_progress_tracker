import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions, DrawerActions, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';

import ManagerDashboardScreen from '../manager/ManagerDashboardScreen';
import TeamPerformanceScreen from '../manager/TeamPerformanceScreen';
import FinancialReportsScreen from '../manager/FinancialReportsScreen';
import MilestoneManagementScreen from '../manager/MilestoneManagementScreen';
import BomManagementScreen from '../manager/BomManagementScreen';
import { useAuth } from '../auth/AuthContext';
import type { ManagerDrawerParamList } from './ManagerDrawerNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
  CommercialManager: undefined;
};

export type ManagerTabParamList = {
  Dashboard: { showTutorial?: boolean } | undefined;
  TeamPerformance: undefined;
  FinancialReports: undefined;
  Milestones: undefined;
  BomManagement: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<ManagerTabParamList>();

// Empty component for "More" tab (drawer trigger)
const MoreScreen: React.FC = () => {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>This screen should never be visible</Text>
  </View>;
};

const ManagerTabNavigator: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<ManagerDrawerParamList>>();

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconSymbol = '';

          if (route.name === 'Dashboard') {
            iconSymbol = '📊';
          } else if (route.name === 'TeamPerformance') {
            iconSymbol = '👥';
          } else if (route.name === 'FinancialReports') {
            iconSymbol = '💰';
          } else if (route.name === 'Milestones') {
            iconSymbol = '🎯';
          } else if (route.name === 'BomManagement') {
            iconSymbol = '📋';
          } else if (route.name === 'More') {
            iconSymbol = '☰';
          }

          return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={ManagerDashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: true,
          headerTitle: 'Manager Dashboard',
        }}
      />
      <Tab.Screen
        name="TeamPerformance"
        component={TeamPerformanceScreen}
        options={{
          title: 'Team',
          headerShown: true,
          headerTitle: 'Team Performance',
        }}
      />
      <Tab.Screen
        name="FinancialReports"
        component={FinancialReportsScreen}
        options={{
          title: 'Finance',
          headerShown: true,
          headerTitle: 'Financial Reports',
        }}
      />
      <Tab.Screen
        name="Milestones"
        component={MilestoneManagementScreen}
        options={{
          title: 'Milestones',
          headerShown: true,
          headerTitle: 'Milestone Management',
        }}
      />
      <Tab.Screen
        name="BomManagement"
        component={BomManagementScreen}
        options={{
          title: 'BOM',
          headerShown: true,
          headerTitle: 'BOM Management',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(DrawerActions.openDrawer());
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default ManagerTabNavigator;
