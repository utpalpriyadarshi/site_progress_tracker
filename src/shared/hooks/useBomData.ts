import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../models/database';
import BomModel from '../../../models/BomModel';
import BomItemModel from '../../../models/BomItemModel';
import { Q } from '@nozbe/watermelondb';

/**
 * useBomData
 *
 * Shared hook for accessing BOM data across roles
 * Provides read-only access for Logistics role
 *
 * Features:
 * - Get BOMs by project
 * - Get BOM requirements by material
 * - Get material shortages
 * - Subscribe to BOM updates
 */

export interface BomRequirement {
  bomId: string;
  bomName: string;
  bomType: 'estimating' | 'execution';
  projectId: string;
  materialId?: string;
  itemCode: string;
  description: string;
  requiredQuantity: number;
  unit: string;
  phase?: string;
  wbsCode?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

export interface MaterialShortage {
  materialId?: string;
  itemCode: string;
  description: string;
  totalRequired: number;
  unit: string;
  affectedBoms: {
    bomId: string;
    bomName: string;
    quantity: number;
  }[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BomSummary {
  bomId: string;
  bomName: string;
  bomType: 'estimating' | 'execution';
  projectId: string;
  status: string;
  totalItems: number;
  totalEstimatedCost: number;
  quantity: number;
  unit: string;
}

export const useBomData = (projectId?: string) => {
  const [boms, setBoms] = useState<BomModel[]>([]);
  const [bomItems, setBomItems] = useState<BomItemModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load BOMs for a project
  const loadBoms = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const bomsCollection = database.collections.get<BomModel>('boms');

      const bomsList = await bomsCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('status', Q.oneOf(['active', 'baseline'])) // Only active BOMs
        )
        .fetch();

      setBoms(bomsList);
    } catch (error) {
      console.error('Error loading BOMs:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load all BOM items for a project
  const loadBomItems = useCallback(async () => {
    if (!projectId || boms.length === 0) return;

    try {
      const bomIds = boms.map((bom) => bom.id);
      const itemsCollection = database.collections.get<BomItemModel>('bom_items');

      const items = await itemsCollection
        .query(Q.where('bom_id', Q.oneOf(bomIds)))
        .fetch();

      setBomItems(items);
    } catch (error) {
      console.error('Error loading BOM items:', error);
    }
  }, [projectId, boms]);

  // Initial load
  useEffect(() => {
    loadBoms();
  }, [loadBoms, refreshTrigger]);

  useEffect(() => {
    loadBomItems();
  }, [loadBomItems]);

  /**
   * Get BOM requirements for a specific material
   */
  const getBomRequirements = useCallback(
    (materialId?: string): BomRequirement[] => {
      if (!materialId) return [];

      const requirements: BomRequirement[] = [];

      bomItems.forEach((item) => {
        if (item.materialId === materialId) {
          const bom = boms.find((b) => b.id === item.bomId);
          if (bom) {
            requirements.push({
              bomId: bom.id,
              bomName: bom.name,
              bomType: bom.type as 'estimating' | 'execution',
              projectId: bom.projectId,
              materialId: item.materialId,
              itemCode: item.itemCode,
              description: item.description,
              requiredQuantity: item.quantity,
              unit: item.unit,
              phase: item.phase,
              wbsCode: item.wbsCode,
              priority: determinePriority(bom.status, item.phase),
              status: bom.status,
            });
          }
        }
      });

      return requirements;
    },
    [bomItems, boms]
  );

  /**
   * Get all BOM requirements grouped by material
   */
  const getAllRequirements = useCallback((): BomRequirement[] => {
    const requirements: BomRequirement[] = [];

    bomItems.forEach((item) => {
      const bom = boms.find((b) => b.id === item.bomId);
      if (bom) {
        requirements.push({
          bomId: bom.id,
          bomName: bom.name,
          bomType: bom.type as 'estimating' | 'execution',
          projectId: bom.projectId,
          materialId: item.materialId,
          itemCode: item.itemCode,
          description: item.description,
          requiredQuantity: item.quantity,
          unit: item.unit,
          phase: item.phase,
          wbsCode: item.wbsCode,
          priority: determinePriority(bom.status, item.phase),
          status: bom.status,
        });
      }
    });

    return requirements;
  }, [bomItems, boms]);

  /**
   * Get material shortages across all BOMs
   */
  const getMaterialShortages = useCallback((): MaterialShortage[] => {
    const materialMap = new Map<string, MaterialShortage>();

    bomItems.forEach((item) => {
      const bom = boms.find((b) => b.id === item.bomId);
      if (!bom) return;

      const key = item.materialId || item.itemCode;
      const existing = materialMap.get(key);

      if (existing) {
        existing.totalRequired += item.quantity;
        existing.affectedBoms.push({
          bomId: bom.id,
          bomName: bom.name,
          quantity: item.quantity,
        });
      } else {
        materialMap.set(key, {
          materialId: item.materialId,
          itemCode: item.itemCode,
          description: item.description,
          totalRequired: item.quantity,
          unit: item.unit,
          affectedBoms: [
            {
              bomId: bom.id,
              bomName: bom.name,
              quantity: item.quantity,
            },
          ],
          priority: determinePriority(bom.status, item.phase),
        });
      }
    });

    return Array.from(materialMap.values());
  }, [bomItems, boms]);

  /**
   * Get BOM summaries
   */
  const getBomSummaries = useCallback((): BomSummary[] => {
    return boms.map((bom) => {
      const items = bomItems.filter((item) => item.bomId === bom.id);

      return {
        bomId: bom.id,
        bomName: bom.name,
        bomType: bom.type as 'estimating' | 'execution',
        projectId: bom.projectId,
        status: bom.status,
        totalItems: items.length,
        totalEstimatedCost: bom.totalEstimatedCost,
        quantity: bom.quantity,
        unit: bom.unit,
      };
    });
  }, [boms, bomItems]);

  /**
   * Get BOM phases for delivery scheduling
   */
  const getBomPhases = useCallback((): string[] => {
    const phases = new Set<string>();

    bomItems.forEach((item) => {
      if (item.phase) {
        phases.add(item.phase);
      }
    });

    return Array.from(phases).sort();
  }, [bomItems]);

  /**
   * Trigger refresh
   */
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return {
    // Data
    boms,
    bomItems,
    loading,

    // Query functions
    getBomRequirements,
    getAllRequirements,
    getMaterialShortages,
    getBomSummaries,
    getBomPhases,

    // Actions
    refresh,
  };
};

/**
 * Determine priority based on BOM status and phase
 */
function determinePriority(status: string, phase?: string): 'low' | 'medium' | 'high' | 'critical' {
  // Critical: Active baseline BOMs in Foundation/Structure phase
  if (status === 'baseline' || status === 'active') {
    if (phase === 'Foundation' || phase === 'Structure') {
      return 'critical';
    }
    return 'high';
  }

  // Medium: Draft or submitted BOMs
  if (status === 'draft' || status === 'submitted') {
    return 'medium';
  }

  return 'low';
}
