import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Placeholder screens - will be created in subsequent sprints
import CommercialDashboardScreen from '../commercial/CommercialDashboardScreen';
import BudgetManagementScreen from '../commercial/BudgetManagementScreen';
import CostTrackingScreen from '../commercial/CostTrackingScreen';
import InvoiceManagementScreen from '../commercial/InvoiceManagementScreen';
import FinancialReportsScreen from '../commercial/FinancialReportsScreen';
import { useAuth } from '../auth/AuthContext';
import { CommercialProvider } from '../commercial/context/CommercialContext';

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

export type CommercialTabParamList = {
  Dashboard: undefined;
  BudgetManagement: undefined;
  CostTracking: undefined;
  InvoiceManagement: undefined;
  FinancialReports: undefined;
};

type CommercialNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'CommercialManager'>;
};

const Tab = createBottomTabNavigator<CommercialTabParamList>();

const CommercialNavigator: React.FC<CommercialNavigatorProps> = ({ navigation: parentNavigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <CommercialProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconSymbol = '';

            if (route.name === 'Dashboard') {
              iconSymbol = '📊';
            } else if (route.name === 'BudgetManagement') {
              iconSymbol = '💰';
            } else if (route.name === 'CostTracking') {
              iconSymbol = '📈';
            } else if (route.name === 'InvoiceManagement') {
              iconSymbol = '🧾';
            } else if (route.name === 'FinancialReports') {
              iconSymbol = '📑';
            }

            return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
              <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={CommercialDashboardScreen}
          options={{
            title: 'Dashboard',
            headerShown: true,
            headerTitle: 'Commercial Dashboard',
          }}
        />
        <Tab.Screen
          name="BudgetManagement"
          component={BudgetManagementScreen}
          options={{
            title: 'Budgets',
            headerShown: true,
            headerTitle: 'Budget Management',
          }}
        />
        <Tab.Screen
          name="CostTracking"
          component={CostTrackingScreen}
          options={{
            title: 'Costs',
            headerShown: true,
            headerTitle: 'Cost Tracking',
          }}
        />
        <Tab.Screen
          name="InvoiceManagement"
          component={InvoiceManagementScreen}
          options={{
            title: 'Invoices',
            headerShown: true,
            headerTitle: 'Invoice Management',
          }}
        />
        <Tab.Screen
          name="FinancialReports"
          component={FinancialReportsScreen}
          options={{
            title: 'Reports',
            headerShown: true,
            headerTitle: 'Financial Reports',
          }}
        />
      </Tab.Navigator>
    </CommercialProvider>
  );
};

export default CommercialNavigator;
