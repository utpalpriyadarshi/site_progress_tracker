/**
 * CostOptimizationService - Week 6
 *
 * Cost optimization and reduction with:
 * - Procurement bundle optimization
 * - Volume discount calculations
 * - Supplier negotiation analytics
 * - Transportation cost optimization
 * - Storage cost analysis
 * - Total Cost of Ownership (TCO) calculations
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OptimizationStrategy =
  | 'bulk_purchasing'
  | 'supplier_consolidation'
  | 'alternative_materials'
  | 'timing_optimization'
  | 'transportation_optimization'
  | 'storage_reduction';

export type SavingsType =
  | 'unit_cost'
  | 'volume_discount'
  | 'transportation'
  | 'storage'
  | 'administrative'
  | 'waste_reduction';

export interface CostOptimizationResult {
  generatedAt: string;
  period: { startDate: string; endDate: string };

  // Current costs
  currentCosts: CostBreakdown;

  // Optimization opportunities
  opportunities: OptimizationOpportunity[];

  // Recommended actions
  recommendations: CostRecommendation[];

  // Projected savings
  totalPotentialSavings: number;
  implementationCost: number;
  netSavings: number;
  roi: number; // percentage

  // Priority actions
  quickWins: CostRecommendation[]; // low effort, high impact
  strategicInitiatives: CostRecommendation[]; // high effort, high impact
}

export interface CostBreakdown {
  totalCost: number;
  currency: string;

  // By category
  materialCosts: number;
  transportationCosts: number;
  storageCosts: number;
  administrativeCosts: number;
  wasteCosts: number;

  // By type
  fixedCosts: number;
  variableCosts: number;

  // Percentages
  costPercentages: {
    materials: number;
    transportation: number;
    storage: number;
    administrative: number;
    waste: number;
  };
}

export interface OptimizationOpportunity {
  id: string;
  strategy: OptimizationStrategy;
  savingsType: SavingsType;

  // Description
  title: string;
  description: string;

  // Savings
  potentialSavings: number;
  savingsPercentage: number;

  // Feasibility
  feasibility: 'high' | 'medium' | 'low';
  implementationEffort: 'low' | 'medium' | 'high';
  timeToImplement: string; // e.g., "2-4 weeks"

  // Impact
  impactScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';

  // Details
  affectedMaterials: string[];
  affectedSuppliers: string[];
}

export interface CostRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: OptimizationStrategy;

  // Action details
  action: string;
  rationale: string;
  expectedSavings: number;

  // Implementation
  steps: string[];
  timeline: string;
  effort: 'low' | 'medium' | 'high';
  resources: string[];

  // Dependencies
  dependencies: string[];
  prerequisites: string[];

  // Metrics
  successMetrics: string[];
}

// Procurement Bundle Optimization
export interface ProcurementBundle {
  id: string;
  name: string;

  // Materials in bundle
  materials: BundleMaterial[];

  // Supplier
  supplierId: string;
  supplierName: string;

  // Costs
  unbundledCost: number;
  bundledCost: number;
  savings: number;
  savingsPercentage: number;

  // Volume discounts
  volumeDiscounts: VolumeDiscount[];
  currentTier: number;
  nextTierSavings?: number;

  // Logistics
  shippingConsolidation: boolean;
  shippingCostSavings: number;

  // Feasibility
  feasible: boolean;
  constraints: string[];
  recommendations: string[];
}

export interface BundleMaterial {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  bundleDiscount: number; // percentage
}

export interface VolumeDiscount {
  tier: number;
  minQuantity: number;
  maxQuantity?: number;
  discountPercentage: number;
  discountedPrice: number;
}

// Supplier Negotiation Analytics
export interface SupplierNegotiationAnalysis {
  supplierId: string;
  supplierName: string;

  // Current relationship
  currentSpend: number;
  materialCount: number;
  orderFrequency: number; // orders per month
  averageOrderValue: number;

  // Negotiation leverage
  leverageScore: number; // 0-100
  leverageFactors: LeverageFactor[];

  // Pricing analysis
  pricingCompetitiveness: 'excellent' | 'good' | 'average' | 'poor';
  vsMarketAverage: number; // percentage difference
  priceTrend: 'improving' | 'stable' | 'worsening';

  // Performance
  reliabilityScore: number; // 0-100
  qualityScore: number; // 0-100
  performanceIssues: string[];

  // Opportunities
  negotiationOpportunities: NegotiationOpportunity[];
  estimatedSavings: number;

  // Recommendations
  negotiationStrategy: string;
  targetDiscount: number; // percentage
  alternativeOptions: string[];
}

export interface LeverageFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number; // 0-100
  description: string;
}

export interface NegotiationOpportunity {
  type: 'volume_discount' | 'contract_terms' | 'payment_terms' | 'consolidation' | 'multi_year';
  description: string;
  potentialSavings: number;
  likelihood: 'high' | 'medium' | 'low';
  requirements: string[];
}

// Transportation Cost Optimization
export interface TransportationOptimization {
  currentCosts: number;
  optimizedCosts: number;
  savings: number;
  savingsPercentage: number;

  // Optimization strategies
  strategies: TransportationStrategy[];

  // Route consolidation
  routeConsolidation: RouteConsolidation[];

  // Mode optimization
  modeOptimization: ModeOptimization[];

  // Recommendations
  recommendations: string[];
}

export interface TransportationStrategy {
  strategy: string;
  description: string;
  savings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  feasibility: 'high' | 'medium' | 'low';
}

export interface RouteConsolidation {
  route: string;
  currentDeliveries: number;
  consolidatedDeliveries: number;
  currentCost: number;
  consolidatedCost: number;
  savings: number;
}

export interface ModeOptimization {
  route: string;
  currentMode: string;
  recommendedMode: string;
  currentCost: number;
  recommendedCost: number;
  savings: number;
  tradeoffs: string[];
}

// Total Cost of Ownership (TCO)
export interface TCOAnalysis {
  materialId: string;
  materialName: string;

  // Acquisition costs
  unitPrice: number;
  orderingCost: number;
  shippingCost: number;
  inspectionCost: number;
  totalAcquisitionCost: number;

  // Holding costs
  storageCost: number;
  insuranceCost: number;
  obsolescenceCost: number;
  totalHoldingCost: number;

  // Usage costs
  handlingCost: number;
  wasteCost: number;
  defectCost: number;
  totalUsageCost: number;

  // Total
  totalCostOfOwnership: number;
  tcoPerUnit: number;

  // Comparison
  supplierComparison: TCOSupplierComparison[];
  lowestTCOSupplier: string;
  potentialSavings: number;

  // Hidden costs
  hiddenCosts: HiddenCost[];
}

export interface TCOSupplierComparison {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  tco: number;
  ranking: number;
  notes: string[];
}

export interface HiddenCost {
  category: string;
  description: string;
  estimatedCost: number;
  frequency: 'one-time' | 'recurring' | 'per-order';
}

// Storage Cost Analysis
export interface StorageOptimization {
  currentCosts: number;
  optimizedCosts: number;
  savings: number;
  savingsPercentage: number;

  // Current utilization
  totalCapacity: number; // cubic meters
  usedCapacity: number;
  utilizationRate: number; // percentage

  // Optimization opportunities
  opportunities: StorageOpportunity[];

  // Recommendations
  recommendations: string[];
}

export interface StorageOpportunity {
  type: 'space_optimization' | 'inventory_reduction' | 'location_consolidation' | 'just_in_time';
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  spaceFreed?: number; // cubic meters
  implementationEffort: 'low' | 'medium' | 'high';
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CostOptimizationService {
  // -------------------------------------------------------------------------
  // Main Optimization Analysis
  // -------------------------------------------------------------------------

  /**
   * Perform comprehensive cost optimization analysis
   */
  static performCostOptimization(
    currentCosts: CostBreakdown,
    procurementData: any,
    supplierData: any,
    transportationData: any,
    storageData: any
  ): CostOptimizationResult {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);

    // Identify optimization opportunities
    const opportunities = this.identifyOptimizationOpportunities(currentCosts);

    // Generate recommendations
    const recommendations = this.generateRecommendations(opportunities, currentCosts);

    // Calculate total savings
    const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
    const implementationCost = recommendations.reduce((sum, rec) => {
      const effort = rec.effort === 'low' ? 1000 : rec.effort === 'medium' ? 5000 : 15000;
      return sum + effort;
    }, 0);
    const netSavings = totalPotentialSavings - implementationCost;
    const roi = implementationCost > 0 ? (netSavings / implementationCost) * 100 : 0;

    // Categorize recommendations
    const quickWins = recommendations.filter(
      r => r.effort === 'low' && r.expectedSavings > 5000
    );
    const strategicInitiatives = recommendations.filter(
      r => r.effort === 'high' && r.expectedSavings > 20000
    );

    return {
      generatedAt: now.toISOString(),
      period: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
      currentCosts,
      opportunities,
      recommendations,
      totalPotentialSavings,
      implementationCost,
      netSavings,
      roi,
      quickWins,
      strategicInitiatives,
    };
  }

  /**
   * Optimize procurement bundles for volume discounts
   */
  static optimizeProcurementBundles(
    materials: Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      unit: string;
      unitCost: number;
      supplierId: string;
      supplierName: string;
    }>,
    volumeDiscountTiers: VolumeDiscount[]
  ): ProcurementBundle[] {
    // Group materials by supplier
    const supplierGroups = new Map<string, typeof materials>();
    materials.forEach(m => {
      const key = m.supplierId;
      if (!supplierGroups.has(key)) {
        supplierGroups.set(key, []);
      }
      supplierGroups.get(key)!.push(m);
    });

    const bundles: ProcurementBundle[] = [];

    supplierGroups.forEach((supplierMaterials, supplierId) => {
      if (supplierMaterials.length === 0) return;

      const supplierName = supplierMaterials[0].supplierName;

      // Calculate unbundled cost
      const unbundledCost = supplierMaterials.reduce(
        (sum, m) => sum + m.quantity * m.unitCost,
        0
      );

      // Calculate total quantity for volume discount tier
      const totalQuantity = supplierMaterials.reduce((sum, m) => sum + m.quantity, 0);

      // Find applicable tier
      const applicableTier = this.findVolumeTier(totalQuantity, volumeDiscountTiers);
      const discountPercentage = applicableTier?.discountPercentage || 0;

      // Calculate bundled cost with discount
      const bundledCost = unbundledCost * (1 - discountPercentage / 100);
      const savings = unbundledCost - bundledCost;
      const savingsPercentage = (savings / unbundledCost) * 100;

      // Calculate shipping consolidation savings (estimate 15% of shipping)
      const shippingCostSavings = unbundledCost * 0.03; // Assume 3% of total is shipping, save 50%

      // Build bundle materials
      const bundleMaterials: BundleMaterial[] = supplierMaterials.map(m => ({
        materialId: m.materialId,
        materialName: m.materialName,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost,
        totalCost: m.quantity * m.unitCost,
        bundleDiscount: discountPercentage,
      }));

      // Check feasibility
      const feasible = supplierMaterials.length >= 3; // Need at least 3 materials to bundle
      const constraints: string[] = [];
      if (!feasible) {
        constraints.push('Insufficient materials for bundling (minimum 3 required)');
      }

      // Recommendations
      const recommendations: string[] = [];
      if (feasible) {
        recommendations.push('Consolidate orders to single delivery');
        recommendations.push('Negotiate volume discount terms');
        if (applicableTier && applicableTier.tier < volumeDiscountTiers.length - 1) {
          const nextTier = volumeDiscountTiers[applicableTier.tier];
          recommendations.push(
            `Consider increasing order to ${nextTier.minQuantity} units for ${nextTier.discountPercentage}% discount`
          );
        }
      }

      bundles.push({
        id: `bundle-${supplierId}`,
        name: `${supplierName} Bundle`,
        materials: bundleMaterials,
        supplierId,
        supplierName,
        unbundledCost,
        bundledCost,
        savings: savings + shippingCostSavings,
        savingsPercentage,
        volumeDiscounts: volumeDiscountTiers,
        currentTier: applicableTier?.tier || 0,
        nextTierSavings: applicableTier && applicableTier.tier < volumeDiscountTiers.length - 1
          ? volumeDiscountTiers[applicableTier.tier].discountPercentage - discountPercentage
          : undefined,
        shippingConsolidation: true,
        shippingCostSavings,
        feasible,
        constraints,
        recommendations,
      });
    });

    return bundles.sort((a, b) => b.savings - a.savings);
  }

  /**
   * Analyze supplier for negotiation opportunities
   */
  static analyzeSupplierNegotiation(
    supplierId: string,
    supplierName: string,
    annualSpend: number,
    materialCount: number,
    orderFrequency: number,
    averageOrderValue: number,
    marketAveragePrices: number[],
    supplierPrices: number[],
    reliabilityScore: number,
    qualityScore: number
  ): SupplierNegotiationAnalysis {
    // Calculate leverage score
    const leverageFactors: LeverageFactor[] = [];

    // High spend = high leverage
    if (annualSpend > 100000) {
      leverageFactors.push({
        factor: 'High Annual Spend',
        impact: 'positive',
        weight: 90,
        description: `$${(annualSpend / 1000).toFixed(0)}K annual spend provides strong negotiation position`,
      });
    } else if (annualSpend > 50000) {
      leverageFactors.push({
        factor: 'Moderate Annual Spend',
        impact: 'positive',
        weight: 60,
        description: `$${(annualSpend / 1000).toFixed(0)}K annual spend provides some negotiation leverage`,
      });
    } else {
      leverageFactors.push({
        factor: 'Low Annual Spend',
        impact: 'negative',
        weight: 30,
        description: 'Limited negotiation leverage due to lower spend volume',
      });
    }

    // Multiple materials = consolidation opportunity
    if (materialCount > 5) {
      leverageFactors.push({
        factor: 'Multi-Material Relationship',
        impact: 'positive',
        weight: 70,
        description: `${materialCount} materials provide consolidation opportunities`,
      });
    }

    // High order frequency = relationship value
    if (orderFrequency > 4) {
      leverageFactors.push({
        factor: 'High Order Frequency',
        impact: 'positive',
        weight: 60,
        description: 'Frequent orders demonstrate reliable customer relationship',
      });
    }

    const leverageScore = leverageFactors.reduce((sum, f) => sum + f.weight, 0) / leverageFactors.length;

    // Pricing competitiveness
    const avgMarketPrice = this.calculateMean(marketAveragePrices);
    const avgSupplierPrice = this.calculateMean(supplierPrices);
    const vsMarketAverage = ((avgSupplierPrice - avgMarketPrice) / avgMarketPrice) * 100;

    const pricingCompetitiveness: 'excellent' | 'good' | 'average' | 'poor' =
      vsMarketAverage < -10 ? 'excellent' :
      vsMarketAverage < 0 ? 'good' :
      vsMarketAverage < 10 ? 'average' :
      'poor';

    // Price trend (mock)
    const priceTrend: 'improving' | 'stable' | 'worsening' = 'stable';

    // Performance issues
    const performanceIssues: string[] = [];
    if (reliabilityScore < 80) {
      performanceIssues.push('Below-target delivery reliability');
    }
    if (qualityScore < 85) {
      performanceIssues.push('Quality concerns reported');
    }

    // Negotiation opportunities
    const negotiationOpportunities: NegotiationOpportunity[] = [];

    if (annualSpend > 50000) {
      negotiationOpportunities.push({
        type: 'volume_discount',
        description: 'Negotiate tiered volume discounts based on annual spend',
        potentialSavings: annualSpend * 0.05,
        likelihood: 'high',
        requirements: ['Commit to annual volume', 'Consolidate orders'],
      });
    }

    if (materialCount > 3) {
      negotiationOpportunities.push({
        type: 'consolidation',
        description: 'Bundle multiple materials for better pricing',
        potentialSavings: annualSpend * 0.03,
        likelihood: 'medium',
        requirements: ['Combine material orders', 'Single delivery schedule'],
      });
    }

    negotiationOpportunities.push({
      type: 'payment_terms',
      description: 'Negotiate extended payment terms or early payment discounts',
      potentialSavings: annualSpend * 0.02,
      likelihood: 'high',
      requirements: ['Demonstrate reliable payment history'],
    });

    if (orderFrequency > 6) {
      negotiationOpportunities.push({
        type: 'multi_year',
        description: 'Multi-year contract with price lock',
        potentialSavings: annualSpend * 0.08,
        likelihood: 'medium',
        requirements: ['Long-term commitment', 'Volume guarantee'],
      });
    }

    const estimatedSavings = negotiationOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);

    // Negotiation strategy
    const negotiationStrategy =
      leverageScore > 70
        ? 'Aggressive negotiation with volume commitments and multi-material bundling'
        : leverageScore > 50
        ? 'Moderate negotiation focusing on relationship value and consistent volume'
        : 'Collaborative approach emphasizing long-term partnership and growth potential';

    const targetDiscount = Math.min(15, leverageScore / 10);

    // Alternative options
    const alternativeOptions: string[] = [];
    if (pricingCompetitiveness === 'poor') {
      alternativeOptions.push('Research alternative suppliers for price comparison');
    }
    if (performanceIssues.length > 0) {
      alternativeOptions.push('Develop backup supplier relationships');
    }
    alternativeOptions.push('Consider in-house production for high-volume materials');

    return {
      supplierId,
      supplierName,
      currentSpend: annualSpend,
      materialCount,
      orderFrequency,
      averageOrderValue,
      leverageScore,
      leverageFactors,
      pricingCompetitiveness,
      vsMarketAverage,
      priceTrend,
      reliabilityScore,
      qualityScore,
      performanceIssues,
      negotiationOpportunities,
      estimatedSavings,
      negotiationStrategy,
      targetDiscount,
      alternativeOptions,
    };
  }

  /**
   * Optimize transportation costs
   */
  static optimizeTransportationCosts(
    currentRoutes: Array<{
      route: string;
      deliveries: number;
      cost: number;
      mode: string;
    }>
  ): TransportationOptimization {
    const currentCosts = currentRoutes.reduce((sum, r) => sum + r.cost, 0);

    // Route consolidation opportunities
    const routeConsolidation: RouteConsolidation[] = currentRoutes
      .filter(r => r.deliveries > 2)
      .map(r => {
        const consolidatedDeliveries = Math.ceil(r.deliveries / 2);
        const consolidationFactor = 0.7; // 30% savings from consolidation
        const consolidatedCost = r.cost * consolidationFactor;
        return {
          route: r.route,
          currentDeliveries: r.deliveries,
          consolidatedDeliveries,
          currentCost: r.cost,
          consolidatedCost,
          savings: r.cost - consolidatedCost,
        };
      });

    // Mode optimization (e.g., truck vs rail)
    const modeOptimization: ModeOptimization[] = currentRoutes
      .filter(r => r.cost > 5000 && r.mode === 'truck')
      .map(r => ({
        route: r.route,
        currentMode: r.mode,
        recommendedMode: 'rail',
        currentCost: r.cost,
        recommendedCost: r.cost * 0.75, // 25% savings with rail
        savings: r.cost * 0.25,
        tradeoffs: ['Longer transit time', 'Less flexible scheduling', 'Lower carbon footprint'],
      }));

    // Transportation strategies
    const strategies: TransportationStrategy[] = [
      {
        strategy: 'Route Consolidation',
        description: 'Combine multiple deliveries to same destination',
        savings: routeConsolidation.reduce((sum, rc) => sum + rc.savings, 0),
        implementationEffort: 'low',
        feasibility: 'high',
      },
      {
        strategy: 'Mode Optimization',
        description: 'Use rail or sea freight for long-distance bulk deliveries',
        savings: modeOptimization.reduce((sum, mo) => sum + mo.savings, 0),
        implementationEffort: 'medium',
        feasibility: 'medium',
      },
      {
        strategy: 'Backhaul Optimization',
        description: 'Utilize return trips to reduce empty mileage',
        savings: currentCosts * 0.1,
        implementationEffort: 'medium',
        feasibility: 'medium',
      },
    ];

    const totalStrategySavings = strategies.reduce((sum, s) => sum + s.savings, 0);
    const optimizedCosts = currentCosts - totalStrategySavings;
    const savings = totalStrategySavings;
    const savingsPercentage = (savings / currentCosts) * 100;

    const recommendations = [
      'Implement delivery scheduling software to optimize routes',
      'Negotiate volume discounts with freight carriers',
      'Consider dedicated fleet for high-frequency routes',
      'Use cross-docking to reduce handling costs',
    ];

    return {
      currentCosts,
      optimizedCosts,
      savings,
      savingsPercentage,
      strategies,
      routeConsolidation,
      modeOptimization,
      recommendations,
    };
  }

  /**
   * Calculate Total Cost of Ownership for a material
   */
  static calculateTCO(
    materialId: string,
    materialName: string,
    unitPrice: number,
    annualQuantity: number,
    supplierOptions: Array<{
      supplierId: string;
      supplierName: string;
      unitPrice: number;
      shippingCost: number;
      leadTime: number;
      reliability: number;
      qualityScore: number;
    }>
  ): TCOAnalysis {
    // Estimate costs (percentages of unit price)
    const orderingCost = 50; // Fixed cost per order
    const shippingCost = unitPrice * 0.05 * annualQuantity;
    const inspectionCost = unitPrice * 0.02 * annualQuantity;
    const totalAcquisitionCost = unitPrice * annualQuantity + orderingCost + shippingCost + inspectionCost;

    // Holding costs (annual)
    const storageCost = unitPrice * annualQuantity * 0.15; // 15% of inventory value
    const insuranceCost = unitPrice * annualQuantity * 0.02; // 2% of inventory value
    const obsolescenceCost = unitPrice * annualQuantity * 0.05; // 5% obsolescence risk
    const totalHoldingCost = storageCost + insuranceCost + obsolescenceCost;

    // Usage costs
    const handlingCost = unitPrice * 0.03 * annualQuantity;
    const wasteCost = unitPrice * 0.02 * annualQuantity; // 2% waste
    const defectCost = unitPrice * 0.01 * annualQuantity; // 1% defect rate
    const totalUsageCost = handlingCost + wasteCost + defectCost;

    // Total
    const totalCostOfOwnership = totalAcquisitionCost + totalHoldingCost + totalUsageCost;
    const tcoPerUnit = totalCostOfOwnership / annualQuantity;

    // Supplier comparison
    const supplierComparison: TCOSupplierComparison[] = supplierOptions.map(s => {
      const sAcquisition = s.unitPrice * annualQuantity + orderingCost + s.shippingCost;
      const sHolding = s.unitPrice * annualQuantity * 0.15 * (s.leadTime / 30); // Adjusted for lead time
      const sUsage =
        s.unitPrice * annualQuantity * 0.03 + // handling
        s.unitPrice * annualQuantity * ((100 - s.qualityScore) / 1000); // quality-based waste
      const sTCO = sAcquisition + sHolding + sUsage;

      const notes: string[] = [];
      if (s.reliability < 80) notes.push('Reliability concerns');
      if (s.qualityScore < 90) notes.push('Quality issues may increase waste');
      if (s.leadTime > 14) notes.push('Long lead time increases holding costs');

      return {
        supplierId: s.supplierId,
        supplierName: s.supplierName,
        unitPrice: s.unitPrice,
        tco: sTCO,
        ranking: 0, // Will be set after sorting
        notes,
      };
    });

    // Sort and rank
    supplierComparison.sort((a, b) => a.tco - b.tco);
    supplierComparison.forEach((s, i) => (s.ranking = i + 1));

    const lowestTCOSupplier = supplierComparison[0]?.supplierName || 'N/A';
    const potentialSavings =
      supplierComparison.length > 1
        ? totalCostOfOwnership - supplierComparison[0].tco
        : 0;

    // Hidden costs
    const hiddenCosts: HiddenCost[] = [
      {
        category: 'Quality Issues',
        description: 'Costs from defective materials and rework',
        estimatedCost: defectCost,
        frequency: 'recurring',
      },
      {
        category: 'Expedited Shipping',
        description: 'Rush deliveries due to stockouts',
        estimatedCost: shippingCost * 0.2,
        frequency: 'per-order',
      },
      {
        category: 'Storage Inefficiency',
        description: 'Excess space for slow-moving inventory',
        estimatedCost: storageCost * 0.15,
        frequency: 'recurring',
      },
    ];

    return {
      materialId,
      materialName,
      unitPrice,
      orderingCost,
      shippingCost,
      inspectionCost,
      totalAcquisitionCost,
      storageCost,
      insuranceCost,
      obsolescenceCost,
      totalHoldingCost,
      handlingCost,
      wasteCost,
      defectCost,
      totalUsageCost,
      totalCostOfOwnership,
      tcoPerUnit,
      supplierComparison,
      lowestTCOSupplier,
      potentialSavings,
      hiddenCosts,
    };
  }

  /**
   * Optimize storage costs
   */
  static optimizeStorageCosts(
    totalCapacity: number,
    usedCapacity: number,
    currentCosts: number,
    inventoryItems: Array<{
      materialId: string;
      materialName: string;
      quantity: number;
      turnoverRate: number;
      spaceRequired: number;
    }>
  ): StorageOptimization {
    const utilizationRate = (usedCapacity / totalCapacity) * 100;

    // Identify opportunities
    const opportunities: StorageOpportunity[] = [];

    // Space optimization - better layout
    if (utilizationRate < 70) {
      opportunities.push({
        type: 'space_optimization',
        description: 'Reorganize storage layout to improve space utilization',
        currentCost: currentCosts,
        optimizedCost: currentCosts * 0.85,
        savings: currentCosts * 0.15,
        spaceFreed: totalCapacity * 0.15,
        implementationEffort: 'medium',
      });
    }

    // Inventory reduction - focus on slow movers
    const slowMovers = inventoryItems.filter(i => i.turnoverRate < 4);
    if (slowMovers.length > 0) {
      const slowMoverSpace = slowMovers.reduce((sum, i) => sum + i.spaceRequired, 0);
      opportunities.push({
        type: 'inventory_reduction',
        description: 'Reduce stock of slow-moving items',
        currentCost: currentCosts,
        optimizedCost: currentCosts * 0.9,
        savings: currentCosts * 0.1,
        spaceFreed: slowMoverSpace * 0.5,
        implementationEffort: 'low',
      });
    }

    // Location consolidation
    if (utilizationRate < 60) {
      opportunities.push({
        type: 'location_consolidation',
        description: 'Consolidate to fewer storage locations',
        currentCost: currentCosts,
        optimizedCost: currentCosts * 0.75,
        savings: currentCosts * 0.25,
        spaceFreed: totalCapacity * 0.4,
        implementationEffort: 'high',
      });
    }

    // Just-in-time for high-turnover items
    const fastMovers = inventoryItems.filter(i => i.turnoverRate > 12);
    if (fastMovers.length > 0) {
      opportunities.push({
        type: 'just_in_time',
        description: 'Implement JIT delivery for fast-moving items',
        currentCost: currentCosts,
        optimizedCost: currentCosts * 0.88,
        savings: currentCosts * 0.12,
        spaceFreed: fastMovers.reduce((sum, i) => sum + i.spaceRequired, 0) * 0.7,
        implementationEffort: 'medium',
      });
    }

    const totalSavings = opportunities.reduce((sum, opp) => sum + opp.savings, 0);
    const optimizedCosts = currentCosts - totalSavings;
    const savingsPercentage = (totalSavings / currentCosts) * 100;

    const recommendations = [
      'Implement ABC analysis to prioritize storage of high-value items',
      'Use vertical space more effectively with taller racking',
      'Reduce safety stock levels for predictable demand items',
      'Negotiate better rates with current facility or consider alternatives',
    ];

    return {
      currentCosts,
      optimizedCosts,
      savings: totalSavings,
      savingsPercentage,
      totalCapacity,
      usedCapacity,
      utilizationRate,
      opportunities,
      recommendations,
    };
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private static identifyOptimizationOpportunities(
    currentCosts: CostBreakdown
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    // Bulk purchasing opportunity
    opportunities.push({
      id: 'bulk-1',
      strategy: 'bulk_purchasing',
      savingsType: 'volume_discount',
      title: 'Volume Discount Optimization',
      description: 'Consolidate purchases to reach higher volume discount tiers',
      potentialSavings: currentCosts.materialCosts * 0.05,
      savingsPercentage: 5,
      feasibility: 'high',
      implementationEffort: 'low',
      timeToImplement: '2-4 weeks',
      impactScore: 75,
      riskLevel: 'low',
      affectedMaterials: [],
      affectedSuppliers: [],
    });

    // Transportation optimization
    if (currentCosts.transportationCosts > 10000) {
      opportunities.push({
        id: 'trans-1',
        strategy: 'transportation_optimization',
        savingsType: 'transportation',
        title: 'Route Consolidation',
        description: 'Consolidate delivery routes to reduce transportation costs',
        potentialSavings: currentCosts.transportationCosts * 0.2,
        savingsPercentage: 20,
        feasibility: 'high',
        implementationEffort: 'medium',
        timeToImplement: '4-6 weeks',
        impactScore: 80,
        riskLevel: 'low',
        affectedMaterials: [],
        affectedSuppliers: [],
      });
    }

    // Storage reduction
    if (currentCosts.storageCosts > 5000) {
      opportunities.push({
        id: 'stor-1',
        strategy: 'storage_reduction',
        savingsType: 'storage',
        title: 'Inventory Level Optimization',
        description: 'Reduce excess inventory to lower storage costs',
        potentialSavings: currentCosts.storageCosts * 0.15,
        savingsPercentage: 15,
        feasibility: 'medium',
        implementationEffort: 'medium',
        timeToImplement: '6-8 weeks',
        impactScore: 65,
        riskLevel: 'medium',
        affectedMaterials: [],
        affectedSuppliers: [],
      });
    }

    return opportunities;
  }

  private static generateRecommendations(
    opportunities: OptimizationOpportunity[],
    currentCosts: CostBreakdown
  ): CostRecommendation[] {
    return opportunities.map((opp, index) => ({
      id: `rec-${index + 1}`,
      priority: opp.potentialSavings > 20000 ? 'high' : opp.potentialSavings > 10000 ? 'medium' : 'low',
      category: opp.strategy,
      action: opp.title,
      rationale: opp.description,
      expectedSavings: opp.potentialSavings,
      steps: [
        'Analyze current state and identify specific opportunities',
        'Develop implementation plan',
        'Execute changes',
        'Monitor results and adjust',
      ],
      timeline: opp.timeToImplement,
      effort: opp.implementationEffort,
      resources: ['Logistics team', 'Procurement team'],
      dependencies: [],
      prerequisites: ['Management approval', 'Budget allocation'],
      successMetrics: ['Cost reduction achieved', 'Implementation completed on time'],
    }));
  }

  private static findVolumeTier(
    quantity: number,
    tiers: VolumeDiscount[]
  ): VolumeDiscount | null {
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (quantity >= tiers[i].minQuantity) {
        return tiers[i];
      }
    }
    return null;
  }

  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
