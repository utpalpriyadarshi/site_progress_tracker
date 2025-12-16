/**
 * ItemCopyService.ts
 *
 * Service for copying work items between sites using WatermelonDB
 * Part of Phase 4: Copy Items Between Sites Feature
 *
 * Features:
 * - Bulk copy items from source site to destination site
 * - Duplicate detection (matching item names)
 * - Reset progress fields (completedQuantity=0, status='not_started')
 * - Offline support (appSyncStatus='pending')
 * - Batch operations for performance
 *
 * IMPORTANT: Uses WatermelonDB (local-first), NOT Firestore
 *
 * @version 1.0 - Phase 4
 */

import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../models/ItemModel';
import { logger } from './LoggingService';

// ==================== Types ====================

/**
 * Parameters for copyItems operation
 */
export interface CopyItemsParams {
  /** Source site ID to copy from */
  sourceSiteId: string;

  /** Destination site ID to copy to */
  destinationSiteId: string;

  /** Whether to skip items with duplicate names */
  skipDuplicates: boolean;

  /** Array of item names to skip (if skipDuplicates=true) */
  duplicateNames?: string[];
}

/**
 * Result of copy operation
 */
export interface CopyResult {
  /** Whether operation succeeded (may have partial success) */
  success: boolean;

  /** Number of items successfully copied */
  itemsCopied: number;

  /** Number of items skipped (duplicates) */
  itemsSkipped: number;

  /** Array of error messages (if any failures) */
  errors?: string[];
}

// ==================== Core Functions ====================

/**
 * Copy all work items from source site to destination site
 *
 * This function:
 * 1. Fetches all items from source site
 * 2. Filters out duplicates if requested
 * 3. Creates new items at destination site using WatermelonDB batch operation
 * 4. Resets progress fields (completedQuantity=0, status='not_started')
 * 5. Sets appSyncStatus='pending' for offline sync
 *
 * @param params - Copy operation parameters
 * @returns CopyResult with success status, counts, and any errors
 *
 * @example
 * ```typescript
 * const result = await copyItems({
 *   sourceSiteId: 'site-1',
 *   destinationSiteId: 'site-2',
 *   skipDuplicates: true,
 *   duplicateNames: ['Concrete Work', 'Steel Erection'],
 * });
 *
 * if (result.success) {
 *   console.log(`Copied ${result.itemsCopied} items`);
 * }
 * ```
 */
export async function copyItems(params: CopyItemsParams): Promise<CopyResult> {
  const { sourceSiteId, destinationSiteId, skipDuplicates, duplicateNames = [] } = params;

  logger.info('Starting item copy operation', {
    component: 'ItemCopyService',
    action: 'copyItems',
    sourceSiteId,
    destinationSiteId,
    skipDuplicates,
    duplicateCount: duplicateNames.length,
  });

  try {
    // 1. Fetch all items from source site using WatermelonDB query
    const sourceItems = await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', sourceSiteId))
      .fetch();

    if (sourceItems.length === 0) {
      logger.warn('Source site has no items to copy', {
        component: 'ItemCopyService',
        action: 'copyItems',
        sourceSiteId,
      });

      return {
        success: false,
        itemsCopied: 0,
        itemsSkipped: 0,
        errors: ['Source site has no items to copy'],
      };
    }

    logger.debug('Source items fetched', {
      component: 'ItemCopyService',
      action: 'copyItems',
      itemCount: sourceItems.length,
    });

    let copiedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 2. Use WatermelonDB batch operation for performance
    // Single database.write() wraps all creates for atomic transaction
    await database.write(async () => {
      const itemsCollection = database.collections.get<ItemModel>('items');

      for (const sourceItem of sourceItems) {
        // Skip duplicates if requested
        if (skipDuplicates && duplicateNames.includes(sourceItem.name)) {
          skippedCount++;
          logger.debug('Skipping duplicate item', {
            component: 'ItemCopyService',
            itemName: sourceItem.name,
          });
          continue;
        }

        try {
          // 3. Create new item with WatermelonDB create() pattern
          await itemsCollection.create((newItem) => {
            // ========== COPY THESE FIELDS FROM SOURCE ==========

            // Basic fields
            newItem.name = sourceItem.name;
            newItem.categoryId = sourceItem.categoryId;
            newItem.siteId = destinationSiteId; // NEW site ID
            newItem.plannedQuantity = sourceItem.plannedQuantity;
            newItem.unitOfMeasurement = sourceItem.unitOfMeasurement;
            newItem.weightage = sourceItem.weightage;

            // Date fields
            newItem.plannedStartDate = sourceItem.plannedStartDate;
            newItem.plannedEndDate = sourceItem.plannedEndDate;

            // Planning module fields (v11)
            if (sourceItem.baselineStartDate !== undefined) {
              newItem.baselineStartDate = sourceItem.baselineStartDate;
            }
            if (sourceItem.baselineEndDate !== undefined) {
              newItem.baselineEndDate = sourceItem.baselineEndDate;
            }
            if (sourceItem.dependencies !== undefined) {
              newItem.dependencies = sourceItem.dependencies;
            }
            newItem.isBaselineLocked = sourceItem.isBaselineLocked || false;

            // WBS & Phase Management (v12)
            newItem.projectPhase = sourceItem.projectPhase || 'construction';
            newItem.isMilestone = sourceItem.isMilestone || false;
            newItem.createdByRole = sourceItem.createdByRole || 'supervisor';

            // WBS Structure (v12)
            if (sourceItem.wbsCode) {
              newItem.wbsCode = sourceItem.wbsCode;
            }
            if (sourceItem.wbsLevel !== undefined) {
              newItem.wbsLevel = sourceItem.wbsLevel;
            }
            if (sourceItem.parentWbsCode) {
              newItem.parentWbsCode = sourceItem.parentWbsCode;
            }

            // Critical Path & Risk Management (v12)
            newItem.isCriticalPath = sourceItem.isCriticalPath || false;
            if (sourceItem.floatDays !== undefined) {
              newItem.floatDays = sourceItem.floatDays;
            }
            if (sourceItem.dependencyRisk) {
              newItem.dependencyRisk = sourceItem.dependencyRisk;
            }
            if (sourceItem.riskNotes) {
              newItem.riskNotes = sourceItem.riskNotes;
            }

            // Milestone linking (v2.10)
            if (sourceItem.milestoneId) {
              newItem.milestoneId = sourceItem.milestoneId;
            }

            // ========== RESET THESE FIELDS FOR FRESH START ==========

            newItem.completedQuantity = 0;
            newItem.status = 'not_started';

            // Clear actual dates (fresh start)
            newItem.actualStartDate = undefined;
            newItem.actualEndDate = undefined;
            newItem.criticalPathFlag = undefined;

            // ========== SET SYNC FIELDS FOR OFFLINE SUPPORT ==========

            newItem.appSyncStatus = 'pending'; // Queue for sync
            newItem.version = 1; // Initial version for conflict resolution
          });

          copiedCount++;

          logger.debug('Item copied successfully', {
            component: 'ItemCopyService',
            itemName: sourceItem.name,
          });

        } catch (err) {
          const errorMsg = `Failed to copy "${sourceItem.name}": ${(err as Error).message}`;
          errors.push(errorMsg);
          logger.error('Item copy failed', err as Error, {
            component: 'ItemCopyService',
            itemName: sourceItem.name,
          });
        }
      }
    });

    // Build result
    const result: CopyResult = {
      success: errors.length === 0,
      itemsCopied: copiedCount,
      itemsSkipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    logger.info('Item copy operation completed', {
      component: 'ItemCopyService',
      action: 'copyItems',
      ...result,
    });

    return result;

  } catch (error) {
    logger.error('Copy operation failed', error as Error, {
      component: 'ItemCopyService',
      action: 'copyItems',
      sourceSiteId,
      destinationSiteId,
    });

    return {
      success: false,
      itemsCopied: 0,
      itemsSkipped: 0,
      errors: [(error as Error).message],
    };
  }
}

/**
 * Detect duplicate item names between source and destination sites
 *
 * Returns array of item names that exist in both sites.
 * Used to warn user before copy operation.
 *
 * @param sourceSiteId - Source site ID
 * @param destinationSiteId - Destination site ID
 * @returns Array of duplicate item names (empty if no duplicates)
 *
 * @example
 * ```typescript
 * const duplicates = await detectDuplicates('site-1', 'site-2');
 * if (duplicates.length > 0) {
 *   console.log(`Found ${duplicates.length} duplicates:`, duplicates);
 * }
 * ```
 */
export async function detectDuplicates(
  sourceSiteId: string,
  destinationSiteId: string
): Promise<string[]> {
  try {
    logger.debug('Detecting duplicate items', {
      component: 'ItemCopyService',
      action: 'detectDuplicates',
      sourceSiteId,
      destinationSiteId,
    });

    // Fetch items from both sites using WatermelonDB in parallel
    const [sourceItems, destItems] = await Promise.all([
      database.collections
        .get<ItemModel>('items')
        .query(Q.where('site_id', sourceSiteId))
        .fetch(),
      database.collections
        .get<ItemModel>('items')
        .query(Q.where('site_id', destinationSiteId))
        .fetch(),
    ]);

    // Find items with matching names using Set for O(n) performance
    const destNames = new Set(destItems.map(item => item.name));
    const duplicates = sourceItems
      .filter(item => destNames.has(item.name))
      .map(item => item.name);

    logger.debug('Duplicates detected', {
      component: 'ItemCopyService',
      action: 'detectDuplicates',
      duplicateCount: duplicates.length,
      duplicates,
    });

    return duplicates;

  } catch (error) {
    logger.error('Duplicate detection failed', error as Error, {
      component: 'ItemCopyService',
      action: 'detectDuplicates',
    });
    return [];
  }
}

/**
 * Count items in a site
 *
 * Used to show item counts in UI and validate operations.
 *
 * @param siteId - Site ID to count items for
 * @returns Number of items in the site
 *
 * @example
 * ```typescript
 * const count = await countSiteItems('site-1');
 * console.log(`Site has ${count} items`);
 * ```
 */
export async function countSiteItems(siteId: string): Promise<number> {
  try {
    const items = await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', siteId))
      .fetch();

    return items.length;

  } catch (error) {
    logger.error('Failed to count site items', error as Error, {
      component: 'ItemCopyService',
      siteId,
    });
    return 0;
  }
}

/**
 * Fetch all items for a site
 *
 * Helper function for previews and other operations that need full item data.
 *
 * @param siteId - Site ID to fetch items for
 * @returns Array of ItemModel objects (empty if error)
 *
 * @example
 * ```typescript
 * const items = await fetchSiteItems('site-1');
 * items.forEach(item => console.log(item.name));
 * ```
 */
export async function fetchSiteItems(siteId: string): Promise<ItemModel[]> {
  try {
    return await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', siteId))
      .fetch();

  } catch (error) {
    logger.error('Failed to fetch site items', error as Error, {
      component: 'ItemCopyService',
      siteId,
    });
    return [];
  }
}
