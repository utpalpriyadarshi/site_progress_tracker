import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import DailyReportsScreen from '../supervisor/DailyReportsScreen';
import ReportsHistoryScreen from '../supervisor/ReportsHistoryScreen';
import MaterialTrackingScreen from '../supervisor/MaterialTrackingScreen';
import SiteInspectionScreen from '../supervisor/SiteInspectionScreen';
import HindranceReportScreen from '../supervisor/HindranceReportScreen';
import SiteManagementScreen from '../supervisor/SiteManagementScreen';
import ItemsManagementScreen from '../supervisor/ItemsManagementScreen';
import { SiteProvider } from '../supervisor/context/SiteContext';
import { useAuth } from '../auth/AuthContext';

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

export type SupervisorTabParamList = {
  DailyReports: undefined;
  ReportsHistory: undefined;
  MaterialTracking: undefined;
  ItemsManagement: undefined;
  SiteManagement: undefined;
  HindranceReport: undefined;
  SiteInspection: undefined;
};

type SupervisorNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Supervisor'>;
};

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

const SupervisorNavigator: React.FC<SupervisorNavigatorProps> = ({ navigation: parentNavigation }) => {
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
    <SiteProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconSymbol = '';

            if (route.name === 'DailyReports') {
              iconSymbol = '📝';
            } else if (route.name === 'ReportsHistory') {
              iconSymbol = '📊';
            } else if (route.name === 'MaterialTracking') {
              iconSymbol = '🚚';
            } else if (route.name === 'ItemsManagement') {
              iconSymbol = '📋';
            } else if (route.name === 'SiteManagement') {
              iconSymbol = '🏗️';
            } else if (route.name === 'HindranceReport') {
              iconSymbol = '⚠️';
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
        {/* Tab 1: Sites - Start here, select your site */}
        <Tab.Screen
          name="SiteManagement"
          component={SiteManagementScreen}
          options={{
            title: 'Sites',
            headerShown: true,
            headerTitle: 'Manage Sites',
          }}
        />
        {/* Tab 2: Items - View/manage items for selected site */}
        <Tab.Screen
          name="ItemsManagement"
          component={ItemsManagementScreen}
          options={{
            title: 'Items',
            headerShown: true,
            headerTitle: 'Manage Items',
          }}
        />
        {/* Tab 3: Daily Reports - Create progress reports */}
        <Tab.Screen
          name="DailyReports"
          component={DailyReportsScreen}
          options={{
            title: 'Reports',
            headerShown: true,
            headerTitle: 'Daily Reports',
          }}
        />
        {/* Tab 4: Materials - Track material usage */}
        <Tab.Screen
          name="MaterialTracking"
          component={MaterialTrackingScreen}
          options={{
            title: 'Materials',
            headerShown: true,
            headerTitle: 'Material Tracking',
          }}
        />
        {/* Tab 5: Issues - Report hindrances/problems */}
        <Tab.Screen
          name="HindranceReport"
          component={HindranceReportScreen}
          options={{
            title: 'Issues',
            headerShown: true,
            headerTitle: 'Hindrance Reports',
          }}
        />
        {/* Tab 6: Inspection - Conduct site inspections */}
        <Tab.Screen
          name="SiteInspection"
          component={SiteInspectionScreen}
          options={{
            title: 'Inspection',
            headerShown: true,
            headerTitle: 'Site Inspections',
          }}
        />
        {/* Tab 7: History - Review past reports */}
        <Tab.Screen
          name="ReportsHistory"
          component={ReportsHistoryScreen}
          options={{
            title: 'History',
            headerShown: true,
            headerTitle: 'Reports History',
          }}
        />
      </Tab.Navigator>
    </SiteProvider>
  );
};

export default SupervisorNavigator;