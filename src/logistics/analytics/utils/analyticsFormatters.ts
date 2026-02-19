/**
 * Analytics Formatters
 *
 * Utility functions for formatting analytics data
 * Phase 1: Utils and Constants
 */

import {
  formatCurrencyPrecise,
  formatCurrencyK as formatCurrencyKCentral,
  formatCurrencyM as formatCurrencyMCentral,
} from '../../../utils/currencyFormatter';
import { COLORS } from '../../../theme/colors';

/**
 * Format currency value
 * @param value - The numeric value to format
 * @param _currency - Deprecated: Currency symbol (ignored, uses centralized config)
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatCurrency = (value: number, _currency: string = '₹', decimals: number = 2): string => {
  return formatCurrencyPrecise(value);
};

/**
 * Format currency in thousands (K)
 * @param value - The numeric value to format
 * @param _currency - Deprecated: Currency symbol (ignored, uses centralized config)
 * @param decimals - Number of decimal places (default: 1)
 */
export const formatCurrencyK = (value: number, _currency: string = '₹', decimals: number = 1): string => {
  return formatCurrencyKCentral(value, decimals);
};

/**
 * Format currency in millions (M)
 * @param value - The numeric value to format
 * @param _currency - Deprecated: Currency symbol (ignored, uses centralized config)
 * @param decimals - Number of decimal places (default: 2)
 */
export const formatCurrencyM = (value: number, _currency: string = '₹', decimals: number = 2): string => {
  return formatCurrencyMCentral(value, decimals);
};

/**
 * Format percentage
 * @param value - The numeric value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 */
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with commas
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 */
export const formatNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format date to short format (MM/DD/YYYY)
 * @param date - Date string or Date object
 */
export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

/**
 * Format date to medium format (MMM DD, YYYY)
 * @param date - Date string or Date object
 */
export const formatDateMedium = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format date to long format (Month DD, YYYY)
 * @param date - Date string or Date object
 */
export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Format days (singular/plural)
 * @param days - Number of days
 */
export const formatDays = (days: number): string => {
  return `${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Format variance with sign and color indicator
 * @param value - The variance value
 * @param decimals - Number of decimal places (default: 1)
 */
export const formatVariance = (value: number, decimals: number = 1): { text: string; isPositive: boolean } => {
  const sign = value > 0 ? '+' : '';
  return {
    text: `${sign}${value.toFixed(decimals)}%`,
    isPositive: value >= 0,
  };
};

/**
 * Format large number with K, M, B suffix
 * @param value - The numeric value
 * @param decimals - Number of decimal places (default: 1)
 */
export const formatLargeNumber = (value: number, decimals: number = 1): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(decimals)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
};

/**
 * Format trend indicator
 * @param trend - Trend direction ('up', 'down', 'stable')
 */
export const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
};

/**
 * Get trend color
 * @param trend - Trend direction
 * @param inverse - If true, down is good and up is bad (default: false)
 */
export const getTrendColor = (trend: 'up' | 'down' | 'stable', inverse: boolean = false): string => {
  if (trend === 'stable') return COLORS.INFO;

  const isGood = inverse ? trend === 'down' : trend === 'up';
  return isGood ? COLORS.SUCCESS : COLORS.ERROR;
};

/**
 * Calculate and format growth rate
 * @param current - Current value
 * @param previous - Previous value
 * @param decimals - Number of decimal places (default: 1)
 */
export const formatGrowthRate = (current: number, previous: number, decimals: number = 1): string => {
  if (previous === 0) return 'N/A';
  const growth = ((current - previous) / previous) * 100;
  const sign = growth > 0 ? '+' : '';
  return `${sign}${growth.toFixed(decimals)}%`;
};

/**
 * Format confidence level
 * @param confidence - Confidence value (0-1)
 */
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(0)}%`;
};

/**
 * Format time duration in hours/days
 * @param hours - Number of hours
 */
export const formatDuration = (hours: number): string => {
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return formatDays(days);
  }
  return `${days}d ${remainingHours.toFixed(0)}h`;
};

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default: 50)
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
