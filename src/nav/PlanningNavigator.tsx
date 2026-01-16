/**
 * PlanningNavigator
 *
 * Hybrid navigation with 4 bottom tabs + drawer for additional screens.
 * Phase 3: Navigation restructure with Dashboard + UnifiedSchedule.
 *
 * Bottom Tabs (4 main workflows):
 * - Dashboard: At-a-glance overview with widgets
 * - Schedule: Unified schedule with Timeline/Calendar/List views
 * - Gantt: Visual timeline representation
 * - Resources: Resource planning and allocation
 *
 * Drawer Items (5 detailed screens):
 * - Sites: Site management
 * - WBS: Work breakdown structure
 * - Create Item: Item creation form
 * - Milestones: Milestone tracking
 * - Baseline: Baseline planning
 *
 * @version 2.0.0
 * @since Planning Phase 3
 */

import React, { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View, StyleSheet, InteractionManager } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Divider, useTheme } from 'react-native-paper';

// Screens
import WBSManagementScreen from '../planning/WBSManagementScreen';
import ItemCreationScreen from '../planning/ItemCreationScreen';
import ItemEditScreen from '../planning/ItemEditScreen';
import GanttChartScreen from '../planning/GanttChartScreen';
import MilestoneTrackingScreen from '../planning/MilestoneTrackingScreen';
import BaselineScreen from '../planning/BaselineScreen';
import SiteManagementScreen from '../planning/SiteManagementScreen';
import ResourcePlanningScreen from '../planning/ResourcePlanningScreen';
import { PlanningDashboard } from '../planning/dashboard';
import { UnifiedSchedule } from '../planning/schedule';

import { useAuth } from '../auth/AuthContext';
import { PlanningStackParamList } from './types';
import { PlanningProvider } from '../planning/context';

// ==================== Types ====================

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

export type PlanningTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Gantt: undefined;
  Resources: undefined;
};

export type PlanningDrawerParamList = {
  MainTabs: undefined;
  Sites: undefined;
  WBS: undefined;
  CreateItem: undefined;
  MilestoneTracking: undefined;
  Baseline: undefined;
};

type PlanningNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Planning'>;
};

// ==================== Navigators ====================

const Tab = createBottomTabNavigator<PlanningTabParamList>();
const Drawer = createDrawerNavigator<PlanningDrawerParamList>();
const Stack = createNativeStackNavigator<PlanningStackParamList>();

// ==================== Custom Drawer Content ====================

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  onLogout: () => void;
}

const CustomDrawerContent: React.FC<CustomDrawerContentProps> = memo(({ onLogout, ...props }) => {
  const theme = useTheme();

  // Memoize logout handler to prevent unnecessary re-renders
  const handleLogoutPress = useCallback(() => {
    // Close drawer first for smoother transition
    props.navigation.closeDrawer();
    // Defer logout to after animations complete
    InteractionManager.runAfterInteractions(() => {
      onLogout();
    });
  }, [onLogout, props.navigation]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Icon name="clipboard-check-outline" size={32} color={theme.colors.primary} />
        <Text style={styles.drawerTitle}>Planning</Text>
        <Text style={styles.drawerSubtitle}>Project Management</Text>
      </View>

      <Divider />

      {/* Navigation Items */}
      <DrawerItemList {...props} />

      <Divider style={styles.divider} />

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogoutPress}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Logout"
        activeOpacity={0.7}
      >
        <Icon name="logout" size={22} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
});

// ==================== Tab Navigator ====================

const PlanningTabs: React.FC = memo(() => {
  const theme = useTheme();

  // Memoize icon getter to prevent re-creation on each render
  const getTabBarIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'Schedule':
        iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
        break;
      case 'Gantt':
        iconName = focused ? 'chart-gantt' : 'chart-gantt';
        break;
      case 'Resources':
        iconName = focused ? 'account-group' : 'account-group-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  // Memoize screen options to prevent unnecessary re-renders
  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: 'gray',
    headerShown: false,
    tabBarStyle: {
      paddingBottom: 4,
      height: 56,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
    // Performance: Lazy load tabs
    lazy: true,
  }), [theme.colors.primary, getTabBarIcon]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={PlanningDashboard}
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard tab, overview of project planning',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={UnifiedSchedule}
        options={{
          title: 'Schedule',
          tabBarAccessibilityLabel: 'Schedule tab, manage project schedule',
        }}
      />
      <Tab.Screen
        name="Gantt"
        component={GanttChartScreen}
        options={{
          title: 'Gantt',
          tabBarAccessibilityLabel: 'Gantt chart tab, visual timeline',
        }}
      />
      <Tab.Screen
        name="Resources"
        component={ResourcePlanningScreen}
        options={{
          title: 'Resources',
          tabBarAccessibilityLabel: 'Resources tab, manage resource allocation',
        }}
      />
    </Tab.Navigator>
  );
});

// ==================== Drawer Navigator ====================

const PlanningDrawer: React.FC<PlanningNavigatorProps> = memo(({ navigation: parentNavigation }) => {
  const { logout } = useAuth();
  const theme = useTheme();

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    await logout();
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  }, [logout, parentNavigation]);

  // Memoize drawer icon getter
  const getDrawerIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'MainTabs':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'Sites':
        iconName = focused ? 'office-building' : 'office-building-outline';
        break;
      case 'WBS':
        iconName = focused ? 'sitemap' : 'sitemap-outline';
        break;
      case 'CreateItem':
        iconName = focused ? 'plus-circle' : 'plus-circle-outline';
        break;
      case 'MilestoneTracking':
        iconName = focused ? 'flag' : 'flag-outline';
        break;
      case 'Baseline':
        iconName = focused ? 'content-save' : 'content-save-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  // Memoize drawer content renderer
  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} onLogout={handleLogout} />,
    [handleLogout]
  );

  // Memoize screen options for better performance
  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    drawerIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getDrawerIcon(route.name, focused, color, size),
    drawerActiveTintColor: theme.colors.primary,
    drawerInactiveTintColor: 'gray',
    headerStyle: {
      backgroundColor: theme.colors.primary,
    },
    headerTintColor: '#FFF',
    headerTitleStyle: {
      fontWeight: 'bold' as const,
    },
    // Performance optimizations
    lazy: true, // Lazy load drawer screens
    swipeEdgeWidth: 50, // Reduce edge detection area
    drawerType: 'front' as const, // Better performance than 'slide'
  }), [theme.colors.primary, getDrawerIcon]);

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={screenOptions}
    >
      <Drawer.Screen
        name="MainTabs"
        component={PlanningTabs}
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          headerTitle: 'Planning',
        }}
      />
      <Drawer.Screen
        name="Sites"
        component={SiteManagementScreen}
        options={{
          title: 'Sites',
          drawerLabel: 'Site Management',
          headerTitle: 'Site Management',
        }}
      />
      <Drawer.Screen
        name="WBS"
        component={WBSManagementScreen}
        options={{
          title: 'WBS',
          drawerLabel: 'Work Breakdown',
          headerTitle: 'Work Breakdown Structure',
        }}
      />
      <Drawer.Screen
        name="CreateItem"
        component={ItemCreationScreen}
        options={{
          title: 'Create Item',
          drawerLabel: 'Create Item',
          headerTitle: 'Create Planning Item',
        }}
      />
      <Drawer.Screen
        name="MilestoneTracking"
        component={MilestoneTrackingScreen}
        options={{
          title: 'Milestones',
          drawerLabel: 'Milestones',
          headerTitle: 'Milestone Tracking',
        }}
      />
      <Drawer.Screen
        name="Baseline"
        component={BaselineScreen}
        options={{
          title: 'Baseline',
          drawerLabel: 'Baseline',
          headerTitle: 'Baseline Planning',
        }}
      />
    </Drawer.Navigator>
  );
});

// ==================== Main Stack Navigator ====================

const PlanningNavigator: React.FC<PlanningNavigatorProps> = ({ navigation: parentNavigation }) => {
  return (
    <PlanningProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SiteManagement">
          {() => <PlanningDrawer navigation={parentNavigation} />}
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
    </PlanningProvider>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  drawerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    marginLeft: 32,
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
});

export default PlanningNavigator;