/**
 * useDebounceSearch - Optimized search hook with debouncing and caching
 *
 * Provides:
 * - 300ms debounce delay (configurable)
 * - Search result caching
 * - Loading state management
 * - Cancel pending searches
 * - Multi-field search support
 *
 * Usage:
 * ```ts
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   filteredItems,
 *   isSearching,
 *   clearSearch,
 * } = useDebounceSearch({
 *   items: invoices,
 *   searchFields: ['invoiceNumber', 'vendorName', 'poId'],
 *   debounceMs: 300,
 * });
 * ```
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

export interface UseDebounceSearchOptions<T> {
  /** Array of items to search through */
  items: T[];
  /** Fields to search in (supports nested paths like 'vendor.name') */
  searchFields: (keyof T | string)[];
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Enable result caching (default: true) */
  cacheResults?: boolean;
  /** Maximum cache size (default: 50) */
  maxCacheSize?: number;
  /** Case sensitive search (default: false) */
  caseSensitive?: boolean;
  /** Minimum query length to trigger search (default: 1) */
  minQueryLength?: number;
}

export interface UseDebounceSearchResult<T> {
  /** Current search query */
  searchQuery: string;
  /** Set search query (debounced) */
  setSearchQuery: (query: string) => void;
  /** Filtered items based on search */
  filteredItems: T[];
  /** True while debounce is pending */
  isSearching: boolean;
  /** Clear search query */
  clearSearch: () => void;
  /** Number of results */
  resultCount: number;
  /** True if search is active (query length >= minQueryLength) */
  isSearchActive: boolean;
}

// Simple LRU cache implementation
class SearchCache<T> {
  private cache = new Map<string, T[]>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T[] | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T[]): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Get nested property value from object
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Check if a value matches the search query
 */
const matchesQuery = (
  value: any,
  query: string,
  caseSensitive: boolean
): boolean => {
  if (value == null) return false;

  const stringValue = String(value);
  const normalizedValue = caseSensitive ? stringValue : stringValue.toLowerCase();
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  return normalizedValue.includes(normalizedQuery);
};

export function useDebounceSearch<T extends Record<string, any>>({
  items,
  searchFields,
  debounceMs = 300,
  cacheResults = true,
  maxCacheSize = 50,
  caseSensitive = false,
  minQueryLength = 1,
}: UseDebounceSearchOptions<T>): UseDebounceSearchResult<T> {
  const [searchQuery, setSearchQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Cache ref to persist across renders
  const cacheRef = useRef<SearchCache<T>>(new SearchCache<T>(maxCacheSize));

  // Debounce timeout ref
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear cache when items change significantly
  const itemsLengthRef = useRef(items.length);
  useEffect(() => {
    if (Math.abs(items.length - itemsLengthRef.current) > 5) {
      cacheRef.current.clear();
      itemsLengthRef.current = items.length;
    }
  }, [items.length]);

  // Handle search query change with debouncing
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      setIsSearching(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setDebouncedQuery(query);
        setIsSearching(false);
      }, debounceMs);
    },
    [debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setDebouncedQuery('');
    setIsSearching(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Determine if search is active
  const isSearchActive = debouncedQuery.trim().length >= minQueryLength;

  // Perform search with caching
  const filteredItems = useMemo(() => {
    const trimmedQuery = debouncedQuery.trim();

    // Return all items if query is too short
    if (trimmedQuery.length < minQueryLength) {
      return items;
    }

    // Check cache first
    if (cacheResults) {
      const cacheKey = `${trimmedQuery}-${caseSensitive}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Perform search
    const results = items.filter((item) => {
      return searchFields.some((field) => {
        const value = typeof field === 'string' && field.includes('.')
          ? getNestedValue(item, field)
          : item[field as keyof T];
        return matchesQuery(value, trimmedQuery, caseSensitive);
      });
    });

    // Cache results
    if (cacheResults) {
      const cacheKey = `${trimmedQuery}-${caseSensitive}`;
      cacheRef.current.set(cacheKey, results);
    }

    return results;
  }, [items, debouncedQuery, searchFields, caseSensitive, minQueryLength, cacheResults]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    isSearching,
    clearSearch,
    resultCount: filteredItems.length,
    isSearchActive,
  };
}

export default useDebounceSearch;
