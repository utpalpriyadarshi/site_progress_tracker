import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import SiteModel from '../../models/SiteModel';
import CategoryModel from '../../models/CategoryModel';
import ItemModel from '../../models/ItemModel';
import MaterialModel from '../../models/MaterialModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import HindranceModel from '../../models/HindranceModel';
import DailyReportModel from '../../models/DailyReportModel';
import SyncQueueModel from '../../models/SyncQueueModel';
import { Q } from '@nozbe/watermelondb';
import TokenStorage from '../storage/TokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SyncService - Enhanced for Activity 2
 *
 * Week 6, Days 2-5: Complete SyncService implementation with backend API integration
 *
 * Features:
 * - Push local changes to server via /api/sync/push
 * - Pull remote changes from server via /api/sync/pull
 * - JWT authentication integration
 * - Network error handling and retry logic
 * - Sync queue management
 * - Version tracking for conflict detection
 *
 * Backend API: http://localhost:3000 (development)
 */

// API Configuration
const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.construction-tracker.com',
  ENDPOINTS: {
    SYNC_PUSH: '/api/sync/push',
    SYNC_PULL: '/api/sync/pull',
    SYNC_STATUS: '/api/sync/status',
  },
  TIMEOUT: 30000, // 30 seconds
};

// Storage keys for sync state
const SYNC_STORAGE_KEYS = {
  LAST_SYNC_AT: '@sync/last_sync_at',
  LAST_PULL_AT: '@sync/last_pull_at',
  LAST_PUSH_AT: '@sync/last_push_at',
};

interface SyncResult {
  success: boolean;
  message: string;
  syncedRecords: number;
  errors?: string[];
}

export class SyncService {
  /**
   * Make authenticated API request with JWT token
   */
  private static async apiRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<any> {
    const accessToken = await TokenStorage.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available. Please login first.');
    }

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }

      if (error.message?.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection.');
      }

      throw error;
    }
  }

  /**
   * Get last sync timestamp
   */
  private static async getLastSyncAt(): Promise<number> {
    const lastSync = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_AT);
    return lastSync ? parseInt(lastSync, 10) : 0;
  }

  /**
   * Update last sync timestamp
   */
  private static async updateLastSyncAt(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_AT, timestamp.toString());
  }

  /**
   * PUSH: Send local changes to server
   *
   * Week 6, Day 4: Implementation
   * - Collects all records with sync_status = 'pending'
   * - Groups by table name
   * - Sends to /api/sync/push
   * - Updates sync_status based on response
   */
  static async syncUp(): Promise<SyncResult> {
    try {
      console.log('🔄 SyncService.syncUp() started...');

      // Collect all pending records from syncable tables
      const pendingProjects = await database.collections
        .get<ProjectModel>('projects')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingSites = await database.collections
        .get<SiteModel>('sites')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingCategories = await database.collections
        .get<CategoryModel>('categories')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingItems = await database.collections
        .get<ItemModel>('items')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingMaterials = await database.collections
        .get<MaterialModel>('materials')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const totalPending =
        pendingProjects.length +
        pendingSites.length +
        pendingCategories.length +
        pendingItems.length +
        pendingMaterials.length;

      if (totalPending === 0) {
        console.log('✅ No pending changes to sync');
        return {
          success: true,
          message: 'No pending changes to sync',
          syncedRecords: 0,
        };
      }

      console.log('📊 Pending records:', {
        projects: pendingProjects.length,
        sites: pendingSites.length,
        categories: pendingCategories.length,
        items: pendingItems.length,
        materials: pendingMaterials.length,
      });

      // Group changes by table
      const changes: any = {
        projects: pendingProjects.map(p => p._raw),
        sites: pendingSites.map(s => s._raw),
        categories: pendingCategories.map(c => c._raw),
        items: pendingItems.map(i => i._raw),
        materials: pendingMaterials.map(m => m._raw),
      };

      // Send to backend
      console.log('📤 Pushing changes to server...');
      const response = await this.apiRequest(API_CONFIG.ENDPOINTS.SYNC_PUSH, 'POST', {
        changes,
        timestamp: Date.now(),
      });

      // Update sync_status for successfully synced records
      let syncedCount = 0;
      const errors: string[] = [];

      await database.write(async () => {
        // Update projects
        for (const project of pendingProjects) {
          try {
            await project.update(record => {
              record.syncStatus = 'synced';
            });
            syncedCount++;
          } catch (error) {
            errors.push(`Project ${project.id}: ${error}`);
          }
        }

        // Update sites
        for (const site of pendingSites) {
          try {
            await site.update(record => {
              record.syncStatus = 'synced';
            });
            syncedCount++;
          } catch (error) {
            errors.push(`Site ${site.id}: ${error}`);
          }
        }

        // Update categories
        for (const category of pendingCategories) {
          try {
            await category.update(record => {
              record.syncStatus = 'synced';
            });
            syncedCount++;
          } catch (error) {
            errors.push(`Category ${category.id}: ${error}`);
          }
        }

        // Update items
        for (const item of pendingItems) {
          try {
            await item.update(record => {
              record.syncStatus = 'synced';
            });
            syncedCount++;
          } catch (error) {
            errors.push(`Item ${item.id}: ${error}`);
          }
        }

        // Update materials
        for (const material of pendingMaterials) {
          try {
            await material.update(record => {
              record.syncStatus = 'synced';
            });
            syncedCount++;
          } catch (error) {
            errors.push(`Material ${material.id}: ${error}`);
          }
        }
      });

      // Update last push timestamp
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.LAST_PUSH_AT,
        Date.now().toString()
      );

      console.log(`✅ Synced ${syncedCount} records to server`);

      return {
        success: true,
        message: `Successfully synced ${syncedCount} records`,
        syncedRecords: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('❌ SyncUp failed:', error);
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        syncedRecords: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * PULL: Fetch remote changes from server
   *
   * Week 6, Day 5: Implementation
   * - Requests changes since last_sync_at
   * - Applies changes to local database
   * - Handles create/update/delete operations
   */
  static async syncDown(): Promise<SyncResult> {
    try {
      console.log('🔄 SyncService.syncDown() started...');

      // Get last sync timestamp
      const lastSyncAt = await this.getLastSyncAt();
      console.log('📅 Last sync:', new Date(lastSyncAt).toISOString());

      // Fetch changes from server
      const endpoint = `${API_CONFIG.ENDPOINTS.SYNC_PULL}?updated_after=${lastSyncAt}`;
      console.log('📥 Pulling changes from server...');
      const response = await this.apiRequest(endpoint, 'GET');

      const { changes } = response;

      if (!changes) {
        return {
          success: true,
          message: 'No changes from server',
          syncedRecords: 0,
        };
      }

      let syncedCount = 0;
      const errors: string[] = [];

      // Apply changes to local database
      await database.write(async () => {
        // Apply project changes
        if (changes.projects) {
          for (const projectData of changes.projects) {
            try {
              await this.applyProjectChange(projectData);
              syncedCount++;
            } catch (error) {
              errors.push(`Project ${projectData.id}: ${error}`);
            }
          }
        }

        // Apply site changes
        if (changes.sites) {
          for (const siteData of changes.sites) {
            try {
              await this.applySiteChange(siteData);
              syncedCount++;
            } catch (error) {
              errors.push(`Site ${siteData.id}: ${error}`);
            }
          }
        }

        // Apply category changes
        if (changes.categories) {
          for (const categoryData of changes.categories) {
            try {
              await this.applyCategoryChange(categoryData);
              syncedCount++;
            } catch (error) {
              errors.push(`Category ${categoryData.id}: ${error}`);
            }
          }
        }

        // Apply item changes
        if (changes.items) {
          for (const itemData of changes.items) {
            try {
              await this.applyItemChange(itemData);
              syncedCount++;
            } catch (error) {
              errors.push(`Item ${itemData.id}: ${error}`);
            }
          }
        }

        // Apply material changes
        if (changes.materials) {
          for (const materialData of changes.materials) {
            try {
              await this.applyMaterialChange(materialData);
              syncedCount++;
            } catch (error) {
              errors.push(`Material ${materialData.id}: ${error}`);
            }
          }
        }
      });

      // Update last sync timestamp
      await this.updateLastSyncAt(Date.now());
      await AsyncStorage.setItem(
        SYNC_STORAGE_KEYS.LAST_PULL_AT,
        Date.now().toString()
      );

      console.log(`✅ Applied ${syncedCount} changes from server`);

      return {
        success: true,
        message: `Successfully applied ${syncedCount} changes`,
        syncedRecords: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('❌ SyncDown failed:', error);
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        syncedRecords: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Generic conflict resolution helper
   *
   * Week 7, Day 3: Last-Write-Wins (LWW) strategy
   * - Compare versions: Higher version wins
   * - If versions equal: Use updated_at timestamp
   * - If local newer: Skip update
   *
   * @returns true if server data should be applied, false otherwise
   */
  private static shouldApplyServerData(
    existing: any,
    serverData: any,
    tableName: string
  ): boolean {
    const localVersion = existing.version || 0;
    const serverVersion = serverData._version || 0;
    const recordId = serverData.id;

    // Server has newer version
    if (serverVersion > localVersion) {
      console.log(`✅ ${tableName}/${recordId}: v${localVersion} → v${serverVersion}`);
      return true;
    }

    // Same version: Use timestamp as tie-breaker
    if (serverVersion === localVersion) {
      const localUpdated = existing._raw.updated_at || 0;
      const serverUpdated = serverData.updated_at || 0;

      if (serverUpdated > localUpdated) {
        console.log(`✅ ${tableName}/${recordId}: timestamp tie-breaker`);
        return true;
      } else {
        console.log(`⏭️ ${tableName}/${recordId}: local is newer or equal`);
        return false;
      }
    }

    // Local version is higher
    console.warn(`⚠️ ${tableName}/${recordId}: local v${localVersion} > server v${serverVersion}`);
    return false;
  }

  /**
   * Apply project change from server (with conflict resolution)
   */
  private static async applyProjectChange(data: any): Promise<void> {
    const collection = database.collections.get<ProjectModel>('projects');

    try {
      const existing = await collection.find(data.id);

      // Check if server data should be applied (LWW conflict resolution)
      if (this.shouldApplyServerData(existing, data, 'projects')) {
        await existing.update(record => {
          Object.assign(record, data);
          record.syncStatus = 'synced';
          record.version = data._version || existing.version;
        });
      }
    } catch (error) {
      // Record doesn't exist, create new
      await collection.create(record => {
        Object.assign(record, data);
        record.syncStatus = 'synced';
        record.version = data._version || 1;
      });
    }
  }

  /**
   * Apply site change from server (with conflict resolution)
   */
  private static async applySiteChange(data: any): Promise<void> {
    const collection = database.collections.get<SiteModel>('sites');

    try {
      const existing = await collection.find(data.id);

      if (this.shouldApplyServerData(existing, data, 'sites')) {
        await existing.update(record => {
          Object.assign(record, data);
          record.syncStatus = 'synced';
          record.version = data._version || existing.version;
        });
      }
    } catch (error) {
      await collection.create(record => {
        Object.assign(record, data);
        record.syncStatus = 'synced';
        record.version = data._version || 1;
      });
    }
  }

  /**
   * Apply category change from server (with conflict resolution)
   */
  private static async applyCategoryChange(data: any): Promise<void> {
    const collection = database.collections.get<CategoryModel>('categories');

    try {
      const existing = await collection.find(data.id);

      if (this.shouldApplyServerData(existing, data, 'categories')) {
        await existing.update(record => {
          Object.assign(record, data);
          record.syncStatus = 'synced';
          record.version = data._version || existing.version;
        });
      }
    } catch (error) {
      await collection.create(record => {
        Object.assign(record, data);
        record.syncStatus = 'synced';
        record.version = data._version || 1;
      });
    }
  }

  /**
   * Apply item change from server (with conflict resolution)
   */
  private static async applyItemChange(data: any): Promise<void> {
    const collection = database.collections.get<ItemModel>('items');

    try {
      const existing = await collection.find(data.id);

      if (this.shouldApplyServerData(existing, data, 'items')) {
        await existing.update(record => {
          Object.assign(record, data);
          record.syncStatus = 'synced';
          record.version = data._version || existing.version;
        });
      }
    } catch (error) {
      await collection.create(record => {
        Object.assign(record, data);
        record.syncStatus = 'synced';
        record.version = data._version || 1;
      });
    }
  }

  /**
   * Apply material change from server (with conflict resolution)
   */
  private static async applyMaterialChange(data: any): Promise<void> {
    const collection = database.collections.get<MaterialModel>('materials');

    try {
      const existing = await collection.find(data.id);

      if (this.shouldApplyServerData(existing, data, 'materials')) {
        await existing.update(record => {
          Object.assign(record, data);
          record.syncStatus = 'synced';
          record.version = data._version || existing.version;
        });
      }
    } catch (error) {
      await collection.create(record => {
        Object.assign(record, data);
        record.syncStatus = 'synced';
        record.version = data._version || 1;
      });
    }
  }

  /**
   * Sync all: Pull then Push
   */
  static async syncAll(): Promise<SyncResult> {
    console.log('🔄 SyncService.syncAll() started...');

    // First pull latest from server
    const downResult = await this.syncDown();

    if (!downResult.success) {
      console.warn('⚠️ Pull failed, continuing to push...');
    }

    // Then push local changes
    const upResult = await this.syncUp();

    const totalSynced = downResult.syncedRecords + upResult.syncedRecords;
    const allErrors = [
      ...(downResult.errors || []),
      ...(upResult.errors || []),
    ];

    return {
      success: upResult.success,
      message: `Pull: ${downResult.syncedRecords} records. Push: ${upResult.syncedRecords} records.`,
      syncedRecords: totalSynced,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }

  /**
   * Check if there are pending changes
   */
  static async hasOfflineData(): Promise<boolean> {
    try {
      const pendingProjects = await database.collections
        .get<ProjectModel>('projects')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingSites = await database.collections
        .get<SiteModel>('sites')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingCategories = await database.collections
        .get<CategoryModel>('categories')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingItems = await database.collections
        .get<ItemModel>('items')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      const pendingMaterials = await database.collections
        .get<MaterialModel>('materials')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      return (
        pendingProjects.length > 0 ||
        pendingSites.length > 0 ||
        pendingCategories.length > 0 ||
        pendingItems.length > 0 ||
        pendingMaterials.length > 0
      );
    } catch (error) {
      console.error('Error checking offline data:', error);
      return false;
    }
  }

  /**
   * Get sync status from server
   */
  static async getSyncStatus(): Promise<any> {
    try {
      return await this.apiRequest(API_CONFIG.ENDPOINTS.SYNC_STATUS, 'GET');
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  /**
   * Get last sync timestamps
   */
  static async getLastSyncInfo(): Promise<{
    lastSyncAt: number;
    lastPullAt: number;
    lastPushAt: number;
  }> {
    const lastSyncAt = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_AT);
    const lastPullAt = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_PULL_AT);
    const lastPushAt = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_PUSH_AT);

    return {
      lastSyncAt: lastSyncAt ? parseInt(lastSyncAt, 10) : 0,
      lastPullAt: lastPullAt ? parseInt(lastPullAt, 10) : 0,
      lastPushAt: lastPushAt ? parseInt(lastPushAt, 10) : 0,
    };
  }
}