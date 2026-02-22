/**
 * ManagerDrawerNavigator
 *
 * Drawer navigation wrapping the Manager tab navigator.
 * Provides BOM Management screen and Tutorial in drawer menu.
 *
 * Structure:
 * - Main Content: ManagerTabNavigator (4 tabs)
 * - Drawer Items: BOM Management, Tutorial
 *
 * @version 2.0.0
 * @since v2.16 - Manager Tutorial & Demo Data
 * @updated v2.17 - Moved BOM to Drawer, Planner-style Header
 */

import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
  DrawerItemList,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../auth/AuthContext';
import { ManagerProvider } from '../manager/context/ManagerContext';
import { BomProvider } from '../manager/context/BomContext';
import ManagerTabNavigator from './ManagerNavigator';
import BomManagementScreen from '../manager/BomManagementScreen';
import ChangeOrdersScreen from '../manager/ChangeOrdersScreen';
import TutorialService from '../services/TutorialService';

export type ManagerDrawerParamList = {
  ManagerTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  BomManagement: undefined;
  ChangeOrders: undefined;
};

const Drawer = createDrawerNavigator<ManagerDrawerParamList>();

// ==================== Custom Drawer Content ====================

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'manager');
    }
    props.navigation.navigate('ManagerTabs', {
      screen: 'Dashboard',
      params: { showTutorial: true },
    });
  }, [user, props.navigation]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Icon name="business" size={32} color={theme.colors.primary} />
        <Text style={styles.drawerTitle}>Manager</Text>
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

// ==================== Main Navigator ====================

export const ManagerDrawerNavigator: React.FC = () => {
  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />,
    []
  );

  const getDrawerIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'clipboard-list-outline';
    if (routeName === 'BomManagement') {
      iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
    } else if (routeName === 'ChangeOrders') {
      iconName = focused ? 'file-document-edit' : 'file-document-edit-outline';
    }
    return <Icon name={iconName} size={size} color={color} />;
  }, []);

  const screenOptions = useCallback(({ route }: { route: { name: string } }) => ({
    drawerIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getDrawerIcon(route.name, focused, color, size),
    drawerActiveTintColor: '#007AFF',
    drawerInactiveTintColor: '#666',
    headerShown: false,
    drawerType: 'front' as const,
  }), [getDrawerIcon]);

  return (
    <ManagerProvider>
      <BomProvider>
        <Drawer.Navigator
          drawerContent={renderDrawerContent}
          screenOptions={screenOptions}
        >
          {/* Main content - Tab Navigator (hidden from drawer) */}
          <Drawer.Screen
            name="ManagerTabs"
            component={ManagerTabNavigator}
            options={{
              drawerItemStyle: { display: 'none' },
              headerShown: false,
            }}
          />

          {/* BOM Management in Drawer */}
          <Drawer.Screen
            name="BomManagement"
            component={BomManagementScreen}
            options={{
              title: 'BOM Management',
              drawerLabel: 'BOM Management',
              headerShown: false,
            }}
          />

          {/* Change Orders in Drawer */}
          <Drawer.Screen
            name="ChangeOrders"
            component={ChangeOrdersScreen}
            options={{
              title: 'Change Orders',
              drawerLabel: 'Change Orders',
              headerShown: false,
            }}
          />
        </Drawer.Navigator>
      </BomProvider>
    </ManagerProvider>
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

export default ManagerDrawerNavigator;
