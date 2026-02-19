/**
 * Analytics Constants and Mock Data
 *
 * Extracted from LogisticsAnalyticsScreen for reusability
 * Phase 1: Utils and Constants
 */

import {
  HistoricalDataPoint,
  ProjectDemandFactor,
} from '../../../services/PredictiveAnalyticsService';
import {
  VolumeDiscount,
  CostBreakdown,
} from '../../../services/CostOptimizationService';
import { COLORS } from '../../../theme/colors';

// ============================================================================
// TYPES
// ============================================================================

export type ViewMode = 'overview' | 'demand' | 'costs' | 'performance' | 'optimization';
export type ReportType = 'executive' | 'operational' | 'cost_analysis' | 'compliance';

// ============================================================================
// VIEW MODE TABS
// ============================================================================

export const VIEW_MODE_TABS = [
  { id: 'overview' as ViewMode, label: 'Overview', icon: 'dashboard' },
  { id: 'demand' as ViewMode, label: 'Demand', icon: 'trending-up' },
  { id: 'costs' as ViewMode, label: 'Costs', icon: 'attach-money' },
  { id: 'performance' as ViewMode, label: 'Performance', icon: 'assessment' },
  { id: 'optimization' as ViewMode, label: 'Optimization', icon: 'lightbulb-outline' },
];

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Generate mock historical data for demand analysis
 * 90 days of data with sinusoidal pattern plus randomness
 */
export const generateMockHistoricalData = (): HistoricalDataPoint[] => {
  return Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (90 - i));
    return {
      date: date.toISOString(),
      value: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
    };
  });
};

/**
 * Generate mock cost data with increasing trend
 * 90 days of data showing gradual cost increase
 */
export const generateMockCostData = (): HistoricalDataPoint[] => {
  return Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (90 - i));
    return {
      date: date.toISOString(),
      value: 500 + (i / 90) * 50 + Math.random() * 20,
    };
  });
};

/**
 * Mock project demand factors for forecasting
 */
export const mockProjectDemand: ProjectDemandFactor[] = [
  {
    projectId: 'p1',
    projectName: 'Office Tower Phase 2',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    requiredQuantity: 500,
    probability: 90,
    impact: 450,
  },
  {
    projectId: 'p2',
    projectName: 'Industrial Complex',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    requiredQuantity: 800,
    probability: 75,
    impact: 600,
  },
];

/**
 * Volume discount tiers for cost optimization
 */
export const mockVolumeDiscounts: VolumeDiscount[] = [
  { tier: 1, minQuantity: 0, maxQuantity: 100, discountPercentage: 0, discountedPrice: 100 },
  { tier: 2, minQuantity: 100, maxQuantity: 500, discountPercentage: 5, discountedPrice: 95 },
  { tier: 3, minQuantity: 500, maxQuantity: 1000, discountPercentage: 10, discountedPrice: 90 },
  { tier: 4, minQuantity: 1000, discountPercentage: 15, discountedPrice: 85 },
];

/**
 * Current cost breakdown for analysis
 */
export const mockCurrentCosts: CostBreakdown = {
  totalCost: 250000,
  currency: 'USD',
  materialCosts: 180000,
  transportationCosts: 35000,
  storageCosts: 20000,
  administrativeCosts: 10000,
  wasteCosts: 5000,
  fixedCosts: 50000,
  variableCosts: 200000,
  costPercentages: {
    materials: 72,
    transportation: 14,
    storage: 8,
    administrative: 4,
    waste: 2,
  },
};

/**
 * Mock historical lead times for suppliers (in days)
 */
export const mockSupplierLeadTimes = {
  supplier1: [12, 14, 13, 15, 14, 16, 13, 14, 12, 15],
  supplier2: [7, 8, 9, 7, 10, 8, 7, 9, 8, 7],
  supplier3: [20, 22, 21, 23, 19, 21, 20, 22, 21, 20],
};

/**
 * Color palette for charts and indicators
 */
export const ANALYTICS_COLORS = {
  primary: COLORS.INFO,
  success: COLORS.SUCCESS,
  warning: COLORS.WARNING,
  danger: COLORS.ERROR,
  info: '#00BCD4',
  purple: COLORS.STATUS_EVALUATED,
  teal: '#009688',
  grey: COLORS.DISABLED,
};

/**
 * Health score thresholds
 */
export const HEALTH_SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
  poor: 0,
};

/**
 * Get health score status based on score value
 */
export const getHealthScoreStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (score >= HEALTH_SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= HEALTH_SCORE_THRESHOLDS.good) return 'good';
  if (score >= HEALTH_SCORE_THRESHOLDS.fair) return 'fair';
  return 'poor';
};

/**
 * Get color for health score
 */
export const getHealthScoreColor = (score: number): string => {
  const status = getHealthScoreStatus(score);
  switch (status) {
    case 'excellent': return ANALYTICS_COLORS.success;
    case 'good': return ANALYTICS_COLORS.info;
    case 'fair': return ANALYTICS_COLORS.warning;
    case 'poor': return ANALYTICS_COLORS.danger;
  }
};
