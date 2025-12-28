import { useMemo } from 'react';
import { InventoryItem } from '../../../services/InventoryOptimizationService';
import { StatusFilter, LocationFilter, ABCFilter } from '../utils';

/**
 * useInventoryFilters Hook
 *
 * Manages filtering and searching of inventory items.
 *
 * @param items - Array of inventory items
 * @param statusFilter - Filter by inventory status
 * @param locationFilter - Filter by location
 * @param abcFilter - Filter by ABC category
 * @param searchQuery - Search query string
 * @returns {InventoryItem[]} Filtered and sorted items
 *
 * Extracted from InventoryManagementScreen.tsx Phase 2.
 */
export const useInventoryFilters = (
  items: InventoryItem[],
  statusFilter: StatusFilter,
  locationFilter: LocationFilter,
  abcFilter: ABCFilter,
  searchQuery: string
) => {
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by location
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.locationId === locationFilter);
    }

    // Filter by ABC category
    if (abcFilter !== 'all') {
      filtered = filtered.filter(item => item.abcCategory === abcFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.materialName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.locationName.toLowerCase().includes(query)
      );
    }

    // Sort by total value (descending)
    return filtered.sort((a, b) => b.totalValue - a.totalValue);
  }, [items, statusFilter, locationFilter, abcFilter, searchQuery]);

  return filteredItems;
};
