import React, { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import CommercialDashboardScreen from '../commercial/CommercialDashboardScreen';
import BudgetManagementScreen from '../commercial/BudgetManagementScreen';
import CostTrackingScreen from '../commercial/CostTrackingScreen';
import InvoiceManagementScreen from '../commercial/InvoiceManagementScreen';
import { useAuth } from '../auth/AuthContext';
import type { CommercialDrawerParamList } from './CommercialDrawerNavigator';
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

export type CommercialTabParamList = {
  Dashboard: { showTutorial?: boolean } | undefined;
  BudgetManagement: undefined;
  CostTracking: { filterCategory?: string } | undefined;
  InvoiceManagement: { filterStatus?: 'pending' | 'paid' | 'overdue' } | undefined;
};

type CommercialNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CommercialManager'>;
};

const Tab = createBottomTabNavigator<CommercialTabParamList>();

// ==================== Tab Navigator ====================

const CommercialTabNavigator: React.FC = memo(() => {
  const navigation = useNavigation<DrawerNavigationProp<CommercialDrawerParamList>>();
  const { logout } = useAuth();

  const handleDrawerToggle = useCallback(() => {
    navigation.toggleDrawer();
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  }, [logout, navigation]);

  const HeaderLeft = useCallback(() => (
    <TouchableOpacity onPress={handleDrawerToggle} style={styles.headerMenuButton}>
      <Icon name="menu" size={28} color="#FFF" />
    </TouchableOpacity>
  ), [handleDrawerToggle]);

  const HeaderRight = useCallback(() => (
    <View style={styles.headerButtons}>
      <SyncHeaderButton />
      <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
        <Text style={styles.headerLogoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  ), [handleLogout]);

  const screenOptions = useMemo(() => ({
    headerStyle: {
      backgroundColor: COLORS.PRIMARY,
    },
    headerTintColor: COLORS.SURFACE,
    headerTitleStyle: {
      fontWeight: 'bold' as const,
    },
    headerLeft: HeaderLeft,
    headerRight: HeaderRight,
    tabBarActiveTintColor: COLORS.PRIMARY,
    tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
  }), [HeaderLeft, HeaderRight]);

  const getTabBarIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = '';

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'BudgetManagement':
        iconName = focused ? 'currency-usd' : 'currency-usd';
        break;
      case 'CostTracking':
        iconName = focused ? 'chart-line' : 'chart-line';
        break;
      case 'InvoiceManagement':
        iconName = focused ? 'receipt' : 'receipt';
        break;
      default:
        iconName = 'help';
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  const tabScreenOptions = useCallback(({ route }: { route: { name: keyof CommercialTabParamList } }) => ({
    ...screenOptions,
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
  }), [screenOptions, getTabBarIcon]);

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={CommercialDashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="BudgetManagement"
        component={BudgetManagementScreen}
        options={{
          title: 'Budgets',
          headerTitle: 'Budget Management',
        }}
      />
      <Tab.Screen
        name="CostTracking"
        component={CostTrackingScreen}
        options={{
          title: 'Costs',
          headerTitle: 'Cost Tracking',
        }}
      />
      <Tab.Screen
        name="InvoiceManagement"
        component={InvoiceManagementScreen}
        options={{
          title: 'Invoices',
          headerTitle: 'Invoice Management',
        }}
      />
    </Tab.Navigator>
  );
});

// ==================== Styles ====================

const styles = StyleSheet.create({
  headerMenuButton: {
    marginLeft: 15,
    padding: 5,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  headerLogoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerLogoutText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CommercialTabNavigator;
