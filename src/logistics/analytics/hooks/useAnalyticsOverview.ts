/**
 * useAnalyticsOverview Hook
 *
 * Manages analytics summary and overview data
 * Phase 2: Data Hooks
 */

import { useState, useEffect } from 'react';
import {
  PredictiveAnalyticsService,
  AnalyticsSummary,
  DemandForecast,
  LeadTimePrediction,
  CostTrendAnalysis,
  ConsumptionPattern,
  PerformanceBenchmark,
} from '../../../services/PredictiveAnalyticsService';
import { logger } from '../../../services/LoggingService';

export const useAnalyticsOverview = (
  demandForecasts: DemandForecast[],
  leadTimePredictions: LeadTimePrediction[],
  costTrends: CostTrendAnalysis[],
  consumptionPatterns: ConsumptionPattern[],
  performanceBenchmarks: PerformanceBenchmark[]
) => {
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateSummary();
  }, [demandForecasts, leadTimePredictions, costTrends, consumptionPatterns, performanceBenchmarks]);

  const generateSummary = () => {
    try {
      setLoading(true);

      if (
        demandForecasts.length === 0 &&
        leadTimePredictions.length === 0 &&
        costTrends.length === 0 &&
        consumptionPatterns.length === 0 &&
        performanceBenchmarks.length === 0
      ) {
        setAnalyticsSummary(null);
        return;
      }

      const summary = PredictiveAnalyticsService.generateAnalyticsSummary(
        demandForecasts,
        leadTimePredictions,
        costTrends,
        consumptionPatterns,
        performanceBenchmarks
      );

      setAnalyticsSummary(summary);
      logger.debug('[useAnalyticsOverview] Generated analytics summary', { healthScore: summary.healthScore });
    } catch (error) {
      logger.error('[useAnalyticsOverview] Error generating summary', error);
      setAnalyticsSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    generateSummary();
  };

  return {
    analyticsSummary,
    loading,
    refresh,
  };
};
