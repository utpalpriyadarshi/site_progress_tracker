/**
 * useOptimizationData Hook
 *
 * Manages cost optimization recommendations and analysis
 * Phase 2: Data Hooks
 */

import { useState, useEffect } from 'react';
import {
  CostOptimizationService,
  CostOptimizationResult,
  ProcurementBundle,
  SupplierNegotiationAnalysis,
  TransportationOptimization,
  StorageOptimization,
} from '../../../services/CostOptimizationService';
import {
  mockCurrentCosts,
  mockVolumeDiscounts,
} from '../utils/analyticsConstants';
import { logger } from '../../../services/LoggingService';

export const useOptimizationData = (projectId: string | null) => {
  const [costOptimization, setCostOptimization] = useState<CostOptimizationResult | null>(null);
  const [procurementBundles, setProcurementBundles] = useState<ProcurementBundle[]>([]);
  const [supplierNegotiation, setSupplierNegotiation] = useState<SupplierNegotiationAnalysis[]>([]);
  const [transportationOpt, setTransportationOpt] = useState<TransportationOptimization | null>(null);
  const [storageOpt, setStorageOpt] = useState<StorageOptimization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadOptimizationData();
    }
  }, [projectId]);

  const loadOptimizationData = () => {
    try {
      setLoading(true);

      // Cost optimization analysis
      const costOpt = CostOptimizationService.performCostOptimization(
        mockCurrentCosts,
        {},
        {},
        {},
        {}
      );
      setCostOptimization(costOpt);

      // Procurement bundle optimization
      const bundles = CostOptimizationService.optimizeProcurementBundles(
        [
          {
            materialId: 'm1',
            materialName: 'Concrete Mix',
            quantity: 250,
            unit: 'm³',
            unitCost: 150,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
          {
            materialId: 'm2',
            materialName: 'Steel Rebar',
            quantity: 300,
            unit: 'tons',
            unitCost: 800,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
          {
            materialId: 'm3',
            materialName: 'Cement Bags',
            quantity: 500,
            unit: 'bags',
            unitCost: 12,
            supplierId: 's1',
            supplierName: 'ABC Materials Inc',
          },
        ],
        mockVolumeDiscounts
      );
      setProcurementBundles(bundles);

      // Supplier negotiation analysis
      const negotiation = [
        CostOptimizationService.analyzeSupplierNegotiation(
          's1',
          'ABC Materials Inc',
          120000,
          8,
          12,
          10000,
          [500, 520, 510, 530],
          [520, 525, 515, 535],
          88,
          92
        ),
      ];
      setSupplierNegotiation(negotiation);

      // Transportation optimization
      const transOpt = CostOptimizationService.optimizeTransportationCosts([
        { route: 'Supplier A -> Site 1', deliveries: 8, cost: 12000, mode: 'truck' },
        { route: 'Supplier B -> Site 2', deliveries: 6, cost: 9000, mode: 'truck' },
        { route: 'Warehouse -> Site 1', deliveries: 4, cost: 5000, mode: 'truck' },
      ]);
      setTransportationOpt(transOpt);

      // Storage optimization
      const storOpt = CostOptimizationService.optimizeStorageCosts(
        10000,
        6500,
        20000,
        [
          { materialId: 'm1', materialName: 'Concrete Mix', quantity: 100, turnoverRate: 8, spaceRequired: 500 },
          { materialId: 'm2', materialName: 'Steel Rebar', quantity: 50, turnoverRate: 3, spaceRequired: 300 },
          { materialId: 'm3', materialName: 'Cement Bags', quantity: 200, turnoverRate: 12, spaceRequired: 200 },
        ]
      );
      setStorageOpt(storOpt);

      logger.debug('[useOptimizationData] Loaded optimization data', {
        bundles: bundles.length,
        negotiation: negotiation.length,
      });
    } catch (error) {
      logger.error('[useOptimizationData] Error loading optimization data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadOptimizationData();
  };

  return {
    costOptimization,
    procurementBundles,
    supplierNegotiation,
    transportationOpt,
    storageOpt,
    loading,
    refresh,
  };
};
