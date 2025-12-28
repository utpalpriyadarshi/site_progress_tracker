import { useState, useEffect, useCallback } from 'react';
import { Cost } from './useCostData';

export const useCostFilters = (
  costs: Cost[],
  selectedCostCategory: string | null
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCosts, setFilteredCosts] = useState<Cost[]>([]);

  const applyFilters = useCallback(() => {
    let filtered = [...costs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cost) =>
          cost.category.toLowerCase().includes(query) ||
          cost.description.toLowerCase().includes(query) ||
          (cost.poId && cost.poId.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCostCategory) {
      filtered = filtered.filter((cost) => cost.category === selectedCostCategory);
    }

    setFilteredCosts(filtered);
  }, [costs, searchQuery, selectedCostCategory]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    searchQuery,
    setSearchQuery,
    filteredCosts,
  };
};
