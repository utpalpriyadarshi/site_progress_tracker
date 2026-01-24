import { InventoryStatus, ABCCategory } from '../../../services/InventoryOptimizationService';
import {
  STATUS_COLORS,
  ABC_COLORS,
  HEALTH_SCORE_COLORS,
  TRANSFER_STATUS_COLORS
} from './inventoryConstants';
import {
  formatCurrency,
  formatCurrencyK,
  formatCurrencyM,
  formatCurrencySmart,
} from '../../../utils/currencyFormatter';

/**
 * Inventory Management Formatters
 *
 * Formatting utilities for currency, quantities, percentages,
 * and color-coding for the Inventory Management screen.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 1.
 */

// ============================================================================
// CURRENCY FORMATTING - Re-exported from centralized utility
// ============================================================================
export { formatCurrency, formatCurrencyK, formatCurrencyM, formatCurrencySmart };

// ============================================================================
// QUANTITY FORMATTING
// ============================================================================

/**
 * Format quantity with unit
 * @example formatQuantity(1234, 'kg') => "1,234 kg"
 */
export const formatQuantity = (quantity: number, unit: string): string => {
  return `${quantity.toLocaleString('en-IN')} ${unit}`;
};

/**
 * Format quantity without unit (just number formatting)
 * @example formatQuantityValue(1234) => "1,234"
 */
export const formatQuantityValue = (quantity: number): string => {
  return quantity.toLocaleString('en-IN');
};

// ============================================================================
// PERCENTAGE FORMATTING
// ============================================================================

/**
 * Format percentage value
 * @example formatPercentage(0.745) => "74.5%"
 * @example formatPercentage(0.745, 0) => "75%"
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format percentage from raw percentage value
 * @example formatPercentageRaw(74.5) => "74.5%"
 */
export const formatPercentageRaw = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

// ============================================================================
// CAPACITY FORMATTING
// ============================================================================

/**
 * Format storage capacity with percentage
 * @example formatCapacity(750, 1000) => "750m³ / 1,000m³ (75%)"
 */
export const formatCapacity = (used: number, total: number): string => {
  const percent = total > 0 ? ((used / total) * 100).toFixed(0) : '0';
  return `${used.toLocaleString()}m³ / ${total.toLocaleString()}m³ (${percent}%)`;
};

/**
 * Calculate capacity percentage
 * @example getCapacityPercentage(750, 1000) => 75
 */
export const getCapacityPercentage = (used: number, total: number): number => {
  return total > 0 ? (used / total) * 100 : 0;
};

// ============================================================================
// COLOR GETTERS
// ============================================================================

/**
 * Get color for inventory status
 * @example getStatusColor('low_stock') => "#f59e0b"
 */
export const getStatusColor = (status: InventoryStatus): string => {
  return STATUS_COLORS[status] || '#9ca3af';
};

/**
 * Get color for ABC category
 * @example getABCColor('A') => "#dc2626"
 */
export const getABCColor = (category?: ABCCategory): string => {
  return category ? ABC_COLORS[category] : '#9ca3af';
};

/**
 * Get color for health score
 * @param score - Health score from 0-100
 * @example getHealthScoreColor(85) => "#10b981" (excellent)
 */
export const getHealthScoreColor = (score: number): string => {
  if (score >= 80) return HEALTH_SCORE_COLORS.excellent;
  if (score >= 60) return HEALTH_SCORE_COLORS.good;
  if (score >= 40) return HEALTH_SCORE_COLORS.fair;
  return HEALTH_SCORE_COLORS.poor;
};

/**
 * Get label for health score
 * @param score - Health score from 0-100
 * @example getHealthScoreLabel(85) => "Excellent"
 */
export const getHealthScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

/**
 * Get color for transfer status
 * @example getTransferStatusColor('in_transit') => "#8b5cf6"
 */
export const getTransferStatusColor = (status: string): string => {
  return TRANSFER_STATUS_COLORS[status as keyof typeof TRANSFER_STATUS_COLORS] || '#9ca3af';
};

// ============================================================================
// CAPACITY THRESHOLDS
// ============================================================================

/**
 * Get color based on capacity percentage
 * @param percentage - Capacity used percentage (0-100)
 * @example getCapacityColor(85) => "#f59e0b" (warning)
 */
export const getCapacityColor = (percentage: number): string => {
  if (percentage >= 90) return '#ef4444'; // Red - nearly full
  if (percentage >= 70) return '#f59e0b'; // Orange - getting full
  return '#10b981'; // Green - healthy capacity
};

// ============================================================================
// TURNOVER RATE FORMATTING
// ============================================================================

/**
 * Format turnover rate
 * @example formatTurnoverRate(2.5) => "2.5x"
 */
export const formatTurnoverRate = (rate: number): string => {
  return `${rate.toFixed(1)}x`;
};

// ============================================================================
// RISK FORMATTING
// ============================================================================

/**
 * Get color for risk percentage
 * @param riskPercent - Risk percentage (0-100)
 * @example getRiskColor(75) => "#ef4444" (high risk)
 */
export const getRiskColor = (riskPercent: number): string => {
  if (riskPercent >= 70) return '#ef4444'; // Red - high risk
  if (riskPercent >= 40) return '#f59e0b'; // Orange - medium risk
  return '#10b981'; // Green - low risk
};
