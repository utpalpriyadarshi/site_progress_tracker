import { useState } from 'react';
import { Alert } from 'react-native';
import { migrateCategoryNames, verifyCategoryMigration } from '../../../../scripts/migrateCategoryNames';
import { logger } from '../../../services/LoggingService';

export const useCategoryMigration = (reloadStats: () => void) => {
  const [isMigratingCategories, setIsMigratingCategories] = useState(false);

  const handleCategoryMigration = async () => {
    Alert.alert(
      'Migrate Category Names',
      'This will rename:\n• "Finishing" → "Handing Over"\n• "Framing" → "Punch List"\n\nExisting items will remain linked to their categories. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'default',
          onPress: async () => {
            setIsMigratingCategories(true);
            try {
              logger.info('Starting category migration...');

              // Run migration
              await migrateCategoryNames();

              // Verify migration
              await verifyCategoryMigration();

              // Reload stats to reflect changes
              await reloadStats();

              Alert.alert(
                'Migration Successful',
                'Category names have been updated successfully!\n\nNew names:\n• "Handing Over" (was "Finishing")\n• "Punch List" (was "Framing")\n\nAll items remain linked correctly.'
              );
            } catch (error) {
              logger.error('Category migration failed:', error as Error);
              Alert.alert(
                'Migration Error',
                `Failed to migrate categories: ${error}\n\nCheck console for details.`
              );
            } finally {
              setIsMigratingCategories(false);
            }
          },
        },
      ]
    );
  };

  return {
    isMigratingCategories,
    handleCategoryMigration,
  };
};
