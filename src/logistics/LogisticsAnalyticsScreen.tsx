/**
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
import { logger } from '../services/LoggingService';

// Analytics components
import {
  ViewModeSelector,
  OverviewSection,
  DemandAnalyticsSection,
  CostAnalyticsSection,
  PerformanceSection,
  OptimizationSection,
} from './analytics/components';

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

      <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'overview' && <OverviewSection analyticsSummary={analyticsSummary} />}
        {viewMode === 'demand' && (
          <DemandAnalyticsSection
            demandForecasts={demandForecasts}
            leadTimePredictions={leadTimePredictions}
            consumptionPatterns={consumptionPatterns}
            onShowDetail={showDetail}
          />
        )}
        {viewMode === 'costs' && (
          <CostAnalyticsSection
            costOptimization={costOptimization}
            costTrends={costTrends}
            procurementBundles={procurementBundles}
            onShowDetail={showDetail}
          />
        )}
        {viewMode === 'performance' && (
          <PerformanceSection performanceBenchmarks={performanceBenchmarks} onShowDetail={showDetail} />
        )}
        {viewMode === 'optimization' && (
          <OptimizationSection
            costOptimization={costOptimization}
            transportationOpt={transportationOpt}
            storageOpt={storageOpt}
          />
        )}
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
  content: {
    flex: 1,
    padding: 16,
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
