/**
 * usePerformanceAnalytics Hook
 *
 * Manages performance benchmarks and consumption patterns
 * Phase 2: Data Hooks
 */

import { useState, useEffect } from 'react';
import {
  PredictiveAnalyticsService,
  ConsumptionPattern,
  PerformanceBenchmark,
} from '../../../services/PredictiveAnalyticsService';
import { generateMockHistoricalData } from '../utils/analyticsConstants';
import { logger } from '../../../services/LoggingService';

export const usePerformanceAnalytics = (projectId: string | null) => {
  const [consumptionPatterns, setConsumptionPatterns] = useState<ConsumptionPattern[]>([]);
  const [performanceBenchmarks, setPerformanceBenchmarks] = useState<PerformanceBenchmark[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadPerformanceData();
    }
  }, [projectId]);

  const loadPerformanceData = () => {
    try {
      setLoading(true);

      const historicalData = generateMockHistoricalData();

      // Generate consumption patterns
      const patterns: ConsumptionPattern[] = [
        PredictiveAnalyticsService.analyzeConsumptionPattern(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          historicalData,
          2,
          1
        ),
        PredictiveAnalyticsService.analyzeConsumptionPattern(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          historicalData.map(d => ({ ...d, value: d.value * 0.8 })),
          1,
          2
        ),
      ];
      setConsumptionPatterns(patterns);

      // Generate performance benchmarks
      const benchmarks: PerformanceBenchmark[] = [
        PredictiveAnalyticsService.benchmarkPerformance(
          'Inventory',
          'inventory_turnover',
          8.5,
          'times/year',
          10
        ),
        PredictiveAnalyticsService.benchmarkPerformance(
          'Delivery',
          'order_fulfillment_time',
          4.2,
          'days',
          3
        ),
        PredictiveAnalyticsService.benchmarkPerformance(
          'Supplier',
          'supplier_reliability',
          92,
          'percentage',
          95
        ),
      ];
      setPerformanceBenchmarks(benchmarks);

      logger.debug('[usePerformanceAnalytics] Loaded performance analytics', {
        patterns: patterns.length,
        benchmarks: benchmarks.length,
      });
    } catch (error) {
      logger.error('[usePerformanceAnalytics] Error loading performance data', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadPerformanceData();
  };

  return {
    consumptionPatterns,
    performanceBenchmarks,
    loading,
    refresh,
  };
};
