import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../auth/LoginScreen';
import RoleSelectionScreen from './RoleSelectionScreen';
import { ForgotPasswordScreen } from '../auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../auth/ResetPasswordScreen';

import { AuthStackParamList } from './types';

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
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Forgot Password',
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Reset Password',
        }}
      />
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