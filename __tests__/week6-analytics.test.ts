/**
 * Week 6 - Advanced Analytics & Optimization Tests
 *
 * Tests for:
 * - PredictiveAnalyticsService
 * - CostOptimizationService
 */

import {
  PredictiveAnalyticsService,
  type HistoricalDataPoint,
  type ProjectDemandFactor,
} from '../src/services/PredictiveAnalyticsService';

import {
  CostOptimizationService,
  type CostBreakdown,
  type VolumeDiscount,
} from '../src/services/CostOptimizationService';

describe('Week 6 - Advanced Analytics & Optimization', () => {
  // -------------------------------------------------------------------------
  // PredictiveAnalyticsService Tests
  // -------------------------------------------------------------------------

  describe('PredictiveAnalyticsService', () => {
    const mockHistoricalData: HistoricalDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: 100 + Math.sin(i / 5) * 20 + Math.random() * 10,
    }));

    const mockProjectDemand: ProjectDemandFactor[] = [
      {
        projectId: 'p1',
        projectName: 'Test Project',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        requiredQuantity: 500,
        probability: 90,
        impact: 450,
      },
    ];

    describe('Demand Forecasting', () => {
      it('should generate demand forecast with predictions', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          mockProjectDemand,
          30
        );

        expect(forecast.materialId).toBe('m1');
        expect(forecast.materialName).toBe('Test Material');
        expect(forecast.forecast.predictions.length).toBe(30);
        expect(forecast.forecast.forecastMethod).toBeDefined();
        expect(forecast.historicalAverage).toBeGreaterThan(0);
      });

      it('should calculate historical statistics correctly', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          [],
          30
        );

        expect(forecast.historicalPeak).toBeGreaterThanOrEqual(forecast.historicalAverage);
        expect(forecast.historicalLow).toBeLessThanOrEqual(forecast.historicalAverage);
        expect(forecast.historicalPeriod).toBe(mockHistoricalData.length);
      });

      it('should include project-based demand impact', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          mockProjectDemand,
          30
        );

        expect(forecast.upcomingProjects.length).toBe(1);
        expect(forecast.projectImpact).toBeGreaterThan(0);
        expect(forecast.upcomingProjects[0].projectId).toBe('p1');
      });

      it('should recommend order quantity and date', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          mockProjectDemand,
          30
        );

        expect(forecast.recommendedOrderQuantity).toBeGreaterThan(0);
        expect(forecast.recommendedOrderDate).toBeDefined();
        expect(forecast.safetyStockAdjustment).toBeGreaterThanOrEqual(1);
      });

      it('should generate forecast with confidence intervals', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          [],
          30
        );

        forecast.forecast.predictions.forEach(prediction => {
          expect(prediction.lowerBound).toBeLessThanOrEqual(prediction.predictedValue);
          expect(prediction.upperBound).toBeGreaterThanOrEqual(prediction.predictedValue);
          expect(prediction.confidence).toBeGreaterThan(0);
          expect(prediction.confidence).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('Lead Time Prediction', () => {
      it('should predict lead time from historical data', () => {
        const leadTimes = [10, 12, 11, 13, 12, 14, 11, 12, 10, 13];
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Construction Materials',
          leadTimes
        );

        expect(prediction.supplierId).toBe('s1');
        expect(prediction.supplierName).toBe('Test Supplier');
        expect(prediction.predictedLeadTime).toBeGreaterThan(0);
        expect(prediction.reliability).toBeGreaterThan(0);
        expect(prediction.reliability).toBeLessThanOrEqual(100);
      });

      it('should calculate historical statistics', () => {
        const leadTimes = [10, 12, 11, 13, 12];
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Materials',
          leadTimes
        );

        expect(prediction.historicalLeadTime.average).toBeGreaterThan(0);
        expect(prediction.historicalLeadTime.median).toBeGreaterThan(0);
        expect(prediction.historicalLeadTime.min).toBeLessThanOrEqual(prediction.historicalLeadTime.median);
        expect(prediction.historicalLeadTime.max).toBeGreaterThanOrEqual(prediction.historicalLeadTime.median);
        expect(prediction.historicalLeadTime.standardDeviation).toBeGreaterThanOrEqual(0);
      });

      it('should provide confidence interval', () => {
        const leadTimes = [10, 12, 11, 13, 12];
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Materials',
          leadTimes
        );

        expect(prediction.confidenceInterval.lower).toBeLessThanOrEqual(prediction.predictedLeadTime);
        expect(prediction.confidenceInterval.upper).toBeGreaterThanOrEqual(prediction.predictedLeadTime);
      });

      it('should identify risk factors for high variability', () => {
        const leadTimes = [5, 20, 8, 25, 10]; // High variability
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Materials',
          leadTimes
        );

        expect(prediction.riskFactors.length).toBeGreaterThan(0);
        expect(prediction.riskScore).toBeGreaterThan(0);
      });

      it('should recommend buffer days and order advance', () => {
        const leadTimes = [10, 12, 11, 13, 12];
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Materials',
          leadTimes
        );

        expect(prediction.recommendedBufferDays).toBeGreaterThanOrEqual(0);
        expect(prediction.recommendedOrderAdvance).toBeGreaterThan(prediction.predictedLeadTime);
      });

      it('should handle empty historical data', () => {
        const prediction = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'New Supplier',
          'Materials',
          []
        );

        expect(prediction.predictedLeadTime).toBe(14); // Default
        expect(prediction.reliability).toBe(50);
        expect(prediction.riskFactors.length).toBeGreaterThan(0);
      });
    });

    describe('Cost Trend Analysis', () => {
      it('should analyze cost trends', () => {
        const costData: HistoricalDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
          value: 500 + i * 2, // Increasing trend
        }));

        const analysis = PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Test Material',
          'Construction',
          costData,
          30
        );

        expect(analysis.materialId).toBe('m1');
        expect(analysis.currentCost).toBeGreaterThan(0);
        expect(analysis.trend.direction).toBeDefined();
        expect(analysis.forecast.predictions.length).toBe(30);
      });

      it('should calculate volatility correctly', () => {
        const stableCosts: HistoricalDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
          value: 500 + Math.random() * 5, // Low variability
        }));

        const analysis = PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Stable Material',
          'Construction',
          stableCosts,
          30
        );

        expect(analysis.volatility).toBe('low');
        expect(analysis.priceStability).toBeGreaterThan(80);
      });

      it('should provide budget impact assessment', () => {
        const costData: HistoricalDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
          value: 500 + i * 5, // Significant increase
        }));

        const analysis = PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Test Material',
          'Construction',
          costData,
          30
        );

        expect(analysis.budgetImpact).toBeDefined();
        expect(analysis.budgetImpact.projectedCostIncrease).toBeGreaterThanOrEqual(0);
        expect(analysis.budgetImpact.contingencyRecommended).toBeGreaterThan(0);
      });

      it('should generate cost optimization recommendations', () => {
        const costData: HistoricalDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
          value: 500 + i * 5,
        }));

        const analysis = PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Test Material',
          'Construction',
          costData,
          30
        );

        expect(analysis.recommendations).toBeDefined();
        expect(analysis.recommendations.length).toBeGreaterThan(0);
        analysis.recommendations.forEach(rec => {
          expect(rec.type).toBeDefined();
          expect(rec.priority).toBeDefined();
          expect(rec.potentialSavings).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe('Performance Benchmarking', () => {
      it('should benchmark performance against industry', () => {
        const benchmark = PredictiveAnalyticsService.benchmarkPerformance(
          'Inventory',
          'inventory_turnover',
          8.5,
          'times/year',
          10
        );

        expect(benchmark.currentValue).toBe(8.5);
        expect(benchmark.industryAverage).toBeDefined();
        expect(benchmark.industryBest).toBeDefined();
        expect(benchmark.rating).toBeDefined();
        expect(benchmark.percentile).toBeGreaterThan(0);
        expect(benchmark.percentile).toBeLessThanOrEqual(100);
      });

      it('should rate excellent performance correctly', () => {
        const benchmark = PredictiveAnalyticsService.benchmarkPerformance(
          'Delivery',
          'order_fulfillment_time',
          2.0,
          'days',
          3
        );

        expect(benchmark.rating).toBe('excellent');
        expect(benchmark.percentile).toBeGreaterThanOrEqual(90);
      });

      it('should provide improvement actions', () => {
        const benchmark = PredictiveAnalyticsService.benchmarkPerformance(
          'Inventory',
          'inventory_turnover',
          4.0,
          'times/year',
          8
        );

        expect(benchmark.improvementActions).toBeDefined();
        expect(benchmark.improvementActions.length).toBeGreaterThan(0);
        benchmark.improvementActions.forEach(action => {
          expect(action.action).toBeDefined();
          expect(action.priority).toBeDefined();
          expect(action.expectedImpact).toBeGreaterThan(0);
        });
      });
    });

    describe('Analytics Summary Generation', () => {
      it('should generate comprehensive analytics summary', () => {
        const forecast = PredictiveAnalyticsService.forecastDemand(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          [],
          30
        );

        const leadTime = PredictiveAnalyticsService.predictLeadTime(
          's1',
          'Test Supplier',
          'Materials',
          [10, 12, 11]
        );

        const costAnalysis = PredictiveAnalyticsService.analyzeCostTrends(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          30
        );

        const consumption = PredictiveAnalyticsService.analyzeConsumptionPattern(
          'm1',
          'Test Material',
          'Construction',
          mockHistoricalData,
          1,
          0
        );

        const benchmark = PredictiveAnalyticsService.benchmarkPerformance(
          'Inventory',
          'inventory_turnover',
          8.5,
          'times/year'
        );

        const summary = PredictiveAnalyticsService.generateAnalyticsSummary(
          [forecast],
          [leadTime],
          [costAnalysis],
          [consumption],
          [benchmark]
        );

        expect(summary.healthScore).toBeGreaterThan(0);
        expect(summary.healthScore).toBeLessThanOrEqual(100);
        expect(summary.healthRating).toBeDefined();
        expect(summary.insights).toBeDefined();
        expect(summary.risks).toBeDefined();
        expect(summary.opportunities).toBeDefined();
        expect(summary.metrics).toBeDefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // CostOptimizationService Tests
  // -------------------------------------------------------------------------

  describe('CostOptimizationService', () => {
    const mockCostBreakdown: CostBreakdown = {
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

    const mockVolumeDiscounts: VolumeDiscount[] = [
      { tier: 1, minQuantity: 0, maxQuantity: 100, discountPercentage: 0, discountedPrice: 100 },
      { tier: 2, minQuantity: 100, maxQuantity: 500, discountPercentage: 5, discountedPrice: 95 },
      { tier: 3, minQuantity: 500, discountPercentage: 10, discountedPrice: 90 },
    ];

    describe('Cost Optimization', () => {
      it('should perform comprehensive cost optimization', () => {
        const result = CostOptimizationService.performCostOptimization(
          mockCostBreakdown,
          {},
          {},
          {},
          {}
        );

        expect(result.currentCosts).toBeDefined();
        expect(result.opportunities.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.totalPotentialSavings).toBeGreaterThan(0);
        expect(result.roi).toBeGreaterThan(0);
      });

      it('should identify quick wins', () => {
        const result = CostOptimizationService.performCostOptimization(
          mockCostBreakdown,
          {},
          {},
          {},
          {}
        );

        expect(result.quickWins).toBeDefined();
        result.quickWins.forEach(win => {
          expect(win.effort).toBe('low');
          expect(win.expectedSavings).toBeGreaterThan(0);
        });
      });

      it('should identify strategic initiatives', () => {
        const result = CostOptimizationService.performCostOptimization(
          mockCostBreakdown,
          {},
          {},
          {},
          {}
        );

        expect(result.strategicInitiatives).toBeDefined();
        result.strategicInitiatives.forEach(initiative => {
          expect(initiative.effort).toBe('high');
          expect(initiative.expectedSavings).toBeGreaterThan(0);
        });
      });
    });

    describe('Procurement Bundle Optimization', () => {
      it('should optimize procurement bundles', () => {
        const materials = [
          {
            materialId: 'm1',
            materialName: 'Concrete',
            quantity: 200,
            unit: 'm³',
            unitCost: 150,
            supplierId: 's1',
            supplierName: 'Supplier A',
          },
          {
            materialId: 'm2',
            materialName: 'Steel',
            quantity: 300,
            unit: 'tons',
            unitCost: 800,
            supplierId: 's1',
            supplierName: 'Supplier A',
          },
          {
            materialId: 'm3',
            materialName: 'Cement',
            quantity: 150,
            unit: 'bags',
            unitCost: 12,
            supplierId: 's1',
            supplierName: 'Supplier A',
          },
        ];

        const bundles = CostOptimizationService.optimizeProcurementBundles(
          materials,
          mockVolumeDiscounts
        );

        expect(bundles.length).toBeGreaterThan(0);
        bundles.forEach(bundle => {
          expect(bundle.materials.length).toBeGreaterThanOrEqual(3);
          expect(bundle.savings).toBeGreaterThan(0);
          expect(bundle.feasible).toBe(true);
        });
      });

      it('should calculate volume discount savings', () => {
        const materials = [
          {
            materialId: 'm1',
            materialName: 'Material 1',
            quantity: 600,
            unit: 'units',
            unitCost: 100,
            supplierId: 's1',
            supplierName: 'Supplier A',
          },
        ];

        const bundles = CostOptimizationService.optimizeProcurementBundles(
          materials,
          mockVolumeDiscounts
        );

        if (bundles.length > 0) {
          const bundle = bundles[0];
          expect(bundle.bundledCost).toBeLessThan(bundle.unbundledCost);
          expect(bundle.currentTier).toBeGreaterThan(0);
        }
      });
    });

    describe('Supplier Negotiation Analysis', () => {
      it('should analyze supplier negotiation leverage', () => {
        const analysis = CostOptimizationService.analyzeSupplierNegotiation(
          's1',
          'Supplier A',
          120000,
          8,
          12,
          10000,
          [500, 520, 510],
          [520, 525, 515],
          88,
          92
        );

        expect(analysis.supplierId).toBe('s1');
        expect(analysis.leverageScore).toBeGreaterThan(0);
        expect(analysis.leverageScore).toBeLessThanOrEqual(100);
        expect(analysis.leverageFactors.length).toBeGreaterThan(0);
        expect(analysis.negotiationOpportunities.length).toBeGreaterThan(0);
      });

      it('should calculate pricing competitiveness', () => {
        const analysis = CostOptimizationService.analyzeSupplierNegotiation(
          's1',
          'Supplier A',
          100000,
          5,
          10,
          10000,
          [500, 500, 500],
          [550, 550, 550], // 10% above market
          90,
          95
        );

        expect(analysis.pricingCompetitiveness).toBeDefined();
        expect(analysis.vsMarketAverage).toBeGreaterThan(0); // Above market
      });

      it('should provide negotiation strategy', () => {
        const analysis = CostOptimizationService.analyzeSupplierNegotiation(
          's1',
          'Supplier A',
          120000,
          8,
          12,
          10000,
          [500, 500],
          [520, 520],
          88,
          92
        );

        expect(analysis.negotiationStrategy).toBeDefined();
        expect(analysis.targetDiscount).toBeGreaterThan(0);
        expect(analysis.alternativeOptions.length).toBeGreaterThan(0);
      });
    });

    describe('Transportation Optimization', () => {
      it('should optimize transportation costs', () => {
        const routes = [
          { route: 'A -> B', deliveries: 8, cost: 12000, mode: 'truck' },
          { route: 'B -> C', deliveries: 6, cost: 9000, mode: 'truck' },
          { route: 'C -> D', deliveries: 4, cost: 5000, mode: 'truck' },
        ];

        const optimization = CostOptimizationService.optimizeTransportationCosts(routes);

        expect(optimization.currentCosts).toBeGreaterThan(0);
        expect(optimization.optimizedCosts).toBeLessThan(optimization.currentCosts);
        expect(optimization.savings).toBeGreaterThan(0);
        expect(optimization.strategies.length).toBeGreaterThan(0);
      });

      it('should suggest route consolidation', () => {
        const routes = [
          { route: 'A -> B', deliveries: 8, cost: 12000, mode: 'truck' },
          { route: 'A -> B', deliveries: 6, cost: 9000, mode: 'truck' },
        ];

        const optimization = CostOptimizationService.optimizeTransportationCosts(routes);

        expect(optimization.routeConsolidation.length).toBeGreaterThan(0);
        optimization.routeConsolidation.forEach(consolidation => {
          expect(consolidation.savings).toBeGreaterThan(0);
        });
      });
    });

    describe('Total Cost of Ownership (TCO)', () => {
      it('should calculate TCO accurately', () => {
        const suppliers = [
          {
            supplierId: 's1',
            supplierName: 'Supplier A',
            unitPrice: 100,
            shippingCost: 500,
            leadTime: 7,
            reliability: 95,
            qualityScore: 92,
          },
          {
            supplierId: 's2',
            supplierName: 'Supplier B',
            unitPrice: 95,
            shippingCost: 800,
            leadTime: 14,
            reliability: 85,
            qualityScore: 88,
          },
        ];

        const tco = CostOptimizationService.calculateTCO(
          'm1',
          'Test Material',
          100,
          1000,
          suppliers
        );

        expect(tco.totalCostOfOwnership).toBeGreaterThan(0);
        expect(tco.tcoPerUnit).toBeGreaterThan(0);
        expect(tco.supplierComparison.length).toBe(2);
        expect(tco.lowestTCOSupplier).toBeDefined();
      });

      it('should rank suppliers by TCO', () => {
        const suppliers = [
          {
            supplierId: 's1',
            supplierName: 'Supplier A',
            unitPrice: 100,
            shippingCost: 500,
            leadTime: 7,
            reliability: 95,
            qualityScore: 92,
          },
          {
            supplierId: 's2',
            supplierName: 'Supplier B',
            unitPrice: 105,
            shippingCost: 800,
            leadTime: 14,
            reliability: 85,
            qualityScore: 88,
          },
        ];

        const tco = CostOptimizationService.calculateTCO(
          'm1',
          'Test Material',
          100,
          1000,
          suppliers
        );

        const rankings = tco.supplierComparison.map(s => s.ranking);
        expect(rankings).toEqual([1, 2]); // Should be sorted by TCO
      });

      it('should identify hidden costs', () => {
        const suppliers = [
          {
            supplierId: 's1',
            supplierName: 'Supplier A',
            unitPrice: 100,
            shippingCost: 500,
            leadTime: 7,
            reliability: 95,
            qualityScore: 92,
          },
        ];

        const tco = CostOptimizationService.calculateTCO(
          'm1',
          'Test Material',
          100,
          1000,
          suppliers
        );

        expect(tco.hiddenCosts).toBeDefined();
        expect(tco.hiddenCosts.length).toBeGreaterThan(0);
        tco.hiddenCosts.forEach(cost => {
          expect(cost.category).toBeDefined();
          expect(cost.estimatedCost).toBeGreaterThanOrEqual(0);
        });
      });
    });

    describe('Storage Optimization', () => {
      it('should optimize storage costs', () => {
        const items = [
          {
            materialId: 'm1',
            materialName: 'Material 1',
            quantity: 100,
            turnoverRate: 8,
            spaceRequired: 500,
          },
          {
            materialId: 'm2',
            materialName: 'Material 2',
            quantity: 50,
            turnoverRate: 3,
            spaceRequired: 300,
          },
        ];

        const optimization = CostOptimizationService.optimizeStorageCosts(
          10000,
          6500,
          20000,
          items
        );

        expect(optimization.currentCosts).toBe(20000);
        expect(optimization.optimizedCosts).toBeLessThan(optimization.currentCosts);
        expect(optimization.savings).toBeGreaterThan(0);
        expect(optimization.utilizationRate).toBeGreaterThan(0);
      });

      it('should identify slow-moving inventory', () => {
        const items = [
          {
            materialId: 'm1',
            materialName: 'Fast Mover',
            quantity: 100,
            turnoverRate: 12,
            spaceRequired: 200,
          },
          {
            materialId: 'm2',
            materialName: 'Slow Mover',
            quantity: 50,
            turnoverRate: 2,
            spaceRequired: 500,
          },
        ];

        const optimization = CostOptimizationService.optimizeStorageCosts(
          10000,
          6500,
          20000,
          items
        );

        const reductionOpportunity = optimization.opportunities.find(
          o => o.type === 'inventory_reduction'
        );
        expect(reductionOpportunity).toBeDefined();
      });
    });
  });
});
