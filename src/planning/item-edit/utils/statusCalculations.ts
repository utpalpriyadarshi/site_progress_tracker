import { COLORS } from '../../../theme/colors';
/**
 * Status Calculations
 *
 * Logic for calculating item status based on progress
 */

/**
 * Item status types
 */
export type ItemStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Calculate item status based on completed quantity vs planned quantity
 */
export const calculateItemStatus = (
  completedQuantity: number,
  plannedQuantity: number
): ItemStatus => {
  if (completedQuantity >= plannedQuantity) {
    return 'completed';
  } else if (completedQuantity > 0) {
    return 'in_progress';
  }
  return 'not_started';
};

/**
 * Calculate progress percentage
 */
export const calculateProgressPercentage = (
  completedQuantity: number,
  plannedQuantity: number
): number => {
  if (plannedQuantity <= 0) {
    return 0;
  }

  const percentage = (completedQuantity / plannedQuantity) * 100;
  return Math.min(100, Math.round(percentage));
};

/**
 * Format status for display
 */
export const formatStatus = (status: ItemStatus): string => {
  return status.replace('_', ' ').toUpperCase();
};

/**
 * Get status color for UI display
 */
export const getStatusColor = (status: ItemStatus): string => {
  switch (status) {
    case 'completed':
      return COLORS.SUCCESS; // Green
    case 'in_progress':
      return COLORS.WARNING; // Orange
    case 'not_started':
      return COLORS.DISABLED; // Gray
    default:
      return COLORS.DISABLED;
  }
};

/**
 * Calculate duration in days from timestamps
 */
export const calculateDurationDays = (
  startDate: number,
  endDate: number
): number => {
  const durationMs = endDate - startDate;
  return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculate end date from start date and duration
 */
export const calculateEndDate = (
  startDate: Date,
  durationDays: number
): Date => {
  return new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
};

/**
 * Parse numeric string value safely
 */
export const parseNumericValue = (value: string, defaultValue: number = 0): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Determine if item should have float days
 * (Critical path items always have 0 float days)
 */
export const calculateFloatDays = (
  isCriticalPath: boolean,
  floatDays: number
): number => {
  return isCriticalPath ? 0 : floatDays;
};
