/**
 * Construction Site Progress Tracker App
 * React Native application for construction industry
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './src/auth/LoginScreen';
import DailyReportsScreen from './src/supervisor/DailyReportsScreen';
import MaterialTrackingScreen from './src/supervisor/MaterialTrackingScreen';
import ProjectOverviewScreen from './src/manager/ProjectOverviewScreen';
import GanttChartScreen from './src/planning/GanttChartScreen';

// Import database service
import { SimpleDatabaseService } from './services/db/SimpleDatabaseService';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Supervisor Tab Navigator
function SupervisorTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Daily Reports" component={DailyReportsScreen} />
      <Tab.Screen name="Material Tracking" component={MaterialTrackingScreen} />
    </Tab.Navigator>
  );
}

// Manager Tab Navigator
function ManagerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Project Overview" component={ProjectOverviewScreen} />
      <Tab.Screen name="Reports" component={DailyReportsScreen} />
    </Tab.Navigator>
  );
}

// Planning Tab Navigator
function PlanningTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Gantt Chart" component={GanttChartScreen} />
      <Tab.Screen name="Schedule" component={DailyReportsScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="SupervisorDashboard" component={SupervisorTabs} />
      <Stack.Screen name="ManagerDashboard" component={ManagerTabs} />
      <Stack.Screen name="PlanningDashboard" component={PlanningTabs} />
    </Stack.Navigator>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize database when the app starts
    const initializeDatabase = async () => {
      try {
        await SimpleDatabaseService.initializeDefaultData();
      } catch (error) {
        console.error('Database initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeDatabase();
  }, []);

  if (!isReady) {
    return null; // Or show a loading screen
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
