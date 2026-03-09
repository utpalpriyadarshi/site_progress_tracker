import { Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../../models/database';
import { SimpleDatabaseService } from '../../../../services/db/SimpleDatabaseService';
import { logger } from '../../../services/LoggingService';

export const useDatabaseReset = () => {
  const navigation = useNavigation();

  const handleDatabaseReset = async () => {
    Alert.alert(
      'Reset Database',
      'This will delete ALL local data and re-initialize with default users. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              logger.info('Starting database reset...');

              // Use unsafeResetDatabase to wipe both SQLite store AND
              // WatermelonDB's in-memory cache in one atomic operation.
              // Manual batch-delete leaves the cache stale, causing
              // initializeDefaultData to reuse deleted role IDs → login error.
              await database.write(async () => {
                await database.unsafeResetDatabase();
              });
              logger.info('WatermelonDB reset complete');

              // Clear AsyncStorage so no stale session/role IDs remain
              await AsyncStorage.clear();
              logger.info('AsyncStorage cleared');

              // Re-seed default roles, users and project config
              logger.info('Re-initializing database with default data...');
              await SimpleDatabaseService.initializeDefaultData();
              logger.info('Database re-initialization complete!');

              Alert.alert(
                'Success',
                `Database reset complete!\n\nRe-initialized with 7 default users.\n\nLogin credentials:\n• admin / Admin@2025\n• planner / Planner@2025\n• designer / Designer@2025\n• supervisor / Supervisor@2025\n• manager / Manager@2025\n• logistics / Logistics@2025\n• commercial / Commercial@2025`,
                [
                  {
                    text: 'Go to Login',
                    onPress: () => {
                      // Navigate to Auth screen
                      navigation.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: 'Auth' }],
                        })
                      );
                    },
                  },
                ]
              );
            } catch (error) {
              logger.error('Reset failed:', error as Error);
              Alert.alert('Error', 'Failed to reset database: ' + error);
            }
          },
        },
      ]
    );
  };

  return {
    handleDatabaseReset,
  };
};
