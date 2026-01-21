/**
 * useMaterialRequirementsData Hook
 *
 * Fetches material requirements from BOM data for the selected project.
 * Shows requirements, shortages, and fulfillment status.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface MaterialRequirement {
  id: string;
  materialName: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortfall: number;
  unit: string;
  category: string;
}

export interface MaterialRequirementsData {
  totalRequirements: number;
  fulfilledCount: number;
  partialCount: number;
  shortageCount: number;
  criticalShortages: MaterialRequirement[];
  fulfillmentRate: number;
}

export interface UseMaterialRequirementsResult {
  data: MaterialRequirementsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useMaterialRequirementsData(): UseMaterialRequirementsResult {
  const { selectedProjectId, materials } = useLogisticsContext();
  const [data, setData] = useState<MaterialRequirementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get BOM items for the project
      const bomItems = await database.collections
        .get('bom_items')
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      // Create a map of materials by ID for quick lookup
      const materialMap = new Map<string, any>();
      materials.forEach(m => materialMap.set(m.id, m));

      // Calculate requirements
      const requirements: MaterialRequirement[] = bomItems.map((item: any) => {
        const material = materialMap.get(item.materialId);
        const requiredQuantity = item.quantity || 0;
        const availableQuantity = material?.quantityAvailable || 0;
        const shortfall = Math.max(0, requiredQuantity - availableQuantity);

        return {
          id: item.id,
          materialName: material?.name || item.description || 'Unknown Material',
          requiredQuantity,
          availableQuantity,
          shortfall,
          unit: material?.unit || item.unit || 'units',
          category: material?.category || 'Uncategorized',
        };
      });

      // Calculate metrics
      const totalRequirements = requirements.length;
      const fulfilledCount = requirements.filter(r => r.shortfall === 0).length;
      const partialCount = requirements.filter(r =>
        r.shortfall > 0 && r.availableQuantity > 0
      ).length;
      const shortageCount = requirements.filter(r =>
        r.availableQuantity === 0 && r.requiredQuantity > 0
      ).length;

      // Get critical shortages (sorted by shortfall percentage)
      const criticalShortages = requirements
        .filter(r => r.shortfall > 0)
        .sort((a, b) => {
          const aPercent = a.requiredQuantity > 0 ? a.shortfall / a.requiredQuantity : 0;
          const bPercent = b.requiredQuantity > 0 ? b.shortfall / b.requiredQuantity : 0;
          return bPercent - aPercent;
        })
        .slice(0, 5);

      // Calculate fulfillment rate
      const fulfillmentRate = totalRequirements > 0
        ? Math.round((fulfilledCount / totalRequirements) * 100)
        : 100;

      setData({
        totalRequirements,
        fulfilledCount,
        partialCount,
        shortageCount,
        criticalShortages,
        fulfillmentRate,
      });
    } catch (err) {
      setError('Failed to load material requirements');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, materials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useMaterialRequirementsData;
