/**
 * Design Document Progress Calculations Utilities
 *
 * Functions for calculating progress from design documents and combining
 * with item progress for unified Key Date tracking.
 *
 * Status Mapping:
 * - draft: 0% (not started)
 * - submitted: 30% (in review)
 * - approved / approved_with_comment: 100% (complete)
 * - rejected: 0% (needs rework)
 *
 * @version 1.0.0
 */

import type DesignDocumentModel from '../../../models/DesignDocumentModel';
import type ItemModel from '../../../models/ItemModel';
import { calculateSiteProgressFromItems } from './progressCalculations';

/**
 * Get progress percentage from design document status
 *
 * @param status - Design document status
 * @returns Progress percentage (0-1 scale for calculation)
 *
 * @example
 * ```typescript
 * getProgressFromStatus('draft'); // 0
 * getProgressFromStatus('submitted'); // 0.3
 * getProgressFromStatus('approved'); // 1.0
 * ```
 */
function getProgressFromStatus(status: string): number {
  const statusMap: Record<string, number> = {
    draft: 0,
    submitted: 0.3,
    approved: 1.0,
    approved_with_comment: 1.0,
    rejected: 0,
  };
  return statusMap[status] || 0;
}

/**
 * Calculate weighted progress from design documents based on status
 *
 * Formula: Σ(doc.weightage × statusProgress) / Σ(doc.weightage) × 100
 *
 * @param documents - Array of DesignDocumentModel instances
 * @returns Progress percentage (0-100), or 0 if no documents/weightage
 *
 * @example
 * ```typescript
 * const docs = await designDocsCollection.query(...).fetch();
 * const progress = calculateSiteProgressFromDesignDocuments(docs);
 * console.log(`Design progress: ${progress}%`);
 * ```
 */
export function calculateSiteProgressFromDesignDocuments(
  documents: DesignDocumentModel[]
): number {
  if (!documents || documents.length === 0) return 0;

  const totalWeightage = documents.reduce((sum, doc) => sum + (doc.weightage || 0), 0);
  if (totalWeightage === 0) return 0;

  const weightedProgress = documents.reduce((sum, doc) => {
    const statusProgress = getProgressFromStatus(doc.status);
    return sum + (doc.weightage || 0) * statusProgress;
  }, 0);

  return (weightedProgress / totalWeightage) * 100;
}

/**
 * Combine progress from both items and design documents with weighted average
 *
 * Allows both Supervisors (updating Items) and Design Engineers (updating Documents)
 * to contribute to the same Key Date progress tracking.
 *
 * Formula: (itemProgress × itemWeightage + docProgress × docWeightage) / totalWeightage
 *
 * @param items - Array of ItemModel instances
 * @param documents - Array of DesignDocumentModel instances
 * @returns Combined progress percentage (0-100)
 *
 * @example
 * ```typescript
 * // Site with 50% weightage in Items (80% complete) and 50% in Documents (100% approved)
 * const items = [...]; // Total weightage: 50, Progress: 80%
 * const docs = [...];  // Total weightage: 50, Progress: 100%
 * const progress = calculateCombinedSiteProgress(items, docs);
 * // Result: (80 * 50 + 100 * 50) / 100 = 90%
 * ```
 */
export function calculateCombinedSiteProgress(
  items: ItemModel[],
  documents: DesignDocumentModel[]
): number {
  const itemWeightage = items.reduce((sum, item) => sum + (item.weightage || 0), 0);
  const docWeightage = documents.reduce((sum, doc) => sum + (doc.weightage || 0), 0);
  const totalWeightage = itemWeightage + docWeightage;

  // If no weightage at all, return 0
  if (totalWeightage === 0) return 0;

  // Calculate progress for each category
  const itemProgress = calculateSiteProgressFromItems(items);
  const docProgress = calculateSiteProgressFromDesignDocuments(documents);

  // Weighted average
  return (itemProgress * itemWeightage + docProgress * docWeightage) / totalWeightage;
}

/**
 * Calculate progress contribution from design documents for a specific site
 *
 * Used when a site has BOTH items and documents contributing to Key Date progress
 *
 * @param documents - Design documents for the site
 * @param siteTotalWeightage - Total weightage allocated to site (from KeyDateSite)
 * @returns Progress contribution (0-100)
 *
 * @example
 * ```typescript
 * // Site has 30% contribution to Key Date
 * // Documents have 100% approval (all approved)
 * const contribution = calculateDesignDocumentContribution(docs, 30);
 * // Result: 30% (full contribution)
 * ```
 */
export function calculateDesignDocumentContribution(
  documents: DesignDocumentModel[],
  siteTotalWeightage: number
): number {
  if (siteTotalWeightage === 0) return 0;

  const docProgress = calculateSiteProgressFromDesignDocuments(documents);
  return (docProgress / 100) * siteTotalWeightage;
}
