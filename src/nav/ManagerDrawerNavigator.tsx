/**
 * ManagerDrawerNavigator
 *
 * Drawer navigation wrapping the Manager tab navigator.
 * Provides a Tutorial restart button in the drawer menu.
 *
 * Structure:
 * - Main Content: ManagerTabNavigator (5 tabs + More)
 * - Drawer Items: Tutorial
 *
 * @version 1.0.0
 * @since v2.16 - Manager Tutorial & Demo Data
 */

import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../auth/AuthContext';
import { ManagerProvider } from '../manager/context/ManagerContext';
import { BomProvider } from '../manager/context/BomContext';
import ManagerTabNavigator from './ManagerNavigator';
import TutorialService from '../services/TutorialService';

export type ManagerDrawerParamList = {
  ManagerTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
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

  return (
    <ManagerProvider>
      <BomProvider>
        <Drawer.Navigator
          drawerContent={renderDrawerContent}
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            drawerStyle: { width: 280 },
            drawerActiveTintColor: '#007AFF',
            drawerInactiveTintColor: '#666',
          }}
        >
          {/* Main content - Tab Navigator (hidden from drawer) */}
          <Drawer.Screen
            name="ManagerTabs"
            component={ManagerTabNavigator}
            options={{ drawerItemStyle: { display: 'none' } }}
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
