/**
 * Centralized Currency Formatter
 *
 * Provides uniform currency formatting across all user roles.
 * Uses Indian Rupee (₹) as the default currency with 'en-IN' locale.
 *
 * This utility ensures consistent currency display throughout the application
 * regardless of which role (Admin, Manager, Commercial, Logistics, etc.) is viewing.
 */

// Default currency configuration
const DEFAULT_CURRENCY_SYMBOL = '₹';
const DEFAULT_CURRENCY_CODE = 'INR';
const DEFAULT_LOCALE = 'en-IN';

/**
 * Format currency with locale-aware formatting
 * @param amount - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @example formatCurrency(1234567) => "₹12,34,567"
 */
export const formatCurrency = (amount: number, decimals: number = 0): string => {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency: DEFAULT_CURRENCY_CODE,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Format currency with simple symbol prefix (no Intl formatting)
 * @param amount - The numeric value to format
 * @example formatCurrencySimple(1234567) => "₹12,34,567"
 */
export const formatCurrencySimple = (amount: number): string => {
  return `${DEFAULT_CURRENCY_SYMBOL}${amount.toLocaleString(DEFAULT_LOCALE)}`;
};

/**
 * Format currency with K suffix for thousands
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @example formatCurrencyK(45000) => "₹45K"
 */
export const formatCurrencyK = (value: number, decimals: number = 0): string => {
  return `${DEFAULT_CURRENCY_SYMBOL}${(value / 1000).toFixed(decimals)}K`;
};

/**
 * Format currency with M suffix for millions
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @example formatCurrencyM(1500000) => "₹1.5M"
 */
export const formatCurrencyM = (value: number, decimals: number = 1): string => {
  return `${DEFAULT_CURRENCY_SYMBOL}${(value / 1000000).toFixed(decimals)}M`;
};

/**
 * Format currency with B suffix for billions
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @example formatCurrencyB(1500000000) => "₹1.5B"
 */
export const formatCurrencyB = (value: number, decimals: number = 1): string => {
  return `${DEFAULT_CURRENCY_SYMBOL}${(value / 1000000000).toFixed(decimals)}B`;
};

/**
 * Smart currency formatter - automatically chooses K, M, or B suffix
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places for large numbers (default: 1)
 * @example formatCurrencySmart(500000) => "₹500K"
 * @example formatCurrencySmart(5000000) => "₹5.0M"
 * @example formatCurrencySmart(5000000000) => "₹5.0B"
 */
export const formatCurrencySmart = (value: number, decimals: number = 1): string => {
  if (value >= 1000000000) {
    return formatCurrencyB(value, decimals);
  } else if (value >= 1000000) {
    return formatCurrencyM(value, decimals);
  } else if (value >= 1000) {
    return formatCurrencyK(value, 0);
  }
  return formatCurrencySimple(value);
};

/**
 * Format currency with 2 decimal places (for precise amounts)
 * @param amount - The numeric value to format
 * @example formatCurrencyPrecise(1234.56) => "₹1,234.56"
 */
export const formatCurrencyPrecise = (amount: number): string => {
  return formatCurrency(amount, 2);
};

/**
 * Get the default currency symbol
 * @returns The currency symbol used throughout the app
 */
export const getCurrencySymbol = (): string => {
  return DEFAULT_CURRENCY_SYMBOL;
};

/**
 * Get the default currency code
 * @returns The ISO 4217 currency code
 */
export const getCurrencyCode = (): string => {
  return DEFAULT_CURRENCY_CODE;
};

/**
 * Get the default locale
 * @returns The locale string used for formatting
 */
export const getLocale = (): string => {
  return DEFAULT_LOCALE;
};
