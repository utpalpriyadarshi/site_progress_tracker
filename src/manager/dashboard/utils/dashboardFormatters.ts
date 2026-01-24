/**
 * Dashboard Utility Functions - Formatters
 *
 * Helper functions for formatting data in the Manager Dashboard
 */

import { formatCurrency } from '../../../utils/currencyFormatter';

// Re-export centralized currency formatter
export { formatCurrency };

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getHealthStatus = (
  overallCompletion: number
): { label: string; color: string } => {
  if (overallCompletion >= 90) return { label: 'Excellent', color: '#4CAF50' };
  if (overallCompletion >= 70) return { label: 'Good', color: '#8BC34A' };
  if (overallCompletion >= 50) return { label: 'On Track', color: '#FFC107' };
  if (overallCompletion >= 30) return { label: 'At Risk', color: '#FF9800' };
  return { label: 'Delayed', color: '#F44336' };
};

/**
 * Get KPI indicator color based on value and thresholds
 */
export const getKPIIndicatorColor = (
  value: number,
  goodThreshold: number,
  warningThreshold: number,
  inverse: boolean = false
): string => {
  if (inverse) {
    // For metrics where lower is better (e.g., open issues)
    if (value <= goodThreshold) return '#4CAF50';  // Green
    if (value <= warningThreshold) return '#FFC107';  // Yellow
    return '#F44336';  // Red
  } else {
    // For metrics where higher is better
    if (value >= goodThreshold) return '#4CAF50';  // Green
    if (value >= warningThreshold) return '#FFC107';  // Yellow
    return '#F44336';  // Red
  }
};
