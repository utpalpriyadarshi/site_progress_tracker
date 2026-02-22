import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import PasswordMigrationService from '../../../../services/auth/PasswordMigrationService';
import { logger } from '../../../services/LoggingService';

interface MigrationStatus {
  totalUsers: number;
  migratedUsers: number;
  pendingUsers: number;
  percentComplete: number;
}

export const usePasswordMigration = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    totalUsers: 0,
    migratedUsers: 0,
    pendingUsers: 0,
    percentComplete: 0,
  });
  const [isMigrating, setIsMigrating] = useState(false);

  const loadMigrationStatus = async () => {
    try {
      const status = await PasswordMigrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      logger.error('Error loading migration status:', error as Error);
    }
  };

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const handleRunMigration = async () => {
    Alert.alert(
      'Migrate Passwords',
      'This will hash all plaintext passwords with bcrypt. This operation cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'destructive',
          onPress: async () => {
            setIsMigrating(true);
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
              await loadMigrationStatus();
            } catch (error) {
              Alert.alert('Migration Error', `Failed: ${error}`);
            } finally {
              setIsMigrating(false);
            }
          },
        },
      ]
    );
  };

  return {
    migrationStatus,
    isMigrating,
    handleRunMigration,
  };
};
