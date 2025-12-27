/**
 * useDemandAnalytics Hook
 *
 * Manages demand forecasts and lead time predictions
 * Phase 2: Data Hooks
 */

import { useState, useEffect } from 'react';
import {
  PredictiveAnalyticsService,
  DemandForecast,
  LeadTimePrediction,
} from '../../../services/PredictiveAnalyticsService';
import {
  generateMockHistoricalData,
  mockProjectDemand,
  mockSupplierLeadTimes,
} from '../utils/analyticsConstants';
import { logger } from '../../../services/LoggingService';

export const useDemandAnalytics = (projectId: string | null) => {
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [leadTimePredictions, setLeadTimePredictions] = useState<LeadTimePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadDemandData();
    }
  }, [projectId]);

  const loadDemandData = () => {
    try {
      setLoading(true);

      const historicalData = generateMockHistoricalData();

      // Generate demand forecasts for different materials
      const forecasts: DemandForecast[] = [
        PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          historicalData,
          mockProjectDemand,
          90
        ),
        PredictiveAnalyticsService.forecastDemand(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          historicalData.map(d => ({ ...d, value: d.value * 1.5 })),
          [],
          90
        ),
      ];
      setDemandForecasts(forecasts);

      // Generate lead time predictions
      const leadTimes: LeadTimePrediction[] = [
        PredictiveAnalyticsService.predictLeadTime(
          's1',
          'ABC Materials Inc',
          'Construction Materials',
          mockSupplierLeadTimes.supplier1
        ),
        PredictiveAnalyticsService.predictLeadTime(
          's2',
          'XYZ Supplies Co',
          'Electrical',
          mockSupplierLeadTimes.supplier2
        ),
      ];
      setLeadTimePredictions(leadTimes);

      logger.debug('[useDemandAnalytics] Loaded demand analytics', {
        forecasts: forecasts.length,
        leadTimes: leadTimes.length,
      });
    } catch (error) {
      logger.error('[useDemandAnalytics] Error loading demand data', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadDemandData();
  };

  return {
    demandForecasts,
    leadTimePredictions,
    loading,
    refresh,
  };
};
