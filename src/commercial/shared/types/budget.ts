/**
 * Budget Type Definitions
 * Shared types for budget-related components
 */

export interface Budget {
  id: string;
  projectId: string;
  category: 'labor' | 'materials' | 'equipment' | 'subcontractors';
  allocatedAmount: number;
  actualAmount: number;
  variance: number;
  percentageUsed: number;
  createdBy: string;
  createdAt: number;
}

export type BudgetCategory = 'labor' | 'materials' | 'equipment' | 'subcontractors';

export interface BudgetWithActual extends Budget {
  actualAmount: number;
  variance: number;
  percentageUsed: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
}

export interface CategoryBreakdown {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface BudgetSummaryChartProps {
  budgetSummary: BudgetSummary;
  categoryBreakdown: CategoryBreakdown[];
  variant?: 'bar' | 'pie' | 'combined';
  showLegend?: boolean;
  showPercentages?: boolean;
  height?: number;
}

export interface BudgetCardProps {
  budget: BudgetWithActual;
  onPress?: (budget: BudgetWithActual) => void;
  onEdit?: (budget: BudgetWithActual) => void;
  onDelete?: (budget: BudgetWithActual) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}
