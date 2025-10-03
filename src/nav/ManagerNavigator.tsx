import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';

import ProjectOverviewScreen from '../manager/ProjectOverviewScreen';
import TeamManagementScreen from '../manager/TeamManagementScreen';
import FinancialReportsScreen from '../manager/FinancialReportsScreen';
import ResourceAllocationScreen from '../manager/ResourceAllocationScreen';

export type ManagerTabParamList = {
  ProjectOverview: undefined;
  TeamManagement: undefined;
  FinancialReports: undefined;
  ResourceAllocation: undefined;
};

const Tab = createBottomTabNavigator<ManagerTabParamList>();

const ManagerNavigator = ({ navigation: parentNavigation }) => {
  const handleLogout = () => {
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconSymbol = '';

          if (route.name === 'ProjectOverview') {
            iconSymbol = '📊';
          } else if (route.name === 'TeamManagement') {
            iconSymbol = '👥';
          } else if (route.name === 'FinancialReports') {
            iconSymbol = '💰';
          } else if (route.name === 'ResourceAllocation') {
            iconSymbol = '👷';
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
        name="ProjectOverview" 
        component={ProjectOverviewScreen} 
        options={{ 
          title: 'Overview',
          headerShown: true,
          headerTitle: 'Project Overview',
        }} 
      />
      <Tab.Screen 
        name="TeamManagement" 
        component={TeamManagementScreen} 
        options={{ 
          title: 'Team',
          headerShown: true,
          headerTitle: 'Team Management',
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
        name="ResourceAllocation" 
        component={ResourceAllocationScreen} 
        options={{ 
          title: 'Resources',
          headerShown: true,
          headerTitle: 'Resource Allocation',
        }} 
      />
    </Tab.Navigator>
  );
};

export default ManagerNavigator;