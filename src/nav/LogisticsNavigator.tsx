/**
 * LogisticsNavigator
 *
 * Hybrid drawer + tabs navigation for the Logistics role.
 * Matches Planner/Manager design pattern with purple header and hamburger menu.
 * - 4 bottom tabs: Dashboard, Materials, Inventory, Deliveries
 * - Drawer items: Analytics, Equipment, Purchase Orders, DOORS Register, RFQ List, Tutorial
 * - Stack screens for detail views
 *
 * @version 3.0.0
 * @since Logistics Phase 3
 * @updated v2.17 - Purple header, hamburger menu, Tutorial integration
 */

import React, { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions, DrawerActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Divider } from 'react-native-paper';

import { LogisticsProvider, useLogisticsContext } from '../logistics/context/LogisticsContext';
import { useAuth } from '../auth/AuthContext';
import TutorialService from '../services/TutorialService';

// Import the new widget-based dashboard
import { LogisticsDashboard } from '../logistics/dashboard';

// Import all screens
import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import LogisticsAnalyticsScreen from '../logistics/LogisticsAnalyticsScreen';
import PurchaseOrderManagementScreen from '../logistics/PurchaseOrderManagementScreen';
import DoorsRegisterScreen from '../logistics/DoorsRegisterScreen';
import DoorsDetailScreen from '../logistics/DoorsDetailScreen';
import DoorsPackageEditScreen from '../logistics/DoorsPackageEditScreen';
import DoorsRequirementEditScreen from '../logistics/DoorsRequirementEditScreen';
import RfqListScreen from '../logistics/RfqListScreen';
import RfqCreateScreen from '../logistics/RfqCreateScreen';
import RfqDetailScreen from '../logistics/RfqDetailScreen';
import { COLORS } from '../theme/colors';
import SyncHeaderButton from './SyncHeaderButton';

// ==================== Type Definitions ====================

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

export type LogisticsTabParamList = {
  Dashboard: { showTutorial?: boolean } | undefined;
  Materials: undefined;
  Inventory: undefined;
  Deliveries: undefined;
};

export type LogisticsDrawerParamList = {
  MainTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  Analytics: undefined;
  PurchaseOrders: undefined;
  DoorsRegister: undefined;
  RfqList: undefined;
};

export type LogisticsStackParamList = {
  Main: undefined;
  DoorsDetail: { packageId: string };
  DoorsPackageEdit: { packageId: string };
  DoorsRequirementEdit: { requirementId: string };
  RfqCreate: { doorsPackageId?: string };
  RfqDetail: { rfqId: string };
};

type LogisticsNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
};

// ==================== Navigators ====================

const Tab = createBottomTabNavigator<LogisticsTabParamList>();
const Drawer = createDrawerNavigator<LogisticsDrawerParamList>();
const Stack = createNativeStackNavigator<LogisticsStackParamList>();

// ==================== Tab Icons ====================

const TAB_ICONS = {
  Dashboard: 'view-dashboard',
  Materials: 'package-variant',
  Inventory: 'warehouse',
  Deliveries: 'truck-delivery',
} as const;

// ==================== Tab Navigator (4 main workflows) ====================

const LogisticsTabs = memo(() => {
  const { logout } = useAuth();
  const navigation = useNavigation<DrawerNavigationProp<LogisticsDrawerParamList>>();

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

  // Header right: sync button + logout
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
    const iconName = TAB_ICONS[routeName as keyof typeof TAB_ICONS] || 'help-circle';
    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  // Screen options
  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
    tabBarActiveTintColor: COLORS.PRIMARY,
    tabBarInactiveTintColor: '#8E8E93',
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
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabBarLabel,
    lazy: true,
  }), [getTabBarIcon, HeaderLeft, HeaderRight]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={LogisticsDashboard}
        options={{
          title: 'Dashboard',
          headerTitle: 'Logistics',
          tabBarAccessibilityLabel: 'Dashboard tab, overview of logistics',
        }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialTrackingScreen}
        options={{
          title: 'Materials',
          headerTitle: 'Logistics',
          tabBarAccessibilityLabel: 'Materials tracking tab',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryManagementScreen}
        options={{
          title: 'Inventory',
          headerTitle: 'Logistics',
          tabBarAccessibilityLabel: 'Inventory management tab',
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliverySchedulingScreen}
        options={{
          title: 'Deliveries',
          headerTitle: 'Logistics',
          tabBarAccessibilityLabel: 'Delivery scheduling tab',
        }}
      />
    </Tab.Navigator>
  );
});

// ==================== Custom Drawer Content ====================

const CustomDrawerContent = memo<DrawerContentComponentProps>(({ navigation, state }) => {
  const { selectedProject } = useLogisticsContext();
  const { user } = useAuth();
  const projectName = selectedProject ? (selectedProject as any).name : 'No Project Selected';

  const handleNavigation = useCallback((routeName: string) => {
    navigation.navigate(routeName);
  }, [navigation]);

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'logistics');
    }
    navigation.navigate('MainTabs', {
      screen: 'Dashboard',
      params: { showTutorial: true },
    });
  }, [user, navigation]);

  return (
    <DrawerContentScrollView style={styles.drawerContent}>
      {/* Project Header */}
      <View style={styles.drawerHeader}>
        <Icon name="truck-fast" size={32} color={COLORS.PRIMARY} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Logistics</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {projectName}
          </Text>
        </View>
      </View>

      {/* Main Tabs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MAIN</Text>
        <DrawerItem
          label="Dashboard"
          icon={({ color, size }) => <Icon name="view-dashboard" color={color} size={size} />}
          onPress={() => handleNavigation('MainTabs')}
          focused={state.index === 0}
          activeTintColor={COLORS.PRIMARY}
          accessibilityLabel="Navigate to Dashboard"
        />
      </View>

      {/* Additional Screens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MANAGEMENT</Text>
        <DrawerItem
          label="Analytics"
          icon={({ color, size }) => <Icon name="chart-line" color={color} size={size} />}
          onPress={() => handleNavigation('Analytics')}
          focused={state.index === 1}
          activeTintColor={COLORS.PRIMARY}
          accessibilityLabel="Navigate to Analytics Reports"
        />
        <DrawerItem
          label="Purchase Orders"
          icon={({ color, size }) => <Icon name="clipboard-list" color={color} size={size} />}
          onPress={() => handleNavigation('PurchaseOrders')}
          focused={state.index === 2}
          activeTintColor={COLORS.PRIMARY}
          accessibilityLabel="Navigate to Purchase Orders"
        />
        <DrawerItem
          label="DOORS Register"
          icon={({ color, size }) => <Icon name="door" color={color} size={size} />}
          onPress={() => handleNavigation('DoorsRegister')}
          focused={state.index === 3}
          activeTintColor={COLORS.PRIMARY}
          accessibilityLabel="Navigate to DOORS Register"
        />
        <DrawerItem
          label="RFQ Management"
          icon={({ color, size }) => <Icon name="file-document-outline" color={color} size={size} />}
          onPress={() => handleNavigation('RfqList')}
          focused={state.index === 4}
          activeTintColor={COLORS.PRIMARY}
          accessibilityLabel="Navigate to RFQ Management"
        />
      </View>

      {/* Tutorial Section */}
      <Divider style={styles.tutorialDivider} />
      <TouchableOpacity
        style={styles.tutorialButton}
        onPress={handleTutorialRestart}
        accessibilityLabel="Restart tutorial walkthrough"
      >
        <Icon name="school" size={22} color={COLORS.PRIMARY} />
        <Text style={[styles.tutorialButtonText, { color: COLORS.PRIMARY }]}>
          Tutorial
        </Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
});

// ==================== Drawer Navigator ====================

interface LogisticsDrawerProps {
  parentNavigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
}

const LogisticsDrawer = memo<LogisticsDrawerProps>(({ parentNavigation }) => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 50,
        lazy: true,
        drawerStyle: styles.drawer,
        drawerActiveTintColor: COLORS.PRIMARY,
        drawerInactiveTintColor: '#8E8E93',
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
    >
      <Drawer.Screen
        name="MainTabs"
        component={LogisticsTabs}
        options={{
          drawerLabel: 'Dashboard',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Analytics"
        component={LogisticsAnalyticsScreen}
        options={{
          title: 'Analytics Reports',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="PurchaseOrders"
        component={PurchaseOrderManagementScreen}
        options={{
          title: 'Purchase Orders',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="DoorsRegister"
        component={DoorsRegisterScreen}
        options={{
          title: 'DOORS Register',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="RfqList"
        component={RfqListScreen}
        options={{
          title: 'RFQ Management',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
});

// ==================== Main Stack Navigator ====================

const LogisticsNavigator: React.FC<LogisticsNavigatorProps> = ({ navigation: parentNavigation }) => {
  return (
    <LogisticsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {() => <LogisticsDrawer parentNavigation={parentNavigation} />}
        </Stack.Screen>
        <Stack.Screen
          name="DoorsDetail"
          component={DoorsDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoorsPackageEdit"
          component={DoorsPackageEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoorsRequirementEdit"
          component={DoorsRequirementEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RfqCreate"
          component={RfqCreateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RfqDetail"
          component={RfqDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </LogisticsProvider>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  tabBar: {
    height: 56,
    paddingBottom: 4,
    paddingTop: 4,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  drawer: {
    width: 280,
    backgroundColor: COLORS.BACKGROUND,
  },
  drawerContent: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WARNING,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  offlineText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  section: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.TEXT_TERTIARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
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
    color: COLORS.SURFACE,
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

export default LogisticsNavigator;
