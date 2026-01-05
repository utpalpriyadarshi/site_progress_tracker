/**
 * Cost Type Definitions
 * Shared types for cost-related components
 */

export interface Cost {
  id: string;
  projectId: string;
  poId?: string;
  category: 'labor' | 'materials' | 'equipment' | 'subcontractors';
  amount: number;
  description: string;
  costDate: number;
  createdBy: string;
  createdAt: number;
}

export type CostCategory = 'labor' | 'materials' | 'equipment' | 'subcontractors';

export interface CostBreakdownItem {
  category: string;
  totalCost: number;
  percentage: number;
  count: number;
  avgCost: number;
  budgetAllocated?: number;
  variance?: number;
}

export interface CostDistribution {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface CostBreakdownTableProps {
  costs: Cost[];
  budgets?: { category: string; allocated: number }[];
  groupBy?: 'category' | 'date' | 'poId';
  showBudgetComparison?: boolean;
  showTrends?: boolean;
  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  onCostPress?: (cost: Cost) => void;
  onCategoryPress?: (category: string) => void;
}

export interface CostCardProps {
  cost: Cost;
  budgetAmount?: number;
  totalSpent?: number;
  onPress?: (cost: Cost) => void;
  onEdit?: (cost: Cost) => void;
  onDelete?: (cost: Cost) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}
