/**
 * Barrel export for shared Commercial utilities
 */

export {
  debounce,
  throttle,
  fuzzyScore,
  sortByFuzzyScore,
  highlightMatches,
  measureSearchPerformance,
  processBatch,
  createSearchIndex,
} from './searchOptimization';

export type {
  HighlightSegment,
  SearchPerformanceMetrics,
  SearchIndex,
} from './searchOptimization';
