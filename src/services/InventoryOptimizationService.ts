/**
 * InventoryOptimizationService - Week 5
 *
 * Multi-location inventory management with:
 * - ABC analysis for stock categorization
 * - Economic Order Quantity (EOQ) calculations
 * - Safety stock optimization
 * - Inter-site transfer management
 * - Stock aging and obsolescence tracking
 * - FIFO/LIFO costing methods
 * - Inventory valuation
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' | 'obsolete';

export type ABCCategory = 'A' | 'B' | 'C';

export type CostingMethod = 'FIFO' | 'LIFO' | 'WAC'; // Weighted Average Cost

export type TransferStatus = 'requested' | 'approved' | 'in_transit' | 'received' | 'rejected';

export interface InventoryLocation {
  id: string;
  name: string;
  type: 'warehouse' | 'site' | 'yard' | 'vendor';
  address: string;

  // Capacity
  totalCapacity: number; // cubic meters
  usedCapacity: number;
  availableCapacity: number;

  // Operational
  managerId: string;
  managerName: string;
  operatingCost: number; // per month

  // Status
  isActive: boolean;
  hasClimateControl: boolean;
  hasSecurity: boolean;
}

export interface InventoryItem {
  id: string;
  materialId: string;
  materialName: string;
  category: string;

  // Location
  locationId: string;
  locationName: string;

  // Quantity
  quantity: number;
  unit: string;
  reservedQuantity: number; // Allocated to projects
  availableQuantity: number; // Available for use

  // Status
  status: InventoryStatus;

  // Costing
  unitCost: number;
  totalValue: number;
  costingMethod: CostingMethod;

  // Storage
  batchNumber?: string;
  expiryDate?: Date;
  receivedDate: Date;
  lastUpdated: Date;

  // ABC Analysis
  abcCategory?: ABCCategory;
  annualDemand?: number;
  annualValue?: number;

  // Thresholds
  reorderLevel: number;
  safetyStock: number;
  maxStock: number;

  // Aging
  ageInDays: number;
  turnoverRate: number; // times per year
}

export interface StockMovement {
  id: string;
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'return';

  // Material
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;

  // Location
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationId?: string;
  toLocationName?: string;

  // Transaction
  transactionDate: Date;
  referenceNumber: string;

  // Project/User
  projectId?: string;
  projectName?: string;
  userId: string;
  userName: string;

  // Costing
  unitCost: number;
  totalCost: number;

  notes?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;

  // Material
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;

  // Locations
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;

  // Status
  status: TransferStatus;

  // Dates
  requestedDate: Date;
  approvedDate?: Date;
  shippedDate?: Date;
  receivedDate?: Date;

  // People
  requestedBy: string;
  approvedBy?: string;

  // Details
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  transportCost: number;

  notes?: string;
}

export interface ABCAnalysisResult {
  materialId: string;
  materialName: string;
  category: ABCCategory;

  // Metrics
  annualDemand: number;
  unitCost: number;
  annualValue: number;

  // Percentages
  percentOfTotalValue: number;
  cumulativePercent: number;

  // Recommendations
  recommendedReorderLevel: number;
  recommendedSafetyStock: number;
  reviewFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface EOQCalculation {
  materialId: string;
  materialName: string;

  // Input parameters
  annualDemand: number;
  orderingCost: number;
  holdingCost: number; // per unit per year

  // EOQ results
  economicOrderQuantity: number;
  numberOfOrders: number; // per year
  timeBetweenOrders: number; // days

  // Costs
  annualOrderingCost: number;
  annualHoldingCost: number;
  totalAnnualCost: number;

  // With safety stock
  reorderPoint: number;
  safetyStock: number;
  averageInventory: number;
}

export interface SafetyStockCalculation {
  materialId: string;
  materialName: string;

  // Demand parameters
  averageDailyDemand: number;
  maxDailyDemand: number;
  standardDeviation: number;

  // Lead time parameters
  averageLeadTimeDays: number;
  maxLeadTimeDays: number;

  // Service level
  serviceLevel: number; // 0-1 (e.g., 0.95 = 95%)
  zScore: number; // From service level

  // Results
  safetyStock: number;
  reorderPoint: number;
  maxInventoryLevel: number;
}

export interface InventoryValuation {
  locationId: string;
  locationName: string;

  // Summary
  totalItems: number;
  totalQuantity: number;
  totalValue: number;

  // By category
  categoryBreakdown: Array<{
    category: string;
    quantity: number;
    value: number;
    percentOfTotal: number;
  }>;

  // By status
  statusBreakdown: Array<{
    status: InventoryStatus;
    quantity: number;
    value: number;
  }>;

  // By ABC
  abcBreakdown: Array<{
    category: ABCCategory;
    itemCount: number;
    value: number;
    percentOfTotal: number;
  }>;

  // Aging
  obsoleteValue: number;
  slowMovingValue: number;
  fastMovingValue: number;
}

export interface InventoryHealth {
  // Turnover
  overallTurnoverRate: number; // times per year
  targetTurnoverRate: number;
  turnoverHealth: 'good' | 'fair' | 'poor';

  // Stock levels
  stockoutRisk: number; // 0-100
  overstockRisk: number; // 0-100

  // Efficiency
  carryingCost: number; // total annual
  carryingCostPercentage: number; // of inventory value

  // Quality
  obsolescenceRate: number; // percentage
  accuracyRate: number; // percentage

  // Performance score
  overallHealthScore: number; // 0-100

  // Recommendations
  recommendations: Array<{
    type: 'reduce' | 'increase' | 'transfer' | 'dispose';
    materialId: string;
    materialName: string;
    locationId: string;
    reason: string;
    expectedImpact: string;
  }>;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class InventoryOptimizationService {
  /**
   * Perform ABC analysis on inventory items
   */
  static performABCAnalysis(
    items: Array<{
      materialId: string;
      materialName: string;
      annualDemand: number;
      unitCost: number;
    }>
  ): ABCAnalysisResult[] {
    // Calculate annual value for each item
    const itemsWithValue = items.map(item => ({
      ...item,
      annualValue: item.annualDemand * item.unitCost,
    }));

    // Sort by annual value (descending)
    itemsWithValue.sort((a, b) => b.annualValue - a.annualValue);

    // Calculate total value
    const totalValue = itemsWithValue.reduce((sum, item) => sum + item.annualValue, 0);

    // Categorize items
    let cumulativeValue = 0;
    const results: ABCAnalysisResult[] = [];

    itemsWithValue.forEach(item => {
      cumulativeValue += item.annualValue;
      const cumulativePercent = (cumulativeValue / totalValue) * 100;

      // ABC classification
      let category: ABCCategory;
      let reviewFrequency: 'daily' | 'weekly' | 'monthly';
      let safetyStockMultiplier: number;

      if (cumulativePercent <= 80) {
        category = 'A'; // Top 80% of value
        reviewFrequency = 'daily';
        safetyStockMultiplier = 1.5;
      } else if (cumulativePercent <= 95) {
        category = 'B'; // Next 15% of value
        reviewFrequency = 'weekly';
        safetyStockMultiplier = 1.2;
      } else {
        category = 'C'; // Last 5% of value
        reviewFrequency = 'monthly';
        safetyStockMultiplier = 1.0;
      }

      // Calculate recommended levels
      const dailyDemand = item.annualDemand / 365;
      const leadTimeDays = 7; // Assume 7 days lead time
      const safetyStock = Math.ceil(dailyDemand * leadTimeDays * safetyStockMultiplier);
      const reorderLevel = Math.ceil(dailyDemand * leadTimeDays) + safetyStock;

      results.push({
        materialId: item.materialId,
        materialName: item.materialName,
        category,
        annualDemand: item.annualDemand,
        unitCost: item.unitCost,
        annualValue: item.annualValue,
        percentOfTotalValue: (item.annualValue / totalValue) * 100,
        cumulativePercent,
        recommendedReorderLevel: reorderLevel,
        recommendedSafetyStock: safetyStock,
        reviewFrequency,
      });
    });

    return results;
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   */
  static calculateEOQ(
    materialId: string,
    materialName: string,
    annualDemand: number,
    orderingCost: number, // Cost per order
    holdingCostPercentage: number, // Percentage of unit cost per year
    unitCost: number
  ): EOQCalculation {
    const holdingCost = unitCost * (holdingCostPercentage / 100);

    // EOQ formula: sqrt((2 * D * S) / H)
    // D = Annual demand, S = Ordering cost, H = Holding cost per unit
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    const economicOrderQuantity = Math.ceil(eoq);

    // Number of orders per year
    const numberOfOrders = Math.ceil(annualDemand / economicOrderQuantity);

    // Time between orders (days)
    const timeBetweenOrders = Math.floor(365 / numberOfOrders);

    // Costs
    const annualOrderingCost = numberOfOrders * orderingCost;
    const averageInventory = economicOrderQuantity / 2;
    const annualHoldingCost = averageInventory * holdingCost;
    const totalAnnualCost = annualOrderingCost + annualHoldingCost;

    // With safety stock (assume 7 days lead time, 95% service level)
    const dailyDemand = annualDemand / 365;
    const leadTimeDays = 7;
    const safetyStock = Math.ceil(dailyDemand * leadTimeDays * 0.5); // 50% buffer
    const reorderPoint = Math.ceil(dailyDemand * leadTimeDays) + safetyStock;

    return {
      materialId,
      materialName,
      annualDemand,
      orderingCost,
      holdingCost,
      economicOrderQuantity,
      numberOfOrders,
      timeBetweenOrders,
      annualOrderingCost,
      annualHoldingCost,
      totalAnnualCost,
      reorderPoint,
      safetyStock,
      averageInventory: averageInventory + safetyStock,
    };
  }

  /**
   * Calculate safety stock levels
   */
  static calculateSafetyStock(
    materialId: string,
    materialName: string,
    averageDailyDemand: number,
    demandStdDev: number,
    averageLeadTimeDays: number,
    leadTimeStdDev: number,
    serviceLevel: number = 0.95 // 95% service level
  ): SafetyStockCalculation {
    // Z-score for service level (approximation)
    const zScore = this.getZScore(serviceLevel);

    // Safety stock formula considering demand and lead time variability
    // SS = Z * sqrt((avg_lead_time * demand_variance) + (avg_demand^2 * lead_time_variance))
    const demandVariance = demandStdDev * demandStdDev;
    const leadTimeVariance = leadTimeStdDev * leadTimeStdDev;

    const safetyStock = Math.ceil(
      zScore * Math.sqrt(
        (averageLeadTimeDays * demandVariance) +
        (averageDailyDemand * averageDailyDemand * leadTimeVariance)
      )
    );

    // Reorder point = (Average daily demand * Average lead time) + Safety stock
    const reorderPoint = Math.ceil(averageDailyDemand * averageLeadTimeDays) + safetyStock;

    // Max inventory (with EOQ)
    const eoqResult = this.calculateEOQ(
      materialId,
      materialName,
      averageDailyDemand * 365,
      500, // Assume ordering cost
      20, // Assume 20% holding cost
      100 // Assume unit cost
    );

    const maxInventoryLevel = reorderPoint + eoqResult.economicOrderQuantity;

    // Calculate max demand and lead time
    const maxDailyDemand = averageDailyDemand + (2 * demandStdDev);
    const maxLeadTimeDays = averageLeadTimeDays + (2 * leadTimeStdDev);

    return {
      materialId,
      materialName,
      averageDailyDemand,
      maxDailyDemand,
      standardDeviation: demandStdDev,
      averageLeadTimeDays,
      maxLeadTimeDays,
      serviceLevel,
      zScore,
      safetyStock,
      reorderPoint,
      maxInventoryLevel,
    };
  }

  /**
   * Calculate inventory valuation for a location
   */
  static calculateInventoryValuation(
    locationId: string,
    locationName: string,
    items: InventoryItem[]
  ): InventoryValuation {
    const locationItems = items.filter(item => item.locationId === locationId);

    // Total summary
    const totalItems = locationItems.length;
    const totalQuantity = locationItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = locationItems.reduce((sum, item) => sum + item.totalValue, 0);

    // Category breakdown
    const categoryMap = new Map<string, { quantity: number; value: number }>();
    locationItems.forEach(item => {
      const existing = categoryMap.get(item.category) || { quantity: 0, value: 0 };
      categoryMap.set(item.category, {
        quantity: existing.quantity + item.quantity,
        value: existing.value + item.totalValue,
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      value: data.value,
      percentOfTotal: (data.value / totalValue) * 100,
    }));

    // Status breakdown
    const statusMap = new Map<InventoryStatus, { quantity: number; value: number }>();
    locationItems.forEach(item => {
      const existing = statusMap.get(item.status) || { quantity: 0, value: 0 };
      statusMap.set(item.status, {
        quantity: existing.quantity + item.quantity,
        value: existing.value + item.totalValue,
      });
    });

    const statusBreakdown = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      quantity: data.quantity,
      value: data.value,
    }));

    // ABC breakdown
    const abcMap = new Map<ABCCategory, { itemCount: number; value: number }>();
    locationItems.forEach(item => {
      if (item.abcCategory) {
        const existing = abcMap.get(item.abcCategory) || { itemCount: 0, value: 0 };
        abcMap.set(item.abcCategory, {
          itemCount: existing.itemCount + 1,
          value: existing.value + item.totalValue,
        });
      }
    });

    const abcBreakdown = Array.from(abcMap.entries()).map(([category, data]) => ({
      category,
      itemCount: data.itemCount,
      value: data.value,
      percentOfTotal: (data.value / totalValue) * 100,
    }));

    // Aging analysis
    const obsoleteValue = locationItems
      .filter(item => item.status === 'obsolete')
      .reduce((sum, item) => sum + item.totalValue, 0);

    const slowMovingValue = locationItems
      .filter(item => item.turnoverRate < 2 && item.status !== 'obsolete')
      .reduce((sum, item) => sum + item.totalValue, 0);

    const fastMovingValue = locationItems
      .filter(item => item.turnoverRate >= 6)
      .reduce((sum, item) => sum + item.totalValue, 0);

    return {
      locationId,
      locationName,
      totalItems,
      totalQuantity,
      totalValue,
      categoryBreakdown,
      statusBreakdown,
      abcBreakdown,
      obsoleteValue,
      slowMovingValue,
      fastMovingValue,
    };
  }

  /**
   * Assess inventory health
   */
  static assessInventoryHealth(
    items: InventoryItem[],
    movements: StockMovement[],
    totalInventoryValue: number
  ): InventoryHealth {
    // Calculate overall turnover rate
    const annualIssues = movements
      .filter(m => m.type === 'issue' && this.isWithinLastYear(m.transactionDate))
      .reduce((sum, m) => sum + m.totalCost, 0);

    const overallTurnoverRate = annualIssues / (totalInventoryValue || 1);
    const targetTurnoverRate = 4; // 4 times per year is healthy

    // Turnover health
    let turnoverHealth: 'good' | 'fair' | 'poor';
    if (overallTurnoverRate >= targetTurnoverRate * 0.8) turnoverHealth = 'good';
    else if (overallTurnoverRate >= targetTurnoverRate * 0.5) turnoverHealth = 'fair';
    else turnoverHealth = 'poor';

    // Stock risks
    const lowStockItems = items.filter(i => i.status === 'low_stock');
    const outOfStockItems = items.filter(i => i.status === 'out_of_stock');
    const stockoutRisk = ((lowStockItems.length + outOfStockItems.length) / items.length) * 100;

    const overstockedItems = items.filter(i => i.status === 'overstocked');
    const overstockRisk = (overstockedItems.length / items.length) * 100;

    // Carrying costs (assume 25% of inventory value annually)
    const carryingCostPercentage = 25;
    const carryingCost = (totalInventoryValue * carryingCostPercentage) / 100;

    // Obsolescence rate
    const obsoleteItems = items.filter(i => i.status === 'obsolete');
    const obsolescenceRate = (obsoleteItems.length / items.length) * 100;

    // Accuracy rate (assume 95% - would be from cycle counts)
    const accuracyRate = 95;

    // Overall health score (0-100)
    const turnoverScore = Math.min((overallTurnoverRate / targetTurnoverRate) * 40, 40);
    const stockoutScore = Math.max(20 - (stockoutRisk / 5), 0);
    const overstockScore = Math.max(20 - (overstockRisk / 5), 0);
    const obsolescenceScore = Math.max(20 - (obsolescenceRate / 2), 0);

    const overallHealthScore = turnoverScore + stockoutScore + overstockScore + obsolescenceScore;

    // Generate recommendations
    const recommendations: InventoryHealth['recommendations'] = [];

    // Overstock recommendations
    overstockedItems.forEach(item => {
      recommendations.push({
        type: 'reduce',
        materialId: item.materialId,
        materialName: item.materialName,
        locationId: item.locationId,
        reason: `Overstocked by ${((item.quantity - item.maxStock) / item.maxStock * 100).toFixed(0)}%`,
        expectedImpact: `Reduce carrying cost by ₹${(item.unitCost * (item.quantity - item.maxStock) * 0.25).toFixed(0)}`,
      });
    });

    // Low stock recommendations
    lowStockItems.slice(0, 5).forEach(item => {
      recommendations.push({
        type: 'increase',
        materialId: item.materialId,
        materialName: item.materialName,
        locationId: item.locationId,
        reason: `Below reorder level (${item.quantity} < ${item.reorderLevel})`,
        expectedImpact: 'Prevent stockout and project delays',
      });
    });

    // Obsolete recommendations
    obsoleteItems.forEach(item => {
      recommendations.push({
        type: 'dispose',
        materialId: item.materialId,
        materialName: item.materialName,
        locationId: item.locationId,
        reason: `Obsolete stock aging ${item.ageInDays} days`,
        expectedImpact: `Free up ₹${item.totalValue.toFixed(0)} worth of space`,
      });
    });

    return {
      overallTurnoverRate,
      targetTurnoverRate,
      turnoverHealth,
      stockoutRisk,
      overstockRisk,
      carryingCost,
      carryingCostPercentage,
      obsolescenceRate,
      accuracyRate,
      overallHealthScore,
      recommendations: recommendations.slice(0, 10), // Top 10
    };
  }

  /**
   * Optimize transfer between locations
   */
  static optimizeTransfer(
    materialId: string,
    requiredQuantity: number,
    targetLocationId: string,
    availableLocations: Array<{
      locationId: string;
      locationName: string;
      availableQuantity: number;
      distance: number; // km from target
      unitCost: number;
    }>
  ): Array<{
    fromLocationId: string;
    fromLocationName: string;
    quantity: number;
    transportCost: number;
    priority: number;
  }> {
    // Sort by priority: distance (closer is better) and available quantity
    const sortedLocations = availableLocations
      .filter(loc => loc.availableQuantity > 0)
      .sort((a, b) => {
        // Priority score: lower distance, higher quantity
        const scoreA = a.distance / Math.max(a.availableQuantity, 1);
        const scoreB = b.distance / Math.max(b.availableQuantity, 1);
        return scoreA - scoreB;
      });

    const transfers: Array<{
      fromLocationId: string;
      fromLocationName: string;
      quantity: number;
      transportCost: number;
      priority: number;
    }> = [];

    let remainingQuantity = requiredQuantity;
    let priority = 1;

    for (const location of sortedLocations) {
      if (remainingQuantity <= 0) break;

      const transferQuantity = Math.min(remainingQuantity, location.availableQuantity);
      const transportCost = location.distance * 5 * transferQuantity; // ₹5 per km per unit

      transfers.push({
        fromLocationId: location.locationId,
        fromLocationName: location.locationName,
        quantity: transferQuantity,
        transportCost,
        priority,
      });

      remainingQuantity -= transferQuantity;
      priority++;
    }

    return transfers;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private static getZScore(serviceLevel: number): number {
    // Approximation of Z-score for common service levels
    const zScoreMap: { [key: number]: number } = {
      0.90: 1.28,
      0.95: 1.65,
      0.97: 1.88,
      0.99: 2.33,
    };

    return zScoreMap[serviceLevel] || 1.65; // Default to 95%
  }

  private static isWithinLastYear(date: Date): boolean {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date >= oneYearAgo;
  }
}

export default InventoryOptimizationService;
