import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import WBSManagementScreen from '../planning/WBSManagementScreen';
import ItemCreationScreen from '../planning/ItemCreationScreen';
import ItemEditScreen from '../planning/ItemEditScreen';
import GanttChartScreen from '../planning/GanttChartScreen';
import ScheduleManagementScreen from '../planning/ScheduleManagementScreen';
import ResourcePlanningScreen from '../planning/ResourcePlanningScreen';
import MilestoneTrackingScreen from '../planning/MilestoneTrackingScreen';
import BaselineScreen from '../planning/BaselineScreen';
import SiteManagementScreen from '../planning/SiteManagementScreen';
import RoleSwitcher from '../auth/RoleSwitcher';
import { useAuth, UserRole } from '../auth/AuthContext';
import { PlanningStackParamList } from './types';

export type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
};

export type PlanningTabParamList = {
  WBSManagement: undefined;
  GanttChart: undefined;
  ScheduleManagement: undefined;
  ResourcePlanning: undefined;
  MilestoneTracking: undefined;
  Baseline: undefined;
  SiteManagement: undefined;
};

type PlanningNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Planning'>;
};

const Tab = createBottomTabNavigator<PlanningTabParamList>();
const Stack = createNativeStackNavigator<PlanningStackParamList>();

// Tab Navigator Component (all the tabs)
const PlanningTabs: React.FC<PlanningNavigatorProps> = ({ navigation: parentNavigation }) => {
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
    };

    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: roleMap[newRole] }],
      })
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconSymbol = '';

          if (route.name === 'WBSManagement') {
            iconSymbol = '🗂️';
          } else if (route.name === 'GanttChart') {
            iconSymbol = '📊';
          } else if (route.name === 'ScheduleManagement') {
            iconSymbol = '📅';
          } else if (route.name === 'ResourcePlanning') {
            iconSymbol = '👷';
          } else if (route.name === 'MilestoneTracking') {
            iconSymbol = '🏁';
          } else if (route.name === 'Baseline') {
            iconSymbol = '📋';
          } else if (route.name === 'SiteManagement') {
            iconSymbol = '🏗️';
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
      {/* Tab 1: Sites - Where work happens */}
      <Tab.Screen
        name="SiteManagement"
        component={SiteManagementScreen}
        options={{
          title: 'Sites',
          headerShown: true,
          headerTitle: 'Site Management',
        }}
      />
      {/* Tab 2: WBS - What work needs to be done */}
      <Tab.Screen
        name="WBSManagement"
        component={WBSManagementScreen}
        options={{
          title: 'WBS',
          headerShown: true,
          headerTitle: 'Work Breakdown Structure',
        }}
      />
      {/* Tab 3: Resources - Who does the work */}
      <Tab.Screen
        name="ResourcePlanning"
        component={ResourcePlanningScreen}
        options={{
          title: 'Resources',
          headerShown: true,
          headerTitle: 'Resource Planning',
        }}
      />
      {/* Tab 4: Schedule - When work happens */}
      <Tab.Screen
        name="ScheduleManagement"
        component={ScheduleManagementScreen}
        options={{
          title: 'Schedule',
          headerShown: true,
          headerTitle: 'Schedule Management',
        }}
      />
      {/* Tab 5: Gantt Chart - Visualize the timeline */}
      <Tab.Screen
        name="GanttChart"
        component={GanttChartScreen}
        options={{
          title: 'Gantt',
          headerShown: true,
          headerTitle: 'Project Timeline',
        }}
      />
      {/* Tab 6: Baseline - Lock in the plan */}
      <Tab.Screen
        name="Baseline"
        component={BaselineScreen}
        options={{
          title: 'Baseline',
          headerShown: true,
          headerTitle: 'Baseline Planning',
        }}
      />
      {/* Tab 7: Milestones - Track key deliverables */}
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

// Main Stack Navigator with Tabs + Item Creation screens
const PlanningNavigator: React.FC<PlanningNavigatorProps> = ({ navigation: parentNavigation }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WBSManagement">
        {(props) => <PlanningTabs {...props} navigation={parentNavigation} />}
      </Stack.Screen>
      <Stack.Screen
        name="ItemCreation"
        component={ItemCreationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ItemEdit"
        component={ItemEditScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default PlanningNavigator;