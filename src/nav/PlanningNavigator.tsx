/**
 * PlanningNavigator
 *
 * Hybrid navigation with 4 bottom tabs + drawer for additional screens.
 * Phase 3: Navigation restructure with Dashboard + UnifiedSchedule.
 *
 * Bottom Tabs (4 main workflows):
 * - Dashboard: At-a-glance overview with widgets
 * - Key Dates: Key date management and site association
 * - Schedule: Unified schedule with Timeline/Calendar/List views
 * - Gantt: Visual timeline representation
 *
 * Drawer Items (5 detailed screens):
 * - Resources: Resource planning and allocation
 * - Sites: Site management
 * - WBS: Work breakdown structure
 * - Milestones: Milestone tracking
 * - Baseline: Baseline planning
 *
 * @version 3.0.0
 * @since Planning Phase 3
 */

import React, { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps, DrawerNavigationProp } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions, DrawerActions, useNavigation } from '@react-navigation/native';
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
import { KeyDateManagementScreen } from '../planning/key-dates';

import { useAuth } from '../auth/AuthContext';
import { PlanningStackParamList } from './types';
import { PlanningProvider } from '../planning/context';
import TutorialService from '../services/TutorialService';
import { COLORS } from '../theme/colors';
import SyncHeaderButton from './SyncHeaderButton';

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
  Dashboard: { showTutorial?: boolean } | undefined;
  KeyDates: undefined;
  Schedule: undefined;
  Gantt: { siteId?: string } | undefined;
};

export type PlanningDrawerParamList = {
  MainTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  Resources: undefined;
  Sites: undefined;
  WBS: { siteId?: string } | undefined;
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

// ==================== Drawer Menu Button ====================

const DrawerMenuButton = () => {
  const navigation = useNavigation<DrawerNavigationProp<PlanningDrawerParamList>>();
  return (
    <TouchableOpacity
      style={styles.headerMenuButton}
      onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
      accessibilityLabel="Toggle navigation drawer"
    >
      <Icon name="menu" size={28} color="#FFF" />
    </TouchableOpacity>
  );
};

// ==================== Custom Drawer Content ====================

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'planner');
    }
    // Close drawer — Dashboard regains focus, useFocusEffect fires,
    // shouldShowTutorial returns true (just reset), tutorial opens.
    props.navigation.closeDrawer();
  }, [user, props.navigation]);

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

      <Divider style={styles.tutorialDivider} />

      {/* Tutorial Restart */}
      <TouchableOpacity
        style={styles.tutorialButton}
        onPress={handleTutorialRestart}
        accessibilityLabel="Restart tutorial walkthrough"
      >
        <Icon name="school" size={22} color={theme.colors.primary} />
        <Text style={[styles.tutorialButtonText, { color: theme.colors.primary }]}>
          Tutorial
        </Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
});

// ==================== Tab Navigator ====================

const PlanningTabs: React.FC = memo(() => {
  const theme = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<PlanningDrawerParamList>>();

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

  // Memoize icon getter to prevent re-creation on each render
  const getTabBarIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'KeyDates':
        iconName = focused ? 'calendar-check' : 'calendar-check-outline';
        break;
      case 'Schedule':
        iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
        break;
      case 'Gantt':
        iconName = focused ? 'chart-gantt' : 'chart-gantt';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  // Memoize screen options to prevent unnecessary re-renders
  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
    tabBarActiveTintColor: COLORS.PRIMARY,
    tabBarInactiveTintColor: 'gray',
    headerShown: true,
    headerStyle: {
      backgroundColor: COLORS.PRIMARY,
    },
    headerTintColor: '#FFF',
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
    // Performance: Lazy load tabs
    lazy: true,
  }), [getTabBarIcon, HeaderLeft, HeaderRight]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={PlanningDashboard}
        options={{
          title: 'Dashboard',
          headerTitle: 'Planning',
          tabBarAccessibilityLabel: 'Dashboard tab, overview of project planning',
        }}
      />
      <Tab.Screen
        name="KeyDates"
        component={KeyDateManagementScreen}
        options={{
          title: 'Key Dates',
          headerTitle: 'Planning',
          tabBarAccessibilityLabel: 'Key Dates tab, manage key dates and site associations',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={UnifiedSchedule}
        options={{
          title: 'Schedule',
          headerTitle: 'Planning',
          tabBarAccessibilityLabel: 'Schedule tab, manage project schedule',
        }}
      />
      <Tab.Screen
        name="Gantt"
        component={GanttChartScreen}
        options={{
          title: 'Gantt',
          headerTitle: 'Planning',
          tabBarAccessibilityLabel: 'Gantt chart tab, visual timeline',
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

  // Header right: sync button + logout
  const LogoutButton = useCallback(() => (
    <View style={styles.headerButtons}>
      <SyncHeaderButton />
      <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
        <Text style={styles.headerLogoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  ), [handleLogout]);

  // Memoize drawer icon getter
  const getDrawerIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'MainTabs':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'Resources':
        iconName = focused ? 'account-group' : 'account-group-outline';
        break;
      case 'Sites':
        iconName = focused ? 'office-building' : 'office-building-outline';
        break;
      case 'WBS':
        iconName = focused ? 'sitemap' : 'sitemap-outline';
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
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />,
    []
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
    headerLeft: DrawerMenuButton,
    headerRight: LogoutButton,
    // Performance optimizations
    lazy: true, // Lazy load drawer screens
    swipeEdgeWidth: 50, // Reduce edge detection area
    drawerType: 'front' as const, // Better performance than 'slide'
  }), [theme.colors.primary, getDrawerIcon, LogoutButton]);

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
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Resources"
        component={ResourcePlanningScreen}
        options={{
          title: 'Resources',
          drawerLabel: 'Resources',
          headerTitle: 'Resource Planning',
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
          headerTitle: 'WBS',
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
  headerMenuButton: {
    marginLeft: 15,
    paddingHorizontal: 8,
    paddingVertical: 8,
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
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  tutorialDivider: {
    marginTop: 8,
    marginBottom: 4,
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  tutorialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 32,
  },
});

export default PlanningNavigator;