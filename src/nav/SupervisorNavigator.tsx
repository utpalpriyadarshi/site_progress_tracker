import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import DailyReportsScreen from '../supervisor/DailyReportsScreen';
import MaterialTrackingScreen from '../supervisor/MaterialTrackingScreen';
import SiteInspectionScreen from '../supervisor/SiteInspectionScreen';
import SiteManagementScreen from '../supervisor/SiteManagementScreen';
import ItemsManagementScreen from '../supervisor/ItemsManagementScreen';
import { SiteProvider } from '../supervisor/context/SiteContext';

export type RootStackParamList = {
  Auth: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

export type SupervisorTabParamList = {
  DailyReports: undefined;
  MaterialTracking: undefined;
  ItemsManagement: undefined;
  SiteManagement: undefined;
  SiteInspection: undefined;
};

type SupervisorNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Supervisor'>;
};

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

const SupervisorNavigator: React.FC<SupervisorNavigatorProps> = ({ navigation: parentNavigation }) => {
  const handleLogout = () => {
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <SiteProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconSymbol = '';

            if (route.name === 'DailyReports') {
              iconSymbol = '📝';
            } else if (route.name === 'MaterialTracking') {
              iconSymbol = '🚚';
            } else if (route.name === 'ItemsManagement') {
              iconSymbol = '📋';
            } else if (route.name === 'SiteManagement') {
              iconSymbol = '🏗️';
            } else if (route.name === 'SiteInspection') {
              iconSymbol = '🔍';
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
          name="DailyReports"
          component={DailyReportsScreen}
          options={{
            title: 'Reports',
            headerShown: true,
            headerTitle: 'Daily Reports',
          }}
        />
        <Tab.Screen
          name="ItemsManagement"
          component={ItemsManagementScreen}
          options={{
            title: 'Items',
            headerShown: true,
            headerTitle: 'Manage Items',
          }}
        />
        <Tab.Screen
          name="MaterialTracking"
          component={MaterialTrackingScreen}
          options={{
            title: 'Materials',
            headerShown: true,
            headerTitle: 'Material Tracking',
          }}
        />
        <Tab.Screen
          name="SiteManagement"
          component={SiteManagementScreen}
          options={{
            title: 'Sites',
            headerShown: true,
            headerTitle: 'Manage Sites',
          }}
        />
        <Tab.Screen
          name="SiteInspection"
          component={SiteInspectionScreen}
          options={{
            title: 'Inspection',
            headerShown: true,
            headerTitle: 'Site Inspections',
          }}
        />
      </Tab.Navigator>
    </SiteProvider>
  );
};

export default SupervisorNavigator;