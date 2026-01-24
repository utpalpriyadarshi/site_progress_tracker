/**
 * BOM Formatters
 * Utility functions for formatting BOM-related data
 */

import { formatCurrencySimple } from '../../../utils/currencyFormatter';

/**
 * Format number as currency
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencySimple(amount);
};

/**
 * Format date to Indian locale
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-IN');
};

/**
 * Format date and time to Indian locale
 */
export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-IN');
};
