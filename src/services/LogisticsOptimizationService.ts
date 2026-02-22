/**
 * LogisticsOptimizationService
 *
 * Provides cross-tab optimization algorithms, cost-saving recommendations,
 * performance analytics, and predictive analytics for the logistics system.
 *
 * Week 1: Foundation - Basic optimization framework
 * Weeks 6-7: Advanced analytics and ML-based predictions
 */

import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import MaterialModel from '../../models/MaterialModel';
import { LogisticsKPIs, LogisticsAlert, PendingAction } from '../logistics/context/LogisticsContext';

// ===== TYPES & INTERFACES =====

export interface OptimizationRecommendation {
  id: string;
  type: 'cost_saving' | 'efficiency' | 'quality' | 'risk_mitigation';
  category: 'procurement' | 'inventory' | 'delivery' | 'equipment';
  title: string;
  description: string;
  estimatedSavings: number; // In currency
  estimatedImpact: number; // Percentage improvement
  priority: 'low' | 'medium' | 'high';
  actionRequired: string;
  deadline?: Date;
}

export interface PerformanceMetrics {
  // Material Performance
  materialUtilization: number; // Percentage
  materialWastage: number; // Percentage
  procurementEfficiency: number; // Percentage

  // Delivery Performance
  deliveryReliability: number; // Percentage
  averageLeadTime: number; // Days
  deliveryCostPerUnit: number;

  // Inventory Performance
  inventoryTurnover: number; // Times per year
  stockoutRate: number; // Percentage
  carryingCost: number; // Currency

  // Overall Performance
  overallEfficiency: number; // Percentage (0-100)
  costOptimization: number; // Percentage savings
}

export interface PredictiveInsight {
  type: 'demand_forecast' | 'lead_time_prediction' | 'cost_trend' | 'risk_alert';
  category: string;
  prediction: string;
  confidence: number; // 0-100%
  timeframe: string;
  recommendedAction: string;
}

export interface CostAnalysis {
  totalCost: number;
  breakdown: {
    procurement: number;
    delivery: number;
    storage: number;
    wastage: number;
    overhead: number;
  };
  potentialSavings: number;
  recommendations: string[];
}

// ===== SERVICE CLASS =====

class LogisticsOptimizationService {
  /**
   * Generate optimization recommendations based on current logistics data
   */
  static generateRecommendations(
    materials: MaterialModel[],
    boms: BomModel[],
    bomItems: BomItemModel[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // 1. Material shortage recommendations
    const shortageRecommendations = this.analyzeShortages(materials, bomItems);
    recommendations.push(...shortageRecommendations);

    // 2. Bulk order opportunities
    const bulkOrderRecommendations = this.analyzeBulkOrders(materials, bomItems);
    recommendations.push(...bulkOrderRecommendations);

    // 3. Inventory optimization
    const inventoryRecommendations = this.analyzeInventory(materials);
    recommendations.push(...inventoryRecommendations);

    // Sort by priority and estimated savings
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedSavings - a.estimatedSavings;
    });
  }

  /**
   * Analyze material shortages and generate procurement recommendations
   */
  private static analyzeShortages(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Group BOM items by material
    const requirementsByMaterial = new Map<string, number>();
    bomItems.forEach(item => {
      const materialId = item.materialId ?? '';
      if (!materialId) return;
      const current = requirementsByMaterial.get(materialId) || 0;
      requirementsByMaterial.set(materialId, current + item.quantity);
    });

    materials.forEach(material => {
      const required = requirementsByMaterial.get(material.id) || 0;
      const available = material.quantityAvailable;
      const shortage = Math.max(0, required - available);

      if (shortage > 0) {
        const urgency = shortage / required;
        const priority = urgency > 0.7 ? 'high' : urgency > 0.3 ? 'medium' : 'low';

        recommendations.push({
          id: `shortage_${material.id}`,
          type: 'risk_mitigation',
          category: 'procurement',
          title: `Material Shortage: ${material.name}`,
          description: `Shortage of ${shortage.toFixed(2)} ${material.unit}. Required: ${required.toFixed(2)}, Available: ${available.toFixed(2)}`,
          estimatedSavings: 0, // Preventing delays has indirect cost savings
          estimatedImpact: urgency * 100,
          priority,
          actionRequired: `Procure ${shortage.toFixed(2)} ${material.unit} of ${material.name}`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyze opportunities for bulk ordering to save costs
   */
  private static analyzeBulkOrders(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Group materials by category for bulk ordering
    const categorizedMaterials = new Map<string, MaterialModel[]>();
    materials.forEach(material => {
      const category = (material as any).category || 'Uncategorized';
      if (!categorizedMaterials.has(category)) {
        categorizedMaterials.set(category, []);
      }
      categorizedMaterials.get(category)!.push(material);
    });

    categorizedMaterials.forEach((categoryMaterials, category) => {
      if (categoryMaterials.length >= 3) {
        // Potential for bulk order
        const totalValue = categoryMaterials.reduce((sum, m) => {
          return sum + m.quantityRequired * ((m as any).unitCost || 0);
        }, 0);

        if (totalValue > 10000) {
          // Significant value
          const estimatedSavings = totalValue * 0.1; // Assume 10% bulk discount

          recommendations.push({
            id: `bulk_${category}`,
            type: 'cost_saving',
            category: 'procurement',
            title: `Bulk Order Opportunity: ${category}`,
            description: `Combine ${categoryMaterials.length} materials in ${category} category for bulk discount`,
            estimatedSavings,
            estimatedImpact: 10,
            priority: estimatedSavings > 50000 ? 'high' : 'medium',
            actionRequired: `Create consolidated purchase order for ${category} materials`,
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Analyze inventory levels and suggest optimizations
   */
  private static analyzeInventory(materials: MaterialModel[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    materials.forEach(material => {
      const available = material.quantityAvailable;
      const required = material.quantityRequired;

      // Check for excess inventory
      if (required > 0 && available > required * 2) {
        const excess = available - required * 1.2; // Keep 20% buffer
        const carryingCost = excess * ((material as any).unitCost || 0) * 0.02; // 2% annual carrying cost

        if (carryingCost > 100) {
          recommendations.push({
            id: `excess_${material.id}`,
            type: 'cost_saving',
            category: 'inventory',
            title: `Excess Inventory: ${material.name}`,
            description: `Excess stock of ${excess.toFixed(2)} ${material.unit}. Consider reallocating or adjusting procurement.`,
            estimatedSavings: carryingCost,
            estimatedImpact: 5,
            priority: 'low',
            actionRequired: `Review procurement schedule for ${material.name}`,
          });
        }
      }

      // Check for slow-moving inventory
      // (In real implementation, this would use actual movement data)
      if (available > 0 && required === 0) {
        recommendations.push({
          id: `slowmoving_${material.id}`,
          type: 'efficiency',
          category: 'inventory',
          title: `Slow-Moving Stock: ${material.name}`,
          description: `${available.toFixed(2)} ${material.unit} with no current requirements`,
          estimatedSavings: available * ((material as any).unitCost || 0) * 0.01,
          estimatedImpact: 3,
          priority: 'low',
          actionRequired: `Consider transferring to active projects or marking for disposal`,
        });
      }
    });

    return recommendations;
  }

  /**
   * Calculate performance metrics across all logistics operations
   */
  static calculatePerformanceMetrics(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): PerformanceMetrics {
    // Material Performance
    const totalRequired = materials.reduce((sum, m) => sum + m.quantityRequired, 0);
    const totalAvailable = materials.reduce((sum, m) => sum + m.quantityAvailable, 0);
    const materialUtilization = totalRequired > 0 ? (totalAvailable / totalRequired) * 100 : 0;

    // For now, use placeholder values for metrics that require historical data
    // These will be enhanced as we build tracking systems
    return {
      materialUtilization: Math.min(100, materialUtilization),
      materialWastage: 2.5, // Placeholder
      procurementEfficiency: 85, // Placeholder

      deliveryReliability: 92, // Placeholder
      averageLeadTime: 7, // Placeholder
      deliveryCostPerUnit: 0, // Placeholder

      inventoryTurnover: 4.2, // Placeholder
      stockoutRate: 3.5, // Placeholder
      carryingCost: materials.reduce((sum, m) => {
        return sum + m.quantityAvailable * ((m as any).unitCost || 0) * 0.02;
      }, 0),

      overallEfficiency: 85, // Placeholder - will be calculated from sub-metrics
      costOptimization: 12, // Placeholder - percentage of cost saved through optimization
    };
  }

  /**
   * Generate predictive insights using simple heuristics
   * (Week 6-7 will enhance with ML-based predictions)
   */
  static generatePredictiveInsights(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Demand forecast based on BOM items
    const activeBomItems = bomItems.length;
    if (activeBomItems > 10) {
      insights.push({
        type: 'demand_forecast',
        category: 'materials',
        prediction: `High material demand expected in next 2 weeks based on ${activeBomItems} active BOM items`,
        confidence: 75,
        timeframe: '2 weeks',
        recommendedAction: 'Increase procurement bandwidth and validate supplier capacity',
      });
    }

    // Cost trend analysis
    const highValueMaterials = materials.filter(m => ((m as any).unitCost || 0) > 1000);
    if (highValueMaterials.length > 0) {
      insights.push({
        type: 'cost_trend',
        category: 'procurement',
        prediction: `${highValueMaterials.length} high-value materials may be subject to price volatility`,
        confidence: 60,
        timeframe: '1 month',
        recommendedAction: 'Consider locking in prices through forward contracts',
      });
    }

    // Risk alerts
    const criticalShortages = materials.filter(m => {
      return m.quantityRequired > 0 && m.quantityAvailable < m.quantityRequired * 0.3;
    });

    if (criticalShortages.length > 0) {
      insights.push({
        type: 'risk_alert',
        category: 'materials',
        prediction: `${criticalShortages.length} materials at critical shortage levels`,
        confidence: 95,
        timeframe: 'Immediate',
        recommendedAction: 'Expedite procurement for critical materials to avoid project delays',
      });
    }

    return insights;
  }

  /**
   * Perform cost analysis across logistics operations
   */
  static analyzeCosts(materials: MaterialModel[]): CostAnalysis {
    const procurementCost = materials.reduce((sum, m) => {
      return sum + m.quantityRequired * ((m as any).unitCost || 0);
    }, 0);

    const storageCost = materials.reduce((sum, m) => {
      return sum + m.quantityAvailable * ((m as any).unitCost || 0) * 0.02; // 2% carrying cost
    }, 0);

    // Placeholders for other costs - will be calculated from real data
    const deliveryCost = procurementCost * 0.05; // Assume 5% of procurement
    const wastageCost = procurementCost * 0.025; // Assume 2.5% wastage
    const overheadCost = (procurementCost + deliveryCost + storageCost) * 0.1; // 10% overhead

    const totalCost = procurementCost + deliveryCost + storageCost + wastageCost + overheadCost;
    const potentialSavings = totalCost * 0.12; // 12% potential savings through optimization

    const recommendations: string[] = [];
    if (procurementCost > totalCost * 0.7) {
      recommendations.push('Procurement is 70%+ of costs - focus on supplier negotiations and bulk discounts');
    }
    if (storageCost > totalCost * 0.05) {
      recommendations.push('Storage costs are significant - optimize inventory levels and turnover');
    }
    if (wastageCost > totalCost * 0.03) {
      recommendations.push('Material wastage exceeds 3% - implement better tracking and controls');
    }

    return {
      totalCost,
      breakdown: {
        procurement: procurementCost,
        delivery: deliveryCost,
        storage: storageCost,
        wastage: wastageCost,
        overhead: overheadCost,
      },
      potentialSavings,
      recommendations,
    };
  }

  /**
   * Generate smart alerts based on logistics data
   */
  static generateSmartAlerts(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): Partial<LogisticsAlert>[] {
    const alerts: Partial<LogisticsAlert>[] = [];

    // Critical shortage alerts
    materials.forEach(material => {
      const shortage = Math.max(0, material.quantityRequired - material.quantityAvailable);
      if (shortage > material.quantityRequired * 0.5) {
        alerts.push({
          type: 'material',
          severity: 'critical',
          title: `Critical Shortage: ${material.name}`,
          description: `Shortage of ${shortage.toFixed(2)} ${material.unit} (${((shortage / material.quantityRequired) * 100).toFixed(0)}% of requirement)`,
          affectedItems: [material.id],
          recommendedAction: `Immediate procurement of ${shortage.toFixed(2)} ${material.unit}`,
        });
      } else if (shortage > 0) {
        alerts.push({
          type: 'material',
          severity: 'high',
          title: `Material Shortage: ${material.name}`,
          description: `Shortage of ${shortage.toFixed(2)} ${material.unit}`,
          affectedItems: [material.id],
          recommendedAction: `Procure ${shortage.toFixed(2)} ${material.unit} within 7 days`,
        });
      }
    });

    return alerts;
  }

  /**
   * Generate recommended actions based on current state
   */
  static generateRecommendedActions(
    materials: MaterialModel[],
    bomItems: BomItemModel[]
  ): Partial<PendingAction>[] {
    const actions: Partial<PendingAction>[] = [];

    // Generate procurement actions for shortages
    materials.forEach(material => {
      const shortage = Math.max(0, material.quantityRequired - material.quantityAvailable);
      if (shortage > 0) {
        const urgency = shortage / material.quantityRequired;
        const priority = urgency > 0.7 ? 'high' : urgency > 0.3 ? 'medium' : 'low';
        const daysUntilDue = priority === 'high' ? 3 : priority === 'medium' ? 7 : 14;

        actions.push({
          type: 'procurement',
          title: `Procure ${material.name}`,
          description: `Order ${shortage.toFixed(2)} ${material.unit} to meet BOM requirements`,
          priority,
          dueDate: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),
          relatedId: material.id,
          status: 'pending',
        });
      }
    });

    return actions;
  }
}

export default LogisticsOptimizationService;
