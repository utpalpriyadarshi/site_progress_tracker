import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthNavigator from './AuthNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import ManagerNavigator from './ManagerNavigator';
import PlanningNavigator from './PlanningNavigator';
import LogisticsNavigator from './LogisticsNavigator';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen 
          name="Supervisor" 
          component={SupervisorNavigator} 
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;