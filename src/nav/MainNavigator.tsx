import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider } from '../auth/AuthContext';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import SupervisorDrawerNavigator from './SupervisorDrawerNavigator';
import ManagerNavigator from './ManagerNavigator';
import PlanningNavigator from './PlanningNavigator';
import LogisticsNavigator from './LogisticsNavigator';
import DesignEngineerNavigator from './DesignEngineerNavigator';
import CommercialNavigator from './CommercialNavigator';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Auth"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen
            name="Admin"
            component={AdminNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Supervisor"
            component={SupervisorDrawerNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Manager"
            component={ManagerNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Planning"
            component={PlanningNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Logistics"
            component={LogisticsNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DesignEngineer"
            component={DesignEngineerNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CommercialManager"
            component={CommercialNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

export default MainNavigator;