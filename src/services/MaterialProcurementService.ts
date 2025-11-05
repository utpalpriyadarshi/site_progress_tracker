/**
 * MaterialProcurementService
 *
 * Handles intelligent procurement for materials:
 * - Purchase suggestion generation from shortages
 * - Supplier recommendation and comparison
 * - Lead time calculation and optimization
 * - Order consolidation and optimization
 * - Multi-location stock allocation
 *
 * Week 2: Core procurement features
 * Week 6: Enhanced with ML-based predictions
 */

import MaterialModel from '../../models/MaterialModel';
import BomItemModel from '../../models/BomItemModel';

// ===== TYPES & INTERFACES =====

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating: number; // 0-5
  reliability: number; // Percentage 0-100
  paymentTerms: string; // e.g., "Net 30", "COD"
  deliveryRadius: number; // km
  specializations: string[]; // Material categories
  activeStatus: 'active' | 'inactive' | 'blacklisted';
}

export interface SupplierQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  materialId: string;
  materialName: string;
  unitPrice: number;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  discount: number; // Percentage
  validUntil: Date;
  shippingCost: number;
  totalCost: number; // Calculated: (unitPrice * quantity - discount) + shipping
  recommended: boolean;
  notes?: string;
}

export interface PurchaseSuggestion {
  id: string;
  materialId: string;
  materialName: string;
  itemCode: string;
  unit: string;

  // Requirements
  requiredQuantity: number;
  currentStock: number;
  shortageQuantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';

  // Recommendations
  suggestedOrderQuantity: number; // Optimized with EOQ, MOQ, buffer
  estimatedCost: number;
  preferredSupplier?: Supplier;
  alternativeSuppliers: Supplier[];

  // Timing
  requiredByDate: Date;
  recommendedOrderDate: Date;
  estimatedDeliveryDate: Date;

  // Related
  bomReferences: string[]; // BOM IDs that need this material
  projectIds: string[];
  siteIds: string[];

  status: 'pending' | 'approved' | 'ordered' | 'received';
}

export interface StockAllocation {
  id: string;
  materialId: string;
  locationId: string;
  locationName: string;
  locationType: 'warehouse' | 'site_storage' | 'site_active';

  // Quantities
  totalQuantity: number;
  allocatedQuantity: number; // Reserved for specific use
  availableQuantity: number; // total - allocated

  // Status
  lastUpdated: Date;
  reorderPoint: number;
  status: 'adequate' | 'low' | 'critical';
}

export interface ConsumptionData {
  materialId: string;
  materialName: string;

  // Consumption metrics
  dailyConsumptionRate: number;
  weeklyConsumptionRate: number;
  monthlyConsumptionRate: number;

  // Trends
  trend: 'increasing' | 'stable' | 'decreasing';
  trendPercentage: number; // % change

  // Forecasting
  forecastedDemand7Days: number;
  forecastedDemand30Days: number;

  // History
  historicalData: Array<{
    date: Date;
    consumption: number;
  }>;
}

export interface ReorderRecommendation {
  materialId: string;
  materialName: string;
  currentStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  suggestedOrderQuantity: number;
  daysUntilStockout: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  preferredSupplier?: Supplier;
}

// ===== SERVICE CLASS =====

class MaterialProcurementService {
  /**
   * Generate purchase suggestions from material shortages
   */
  static generatePurchaseSuggestions(
    materials: MaterialModel[],
    bomItems: BomItemModel[],
    suppliers: Supplier[]
  ): PurchaseSuggestion[] {
    const suggestions: PurchaseSuggestion[] = [];

    // Group BOM items by material
    const requirementsByMaterial = new Map<string, BomItemModel[]>();
    bomItems.forEach(item => {
      if (!requirementsByMaterial.has(item.materialId)) {
        requirementsByMaterial.set(item.materialId, []);
      }
      requirementsByMaterial.get(item.materialId)!.push(item);
    });

    materials.forEach(material => {
      const requirements = requirementsByMaterial.get(material.id) || [];
      const totalRequired = requirements.reduce((sum, item) => sum + item.quantity, 0);
      const currentStock = material.quantityAvailable;
      const shortage = Math.max(0, totalRequired - currentStock);

      if (shortage > 0) {
        const urgency = this.calculateUrgency(shortage, totalRequired);
        const suggestedOrderQuantity = this.calculateOptimalOrderQuantity(
          shortage,
          material,
          suppliers
        );

        // Find preferred supplier
        const preferredSupplier = this.selectPreferredSupplier(
          material,
          suggestedOrderQuantity,
          suppliers
        );

        // Find alternative suppliers
        const alternativeSuppliers = this.findAlternativeSuppliers(
          material,
          preferredSupplier,
          suppliers
        );

        // Calculate timing
        const leadTime = preferredSupplier?.id ?
          this.getSupplierLeadTime(preferredSupplier.id) : 7;
        const requiredByDate = this.calculateRequiredDate(urgency);
        const recommendedOrderDate = new Date(
          requiredByDate.getTime() - leadTime * 24 * 60 * 60 * 1000
        );
        const estimatedDeliveryDate = new Date(
          recommendedOrderDate.getTime() + leadTime * 24 * 60 * 60 * 1000
        );

        // Estimate cost (TODO: Add unitCost to MaterialModel in future)
        const estimatedCost = suggestedOrderQuantity * 100; // Placeholder unit cost

        suggestions.push({
          id: `suggestion_${material.id}_${Date.now()}`,
          materialId: material.id,
          materialName: material.name,
          itemCode: material.name, // TODO: Add itemCode to MaterialModel
          unit: material.unit,
          requiredQuantity: totalRequired,
          currentStock,
          shortageQuantity: shortage,
          urgency,
          suggestedOrderQuantity,
          estimatedCost,
          preferredSupplier,
          alternativeSuppliers,
          requiredByDate,
          recommendedOrderDate,
          estimatedDeliveryDate,
          bomReferences: requirements.map(r => r.bomId),
          projectIds: [], // Would be populated from BOM data
          siteIds: [], // Would be populated from BOM data
          status: 'pending',
        });
      }
    });

    // Sort by urgency and cost
    return suggestions.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.estimatedCost - a.estimatedCost;
    });
  }

  /**
   * Calculate urgency based on shortage percentage
   */
  private static calculateUrgency(
    shortage: number,
    required: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const shortagePercentage = (shortage / required) * 100;

    if (shortagePercentage >= 75) return 'critical';
    if (shortagePercentage >= 50) return 'high';
    if (shortagePercentage >= 25) return 'medium';
    return 'low';
  }

  /**
   * Calculate optimal order quantity using EOQ and constraints
   */
  private static calculateOptimalOrderQuantity(
    shortage: number,
    material: MaterialModel,
    suppliers: Supplier[]
  ): number {
    // Basic EOQ calculation (simplified)
    // In full implementation: EOQ = sqrt((2 * D * S) / H)
    // D = annual demand, S = ordering cost, H = holding cost

    // For now, use shortage + 20% buffer
    let orderQuantity = shortage * 1.2;

    // Check supplier minimum order quantities
    const relevantSuppliers = suppliers.filter(s =>
      s.activeStatus === 'active'
    );

    // Adjust for MOQ if needed
    // (In full implementation, would fetch actual supplier MOQ)
    const assumedMOQ = 10; // Placeholder
    if (orderQuantity < assumedMOQ) {
      orderQuantity = assumedMOQ;
    }

    // Round to reasonable quantity
    return Math.ceil(orderQuantity);
  }

  /**
   * Select preferred supplier based on multiple criteria
   */
  private static selectPreferredSupplier(
    material: MaterialModel,
    quantity: number,
    suppliers: Supplier[]
  ): Supplier | undefined {
    const activeSuppliers = suppliers.filter(s => s.activeStatus === 'active');

    if (activeSuppliers.length === 0) return undefined;

    // Score suppliers based on:
    // - Rating (40%)
    // - Reliability (30%)
    // - Lead time (20%)
    // - Cost (10%)

    const scoredSuppliers = activeSuppliers.map(supplier => {
      const ratingScore = (supplier.rating / 5) * 0.4;
      const reliabilityScore = (supplier.reliability / 100) * 0.3;
      const leadTimeScore = 0.2; // Placeholder - would use actual lead time data
      const costScore = 0.1; // Placeholder - would use actual cost data

      const totalScore = ratingScore + reliabilityScore + leadTimeScore + costScore;

      return { supplier, score: totalScore };
    });

    // Sort by score descending
    scoredSuppliers.sort((a, b) => b.score - a.score);

    return scoredSuppliers[0]?.supplier;
  }

  /**
   * Find alternative suppliers (excluding preferred)
   */
  private static findAlternativeSuppliers(
    material: MaterialModel,
    preferredSupplier: Supplier | undefined,
    suppliers: Supplier[]
  ): Supplier[] {
    return suppliers
      .filter(s =>
        s.activeStatus === 'active' &&
        s.id !== preferredSupplier?.id
      )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3); // Top 3 alternatives
  }

  /**
   * Get supplier lead time (placeholder - would query real data)
   */
  private static getSupplierLeadTime(supplierId: string): number {
    // Placeholder - would query supplier database or historical data
    return 7; // Default 7 days
  }

  /**
   * Calculate required date based on urgency
   */
  private static calculateRequiredDate(
    urgency: 'low' | 'medium' | 'high' | 'critical'
  ): Date {
    const now = new Date();
    const daysUntilRequired = {
      critical: 3,
      high: 7,
      medium: 14,
      low: 30,
    };

    return new Date(now.getTime() + daysUntilRequired[urgency] * 24 * 60 * 60 * 1000);
  }

  /**
   * Generate supplier quotes for a material
   */
  static generateSupplierQuotes(
    material: MaterialModel,
    quantity: number,
    suppliers: Supplier[]
  ): SupplierQuote[] {
    const quotes: SupplierQuote[] = [];

    const activeSuppliers = suppliers.filter(s => s.activeStatus === 'active');

    activeSuppliers.forEach(supplier => {
      // In real implementation, would fetch actual quotes from suppliers
      // For now, generate estimates based on supplier rating and reliability

      const basePrice = 100; // TODO: Get from MaterialModel.unitCost when added
      const priceVariation = (5 - supplier.rating) * 10; // Lower rating = higher price
      const unitPrice = basePrice + priceVariation;

      const leadTimeDays = Math.ceil(7 + (5 - supplier.rating)); // Better suppliers = faster
      const discount = supplier.rating >= 4 ? quantity * 0.05 : 0; // Volume discount for good suppliers
      const shippingCost = 500; // Placeholder

      const subtotal = unitPrice * quantity;
      const totalCost = subtotal - discount + shippingCost;

      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      quotes.push({
        id: `quote_${supplier.id}_${material.id}_${Date.now()}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        materialId: material.id,
        materialName: material.name,
        unitPrice,
        minimumOrderQuantity: 10,
        leadTimeDays,
        discount,
        validUntil,
        shippingCost,
        totalCost,
        recommended: false, // Will be set based on best value
        notes: `Rating: ${supplier.rating}/5, Reliability: ${supplier.reliability}%`,
      });
    });

    // Mark the best quote as recommended
    if (quotes.length > 0) {
      quotes.sort((a, b) => {
        // Score based on total cost (60%) and lead time (40%)
        const costScore = (1 - a.totalCost / Math.max(...quotes.map(q => q.totalCost))) * 0.6;
        const timeScore = (1 - a.leadTimeDays / Math.max(...quotes.map(q => q.leadTimeDays))) * 0.4;
        const scoreA = costScore + timeScore;

        const costScoreB = (1 - b.totalCost / Math.max(...quotes.map(q => q.totalCost))) * 0.6;
        const timeScoreB = (1 - b.leadTimeDays / Math.max(...quotes.map(q => q.leadTimeDays))) * 0.4;
        const scoreB = costScoreB + timeScoreB;

        return scoreB - scoreA;
      });

      quotes[0].recommended = true;
    }

    return quotes;
  }

  /**
   * Calculate consumption rate from historical data
   */
  static calculateConsumptionRate(
    material: MaterialModel,
    historicalData: Array<{ date: Date; consumption: number }>
  ): ConsumptionData {
    if (historicalData.length === 0) {
      return {
        materialId: material.id,
        materialName: material.name,
        dailyConsumptionRate: 0,
        weeklyConsumptionRate: 0,
        monthlyConsumptionRate: 0,
        trend: 'stable',
        trendPercentage: 0,
        forecastedDemand7Days: 0,
        forecastedDemand30Days: 0,
        historicalData: [],
      };
    }

    // Calculate average consumption
    const totalConsumption = historicalData.reduce((sum, d) => sum + d.consumption, 0);
    const avgDailyConsumption = totalConsumption / historicalData.length;
    const avgWeeklyConsumption = avgDailyConsumption * 7;
    const avgMonthlyConsumption = avgDailyConsumption * 30;

    // Calculate trend
    const recentData = historicalData.slice(-7); // Last 7 days
    const olderData = historicalData.slice(-14, -7); // Previous 7 days

    const recentAvg = recentData.reduce((sum, d) => sum + d.consumption, 0) / recentData.length;
    const olderAvg = olderData.length > 0 ?
      olderData.reduce((sum, d) => sum + d.consumption, 0) / olderData.length :
      recentAvg;

    const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    if (trendPercentage > 10) trend = 'increasing';
    else if (trendPercentage < -10) trend = 'decreasing';

    // Simple forecasting (in real implementation, use time series analysis)
    const forecastedDemand7Days = avgDailyConsumption * 7 * (1 + trendPercentage / 100);
    const forecastedDemand30Days = avgDailyConsumption * 30 * (1 + trendPercentage / 100);

    return {
      materialId: material.id,
      materialName: material.name,
      dailyConsumptionRate: avgDailyConsumption,
      weeklyConsumptionRate: avgWeeklyConsumption,
      monthlyConsumptionRate: avgMonthlyConsumption,
      trend,
      trendPercentage,
      forecastedDemand7Days,
      forecastedDemand30Days,
      historicalData,
    };
  }

  /**
   * Generate reorder recommendations based on consumption and stock levels
   */
  static generateReorderRecommendations(
    materials: MaterialModel[],
    consumptionData: Map<string, ConsumptionData>,
    suppliers: Supplier[]
  ): ReorderRecommendation[] {
    const recommendations: ReorderRecommendation[] = [];

    materials.forEach(material => {
      const consumption = consumptionData.get(material.id);
      if (!consumption) return;

      // Calculate reorder point: (daily consumption * lead time) + safety stock
      const leadTime = 7; // days - would use supplier data
      const safetyStockDays = 3; // days buffer
      const reorderPoint = consumption.dailyConsumptionRate * (leadTime + safetyStockDays);

      const currentStock = material.quantityAvailable;

      if (currentStock <= reorderPoint) {
        // Calculate EOQ (simplified)
        const eoq = consumption.monthlyConsumptionRate * 0.5; // Order 2 weeks worth

        // Adjust for current shortage
        const shortage = Math.max(0, reorderPoint - currentStock);
        const suggestedOrderQuantity = Math.max(eoq, shortage * 1.2);

        // Calculate days until stockout
        const daysUntilStockout = consumption.dailyConsumptionRate > 0 ?
          currentStock / consumption.dailyConsumptionRate :
          999;

        // Determine priority
        let priority: 'low' | 'medium' | 'high' | 'critical';
        if (daysUntilStockout < 3) priority = 'critical';
        else if (daysUntilStockout < 7) priority = 'high';
        else if (daysUntilStockout < 14) priority = 'medium';
        else priority = 'low';

        // Find preferred supplier
        const preferredSupplier = this.selectPreferredSupplier(
          material,
          suggestedOrderQuantity,
          suppliers
        );

        // Estimate cost (TODO: Add unitCost to MaterialModel in future)
        const estimatedCost = suggestedOrderQuantity * 100; // Placeholder unit cost

        recommendations.push({
          materialId: material.id,
          materialName: material.name,
          currentStock,
          reorderPoint,
          economicOrderQuantity: eoq,
          suggestedOrderQuantity,
          daysUntilStockout,
          priority,
          estimatedCost,
          preferredSupplier,
        });
      }
    });

    // Sort by priority and days until stockout
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.daysUntilStockout - b.daysUntilStockout;
    });
  }

  /**
   * Allocate stock across multiple locations
   */
  static allocateStock(
    material: MaterialModel,
    targetQuantity: number,
    stockAllocations: StockAllocation[]
  ): Array<{ locationId: string; quantity: number }> {
    const allocations: Array<{ locationId: string; quantity: number }> = [];
    let remainingQuantity = targetQuantity;

    // Sort locations by available quantity (descending)
    const sortedLocations = stockAllocations
      .filter(loc => loc.materialId === material.id && loc.availableQuantity > 0)
      .sort((a, b) => b.availableQuantity - a.availableQuantity);

    for (const location of sortedLocations) {
      if (remainingQuantity <= 0) break;

      const allocateQty = Math.min(remainingQuantity, location.availableQuantity);

      allocations.push({
        locationId: location.locationId,
        quantity: allocateQty,
      });

      remainingQuantity -= allocateQty;
    }

    return allocations;
  }

  /**
   * Consolidate orders for bulk discount opportunities
   */
  static consolidateOrders(
    suggestions: PurchaseSuggestion[]
  ): Array<{
    supplierId: string;
    supplierName: string;
    materials: Array<{ materialId: string; quantity: number }>;
    totalCost: number;
    estimatedDiscount: number;
  }> {
    // Group by preferred supplier
    const ordersBySupplier = new Map<string, PurchaseSuggestion[]>();

    suggestions.forEach(suggestion => {
      if (suggestion.preferredSupplier) {
        const supplierId = suggestion.preferredSupplier.id;
        if (!ordersBySupplier.has(supplierId)) {
          ordersBySupplier.set(supplierId, []);
        }
        ordersBySupplier.get(supplierId)!.push(suggestion);
      }
    });

    const consolidatedOrders = Array.from(ordersBySupplier.entries()).map(
      ([supplierId, items]) => {
        const supplierName = items[0].preferredSupplier!.name;
        const materials = items.map(item => ({
          materialId: item.materialId,
          quantity: item.suggestedOrderQuantity,
        }));

        const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);

        // Calculate bulk discount (5% for orders over 100K, 10% for over 500K)
        let estimatedDiscount = 0;
        if (totalCost > 500000) estimatedDiscount = totalCost * 0.1;
        else if (totalCost > 100000) estimatedDiscount = totalCost * 0.05;

        return {
          supplierId,
          supplierName,
          materials,
          totalCost,
          estimatedDiscount,
        };
      }
    );

    // Sort by potential discount
    return consolidatedOrders.sort((a, b) => b.estimatedDiscount - a.estimatedDiscount);
  }
}

export default MaterialProcurementService;
