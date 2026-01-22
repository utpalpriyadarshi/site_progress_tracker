/**
 * useMemoizedFilters - Optimized filter hook with memoization
 *
 * Provides:
 * - Stable filter references
 * - Efficient re-computation with memoization
 * - Filter combination optimization
 * - Type-safe filter definitions
 *
 * Usage:
 * ```ts
 * const {
 *   filteredItems,
 *   activeFilters,
 *   setFilter,
 *   clearFilter,
 *   clearAllFilters,
 *   filterCount,
 * } = useMemoizedFilters({
 *   items: costs,
 *   filters: {
 *     category: (item, value) => item.category === value,
 *     dateRange: (item, { start, end }) =>
 *       item.date >= start && item.date <= end,
 *   },
 * });
 *
 * // Set filter
 * setFilter('category', 'labor');
 * setFilter('dateRange', { start: startDate, end: endDate });
 * ```
 */

import { useState, useMemo, useCallback } from 'react';

export type FilterPredicate<T, V = any> = (item: T, value: V) => boolean;

export interface FilterDefinition<T> {
  [key: string]: FilterPredicate<T>;
}

export interface UseMemoizedFiltersOptions<T> {
  /** Array of items to filter */
  items: T[];
  /** Filter definitions with predicates */
  filters: FilterDefinition<T>;
  /** Initial filter values */
  initialFilters?: Record<string, any>;
}

export interface UseMemoizedFiltersResult<T> {
  /** Filtered items based on active filters */
  filteredItems: T[];
  /** Currently active filter values */
  activeFilters: Record<string, any>;
  /** Set a specific filter value */
  setFilter: (key: string, value: any) => void;
  /** Clear a specific filter */
  clearFilter: (key: string) => void;
  /** Clear all filters */
  clearAllFilters: () => void;
  /** Number of active filters */
  filterCount: number;
  /** Check if a specific filter is active */
  isFilterActive: (key: string) => boolean;
  /** Get current value of a filter */
  getFilterValue: <V = any>(key: string) => V | undefined;
  /** Toggle a boolean filter */
  toggleFilter: (key: string) => void;
  /** Set multiple filters at once */
  setFilters: (filters: Record<string, any>) => void;
}

/**
 * Check if a value is considered "empty" for filter purposes
 */
const isEmptyValue = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
};

export function useMemoizedFilters<T>({
  items,
  filters,
  initialFilters = {},
}: UseMemoizedFiltersOptions<T>): UseMemoizedFiltersResult<T> {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(initialFilters);

  // Set a single filter
  const setFilter = useCallback((key: string, value: any) => {
    setActiveFilters((prev) => {
      // If value is empty, remove the filter
      if (isEmptyValue(value)) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      // Only update if value changed
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  // Clear a single filter
  const clearFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      if (!(key in prev)) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  // Check if a filter is active
  const isFilterActive = useCallback(
    (key: string): boolean => {
      return key in activeFilters && !isEmptyValue(activeFilters[key]);
    },
    [activeFilters]
  );

  // Get filter value
  const getFilterValue = useCallback(
    <V = any>(key: string): V | undefined => {
      return activeFilters[key] as V | undefined;
    },
    [activeFilters]
  );

  // Toggle boolean filter
  const toggleFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const currentValue = prev[key];
      if (currentValue === true) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: true };
    });
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setActiveFilters((prev) => {
      const updated = { ...prev };
      Object.entries(newFilters).forEach(([key, value]) => {
        if (isEmptyValue(value)) {
          delete updated[key];
        } else {
          updated[key] = value;
        }
      });
      return updated;
    });
  }, []);

  // Count active filters
  const filterCount = useMemo(() => {
    return Object.keys(activeFilters).filter(
      (key) => !isEmptyValue(activeFilters[key])
    ).length;
  }, [activeFilters]);

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    // Get active filter entries
    const activeFilterEntries = Object.entries(activeFilters).filter(
      ([key, value]) => !isEmptyValue(value) && key in filters
    );

    // If no active filters, return all items
    if (activeFilterEntries.length === 0) {
      return items;
    }

    // Apply all active filters
    return items.filter((item) => {
      return activeFilterEntries.every(([key, value]) => {
        const predicate = filters[key];
        if (!predicate) return true;
        try {
          return predicate(item, value);
        } catch {
          return true;
        }
      });
    });
  }, [items, activeFilters, filters]);

  return {
    filteredItems,
    activeFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
    filterCount,
    isFilterActive,
    getFilterValue,
    toggleFilter,
    setFilters,
  };
}

/**
 * Pre-built filter predicates for common use cases
 */
export const FilterPredicates = {
  /** Exact match filter */
  equals: <T, K extends keyof T>(field: K) => (item: T, value: T[K]) =>
    item[field] === value,

  /** Contains filter (for strings) */
  contains: <T>(field: keyof T) => (item: T, value: string) =>
    String(item[field]).toLowerCase().includes(value.toLowerCase()),

  /** Date range filter */
  dateRange: <T>(field: keyof T) => (item: T, range: { start?: Date; end?: Date }) => {
    const itemDate = item[field];
    if (!(itemDate instanceof Date) && typeof itemDate !== 'number') return true;

    const timestamp = typeof itemDate === 'number' ? itemDate : itemDate.getTime();

    if (range.start && timestamp < range.start.getTime()) return false;
    if (range.end && timestamp > range.end.getTime()) return false;
    return true;
  },

  /** Numeric range filter */
  numberRange: <T>(field: keyof T) => (item: T, range: { min?: number; max?: number }) => {
    const value = item[field];
    if (typeof value !== 'number') return true;

    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;
    return true;
  },

  /** In array filter */
  inArray: <T, K extends keyof T>(field: K) => (item: T, values: T[K][]) =>
    values.includes(item[field]),

  /** Boolean filter */
  isTrue: <T>(field: keyof T) => (item: T) => Boolean(item[field]),

  /** Not null filter */
  notNull: <T>(field: keyof T) => (item: T) => item[field] != null,
};

export default useMemoizedFilters;
