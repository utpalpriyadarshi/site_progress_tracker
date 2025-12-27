/**
 * BOM Calculations
 * Utility functions for BOM-related calculations
 */

import BomModel from '../../../../models/BomModel';
import BomItemModel from '../../../../models/BomItemModel';

/**
 * Get all items for a specific BOM
 */
export const getBomItems = (
  bomId: string,
  allBomItems: BomItemModel[]
): BomItemModel[] => {
  return allBomItems.filter(item => item.bomId === bomId);
};

/**
 * Calculate total cost for a BOM
 */
export const calculateTotalCost = (
  bomId: string,
  allBomItems: BomItemModel[]
): number => {
  const items = getBomItems(bomId, allBomItems);
  return items.reduce((sum, item) => sum + item.totalCost, 0);
};

/**
 * Calculate variance percentage between baseline and actual
 */
export const calculateVariance = (baseline: number, actual: number): number => {
  if (baseline === 0) return actual > 0 ? 100 : 0;
  return ((actual - baseline) / baseline) * 100;
};

/**
 * Get baseline BOM for execution BOMs
 */
export const getBaselineBom = (
  baselineBomId: string | undefined,
  boms: BomModel[]
): BomModel | undefined => {
  if (!baselineBomId) return undefined;
  return boms.find(b => b.id === baselineBomId);
};
