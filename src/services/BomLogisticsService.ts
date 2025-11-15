import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import MaterialModel from '../../models/MaterialModel';

/**
 * BomLogisticsService
 *
 * Service for BOM-Logistics integration calculations
 *
 * Features:
 * - Calculate material requirements
 * - Determine delivery priorities
 * - Calculate inventory targets
 * - Identify shortages
 * - Generate procurement recommendations
 */

export interface MaterialRequirement {
  materialId?: string;
  itemCode: string;
  description: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  surplusQuantity: number;
  unit: string;
  status: 'sufficient' | 'shortage' | 'critical' | 'surplus';
  percentage: number; // availability percentage
}

export interface DeliveryPriority {
  materialId?: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  phase: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendedDeliveryDate?: number;
  daysUntilNeeded?: number;
}

export interface InventoryTarget {
  materialId?: string;
  itemCode: string;
  description: string;
  targetQuantity: number;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  allocatedToBoms: {
    bomId: string;
    bomName: string;
    quantity: number;
  }[];
}

export interface ProcurementRecommendation {
  materialId?: string;
  itemCode: string;
  description: string;
  recommendedQuantity: number;
  unit: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  estimatedCost: number;
  affectedBoms: string[];
}

class BomLogisticsService {
  /**
   * Calculate material requirements vs availability
   */
  calculateMaterialRequirements(
    bomItems: BomItemModel[],
    materials: MaterialModel[]
  ): MaterialRequirement[] {
    const requirementMap = new Map<string, MaterialRequirement>();

    // Aggregate requirements from BOM items
    bomItems.forEach((item) => {
      const key = item.materialId || item.itemCode;
      const existing = requirementMap.get(key);

      if (existing) {
        existing.requiredQuantity += item.quantity;
      } else {
        const material = materials.find((m) => m.id === item.materialId);
        const availableQty = material?.quantityAvailable || 0;
        const requiredQty = item.quantity;
        const shortage = Math.max(0, requiredQty - availableQty);
        const surplus = Math.max(0, availableQty - requiredQty);
        const percentage = requiredQty > 0 ? (availableQty / requiredQty) * 100 : 100;

        requirementMap.set(key, {
          materialId: item.materialId,
          itemCode: item.itemCode,
          description: item.description,
          requiredQuantity: requiredQty,
          availableQuantity: availableQty,
          shortageQuantity: shortage,
          surplusQuantity: surplus,
          unit: item.unit,
          status: this.determineRequirementStatus(percentage, shortage),
          percentage: Math.min(100, percentage),
        });
      }
    });

    // Update calculations for aggregated items
    requirementMap.forEach((req) => {
      const material = materials.find((m) => m.id === req.materialId);
      if (material) {
        req.availableQuantity = material.quantityAvailable;
        req.shortageQuantity = Math.max(0, req.requiredQuantity - req.availableQuantity);
        req.surplusQuantity = Math.max(0, req.availableQuantity - req.requiredQuantity);
        req.percentage =
          req.requiredQuantity > 0 ? (req.availableQuantity / req.requiredQuantity) * 100 : 100;
        req.status = this.determineRequirementStatus(req.percentage, req.shortageQuantity);
      }
    });

    return Array.from(requirementMap.values()).sort(
      (a, b) => b.shortageQuantity - a.shortageQuantity
    );
  }

  /**
   * Calculate delivery priorities based on BOM phases
   */
  calculateDeliveryPriorities(
    bomItems: BomItemModel[],
    boms: BomModel[],
    materials: MaterialModel[]
  ): DeliveryPriority[] {
    const priorities: DeliveryPriority[] = [];

    bomItems.forEach((item) => {
      const bom = boms.find((b) => b.id === item.bomId);
      const material = materials.find((m) => m.id === item.materialId);

      if (bom) {
        const shortage = item.quantity - (material?.quantityAvailable || 0);

        if (shortage > 0) {
          priorities.push({
            materialId: item.materialId,
            itemCode: item.itemCode,
            description: item.description,
            quantity: shortage,
            unit: item.unit,
            phase: item.phase || 'Unspecified',
            priority: this.calculatePriority(bom, item),
            recommendedDeliveryDate: this.calculateRecommendedDeliveryDate(item.phase),
            daysUntilNeeded: this.calculateDaysUntilNeeded(item.phase),
          });
        }
      }
    });

    // Sort by priority (critical first) then by days until needed
    return priorities.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return (a.daysUntilNeeded || 999) - (b.daysUntilNeeded || 999);
    });
  }

  /**
   * Calculate inventory targets based on BOM requirements
   */
  calculateInventoryTargets(
    bomItems: BomItemModel[],
    boms: BomModel[],
    materials: MaterialModel[]
  ): InventoryTarget[] {
    const targetMap = new Map<string, InventoryTarget>();

    bomItems.forEach((item) => {
      const key = item.materialId || item.itemCode;
      const bom = boms.find((b) => b.id === item.bomId);
      const material = materials.find((m) => m.id === item.materialId);

      if (!bom) return;

      const existing = targetMap.get(key);

      if (existing) {
        existing.targetQuantity += item.quantity;
        existing.allocatedToBoms.push({
          bomId: bom.id,
          bomName: bom.name,
          quantity: item.quantity,
        });
      } else {
        const targetQty = item.quantity;
        const currentQty = material?.quantityAvailable || 0;
        const reorderPoint = targetQty * 0.3; // 30% of target
        const reorderQty = Math.ceil(targetQty * 1.2); // 120% of target

        targetMap.set(key, {
          materialId: item.materialId,
          itemCode: item.itemCode,
          description: item.description,
          targetQuantity: targetQty,
          currentQuantity: currentQty,
          reorderPoint,
          reorderQuantity: reorderQty,
          unit: item.unit,
          allocatedToBoms: [
            {
              bomId: bom.id,
              bomName: bom.name,
              quantity: item.quantity,
            },
          ],
        });
      }
    });

    // Update aggregated calculations
    targetMap.forEach((target) => {
      const material = materials.find((m) => m.id === target.materialId);
      if (material) {
        target.currentQuantity = material.quantityAvailable;
      }
      target.reorderPoint = target.targetQuantity * 0.3;
      target.reorderQuantity = Math.ceil(target.targetQuantity * 1.2);
    });

    return Array.from(targetMap.values()).sort((a, b) => b.targetQuantity - a.targetQuantity);
  }

  /**
   * Generate procurement recommendations
   */
  generateProcurementRecommendations(
    requirements: MaterialRequirement[],
    bomItems: BomItemModel[],
    boms: BomModel[]
  ): ProcurementRecommendation[] {
    const recommendations: ProcurementRecommendation[] = [];

    requirements.forEach((req) => {
      if (req.status === 'shortage' || req.status === 'critical') {
        const relatedItems = bomItems.filter(
          (item) =>
            (item.materialId && item.materialId === req.materialId) || item.itemCode === req.itemCode
        );

        const affectedBoms = Array.from(
          new Set(
            relatedItems.map((item) => {
              const bom = boms.find((b) => b.id === item.bomId);
              return bom?.name || item.bomId;
            })
          )
        );

        // Calculate estimated cost
        const avgUnitCost =
          relatedItems.reduce((sum, item) => sum + item.unitCost, 0) / relatedItems.length;
        const estimatedCost = req.shortageQuantity * avgUnitCost;

        recommendations.push({
          materialId: req.materialId,
          itemCode: req.itemCode,
          description: req.description,
          recommendedQuantity: Math.ceil(req.shortageQuantity * 1.1), // 10% buffer
          unit: req.unit,
          urgency: req.status === 'critical' ? 'critical' : 'high',
          reason: `Shortage of ${req.shortageQuantity} ${req.unit} (${(100 - req.percentage).toFixed(1)}% short)`,
          estimatedCost,
          affectedBoms,
        });
      }
    });

    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  }

  // Helper methods

  private determineRequirementStatus(
    percentage: number,
    shortage: number
  ): 'sufficient' | 'shortage' | 'critical' | 'surplus' {
    if (shortage === 0 && percentage > 100) return 'surplus';
    if (percentage >= 100) return 'sufficient';
    if (percentage >= 50) return 'shortage';
    return 'critical';
  }

  private calculatePriority(
    bom: BomModel,
    item: BomItemModel
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Active/baseline BOM + Foundation/Structure phase
    if ((bom.status === 'baseline' || bom.status === 'active') &&
        (item.phase === 'Foundation' || item.phase === 'Structure')) {
      return 'critical';
    }

    // High: Active/baseline BOM
    if (bom.status === 'baseline' || bom.status === 'active') {
      return 'high';
    }

    // Medium: Draft/submitted BOM
    if (bom.status === 'draft' || bom.status === 'submitted') {
      return 'medium';
    }

    return 'low';
  }

  private calculateRecommendedDeliveryDate(phase?: string): number | undefined {
    if (!phase) return undefined;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Recommend delivery based on phase
    const phaseLeadTime: Record<string, number> = {
      Foundation: 7, // 7 days
      Structure: 14, // 14 days
      Finishing: 21, // 21 days
      MEP: 21, // 21 days
      Landscaping: 30, // 30 days
    };

    const days = phaseLeadTime[phase] || 14;
    return now + days * oneDayMs;
  }

  private calculateDaysUntilNeeded(phase?: string): number | undefined {
    if (!phase) return undefined;

    // Estimated days until phase starts
    const phaseTiming: Record<string, number> = {
      Foundation: 7,
      Structure: 14,
      Finishing: 30,
      MEP: 25,
      Landscaping: 45,
    };

    return phaseTiming[phase] || 14;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      sufficient: '#4CAF50', // Green
      surplus: '#2196F3', // Blue
      shortage: '#FF9800', // Orange
      critical: '#F44336', // Red
    };
    return colors[status] || '#9E9E9E';
  }

  /**
   * Get priority color for UI
   */
  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: '#9E9E9E', // Gray
      medium: '#2196F3', // Blue
      high: '#FF9800', // Orange
      critical: '#F44336', // Red
    };
    return colors[priority] || '#9E9E9E';
  }
}

export default new BomLogisticsService();
