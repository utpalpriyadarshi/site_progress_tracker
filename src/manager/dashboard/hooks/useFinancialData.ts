/**
 * useFinancialData Hook
 *
 * Fetches financial summary data including budget overview,
 * profitability metrics, and BOM costs.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useManagerContext } from '../../context/ManagerContext';
import { logger } from '../../../services/LoggingService';

// ==================== Types ====================

export interface FinancialData {
  projectBudget: number;
  totalCommitted: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUtilization: number;
  commitmentPercentage: number;
  totalBomCost: number;
  bomItemsCount: number;
  averageBomItemCost: number;
  poValueTotal: number;
  poValueDelivered: number;
  poValuePending: number;
  varianceAmount: number;
  variancePercentage: number;
  costStatus: 'under_budget' | 'on_budget' | 'over_budget';
}

export interface UseFinancialDataResult {
  data: FinancialData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useFinancialData(): UseFinancialDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!projectId) {
      if (!silent) { setData(null); setLoading(false); }
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      // Get project for budget info
      const project = await database.collections.get('projects').find(projectId);
      const projectBudget = (project as any)?.budget || 0;

      // Get all purchase orders for this project
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      // Calculate PO metrics
      let totalCommitted = 0;
      let totalSpent = 0;
      let poValueDelivered = 0;
      let poValuePending = 0;

      purchaseOrders.forEach((po: any) => {
        const poValue = po.poValue || 0;
        totalCommitted += poValue;

        if (po.status === 'delivered' || po.status === 'closed') {
          totalSpent += poValue;
          poValueDelivered += poValue;
        } else {
          poValuePending += poValue;
        }
      });

      // Get all BOMs for this project
      const boms = await database.collections
        .get('boms')
        .query(Q.where('project_id', projectId))
        .fetch();

      const bomIds = boms.map(b => b.id);

      // Get all BOM items
      let totalBomCost = 0;
      let bomItemsCount = 0;

      if (bomIds.length > 0) {
        const bomItems = await database.collections
          .get('bom_items')
          .query(Q.where('bom_id', Q.oneOf(bomIds)))
          .fetch();

        bomItemsCount = bomItems.length;

        bomItems.forEach((item: any) => {
          const quantity = item.quantity || 0;
          const unitCost = item.unitCost || 0;
          totalBomCost += quantity * unitCost;
        });
      }

      // Calculate derived metrics
      const remainingBudget = projectBudget - totalCommitted;
      const budgetUtilization = projectBudget > 0
        ? Math.round((totalSpent / projectBudget) * 1000) / 10
        : 0;
      const commitmentPercentage = projectBudget > 0
        ? Math.round((totalCommitted / projectBudget) * 1000) / 10
        : 0;
      const averageBomItemCost = bomItemsCount > 0
        ? Math.round(totalBomCost / bomItemsCount)
        : 0;

      // Calculate variance
      const varianceAmount = projectBudget - totalCommitted;
      const variancePercentage = projectBudget > 0
        ? Math.round((varianceAmount / projectBudget) * 1000) / 10
        : 0;

      // Determine cost status
      let costStatus: 'under_budget' | 'on_budget' | 'over_budget' = 'on_budget';
      if (commitmentPercentage > 100) {
        costStatus = 'over_budget';
      } else if (commitmentPercentage < 90) {
        costStatus = 'under_budget';
      }

      setData({
        projectBudget,
        totalCommitted,
        totalSpent,
        remainingBudget,
        budgetUtilization,
        commitmentPercentage,
        totalBomCost,
        bomItemsCount,
        averageBomItemCost,
        poValueTotal: totalCommitted,
        poValueDelivered,
        poValuePending,
        varianceAmount,
        variancePercentage,
        costStatus,
      });
    } catch (err) {
      logger.error('[useFinancialData] Error fetching data', err as Error);
      if (!silent) setError('Failed to load financial data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['purchase_orders', 'boms', 'bom_items', 'projects'])
      .subscribe(() => { fetchData(true); });
    return () => subscription.unsubscribe();
  }, [projectId, fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useFinancialData;
