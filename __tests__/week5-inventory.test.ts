/**
 * Week 5: Inventory Optimization - Service Tests
 * Tests core functionality of InventoryOptimizationService
 */

import InventoryOptimizationService from '../src/services/InventoryOptimizationService';
import mockInventoryItems, {
  mockInventoryLocations,
  mockStockMovements,
  mockStockTransfers,
} from '../src/data/mockInventory';

describe('Week 5: Inventory Optimization Service Tests', () => {
  describe('ABC Analysis', () => {
    it('should perform ABC analysis correctly', () => {
      const items = [
        { materialId: 'mat_001', materialName: 'High Value', annualDemand: 1000, unitCost: 500 },
        { materialId: 'mat_002', materialName: 'Medium Value', annualDemand: 500, unitCost: 200 },
        { materialId: 'mat_003', materialName: 'Low Value', annualDemand: 100, unitCost: 50 },
      ];

      const results = InventoryOptimizationService.performABCAnalysis(items);

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      // First item should be highest value (sorted descending)
      expect(results[0].annualValue).toBeGreaterThan(results[1].annualValue);
    });

    it('should calculate cumulative percentages correctly', () => {
      const items = [
        { materialId: 'mat_001', materialName: 'Item 1', annualDemand: 1000, unitCost: 100 },
        { materialId: 'mat_002', materialName: 'Item 2', annualDemand: 500, unitCost: 100 },
      ];

      const results = InventoryOptimizationService.performABCAnalysis(items);

      expect(results[0].cumulativePercent).toBeGreaterThan(0);
      expect(results[results.length - 1].cumulativePercent).toBeCloseTo(100, 1);
    });

    it('should assign appropriate review frequencies', () => {
      const items = [
        { materialId: 'mat_001', materialName: 'Item A', annualDemand: 10000, unitCost: 100 },
        { materialId: 'mat_002', materialName: 'Item B', annualDemand: 1000, unitCost: 100 },
        { materialId: 'mat_003', materialName: 'Item C', annualDemand: 100, unitCost: 100 },
      ];

      const results = InventoryOptimizationService.performABCAnalysis(items);

      expect(results.length).toBe(3);
      // Check that review frequencies are assigned
      results.forEach(result => {
        expect(['daily', 'weekly', 'monthly']).toContain(result.reviewFrequency);
      });
    });
  });

  describe('EOQ Calculation', () => {
    it('should calculate EOQ correctly', () => {
      const eoq = InventoryOptimizationService.calculateEOQ(
        'mat_001',
        'Test Material',
        12000, // annual demand
        500, // ordering cost
        20, // holding cost %
        100 // unit cost
      );

      expect(eoq).toBeDefined();
      expect(eoq.economicOrderQuantity).toBeGreaterThan(0);
      expect(eoq.numberOfOrders).toBeGreaterThan(0);
      expect(eoq.timeBetweenOrders).toBeGreaterThan(0);
    });

    it('should calculate total annual cost', () => {
      const eoq = InventoryOptimizationService.calculateEOQ(
        'mat_001',
        'Test Material',
        10000,
        500,
        20,
        100
      );

      expect(eoq.totalAnnualCost).toBe(eoq.annualOrderingCost + eoq.annualHoldingCost);
    });

    it('should calculate reorder point and safety stock', () => {
      const eoq = InventoryOptimizationService.calculateEOQ(
        'mat_001',
        'Test Material',
        10000,
        500,
        20,
        100
      );

      expect(eoq.reorderPoint).toBeGreaterThan(0);
      expect(eoq.safetyStock).toBeGreaterThan(0);
      expect(eoq.reorderPoint).toBeGreaterThan(eoq.safetyStock);
    });
  });

  describe('Safety Stock Calculation', () => {
    it('should calculate safety stock correctly', () => {
      const safetyStock = InventoryOptimizationService.calculateSafetyStock(
        'mat_001',
        'Test Material',
        100, // average daily demand
        20, // demand std dev
        7, // average lead time days
        2, // lead time std dev
        0.95 // service level
      );

      expect(safetyStock).toBeDefined();
      expect(safetyStock.safetyStock).toBeGreaterThan(0);
      expect(safetyStock.reorderPoint).toBeGreaterThan(0);
    });

    it('should use correct Z-score for service level', () => {
      const safetyStock = InventoryOptimizationService.calculateSafetyStock(
        'mat_001',
        'Test Material',
        100,
        20,
        7,
        2,
        0.95
      );

      expect(safetyStock.zScore).toBe(1.65); // 95% service level
    });

    it('should calculate max inventory level', () => {
      const safetyStock = InventoryOptimizationService.calculateSafetyStock(
        'mat_001',
        'Test Material',
        100,
        20,
        7,
        2,
        0.95
      );

      expect(safetyStock.maxInventoryLevel).toBeGreaterThan(safetyStock.reorderPoint);
    });
  });

  describe('Inventory Valuation', () => {
    it('should calculate total valuation for a location', () => {
      const location = mockInventoryLocations[0];
      const valuation = InventoryOptimizationService.calculateInventoryValuation(
        location.id,
        location.name,
        mockInventoryItems
      );

      expect(valuation).toBeDefined();
      expect(valuation.totalValue).toBeGreaterThan(0);
      expect(valuation.totalItems).toBeGreaterThan(0);
    });

    it('should provide category breakdown', () => {
      const location = mockInventoryLocations[0];
      const valuation = InventoryOptimizationService.calculateInventoryValuation(
        location.id,
        location.name,
        mockInventoryItems
      );

      expect(valuation.categoryBreakdown).toBeDefined();
      expect(valuation.categoryBreakdown.length).toBeGreaterThan(0);

      const totalPercent = valuation.categoryBreakdown.reduce(
        (sum, cat) => sum + cat.percentOfTotal,
        0
      );
      expect(totalPercent).toBeCloseTo(100, 0);
    });

    it('should identify obsolete and slow-moving stock', () => {
      const location = mockInventoryLocations[0];
      const valuation = InventoryOptimizationService.calculateInventoryValuation(
        location.id,
        location.name,
        mockInventoryItems
      );

      expect(valuation.obsoleteValue).toBeGreaterThanOrEqual(0);
      expect(valuation.slowMovingValue).toBeGreaterThanOrEqual(0);
      expect(valuation.fastMovingValue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Inventory Health Assessment', () => {
    it('should assess inventory health', () => {
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );

      expect(health).toBeDefined();
      expect(health.overallHealthScore).toBeGreaterThanOrEqual(0);
      expect(health.overallHealthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate turnover rate', () => {
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );

      expect(health.overallTurnoverRate).toBeGreaterThanOrEqual(0);
      expect(health.turnoverHealth).toMatch(/^(good|fair|poor)$/);
    });

    it('should identify stock risks', () => {
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );

      expect(health.stockoutRisk).toBeGreaterThanOrEqual(0);
      expect(health.stockoutRisk).toBeLessThanOrEqual(100);
      expect(health.overstockRisk).toBeGreaterThanOrEqual(0);
      expect(health.overstockRisk).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', () => {
      const totalValue = mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
      const health = InventoryOptimizationService.assessInventoryHealth(
        mockInventoryItems,
        mockStockMovements,
        totalValue
      );

      expect(health.recommendations).toBeDefined();
      expect(Array.isArray(health.recommendations)).toBe(true);

      if (health.recommendations.length > 0) {
        const rec = health.recommendations[0];
        expect(rec.type).toMatch(/^(reduce|increase|transfer|dispose)$/);
        expect(rec.materialId).toBeDefined();
        expect(rec.reason).toBeDefined();
      }
    });
  });

  describe('Transfer Optimization', () => {
    it('should optimize transfers between locations', () => {
      const availableLocations = [
        { locationId: 'loc_001', locationName: 'Loc 1', availableQuantity: 100, distance: 10, unitCost: 100 },
        { locationId: 'loc_002', locationName: 'Loc 2', availableQuantity: 50, distance: 5, unitCost: 100 },
        { locationId: 'loc_003', locationName: 'Loc 3', availableQuantity: 75, distance: 15, unitCost: 100 },
      ];

      const transfers = InventoryOptimizationService.optimizeTransfer(
        'mat_001',
        120,
        'target_loc',
        availableLocations
      );

      expect(transfers).toBeDefined();
      expect(transfers.length).toBeGreaterThan(0);

      const totalQuantity = transfers.reduce((sum, t) => sum + t.quantity, 0);
      expect(totalQuantity).toBe(120);
    });

    it('should prioritize closer locations', () => {
      const availableLocations = [
        { locationId: 'loc_far', locationName: 'Far', availableQuantity: 100, distance: 50, unitCost: 100 },
        { locationId: 'loc_near', locationName: 'Near', availableQuantity: 100, distance: 5, unitCost: 100 },
      ];

      const transfers = InventoryOptimizationService.optimizeTransfer(
        'mat_001',
        50,
        'target_loc',
        availableLocations
      );

      expect(transfers[0].fromLocationId).toBe('loc_near');
    });

    it('should calculate transport costs', () => {
      const availableLocations = [
        { locationId: 'loc_001', locationName: 'Loc 1', availableQuantity: 100, distance: 10, unitCost: 100 },
      ];

      const transfers = InventoryOptimizationService.optimizeTransfer(
        'mat_001',
        50,
        'target_loc',
        availableLocations
      );

      expect(transfers[0].transportCost).toBeGreaterThan(0);
    });
  });

  describe('Mock Data Integrity', () => {
    it('should have valid inventory locations', () => {
      expect(mockInventoryLocations.length).toBeGreaterThan(0);
      mockInventoryLocations.forEach(location => {
        expect(location.id).toBeDefined();
        expect(location.name).toBeDefined();
        expect(location.type).toMatch(/^(warehouse|site|yard|vendor)$/);
        expect(location.totalCapacity).toBeGreaterThan(0);
        expect(location.usedCapacity).toBeGreaterThanOrEqual(0);
        expect(location.availableCapacity).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid inventory items', () => {
      expect(mockInventoryItems.length).toBeGreaterThan(0);
      mockInventoryItems.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.materialId).toBeDefined();
        expect(item.locationId).toBeDefined();
        expect(item.quantity).toBeGreaterThanOrEqual(0);
        expect(item.unitCost).toBeGreaterThan(0);
        expect(['in_stock', 'low_stock', 'out_of_stock', 'overstocked', 'obsolete']).toContain(item.status);
        expect(['FIFO', 'LIFO', 'WAC']).toContain(item.costingMethod);
        if (item.abcCategory) {
          expect(['A', 'B', 'C']).toContain(item.abcCategory);
        }
      });
    });

    it('should have valid stock movements', () => {
      expect(mockStockMovements.length).toBeGreaterThan(0);
      mockStockMovements.forEach(movement => {
        expect(movement.id).toBeDefined();
        expect(movement.type).toMatch(/^(receipt|issue|transfer|adjustment|return)$/);
        expect(movement.materialId).toBeDefined();
        expect(movement.quantity).toBeGreaterThan(0);
        expect(movement.unitCost).toBeGreaterThan(0);
      });
    });

    it('should have valid stock transfers', () => {
      expect(mockStockTransfers.length).toBeGreaterThan(0);
      mockStockTransfers.forEach(transfer => {
        expect(transfer.id).toBeDefined();
        expect(transfer.transferNumber).toBeDefined();
        expect(transfer.fromLocationId).toBeDefined();
        expect(transfer.toLocationId).toBeDefined();
        expect(['requested', 'approved', 'in_transit', 'received', 'rejected']).toContain(transfer.status);
        expect(['low', 'medium', 'high', 'urgent']).toContain(transfer.priority);
      });
    });
  });
});
