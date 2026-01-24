import { formatCurrency as formatCurrencyCentral } from '../../../utils/currencyFormatter';

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyCentral(amount);
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format Date object to readable string
 */
export const formatDateObject = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
