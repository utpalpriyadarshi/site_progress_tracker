/**
 * CommercialDrawerNavigator
 *
 * Drawer navigation wrapping the Commercial Manager tab navigator.
 * Provides Financial Reports screen and Tutorial in drawer menu.
 *
 * Structure:
 * - Main Content: CommercialTabNavigator (4 tabs)
 * - Drawer Items: Financial Reports, Tutorial
 *
 * @version 1.0.0
 * @since v2.18 - Commercial Manager Tutorial & Demo Data
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
import { CommercialProvider } from '../commercial/context/CommercialContext';
import CommercialTabNavigator from './CommercialNavigator';
import FinancialReportsScreen from '../commercial/FinancialReportsScreen';
import TutorialService from '../services/TutorialService';

export type CommercialDrawerParamList = {
  CommercialTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  FinancialReports: undefined;
};

const Drawer = createDrawerNavigator<CommercialDrawerParamList>();

// ==================== Custom Drawer Content ====================

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'commercial_manager');
    }
    props.navigation.navigate('CommercialTabs', {
      screen: 'Dashboard',
      params: { showTutorial: true },
    });
  }, [user, props.navigation]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Icon name="currency-usd" size={32} color={theme.colors.primary} />
        <Text style={styles.drawerTitle}>Commercial Manager</Text>
        <Text style={styles.drawerSubtitle}>Financial Management</Text>
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

export const CommercialDrawerNavigator: React.FC = () => {
  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />,
    []
  );

  const getDrawerIcon = useCallback((routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = 'file-document';
    if (routeName === 'FinancialReports') {
      iconName = focused ? 'file-document' : 'file-document-outline';
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
    <CommercialProvider>
      <Drawer.Navigator
        drawerContent={renderDrawerContent}
        screenOptions={screenOptions}
      >
        {/* Main content - Tab Navigator (hidden from drawer) */}
        <Drawer.Screen
          name="CommercialTabs"
          component={CommercialTabNavigator}
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />

        {/* Financial Reports in Drawer */}
        <Drawer.Screen
          name="FinancialReports"
          component={FinancialReportsScreen}
          options={{
            title: 'Financial Reports',
            drawerLabel: 'Financial Reports',
            headerShown: false,
          }}
        />
      </Drawer.Navigator>
    </CommercialProvider>
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

export default CommercialDrawerNavigator;
