import { useState, useEffect } from 'react';
import { logger } from '../../../services/LoggingService';
import InventoryOptimizationService, {
  InventoryItem,
  InventoryLocation,
  StockTransfer,
  ABCAnalysisResult,
  InventoryHealth,
} from '../../../services/InventoryOptimizationService';
import mockInventoryItems, {
  mockInventoryLocations,
  mockStockMovements,
  mockStockTransfers,
} from '../../../data/mockInventory';

/**
 * useInventoryData Hook
 *
 * Manages inventory data loading, ABC analysis, and health assessment.
 *
 * @returns {Object} Inventory data, loading state, and refresh function
 *
 * Extracted from InventoryManagementScreen.tsx Phase 2.
 */
export const useInventoryData = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<ABCAnalysisResult[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth | null>(null);

  // Load inventory data
  const loadInventoryData = () => {
    setLoading(true);
    try {
      logger.info('[Inventory] Loading inventory data...');

      // Load mock data
      setItems(mockInventoryItems);
      setLocations(mockInventoryLocations);
      setTransfers(mockStockTransfers);

      // Perform ABC analysis
      const abcItems = mockInventoryItems
        .filter(item => item.annualDemand && item.annualDemand > 0)
        .map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          annualDemand: item.annualDemand!,
          unitCost: item.unitCost,
        }));

      const abc = InventoryOptimizationService.performABCAnalysis(abcItems);
      setAbcAnalysis(abc);
      logger.info('[Inventory] ABC Analysis complete', { categoriesFound: abc.length });

      // Assess inventory health
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );
      setInventoryHealth(health);
      logger.info('[Inventory] Health assessment complete', {
        healthScore: health.overallHealthScore
      });

      logger.info('[Inventory] Data loaded successfully', {
        items: mockInventoryItems.length,
        locations: mockInventoryLocations.length,
        transfers: mockStockTransfers.length,
      });
    } catch (error) {
      logger.error('[Inventory] Error loading inventory data:', error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadInventoryData();
    setRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    loadInventoryData();
  }, []);

  return {
    // Data
    items,
    locations,
    transfers,
    abcAnalysis,
    inventoryHealth,

    // State
    loading,
    refreshing,

    // Actions
    refresh: handleRefresh,
  };
};
