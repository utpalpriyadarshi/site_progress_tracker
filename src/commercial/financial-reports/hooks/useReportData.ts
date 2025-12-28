import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import {
  calculateBudgetVariance,
  calculateCostDistribution,
  calculateInvoicesSummary,
  calculateCashFlow,
  calculateProfitability,
} from '../utils';

export interface ReportData {
  budgetByCategory: Array<{ category: string; allocated: number; spent: number; variance: number }>;
  costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
  invoicesSummary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  cashFlow: {
    totalRevenue: number;
    totalCosts: number;
    netCashFlow: number;
  };
  profitability: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    profitMargin: number;
  };
}

export const useReportData = (
  projectId: string | null,
  startDate: Date | null,
  endDate: Date | null
) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const loadReportData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Reports] Loading report data for project:', projectId);

      // Load budgets
      const budgetsCollection = database.collections.get('budgets');
      const budgets = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Load costs with date filtering
      const costsCollection = database.collections.get('costs');
      let costsQuery = costsCollection.query(Q.where('project_id', projectId));

      if (startDate && endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('cost_date', Q.gte(startDate.getTime())),
            Q.where('cost_date', Q.lte(endDate.getTime()))
          )
        );
      } else if (startDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.gte(startDate.getTime()))
        );
      } else if (endDate) {
        costsQuery = costsCollection.query(
          Q.where('project_id', projectId),
          Q.where('cost_date', Q.lte(endDate.getTime()))
        );
      }

      const costs = await costsQuery.fetch();

      // Load invoices with date filtering
      const invoicesCollection = database.collections.get('invoices');
      let invoicesQuery = invoicesCollection.query(Q.where('project_id', projectId));

      if (startDate && endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.and(
            Q.where('invoice_date', Q.gte(startDate.getTime())),
            Q.where('invoice_date', Q.lte(endDate.getTime()))
          )
        );
      } else if (startDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.gte(startDate.getTime()))
        );
      } else if (endDate) {
        invoicesQuery = invoicesCollection.query(
          Q.where('project_id', projectId),
          Q.where('invoice_date', Q.lte(endDate.getTime()))
        );
      }

      const invoices = await invoicesQuery.fetch();

      // Calculate all report sections
      const budgetByCategory = calculateBudgetVariance(budgets, costs);
      const costsByCategory = calculateCostDistribution(costs);
      const invoicesSummary = calculateInvoicesSummary(invoices);
      const cashFlow = calculateCashFlow(invoices, costs);
      const profitability = calculateProfitability(budgets, costs);

      setReportData({
        budgetByCategory,
        costsByCategory,
        invoicesSummary,
        cashFlow,
        profitability,
      });

      logger.debug('[Reports] Report data loaded successfully');
    } catch (error) {
      logger.error('[Reports] Error loading report data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [projectId, startDate, endDate]);

  return {
    loading,
    reportData,
    loadReportData,
  };
};
