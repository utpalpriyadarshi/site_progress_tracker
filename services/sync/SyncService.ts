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

        // Apply item changes in dependency order (Week 7, Day 4: Kahn's algorithm)
        if (changes.items) {
          // Sort items using topological sort to respect dependencies
          const sortedItems = this.topologicalSortItems(changes.items);

          for (const itemData of sortedItems) {
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
   * Topological sort using Kahn's algorithm (Week 7, Day 4)
   *
   * Sorts items in dependency order to ensure dependencies are synced before dependents.
   * This prevents orphaned dependencies and maintains referential integrity.
   *
   * Algorithm:
   * 1. Build adjacency list and calculate in-degrees
   * 2. Start with items that have no dependencies (in-degree 0)
   * 3. Process items in order, removing edges as we go
   * 4. Items with circular dependencies are added at the end
   *
   * @param items - Array of item data from server
   * @returns Sorted array where dependencies come before dependents
   */
  private static topologicalSortItems(items: any[]): any[] {
    if (!items || items.length === 0) {
      return [];
    }

    console.log(`📊 Kahn's Algorithm: Sorting ${items.length} items by dependency...`);

    // Build ID to item map for quick lookup
    const itemMap = new Map<string, any>();
    items.forEach(item => itemMap.set(item.id, item));

    // Build adjacency list and in-degree map
    const adjacencyList = new Map<string, string[]>(); // item_id -> [dependent_item_ids]
    const inDegree = new Map<string, number>(); // item_id -> count of dependencies

    // Initialize all items
    items.forEach(item => {
      adjacencyList.set(item.id, []);
      inDegree.set(item.id, 0);
    });

    // Build graph
    items.forEach(item => {
      const dependencies = this.parseDependencies(item.dependencies);

      dependencies.forEach(depId => {
        // Only consider dependencies that are in the current sync batch
        if (itemMap.has(depId)) {
          // depId -> item.id (dependency points to dependent)
          adjacencyList.get(depId)!.push(item.id);
          inDegree.set(item.id, (inDegree.get(item.id) || 0) + 1);
        }
      });
    });

    // Kahn's algorithm: Start with items that have no dependencies
    const queue: string[] = [];
    const sorted: any[] = [];

    inDegree.forEach((degree, itemId) => {
      if (degree === 0) {
        queue.push(itemId);
      }
    });

    console.log(`📝 Found ${queue.length} items with no dependencies (starting points)`);

    // Process queue
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentItem = itemMap.get(currentId)!;
      sorted.push(currentItem);

      // Process all dependents of current item
      const dependents = adjacencyList.get(currentId) || [];
      dependents.forEach(dependentId => {
        const newDegree = (inDegree.get(dependentId) || 0) - 1;
        inDegree.set(dependentId, newDegree);

        // If all dependencies are satisfied, add to queue
        if (newDegree === 0) {
          queue.push(dependentId);
        }
      });
    }

    // Check for circular dependencies
    if (sorted.length < items.length) {
      const remaining = items.filter(item => !sorted.find(s => s.id === item.id));
      console.warn(
        `⚠️ Circular dependencies detected! ${remaining.length} items have cycles.`
      );
      console.warn(`Items with cycles:`, remaining.map(r => r.id).join(', '));

      // Add remaining items at the end (they have circular dependencies)
      sorted.push(...remaining);
    }

    console.log(`✅ Kahn's Algorithm complete: ${sorted.length} items sorted`);
    return sorted;
  }

  /**
   * Parse dependencies from JSON string
   * Helper for Kahn's algorithm
   */
  private static parseDependencies(dependencies: string | null | undefined): string[] {
    if (!dependencies) return [];
    try {
      const parsed = JSON.parse(dependencies);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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

  // ============================================================================
  // Week 8, Days 1-2: Exponential Backoff Retry Logic
  // ============================================================================

  /**
   * Retry configuration for exponential backoff
   */
  private static readonly RETRY_CONFIG = {
    MAX_RETRIES: 5,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 60000, // 60 seconds (1 minute)
    BACKOFF_FACTOR: 2, // Double the delay each time
    DEAD_LETTER_THRESHOLD: 10, // Move to dead letter queue after 10 failures
  };

  /**
   * Calculate exponential backoff delay
   * Formula: min(initial_delay * (backoff_factor ^ retry_count), max_delay)
   */
  private static calculateBackoffDelay(retryCount: number): number {
    const delay = Math.min(
      this.RETRY_CONFIG.INITIAL_DELAY * Math.pow(this.RETRY_CONFIG.BACKOFF_FACTOR, retryCount),
      this.RETRY_CONFIG.MAX_DELAY
    );
    // Add jitter to prevent thundering herd (randomize ±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  /**
   * Retry a sync operation with exponential backoff
   * Week 8, Day 1: Exponential backoff implementation
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryCount: number = 0
  ): Promise<T> {
    try {
      console.log(`🔄 Attempting ${operationName} (attempt ${retryCount + 1}/${this.RETRY_CONFIG.MAX_RETRIES + 1})`);
      return await operation();
    } catch (error) {
      const isLastAttempt = retryCount >= this.RETRY_CONFIG.MAX_RETRIES;

      if (isLastAttempt) {
        console.error(`❌ ${operationName} failed after ${retryCount + 1} attempts:`, error);
        throw new Error(`Max retries (${this.RETRY_CONFIG.MAX_RETRIES}) exceeded for ${operationName}`);
      }

      const delay = this.calculateBackoffDelay(retryCount);
      console.warn(`⚠️  ${operationName} failed (attempt ${retryCount + 1}). Retrying in ${delay}ms...`);

      // Wait for exponential backoff delay
      await new Promise(resolve => setTimeout(resolve, delay));

      // Recursive retry with incremented count
      return this.retryWithBackoff(operation, operationName, retryCount + 1);
    }
  }

  /**
   * Process sync queue with retry logic
   * Week 8, Day 1-2: Enhanced queue processing with exponential backoff
   */
  static async processSyncQueue(): Promise<SyncResult> {
    console.log('📦 Processing sync queue with retry logic...');

    const syncedCount = {
      success: 0,
      failed: 0,
      deadLetter: 0,
    };

    const errors: string[] = [];

    try {
      // Get all pending sync queue items
      const queueItems = await database.collections
        .get<SyncQueueModel>('sync_queue')
        .query(Q.where('synced_at', null))
        .fetch();

      if (queueItems.length === 0) {
        console.log('✅ Sync queue is empty');
        return {
          success: true,
          message: 'Sync queue is empty',
          syncedRecords: 0,
        };
      }

      console.log(`📊 Found ${queueItems.length} items in sync queue`);

      for (const item of queueItems) {
        try {
          // Check if item should be moved to dead letter queue
          if (item.retryCount >= this.RETRY_CONFIG.DEAD_LETTER_THRESHOLD) {
            await this.moveToDeadLetterQueue(item);
            syncedCount.deadLetter++;
            console.log(`☠️  Moved to dead letter queue: ${item.tableName}/${item.recordId} (${item.retryCount} failures)`);
            continue;
          }

          // Retry the sync operation with exponential backoff
          await this.retryWithBackoff(
            async () => await this.syncQueueItem(item),
            `Sync ${item.tableName}/${item.recordId}`,
            item.retryCount
          );

          // Mark as synced
          await database.write(async () => {
            await item.update((record: any) => {
              record.syncedAt = Date.now();
            });
          });

          syncedCount.success++;
          console.log(`✅ Synced: ${item.tableName}/${item.recordId}`);
        } catch (error: any) {
          // Increment retry count and update last error
          await database.write(async () => {
            await item.update((record: any) => {
              record.retryCount = item.retryCount + 1;
              record.lastError = error.message || String(error);
            });
          });

          syncedCount.failed++;
          errors.push(`${item.tableName}/${item.recordId}: ${error.message}`);
          console.error(`❌ Failed to sync: ${item.tableName}/${item.recordId}`, error);
        }
      }

      console.log(`\n📊 Sync Queue Summary:`);
      console.log(`   ✅ Success: ${syncedCount.success}`);
      console.log(`   ❌ Failed: ${syncedCount.failed}`);
      console.log(`   ☠️  Dead Letter: ${syncedCount.deadLetter}`);

      return {
        success: syncedCount.failed === 0,
        message: `Synced ${syncedCount.success} items${syncedCount.failed > 0 ? `, ${syncedCount.failed} failed` : ''}`,
        syncedRecords: syncedCount.success,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('❌ Sync queue processing error:', error);
      return {
        success: false,
        message: `Sync queue error: ${error.message}`,
        syncedRecords: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Sync a single queue item (called by processSyncQueue)
   */
  private static async syncQueueItem(queueItem: SyncQueueModel): Promise<void> {
    const { tableName, recordId, action, data } = queueItem;

    // Parse data JSON
    const recordData = typeof data === 'string' ? JSON.parse(data) : data;

    // Make API request based on action
    const endpoint = `/api/${tableName}`;

    switch (action) {
      case 'create':
        await this.apiRequest(endpoint, 'POST', recordData);
        break;
      case 'update':
        await this.apiRequest(`${endpoint}/${recordId}`, 'PUT', recordData);
        break;
      case 'delete':
        await this.apiRequest(`${endpoint}/${recordId}`, 'DELETE');
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // ============================================================================
  // Week 8, Day 2: Dead Letter Queue
  // ============================================================================

  /**
   * Move failed sync item to dead letter queue
   * Week 8, Day 2: Dead letter queue for items that fail repeatedly
   */
  private static async moveToDeadLetterQueue(queueItem: SyncQueueModel): Promise<void> {
    try {
      // Store in AsyncStorage as dead letter queue (persistent)
      const deadLetterKey = `@sync/dead_letter/${queueItem.tableName}/${queueItem.recordId}`;
      const deadLetterItem = {
        tableName: queueItem.tableName,
        recordId: queueItem.recordId,
        action: queueItem.action,
        data: queueItem.data,
        retryCount: queueItem.retryCount,
        lastError: queueItem.lastError,
        failedAt: Date.now(),
        originalCreatedAt: queueItem.createdAt,
      };

      await AsyncStorage.setItem(deadLetterKey, JSON.stringify(deadLetterItem));

      // Remove from sync queue
      await database.write(async () => {
        await queueItem.destroyPermanently();
      });

      console.log(`☠️  Moved to dead letter queue: ${queueItem.tableName}/${queueItem.recordId}`);
    } catch (error) {
      console.error('Failed to move to dead letter queue:', error);
      throw error;
    }
  }

  /**
   * Get all dead letter queue items
   * Week 8, Day 2: Retrieve dead letter queue for admin monitoring
   */
  static async getDeadLetterQueue(): Promise<any[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const deadLetterKeys = allKeys.filter(key => key.startsWith('@sync/dead_letter/'));

      const deadLetterItems = await Promise.all(
        deadLetterKeys.map(async key => {
          const item = await AsyncStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        })
      );

      return deadLetterItems.filter(item => item !== null);
    } catch (error) {
      console.error('Failed to get dead letter queue:', error);
      return [];
    }
  }

  /**
   * Retry a dead letter queue item manually
   * Week 8, Day 2: Admin can manually retry failed items
   */
  static async retryDeadLetterItem(tableName: string, recordId: string): Promise<boolean> {
    try {
      const deadLetterKey = `@sync/dead_letter/${tableName}/${recordId}`;
      const itemStr = await AsyncStorage.getItem(deadLetterKey);

      if (!itemStr) {
        console.error('Dead letter item not found');
        return false;
      }

      const item = JSON.parse(itemStr);

      // Move back to sync queue with reset retry count
      await database.write(async () => {
        await database.collections.get<SyncQueueModel>('sync_queue').create((record: any) => {
          record.tableName = item.tableName;
          record.recordId = item.recordId;
          record.action = item.action;
          record.data = typeof item.data === 'string' ? item.data : JSON.stringify(item.data);
          record.syncedAt = null;
          record.retryCount = 0; // Reset retry count
          record.lastError = 'Retry from dead letter queue';
        });
      });

      // Remove from dead letter queue
      await AsyncStorage.removeItem(deadLetterKey);

      console.log(`♻️  Moved back to sync queue: ${tableName}/${recordId}`);
      return true;
    } catch (error) {
      console.error('Failed to retry dead letter item:', error);
      return false;
    }
  }

  /**
   * Clear dead letter queue (admin action)
   * Week 8, Day 2: Admin can clear dead letter queue
   */
  static async clearDeadLetterQueue(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const deadLetterKeys = allKeys.filter(key => key.startsWith('@sync/dead_letter/'));

      await AsyncStorage.multiRemove(deadLetterKeys);

      console.log(`🗑️  Cleared ${deadLetterKeys.length} items from dead letter queue`);
      return deadLetterKeys.length;
    } catch (error) {
      console.error('Failed to clear dead letter queue:', error);
      return 0;
    }
  }
}