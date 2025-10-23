/**
 * Construction Site Progress Tracker App
 * React Native application for construction industry
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

// Import navigation
import MainNavigator from './src/nav/MainNavigator';

// Import database service
import { SimpleDatabaseService } from './services/db/SimpleDatabaseService';

// Import Snackbar provider
import { SnackbarProvider } from './src/components/Snackbar';

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
    <PaperProvider>
      <SafeAreaProvider>
        <SnackbarProvider>
          <StatusBar barStyle="dark-content" />
          <MainNavigator />
        </SnackbarProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
