/**
import { logger } from '../services/LoggingService';
 * LogisticsAnalyticsScreen - Week 6
 *
 * Advanced analytics and optimization dashboard with:
 * - Predictive analytics (demand forecasting, lead time prediction)
 * - Cost optimization recommendations
 * - Performance benchmarking
 * - Comprehensive reporting
 */

import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  PredictiveAnalyticsService,
  type DemandForecast,
  type LeadTimePrediction,
  type CostTrendAnalysis,
  type ConsumptionPattern,
  type PerformanceBenchmark,
  type AnalyticsSummary,
  type HistoricalDataPoint,
  type ProjectDemandFactor,
} from '../services/PredictiveAnalyticsService';
import {
  CostOptimizationService,
  type CostOptimizationResult,
  type ProcurementBundle,
  type SupplierNegotiationAnalysis,
  type TransportationOptimization,
  type TCOAnalysis,
  type StorageOptimization,
  type CostBreakdown,
  type VolumeDiscount,
} from '../services/CostOptimizationService';
import { useLogistics } from './context/LogisticsContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const { width } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'overview' | 'demand' | 'costs' | 'performance' | 'optimization';
type ReportType = 'executive' | 'operational' | 'cost_analysis' | 'compliance';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockHistoricalData: HistoricalDataPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  return {
    date: date.toISOString(),
    value: 100 + Math.sin(i / 10) * 20 + Math.random() * 10,
  };
});

const mockCostData: HistoricalDataPoint[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (90 - i));
  return {
    date: date.toISOString(),
    value: 500 + (i / 90) * 50 + Math.random() * 20, // Increasing trend
  };
});

const mockProjectDemand: ProjectDemandFactor[] = [
  {
    projectId: 'p1',
    projectName: 'Office Tower Phase 2',
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    requiredQuantity: 500,
    probability: 90,
    impact: 450,
  },
  {
    projectId: 'p2',
    projectName: 'Industrial Complex',
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    requiredQuantity: 800,
    probability: 75,
    impact: 600,
  },
];

const mockVolumeDiscounts: VolumeDiscount[] = [
  { tier: 1, minQuantity: 0, maxQuantity: 100, discountPercentage: 0, discountedPrice: 100 },
  { tier: 2, minQuantity: 100, maxQuantity: 500, discountPercentage: 5, discountedPrice: 95 },
  { tier: 3, minQuantity: 500, maxQuantity: 1000, discountPercentage: 10, discountedPrice: 90 },
  { tier: 4, minQuantity: 1000, discountPercentage: 15, discountedPrice: 85 },
];

const mockCurrentCosts: CostBreakdown = {
  totalCost: 250000,
  currency: 'USD',
  materialCosts: 180000,
  transportationCosts: 35000,
  storageCosts: 20000,
  administrativeCosts: 10000,
  wasteCosts: 5000,
  fixedCosts: 50000,
  variableCosts: 200000,
  costPercentages: {
    materials: 72,
    transportation: 14,
    storage: 8,
    administrative: 4,
    waste: 2,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const LogisticsAnalyticsScreen: React.FC = () => {
  const { selectedProjectId, projects } = useLogistics();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Analytics data
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [leadTimePredictions, setLeadTimePredictions] = useState<LeadTimePrediction[]>([]);
  const [costTrends, setCostTrends] = useState<CostTrendAnalysis[]>([]);
  const [consumptionPatterns, setConsumptionPatterns] = useState<ConsumptionPattern[]>([]);
  const [performanceBenchmarks, setPerformanceBenchmarks] = useState<PerformanceBenchmark[]>([]);

  // Cost optimization data
  const [costOptimization, setCostOptimization] = useState<CostOptimizationResult | null>(null);
  const [procurementBundles, setProcurementBundles] = useState<ProcurementBundle[]>([]);
  const [supplierNegotiation, setSupplierNegotiation] = useState<SupplierNegotiationAnalysis[]>([]);
  const [transportationOpt, setTransportationOpt] = useState<TransportationOptimization | null>(null);
  const [storageOpt, setStorageOpt] = useState<StorageOptimization | null>(null);

  // Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<string>('');

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedProjectId]);

  const loadAnalyticsData = () => {
    setLoading(true);
    try {
      // Generate demand forecasts
      const forecasts: DemandForecast[] = [
        PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          mockHistoricalData,
          mockProjectDemand,
          90
        ),
        PredictiveAnalyticsService.forecastDemand(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          mockHistoricalData.map(d => ({ ...d, value: d.value * 1.5 })),
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
          [12, 14, 13, 15, 14, 16, 13, 14, 12, 15]
        ),
        PredictiveAnalyticsService.predictLeadTime(
          's2',
          'XYZ Supplies Co',
          'Electrical',
          [7, 8, 9, 7, 10, 8, 7, 9, 8, 7]
        ),
      ];
      setLeadTimePredictions(leadTimes);

      // Generate cost trend analysis
      const costs: CostTrendAnalysis[] = [
        PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          mockCostData,
          90
        ),
        PredictiveAnalyticsService.analyzeCostTrends(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          mockCostData.map(d => ({ ...d, value: d.value * 1.2 })),
          90
        ),
      ];
      setCostTrends(costs);

      // Generate consumption patterns
      const patterns: ConsumptionPattern[] = [
        PredictiveAnalyticsService.analyzeConsumptionPattern(
          'm1',
          'Concrete Mix',
          'Construction Materials',
          mockHistoricalData,
          2,
          1
        ),
        PredictiveAnalyticsService.analyzeConsumptionPattern(
          'm2',
          'Steel Rebar',
          'Structural Materials',
          mockHistoricalData.map(d => ({ ...d, value: d.value * 0.8 })),
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

      // Generate analytics summary
      const summary = PredictiveAnalyticsService.generateAnalyticsSummary(
        forecasts,
        leadTimes,
        costs,
        patterns,
        benchmarks
      );
      setAnalyticsSummary(summary);

      // Cost optimization
      const costOpt = CostOptimizationService.performCostOptimization(
        mockCurrentCosts,
        {},
        {},
        {},
        {}
      );
      setCostOptimization(costOpt);

      // Procurement bundles
      const bundles = CostOptimizationService.optimizeProcurementBundles(
        [
          {
            materialId: 'm1',
            materialName: 'Concrete Mix',
            quantity: 250,
            unit: 'm³',
            unitCost: 150,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
          {
            materialId: 'm2',
            materialName: 'Steel Rebar',
            quantity: 300,
            unit: 'tons',
            unitCost: 800,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
          {
            materialId: 'm3',
            materialName: 'Cement Bags',
            quantity: 500,
            unit: 'bags',
            unitCost: 12,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
        ],
        mockVolumeDiscounts
      );
      setProcurementBundles(bundles);

      // Supplier negotiation analysis
      const negotiation = [
        CostOptimizationService.analyzeSupplierNegotiation(
          's1',
          'ABC Materials Inc',
          120000,
          8,
          12,
          10000,
          [500, 520, 510, 530],
          [520, 525, 515, 535],
          88,
          92
        ),
      ];
      setSupplierNegotiation(negotiation);

      // Transportation optimization
      const transOpt = CostOptimizationService.optimizeTransportationCosts([
        { route: 'Supplier A -> Site 1', deliveries: 8, cost: 12000, mode: 'truck' },
        { route: 'Supplier B -> Site 2', deliveries: 6, cost: 9000, mode: 'truck' },
        { route: 'Warehouse -> Site 1', deliveries: 4, cost: 5000, mode: 'truck' },
      ]);
      setTransportationOpt(transOpt);

      // Storage optimization
      const storOpt = CostOptimizationService.optimizeStorageCosts(
        10000,
        6500,
        20000,
        [
          { materialId: 'm1', materialName: 'Concrete Mix', quantity: 100, turnoverRate: 8, spaceRequired: 500 },
          { materialId: 'm2', materialName: 'Steel Rebar', quantity: 50, turnoverRate: 3, spaceRequired: 300 },
          { materialId: 'm3', materialName: 'Cement Bags', quantity: 200, turnoverRate: 12, spaceRequired: 200 },
        ]
      );
      setStorageOpt(storOpt);
    } catch (error) {
      logger.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
    setRefreshing(false);
  };

  const showDetail = (detail: any, type: string) => {
    setSelectedDetail(detail);
    setDetailType(type);
    setDetailModalVisible(true);
  };

  // -------------------------------------------------------------------------
  // Render Methods
  // -------------------------------------------------------------------------

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(['overview', 'demand', 'costs', 'performance', 'optimization'] as ViewMode[]).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.viewModeButton, viewMode === mode && styles.viewModeButtonActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.viewModeText, viewMode === mode && styles.viewModeTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOverview = () => (
    <View>
      {/* Health Score */}
      {analyticsSummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logistics Health Score</Text>
          <View style={styles.healthScoreContainer}>
            <View style={styles.healthScoreCircle}>
              <Text style={styles.healthScoreValue}>{analyticsSummary.healthScore.toFixed(0)}</Text>
              <Text style={styles.healthScoreLabel}>/ 100</Text>
            </View>
            <View style={styles.healthMetrics}>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Forecast Accuracy</Text>
                <Text style={styles.healthMetricValue}>
                  {analyticsSummary.metrics.forecastAccuracy.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Cost Stability</Text>
                <Text style={styles.healthMetricValue}>
                  {analyticsSummary.metrics.costStability.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Text style={styles.healthMetricLabel}>Supply Reliability</Text>
                <Text style={styles.healthMetricValue}>
                  {analyticsSummary.metrics.supplyReliability.toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: getHealthColor(analyticsSummary.healthRating) }]}>
            <Text style={styles.badgeText}>{analyticsSummary.healthRating.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Key Insights */}
      {analyticsSummary && analyticsSummary.insights.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Insights</Text>
          {analyticsSummary.insights.slice(0, 3).map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: getSeverityColor(insight.severity) }]}>
                <Icon name={getSeverityIcon(insight.severity)} size={20} color="#FFF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                {insight.recommendation && (
                  <Text style={styles.insightRecommendation}>→ {insight.recommendation}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Risks */}
      {analyticsSummary && analyticsSummary.risks.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Alerts</Text>
          {analyticsSummary.risks.map((risk, index) => (
            <View key={index} style={styles.riskItem}>
              <View style={styles.riskHeader}>
                <Icon name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.riskType}>{risk.riskType.replace(/_/g, ' ').toUpperCase()}</Text>
                <View style={[styles.badge, { backgroundColor: getImpactColor(risk.impact) }]}>
                  <Text style={styles.badgeText}>{risk.impact}</Text>
                </View>
              </View>
              <Text style={styles.riskDescription}>{risk.description}</Text>
              <Text style={styles.riskMitigation}>Mitigation: {risk.mitigation}</Text>
              <Text style={styles.riskTimeline}>Timeline: {risk.timeline}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Opportunities */}
      {analyticsSummary && analyticsSummary.opportunities.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cost Savings Opportunities</Text>
          {analyticsSummary.opportunities.map((opp, index) => (
            <View key={index} style={styles.opportunityItem}>
              <View style={styles.opportunityHeader}>
                <Icon name="trending-up" size={20} color="#4CAF50" />
                <Text style={styles.opportunityValue}>${(opp.value / 1000).toFixed(0)}K</Text>
              </View>
              <Text style={styles.opportunityDescription}>{opp.description}</Text>
              <View style={styles.opportunityFooter}>
                <Text style={styles.opportunityTimeline}>{opp.timeline}</Text>
                <View style={[styles.badge, { backgroundColor: getEffortColor(opp.effort) }]}>
                  <Text style={styles.badgeText}>{opp.effort} effort</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDemandAnalytics = () => (
    <View>
      {/* Demand Forecasts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Demand Forecasts</Text>
        {demandForecasts.map((forecast, index) => (
          <TouchableOpacity
            key={index}
            style={styles.forecastItem}
            onPress={() => showDetail(forecast, 'demand')}
          >
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastMaterial}>{forecast.materialName}</Text>
              <Icon name="chevron-right" size={24} color="#666" />
            </View>
            <View style={styles.forecastMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Current</Text>
                <Text style={styles.metricValue}>{forecast.currentDemand.toFixed(0)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Avg Forecast</Text>
                <Text style={styles.metricValue}>
                  {(
                    forecast.forecast.predictions.reduce((s, p) => s + p.predictedValue, 0) /
                    forecast.forecast.predictions.length
                  ).toFixed(0)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Trend</Text>
                <View style={[styles.trendBadge, { backgroundColor: getTrendColor(forecast.forecast.trend.direction) }]}>
                  <Icon name={getTrendIcon(forecast.forecast.trend.direction)} size={16} color="#FFF" />
                </View>
              </View>
            </View>
            <Text style={styles.forecastRecommendation}>
              Recommended Order: {forecast.recommendedOrderQuantity} {forecast.unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lead Time Predictions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Supplier Lead Time Analysis</Text>
        {leadTimePredictions.map((prediction, index) => (
          <TouchableOpacity
            key={index}
            style={styles.predictionItem}
            onPress={() => showDetail(prediction, 'leadtime')}
          >
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionSupplier}>{prediction.supplierName}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: prediction.reliability > 80 ? '#4CAF50' : prediction.reliability > 60 ? '#FF9800' : '#FF6B6B' },
                ]}
              >
                <Text style={styles.badgeText}>{prediction.reliability.toFixed(0)}% reliable</Text>
              </View>
            </View>
            <View style={styles.predictionMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Predicted</Text>
                <Text style={styles.metricValue}>{prediction.predictedLeadTime} days</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Historical Avg</Text>
                <Text style={styles.metricValue}>{prediction.historicalLeadTime.average.toFixed(0)} days</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Risk Score</Text>
                <Text style={[styles.metricValue, { color: getRiskColor(prediction.riskScore) }]}>
                  {prediction.riskScore.toFixed(0)}
                </Text>
              </View>
            </View>
            <Text style={styles.predictionRecommendation}>
              Order {prediction.recommendedOrderAdvance} days in advance
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Consumption Patterns */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Consumption Patterns</Text>
        {consumptionPatterns.map((pattern, index) => (
          <TouchableOpacity
            key={index}
            style={styles.patternItem}
            onPress={() => showDetail(pattern, 'consumption')}
          >
            <Text style={styles.patternMaterial}>{pattern.materialName}</Text>
            <View style={styles.patternMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Avg Daily</Text>
                <Text style={styles.metricValue}>{pattern.averageConsumption.toFixed(1)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Pattern</Text>
                <View style={[styles.badge, { backgroundColor: getPatternColor(pattern.patternType) }]}>
                  <Text style={styles.badgeText}>{pattern.patternType.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Predictability</Text>
                <Text style={styles.metricValue}>{pattern.predictability.toFixed(0)}%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCostAnalytics = () => (
    <View>
      {/* Cost Breakdown */}
      {costOptimization && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cost Breakdown</Text>
          <View style={styles.costBreakdown}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Materials</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.materials}%`,
                      backgroundColor: '#2196F3',
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.materialCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.materials}%)
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Transportation</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.transportation}%`,
                      backgroundColor: '#FF9800',
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.transportationCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.transportation}%)
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>Storage</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.storage}%`,
                      backgroundColor: '#4CAF50',
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.storageCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.storage}%)
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Cost Trends */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cost Trend Analysis</Text>
        {costTrends.map((trend, index) => (
          <TouchableOpacity
            key={index}
            style={styles.trendItem}
            onPress={() => showDetail(trend, 'cost')}
          >
            <View style={styles.trendHeader}>
              <Text style={styles.trendMaterial}>{trend.materialName}</Text>
              <View style={[styles.badge, { backgroundColor: getVolatilityColor(trend.volatility) }]}>
                <Text style={styles.badgeText}>{trend.volatility} volatility</Text>
              </View>
            </View>
            <View style={styles.trendMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Current</Text>
                <Text style={styles.metricValue}>${trend.currentCost.toFixed(0)}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Trend</Text>
                <View style={[styles.trendBadge, { backgroundColor: getTrendColor(trend.trend.direction) }]}>
                  <Icon name={getTrendIcon(trend.trend.direction)} size={16} color="#FFF" />
                  <Text style={[styles.badgeText, { marginLeft: 4 }]}>
                    {trend.trend.growthRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Budget Impact</Text>
                <Text style={[styles.metricValue, { color: trend.budgetImpact.projectedCostIncrease > 0 ? '#FF6B6B' : '#4CAF50' }]}>
                  {trend.budgetImpact.projectedCostIncrease > 0 ? '+' : ''}
                  {trend.budgetImpact.projectedCostIncrease.toFixed(1)}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Procurement Bundles */}
      {procurementBundles.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Procurement Bundle Opportunities</Text>
          {procurementBundles.map((bundle, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bundleItem}
              onPress={() => showDetail(bundle, 'bundle')}
            >
              <View style={styles.bundleHeader}>
                <Text style={styles.bundleName}>{bundle.name}</Text>
                <Text style={styles.bundleSavings}>
                  Save ${(bundle.savings / 1000).toFixed(1)}K ({bundle.savingsPercentage.toFixed(1)}%)
                </Text>
              </View>
              <Text style={styles.bundleMaterials}>
                {bundle.materials.length} materials • {bundle.materials.reduce((sum, m) => sum + m.quantity, 0)} total units
              </Text>
              {bundle.feasible && (
                <View style={[styles.badge, { backgroundColor: '#4CAF50', marginTop: 8 }]}>
                  <Text style={styles.badgeText}>Feasible</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderPerformanceAnalytics = () => (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance Benchmarking</Text>
        {performanceBenchmarks.map((benchmark, index) => (
          <TouchableOpacity
            key={index}
            style={styles.benchmarkItem}
            onPress={() => showDetail(benchmark, 'benchmark')}
          >
            <View style={styles.benchmarkHeader}>
              <Text style={styles.benchmarkMetric}>{benchmark.metric.replace(/_/g, ' ').toUpperCase()}</Text>
              <View style={[styles.badge, { backgroundColor: getRatingColor(benchmark.rating) }]}>
                <Text style={styles.badgeText}>{benchmark.rating}</Text>
              </View>
            </View>
            <View style={styles.benchmarkMetrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Current</Text>
                <Text style={styles.metricValue}>
                  {benchmark.currentValue.toFixed(1)} {benchmark.unit}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Industry Avg</Text>
                <Text style={styles.metricValue}>
                  {benchmark.industryAverage.toFixed(1)} {benchmark.unit}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Best in Class</Text>
                <Text style={styles.metricValue}>
                  {benchmark.industryBest.toFixed(1)} {benchmark.unit}
                </Text>
              </View>
            </View>
            <View style={styles.benchmarkBar}>
              <View
                style={[
                  styles.benchmarkBarFill,
                  { width: `${benchmark.percentile}%`, backgroundColor: getRatingColor(benchmark.rating) },
                ]}
              />
              <Text style={styles.benchmarkPercentile}>{benchmark.percentile}th percentile</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderOptimizationRecommendations = () => (
    <View>
      {/* Quick Wins */}
      {costOptimization && costOptimization.quickWins.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Wins (Low Effort, High Impact)</Text>
          {costOptimization.quickWins.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Icon name="flash-on" size={20} color="#FFD700" />
                <Text style={styles.recommendationAction}>{rec.action}</Text>
              </View>
              <Text style={styles.recommendationRationale}>{rec.rationale}</Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationSavings}>
                  Savings: ${(rec.expectedSavings / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.recommendationTimeline}>Timeline: {rec.timeline}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Strategic Initiatives */}
      {costOptimization && costOptimization.strategicInitiatives.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Strategic Initiatives</Text>
          {costOptimization.strategicInitiatives.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Icon name="trending-up" size={20} color="#2196F3" />
                <Text style={styles.recommendationAction}>{rec.action}</Text>
              </View>
              <Text style={styles.recommendationRationale}>{rec.rationale}</Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationSavings}>
                  Savings: ${(rec.expectedSavings / 1000).toFixed(0)}K
                </Text>
                <View style={[styles.badge, { backgroundColor: getEffortColor(rec.effort) }]}>
                  <Text style={styles.badgeText}>{rec.effort} effort</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Transportation Optimization */}
      {transportationOpt && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transportation Optimization</Text>
          <View style={styles.optimizationSummary}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Current Costs</Text>
              <Text style={styles.metricValue}>${(transportationOpt.currentCosts / 1000).toFixed(0)}K</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Optimized Costs</Text>
              <Text style={styles.metricValue}>${(transportationOpt.optimizedCosts / 1000).toFixed(0)}K</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Potential Savings</Text>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                ${(transportationOpt.savings / 1000).toFixed(0)}K ({transportationOpt.savingsPercentage.toFixed(1)}%)
              </Text>
            </View>
          </View>
          {transportationOpt.strategies.map((strategy, index) => (
            <View key={index} style={styles.strategyItem}>
              <Text style={styles.strategyName}>{strategy.strategy}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
              <Text style={styles.strategySavings}>Savings: ${(strategy.savings / 1000).toFixed(0)}K</Text>
            </View>
          ))}
        </View>
      )}

      {/* Storage Optimization */}
      {storageOpt && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Storage Optimization</Text>
          <View style={styles.optimizationSummary}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Utilization</Text>
              <Text style={styles.metricValue}>{storageOpt.utilizationRate.toFixed(0)}%</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Current Costs</Text>
              <Text style={styles.metricValue}>${(storageOpt.currentCosts / 1000).toFixed(0)}K</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Potential Savings</Text>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                ${(storageOpt.savings / 1000).toFixed(0)}K
              </Text>
            </View>
          </View>
          {storageOpt.opportunities.map((opp, index) => (
            <View key={index} style={styles.opportunityItem}>
              <Text style={styles.opportunityDescription}>{opp.description}</Text>
              <Text style={styles.opportunityValue}>Savings: ${(opp.savings / 1000).toFixed(0)}K</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Icon name="refresh" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {renderViewModeSelector()}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'demand' && renderDemandAnalytics()}
        {viewMode === 'costs' && renderCostAnalytics()}
        {viewMode === 'performance' && renderPerformanceAnalytics()}
        {viewMode === 'optimization' && renderOptimizationRecommendations()}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text>{JSON.stringify(selectedDetail, null, 2)}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getHealthColor = (rating: string): string => {
  switch (rating) {
    case 'excellent':
      return '#4CAF50';
    case 'good':
      return '#8BC34A';
    case 'fair':
      return '#FF9800';
    case 'poor':
      return '#FF6B6B';
    default:
      return '#999';
  }
};

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return '#F44336';
    case 'high':
      return '#FF9800';
    case 'medium':
      return '#2196F3';
    case 'low':
      return '#4CAF50';
    case 'info':
      return '#9E9E9E';
    default:
      return '#999';
  }
};

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'check-circle';
    case 'info':
      return 'info-outline';
    default:
      return 'info';
  }
};

const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'critical':
      return '#F44336';
    case 'high':
      return '#FF9800';
    case 'medium':
      return '#2196F3';
    case 'low':
      return '#4CAF50';
    default:
      return '#999';
  }
};

const getEffortColor = (effort: string): string => {
  switch (effort) {
    case 'low':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'high':
      return '#FF6B6B';
    default:
      return '#999';
  }
};

const getTrendColor = (direction: string): string => {
  switch (direction) {
    case 'increasing':
      return '#FF6B6B';
    case 'decreasing':
      return '#4CAF50';
    case 'stable':
      return '#2196F3';
    case 'volatile':
      return '#FF9800';
    default:
      return '#999';
  }
};

const getTrendIcon = (direction: string): string => {
  switch (direction) {
    case 'increasing':
      return 'trending-up';
    case 'decreasing':
      return 'trending-down';
    case 'stable':
      return 'trending-flat';
    case 'volatile':
      return 'show-chart';
    default:
      return 'trending-flat';
  }
};

const getRiskColor = (riskScore: number): string => {
  if (riskScore > 70) return '#FF6B6B';
  if (riskScore > 40) return '#FF9800';
  return '#4CAF50';
};

const getPatternColor = (patternType: string): string => {
  switch (patternType) {
    case 'steady':
      return '#4CAF50';
    case 'seasonal':
      return '#2196F3';
    case 'project_based':
      return '#FF9800';
    case 'irregular':
      return '#FF6B6B';
    default:
      return '#999';
  }
};

const getVolatilityColor = (volatility: string): string => {
  switch (volatility) {
    case 'low':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'high':
      return '#FF6B6B';
    default:
      return '#999';
  }
};

const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'excellent':
      return '#4CAF50';
    case 'good':
      return '#8BC34A';
    case 'average':
      return '#FF9800';
    case 'below_average':
      return '#FF6B6B';
    case 'poor':
      return '#F44336';
    default:
      return '#999';
  }
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  viewModeContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  viewModeButtonActive: {
    backgroundColor: '#2196F3',
  },
  viewModeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  healthScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  healthMetrics: {
    flex: 1,
    marginLeft: 16,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthMetricLabel: {
    fontSize: 13,
    color: '#666',
  },
  healthMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  insightRecommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  riskItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    flex: 1,
  },
  riskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  riskMitigation: {
    fontSize: 12,
    color: '#2196F3',
    marginBottom: 2,
  },
  riskTimeline: {
    fontSize: 12,
    color: '#999',
  },
  opportunityItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  opportunityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
    marginLeft: 8,
  },
  opportunityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opportunityTimeline: {
    fontSize: 12,
    color: '#999',
  },
  forecastItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  forecastMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metricBox: {
    flex: 1,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  forecastRecommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  predictionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionSupplier: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  predictionMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  predictionRecommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  patternItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  patternMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  patternMetrics: {
    flexDirection: 'row',
  },
  costBreakdown: {
    marginTop: 8,
  },
  costItem: {
    marginBottom: 16,
  },
  costLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  costBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  costBarFill: {
    height: '100%',
  },
  costValue: {
    fontSize: 12,
    color: '#212121',
  },
  trendItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  trendMetrics: {
    flexDirection: 'row',
  },
  bundleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  bundleSavings: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  bundleMaterials: {
    fontSize: 12,
    color: '#666',
  },
  benchmarkItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benchmarkMetric: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  benchmarkMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  benchmarkBar: {
    position: 'relative',
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
  },
  benchmarkBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 12,
  },
  benchmarkPercentile: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
  recommendationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    flex: 1,
  },
  recommendationRationale: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationSavings: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  recommendationTimeline: {
    fontSize: 12,
    color: '#999',
  },
  optimizationSummary: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  strategyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  strategyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  strategySavings: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  modalBody: {
    padding: 16,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const LogisticsAnalyticsScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - LogisticsAnalyticsScreen">
    <LogisticsAnalyticsScreen />
  </ErrorBoundary>
);

export default LogisticsAnalyticsScreenWithBoundary;
