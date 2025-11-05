import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { LogisticsProvider } from '../logistics/context/LogisticsContext';
import LogisticsDashboardScreen from '../logistics/LogisticsDashboardScreen';
import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import EquipmentManagementScreen from '../logistics/EquipmentManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';
import RoleSwitcher from '../auth/RoleSwitcher';
import { useAuth, UserRole} from '../auth/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

export type LogisticsTabParamList = {
  Dashboard: undefined;
  MaterialTracking: undefined;
  EquipmentManagement: undefined;
  DeliveryScheduling: undefined;
  InventoryManagementScreen: undefined;
};

type LogisticsNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
};

const Tab = createBottomTabNavigator<LogisticsTabParamList>();

const LogisticsNavigator: React.FC<LogisticsNavigatorProps> = ({ navigation: parentNavigation }) => {
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

  const handleRoleChange = (newRole: UserRole) => {
    const roleMap: Record<UserRole, keyof RootStackParamList> = {
      supervisor: 'Supervisor',
      manager: 'Manager',
      planning: 'Planning',
      logistics: 'Logistics',
    };

    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: roleMap[newRole] }],
      })
    );
  };

  return (
    <LogisticsProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconSymbol = '';

            if (route.name === 'Dashboard') {
              iconSymbol = '📊';
            } else if (route.name === 'MaterialTracking') {
              iconSymbol = '🚚';
            } else if (route.name === 'EquipmentManagement') {
              iconSymbol = '🔧';
            } else if (route.name === 'DeliveryScheduling') {
              iconSymbol = '📦';
            } else if (route.name === 'InventoryManagementScreen') {
              iconSymbol = '📦';
            }

            return <Text style={{ fontSize: size, color }}>{iconSymbol}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
              <RoleSwitcher onRoleChange={handleRoleChange} />
              <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 10 }}>
                <Text style={{ color: '#007AFF', fontSize: 16 }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={LogisticsDashboardScreen}
          options={{
            title: 'Dashboard',
            headerShown: true,
            headerTitle: 'Logistics Dashboard',
          }}
        />
        <Tab.Screen
          name="MaterialTracking"
          component={MaterialTrackingScreen}
          options={{
            title: 'Materials',
            headerShown: true,
            headerTitle: 'Material Tracking',
          }}
        />
        <Tab.Screen
          name="EquipmentManagement"
          component={EquipmentManagementScreen}
          options={{
            title: 'Equipment',
            headerShown: true,
            headerTitle: 'Equipment Management',
          }}
        />
        <Tab.Screen
          name="DeliveryScheduling"
          component={DeliverySchedulingScreen}
          options={{
            title: 'Delivery',
            headerShown: true,
            headerTitle: 'Delivery Scheduling',
          }}
        />
        <Tab.Screen
          name="InventoryManagementScreen"
          component={InventoryManagementScreen}
          options={{
            title: 'Inventory',
            headerShown: true,
            headerTitle: 'Inventory Management',
          }}
        />
      </Tab.Navigator>
    </LogisticsProvider>
  );
};

export default LogisticsNavigator;