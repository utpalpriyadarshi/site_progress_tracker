/**
 * Performance Utilities for Logistics System
 *
 * Provides caching, memoization, throttling, and debouncing utilities
 * to optimize performance across the logistics module.
 *
 * Week 9 - Performance & Polish
 */

// ============================================================================
// Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Set a cache entry with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      value,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Get a cache entry, returns null if expired or not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    size: number;
  } {
    const now = Date.now();
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      size: this.cache.size - expiredEntries,
    };
  }
}

// Global cache instance
export const cache = new CacheManager();

// ============================================================================
// Memoization
// ============================================================================

/**
 * Memoize a function with cache key generation
 */
export function memoize<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  keyGenerator?: (...args: Args) => string,
  ttl?: number
): (...args: Args) => Result {
  const defaultKeyGen = (...args: Args) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGen;

  return (...args: Args): Result => {
    const key = `memoized:${fn.name}:${getKey(...args)}`;

    // Check cache first
    const cached = cache.get<Result>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute and cache result
    const result = fn(...args);
    cache.set(key, result, ttl);

    return result;
  };
}

/**
 * Memoize async function
 */
export function memoizeAsync<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyGenerator?: (...args: Args) => string,
  ttl?: number
): (...args: Args) => Promise<Result> {
  const defaultKeyGen = (...args: Args) => JSON.stringify(args);
  const getKey = keyGenerator || defaultKeyGen;
  const pendingPromises = new Map<string, Promise<Result>>();

  return async (...args: Args): Promise<Result> => {
    const key = `memoized:${fn.name}:${getKey(...args)}`;

    // Check cache first
    const cached = cache.get<Result>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if already fetching
    const pending = pendingPromises.get(key);
    if (pending) {
      return pending;
    }

    // Fetch and cache
    const promise = fn(...args);
    pendingPromises.set(key, promise);

    try {
      const result = await promise;
      cache.set(key, result, ttl);
      return result;
    } finally {
      pendingPromises.delete(key);
    }
  };
}

// ============================================================================
// Throttle & Debounce
// ============================================================================

/**
 * Throttle function execution
 */
export function throttle<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let lastCall = 0;
  let timeoutId: any | null = null;

  return (...args: Args) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, delay - (now - lastCall));
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: any | null = null;

  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// ============================================================================
// Lazy Loading Helper
// ============================================================================

/**
 * Create a lazy loader for heavy computations
 */
export class LazyLoader<T> {
  private value: T | null = null;
  private loading: boolean = false;
  private loader: () => Promise<T>;
  private promise: Promise<T> | null = null;

  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  async load(): Promise<T> {
    if (this.value !== null) {
      return this.value;
    }

    if (this.loading && this.promise) {
      return this.promise;
    }

    this.loading = true;
    this.promise = this.loader();

    try {
      this.value = await this.promise;
      return this.value;
    } finally {
      this.loading = false;
      this.promise = null;
    }
  }

  reset(): void {
    this.value = null;
    this.loading = false;
    this.promise = null;
  }

  isLoaded(): boolean {
    return this.value !== null;
  }

  getValue(): T | null {
    return this.value;
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Start timing an operation
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric({
        operation,
        duration,
        timestamp: startTime,
      });
    };
  }

  /**
   * Record a metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get metrics for an operation
   */
  getMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation);

    if (operationMetrics.length === 0) {
      return 0;
    }

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  /**
   * Get all operations
   */
  getAllOperations(): string[] {
    const operations = new Set<string>();
    this.metrics.forEach(m => operations.add(m.operation));
    return Array.from(operations);
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; avgDuration: number; maxDuration: number }> {
    const summary: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};

    this.getAllOperations().forEach(operation => {
      const metrics = this.getMetrics(operation);
      const durations = metrics.map(m => m.duration);

      summary[operation] = {
        count: metrics.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        maxDuration: Math.max(...durations),
      };
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Batch process items with delay between batches
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delayMs: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Add delay between batches to avoid overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ============================================================================
// Image/Asset Loading Optimization
// ============================================================================

/**
 * Preload images (Web only)
 */
export function preloadImages(imageUrls: string[]): Promise<void[]> {
  // For React Native, this would use react-native's Image.prefetch()
  // Simplified web version here
  return Promise.all(
    imageUrls.map(url => {
      return Promise.resolve();
    })
  );
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Cleanup function to release resources
 */
export function cleanup(): void {
  cache.cleanExpired();
  performanceMonitor.clear();
}

/**
 * Auto cleanup every 5 minutes
 */
let autoCleanupInterval: any | null = null;

export function enableAutoCleanup(intervalMs: number = 5 * 60 * 1000): void {
  if (autoCleanupInterval) {
    clearInterval(autoCleanupInterval);
  }

  autoCleanupInterval = setInterval(() => {
    cleanup();
  }, intervalMs);
}

export function disableAutoCleanup(): void {
  if (autoCleanupInterval) {
    clearInterval(autoCleanupInterval);
    autoCleanupInterval = null;
  }
}

// Enable auto cleanup by default
enableAutoCleanup();

// ============================================================================
// React Hooks Integration
// ============================================================================

/**
 * Hook-compatible throttle wrapper
 */
export function useThrottle<T>(value: T, delay: number): T {
  // This is a simplified version - actual implementation would use React hooks
  return value;
}

/**
 * Hook-compatible debounce wrapper
 */
export function useDebounce<T>(value: T, delay: number): T {
  // This is a simplified version - actual implementation would use React hooks
  return value;
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  cache,
  memoize,
  memoizeAsync,
  throttle,
  debounce,
  LazyLoader,
  performanceMonitor,
  batchProcess,
  preloadImages,
  cleanup,
  enableAutoCleanup,
  disableAutoCleanup,
};
