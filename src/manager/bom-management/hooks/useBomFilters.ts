/**
 * useBomFilters Hook
 * Manages BOM filtering, tab state, and debounced search
 */

import { useState, useMemo, useCallback } from 'react';
import BomModel from '../../../../models/BomModel';
import { useDebounce } from '../../../utils/performance';

export const useBomFilters = (boms: BomModel[]) => {
  const [activeTab, setActiveTab] = useState<'estimating' | 'execution'>('estimating');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filter function for reusability
  const filterBom = useCallback(
    (bom: BomModel, query: string) => {
      if (!query.trim()) return true;
      const lowerQuery = query.toLowerCase();
      return (
        bom.name?.toLowerCase().includes(lowerQuery) ||
        bom.siteCategory?.toLowerCase().includes(lowerQuery) ||
        bom.description?.toLowerCase().includes(lowerQuery) ||
        bom.status?.toLowerCase().includes(lowerQuery)
      );
    },
    []
  );

  // Memoized filtered BOMs by type and search query
  const filteredBoms = useMemo(() => {
    return boms.filter(bom => {
      // First filter by tab type
      if (bom.type !== activeTab) return false;
      // Then apply search filter
      return filterBom(bom, debouncedSearchQuery);
    });
  }, [boms, activeTab, debouncedSearchQuery, filterBom]);

  // Total count before search (for "X of Y" display)
  const totalForTab = useMemo(() => {
    return boms.filter(bom => bom.type === activeTab).length;
  }, [boms, activeTab]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    filteredBoms,
    totalForTab,
    clearSearch,
    isSearching: searchQuery.trim().length > 0,
  };
};
