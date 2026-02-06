/**
 * DesignEngineerNavigator
 *
 * Navigation with 4 bottom tabs + drawer for tutorial access.
 *
 * Bottom Tabs (4 main workflows):
 * - Dashboard: Overview with widgets and metrics
 * - Design Docs: Design document management
 * - DOORS Packages: DOORS package tracking
 * - Design RFQs: Design RFQ management
 *
 * Drawer Items:
 * - Tutorial: Restart the tutorial walkthrough
 *
 * @version 2.0.0
 * @since v2.14 - Design Engineer Tutorial & Demo Data
 */

import React, { memo, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Divider, useTheme } from 'react-native-paper';

import DesignEngineerDashboardScreen from '../design_engineer/DesignEngineerDashboardScreen';
import DoorsPackageManagementScreen from '../design_engineer/DoorsPackageManagementScreen';
import DesignRfqManagementScreen from '../design_engineer/DesignRfqManagementScreen';
import DesignDocumentManagementScreen from '../design_engineer/DesignDocumentManagementScreen';
import { useAuth } from '../auth/AuthContext';
import { DesignEngineerProvider } from '../design_engineer/context/DesignEngineerContext';
import TutorialService from '../services/TutorialService';

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

export type DesignEngineerTabParamList = {
  Dashboard: { showTutorial?: boolean } | undefined;
  DesignDocuments: undefined;
  DoorsPackages: undefined;
  DesignRfqs: undefined;
};

export type DesignEngineerDrawerParamList = {
  MainTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
};

type DesignEngineerNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'DesignEngineer'>;
};

// ==================== Navigators ====================

const Tab = createBottomTabNavigator<DesignEngineerTabParamList>();
const Drawer = createDrawerNavigator<DesignEngineerDrawerParamList>();

// ==================== Custom Drawer Content ====================

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'design_engineer');
    }
    props.navigation.navigate('MainTabs', {
      screen: 'Dashboard',
      params: { showTutorial: true },
    });
  }, [user, props.navigation]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Icon name="file-cad-box" size={32} color={theme.colors.primary} />
        <Text style={styles.drawerTitle}>Design Engineer</Text>
        <Text style={styles.drawerSubtitle}>Engineering Management</Text>
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

const DesignEngineerTabs: React.FC = memo(() => {
  const theme = useTheme();

  const getTabBarIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
      case 'DesignDocuments':
        iconName = focused ? 'file-document' : 'file-document-outline';
        break;
      case 'DoorsPackages':
        iconName = focused ? 'package-variant' : 'package-variant-closed';
        break;
      case 'DesignRfqs':
        iconName = focused ? 'file-document-edit' : 'file-document-edit-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  const screenOptions = useMemo(() => ({ route }: { route: { name: string } }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getTabBarIcon(route.name, focused, color, size),
    tabBarActiveTintColor: '#673AB7',
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
    lazy: true,
  }), [theme.colors.primary, getTabBarIcon]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DesignEngineerDashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarAccessibilityLabel: 'Dashboard tab, overview of design engineering',
        }}
      />
      <Tab.Screen
        name="DesignDocuments"
        component={DesignDocumentManagementScreen}
        options={{
          title: 'Design Docs',
          tabBarAccessibilityLabel: 'Design Documents tab, manage design documents',
        }}
      />
      <Tab.Screen
        name="DoorsPackages"
        component={DoorsPackageManagementScreen}
        options={{
          title: 'DOORS',
          tabBarAccessibilityLabel: 'DOORS Packages tab, manage equipment requirements',
        }}
      />
      <Tab.Screen
        name="DesignRfqs"
        component={DesignRfqManagementScreen}
        options={{
          title: 'Design RFQs',
          tabBarAccessibilityLabel: 'Design RFQs tab, manage request for quotes',
        }}
      />
    </Tab.Navigator>
  );
});

// ==================== Drawer Navigator ====================

const DesignEngineerDrawer: React.FC<DesignEngineerNavigatorProps> = memo(({ navigation: parentNavigation }) => {
  const { logout } = useAuth();
  const theme = useTheme();

  const handleLogout = useCallback(async () => {
    await logout();
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  }, [logout, parentNavigation]);

  const LogoutButton = useCallback(() => (
    <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutButton}>
      <Text style={styles.headerLogoutText}>Logout</Text>
    </TouchableOpacity>
  ), [handleLogout]);

  const getDrawerIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'help-circle';

    switch (routeName) {
      case 'MainTabs':
        iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />,
    []
  );

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
    headerRight: LogoutButton,
    lazy: true,
    swipeEdgeWidth: 50,
    drawerType: 'front' as const,
  }), [theme.colors.primary, getDrawerIcon, LogoutButton]);

  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={screenOptions}
    >
      <Drawer.Screen
        name="MainTabs"
        component={DesignEngineerTabs}
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          headerTitle: 'Design Engineer',
        }}
      />
    </Drawer.Navigator>
  );
});

// ==================== Main Navigator ====================

const DesignEngineerNavigator: React.FC<DesignEngineerNavigatorProps> = ({ navigation: parentNavigation }) => {
  return (
    <DesignEngineerProvider>
      <DesignEngineerDrawer navigation={parentNavigation} />
    </DesignEngineerProvider>
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
  headerLogoutButton: {
    marginRight: 15,
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

export default DesignEngineerNavigator;
