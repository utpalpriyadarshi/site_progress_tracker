import { formatCurrencySimple } from '../../../utils/currencyFormatter';

// Re-export centralized currency formatter
export const formatCurrency = (amount: number): string => {
  return formatCurrencySimple(amount);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const calculateVariance = (budget: number, spent: number): number => {
  return budget - spent;
};

export const isOverBudget = (budget: number, spent: number): boolean => {
  return spent > budget;
};
