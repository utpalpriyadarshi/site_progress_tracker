/**
 * Performance Optimization Hooks
 *
 * React hooks for performance optimization including memoization,
 * throttling, debouncing, and lazy loading.
 *
 * Week 9 - Performance & Polish
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cache, memoize, throttle, debounce } from '../utils/PerformanceUtils';

// ============================================================================
// Debounced Value Hook
// ============================================================================

/**
 * Hook to debounce a value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Throttled Callback Hook
// ============================================================================

/**
 * Hook to throttle a callback function
 */
export function useThrottle<Args extends any[]>(
  callback: (...args: Args) => void,
  delay: number = 300
): (...args: Args) => void {
  const throttledRef = useRef<((...args: Args) => void) | null>(null);

  if (!throttledRef.current) {
    throttledRef.current = throttle(callback, delay);
  }

  return throttledRef.current;
}

// ============================================================================
// Debounced Callback Hook
// ============================================================================

/**
 * Hook to debounce a callback function
 */
export function useDebouncedCallback<Args extends any[]>(
  callback: (...args: Args) => void,
  delay: number = 300
): (...args: Args) => void {
  const debouncedRef = useRef<((...args: Args) => void) | null>(null);

  if (!debouncedRef.current) {
    debouncedRef.current = debounce(callback, delay);
  }

  return debouncedRef.current;
}

// ============================================================================
// Cached Data Hook
// ============================================================================

/**
 * Hook to cache data with TTL
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T> | T,
  ttl?: number,
  dependencies: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = cache.get<T>(key);
      if (cached !== null) {
        setData(cached);
        setLoading(false);
        return;
      }

      // Fetch data
      const result = await Promise.resolve(fetcher());

      // Cache and set data
      cache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [key, ttl, ...dependencies]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    cache.invalidate(key);
    loadData();
  }, [key, loadData]);

  return { data, loading, error, refresh };
}

// ============================================================================
// Previous Value Hook
// ============================================================================

/**
 * Hook to get previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// Mounted State Hook
// ============================================================================

/**
 * Hook to track if component is mounted
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

// ============================================================================
// Async Effect Hook
// ============================================================================

/**
 * Hook for async effects with cleanup
 */
export function useAsyncEffect(
  effect: () => Promise<void | (() => void)>,
  dependencies: any[] = []
): void {
  const isMounted = useIsMounted();

  useEffect(() => {
    let cleanup: void | (() => void);

    effect().then(result => {
      if (isMounted()) {
        cleanup = result;
      }
    }).catch(err => {
      console.error('Async effect error:', err);
    });

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

// ============================================================================
// Lazy Loading Hook
// ============================================================================

/**
 * Hook for lazy loading data
 */
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  initialLoad: boolean = false
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  load: () => void;
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) {
      return; // Already loading
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [loader]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    if (initialLoad) {
      load();
    }
  }, [initialLoad, load]);

  return { data, loading, error, load, reset };
}

// ============================================================================
// Batch Update Hook
// ============================================================================

/**
 * Hook to batch multiple state updates
 */
export function useBatchUpdate<T>(
  initialState: T
): [T, (updates: Partial<T>) => void, () => void] {
  const [state, setState] = useState<T>(initialState);
  const pendingUpdatesRef = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    // Accumulate updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule batch update
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }, 0);
  }, []);

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (Object.keys(pendingUpdatesRef.current).length > 0) {
      setState(prev => ({
        ...prev,
        ...pendingUpdatesRef.current,
      }));
      pendingUpdatesRef.current = {};
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchUpdate, flushUpdates];
}

// ============================================================================
// Window Virtualization Hook
// ============================================================================

/**
 * Hook for windowed rendering (virtual scrolling)
 */
export function useWindowedList<T>(
  items: T[],
  itemHeight: number,
  windowSize: number = 20
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  onScroll: (scrollY: number) => void;
} {
  const [scrollY, setScrollY] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollY / itemHeight) - windowSize / 2);
  const endIndex = Math.min(items.length, startIndex + windowSize);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((newScrollY: number) => {
    setScrollY(newScrollY);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    onScroll,
  };
}

// ============================================================================
// Intersection Observer Hook
// ============================================================================

/**
 * Hook for intersection observer (lazy loading images, infinite scroll)
 */
export function useIntersectionObserver(
  ref: React.RefObject<any>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

// ============================================================================
// Optimized Search Hook
// ============================================================================

/**
 * Hook for optimized search with debouncing
 */
export function useOptimizedSearch<T>(
  items: T[],
  searchKeys: (keyof T)[],
  delay: number = 300
): {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: T[];
} {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const query = debouncedQuery.toLowerCase();

    return items.filter(item => {
      return searchKeys.some(key => {
        const value = item[key];
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [items, debouncedQuery, searchKeys]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
  };
}

// ============================================================================
// Performance Timer Hook
// ============================================================================

/**
 * Hook to measure render performance
 */
export function useRenderTimer(componentName: string): void {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = Date.now() - startTimeRef.current;

    if (__DEV__) {
      console.log(
        `[Performance] ${componentName} - Render #${renderCountRef.current} took ${renderTime}ms`
      );
    }

    startTimeRef.current = Date.now();
  });
}

// ============================================================================
// Export
// ============================================================================

export default {
  useDebounce,
  useThrottle,
  useDebouncedCallback,
  useCachedData,
  usePrevious,
  useIsMounted,
  useAsyncEffect,
  useLazyLoad,
  useBatchUpdate,
  useWindowedList,
  useIntersectionObserver,
  useOptimizedSearch,
  useRenderTimer,
};
