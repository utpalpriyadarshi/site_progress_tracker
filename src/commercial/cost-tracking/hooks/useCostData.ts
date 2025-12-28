import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';

export interface Cost {
  id: string;
  projectId: string;
  poId?: string;
  category: string;
  amount: number;
  description: string;
  costDate: number;
  createdBy: string;
  createdAt: number;
}

export interface BudgetInfo {
  category: string;
  allocated: number;
}

export const useCostData = (projectId: string | null) => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [budgets, setBudgets] = useState<BudgetInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCosts = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Cost] Loading costs for project:', projectId);

      const costsCollection = database.collections.get('costs');
      const costsData = await costsCollection
        .query(Q.where('project_id', projectId), Q.sortBy('cost_date', Q.desc))
        .fetch();

      const costsArray = costsData.map((cost: any) => ({
        id: cost.id,
        projectId: cost.projectId,
        poId: cost.poId,
        category: cost.category,
        amount: cost.amount,
        description: cost.description,
        costDate: cost.costDate,
        createdBy: cost.createdBy,
        createdAt: cost.createdAt,
      }));

      // Load budgets for comparison
      const budgetsCollection = database.collections.get('budgets');
      const budgetsData = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const budgetsArray = budgetsData.map((budget: any) => ({
        category: budget.category,
        allocated: budget.allocatedAmount,
      }));

      logger.debug('[Cost] Loaded costs:', costsArray.length);
      setCosts(costsArray);
      setBudgets(budgetsArray);
    } catch (error) {
      logger.error('[Cost] Error loading costs:', error);
      Alert.alert('Error', 'Failed to load costs');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const getBudgetForCategory = useCallback(
    (category: string) => {
      const budget = budgets.find((b) => b.category === category);
      return budget ? budget.allocated : 0;
    },
    [budgets]
  );

  const getTotalSpentForCategory = useCallback(
    (category: string) => {
      return costs
        .filter((c) => c.category === category)
        .reduce((sum, c) => sum + c.amount, 0);
    },
    [costs]
  );

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const totalBudgets = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalVariance = totalBudgets - totalCosts;

  return {
    costs,
    budgets,
    loading,
    loadCosts,
    getBudgetForCategory,
    getTotalSpentForCategory,
    totalCosts,
    totalBudgets,
    totalVariance,
  };
};
