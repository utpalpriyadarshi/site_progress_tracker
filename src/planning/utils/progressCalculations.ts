/**
 * Progress Calculations Utilities
 *
 * Shared utility functions for calculating progress metrics
 * across items, sites, and key dates.
 *
 * @version 1.0.0
 */

import type ItemModel from '../../../models/ItemModel';

/**
 * Calculate weighted progress from a collection of items
 *
 * Formula: Σ(item.weightage × item.progress) / Σ(item.weightage)
 *
 * @param items - Array of ItemModel instances
 * @returns Progress percentage (0-100), or 0 if no items/weightage
 *
 * @example
 * ```typescript
 * const items = await itemsCollection.query(...).fetch();
 * const progress = calculateSiteProgressFromItems(items);
 * console.log(`Site progress: ${progress}%`);
 * ```
 */
export function calculateSiteProgressFromItems(items: ItemModel[]): number {
  if (!items || items.length === 0) return 0;

  const totalWeightage = items.reduce((sum, item) => sum + (item.weightage || 0), 0);
  if (totalWeightage === 0) return 0;

  return (
    items.reduce(
      (sum, item) => sum + (item.weightage || 0) * item.getProgressPercentage(),
      0
    ) / totalWeightage
  );
}

/**
 * Calculate overall progress across multiple sites with contribution percentages
 *
 * @param siteProgressData - Array of {progress: number, contribution: number} objects
 * @returns Weighted progress percentage (0-100)
 *
 * @example
 * ```typescript
 * const siteData = [
 *   { progress: 50, contribution: 60 }, // Site 1: 50% progress, 60% contribution
 *   { progress: 30, contribution: 40 }, // Site 2: 30% progress, 40% contribution
 * ];
 * const overallProgress = calculateWeightedSiteProgress(siteData);
 * // Result: (50 * 0.6) + (30 * 0.4) = 30 + 12 = 42%
 * ```
 */
export function calculateWeightedSiteProgress(
  siteProgressData: Array<{ progress: number; contribution: number }>
): number {
  if (!siteProgressData || siteProgressData.length === 0) return 0;

  const totalContribution = siteProgressData.reduce((sum, site) => sum + site.contribution, 0);
  if (totalContribution === 0) return 0;

  return siteProgressData.reduce(
    (sum, site) => sum + (site.contribution / 100) * site.progress,
    0
  );
}
