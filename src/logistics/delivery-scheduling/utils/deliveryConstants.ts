/**
 * Delivery Scheduling Constants
 *
 * Centralized constants for delivery scheduling functionality
 */

import { DeliveryStatus, DeliveryPriority } from '../../../services/DeliverySchedulingService';

// View modes
export type ViewMode = 'schedule' | 'tracking' | 'routes' | 'performance';
export type StatusFilter = 'all' | DeliveryStatus;

// Status color mapping
export const STATUS_COLORS: Record<DeliveryStatus, string> = {
  delivered: '#10b981',
  in_transit: '#3b82f6',
  delayed: '#ef4444',
  scheduled: '#f59e0b',
  confirmed: '#8b5cf6',
  cancelled: '#6b7280',
};

// Priority color mapping
export const PRIORITY_COLORS: Record<DeliveryPriority, string> = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

// View mode tabs configuration
export const VIEW_MODE_TABS = [
  { mode: 'schedule' as ViewMode, label: 'Schedule' },
  { mode: 'tracking' as ViewMode, label: 'Tracking' },
  { mode: 'routes' as ViewMode, label: 'Routes' },
  { mode: 'performance' as ViewMode, label: 'Analytics' },
];

// Status filter options
export const STATUS_FILTER_OPTIONS: Array<{ status: StatusFilter; label: string }> = [
  { status: 'all', label: 'All' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'in_transit', label: 'In Transit' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'delayed', label: 'Delayed' },
];
