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
import { COLORS } from '../theme/colors';
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
import KDBillingScreen from '../commercial/kd-billing/KDBillingScreen';
import LDRiskScreen from '../commercial/ld-risk/LDRiskScreen';
import AdvanceRecoveryScreen from '../commercial/advance-recovery/AdvanceRecoveryScreen';
import RetentionMonitorScreen from '../commercial/retention/RetentionMonitorScreen';
import VariationOrderScreen from '../commercial/variation-orders/VariationOrderScreen';
import VendorPaymentScreen from '../commercial/vendor-payment/VendorPaymentScreen';
import CashFlowForecastScreen from '../commercial/cash-flow/CashFlowForecastScreen';
import MilestoneReadinessScreen from '../commercial/ipc-readiness/MilestoneReadinessScreen';
import FinalBillScreen from '../commercial/final-bill/FinalBillScreen';
import TutorialService from '../services/TutorialService';

export type CommercialDrawerParamList = {
  CommercialTabs: { screen?: string; params?: { showTutorial?: boolean } } | undefined;
  FinancialReports: undefined;
  KDBilling: undefined;
  LDRisk: undefined;
  AdvanceRecovery: undefined;
  RetentionMonitor: undefined;
  VariationOrders: undefined;
  VendorPayments: undefined;
  CashFlowForecast: undefined;
  IPCReadiness: undefined;
  FinalBill: undefined;
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
    const icons: Record<string, [string, string]> = {
      FinancialReports: ['file-document', 'file-document-outline'],
      KDBilling: ['calendar-check', 'calendar-check-outline'],
      LDRisk: ['alert-octagon', 'alert-octagon-outline'],
      AdvanceRecovery: ['bank-transfer', 'bank-transfer'],
      RetentionMonitor: ['shield-lock', 'shield-lock-outline'],
      VariationOrders: ['file-edit', 'file-edit-outline'],
      VendorPayments: ['account-cash', 'account-cash-outline'],
      CashFlowForecast: ['chart-waterfall', 'chart-waterfall'],
      IPCReadiness: ['clipboard-check', 'clipboard-check-outline'],
      FinalBill: ['flag-checkered', 'flag-outline'],
    };
    const [activeIcon, inactiveIcon] = icons[routeName] ?? ['file-document', 'file-document-outline'];
    return <Icon name={focused ? activeIcon : inactiveIcon} size={size} color={color} />;
  }, []);

  const screenOptions = useCallback(({ route }: { route: { name: string } }) => ({
    drawerIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
      getDrawerIcon(route.name, focused, color, size),
    drawerActiveTintColor: COLORS.PRIMARY,
    drawerInactiveTintColor: COLORS.TEXT_SECONDARY,
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

        {/* KD Billing in Drawer */}
        <Drawer.Screen
          name="KDBilling"
          component={KDBillingScreen}
          options={{
            title: 'KD Billing',
            drawerLabel: 'KD Billing',
            headerShown: true,
            headerTitle: 'Key Date Billing',
          }}
        />

        {/* LD Risk Calculator in Drawer */}
        <Drawer.Screen
          name="LDRisk"
          component={LDRiskScreen}
          options={{
            title: 'LD Risk',
            drawerLabel: 'LD Risk Calculator',
            headerShown: true,
            headerTitle: 'LD Risk Calculator',
          }}
        />

        {/* Advance Recovery in Drawer */}
        <Drawer.Screen
          name="AdvanceRecovery"
          component={AdvanceRecoveryScreen}
          options={{
            title: 'Advance Recovery',
            drawerLabel: 'Advance Recovery',
            headerShown: true,
            headerTitle: 'Advance Recovery',
          }}
        />

        {/* Retention Monitor in Drawer */}
        <Drawer.Screen
          name="RetentionMonitor"
          component={RetentionMonitorScreen}
          options={{
            title: 'Retention Monitor',
            drawerLabel: 'Retention Monitor',
            headerShown: true,
            headerTitle: 'Retention Monitor',
          }}
        />

        {/* Variation Orders in Drawer */}
        <Drawer.Screen
          name="VariationOrders"
          component={VariationOrderScreen}
          options={{
            title: 'Variation Orders',
            drawerLabel: 'Variation Orders',
            headerShown: true,
            headerTitle: 'Variation Orders',
          }}
        />

        {/* Vendor Payments in Drawer */}
        <Drawer.Screen
          name="VendorPayments"
          component={VendorPaymentScreen}
          options={{
            title: 'Vendor Payments',
            drawerLabel: 'Vendor Payments',
            headerShown: true,
            headerTitle: 'Vendor Payments',
          }}
        />

        {/* Cash Flow Forecast in Drawer */}
        <Drawer.Screen
          name="CashFlowForecast"
          component={CashFlowForecastScreen}
          options={{
            title: 'Cash Flow Forecast',
            drawerLabel: 'Cash Flow Forecast',
            headerShown: true,
            headerTitle: 'Cash Flow Forecast',
          }}
        />

        {/* IPC Readiness in Drawer */}
        <Drawer.Screen
          name="IPCReadiness"
          component={MilestoneReadinessScreen}
          options={{
            title: 'IPC Readiness',
            drawerLabel: 'IPC Readiness',
            headerShown: true,
            headerTitle: 'IPC Pre-Flight Checklist',
          }}
        />

        {/* Final Bill Closure in Drawer */}
        <Drawer.Screen
          name="FinalBill"
          component={FinalBillScreen}
          options={{
            title: 'Final Bill Closure',
            drawerLabel: 'Final Bill & DLP',
            headerShown: true,
            headerTitle: 'DLP & Final Bill Closure',
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
    color: COLORS.TEXT_SECONDARY,
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
