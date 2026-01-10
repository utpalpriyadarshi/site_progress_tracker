import { useState, useEffect } from 'react';

/**
 * useDebounce - Debounces a value by delaying updates
 *
 * This hook delays the update of a value until after a specified delay
 * has elapsed since the last change. Useful for search inputs, API calls,
 * and other scenarios where you want to limit the frequency of updates.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```ts
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 *
 * useEffect(() => {
 *   // API call with debounced query
 *   fetchResults(debouncedQuery);
 * }, [debouncedQuery]);
 * ```
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay elapsed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
