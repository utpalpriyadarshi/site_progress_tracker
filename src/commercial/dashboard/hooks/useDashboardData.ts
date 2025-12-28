import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';
import {
  BudgetSummary,
  CategoryBreakdownItem,
  InvoicesSummary,
  CashFlow,
  Alert as DashboardAlert,
  calculateBudgetSummary,
  calculateCategoryBreakdown,
  calculateInvoicesSummary,
  calculateCashFlow,
  generateAlerts,
} from '../utils';

export interface RecentCost {
  description: string;
  amount: number;
  date: number;
  category: string;
}

export interface DashboardData {
  budgetSummary: BudgetSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  recentCosts: RecentCost[];
  invoicesSummary: InvoicesSummary;
  cashFlow: CashFlow;
  alerts: DashboardAlert[];
}

export const useDashboardData = (projectId: string | null) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Dashboard] Loading dashboard data for project:', projectId);

      // Load all data in parallel
      const budgetsCollection = database.collections.get('budgets');
      const costsCollection = database.collections.get('costs');
      const invoicesCollection = database.collections.get('invoices');

      const [budgets, costs, invoices] = await Promise.all([
        budgetsCollection.query(Q.where('project_id', projectId)).fetch(),
        costsCollection
          .query(Q.where('project_id', projectId), Q.sortBy('cost_date', Q.desc))
          .fetch(),
        invoicesCollection.query(Q.where('project_id', projectId)).fetch(),
      ]);

      // Calculate all metrics
      const budgetSummary = calculateBudgetSummary(budgets, costs);
      const categoryBreakdown = calculateCategoryBreakdown(budgets, costs);
      const invoicesSummary = calculateInvoicesSummary(invoices);
      const cashFlow = calculateCashFlow(invoicesSummary.totalPaid, budgetSummary.totalSpent);

      // Get recent costs (last 5)
      const recentCosts: RecentCost[] = costs.slice(0, 5).map((cost: any) => ({
        description: cost.description,
        amount: cost.amount,
        date: cost.costDate,
        category: cost.category,
      }));

      // Generate alerts
      const alerts = generateAlerts(
        categoryBreakdown,
        invoicesSummary.overdue,
        budgetSummary.percentageUsed,
        budgetSummary.remaining,
        cashFlow.net
      );

      setDashboardData({
        budgetSummary,
        categoryBreakdown,
        recentCosts,
        invoicesSummary,
        cashFlow,
        alerts,
      });

      logger.debug('[Dashboard] Dashboard data loaded successfully');
    } catch (error) {
      logger.error('[Dashboard] Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    dashboardData,
    loading,
    loadDashboardData,
  };
};
