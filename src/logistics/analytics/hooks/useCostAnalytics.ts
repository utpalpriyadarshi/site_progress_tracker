/**
 * useCostAnalytics Hook
 *
 * Manages cost trend analysis and historical cost data
 * Phase 2: Data Hooks
 */

import { useState, useEffect } from 'react';
import {
  PredictiveAnalyticsService,
  CostTrendAnalysis,
} from '../../../services/PredictiveAnalyticsService';
import { generateMockCostData } from '../utils/analyticsConstants';
import { logger } from '../../../services/LoggingService';

export const useCostAnalytics = (projectId: string | null) => {
  const [costTrends, setCostTrends] = useState<CostTrendAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadCostData();
    }
  }, [projectId]);

  const loadCostData = () => {
    try {
      setLoading(true);

      const costData = generateMockCostData();

      // Generate cost trend analysis for different materials
      const trends: CostTrendAnalysis[] = [
        PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          costData,
          90
        ),
        PredictiveAnalyticsService.analyzeCostTrends(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          costData.map(d => ({ ...d, value: d.value * 1.2 })),
          90
        ),
      ];
      setCostTrends(trends);

      logger.debug('[useCostAnalytics] Loaded cost analytics', { trends: trends.length });
    } catch (error) {
      logger.error('[useCostAnalytics] Error loading cost data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadCostData();
  };

  return {
    costTrends,
    loading,
    refresh,
  };
};
