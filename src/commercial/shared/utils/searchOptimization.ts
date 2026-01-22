/**
 * Search Optimization Utilities
 *
 * Helper functions for optimizing search and filter operations:
 * - Debounce function
 * - Throttle function
 * - Fuzzy search
 * - Search highlighting
 * - Performance metrics
 */

/**
 * Creates a debounced function that delays invoking func until after
 * wait milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once
 * per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
} {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          func(...lastArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
  };

  return throttled;
}

/**
 * Simple fuzzy search scoring
 * Returns a score based on how well the query matches the target
 * Higher score = better match
 */
export function fuzzyScore(query: string, target: string): number {
  if (!query || !target) return 0;

  const normalizedQuery = query.toLowerCase();
  const normalizedTarget = target.toLowerCase();

  // Exact match
  if (normalizedTarget === normalizedQuery) return 100;

  // Starts with
  if (normalizedTarget.startsWith(normalizedQuery)) return 80;

  // Contains as substring
  if (normalizedTarget.includes(normalizedQuery)) {
    // Score based on position (earlier = better)
    const position = normalizedTarget.indexOf(normalizedQuery);
    return 60 - Math.min(position, 20);
  }

  // Character-by-character fuzzy matching
  let queryIndex = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < normalizedTarget.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedTarget[i] === normalizedQuery[queryIndex]) {
      score += 1 + consecutiveMatches * 0.5;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All query characters found
  if (queryIndex === normalizedQuery.length) {
    return Math.min(score * 2, 40);
  }

  return 0;
}

/**
 * Sort items by fuzzy search score
 */
export function sortByFuzzyScore<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string
): T[] {
  if (!query.trim()) return items;

  return [...items]
    .map((item) => ({
      item,
      score: fuzzyScore(query, getSearchText(item)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/**
 * Highlight matching text in a string
 * Returns an array of segments with match indicators
 */
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export function highlightMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): HighlightSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const segments: HighlightSegment[] = [];

  let lastIndex = 0;
  let index = normalizedText.indexOf(normalizedQuery);

  while (index !== -1) {
    // Add non-matching segment before match
    if (index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, index),
        isMatch: false,
      });
    }

    // Add matching segment
    segments.push({
      text: text.slice(index, index + query.length),
      isMatch: true,
    });

    lastIndex = index + query.length;
    index = normalizedText.indexOf(normalizedQuery, lastIndex);
  }

  // Add remaining non-matching segment
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isMatch: false,
    });
  }

  return segments;
}

/**
 * Measure search performance
 */
export interface SearchPerformanceMetrics {
  searchTime: number;
  itemCount: number;
  resultCount: number;
  itemsPerMs: number;
}

export function measureSearchPerformance<T>(
  items: T[],
  searchFn: (items: T[]) => T[]
): { results: T[]; metrics: SearchPerformanceMetrics } {
  const startTime = Date.now();
  const results = searchFn(items);
  const endTime = Date.now();

  const searchTime = Math.max(endTime - startTime, 0.1); // Avoid division by zero

  return {
    results,
    metrics: {
      searchTime,
      itemCount: items.length,
      resultCount: results.length,
      itemsPerMs: items.length / searchTime,
    },
  };
}

/**
 * Batch processing for large arrays
 * Processes items in chunks to avoid blocking the main thread
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 100,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, total), total);
    }

    // Yield to main thread between batches
    if (i + batchSize < total) {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
    }
  }

  return results;
}

/**
 * Create a search index for faster lookups
 */
export interface SearchIndex<T> {
  search: (query: string) => T[];
  add: (item: T) => void;
  remove: (item: T) => void;
  clear: () => void;
}

export function createSearchIndex<T>(
  items: T[],
  getSearchableText: (item: T) => string,
  keyExtractor: (item: T) => string
): SearchIndex<T> {
  const itemMap = new Map<string, T>();
  const textMap = new Map<string, string>();

  // Initialize
  items.forEach((item) => {
    const key = keyExtractor(item);
    itemMap.set(key, item);
    textMap.set(key, getSearchableText(item).toLowerCase());
  });

  return {
    search: (query: string) => {
      const normalizedQuery = query.toLowerCase().trim();
      if (!normalizedQuery) return Array.from(itemMap.values());

      const results: T[] = [];
      textMap.forEach((text, key) => {
        if (text.includes(normalizedQuery)) {
          const item = itemMap.get(key);
          if (item) results.push(item);
        }
      });
      return results;
    },

    add: (item: T) => {
      const key = keyExtractor(item);
      itemMap.set(key, item);
      textMap.set(key, getSearchableText(item).toLowerCase());
    },

    remove: (item: T) => {
      const key = keyExtractor(item);
      itemMap.delete(key);
      textMap.delete(key);
    },

    clear: () => {
      itemMap.clear();
      textMap.clear();
    },
  };
}
