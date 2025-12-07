import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import ManagerDashboardScreen from '../manager/ManagerDashboardScreen';
import TeamPerformanceScreen from '../manager/TeamPerformanceScreen';
import FinancialReportsScreen from '../manager/FinancialReportsScreen';
import MilestoneManagementScreen from '../manager/MilestoneManagementScreen';
import BomManagementScreen from '../manager/BomManagementScreen';
import RoleSwitcher from '../auth/RoleSwitcher';
import { useAuth, UserRole } from '../auth/AuthContext';
import { ManagerProvider } from '../manager/context/ManagerContext';
import { BomProvider } from '../manager/context/BomContext';

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
  Dashboard: undefined;
  TeamPerformance: undefined;
  FinancialReports: undefined;
  Milestones: undefined;
  BomManagement: undefined;
};

type ManagerNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Manager'>;
};

const Tab = createBottomTabNavigator<ManagerTabParamList>();

const ManagerNavigator: React.FC<ManagerNavigatorProps> = ({ navigation: parentNavigation }) => {
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

  const handleRoleChange = (newRole: UserRole) => {
    const roleMap: Record<UserRole, keyof RootStackParamList> = {
      admin: 'Admin',
      supervisor: 'Supervisor',
      manager: 'Manager',
      planning: 'Planning',
      logistics: 'Logistics',
      design_engineer: 'DesignEngineer',
      commercial_manager: 'CommercialManager',
    };

    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: roleMap[newRole] }],
      })
    );
  };

  return (
    <ManagerProvider>
      <BomProvider>
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
            }

            return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
          },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
            <RoleSwitcher onRoleChange={handleRoleChange} />
            <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 10 }}>
              <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
            </TouchableOpacity>
          </View>
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
        </Tab.Navigator>
      </BomProvider>
    </ManagerProvider>
  );
};

export default ManagerNavigator;