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

// Import test script for session checking (Week 3 Testing)
import { checkLatestSession } from './scripts/testCheckSessions';

// Week 8, Day 3-4: Import network and sync managers
import NetworkMonitor from './services/network/NetworkMonitor';
import AutoSyncManager from './services/sync/AutoSyncManager';

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

    // Week 8, Day 3-4: Initialize network monitoring and auto-sync
    NetworkMonitor.initialize();
    AutoSyncManager.initialize();

    // Cleanup on unmount
    return () => {
      NetworkMonitor.cleanup();
      AutoSyncManager.stop();
    };
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
