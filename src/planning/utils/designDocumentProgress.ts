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
 * Returns only the latest revision of each document number.
 * Revision numbers follow the pattern R0, R1, R2... — higher number wins.
 * Documents without a matching pattern default to revision 0.
 */
export function filterToLatestRevisions(documents: DesignDocumentModel[]): DesignDocumentModel[] {
  const getRevNum = (rev: string) => {
    const m = rev?.match(/^R(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };
  const latestByDocNum = new Map<string, DesignDocumentModel>();
  for (const doc of documents) {
    const existing = latestByDocNum.get(doc.documentNumber);
    if (!existing || getRevNum(doc.revisionNumber) > getRevNum(existing.revisionNumber)) {
      latestByDocNum.set(doc.documentNumber, doc);
    }
  }
  return Array.from(latestByDocNum.values());
}

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

  // Only the latest revision of each document should count toward progress
  const docs = filterToLatestRevisions(documents);

  const totalWeightage = docs.reduce((sum, doc) => sum + (doc.weightage || 0), 0);

  if (totalWeightage === 0) {
    // Fallback: equal weight per document when no weightage is set
    const totalProgress = docs.reduce((sum, doc) => sum + getProgressFromStatus(doc.status), 0);
    return (totalProgress / docs.length) * 100;
  }

  const weightedProgress = docs.reduce((sum, doc) => {
    const statusProgress = getProgressFromStatus(doc.status);
    return sum + (doc.weightage || 0) * statusProgress;
  }, 0);

  return (weightedProgress / totalWeightage) * 100;
}

/**
 * Result of dual-track KD progress calculation
 */
export interface KDProgressResult {
  combined: number;
  effectiveSiteWeight: number;
  effectiveDesignWeight: number;
}

/**
 * Calculate KD progress from separate site and design tracks
 *
 * Rules:
 * - KD has only sites (no docs or designWeightage=0): 100% from site progress
 * - KD has only design docs (no sites): 100% from design progress
 * - KD has both: designWeightage% from design + (100 - designWeightage)% from sites
 *
 * @param siteProgress - 0-100, from supervisor items
 * @param designProgress - 0-100, from design documents
 * @param designWeightage - 0-100, from KeyDateModel.designWeightage
 * @param hasSites - whether the KD has associated sites
 * @param hasDocs - whether the KD has linked design documents
 * @returns Combined progress and effective weights
 */
export function calculateKDProgress(
  siteProgress: number,
  designProgress: number,
  designWeightage: number,
  hasSites: boolean,
  hasDocs: boolean,
): KDProgressResult {
  // Only sites (no docs, or design weightage is 0)
  if (!hasDocs || designWeightage === 0) {
    return { combined: siteProgress, effectiveSiteWeight: 100, effectiveDesignWeight: 0 };
  }

  // Only docs (no sites)
  if (!hasSites) {
    return { combined: designProgress, effectiveSiteWeight: 0, effectiveDesignWeight: 100 };
  }

  // Both tracks — use designWeightage
  const dw = Math.min(100, Math.max(0, designWeightage));
  const combined = siteProgress * (100 - dw) / 100 + designProgress * dw / 100;
  return {
    combined,
    effectiveSiteWeight: 100 - dw,
    effectiveDesignWeight: dw,
  };
}
