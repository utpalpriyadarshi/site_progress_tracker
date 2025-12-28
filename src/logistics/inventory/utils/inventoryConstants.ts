import { InventoryStatus, ABCCategory } from '../../../services/InventoryOptimizationService';

/**
 * Inventory Management Constants
 *
 * View modes, status mappings, ABC categories, and color schemes
 * for the Inventory Management screen.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 1.
 */

// ============================================================================
// VIEW MODES & TYPES
// ============================================================================

export type ViewMode = 'overview' | 'locations' | 'transfers' | 'analytics';
export type StatusFilter = 'all' | InventoryStatus;
export type LocationFilter = 'all' | string;
export type ABCFilter = 'all' | ABCCategory;

// ============================================================================
// VIEW MODE DEFINITIONS
// ============================================================================

export interface ViewModeTab {
  mode: ViewMode;
  label: string;
  icon?: string;
}

export const VIEW_MODE_TABS: ViewModeTab[] = [
  { mode: 'overview', label: 'Overview', icon: '📊' },
  { mode: 'locations', label: 'Locations', icon: '📍' },
  { mode: 'transfers', label: 'Transfers', icon: '🚚' },
  { mode: 'analytics', label: 'Analytics', icon: '📈' },
];

// ============================================================================
// STATUS COLORS
// ============================================================================

export const STATUS_COLORS: Record<InventoryStatus, string> = {
  in_stock: '#10b981',      // Green - healthy stock
  low_stock: '#f59e0b',     // Orange - warning
  out_of_stock: '#ef4444',  // Red - critical
  overstocked: '#3b82f6',   // Blue - attention needed
  obsolete: '#6b7280',      // Gray - deprecated
};

export const STATUS_LABELS: Record<InventoryStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  overstocked: 'Overstocked',
  obsolete: 'Obsolete',
};

// ============================================================================
// ABC ANALYSIS COLORS
// ============================================================================

export const ABC_COLORS: Record<ABCCategory, string> = {
  A: '#dc2626', // Red - highest priority (20% items, 80% value)
  B: '#f59e0b', // Orange - medium priority
  C: '#10b981', // Green - lowest priority (80% items, 20% value)
};

export const ABC_LABELS: Record<ABCCategory, string> = {
  A: 'Category A',
  B: 'Category B',
  C: 'Category C',
};

export const ABC_DESCRIPTIONS: Record<ABCCategory, string> = {
  A: 'High value items (80% of inventory value)',
  B: 'Medium value items',
  C: 'Low value items (80% of item count)',
};

// ============================================================================
// HEALTH SCORE THRESHOLDS
// ============================================================================

export const HEALTH_SCORE_COLORS = {
  excellent: '#10b981', // >= 80
  good: '#3b82f6',      // >= 60
  fair: '#f59e0b',      // >= 40
  poor: '#ef4444',      // < 40
};

export const HEALTH_SCORE_LABELS = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

// ============================================================================
// TRANSFER STATUS
// ============================================================================

export const TRANSFER_STATUS_COLORS = {
  requested: '#f59e0b',   // Pending approval
  approved: '#3b82f6',    // Approved, not shipped
  in_transit: '#8b5cf6',  // Currently moving
  completed: '#10b981',   // Successfully delivered
  cancelled: '#6b7280',   // Cancelled
};

export const TRANSFER_STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
