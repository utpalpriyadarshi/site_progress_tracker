import { useReducer, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../../models/database';
import { SimpleDatabaseService } from '../../../../services/db/SimpleDatabaseService';
import PasswordMigrationService from '../../../../services/auth/PasswordMigrationService';
import { migrateCategoryNames, verifyCategoryMigration } from '../../../../scripts/migrateCategoryNames';
import { logger } from '../../../services/LoggingService';
import { AdminRole } from '../../context/AdminContext';
import { ROLE_NAVIGATION_MAP, DATABASE_COLLECTIONS } from '../utils';
import {
  adminDashboardReducer,
  createInitialState,
} from '../../state/dashboard';

/**
 * Consolidated Admin Dashboard Hook
 *
 * Replaces all individual dashboard hooks with a single unified hook
 * using the adminDashboardReducer for state management
 */
export const useAdminDashboard = (
  selectedRole: AdminRole | null,
  setSelectedRole: (role: AdminRole | null) => void
) => {
  const [state, dispatch] = useReducer(adminDashboardReducer, undefined, createInitialState);
  const navigation = useNavigation();

  // ==================== Stats Management ====================

  const loadStats = useCallback(async () => {
    try {
      const [projects, sites, users, items] = await Promise.all([
        database.collections.get('projects').query().fetch(),
        database.collections.get('sites').query().fetch(),
        database.collections.get('users').query().fetch(),
        database.collections.get('items').query().fetch(),
      ]);

      dispatch({
        type: 'SET_STATS',
        payload: {
          totalProjects: projects.length,
          totalSites: sites.length,
          totalUsers: users.length,
          totalItems: items.length,
        },
      });
    } catch (error) {
      logger.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ==================== Role Switcher ====================

  const handleRoleSwitch = useCallback((role: AdminRole) => {
    dispatch({ type: 'CLOSE_ROLE_SWITCHER_MENU' });
    if (role) {
      setSelectedRole(role);

      // Navigate to the selected role's navigator
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: ROLE_NAVIGATION_MAP[role] }],
        })
      );
    }
  }, [setSelectedRole, navigation]);

  const setMenuVisible = useCallback((visible: boolean) => {
    if (visible) {
      dispatch({ type: 'TOGGLE_ROLE_SWITCHER_MENU' });
    } else {
      dispatch({ type: 'CLOSE_ROLE_SWITCHER_MENU' });
    }
  }, []);

  // ==================== Password Migration ====================

  const loadPasswordMigrationStatus = useCallback(async () => {
    try {
      const status = await PasswordMigrationService.getMigrationStatus();
      dispatch({ type: 'SET_PASSWORD_MIGRATION_STATUS', payload: status });
    } catch (error) {
      logger.error('Error loading migration status:', error);
    }
  }, []);

  useEffect(() => {
    loadPasswordMigrationStatus();
  }, [loadPasswordMigrationStatus]);

  const handleRunMigration = useCallback(async () => {
    Alert.alert(
      'Migrate Passwords',
      'This will hash all plaintext passwords with bcrypt. This operation cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'destructive',
          onPress: async () => {
            dispatch({ type: 'START_PASSWORD_MIGRATION' });
            try {
              const result = await PasswordMigrationService.hashAllPasswords();
              if (result.success) {
                const verification = await PasswordMigrationService.verifyMigration();
                if (verification.success) {
                  Alert.alert(
                    'Migration Successful',
                    `Migrated ${result.migratedCount} users in ${result.duration}ms. All passwords verified.`
                  );
                } else {
                  Alert.alert(
                    'Migration Warning',
                    `Migration completed but verification failed for ${verification.failedCount} users.`
                  );
                }
              } else {
                Alert.alert(
                  'Migration Failed',
                  `Failed to migrate ${result.failedCount} users. Errors: ${result.errors.join(', ')}`
                );
              }
              await loadPasswordMigrationStatus();
            } catch (error) {
              Alert.alert('Migration Error', `Failed: ${error}`);
            } finally {
              dispatch({ type: 'COMPLETE_PASSWORD_MIGRATION' });
            }
          },
        },
      ]
    );
  }, [loadPasswordMigrationStatus]);

  // ==================== Category Migration ====================

  const handleCategoryMigration = useCallback(async () => {
    Alert.alert(
      'Migrate Category Names',
      'This will rename:\n• "Finishing" → "Handing Over"\n• "Framing" → "Punch List"\n\nExisting items will remain linked to their categories. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'default',
          onPress: async () => {
            dispatch({ type: 'START_CATEGORY_MIGRATION' });
            try {
              logger.info('Starting category migration...');

              // Run migration
              await migrateCategoryNames();

              // Verify migration
              await verifyCategoryMigration();

              // Reload stats to reflect changes
              await loadStats();

              Alert.alert(
                'Migration Successful',
                'Category names have been updated successfully!\n\nNew names:\n• "Handing Over" (was "Finishing")\n• "Punch List" (was "Framing")\n\nAll items remain linked correctly.'
              );
            } catch (error) {
              logger.error('Category migration failed:', error);
              Alert.alert(
                'Migration Error',
                `Failed to migrate categories: ${error}\n\nCheck console for details.`
              );
            } finally {
              dispatch({ type: 'COMPLETE_CATEGORY_MIGRATION' });
            }
          },
        },
      ]
    );
  }, [loadStats]);

  // ==================== Database Reset ====================

  const handleDatabaseReset = useCallback(async () => {
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
                  logger.warn(`Collection ${collectionName} error:`, error);
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
              logger.error('Reset failed:', error);
              Alert.alert('Error', 'Failed to reset database: ' + error);
            }
          },
        },
      ]
    );
  }, [navigation]);

  // ==================== Return API ====================

  return {
    // Stats
    stats: state.stats,
    reloadStats: loadStats,

    // Role Switcher
    menuVisible: state.ui.roleSwitcherMenuVisible,
    setMenuVisible,
    handleRoleSwitch,

    // Password Migration
    migrationStatus: state.migrations.password.status,
    isMigrating: state.migrations.password.inProgress,
    handleRunMigration,

    // Category Migration
    isMigratingCategories: state.migrations.category.inProgress,
    handleCategoryMigration,

    // Database Reset
    handleDatabaseReset,
  };
};
