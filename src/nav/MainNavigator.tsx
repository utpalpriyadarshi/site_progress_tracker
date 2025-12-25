import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Linking } from 'react-native';
import { getStateFromPath } from '@react-navigation/native';

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

// Custom function to parse query parameters from URL
const parseQueryParams = (url: string) => {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};

  const queryString = url.substring(queryIndex + 1);
  const params: any = {};

  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      params[key] = decodeURIComponent(value);
    }
  });

  return params;
};

// Deep linking configuration
const linking: any = {
  prefixes: ['myapp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password',
          RoleSelection: 'role-selection',
        },
      },
      Admin: 'admin',
      Supervisor: 'supervisor',
      Manager: 'manager',
      Planning: 'planning',
      Logistics: 'logistics',
      DesignEngineer: 'design-engineer',
      CommercialManager: 'commercial-manager',
    },
  },
  // Custom state parser to handle query parameters
  getStateFromPath: (path: string, options: any) => {
    console.log('🔍 getStateFromPath called with:', path);

    // Extract query parameters
    const queryParams = parseQueryParams(path);
    console.log('🔍 Parsed query params:', JSON.stringify(queryParams));

    // Remove query string from path for default parsing
    const pathWithoutQuery = path.split('?')[0];

    // Get default state from path
    const state = getStateFromPath(pathWithoutQuery, options);
    console.log('🔍 State from path:', JSON.stringify(state));

    // If this is the reset-password route, inject query params
    if (path.includes('reset-password') && state) {
      const routes = state.routes || [];
      routes.forEach((route: any) => {
        if (route.state && route.state.routes) {
          route.state.routes.forEach((nestedRoute: any) => {
            if (nestedRoute.name === 'ResetPassword') {
              nestedRoute.params = {
                ...nestedRoute.params,
                ...queryParams,
              };
              console.log('🔍 Injected params into ResetPassword:', nestedRoute.params);
            }
          });
        }
      });
    }

    return state;
  },
};

const MainNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer
        linking={linking}
        onStateChange={(state) => {
          console.log('🔍 Navigation state changed:', JSON.stringify(state, null, 2));
        }}
        onReady={() => {
          console.log('🔍 Navigation is ready');
        }}
      >
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