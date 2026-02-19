/**
 * Key Date Constants
 *
 * Constants and utilities for Key Date management.
 * Generic implementation for contract key date tracking.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import { KeyDateCategory, KeyDateStatus } from '../../../../models/KeyDateModel';
import { COLORS } from '../../../theme/colors';

/**
 * Status colors for key dates
 */
export const KEY_DATE_STATUS_COLORS: Record<KeyDateStatus, string> = {
  not_started: COLORS.DISABLED, // Grey
  in_progress: COLORS.INFO, // Blue
  completed: COLORS.SUCCESS,   // Green
  delayed: COLORS.ERROR,     // Red
};

/**
 * Status labels for display
 */
export const KEY_DATE_STATUS_LABELS: Record<KeyDateStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  delayed: 'Delayed',
};

/**
 * Category colors for key dates
 * Categories A-G can be configured per project
 */
export const KEY_DATE_CATEGORY_COLORS: Record<KeyDateCategory, string> = {
  G: COLORS.STATUS_CLOSED, // Blue Grey
  A: COLORS.INFO, // Blue
  B: COLORS.SUCCESS, // Green
  C: COLORS.WARNING, // Orange
  D: COLORS.STATUS_EVALUATED, // Purple
  E: '#00BCD4', // Cyan
  F: '#E91E63', // Pink
};

/**
 * Default category names
 * These are generic defaults; actual names come from the database
 */
export const KEY_DATE_DEFAULT_CATEGORY_NAMES: Record<KeyDateCategory, string> = {
  G: 'General',
  A: 'Category A',
  B: 'Category B',
  C: 'Category C',
  D: 'Category D',
  E: 'Category E',
  F: 'Category F',
};

/**
 * Category icons for display
 */
export const KEY_DATE_CATEGORY_ICONS: Record<KeyDateCategory, string> = {
  G: 'folder-star',
  A: 'folder-text',
  B: 'folder-cog',
  C: 'folder-clock',
  D: 'folder-marker',
  E: 'folder-network',
  F: 'folder-check',
};

/**
 * Default delay damages (currency per day)
 */
export const DEFAULT_DELAY_DAMAGES = {
  initial: 1,    // Days 1-28
  extended: 10,  // From day 29 onwards
};

/**
 * Format delay damages amount
 * Uses generic "units" - actual currency symbol can be configured
 */
export const formatDelayDamages = (amount: number, currencySymbol = '₹', unit = 'Lakhs'): string => {
  if (amount === -1) {
    return 'Special (See Contract)';
  }
  return `${currencySymbol}${amount.toFixed(2)} ${unit}`;
};

/**
 * Format days remaining/delayed
 */
export const formatDaysRemaining = (days: number): string => {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  }
  if (days === 0) {
    return 'Due today';
  }
  return `${days} days remaining`;
};

/**
 * Get all category options for dropdowns
 */
export const getCategoryOptions = (): Array<{ value: KeyDateCategory; label: string }> => [
  { value: 'G', label: 'General' },
  { value: 'A', label: 'Category A' },
  { value: 'B', label: 'Category B' },
  { value: 'C', label: 'Category C' },
  { value: 'D', label: 'Category D' },
  { value: 'E', label: 'Category E' },
  { value: 'F', label: 'Category F' },
];

/**
 * Get all status options for dropdowns
 */
export const getStatusOptions = (): Array<{ value: KeyDateStatus; label: string }> => [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
];
