import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import GanttChartScreen from '../planning/GanttChartScreen';
import ScheduleManagementScreen from '../planning/ScheduleManagementScreen';
import ResourcePlanningScreen from '../planning/ResourcePlanningScreen';
import MilestoneTrackingScreen from '../planning/MilestoneTrackingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

export type PlanningTabParamList = {
  GanttChart: undefined;
  ScheduleManagement: undefined;
  ResourcePlanning: undefined;
  MilestoneTracking: undefined;
};

type PlanningNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Planning'>;
};

const Tab = createBottomTabNavigator<PlanningTabParamList>();

const PlanningNavigator: React.FC<PlanningNavigatorProps> = ({ navigation: parentNavigation }) => {
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

          if (route.name === 'GanttChart') {
            iconSymbol = '📊';
          } else if (route.name === 'ScheduleManagement') {
            iconSymbol = '📅';
          } else if (route.name === 'ResourcePlanning') {
            iconSymbol = '👷';
          } else if (route.name === 'MilestoneTracking') {
            iconSymbol = '🏁';
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
        name="GanttChart" 
        component={GanttChartScreen} 
        options={{ 
          title: 'Gantt Chart',
          headerShown: true,
          headerTitle: 'Project Timeline',
        }} 
      />
      <Tab.Screen 
        name="ScheduleManagement" 
        component={ScheduleManagementScreen} 
        options={{ 
          title: 'Schedule',
          headerShown: true,
          headerTitle: 'Schedule Management',
        }} 
      />
      <Tab.Screen 
        name="ResourcePlanning" 
        component={ResourcePlanningScreen} 
        options={{ 
          title: 'Resources',
          headerShown: true,
          headerTitle: 'Resource Planning',
        }} 
      />
      <Tab.Screen 
        name="MilestoneTracking" 
        component={MilestoneTrackingScreen} 
        options={{ 
          title: 'Milestones',
          headerShown: true,
          headerTitle: 'Milestone Tracking',
        }} 
      />
    </Tab.Navigator>
  );
};

export default PlanningNavigator;