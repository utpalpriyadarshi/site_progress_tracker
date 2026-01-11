import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import DesignEngineerDashboardScreen from '../design_engineer/DesignEngineerDashboardScreen';
import DoorsPackageManagementScreen from '../design_engineer/DoorsPackageManagementScreen';
import DesignRfqManagementScreen from '../design_engineer/DesignRfqManagementScreen';
import { useAuth } from '../auth/AuthContext';
import { DesignEngineerProvider } from '../design_engineer/context/DesignEngineerContext';

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
  Dashboard: undefined;
  DoorsPackages: undefined;
  DesignRfqs: undefined;
};

type DesignEngineerNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'DesignEngineer'>;
};

const Tab = createBottomTabNavigator<DesignEngineerTabParamList>();

const DesignEngineerNavigator: React.FC<DesignEngineerNavigatorProps> = ({ navigation: parentNavigation }) => {
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
    <DesignEngineerProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconSymbol = '';

            if (route.name === 'Dashboard') {
              iconSymbol = '📊';
            } else if (route.name === 'DoorsPackages') {
              iconSymbol = '📦';
            } else if (route.name === 'DesignRfqs') {
              iconSymbol = '📝';
            }

            return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DesignEngineerDashboardScreen}
          options={{
            title: 'Dashboard',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="DoorsPackages"
          component={DoorsPackageManagementScreen}
          options={{
            title: 'DOORS Packages',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="DesignRfqs"
          component={DesignRfqManagementScreen}
          options={{
            title: 'Design RFQs',
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </DesignEngineerProvider>
  );
};

export default DesignEngineerNavigator;
