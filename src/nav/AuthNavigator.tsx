import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../auth/LoginScreen';
import RoleSelectionScreen from './RoleSelectionScreen';

export type AuthStackParamList = {
  Login: undefined;
  RoleSelection: {
    userId: string;
    username: string;
  };
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen 
        name="RoleSelection" 
        component={RoleSelectionScreen} 
        options={{ 
          headerShown: true,
          headerTitle: 'Role Selection',
        }} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;