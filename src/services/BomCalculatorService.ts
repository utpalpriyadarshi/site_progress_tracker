/**
 * BomCalculatorService
 *
 * Centralized service for all BOM-related cost calculations, analytics, and metrics.
 *
 * Features:
 * - Cost Performance Index (CPI)
 * - Budget utilization calculations
 * - Variance analysis (Estimated vs Actual)
 * - Category-wise cost breakdowns
 * - Percentage calculations
 * - Budget status indicators
 */

import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import { COLORS } from '../theme/colors';

export interface CostBreakdown {
  totalEstimated: number;
  totalActual: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  contingencyAmount: number;
  profitAmount: number;
  grandTotal: number;
}

export interface CategoryBreakdown {
  category: string;
  estimatedCost: number;
  actualCost: number;
  percentage: number;
  variance: number;
  variancePercentage: number;
}

export interface BudgetUtilization {
  budgetUtilization: number; // Percentage
  remaining: number;
  spent: number;
  status: 'on-track' | 'warning' | 'over-budget'; // Green/Yellow/Red
}

export interface CostPerformance {
  costPerformanceIndex: number; // CPI = Budget / Actual
  costVariance: number; // CV = Budget - Actual
  costVariancePercentage: number; // CV%
  estimateAtCompletion: number; // EAC
  varianceAtCompletion: number; // VAC = Budget - EAC
}

export interface PhaseBreakdown {
  phase: string;
  estimatedCost: number;
  actualCost: number;
  percentage: number;
  itemCount: number;
}

class BomCalculatorService {
  /**
   * Calculate total cost breakdown for a BOM
   */
  calculateCostBreakdown(bom: BomModel, items: BomItemModel[]): CostBreakdown {
    // Calculate costs by category
    const materialCost = items
      .filter((item) => item.category === 'material')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const laborCost = items
      .filter((item) => item.category === 'labor')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const equipmentCost = items
      .filter((item) => item.category === 'equipment')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const subcontractorCost = items
      .filter((item) => item.category === 'subcontractor')
      .reduce((sum, item) => sum + item.totalCost, 0);

    const totalEstimated = materialCost + laborCost + equipmentCost + subcontractorCost;

    // Calculate contingency and profit
    const contingencyAmount = (totalEstimated * bom.contingency) / 100;
    const profitAmount = (totalEstimated * bom.profitMargin) / 100;
    const grandTotal = totalEstimated + contingencyAmount + profitAmount;

    // Calculate total actual cost
    const totalActual = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    return {
      totalEstimated,
      totalActual,
      materialCost,
      laborCost,
      equipmentCost,
      subcontractorCost,
      contingencyAmount,
      profitAmount,
      grandTotal,
    };
  }

  /**
   * Calculate category-wise breakdown with percentages
   */
  calculateCategoryBreakdown(items: BomItemModel[]): CategoryBreakdown[] {
    const categories = ['material', 'labor', 'equipment', 'subcontractor'];
    const totalEstimated = items.reduce((sum, item) => sum + item.totalCost, 0);

    return categories.map((category) => {
      const categoryItems = items.filter((item) => item.category === category);
      const estimatedCost = categoryItems.reduce((sum, item) => sum + item.totalCost, 0);
      const actualCost = categoryItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
      const percentage = totalEstimated > 0 ? (estimatedCost / totalEstimated) * 100 : 0;
      const variance = estimatedCost - actualCost;
      const variancePercentage = estimatedCost > 0 ? (variance / estimatedCost) * 100 : 0;

      return {
        category,
        estimatedCost,
        actualCost,
        percentage,
        variance,
        variancePercentage,
      };
    });
  }

  /**
   * Calculate budget utilization for execution BOMs
   */
  calculateBudgetUtilization(bom: BomModel, items: BomItemModel[]): BudgetUtilization {
    const budget = bom.contractValue || bom.totalEstimatedCost;
    const spent = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);
    const remaining = budget - spent;
    const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0;

    // Determine status based on utilization
    let status: 'on-track' | 'warning' | 'over-budget' = 'on-track';
    if (budgetUtilization >= 100) {
      status = 'over-budget'; // Red
    } else if (budgetUtilization >= 90) {
      status = 'warning'; // Yellow
    } else {
      status = 'on-track'; // Green
    }

    return {
      budgetUtilization,
      remaining,
      spent,
      status,
    };
  }

  /**
   * Calculate Cost Performance Index and related metrics
   */
  calculateCostPerformance(bom: BomModel, items: BomItemModel[]): CostPerformance {
    const budget = bom.contractValue || bom.totalEstimatedCost;
    const actualCost = items.reduce((sum, item) => sum + (item.actualCost || 0), 0);

    // Cost Performance Index: CPI = Budget / Actual Cost
    // CPI > 1 = Under budget (good)
    // CPI = 1 = On budget
    // CPI < 1 = Over budget (bad)
    const costPerformanceIndex = actualCost > 0 ? budget / actualCost : 1;

    // Cost Variance: CV = Budget - Actual Cost
    // Positive = Under budget (good)
    // Negative = Over budget (bad)
    const costVariance = budget - actualCost;

    // Cost Variance Percentage
    const costVariancePercentage = budget > 0 ? (costVariance / budget) * 100 : 0;

    // Estimate at Completion: EAC = Budget / CPI
    // Projected final cost based on current performance
    const estimateAtCompletion = costPerformanceIndex > 0 ? budget / costPerformanceIndex : budget;

    // Variance at Completion: VAC = Budget - EAC
    // Projected final variance
    const varianceAtCompletion = budget - estimateAtCompletion;

    return {
      costPerformanceIndex,
      costVariance,
      costVariancePercentage,
      estimateAtCompletion,
      varianceAtCompletion,
    };
  }

  /**
   * Calculate phase-wise breakdown
   */
  calculatePhaseBreakdown(items: BomItemModel[]): PhaseBreakdown[] {
    const phaseMap = new Map<string, PhaseBreakdown>();
    const totalEstimated = items.reduce((sum, item) => sum + item.totalCost, 0);

    items.forEach((item) => {
      const phase = item.phase || 'Unassigned';

      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, {
          phase,
          estimatedCost: 0,
          actualCost: 0,
          percentage: 0,
          itemCount: 0,
        });
      }

      const phaseData = phaseMap.get(phase)!;
      phaseData.estimatedCost += item.totalCost;
      phaseData.actualCost += item.actualCost || 0;
      phaseData.itemCount += 1;
    });

    // Calculate percentages
    const result = Array.from(phaseMap.values()).map((phaseData) => ({
      ...phaseData,
      percentage: totalEstimated > 0 ? (phaseData.estimatedCost / totalEstimated) * 100 : 0,
    }));

    // Sort by estimated cost (descending)
    return result.sort((a, b) => b.estimatedCost - a.estimatedCost);
  }

  /**
   * Get budget status color
   */
  getBudgetStatusColor(utilization: number): string {
    if (utilization >= 100) return COLORS.ERROR; // Red - Over budget
    if (utilization >= 90) return COLORS.WARNING; // Orange - Warning
    if (utilization >= 80) return '#FFC107'; // Yellow - Caution
    return COLORS.SUCCESS; // Green - On track
  }

  /**
   * Get budget status label
   */
  getBudgetStatusLabel(utilization: number): string {
    if (utilization >= 100) return 'Over Budget';
    if (utilization >= 90) return 'Critical';
    if (utilization >= 80) return 'Warning';
    return 'On Track';
  }

  /**
   * Format currency for display (Indian Rupees)
   */
  formatCurrency(amount: number, decimals: number = 0): string {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Calculate cost summary for dashboard
   */
  calculateCostSummary(bom: BomModel, items: BomItemModel[]) {
    const breakdown = this.calculateCostBreakdown(bom, items);
    const categoryBreakdown = this.calculateCategoryBreakdown(items);

    let budgetUtilization: BudgetUtilization | null = null;
    let costPerformance: CostPerformance | null = null;

    // Calculate performance metrics for execution BOMs
    if (bom.type === 'execution') {
      budgetUtilization = this.calculateBudgetUtilization(bom, items);
      costPerformance = this.calculateCostPerformance(bom, items);
    }

    const phaseBreakdown = this.calculatePhaseBreakdown(items);

    return {
      breakdown,
      categoryBreakdown,
      budgetUtilization,
      costPerformance,
      phaseBreakdown,
      itemCount: items.length,
      totalEstimated: breakdown.totalEstimated,
      totalActual: breakdown.totalActual,
      grandTotal: breakdown.grandTotal,
    };
  }

  /**
   * Validate item cost calculation
   */
  validateItemCost(quantity: number, unitCost: number): {
    isValid: boolean;
    totalCost: number;
    error?: string
  } {
    if (quantity < 0) {
      return { isValid: false, totalCost: 0, error: 'Quantity cannot be negative' };
    }
    if (unitCost < 0) {
      return { isValid: false, totalCost: 0, error: 'Unit cost cannot be negative' };
    }

    const totalCost = quantity * unitCost;
    return { isValid: true, totalCost };
  }

  /**
   * Calculate recommended contingency based on project risk
   */
  getRecommendedContingency(totalEstimated: number, riskLevel: 'low' | 'medium' | 'high'): number {
    const contingencyMap = {
      low: 5,      // 5% for low risk
      medium: 10,  // 10% for medium risk
      high: 15,    // 15% for high risk
    };
    return contingencyMap[riskLevel];
  }

  /**
   * Calculate recommended profit margin based on project type
   */
  getRecommendedProfitMargin(projectType: 'government' | 'private' | 'infrastructure'): number {
    const profitMap = {
      government: 8,      // 8% for government projects
      private: 12,        // 12% for private projects
      infrastructure: 10, // 10% for infrastructure projects
    };
    return profitMap[projectType];
  }
}

// Export singleton instance
export default new BomCalculatorService();
