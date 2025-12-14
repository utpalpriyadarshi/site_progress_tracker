/**
 * Common Components Barrel Export
 *
 * Provides clean imports for common/shared components
 *
 * @example
 * ```tsx
 * import { SyncStatusChip, EmptyState, LoadingOverlay } from '@/components/common';
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.4
 */

// Sync Status Chip
export { SyncStatusChip } from './SyncStatusChip';
export type { SyncStatusChipProps, SyncStatusType } from './SyncStatusChip';

// Empty State
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// Loading Overlay
export { LoadingOverlay } from './LoadingOverlay';
export type { LoadingOverlayProps } from './LoadingOverlay';

// Error Boundary (existing)
export { default as ErrorBoundary } from './ErrorBoundary';
