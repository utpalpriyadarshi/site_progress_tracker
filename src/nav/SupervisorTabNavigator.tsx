import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions, DrawerActions, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DashboardScreen from '../supervisor/dashboard/DashboardScreen';
import DailyReportsScreen from '../supervisor/daily_reports/DailyReportsScreen';
import SiteManagementScreen from '../supervisor/SiteManagementScreen';
import ItemsManagementScreen from '../supervisor/ItemsManagementScreen';
import { useAuth } from '../auth/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import type { SupervisorDrawerParamList } from './SupervisorDrawerNavigator';
import { COLORS } from '../theme/colors';

/**
 * SupervisorTabNavigator
 *
 * Bottom tab navigation with 5 tabs (reduced from 7)
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 *
 * Tabs:
 * 1. Dashboard - Overview & KPIs
 * 2. Sites - Site management
 * 3. Items - Items management
 * 4. Daily Work - Daily reports
 * 5. More - Opens drawer
 */

export type SupervisorTabParamList = {
  Dashboard: { showTutorial?: boolean } | undefined;
  Sites: undefined;
  Items: undefined;
  DailyWork: { focusItemId?: string } | undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

// Empty component for "More" tab (drawer trigger)
const MoreScreen: React.FC = () => {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>This screen should never be visible</Text>
  </View>;
};

// Wrap screens with ErrorBoundary
const WrappedDashboardScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="DashboardScreen">
    <DashboardScreen {...props} />
  </ErrorBoundary>
);

const WrappedDailyReportsScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="DailyReportsScreen">
    <DailyReportsScreen {...props} />
  </ErrorBoundary>
);

const WrappedItemsManagementScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="ItemsManagementScreen">
    <ItemsManagementScreen {...props} />
  </ErrorBoundary>
);

const WrappedSiteManagementScreen: React.FC<any> = (props) => (
  <ErrorBoundary name="SiteManagementScreen">
    <SiteManagementScreen {...props} />
  </ErrorBoundary>
);

const SupervisorTabNavigator: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<SupervisorDrawerParamList>>();

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
      screenOptions={{
        headerShown: false, // All screens use custom SupervisorHeader
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
      }}
    >
      {/* Tab 1: Dashboard - Overview & Quick Actions */}
      <Tab.Screen
        name="Dashboard"
        component={WrappedDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 2: Sites - Site Management */}
      <Tab.Screen
        name="Sites"
        component={WrappedSiteManagementScreen}
        options={{
          title: 'Sites',
          tabBarIcon: ({ color, size }) => (
            <Icon name="location-city" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 3: Items - Items Management */}
      <Tab.Screen
        name="Items"
        component={WrappedItemsManagementScreen}
        options={{
          title: 'Items',
          tabBarIcon: ({ color, size }) => (
            <Icon name="inventory" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 4: Daily Work - Daily Reports */}
      <Tab.Screen
        name="DailyWork"
        component={WrappedDailyReportsScreen}
        options={{
          title: 'Daily Work',
          tabBarIcon: ({ color, size }) => (
            <Icon name="today" size={size} color={color} />
          ),
        }}
      />

      {/* Tab 5: More - Opens Drawer */}
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default navigation
            e.preventDefault();
            // Open drawer instead
            navigation.dispatch(DrawerActions.openDrawer());
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default SupervisorTabNavigator;
