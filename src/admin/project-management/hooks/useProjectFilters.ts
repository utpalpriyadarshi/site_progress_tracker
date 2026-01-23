import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ProjectModel from '../../../../models/ProjectModel';

/**
 * useProjectFilters Hook
 *
 * Optimized project filtering with:
 * - Debounced search (300ms delay)
 * - Memoized filter results
 * - Loading state for search
 *
 * Phase 3 - Task 3.4: Search Performance Optimization
 */

const DEBOUNCE_DELAY = 300;

export const useProjectFilters = (projects: ProjectModel[]) => {
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
  const filterProject = useCallback((project: ProjectModel, query: string): boolean => {
    if (!query.trim()) return true;

    const lowerQuery = query.toLowerCase();
    return (
      project.name.toLowerCase().includes(lowerQuery) ||
      project.client.toLowerCase().includes(lowerQuery) ||
      project.status.toLowerCase().includes(lowerQuery)
    );
  }, []);

  // Memoized filtered results
  const filteredProjects = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return projects;
    }

    return projects.filter((project) => filterProject(project, debouncedQuery));
  }, [projects, debouncedQuery, filterProject]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredProjects,
    isSearching,
    clearSearch,
    resultCount: filteredProjects.length,
    totalCount: projects.length,
  };
};
