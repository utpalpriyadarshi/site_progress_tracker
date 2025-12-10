/**
 * Barrel export file for all custom hooks
 *
 * This file provides clean imports for custom hooks across the application.
 *
 * @example
 * ```tsx
 * import { usePhotoUpload, useChecklist } from '@/hooks';
 * ```
 */

// Performance hooks
export {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  useCachedData,
  useAsyncEffect,
  useLazyLoad,
  useIsMounted,
  usePrevious,
  useBatchUpdate,
  useWindowedList,
  useIntersectionObserver,
  useOptimizedSearch,
  useRenderTimer,
} from './usePerformance';

export type {
  CachedDataResult,
  WindowedListResult,
  IntersectionObserverOptions,
} from './usePerformance';

// Photo upload hook
export { usePhotoUpload } from './usePhotoUpload';
export type {
  UsePhotoUploadOptions,
  UsePhotoUploadReturn,
} from './usePhotoUpload';

// Checklist hook
export { useChecklist } from './useChecklist';
export type {
  ChecklistItem,
  ChecklistSummary,
  UseChecklistOptions,
  UseChecklistReturn,
} from './useChecklist';
