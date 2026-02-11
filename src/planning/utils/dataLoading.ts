/**
 * Data Loading Utilities
 *
 * Efficient batch loading utilities for Planning Dashboard.
 * Reduces database queries by loading data in batches and grouping in-memory.
 *
 * @version 1.0.0
 * @since Planning Phase 2, Improvement #2
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../../../models/database';
import ItemModel from '../../../models/ItemModel';
import DesignDocumentModel from '../../../models/DesignDocumentModel';

// ==================== Types ====================

/**
 * Generic grouping result - maps a key to an array of items
 */
export type GroupedData<T> = Record<string, T[]>;

// ==================== Helper Functions ====================

/**
 * Groups an array of objects by a specified key
 *
 * @param items - Array of items to group
 * @param key - Property name to group by
 * @returns Object with keys mapping to arrays of items
 *
 * @example
 * const items = [
 *   { siteId: 'site1', name: 'Item 1' },
 *   { siteId: 'site2', name: 'Item 2' },
 *   { siteId: 'site1', name: 'Item 3' },
 * ];
 * const grouped = groupBy(items, 'siteId');
 * // Result: { site1: [Item1, Item3], site2: [Item2] }
 */
export function groupBy<T extends Record<string, any>>(
  items: T[],
  key: keyof T
): GroupedData<T> {
  const grouped: GroupedData<T> = {};

  for (const item of items) {
    const groupKey = String(item[key]);
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
  }

  return grouped;
}

// ==================== Batch Loading Functions ====================

/**
 * Batch loads all items for multiple sites in a single query
 *
 * Instead of querying items for each site individually (N queries),
 * this function loads all items for all sites at once (1 query),
 * then groups them by site ID in-memory.
 *
 * **Performance Impact:**
 * - Before: N site queries (e.g., 10 sites × 50 items = 500 queries)
 * - After: 1 batch query + in-memory grouping
 * - Improvement: 99%+ query reduction
 *
 * @param siteIds - Array of site IDs to load items for
 * @returns Object mapping site IDs to their items
 *
 * @example
 * // Before (inefficient):
 * for (const siteId of siteIds) {
 *   const items = await itemsCollection.query(Q.where('site_id', siteId)).fetch();
 *   // ... process items
 * }
 *
 * // After (efficient):
 * const itemsBySite = await batchLoadItemsBySites(siteIds);
 * for (const siteId of siteIds) {
 *   const items = itemsBySite[siteId] || [];
 *   // ... process items
 * }
 */
export async function batchLoadItemsBySites(
  siteIds: string[]
): Promise<GroupedData<ItemModel>> {
  // Handle edge case: empty site list
  if (siteIds.length === 0) {
    return {};
  }

  // Remove duplicates for efficiency
  const uniqueSiteIds = [...new Set(siteIds)];

  // Batch load all items for all sites in one query
  const itemsCollection = database.collections.get<ItemModel>('items');
  const allItems = await itemsCollection
    .query(Q.where('site_id', Q.oneOf(uniqueSiteIds)))
    .fetch();

  // Group items by site ID in-memory
  return groupBy(allItems, 'siteId');
}

/**
 * Batch loads items for sites associated with multiple Key Dates
 *
 * This is a specialized version of batchLoadItemsBySites that:
 * 1. Collects all unique site IDs from multiple KD-site relationships
 * 2. Batch loads items for all those sites
 * 3. Returns grouped items for efficient access
 *
 * **Use Case:**
 * When calculating progress for multiple Key Dates, each KD may have
 * multiple sites. This function ensures we only query items once for
 * all sites across all KDs.
 *
 * **Performance Impact:**
 * - Before: K KDs × N sites × 1 query = K×N queries (e.g., 10×3 = 30)
 * - After: 1 batch query
 * - Improvement: 97%+ query reduction for typical dashboards
 *
 * @param kdSitesArray - Array of arrays, where each inner array contains
 *                       sites for a specific Key Date
 * @returns Object mapping site IDs to their items
 *
 * @example
 * const kd1Sites = [{ siteId: 'site1' }, { siteId: 'site2' }];
 * const kd2Sites = [{ siteId: 'site2' }, { siteId: 'site3' }];
 * const itemsBySite = await batchLoadItemsForKDSites([kd1Sites, kd2Sites]);
 * // Result: { site1: [...], site2: [...], site3: [...] }
 */
export async function batchLoadItemsForKDSites(
  kdSitesArray: Array<Array<{ siteId: string }>>
): Promise<GroupedData<ItemModel>> {
  // Collect all unique site IDs from all KDs
  const allSiteIds = new Set<string>();
  for (const kdSites of kdSitesArray) {
    for (const site of kdSites) {
      allSiteIds.add(site.siteId);
    }
  }

  // Convert Set to Array and batch load
  return batchLoadItemsBySites([...allSiteIds]);
}

/**
 * Batch loads all design documents for multiple sites in a single query
 *
 * @param siteIds - Array of site IDs to load documents for
 * @returns Object mapping site IDs to their design documents
 */
export async function batchLoadDesignDocsBySites(
  siteIds: string[]
): Promise<GroupedData<DesignDocumentModel>> {
  if (siteIds.length === 0) return {};

  const uniqueSiteIds = [...new Set(siteIds)];
  const docsCollection = database.collections.get<DesignDocumentModel>('design_documents');
  const allDocs = await docsCollection
    .query(Q.where('site_id', Q.oneOf(uniqueSiteIds)))
    .fetch();

  return groupBy(allDocs, 'siteId');
}

/**
 * Batch loads design documents that have a keyDateId but no site_id.
 * These are project-wide documents that should still contribute to KD progress.
 *
 * @param keyDateIds - Array of key date IDs
 * @returns Object mapping key date IDs to their design documents (without site_id)
 */
export async function batchLoadUnsitedDocsByKeyDate(
  keyDateIds: string[]
): Promise<GroupedData<DesignDocumentModel>> {
  if (keyDateIds.length === 0) return {};

  const uniqueKdIds = [...new Set(keyDateIds)];
  const docsCollection = database.collections.get<DesignDocumentModel>('design_documents');
  const docs = await docsCollection
    .query(
      Q.where('key_date_id', Q.oneOf(uniqueKdIds)),
      Q.where('site_id', Q.eq(null))
    )
    .fetch();

  return groupBy(docs, 'keyDateId');
}

/**
 * Batch loads ALL design documents linked to given key date IDs (regardless of site_id).
 * This is the primary way to get design docs for KD progress in the dual-track system.
 *
 * @param keyDateIds - Array of key date IDs
 * @returns Object mapping key date IDs to their design documents
 */
export async function batchLoadDocsByKeyDate(
  keyDateIds: string[]
): Promise<GroupedData<DesignDocumentModel>> {
  if (keyDateIds.length === 0) return {};

  const uniqueKdIds = [...new Set(keyDateIds)];
  const docsCollection = database.collections.get<DesignDocumentModel>('design_documents');
  const docs = await docsCollection
    .query(Q.where('key_date_id', Q.oneOf(uniqueKdIds)))
    .fetch();

  return groupBy(docs, 'keyDateId');
}

// ==================== Performance Monitoring (Optional) ====================

/**
 * Performance metrics for batch loading operations
 * Useful for measuring the impact of batch loading optimizations
 */
export interface BatchLoadMetrics {
  /** Number of sites loaded */
  siteCount: number;
  /** Total items loaded */
  itemCount: number;
  /** Time taken in milliseconds */
  loadTimeMs: number;
  /** Estimated queries saved (vs individual site queries) */
  queriesSaved: number;
}

/**
 * Wrapper around batchLoadItemsBySites that tracks performance metrics
 *
 * Use this during development/testing to measure performance improvements.
 *
 * @param siteIds - Array of site IDs to load items for
 * @returns Tuple of [grouped items, performance metrics]
 */
export async function batchLoadItemsBySitesWithMetrics(
  siteIds: string[]
): Promise<[GroupedData<ItemModel>, BatchLoadMetrics]> {
  const startTime = Date.now();

  const itemsBySite = await batchLoadItemsBySites(siteIds);

  const endTime = Date.now();
  const itemCount = Object.values(itemsBySite).reduce(
    (sum, items) => sum + items.length,
    0
  );

  const metrics: BatchLoadMetrics = {
    siteCount: siteIds.length,
    itemCount,
    loadTimeMs: endTime - startTime,
    queriesSaved: Math.max(0, siteIds.length - 1), // N sites = N queries saved (minus the 1 batch query)
  };

  return [itemsBySite, metrics];
}
