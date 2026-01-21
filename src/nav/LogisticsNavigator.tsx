/**
 * LogisticsNavigator
 *
 * Hybrid drawer + tabs navigation for the Logistics role.
 * Phase 3 implementation with:
 * - 5 bottom tabs: Dashboard, Materials, Inventory, Deliveries, Analytics
 * - Drawer items: Equipment, Purchase Orders, DOORS Register, RFQ List
 * - Stack screens for detail views
 *
 * @version 2.0.0
 * @since Logistics Phase 3
 */

import React, { memo, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { LogisticsProvider, useLogisticsContext } from '../logistics/context/LogisticsContext';

// Import the new widget-based dashboard
import { LogisticsDashboard } from '../logistics/dashboard';

// Import all screens
import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import LogisticsAnalyticsScreen from '../logistics/LogisticsAnalyticsScreen';
import EquipmentManagementScreen from '../logistics/EquipmentManagementScreen';
import PurchaseOrderManagementScreen from '../logistics/PurchaseOrderManagementScreen';
import DoorsRegisterScreen from '../logistics/DoorsRegisterScreen';
import DoorsDetailScreen from '../logistics/DoorsDetailScreen';
import DoorsPackageEditScreen from '../logistics/DoorsPackageEditScreen';
import DoorsRequirementEditScreen from '../logistics/DoorsRequirementEditScreen';
import RfqListScreen from '../logistics/RfqListScreen';
import RfqCreateScreen from '../logistics/RfqCreateScreen';
import RfqDetailScreen from '../logistics/RfqDetailScreen';

import { useAuth } from '../auth/AuthContext';

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
  Dashboard: undefined;
  Materials: undefined;
  Inventory: undefined;
  Deliveries: undefined;
  Analytics: undefined;
};

export type LogisticsDrawerParamList = {
  MainTabs: undefined;
  Equipment: undefined;
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

const TAB_ICONS: Record<keyof LogisticsTabParamList, string> = {
  Dashboard: 'view-dashboard',
  Materials: 'package-variant',
  Inventory: 'warehouse',
  Deliveries: 'truck-delivery',
  Analytics: 'chart-line',
};

// ==================== Tab Navigator (5 main workflows) ====================

const LogisticsTabs = memo(() => {
  const { logout } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = TAB_ICONS[route.name];
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
        lazy: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={LogisticsDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard tab',
        }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialTrackingScreen}
        options={{
          tabBarLabel: 'Materials',
          tabBarAccessibilityLabel: 'Materials tracking tab',
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryManagementScreen}
        options={{
          tabBarLabel: 'Inventory',
          tabBarAccessibilityLabel: 'Inventory management tab',
        }}
      />
      <Tab.Screen
        name="Deliveries"
        component={DeliverySchedulingScreen}
        options={{
          tabBarLabel: 'Deliveries',
          tabBarAccessibilityLabel: 'Delivery scheduling tab',
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={LogisticsAnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarAccessibilityLabel: 'Logistics analytics tab',
        }}
      />
    </Tab.Navigator>
  );
});

// ==================== Custom Drawer Content ====================

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  onLogout: () => void;
}

const CustomDrawerContent = memo<CustomDrawerContentProps>(({ navigation, state, onLogout }) => {
  const { isOffline, selectedProject } = useLogisticsContext();
  const projectName = selectedProject ? (selectedProject as any).name : 'No Project Selected';

  const handleNavigation = useCallback((routeName: string) => {
    navigation.navigate(routeName);
  }, [navigation]);

  return (
    <DrawerContentScrollView style={styles.drawerContent}>
      {/* Offline Banner */}
      {isOffline && (
        <View
          style={styles.offlineBanner}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="You are offline. Changes will sync when connected."
        >
          <Icon name="cloud-off-outline" size={16} color="#000" />
          <Text style={styles.offlineText}>
            Offline Mode - Changes will sync when connected
          </Text>
        </View>
      )}

      {/* Project Header */}
      <View style={styles.drawerHeader}>
        <Icon name="briefcase-outline" size={24} color="#007AFF" />
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
          activeTintColor="#007AFF"
          accessibilityLabel="Navigate to Dashboard"
        />
      </View>

      {/* Additional Screens */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MANAGEMENT</Text>
        <DrawerItem
          label="Equipment"
          icon={({ color, size }) => <Icon name="hammer-wrench" color={color} size={size} />}
          onPress={() => handleNavigation('Equipment')}
          focused={state.index === 1}
          activeTintColor="#007AFF"
          accessibilityLabel="Navigate to Equipment Management"
        />
        <DrawerItem
          label="Purchase Orders"
          icon={({ color, size }) => <Icon name="clipboard-list" color={color} size={size} />}
          onPress={() => handleNavigation('PurchaseOrders')}
          focused={state.index === 2}
          activeTintColor="#007AFF"
          accessibilityLabel="Navigate to Purchase Orders"
        />
        <DrawerItem
          label="DOORS Register"
          icon={({ color, size }) => <Icon name="door" color={color} size={size} />}
          onPress={() => handleNavigation('DoorsRegister')}
          focused={state.index === 3}
          activeTintColor="#007AFF"
          accessibilityLabel="Navigate to DOORS Register"
        />
        <DrawerItem
          label="RFQ Management"
          icon={({ color, size }) => <Icon name="file-document-outline" color={color} size={size} />}
          onPress={() => handleNavigation('RfqList')}
          focused={state.index === 4}
          activeTintColor="#007AFF"
          accessibilityLabel="Navigate to RFQ Management"
        />
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => <Icon name="logout" color="#FF3B30" size={size} />}
          onPress={onLogout}
          labelStyle={styles.logoutLabel}
          accessibilityLabel="Logout from application"
        />
      </View>
    </DrawerContentScrollView>
  );
});

// ==================== Drawer Navigator ====================

interface LogisticsDrawerProps {
  parentNavigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
}

const LogisticsDrawer = memo<LogisticsDrawerProps>(({ parentNavigation }) => {
  const { logout } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  }, [logout, parentNavigation]);

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: styles.header,
        headerTintColor: '#FFF',
        headerTitleStyle: styles.headerTitle,
        drawerType: 'front',
        swipeEdgeWidth: 50,
        lazy: true,
        drawerStyle: styles.drawer,
      }}
      drawerContent={(props) => (
        <CustomDrawerContent {...props} onLogout={handleLogout} />
      )}
    >
      <Drawer.Screen
        name="MainTabs"
        component={LogisticsTabs}
        options={{
          drawerLabel: 'Dashboard',
          title: 'Logistics',
        }}
      />
      <Drawer.Screen
        name="Equipment"
        component={EquipmentManagementScreen}
        options={{
          title: 'Equipment Management',
        }}
      />
      <Drawer.Screen
        name="PurchaseOrders"
        component={PurchaseOrderManagementScreen}
        options={{
          title: 'Purchase Orders',
        }}
      />
      <Drawer.Screen
        name="DoorsRegister"
        component={DoorsRegisterScreen}
        options={{
          title: 'DOORS Register',
        }}
      />
      <Drawer.Screen
        name="RfqList"
        component={RfqListScreen}
        options={{
          title: 'RFQ Management',
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
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  drawer: {
    width: 280,
    backgroundColor: '#F8F9FA',
  },
  drawerContent: {
    flex: 1,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC107',
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
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  section: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  logoutSection: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoutLabel: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#007AFF',
  },
});

export default LogisticsNavigator;
