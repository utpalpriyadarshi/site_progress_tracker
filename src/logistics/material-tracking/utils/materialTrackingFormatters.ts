/**
 * Material Tracking Formatters
 *
 * Utility functions for formatting data in Material Tracking screen
 */

import { formatCurrency } from '../../../utils/currencyFormatter';

// Re-export centralized currency formatter
export { formatCurrency };

/**
 * Format quantity with unit
 */
export const formatQuantity = (quantity: number, unit: string): string => {
  return `${quantity.toLocaleString()} ${unit}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date
 */
export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get status color based on stock level
 */
export const getStockStatusColor = (
  available: number,
  required: number
): string => {
  const ratio = available / required;
  if (ratio >= 1) return '#4CAF50'; // Available
  if (ratio >= 0.3) return '#FF9800'; // Low stock
  return '#F44336'; // Out of stock
};

/**
 * Get priority color
 */
export const getPriorityColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'critical':
      return '#F44336';
    case 'high':
      return '#FF9800';
    case 'medium':
      return '#2196F3';
    case 'low':
    default:
      return '#4CAF50';
  }
};

/**
 * Format consumption rate
 */
export const formatConsumptionRate = (rate: number, unit: string): string => {
  return `${rate.toFixed(2)} ${unit}/day`;
};

/**
 * Calculate shortage percentage
 */
export const calculateShortagePercentage = (
  required: number,
  available: number
): number => {
  if (required === 0) return 0;
  const shortage = Math.max(0, required - available);
  return (shortage / required) * 100;
};
