import { CATEGORIES } from './reportConstants';

export const calculateBudgetVariance = (budgets: any[], costs: any[]) => {
  return CATEGORIES.map((category) => {
    const allocated = budgets
      .filter((b: any) => b.category === category)
      .reduce((sum, b: any) => sum + b.allocatedAmount, 0);

    const spent = costs
      .filter((c: any) => c.category === category)
      .reduce((sum, c: any) => sum + c.amount, 0);

    return {
      category,
      allocated,
      spent,
      variance: allocated - spent,
    };
  });
};

export const calculateCostDistribution = (costs: any[]) => {
  const totalCosts = costs.reduce((sum, c: any) => sum + c.amount, 0);

  return CATEGORIES.map((category) => {
    const amount = costs
      .filter((c: any) => c.category === category)
      .reduce((sum, c: any) => sum + c.amount, 0);

    return {
      category,
      amount,
      percentage: totalCosts > 0 ? (amount / totalCosts) * 100 : 0,
    };
  });
};

export const calculateInvoicesSummary = (invoices: any[]) => {
  const today = Date.now();

  return {
    total: invoices.length,
    paid: invoices.filter((inv: any) => inv.paymentStatus === 'paid').length,
    pending: invoices.filter((inv: any) => inv.paymentStatus === 'pending').length,
    overdue: invoices.filter((inv: any) => {
      const dueDate = inv.invoiceDate + (30 * 24 * 60 * 60 * 1000);
      return inv.paymentStatus === 'pending' && today > dueDate;
    }).length,
  };
};

export const calculateCashFlow = (invoices: any[], costs: any[]) => {
  const totalRevenue = invoices
    .filter((inv: any) => inv.paymentStatus === 'paid')
    .reduce((sum, inv: any) => sum + inv.amount, 0);

  const totalCosts = costs.reduce((sum, c: any) => sum + c.amount, 0);

  return {
    totalRevenue,
    totalCosts,
    netCashFlow: totalRevenue - totalCosts,
  };
};

export const calculateProfitability = (budgets: any[], costs: any[]) => {
  const totalBudget = budgets.reduce((sum, b: any) => sum + b.allocatedAmount, 0);
  const totalSpent = costs.reduce((sum, c: any) => sum + c.amount, 0);
  const remaining = totalBudget - totalSpent;
  const profitMargin = totalBudget > 0 ? ((remaining / totalBudget) * 100) : 0;

  return {
    totalBudget,
    totalSpent,
    remaining,
    profitMargin,
  };
};
