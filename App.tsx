/**
 * Construction Site Progress Tracker App
 * React Native application for construction industry
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { appTheme } from './src/theme/paperTheme';

// Import navigation
import MainNavigator from './src/nav/MainNavigator';

// Import database service
import { SimpleDatabaseService } from './services/db/SimpleDatabaseService';
import { database } from './models/database';

// Import Snackbar provider
import { SnackbarProvider } from './src/components/Snackbar';

// Import offline banner
import { OfflineBanner } from './src/components/common';

// Import test script for session checking (Week 3 Testing)
import { checkLatestSession } from './scripts/testCheckSessions';

// Week 8, Day 3-4: Import network and sync managers
import NetworkMonitor from './services/network/NetworkMonitor';
import AutoSyncManager from './services/sync/AutoSyncManager';

// Phase B: Background PDF Queue for async PDF generation
import { backgroundPdfQueue } from './services/BackgroundPdfQueue';
import { logger } from './src/services/LoggingService';

// Supabase Connection Test (VERIFIED WORKING - Disabled for production)
// import { testSupabaseConnection } from './src/services/supabase/testConnection';

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

    // Phase B: Initialize background PDF queue
    backgroundPdfQueue.initialize(database);
    backgroundPdfQueue.startProcessing(10000); // Process every 10 seconds

    logger.info('BackgroundPdfQueue started', {
      component: 'App',
      action: 'useEffect',
    });

    // Test Supabase connection (VERIFIED WORKING - Disabled for production)
    // testSupabaseConnection();

    // Cleanup on unmount
    return () => {
      NetworkMonitor.cleanup();
      AutoSyncManager.stop();

      // Phase B: Stop PDF queue processing
      backgroundPdfQueue.stopProcessing();
      logger.info('BackgroundPdfQueue stopped', {
        component: 'App',
        action: 'useEffect:cleanup',
      });
    };
  }, []);

  if (!isReady) {
    return null; // Or show a loading screen
  }

  return (
    <PaperProvider theme={appTheme}>
      <SafeAreaProvider>
        <SnackbarProvider>
          <StatusBar barStyle="dark-content" />
          <OfflineBanner />
          <MainNavigator />
        </SnackbarProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default App;
