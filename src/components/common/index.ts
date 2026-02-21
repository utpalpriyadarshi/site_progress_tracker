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

// Supervisor Header
export { SupervisorHeader } from './SupervisorHeader';
export type { SupervisorHeaderProps } from './SupervisorHeader';

// Designer Header
export { DesignerHeader } from './DesignerHeader';
export type { DesignerHeaderProps } from './DesignerHeader';

// Offline Indicator (Phase 3, Task 3.5)
export { OfflineIndicator } from './OfflineIndicator';
export type { OfflineIndicatorProps } from './OfflineIndicator';

// Sync Button (Phase 3, Task 3.5)
export { SyncButton } from './SyncButton';
export type { SyncButtonProps } from './SyncButton';

// Offline Banner
export { OfflineBanner } from './OfflineBanner';
