import React, { useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions, DrawerActions, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ManagerDashboardScreen from '../manager/ManagerDashboardScreen';
import KeyDateProgressScreen from '../manager/KeyDateProgressScreen';
import TeamPerformanceScreen from '../manager/TeamPerformanceScreen';
import FinancialReportsScreen from '../manager/FinancialReportsScreen';
import MilestoneManagementScreen from '../manager/MilestoneManagementScreen';
import { useAuth } from '../auth/AuthContext';
import type { ManagerDrawerParamList } from './ManagerDrawerNavigator';
import { COLORS } from '../theme/colors';
import SyncHeaderButton from './SyncHeaderButton';

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
  KeyDateProgress: undefined;
  TeamPerformance: undefined;
  FinancialReports: undefined;
  Milestones: undefined;
};

const Tab = createBottomTabNavigator<ManagerTabParamList>();

const ManagerTabNavigator: React.FC = () => {
  const { logout } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<ManagerDrawerParamList>>();

  const handleLogout = useCallback(async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  }, [logout, navigation]);

  const handleDrawerToggle = useCallback(() => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

  // Hamburger menu button
  const HeaderLeft = useCallback(() => (
    <TouchableOpacity onPress={handleDrawerToggle} style={styles.headerMenuButton}>
      <Icon name="menu" size={28} color="#FFF" />
    </TouchableOpacity>
  ), [handleDrawerToggle]);

  // Sync + Logout button
  const HeaderRight = useCallback(() => (
    <View style={styles.headerButtons}>
      <SyncHeaderButton />
      <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
        <Text style={styles.headerLogoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  ), [handleLogout]);

  // Icon getter for tabs
  const getTabBarIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'KeyDateProgress':
        iconName = focused ? 'calendar-check' : 'calendar-check-outline';
        break;
      case 'TeamPerformance':
        iconName = focused ? 'account-group' : 'account-group-outline';
        break;
      case 'FinancialReports':
        iconName = focused ? 'currency-usd' : 'currency-usd';
        break;
      case 'Milestones':
        iconName = focused ? 'flag-checkered' : 'flag-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  // Screen options
  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
    tabBarActiveTintColor: COLORS.PRIMARY,
    tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
    headerShown: true,
    headerStyle: {
      backgroundColor: COLORS.PRIMARY,
    },
    headerTintColor: COLORS.SURFACE,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 20,
    },
    headerLeft: HeaderLeft,
    headerRight: HeaderRight,
    tabBarStyle: {
      paddingBottom: 4,
      height: 56,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
  }), [getTabBarIcon, HeaderLeft, HeaderRight]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={ManagerDashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Manager',
          tabBarAccessibilityLabel: 'Dashboard tab, overview of project management',
        }}
      />
      <Tab.Screen
        name="KeyDateProgress"
        component={KeyDateProgressScreen}
        options={{
          title: 'Key Dates',
          headerTitle: 'Manager',
          tabBarAccessibilityLabel: 'Key Date Progress tab',
        }}
      />
      <Tab.Screen
        name="TeamPerformance"
        component={TeamPerformanceScreen}
        options={{
          title: 'Team',
          headerTitle: 'Manager',
          tabBarAccessibilityLabel: 'Team Performance tab',
        }}
      />
      <Tab.Screen
        name="FinancialReports"
        component={FinancialReportsScreen}
        options={{
          title: 'Finance',
          headerTitle: 'Manager',
          tabBarAccessibilityLabel: 'Financial Reports tab',
        }}
      />
      <Tab.Screen
        name="Milestones"
        component={MilestoneManagementScreen}
        options={{
          title: 'Milestones',
          headerTitle: 'Manager',
          tabBarAccessibilityLabel: 'Milestone Management tab',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  headerMenuButton: {
    marginLeft: 15,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoutButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerLogoutText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ManagerTabNavigator;
