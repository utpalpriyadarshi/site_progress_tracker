import { useMemo } from 'react';
import { InventoryItem } from '../../../services/InventoryOptimizationService';

/**
 * Inventory Statistics Interface
 */
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  overstocked: number;
  obsolete: number;
  categoryA: number;
  categoryB: number;
  categoryC: number;
}

/**
 * useInventoryStats Hook
 *
 * Calculates statistics for inventory items.
 *
 * @param items - Array of inventory items
 * @returns {InventoryStats} Calculated statistics
 *
 * Extracted from InventoryManagementScreen.tsx Phase 2.
 */
export const useInventoryStats = (items: InventoryItem[]): InventoryStats => {
  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStock = items.filter(item => item.status === 'low_stock').length;
    const outOfStock = items.filter(item => item.status === 'out_of_stock').length;
    const overstocked = items.filter(item => item.status === 'overstocked').length;
    const obsolete = items.filter(item => item.status === 'obsolete').length;
    const categoryA = items.filter(item => item.abcCategory === 'A').length;
    const categoryB = items.filter(item => item.abcCategory === 'B').length;
    const categoryC = items.filter(item => item.abcCategory === 'C').length;

    return {
      totalItems,
      totalValue,
      lowStock,
      outOfStock,
      overstocked,
      obsolete,
      categoryA,
      categoryB,
      categoryC,
    };
  }, [items]);

  return stats;
};
