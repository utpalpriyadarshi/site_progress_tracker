import { Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../../models/database';
import { SimpleDatabaseService } from '../../../../services/db/SimpleDatabaseService';
import { logger } from '../../../services/LoggingService';
import { DATABASE_COLLECTIONS } from '../utils';

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

              // Clear database FIRST (most important)
              let totalDeleted = 0;
              for (const collectionName of DATABASE_COLLECTIONS) {
                try {
                  const collection = database.collections.get(collectionName);
                  const records = await collection.query().fetch();
                  if (records.length > 0) {
                    await database.write(async () => {
                      await database.batch(
                        ...records.map((record: any) => record.prepareDestroyPermanently())
                      );
                    });
                    totalDeleted += records.length;
                    logger.info(`Deleted ${records.length} records from ${collectionName}`);
                  }
                } catch (error) {
                  logger.warn(`Collection ${collectionName} error:`, { error });
                }
              }

              logger.info(`Total records deleted: ${totalDeleted}`);

              // Clear AsyncStorage (this will force re-login)
              await AsyncStorage.clear();
              logger.info('AsyncStorage cleared');

              // IMPORTANT: Re-initialize default data after reset
              logger.info('Re-initializing database with default data...');
              await SimpleDatabaseService.initializeDefaultData();
              logger.info('Database re-initialization complete!');

              Alert.alert(
                'Success',
                `Database reset complete!\n\nDeleted ${totalDeleted} records and re-initialized with default users.\n\nYou can now login with:\n• designer / Designer@2025\n• admin / Admin@2025\n• supervisor / Supervisor@2025\n• manager / Manager@2025\n• planner / Planner@2025\n• logistics / Logistics@2025`,
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
