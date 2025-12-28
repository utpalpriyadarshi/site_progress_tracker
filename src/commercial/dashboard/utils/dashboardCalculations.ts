/**
 * Dashboard Calculations
 * Business logic for dashboard metrics and alerts
 */

import {
  BUDGET_CATEGORIES,
  OVERDUE_DAYS,
  BUDGET_WARNING_THRESHOLD,
  BUDGET_EXCEEDED_THRESHOLD,
  getCategoryLabel,
} from './dashboardConstants';

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
}

export interface CategoryBreakdownItem {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface InvoicesSummary {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  totalPending: number;
  totalPaid: number;
}

export interface CashFlow {
  revenue: number;
  costs: number;
  net: number;
}

export interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export const calculateBudgetSummary = (budgets: any[], costs: any[]): BudgetSummary => {
  const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = costs.reduce((sum, c) => sum + c.amount, 0);
  const remaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    totalBudget,
    totalSpent,
    remaining,
    percentageUsed,
  };
};

export const calculateCategoryBreakdown = (
  budgets: any[],
  costs: any[]
): CategoryBreakdownItem[] => {
  return BUDGET_CATEGORIES.map((category) => {
    const budget = budgets
      .filter((b) => b.category === category)
      .reduce((sum, b) => sum + b.allocatedAmount, 0);

    const spent = costs
      .filter((c) => c.category === category)
      .reduce((sum, c) => sum + c.amount, 0);

    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOverBudget = spent > budget;

    return {
      category,
      budget,
      spent,
      percentage,
      isOverBudget,
    };
  });
};

export const calculateInvoicesSummary = (invoices: any[]): InvoicesSummary => {
  const today = Date.now();

  const totalPending = invoices
    .filter((inv) => inv.paymentStatus === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter((inv) => inv.paymentStatus === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueInvoices = invoices.filter((inv) => {
    const dueDate = inv.invoiceDate + OVERDUE_DAYS * 24 * 60 * 60 * 1000;
    return inv.paymentStatus === 'pending' && today > dueDate;
  });

  return {
    total: invoices.length,
    pending: invoices.filter((inv) => inv.paymentStatus === 'pending').length,
    paid: invoices.filter((inv) => inv.paymentStatus === 'paid').length,
    overdue: overdueInvoices.length,
    totalPending,
    totalPaid,
  };
};

export const calculateCashFlow = (totalPaid: number, totalSpent: number): CashFlow => {
  return {
    revenue: totalPaid,
    costs: totalSpent,
    net: totalPaid - totalSpent,
  };
};

export const generateAlerts = (
  categoryBreakdown: CategoryBreakdownItem[],
  overdueCount: number,
  percentageUsed: number,
  remaining: number,
  cashFlowNet: number
): Alert[] => {
  const alerts: Alert[] = [];

  // Over-budget alerts
  categoryBreakdown.forEach((cat) => {
    if (cat.isOverBudget && cat.budget > 0) {
      alerts.push({
        type: 'danger',
        message: `${getCategoryLabel(cat.category)} is over budget by $${(cat.spent - cat.budget).toLocaleString()}`,
      });
    }
  });

  // Overdue invoices alert
  if (overdueCount > 0) {
    alerts.push({
      type: 'warning',
      message: `${overdueCount} invoice(s) are overdue`,
    });
  }

  // Budget warning (>80% used)
  if (percentageUsed > BUDGET_WARNING_THRESHOLD && percentageUsed <= BUDGET_EXCEEDED_THRESHOLD) {
    alerts.push({
      type: 'warning',
      message: `Project budget is ${percentageUsed.toFixed(0)}% utilized`,
    });
  }

  // Budget exceeded
  if (percentageUsed > BUDGET_EXCEEDED_THRESHOLD) {
    alerts.push({
      type: 'danger',
      message: `Project budget exceeded by $${Math.abs(remaining).toLocaleString()}`,
    });
  }

  // Positive cash flow
  if (cashFlowNet > 0) {
    alerts.push({
      type: 'info',
      message: `Positive cash flow: $${cashFlowNet.toLocaleString()}`,
    });
  }

  return alerts;
};
