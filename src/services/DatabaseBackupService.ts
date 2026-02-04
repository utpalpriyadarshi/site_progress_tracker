/**
 * DatabaseBackupService
 *
 * Export all WatermelonDB collections to a JSON file on device storage
 * and restore from a previously exported JSON backup.
 *
 * Uses react-native-fs for file I/O and react-native-share for sharing.
 *
 * @version 1.0.0
 * @since v2.12 - Database Backup/Restore
 */

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { database } from '../../models/database';
import { DATABASE_COLLECTIONS } from '../admin/dashboard/utils/roleConstants';

export interface BackupResult {
  success: boolean;
  filePath?: string;
  recordCount?: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  recordCount?: number;
  error?: string;
}

interface BackupData {
  version: number;
  createdAt: string;
  appVersion: string;
  collections: Record<string, any[]>;
}

const BACKUP_VERSION = 1;
const APP_VERSION = '2.12';

class DatabaseBackupService {
  /**
   * Export all database collections to a JSON file in Downloads folder.
   * Returns the file path on success.
   */
  async exportBackup(): Promise<BackupResult> {
    try {
      console.log('DatabaseBackupService: Starting backup...');

      const backupData: BackupData = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        appVersion: APP_VERSION,
        collections: {},
      };

      let totalRecords = 0;

      for (const collectionName of DATABASE_COLLECTIONS) {
        try {
          const collection = database.collections.get(collectionName);
          const records = await collection.query().fetch();

          if (records.length > 0) {
            // Serialize each record's raw data
            backupData.collections[collectionName] = records.map((record: any) => ({
              id: record.id,
              ...record._raw,
            }));
            totalRecords += records.length;
            console.log(`  Backed up ${records.length} records from ${collectionName}`);
          }
        } catch (err) {
          console.warn(`  Skipping collection ${collectionName}:`, err);
        }
      }

      // Write to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `construction_tracker_backup_${timestamp}.json`;
      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      const jsonString = JSON.stringify(backupData, null, 2);
      await RNFS.writeFile(filePath, jsonString, 'utf8');

      console.log(`DatabaseBackupService: Backup complete - ${totalRecords} records saved to ${filePath}`);

      return {
        success: true,
        filePath,
        recordCount: totalRecords,
      };
    } catch (error) {
      console.error('DatabaseBackupService: Backup failed:', error);
      return {
        success: false,
        error: `Backup failed: ${error}`,
      };
    }
  }

  /**
   * Share the backup file via the system share sheet.
   */
  async shareBackup(filePath: string): Promise<void> {
    try {
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Construction Tracker Backup',
      });
    } catch (error: any) {
      // User cancelled share - not an error
      if (error?.message !== 'User did not share') {
        throw error;
      }
    }
  }

  /**
   * Restore database from a JSON backup file.
   * Clears existing data before restoring.
   */
  async restoreFromFile(filePath: string): Promise<RestoreResult> {
    try {
      console.log('DatabaseBackupService: Starting restore from', filePath);

      // Read and parse the backup file
      const jsonString = await RNFS.readFile(filePath, 'utf8');
      const backupData: BackupData = JSON.parse(jsonString);

      // Validate backup format
      if (!backupData.version || !backupData.collections) {
        return {
          success: false,
          error: 'Invalid backup file format',
        };
      }

      if (backupData.version > BACKUP_VERSION) {
        return {
          success: false,
          error: `Backup version ${backupData.version} is newer than supported version ${BACKUP_VERSION}`,
        };
      }

      // Step 1: Clear existing data
      console.log('DatabaseBackupService: Clearing existing data...');
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
          }
        } catch (err) {
          console.warn(`  Error clearing ${collectionName}:`, err);
        }
      }

      // Step 2: Restore data from backup
      let totalRestored = 0;

      for (const [collectionName, records] of Object.entries(backupData.collections)) {
        if (!records || records.length === 0) continue;

        try {
          const collection = database.collections.get(collectionName);

          await database.write(async () => {
            const batch = records.map((rawRecord: any) => {
              return collection.prepareCreateFromDirtyRaw(rawRecord);
            });
            await database.batch(...batch);
          });

          totalRestored += records.length;
          console.log(`  Restored ${records.length} records to ${collectionName}`);
        } catch (err) {
          console.warn(`  Error restoring ${collectionName}:`, err);
        }
      }

      console.log(`DatabaseBackupService: Restore complete - ${totalRestored} records restored`);

      return {
        success: true,
        recordCount: totalRestored,
      };
    } catch (error) {
      console.error('DatabaseBackupService: Restore failed:', error);
      return {
        success: false,
        error: `Restore failed: ${error}`,
      };
    }
  }

  /**
   * List available backup files in the Downloads folder.
   */
  async listBackups(): Promise<string[]> {
    try {
      const files = await RNFS.readDir(RNFS.DownloadDirectoryPath);
      return files
        .filter((f) => f.name.startsWith('construction_tracker_backup_') && f.name.endsWith('.json'))
        .sort((a, b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0))
        .map((f) => f.path);
    } catch {
      return [];
    }
  }
}

export default new DatabaseBackupService();
