/**
 * Performance Utilities
 *
 * Hooks and helpers for optimizing React Native app performance.
 *
 * Features:
 * - Debouncing and throttling
 * - Memoization helpers
 * - FlatList optimizations
 * - Shallow comparison utilities
 */

export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';
export {
  useMemoObject,
  useMemoArray,
  useStableCallback,
  createKeyExtractor,
  createGetItemLayout,
  shallowEqual,
} from './memoHelpers';
