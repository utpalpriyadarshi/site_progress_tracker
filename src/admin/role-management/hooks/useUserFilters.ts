import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import UserModel from '../../../../models/UserModel';

/**
 * useUserFilters Hook
 *
 * Optimized user filtering with:
 * - Debounced search (300ms delay)
 * - Memoized filter results
 * - Loading state for search
 *
 * Phase 3 - Task 3.4: Search Performance Optimization
 */

const DEBOUNCE_DELAY = 300;

export const useUserFilters = (users: UserModel[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, DEBOUNCE_DELAY);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, debouncedQuery]);

  // Memoized filter function
  const filterUser = useCallback((user: UserModel, query: string): boolean => {
    if (!query.trim()) return true;

    const lowerQuery = query.toLowerCase();
    return (
      user.username.toLowerCase().includes(lowerQuery) ||
      user.fullName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      (user.roleId ? user.roleId.toLowerCase().includes(lowerQuery) : false)
    );
  }, []);

  // Memoized filtered results
  const filteredUsers = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return users;
    }

    return users.filter((user) => filterUser(user, debouncedQuery));
  }, [users, debouncedQuery, filterUser]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredUsers,
    isSearching,
    clearSearch,
    resultCount: filteredUsers.length,
    totalCount: users.length,
  };
};
