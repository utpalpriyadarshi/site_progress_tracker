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

// Form validation hook (Phase 2, Task 2.2.1)
export {
  useFormValidation,
  ValidationPatterns,
  CommonValidations,
} from './useFormValidation';
export type {
  ValidationRule,
  ValidationSchema,
  ValidationErrors,
} from './useFormValidation';

// Offline sync hook (Phase 2, Task 2.2.2)
export {
  useOfflineSync,
  formatLastSyncTime,
  getSyncStatusColor,
  getSyncStatusIcon,
} from './useOfflineSync';
export type {
  SyncStatus,
  SyncResult,
  UseOfflineSyncOptions,
  UseOfflineSyncReturn,
} from './useOfflineSync';

// Snackbar hook
export { useSnackbar } from './useSnackbar';

// FlatList performance hook
export { useFlatListProps } from './useFlatListProps';
