import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SiteProvider } from '../supervisor/context/SiteContext';
import SupervisorTabNavigator from './SupervisorTabNavigator';
import MaterialTrackingScreen from '../supervisor/MaterialTrackingScreen';
import HindranceReportScreen from '../supervisor/hindrance_reports/HindranceReportScreen';
import SiteInspectionScreen from '../supervisor/SiteInspectionScreen';
import ReportsHistoryScreen from '../supervisor/ReportsHistoryScreen';

/**
 * SupervisorDrawerNavigator
 *
 * Drawer navigation for secondary supervisor screens
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 *
 * Structure:
 * - Main Content: SupervisorTabNavigator (5 tabs)
 * - Drawer Items: 4 secondary screens
 */

export type SupervisorDrawerParamList = {
  SupervisorTabs: undefined;
  Materials: undefined;
  Issues: undefined;
  Inspection: undefined;
  History: undefined;
};

const Drawer = createDrawerNavigator<SupervisorDrawerParamList>();

export const SupervisorDrawerNavigator: React.FC = () => {
  return (
    <SiteProvider>
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: { width: 280 },
          drawerActiveTintColor: '#6200ee',
          drawerInactiveTintColor: '#666',
        }}
      >
        {/* Main content - Tab Navigator (hidden from drawer) */}
        <Drawer.Screen
          name="SupervisorTabs"
          component={SupervisorTabNavigator}
          options={{ drawerItemStyle: { display: 'none' } }}
        />

        {/* Drawer Items - Secondary Screens */}
        <Drawer.Screen
          name="Materials"
          component={MaterialTrackingScreen}
          options={{
            drawerLabel: 'Material Tracking',
            drawerIcon: ({ color, size }: { color: string; size: number }) => {
              const Icon = require('react-native-vector-icons/MaterialIcons').default;
              return <Icon name="inventory" size={size} color={color} />;
            },
          }}
        />

        <Drawer.Screen
          name="Issues"
          component={HindranceReportScreen}
          options={{
            drawerLabel: 'Hindrance Reports',
            drawerIcon: ({ color, size }: { color: string; size: number }) => {
              const Icon = require('react-native-vector-icons/MaterialIcons').default;
              return <Icon name="report-problem" size={size} color={color} />;
            },
          }}
        />

        <Drawer.Screen
          name="Inspection"
          component={SiteInspectionScreen}
          options={{
            drawerLabel: 'Site Inspection',
            drawerIcon: ({ color, size }: { color: string; size: number }) => {
              const Icon = require('react-native-vector-icons/MaterialIcons').default;
              return <Icon name="fact-check" size={size} color={color} />;
            },
          }}
        />

        <Drawer.Screen
          name="History"
          component={ReportsHistoryScreen}
          options={{
            drawerLabel: 'Reports History',
            drawerIcon: ({ color, size }: { color: string; size: number }) => {
              const Icon = require('react-native-vector-icons/MaterialIcons').default;
              return <Icon name="history" size={size} color={color} />;
            },
          }}
        />
      </Drawer.Navigator>
    </SiteProvider>
  );
};

export default SupervisorDrawerNavigator;
