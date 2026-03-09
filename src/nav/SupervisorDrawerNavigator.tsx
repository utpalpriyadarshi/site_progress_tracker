/**
 * SupervisorDrawerNavigator
 *
 * Drawer navigation for secondary supervisor screens
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 *
 * Structure:
 * - Main Content: SupervisorTabNavigator (5 tabs)
 * - Drawer Items: 4 secondary screens + Tutorial
 *
 * @version 2.0.0
 * @since v2.15 - Supervisor Tutorial & Demo Data
 */

import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import { COLORS } from '../theme/colors';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SiteProvider } from '../supervisor/context/SiteContext';
import SupervisorTabNavigator from './SupervisorTabNavigator';
import MaterialTrackingScreen from '../supervisor/MaterialTrackingScreen';
import HindranceReportScreen from '../supervisor/hindrance_reports/HindranceReportScreen';
import TemplatesStackNavigator from '../supervisor/templates/TemplatesStackNavigator';
import SiteInspectionScreen from '../supervisor/SiteInspectionScreen';
import ReportsHistoryScreen from '../supervisor/ReportsHistoryScreen';
import { useAuth } from '../auth/AuthContext';
import TutorialService from '../services/TutorialService';

export type SupervisorDrawerParamList = {
  SupervisorTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  Materials: undefined;
  Templates: undefined;
  Issues: undefined;
  Inspection: undefined;
  History: undefined;
};

const Drawer = createDrawerNavigator<SupervisorDrawerParamList>();

// ==================== Custom Drawer Content ====================

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const theme = useTheme();
  const { user } = useAuth();

  const handleTutorialRestart = useCallback(async () => {
    if (user) {
      await TutorialService.resetTutorial(user.userId, 'supervisor');
    }
    props.navigation.navigate('SupervisorTabs', {
      screen: 'Dashboard',
      params: { showTutorial: true },
    });
  }, [user, props.navigation]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Icon name="engineering" size={32} color={theme.colors.primary} />
        <Text style={styles.drawerTitle}>Supervisor</Text>
        <Text style={styles.drawerSubtitle}>Site Management</Text>
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

export const SupervisorDrawerNavigator: React.FC = () => {
  const renderDrawerContent = useCallback(
    (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />,
    []
  );

  return (
    <SiteProvider>
      <Drawer.Navigator
        drawerContent={renderDrawerContent}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: { width: 280 },
          drawerActiveTintColor: COLORS.PRIMARY,
          drawerInactiveTintColor: COLORS.TEXT_SECONDARY,
        }}
      >
        {/* Main content - Tab Navigator (hidden from drawer) */}
        <Drawer.Screen
          name="SupervisorTabs"
          component={SupervisorTabNavigator}
          options={{ drawerItemStyle: { display: 'none' } }}
        />

        {/* Drawer Items - Secondary Screens */}
        <Drawer.Screen
          name="Materials"
          component={MaterialTrackingScreen}
          options={{
            drawerLabel: 'Material Tracking',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Icon name="inventory" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="Templates"
          component={TemplatesStackNavigator}
          options={{
            drawerLabel: 'Activity Templates',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Icon name="assignment" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="Issues"
          component={HindranceReportScreen}
          options={{
            drawerLabel: 'Hindrance Reports',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Icon name="report-problem" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="Inspection"
          component={SiteInspectionScreen}
          options={{
            drawerLabel: 'Site Inspection',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Icon name="fact-check" size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name="History"
          component={ReportsHistoryScreen}
          options={{
            drawerLabel: 'Reports History',
            drawerIcon: ({ color, size }: { color: string; size: number }) => (
              <Icon name="history" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </SiteProvider>
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

export default SupervisorDrawerNavigator;
