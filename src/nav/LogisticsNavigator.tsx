import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity, View } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { LogisticsProvider } from '../logistics/context/LogisticsContext';
import LogisticsDashboardScreen from '../logistics/LogisticsDashboardScreen';
import MaterialTrackingScreen from '../logistics/MaterialTrackingScreen';
import EquipmentManagementScreen from '../logistics/EquipmentManagementScreen';
import DeliverySchedulingScreen from '../logistics/DeliverySchedulingScreen';
import InventoryManagementScreen from '../logistics/InventoryManagementScreen';
import DoorsRegisterScreen from '../logistics/DoorsRegisterScreen';
import DoorsDetailScreen from '../logistics/DoorsDetailScreen';
import DoorsPackageEditScreen from '../logistics/DoorsPackageEditScreen';
import DoorsRequirementEditScreen from '../logistics/DoorsRequirementEditScreen';
import RfqListScreen from '../logistics/RfqListScreen';
import RfqCreateScreen from '../logistics/RfqCreateScreen';
import RfqDetailScreen from '../logistics/RfqDetailScreen';
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
  DoorsRegister: undefined;
  RfqList: undefined;
};

export type LogisticsStackParamList = {
  Dashboard: undefined;
  DoorsDetail: { packageId: string };
  DoorsPackageEdit: { packageId: string };
  DoorsRequirementEdit: { requirementId: string };
  RfqCreate: { doorsPackageId?: string };
  RfqDetail: { rfqId: string };
};

type LogisticsNavigatorProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Logistics'>;
};

const Tab = createBottomTabNavigator<LogisticsTabParamList>();
const Stack = createNativeStackNavigator<LogisticsStackParamList>();

// Tab Navigator Component (all the tabs)
const LogisticsTabs: React.FC<LogisticsNavigatorProps> = ({ navigation: parentNavigation }) => {
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
            } else if (route.name === 'DoorsRegister') {
              iconSymbol = '📋';
            } else if (route.name === 'RfqList') {
              iconSymbol = '📄';
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
        <Tab.Screen
          name="DoorsRegister"
          component={DoorsRegisterScreen}
          options={{
            title: 'DOORS',
            headerShown: true,
            headerTitle: 'DOORS Register',
          }}
        />
        <Tab.Screen
          name="RfqList"
          component={RfqListScreen}
          options={{
            title: 'RFQs',
            headerShown: false,
            headerTitle: 'RFQ Management',
          }}
        />
      </Tab.Navigator>
  );
};

// Main Stack Navigator with Tabs + Detail screens
const LogisticsNavigator: React.FC<LogisticsNavigatorProps> = ({ navigation: parentNavigation }) => {
  return (
    <LogisticsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Dashboard">
          {(props) => <LogisticsTabs {...props} navigation={parentNavigation} />}
        </Stack.Screen>
        <Stack.Screen
          name="DoorsDetail"
          component={DoorsDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoorsPackageEdit"
          component={DoorsPackageEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DoorsRequirementEdit"
          component={DoorsRequirementEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RfqCreate"
          component={RfqCreateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RfqDetail"
          component={RfqDetailScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </LogisticsProvider>
  );
};

export default LogisticsNavigator;