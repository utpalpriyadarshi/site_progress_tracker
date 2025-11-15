/**
 * PredictiveAnalyticsService - Week 6
 *
 * Advanced analytics and forecasting with:
 * - Demand forecasting from project pipeline
 * - Lead time prediction from supplier performance
 * - Cost trend analysis for budgeting
 * - Consumption pattern analysis
 * - Performance benchmarking
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ForecastMethod = 'moving_average' | 'exponential_smoothing' | 'linear_regression' | 'seasonal';

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export type SeasonalityType = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'project_based';

export interface HistoricalDataPoint {
  date: string; // ISO date string
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

export interface ForecastResult {
  // Forecast details
  forecastMethod: ForecastMethod;
  forecastPeriod: number; // days
  generatedAt: string;

  // Predictions
  predictions: ForecastPrediction[];

  // Accuracy metrics
  accuracy: ForecastAccuracy;

  // Trend analysis
  trend: TrendAnalysis;

  // Seasonality detection
  seasonality: SeasonalityAnalysis;

  // Confidence
  confidenceLevel: number; // 0-100%
  confidenceInterval: { lower: number; upper: number };
}

export interface ForecastPrediction {
  date: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number; // 0-100%
}

export interface ForecastAccuracy {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared (coefficient of determination)
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number; // rate of change
  growthRate: number; // percentage
  volatility: number; // standard deviation
  changePoints: string[]; // dates where trend changed significantly
}

export interface SeasonalityAnalysis {
  type: SeasonalityType;
  strength: number; // 0-100%
  peakPeriods: string[]; // dates or periods
  lowPeriods: string[];
  cycleLength?: number; // days
}

// Demand Forecasting
export interface DemandForecast {
  materialId: string;
  materialName: string;
  category: string;

  // Current demand
  currentDemand: number;
  unit: string;

  // Historical data
  historicalPeriod: number; // days
  historicalAverage: number;
  historicalPeak: number;
  historicalLow: number;

  // Forecast
  forecast: ForecastResult;

  // Project-based factors
  upcomingProjects: ProjectDemandFactor[];
  projectImpact: number; // additional demand from projects

  // Recommendations
  recommendedOrderQuantity: number;
  recommendedOrderDate: string;
  safetyStockAdjustment: number;
}

export interface ProjectDemandFactor {
  projectId: string;
  projectName: string;
  startDate: string;
  requiredQuantity: number;
  probability: number; // 0-100% chance project proceeds
  impact: number; // contribution to demand
}

// Lead Time Prediction
export interface LeadTimePrediction {
  supplierId: string;
  supplierName: string;
  materialCategory: string;

  // Historical performance
  historicalLeadTime: {
    average: number; // days
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
  };

  // Predicted lead time
  predictedLeadTime: number; // days
  confidenceInterval: { lower: number; upper: number };
  reliability: number; // 0-100%

  // Performance trend
  trend: TrendDirection;
  improving: boolean;

  // Risk factors
  riskFactors: LeadTimeRiskFactor[];
  riskScore: number; // 0-100%

  // Recommendations
  recommendedBufferDays: number;
  recommendedOrderAdvance: number; // days before needed
}

export interface LeadTimeRiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

// Cost Trend Analysis
export interface CostTrendAnalysis {
  materialId: string;
  materialName: string;
  category: string;

  // Current cost
  currentCost: number;
  currency: string;

  // Historical trends
  historicalPeriod: number; // days
  historicalData: HistoricalDataPoint[];

  // Cost analysis
  trend: TrendAnalysis;
  forecast: ForecastResult;

  // Price volatility
  volatility: 'low' | 'medium' | 'high';
  priceStability: number; // 0-100%

  // Market factors
  marketFactors: MarketFactor[];

  // Budget impact
  budgetImpact: BudgetImpact;

  // Recommendations
  recommendations: CostRecommendation[];
}

export interface MarketFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number; // percentage impact
  description: string;
}

export interface BudgetImpact {
  projectedCostIncrease: number; // percentage
  projectedAdditionalCost: number; // absolute amount
  affectedProjects: string[];
  contingencyRecommended: number; // percentage
}

export interface CostRecommendation {
  type: 'procurement' | 'timing' | 'alternative' | 'contract';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings: number;
  implementation: string;
}

// Consumption Pattern Analysis
export interface ConsumptionPattern {
  materialId: string;
  materialName: string;
  category: string;

  // Usage patterns
  averageConsumption: number; // per day
  peakConsumption: number;
  peakPeriods: string[];
  lowPeriods: string[];

  // Pattern type
  patternType: 'steady' | 'seasonal' | 'project_based' | 'irregular';
  predictability: number; // 0-100%

  // Efficiency metrics
  utilizationRate: number; // 0-100%
  wasteRate: number; // percentage
  stockoutFrequency: number; // times per period
  overstockFrequency: number;

  // Correlations
  correlatedWith: MaterialCorrelation[];

  // Optimization opportunities
  optimizations: ConsumptionOptimization[];
}

export interface MaterialCorrelation {
  materialId: string;
  materialName: string;
  correlationStrength: number; // -1 to 1
  relationship: string; // description
}

export interface ConsumptionOptimization {
  type: 'ordering' | 'timing' | 'quantity' | 'substitution';
  description: string;
  potentialSavings: number;
  impactScore: number; // 0-100%
}

// Performance Benchmarking
export interface PerformanceBenchmark {
  category: string;
  metric: string;

  // Current performance
  currentValue: number;
  unit: string;

  // Benchmarks
  industryAverage: number;
  industryBest: number;
  companyTarget: number;

  // Comparison
  vsIndustryAverage: number; // percentage difference
  vsIndustryBest: number;
  vsTarget: number;

  // Performance rating
  rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  percentile: number; // 0-100

  // Trend
  trend: TrendDirection;
  improving: boolean;

  // Improvement potential
  improvementGap: number;
  improvementActions: ImprovementAction[];
}

export interface ImprovementAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number; // percentage improvement
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

// Analytics Summary
export interface AnalyticsSummary {
  generatedAt: string;
  period: { startDate: string; endDate: string };

  // Key insights
  insights: AnalyticsInsight[];

  // Risk alerts
  risks: AnalyticsRisk[];

  // Opportunities
  opportunities: AnalyticsOpportunity[];

  // Overall health
  healthScore: number; // 0-100
  healthRating: 'excellent' | 'good' | 'fair' | 'poor';

  // Metrics summary
  metrics: {
    forecastAccuracy: number;
    costStability: number;
    supplyReliability: number;
    demandPredictability: number;
  };
}

export interface AnalyticsInsight {
  type: 'demand' | 'cost' | 'leadtime' | 'consumption' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  recommendation?: string;
}

export interface AnalyticsRisk {
  riskType: 'supply_disruption' | 'cost_overrun' | 'stockout' | 'quality' | 'compliance';
  probability: number; // 0-100%
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
  timeline: string;
}

export interface AnalyticsOpportunity {
  opportunityType: 'cost_savings' | 'efficiency' | 'optimization' | 'innovation';
  value: number;
  description: string;
  requirements: string;
  timeline: string;
  effort: 'low' | 'medium' | 'high';
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class PredictiveAnalyticsService {
  // -------------------------------------------------------------------------
  // Demand Forecasting
  // -------------------------------------------------------------------------

  /**
   * Forecast future demand for a material based on historical data and project pipeline
   */
  static forecastDemand(
    materialId: string,
    materialName: string,
    category: string,
    historicalData: HistoricalDataPoint[],
    upcomingProjects: ProjectDemandFactor[],
    forecastDays: number = 90
  ): DemandForecast {
    // Calculate historical statistics
    const values = historicalData.map(d => d.value);
    const historicalAverage = this.calculateMean(values);
    const historicalPeak = Math.max(...values);
    const historicalLow = Math.min(...values);

    // Generate forecast using exponential smoothing
    const forecast = this.generateForecast(
      historicalData,
      forecastDays,
      'exponential_smoothing'
    );

    // Calculate project-based demand impact
    const projectImpact = upcomingProjects.reduce((sum, p) => {
      return sum + (p.requiredQuantity * (p.probability / 100));
    }, 0);

    // Calculate recommendations
    const totalForecastedDemand = forecast.predictions.reduce((sum, p) => sum + p.predictedValue, 0);
    const recommendedOrderQuantity = Math.ceil(totalForecastedDemand + projectImpact);

    // Recommend ordering 7 days before predicted shortage
    const recommendedOrderDate = new Date();
    recommendedOrderDate.setDate(recommendedOrderDate.getDate() + 7);

    // Safety stock adjustment based on volatility
    const safetyStockAdjustment = forecast.trend.volatility > 0.3 ? 1.5 : 1.2;

    return {
      materialId,
      materialName,
      category,
      currentDemand: values[values.length - 1] || 0,
      unit: 'units',
      historicalPeriod: historicalData.length,
      historicalAverage,
      historicalPeak,
      historicalLow,
      forecast,
      upcomingProjects,
      projectImpact,
      recommendedOrderQuantity,
      recommendedOrderDate: recommendedOrderDate.toISOString(),
      safetyStockAdjustment,
    };
  }

  /**
   * Predict supplier lead times based on historical performance
   */
  static predictLeadTime(
    supplierId: string,
    supplierName: string,
    materialCategory: string,
    historicalLeadTimes: number[]
  ): LeadTimePrediction {
    if (historicalLeadTimes.length === 0) {
      // No historical data - use default estimates
      return this.getDefaultLeadTimePrediction(supplierId, supplierName, materialCategory);
    }

    // Calculate historical statistics
    const sorted = [...historicalLeadTimes].sort((a, b) => a - b);
    const average = this.calculateMean(historicalLeadTimes);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const standardDeviation = this.calculateStdDev(historicalLeadTimes);

    // Predict lead time (using median as more robust than mean)
    const predictedLeadTime = Math.ceil(median);
    const confidenceInterval = {
      lower: Math.max(0, predictedLeadTime - standardDeviation),
      upper: predictedLeadTime + standardDeviation,
    };

    // Calculate reliability (inverse of coefficient of variation)
    const cv = standardDeviation / average;
    const reliability = Math.max(0, Math.min(100, (1 - cv) * 100));

    // Determine trend
    const recentValues = historicalLeadTimes.slice(-5);
    const olderValues = historicalLeadTimes.slice(0, -5);
    const recentAvg = this.calculateMean(recentValues);
    const olderAvg = this.calculateMean(olderValues);
    const improving = recentAvg < olderAvg;
    const trend: TrendDirection =
      Math.abs(recentAvg - olderAvg) < 1 ? 'stable' :
      improving ? 'decreasing' :
      'increasing';

    // Identify risk factors
    const riskFactors: LeadTimeRiskFactor[] = [];
    if (standardDeviation > average * 0.3) {
      riskFactors.push({
        factor: 'High Variability',
        impact: 'high',
        description: 'Lead times are inconsistent',
        mitigation: 'Increase safety stock and buffer time',
      });
    }
    if (max > average * 2) {
      riskFactors.push({
        factor: 'Extreme Delays',
        impact: 'medium',
        description: 'Occasional very long lead times',
        mitigation: 'Identify alternative suppliers',
      });
    }
    if (!improving && trend === 'increasing') {
      riskFactors.push({
        factor: 'Degrading Performance',
        impact: 'medium',
        description: 'Lead times are getting longer',
        mitigation: 'Review supplier relationship',
      });
    }

    const riskScore = Math.min(100, riskFactors.length * 25 + cv * 100);

    // Recommendations
    const recommendedBufferDays = Math.ceil(standardDeviation);
    const recommendedOrderAdvance = predictedLeadTime + recommendedBufferDays + 3; // extra 3 days

    return {
      supplierId,
      supplierName,
      materialCategory,
      historicalLeadTime: {
        average,
        median,
        min,
        max,
        standardDeviation,
      },
      predictedLeadTime,
      confidenceInterval,
      reliability,
      trend,
      improving,
      riskFactors,
      riskScore,
      recommendedBufferDays,
      recommendedOrderAdvance,
    };
  }

  /**
   * Analyze cost trends and predict future costs
   */
  static analyzeCostTrends(
    materialId: string,
    materialName: string,
    category: string,
    historicalCostData: HistoricalDataPoint[],
    forecastDays: number = 90
  ): CostTrendAnalysis {
    // Current cost (most recent)
    const currentCost = historicalCostData[historicalCostData.length - 1]?.value || 0;

    // Generate trend analysis
    const values = historicalCostData.map(d => d.value);
    const trend = this.analyzeTrend(historicalCostData);

    // Generate forecast
    const forecast = this.generateForecast(historicalCostData, forecastDays, 'linear_regression');

    // Calculate volatility
    const stdDev = this.calculateStdDev(values);
    const mean = this.calculateMean(values);
    const cv = stdDev / mean;
    const volatility: 'low' | 'medium' | 'high' =
      cv < 0.1 ? 'low' : cv < 0.25 ? 'medium' : 'high';
    const priceStability = Math.max(0, Math.min(100, (1 - cv) * 100));

    // Identify market factors
    const marketFactors: MarketFactor[] = [];
    if (trend.direction === 'increasing' && trend.growthRate > 5) {
      marketFactors.push({
        factor: 'Price Inflation',
        impact: 'negative',
        magnitude: trend.growthRate,
        description: `Prices increasing at ${trend.growthRate.toFixed(1)}% rate`,
      });
    }
    if (volatility === 'high') {
      marketFactors.push({
        factor: 'Market Volatility',
        impact: 'negative',
        magnitude: 15,
        description: 'High price fluctuations indicate unstable market',
      });
    }

    // Calculate budget impact
    const avgForecastCost = this.calculateMean(forecast.predictions.map(p => p.predictedValue));
    const projectedCostIncrease = ((avgForecastCost - currentCost) / currentCost) * 100;
    const projectedAdditionalCost = avgForecastCost - currentCost;
    const contingencyRecommended = Math.max(5, Math.min(20, Math.abs(projectedCostIncrease) + 5));

    const budgetImpact: BudgetImpact = {
      projectedCostIncrease,
      projectedAdditionalCost,
      affectedProjects: [], // Would be populated from project data
      contingencyRecommended,
    };

    // Generate recommendations
    const recommendations: CostRecommendation[] = [];
    if (projectedCostIncrease > 10) {
      recommendations.push({
        type: 'procurement',
        priority: 'high',
        description: 'Consider bulk purchasing to lock in current prices',
        potentialSavings: projectedAdditionalCost * 0.5,
        implementation: 'Negotiate long-term contract with current pricing',
      });
    }
    if (volatility === 'high') {
      recommendations.push({
        type: 'alternative',
        priority: 'medium',
        description: 'Explore alternative materials or suppliers',
        potentialSavings: currentCost * 0.15,
        implementation: 'Research substitutes and secondary suppliers',
      });
    }

    return {
      materialId,
      materialName,
      category,
      currentCost,
      currency: 'USD',
      historicalPeriod: historicalCostData.length,
      historicalData: historicalCostData,
      trend,
      forecast,
      volatility,
      priceStability,
      marketFactors,
      budgetImpact,
      recommendations,
    };
  }

  /**
   * Analyze consumption patterns for a material
   */
  static analyzeConsumptionPattern(
    materialId: string,
    materialName: string,
    category: string,
    consumptionData: HistoricalDataPoint[],
    stockoutCount: number = 0,
    overstockCount: number = 0
  ): ConsumptionPattern {
    const values = consumptionData.map(d => d.value);
    const averageConsumption = this.calculateMean(values);
    const peakConsumption = Math.max(...values);

    // Identify peak and low periods (simplified)
    const peakThreshold = averageConsumption * 1.5;
    const lowThreshold = averageConsumption * 0.5;
    const peakPeriods = consumptionData
      .filter(d => d.value > peakThreshold)
      .map(d => d.date);
    const lowPeriods = consumptionData
      .filter(d => d.value < lowThreshold)
      .map(d => d.date);

    // Determine pattern type
    const stdDev = this.calculateStdDev(values);
    const cv = stdDev / averageConsumption;
    const patternType: 'steady' | 'seasonal' | 'project_based' | 'irregular' =
      cv < 0.2 ? 'steady' :
      peakPeriods.length > 2 ? 'seasonal' :
      cv > 0.5 ? 'irregular' :
      'project_based';

    const predictability = Math.max(0, Math.min(100, (1 - cv) * 100));

    // Calculate efficiency metrics
    const utilizationRate = 75 + Math.random() * 20; // Mock: 75-95%
    const wasteRate = Math.random() * 10; // Mock: 0-10%
    const stockoutFrequency = stockoutCount;
    const overstockFrequency = overstockCount;

    // Generate optimizations
    const optimizations: ConsumptionOptimization[] = [];
    if (stockoutFrequency > 2) {
      optimizations.push({
        type: 'ordering',
        description: 'Increase reorder point to reduce stockouts',
        potentialSavings: 5000,
        impactScore: 80,
      });
    }
    if (overstockFrequency > 2) {
      optimizations.push({
        type: 'quantity',
        description: 'Reduce order quantities to minimize overstock',
        potentialSavings: 3000,
        impactScore: 65,
      });
    }

    return {
      materialId,
      materialName,
      category,
      averageConsumption,
      peakConsumption,
      peakPeriods,
      lowPeriods,
      patternType,
      predictability,
      utilizationRate,
      wasteRate,
      stockoutFrequency,
      overstockFrequency,
      correlatedWith: [], // Would be calculated from cross-material analysis
      optimizations,
    };
  }

  /**
   * Benchmark performance against industry standards
   */
  static benchmarkPerformance(
    category: string,
    metric: string,
    currentValue: number,
    unit: string,
    companyTarget?: number
  ): PerformanceBenchmark {
    // Mock industry benchmarks (would come from database/API)
    const industryBenchmarks: Record<string, { average: number; best: number }> = {
      'inventory_turnover': { average: 6, best: 12 },
      'order_fulfillment_time': { average: 5, best: 2 }, // days
      'supplier_reliability': { average: 85, best: 98 }, // percentage
      'cost_variance': { average: 8, best: 3 }, // percentage
      'stockout_rate': { average: 5, best: 1 }, // percentage
    };

    const benchmarkKey = metric.toLowerCase().replace(/\s+/g, '_');
    const benchmark = industryBenchmarks[benchmarkKey] || { average: currentValue, best: currentValue * 1.5 };

    const industryAverage = benchmark.average;
    const industryBest = benchmark.best;
    const target = companyTarget || industryBest;

    // Calculate comparisons (lower is better for some metrics)
    const lowerIsBetter = ['order_fulfillment_time', 'cost_variance', 'stockout_rate'].includes(benchmarkKey);

    let vsIndustryAverage: number;
    let vsIndustryBest: number;
    let vsTarget: number;

    if (lowerIsBetter) {
      vsIndustryAverage = ((industryAverage - currentValue) / industryAverage) * 100;
      vsIndustryBest = ((industryBest - currentValue) / industryBest) * 100;
      vsTarget = ((target - currentValue) / target) * 100;
    } else {
      vsIndustryAverage = ((currentValue - industryAverage) / industryAverage) * 100;
      vsIndustryBest = ((currentValue - industryBest) / industryBest) * 100;
      vsTarget = ((currentValue - target) / target) * 100;
    }

    // Determine rating
    let rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    let percentile: number;

    if (lowerIsBetter) {
      if (currentValue <= industryBest * 1.1) {
        rating = 'excellent';
        percentile = 90;
      } else if (currentValue <= industryAverage) {
        rating = 'good';
        percentile = 70;
      } else if (currentValue <= industryAverage * 1.2) {
        rating = 'average';
        percentile = 50;
      } else if (currentValue <= industryAverage * 1.5) {
        rating = 'below_average';
        percentile = 30;
      } else {
        rating = 'poor';
        percentile = 10;
      }
    } else {
      if (currentValue >= industryBest * 0.9) {
        rating = 'excellent';
        percentile = 90;
      } else if (currentValue >= industryAverage) {
        rating = 'good';
        percentile = 70;
      } else if (currentValue >= industryAverage * 0.8) {
        rating = 'average';
        percentile = 50;
      } else if (currentValue >= industryAverage * 0.6) {
        rating = 'below_average';
        percentile = 30;
      } else {
        rating = 'poor';
        percentile = 10;
      }
    }

    // Determine trend (mock)
    const trend: TrendDirection = 'stable';
    const improving = Math.random() > 0.5;

    // Calculate improvement gap
    const improvementGap = lowerIsBetter
      ? Math.max(0, currentValue - industryBest)
      : Math.max(0, industryBest - currentValue);

    // Generate improvement actions
    const improvementActions: ImprovementAction[] = [];
    if (rating !== 'excellent') {
      improvementActions.push({
        action: 'Implement automated monitoring and alerts',
        priority: 'high',
        expectedImpact: 20,
        effort: 'medium',
        timeline: '2-3 months',
      });
      improvementActions.push({
        action: 'Review and optimize current processes',
        priority: 'medium',
        expectedImpact: 15,
        effort: 'low',
        timeline: '1 month',
      });
    }

    return {
      category,
      metric,
      currentValue,
      unit,
      industryAverage,
      industryBest,
      companyTarget: target,
      vsIndustryAverage,
      vsIndustryBest,
      vsTarget,
      rating,
      percentile,
      trend,
      improving,
      improvementGap,
      improvementActions,
    };
  }

  /**
   * Generate comprehensive analytics summary
   */
  static generateAnalyticsSummary(
    demandForecasts: DemandForecast[],
    leadTimePredictions: LeadTimePrediction[],
    costTrends: CostTrendAnalysis[],
    consumptionPatterns: ConsumptionPattern[],
    performanceBenchmarks: PerformanceBenchmark[]
  ): AnalyticsSummary {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);

    // Generate insights
    const insights: AnalyticsInsight[] = [];

    // Demand insights
    const highDemandItems = demandForecasts.filter(f => f.forecast.trend.direction === 'increasing');
    if (highDemandItems.length > 0) {
      insights.push({
        type: 'demand',
        severity: 'high',
        title: 'Increasing Demand Detected',
        description: `${highDemandItems.length} materials showing increasing demand trend`,
        impact: 'May require increased inventory levels and procurement',
        recommendation: 'Review stock levels and adjust reorder points',
      });
    }

    // Cost insights
    const risingCosts = costTrends.filter(c => c.trend.direction === 'increasing' && c.trend.growthRate > 10);
    if (risingCosts.length > 0) {
      insights.push({
        type: 'cost',
        severity: 'critical',
        title: 'Significant Cost Increases',
        description: `${risingCosts.length} materials with >10% cost increase`,
        impact: `Potential budget overrun of $${risingCosts.reduce((sum, c) => sum + c.budgetImpact.projectedAdditionalCost, 0).toFixed(0)}`,
        recommendation: 'Consider bulk purchasing or alternative suppliers',
      });
    }

    // Lead time insights
    const unreliableSuppliers = leadTimePredictions.filter(l => l.reliability < 70);
    if (unreliableSuppliers.length > 0) {
      insights.push({
        type: 'leadtime',
        severity: 'medium',
        title: 'Supplier Reliability Issues',
        description: `${unreliableSuppliers.length} suppliers with <70% reliability`,
        impact: 'Risk of delivery delays and project disruptions',
        recommendation: 'Identify backup suppliers and increase safety stock',
      });
    }

    // Consumption insights
    const inefficientPatterns = consumptionPatterns.filter(p => p.stockoutFrequency > 2 || p.overstockFrequency > 2);
    if (inefficientPatterns.length > 0) {
      insights.push({
        type: 'consumption',
        severity: 'medium',
        title: 'Inventory Management Inefficiencies',
        description: `${inefficientPatterns.length} materials with frequent stockouts or overstock`,
        impact: 'Increased costs and operational disruptions',
        recommendation: 'Optimize reorder points and order quantities',
      });
    }

    // Performance insights
    const poorPerformance = performanceBenchmarks.filter(b => b.rating === 'poor' || b.rating === 'below_average');
    if (poorPerformance.length > 0) {
      insights.push({
        type: 'performance',
        severity: 'high',
        title: 'Below-Average Performance Metrics',
        description: `${poorPerformance.length} metrics below industry average`,
        impact: 'Competitive disadvantage and increased operational costs',
        recommendation: 'Implement improvement actions for underperforming areas',
      });
    }

    // Identify risks
    const risks: AnalyticsRisk[] = [];

    // Supply disruption risks
    const highRiskSuppliers = leadTimePredictions.filter(l => l.riskScore > 60);
    if (highRiskSuppliers.length > 0) {
      risks.push({
        riskType: 'supply_disruption',
        probability: 70,
        impact: 'high',
        description: `${highRiskSuppliers.length} suppliers with high risk scores`,
        mitigation: 'Develop contingency plans and alternative sourcing',
        timeline: '1-3 months',
      });
    }

    // Cost overrun risks
    const volatileCosts = costTrends.filter(c => c.volatility === 'high');
    if (volatileCosts.length > 0) {
      risks.push({
        riskType: 'cost_overrun',
        probability: 60,
        impact: 'high',
        description: `${volatileCosts.length} materials with high price volatility`,
        mitigation: 'Negotiate fixed-price contracts and increase budget contingency',
        timeline: '2-4 months',
      });
    }

    // Stockout risks
    const stockoutRisk = consumptionPatterns.filter(p => p.stockoutFrequency > 3);
    if (stockoutRisk.length > 0) {
      risks.push({
        riskType: 'stockout',
        probability: 80,
        impact: 'medium',
        description: `${stockoutRisk.length} materials with frequent stockouts`,
        mitigation: 'Increase safety stock levels and improve demand forecasting',
        timeline: '1-2 months',
      });
    }

    // Identify opportunities
    const opportunities: AnalyticsOpportunity[] = [];

    // Cost savings from optimizations
    const totalOptimizationSavings = consumptionPatterns.reduce(
      (sum, p) => sum + p.optimizations.reduce((s, o) => s + o.potentialSavings, 0),
      0
    );
    if (totalOptimizationSavings > 5000) {
      opportunities.push({
        opportunityType: 'cost_savings',
        value: totalOptimizationSavings,
        description: 'Potential savings from consumption pattern optimization',
        requirements: 'Implement recommended ordering and stocking adjustments',
        timeline: '2-3 months',
        effort: 'medium',
      });
    }

    // Cost savings from cost trend recommendations
    const costRecommendationSavings = costTrends.reduce(
      (sum, c) => sum + c.recommendations.reduce((s, r) => s + r.potentialSavings, 0),
      0
    );
    if (costRecommendationSavings > 5000) {
      opportunities.push({
        opportunityType: 'cost_savings',
        value: costRecommendationSavings,
        description: 'Savings from strategic procurement timing and bulk purchasing',
        requirements: 'Act on cost trend recommendations',
        timeline: '1-2 months',
        effort: 'low',
      });
    }

    // Calculate overall health score
    const forecastAccuracy = this.calculateMean(
      demandForecasts.map(f => f.forecast.accuracy.r2 * 100)
    );
    const costStability = this.calculateMean(
      costTrends.map(c => c.priceStability)
    );
    const supplyReliability = this.calculateMean(
      leadTimePredictions.map(l => l.reliability)
    );
    const demandPredictability = this.calculateMean(
      consumptionPatterns.map(p => p.predictability)
    );

    const healthScore = (forecastAccuracy + costStability + supplyReliability + demandPredictability) / 4;
    const healthRating: 'excellent' | 'good' | 'fair' | 'poor' =
      healthScore >= 80 ? 'excellent' :
      healthScore >= 65 ? 'good' :
      healthScore >= 50 ? 'fair' :
      'poor';

    return {
      generatedAt: now.toISOString(),
      period: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      insights,
      risks,
      opportunities,
      healthScore,
      healthRating,
      metrics: {
        forecastAccuracy,
        costStability,
        supplyReliability,
        demandPredictability,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private static generateForecast(
    historicalData: HistoricalDataPoint[],
    forecastDays: number,
    method: ForecastMethod
  ): ForecastResult {
    const values = historicalData.map(d => d.value);

    // Generate predictions based on method
    const predictions: ForecastPrediction[] = [];
    const lastValue = values[values.length - 1];
    const trend = this.analyzeTrend(historicalData);
    const seasonality = this.detectSeasonality(historicalData);

    for (let i = 1; i <= forecastDays; i++) {
      const baseDate = new Date(historicalData[historicalData.length - 1].date);
      baseDate.setDate(baseDate.getDate() + i);

      let predictedValue: number;

      if (method === 'exponential_smoothing') {
        const alpha = 0.3; // smoothing factor
        predictedValue = lastValue + (trend.slope * i * alpha);
      } else if (method === 'linear_regression') {
        predictedValue = lastValue + (trend.slope * i);
      } else {
        predictedValue = lastValue;
      }

      // Add some realistic variance
      const variance = this.calculateStdDev(values) * 0.1;
      const lowerBound = predictedValue - variance;
      const upperBound = predictedValue + variance;

      predictions.push({
        date: baseDate.toISOString(),
        predictedValue: Math.max(0, predictedValue),
        lowerBound: Math.max(0, lowerBound),
        upperBound: Math.max(0, upperBound),
        confidence: 85 - (i * 0.2), // confidence decreases with time
      });
    }

    // Calculate accuracy metrics (using mock values for historical fit)
    const accuracy: ForecastAccuracy = {
      mae: this.calculateMean(values) * 0.1,
      rmse: this.calculateMean(values) * 0.15,
      mape: 12.5,
      r2: 0.85,
    };

    return {
      forecastMethod: method,
      forecastPeriod: forecastDays,
      generatedAt: new Date().toISOString(),
      predictions,
      accuracy,
      trend,
      seasonality,
      confidenceLevel: 85,
      confidenceInterval: {
        lower: Math.min(...predictions.map(p => p.lowerBound)),
        upper: Math.max(...predictions.map(p => p.upperBound)),
      },
    };
  }

  private static analyzeTrend(data: HistoricalDataPoint[]): TrendAnalysis {
    const values = data.map(d => d.value);

    // Calculate slope using linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = this.calculateMean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const growthRate = yMean !== 0 ? (slope / yMean) * 100 : 0;

    // Determine direction
    const direction: TrendDirection =
      Math.abs(slope) < yMean * 0.01 ? 'stable' :
      slope > 0 ? 'increasing' :
      'decreasing';

    // Calculate volatility
    const volatility = this.calculateStdDev(values) / yMean;

    // Identify change points (simplified)
    const changePoints: string[] = [];

    return {
      direction,
      slope,
      growthRate,
      volatility,
      changePoints,
    };
  }

  private static detectSeasonality(data: HistoricalDataPoint[]): SeasonalityAnalysis {
    // Simplified seasonality detection
    const values = data.map(d => d.value);
    const mean = this.calculateMean(values);

    // Check for periodic patterns (mock implementation)
    const hasPattern = this.calculateStdDev(values) > mean * 0.2;

    return {
      type: hasPattern ? 'monthly' : 'none',
      strength: hasPattern ? 65 : 0,
      peakPeriods: [],
      lowPeriods: [],
      cycleLength: 30,
    };
  }

  private static getDefaultLeadTimePrediction(
    supplierId: string,
    supplierName: string,
    materialCategory: string
  ): LeadTimePrediction {
    // Default estimates when no historical data
    return {
      supplierId,
      supplierName,
      materialCategory,
      historicalLeadTime: {
        average: 14,
        median: 14,
        min: 10,
        max: 21,
        standardDeviation: 3,
      },
      predictedLeadTime: 14,
      confidenceInterval: { lower: 11, upper: 17 },
      reliability: 50,
      trend: 'stable',
      improving: false,
      riskFactors: [
        {
          factor: 'Insufficient Data',
          impact: 'high',
          description: 'No historical performance data available',
          mitigation: 'Monitor first few deliveries closely',
        },
      ],
      riskScore: 60,
      recommendedBufferDays: 7,
      recommendedOrderAdvance: 21,
    };
  }

  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => (val - mean) ** 2);
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }
}
