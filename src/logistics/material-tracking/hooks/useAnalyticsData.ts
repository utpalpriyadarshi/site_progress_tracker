/**
 * useAnalyticsData Hook
 *
 * Manages consumption analytics and forecasting
 */

import { useState, useEffect } from 'react';
import MaterialModel from '../../../../models/MaterialModel';
import MaterialProcurementService, {
  ConsumptionData,
} from '../../../services/MaterialProcurementService';
import { generateMockConsumptionHistory } from '../../../data/mockSuppliers';
import { logger } from '../../../services/LoggingService';

export const useAnalyticsData = (materials: MaterialModel[]) => {
  const [consumptionData, setConsumptionData] = useState<Map<string, ConsumptionData>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConsumptionData();
  }, [materials]);

  const loadConsumptionData = () => {
    try {
      setLoading(true);
      // Generate consumption data for each material
      const consumptionMap = new Map<string, ConsumptionData>();

      materials.forEach((material) => {
        // Generate mock historical data (30 days)
        const history = generateMockConsumptionHistory(30);
        const consumption = MaterialProcurementService.calculateConsumptionRate(
          material,
          history
        );
        consumptionMap.set(material.id, consumption);
      });

      setConsumptionData(consumptionMap);
      logger.debug('[useAnalyticsData] Loaded consumption data for materials:', { value: materials.length });
    } catch (error) {
      logger.error('[useAnalyticsData] Error loading consumption data:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadConsumptionData();
  };

  const getConsumptionForMaterial = (materialId: string): ConsumptionData | undefined => {
    return consumptionData.get(materialId);
  };

  return {
    consumptionData,
    loading,
    refresh,
    getConsumptionForMaterial,
  };
};
