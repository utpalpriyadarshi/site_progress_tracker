import { useMemo, useCallback } from 'react';
import { Cost } from './useCostData';
import { useDebounceSearch, useMemoizedFilters, FilterPredicates } from '../../shared/hooks';

/**
 * useCostFilters - Optimized hook for cost filtering
 *
 * Features:
 * - Debounced search (300ms) with caching
 * - Memoized category and date filtering
 * - Combined search + filter results
 * - Performance optimized for large lists
 */
export const useCostFilters = (
  costs: Cost[],
  selectedCostCategory: string | null
) => {
  // Define filter predicates
  const filterDefinitions = useMemo(
    () => ({
      category: (cost: Cost, category: string) => cost.category === category,
      dateRange: (cost: Cost, range: { start?: Date; end?: Date }) => {
        const costDate = cost.costDate;
        if (range.start && costDate < range.start.getTime()) return false;
        if (range.end && costDate > range.end.getTime()) return false;
        return true;
      },
      amountRange: FilterPredicates.numberRange<Cost>('amount'),
      hasPoId: (cost: Cost) => !!cost.poId,
    }),
    []
  );

  // Use debounced search for text queries
  const {
    searchQuery,
    setSearchQuery,
    filteredItems: searchResults,
    isSearching,
    clearSearch,
    isSearchActive,
  } = useDebounceSearch({
    items: costs,
    searchFields: ['category', 'description', 'poId'],
    debounceMs: 300,
    cacheResults: true,
    minQueryLength: 1,
  });

  // Use memoized filters for category/date filtering
  const {
    filteredItems: categoryFilteredItems,
    setFilter,
    clearFilter,
    clearAllFilters: clearAllMemoizedFilters,
    filterCount,
    isFilterActive,
    getFilterValue,
  } = useMemoizedFilters({
    items: searchResults, // Apply filters on search results
    filters: filterDefinitions,
    initialFilters: selectedCostCategory ? { category: selectedCostCategory } : {},
  });

  // Update category filter when selectedCostCategory prop changes
  useMemo(() => {
    if (selectedCostCategory) {
      setFilter('category', selectedCostCategory);
    } else {
      clearFilter('category');
    }
  }, [selectedCostCategory, setFilter, clearFilter]);

  // Final filtered costs
  const filteredCosts = categoryFilteredItems;

  // Summary calculations (memoized)
  const summary = useMemo(() => {
    const totalCosts = costs.length;
    const totalAmount = costs.reduce((sum, cost) => sum + cost.amount, 0);

    // Category breakdown
    const categoryTotals = costs.reduce(
      (acc, cost) => {
        acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalCosts,
      totalAmount,
      categoryTotals,
    };
  }, [costs]);

  // Filtered summary (for current view)
  const filteredSummary = useMemo(() => {
    const filteredTotal = filteredCosts.length;
    const filteredAmount = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);

    return {
      resultCount: filteredTotal,
      resultAmount: filteredAmount,
      isFiltered: isSearchActive || !!selectedCostCategory,
    };
  }, [filteredCosts, isSearchActive, selectedCostCategory]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearSearch();
    clearAllMemoizedFilters();
  }, [clearSearch, clearAllMemoizedFilters]);

  // Set date range filter
  const setDateRangeFilter = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      if (startDate || endDate) {
        setFilter('dateRange', {
          start: startDate || undefined,
          end: endDate || undefined,
        });
      } else {
        clearFilter('dateRange');
      }
    },
    [setFilter, clearFilter]
  );

  return {
    // Search
    searchQuery,
    setSearchQuery,
    isSearching,
    clearSearch,
    isSearchActive,

    // Results
    filteredCosts,
    resultCount: filteredCosts.length,

    // Summaries
    summary,
    filteredSummary,

    // Filter management
    filterCount: filterCount + (isSearchActive ? 1 : 0),
    clearAllFilters,
    setFilter,
    clearFilter,
    setDateRangeFilter,
    isFilterActive,
    getFilterValue,
  };
};
