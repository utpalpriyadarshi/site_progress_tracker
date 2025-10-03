import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, TouchableOpacity } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import EquipmentManagementScreen from '../logistics/EquipmentManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';

export type RootStackParamList = {
  Auth: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
};

export type LogisticsTabParamList = {
  MaterialTracking: undefined;
  EquipmentManagement: undefined;
  DeliveryScheduling: undefined;
  InventoryManagement: undefined;
};

type LogisticsNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
};

const Tab = createBottomTabNavigator<LogisticsTabParamList>();

const LogisticsNavigator: React.FC<LogisticsNavigatorProps> = ({ navigation: parentNavigation }) => {
  const handleLogout = () => {
    parentNavigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      })
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconSymbol = '';

          if (route.name === 'MaterialTracking') {
            iconSymbol = '🚚';
          } else if (route.name === 'EquipmentManagement') {
            iconSymbol = '🔧';
          } else if (route.name === 'DeliveryScheduling') {
            iconSymbol = '📦';
          } else if (route.name === 'InventoryManagement') {
            iconSymbol = '📦';
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
        name="InventoryManagement" 
        component={InventoryManagementScreen} 
        options={{ 
          title: 'Inventory',
          headerShown: true,
          headerTitle: 'Inventory Management',
        }} 
      />
    </Tab.Navigator>
  );
};

export default LogisticsNavigator;