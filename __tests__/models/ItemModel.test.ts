/**
 * ItemModel Helper Methods Unit Tests
 *
 * Tests all helper methods for date calculations, progress tracking, etc.
 */

import ItemModel from '../../models/ItemModel';

describe('ItemModel', () => {
  let mockItem: Partial<ItemModel>;

  beforeEach(() => {
    // Reset mock item before each test
    mockItem = {
      name: 'Test Item',
      plannedStartDate: new Date('2025-01-01').getTime(),
      plannedEndDate: new Date('2025-01-10').getTime(),
      baselineStartDate: new Date('2025-01-01').getTime(),
      baselineEndDate: new Date('2025-01-08').getTime(),
      actualStartDate: new Date('2025-01-02').getTime(),
      actualEndDate: new Date('2025-01-12').getTime(),
      plannedQuantity: 100,
      completedQuantity: 75,
      dependencies: JSON.stringify(['item-1', 'item-2']),
    };
  });

  describe('getDependencies', () => {
    it('should parse valid JSON dependencies', () => {
      const item = {
        ...mockItem,
        getDependencies: ItemModel.prototype.getDependencies,
      } as ItemModel;

      const deps = item.getDependencies();

      expect(deps).toEqual(['item-1', 'item-2']);
    });

    it('should return empty array for invalid JSON', () => {
      const item = {
        ...mockItem,
        dependencies: 'invalid-json-{',
        getDependencies: ItemModel.prototype.getDependencies,
      } as ItemModel;

      const deps = item.getDependencies();

      expect(deps).toEqual([]);
    });

    it('should return empty array for undefined dependencies', () => {
      const item = {
        ...mockItem,
        dependencies: undefined,
        getDependencies: ItemModel.prototype.getDependencies,
      } as ItemModel;

      const deps = item.getDependencies();

      expect(deps).toEqual([]);
    });

    it('should return empty array for null dependencies', () => {
      const item = {
        ...mockItem,
        dependencies: null,
        getDependencies: ItemModel.prototype.getDependencies,
      } as ItemModel;

      const deps = item.getDependencies();

      expect(deps).toEqual([]);
    });

    it('should return empty array for empty JSON array', () => {
      const item = {
        ...mockItem,
        dependencies: '[]',
        getDependencies: ItemModel.prototype.getDependencies,
      } as ItemModel;

      const deps = item.getDependencies();

      expect(deps).toEqual([]);
    });
  });

  describe('setDependencies', () => {
    it('should serialize array to JSON string', () => {
      const item = {
        setDependencies: ItemModel.prototype.setDependencies,
      } as ItemModel;

      const result = item.setDependencies(['dep-1', 'dep-2', 'dep-3']);

      expect(result).toBe('["dep-1","dep-2","dep-3"]');
      expect(JSON.parse(result)).toEqual(['dep-1', 'dep-2', 'dep-3']);
    });

    it('should handle empty array', () => {
      const item = {
        setDependencies: ItemModel.prototype.setDependencies,
      } as ItemModel;

      const result = item.setDependencies([]);

      expect(result).toBe('[]');
    });
  });

  describe('getPlannedDuration', () => {
    it('should calculate duration in days', () => {
      const item = {
        ...mockItem,
        getPlannedDuration: ItemModel.prototype.getPlannedDuration,
      } as ItemModel;

      const duration = item.getPlannedDuration();

      // Jan 1 to Jan 10 = 9 days
      expect(duration).toBe(9);
    });

    it('should return 0 for same start and end date', () => {
      const item = {
        plannedStartDate: new Date('2025-01-01').getTime(),
        plannedEndDate: new Date('2025-01-01').getTime(),
        getPlannedDuration: ItemModel.prototype.getPlannedDuration,
      } as ItemModel;

      const duration = item.getPlannedDuration();

      expect(duration).toBe(0);
    });

    it('should handle multi-month durations', () => {
      const item = {
        plannedStartDate: new Date('2025-01-01').getTime(),
        plannedEndDate: new Date('2025-03-01').getTime(),
        getPlannedDuration: ItemModel.prototype.getPlannedDuration,
      } as ItemModel;

      const duration = item.getPlannedDuration();

      expect(duration).toBe(59); // Jan + Feb = 59 days
    });
  });

  describe('getActualDuration', () => {
    it('should calculate actual duration in days', () => {
      const item = {
        ...mockItem,
        getActualDuration: ItemModel.prototype.getActualDuration,
      } as ItemModel;

      const duration = item.getActualDuration();

      // Jan 2 to Jan 12 = 10 days
      expect(duration).toBe(10);
    });

    it('should return 0 when actualStartDate is not set', () => {
      const item = {
        ...mockItem,
        actualStartDate: undefined,
        getActualDuration: ItemModel.prototype.getActualDuration,
      } as ItemModel;

      const duration = item.getActualDuration();

      expect(duration).toBe(0);
    });

    it('should return 0 when actualEndDate is not set', () => {
      const item = {
        ...mockItem,
        actualEndDate: undefined,
        getActualDuration: ItemModel.prototype.getActualDuration,
      } as ItemModel;

      const duration = item.getActualDuration();

      expect(duration).toBe(0);
    });
  });

  describe('getScheduleVariance', () => {
    it('should calculate positive variance (delayed)', () => {
      const item = {
        ...mockItem,
        getScheduleVariance: ItemModel.prototype.getScheduleVariance,
      } as ItemModel;

      const variance = item.getScheduleVariance();

      // Actual ends Jan 12, planned ends Jan 10 = +2 days delayed
      expect(variance).toBe(2);
    });

    it('should calculate negative variance (ahead)', () => {
      const item = {
        plannedEndDate: new Date('2025-01-15').getTime(),
        actualEndDate: new Date('2025-01-10').getTime(),
        getScheduleVariance: ItemModel.prototype.getScheduleVariance,
      } as ItemModel;

      const variance = item.getScheduleVariance();

      // Actual ends Jan 10, planned ends Jan 15 = -5 days ahead
      expect(variance).toBe(-5);
    });

    it('should return 0 when actualEndDate is not set', () => {
      const item = {
        ...mockItem,
        actualEndDate: undefined,
        getScheduleVariance: ItemModel.prototype.getScheduleVariance,
      } as ItemModel;

      const variance = item.getScheduleVariance();

      expect(variance).toBe(0);
    });

    it('should return 0 when on schedule exactly', () => {
      const item = {
        plannedEndDate: new Date('2025-01-10').getTime(),
        actualEndDate: new Date('2025-01-10').getTime(),
        getScheduleVariance: ItemModel.prototype.getScheduleVariance,
      } as ItemModel;

      const variance = item.getScheduleVariance();

      expect(variance).toBe(0);
    });
  });

  describe('getBaselineVariance', () => {
    it('should calculate positive variance (behind baseline)', () => {
      const item = {
        ...mockItem,
        getBaselineVariance: ItemModel.prototype.getBaselineVariance,
      } as ItemModel;

      const variance = item.getBaselineVariance();

      // Planned ends Jan 10, baseline ends Jan 8 = +2 days behind
      expect(variance).toBe(2);
    });

    it('should calculate negative variance (ahead of baseline)', () => {
      const item = {
        plannedEndDate: new Date('2025-01-05').getTime(),
        baselineEndDate: new Date('2025-01-10').getTime(),
        getBaselineVariance: ItemModel.prototype.getBaselineVariance,
      } as ItemModel;

      const variance = item.getBaselineVariance();

      // Planned ends Jan 5, baseline ends Jan 10 = -5 days ahead
      expect(variance).toBe(-5);
    });

    it('should return 0 when baselineEndDate is not set', () => {
      const item = {
        ...mockItem,
        baselineEndDate: undefined,
        getBaselineVariance: ItemModel.prototype.getBaselineVariance,
      } as ItemModel;

      const variance = item.getBaselineVariance();

      expect(variance).toBe(0);
    });

    it('should return 0 when plannedEndDate is not set', () => {
      const item = {
        ...mockItem,
        plannedEndDate: undefined,
        getBaselineVariance: ItemModel.prototype.getBaselineVariance,
      } as ItemModel;

      const variance = item.getBaselineVariance();

      expect(variance).toBe(0);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate progress percentage', () => {
      const item = {
        ...mockItem,
        getProgressPercentage: ItemModel.prototype.getProgressPercentage,
      } as ItemModel;

      const progress = item.getProgressPercentage();

      // 75 completed / 100 planned = 75%
      expect(progress).toBe(75);
    });

    it('should return 0 when plannedQuantity is 0', () => {
      const item = {
        plannedQuantity: 0,
        completedQuantity: 50,
        getProgressPercentage: ItemModel.prototype.getProgressPercentage,
      } as ItemModel;

      const progress = item.getProgressPercentage();

      expect(progress).toBe(0);
    });

    it('should cap at 100% when over-completed', () => {
      const item = {
        plannedQuantity: 100,
        completedQuantity: 150,
        getProgressPercentage: ItemModel.prototype.getProgressPercentage,
      } as ItemModel;

      const progress = item.getProgressPercentage();

      expect(progress).toBe(100);
    });

    it('should return 0 for not started items', () => {
      const item = {
        plannedQuantity: 100,
        completedQuantity: 0,
        getProgressPercentage: ItemModel.prototype.getProgressPercentage,
      } as ItemModel;

      const progress = item.getProgressPercentage();

      expect(progress).toBe(0);
    });

    it('should handle decimal progress correctly', () => {
      const item = {
        plannedQuantity: 100,
        completedQuantity: 33,
        getProgressPercentage: ItemModel.prototype.getProgressPercentage,
      } as ItemModel;

      const progress = item.getProgressPercentage();

      expect(progress).toBe(33);
    });
  });

  // WBS & Phase Management Tests (v12)
  describe('getFormattedWbsCode', () => {
    it('should return WBS code when set', () => {
      const item = {
        wbsCode: '1.2.3.4',
        getFormattedWbsCode: ItemModel.prototype.getFormattedWbsCode,
      } as ItemModel;

      expect(item.getFormattedWbsCode()).toBe('1.2.3.4');
    });

    it('should return N/A when wbsCode is not set', () => {
      const item = {
        wbsCode: undefined,
        getFormattedWbsCode: ItemModel.prototype.getFormattedWbsCode,
      } as ItemModel;

      expect(item.getFormattedWbsCode()).toBe('N/A');
    });
  });

  describe('getIndentLevel', () => {
    it('should return 0 for level 1 (root)', () => {
      const item = {
        wbsLevel: 1,
        getIndentLevel: ItemModel.prototype.getIndentLevel,
      } as ItemModel;

      expect(item.getIndentLevel()).toBe(0);
    });

    it('should return 1 for level 2', () => {
      const item = {
        wbsLevel: 2,
        getIndentLevel: ItemModel.prototype.getIndentLevel,
      } as ItemModel;

      expect(item.getIndentLevel()).toBe(1);
    });

    it('should return 3 for level 4', () => {
      const item = {
        wbsLevel: 4,
        getIndentLevel: ItemModel.prototype.getIndentLevel,
      } as ItemModel;

      expect(item.getIndentLevel()).toBe(3);
    });
  });

  describe('getPhaseLabel', () => {
    it('should return correct label for design phase', () => {
      const item = {
        projectPhase: 'design' as const,
        getPhaseLabel: ItemModel.prototype.getPhaseLabel,
      } as ItemModel;

      expect(item.getPhaseLabel()).toBe('✏️ Design & Engineering');
    });

    it('should return correct label for construction phase', () => {
      const item = {
        projectPhase: 'construction' as const,
        getPhaseLabel: ItemModel.prototype.getPhaseLabel,
      } as ItemModel;

      expect(item.getPhaseLabel()).toBe('🔨 Construction');
    });

    it('should return correct label for SAT phase', () => {
      const item = {
        projectPhase: 'sat' as const,
        getPhaseLabel: ItemModel.prototype.getPhaseLabel,
      } as ItemModel;

      expect(item.getPhaseLabel()).toBe('✅ Site Acceptance Test');
    });

    it('should return Unknown for invalid phase', () => {
      const item = {
        projectPhase: 'invalid_phase' as any,
        getPhaseLabel: ItemModel.prototype.getPhaseLabel,
      } as ItemModel;

      expect(item.getPhaseLabel()).toBe('Unknown');
    });
  });

  describe('getPhaseColor', () => {
    it('should return blue for design phase', () => {
      const item = {
        projectPhase: 'design' as const,
        getPhaseColor: ItemModel.prototype.getPhaseColor,
      } as ItemModel;

      expect(item.getPhaseColor()).toBe('#2196F3');
    });

    it('should return green for construction phase', () => {
      const item = {
        projectPhase: 'construction' as const,
        getPhaseColor: ItemModel.prototype.getPhaseColor,
      } as ItemModel;

      expect(item.getPhaseColor()).toBe('#4CAF50');
    });

    it('should return default color for invalid phase', () => {
      const item = {
        projectPhase: 'invalid' as any,
        getPhaseColor: ItemModel.prototype.getPhaseColor,
      } as ItemModel;

      expect(item.getPhaseColor()).toBe('#666666');
    });
  });

  describe('isOnCriticalPath', () => {
    it('should return true when isCriticalPath flag is set', () => {
      const item = {
        isCriticalPath: true,
        floatDays: 10,
        isOnCriticalPath: ItemModel.prototype.isOnCriticalPath,
      } as ItemModel;

      expect(item.isOnCriticalPath()).toBe(true);
    });

    it('should return true when float days is 0', () => {
      const item = {
        isCriticalPath: false,
        floatDays: 0,
        isOnCriticalPath: ItemModel.prototype.isOnCriticalPath,
      } as ItemModel;

      expect(item.isOnCriticalPath()).toBe(true);
    });

    it('should return true when float days is negative', () => {
      const item = {
        isCriticalPath: false,
        floatDays: -5,
        isOnCriticalPath: ItemModel.prototype.isOnCriticalPath,
      } as ItemModel;

      expect(item.isOnCriticalPath()).toBe(true);
    });

    it('should return false when not critical and has positive float', () => {
      const item = {
        isCriticalPath: false,
        floatDays: 5,
        isOnCriticalPath: ItemModel.prototype.isOnCriticalPath,
      } as ItemModel;

      expect(item.isOnCriticalPath()).toBe(false);
    });

    it('should return false when floatDays is undefined', () => {
      const item = {
        isCriticalPath: false,
        floatDays: undefined,
        isOnCriticalPath: ItemModel.prototype.isOnCriticalPath,
      } as ItemModel;

      expect(item.isOnCriticalPath()).toBe(false);
    });
  });

  describe('getRiskBadgeColor', () => {
    it('should return null for low risk', () => {
      const item = {
        dependencyRisk: 'low' as const,
        getRiskBadgeColor: ItemModel.prototype.getRiskBadgeColor,
      } as ItemModel;

      expect(item.getRiskBadgeColor()).toBe(null);
    });

    it('should return amber for medium risk', () => {
      const item = {
        dependencyRisk: 'medium' as const,
        getRiskBadgeColor: ItemModel.prototype.getRiskBadgeColor,
      } as ItemModel;

      expect(item.getRiskBadgeColor()).toBe('#FFC107');
    });

    it('should return red for high risk', () => {
      const item = {
        dependencyRisk: 'high' as const,
        getRiskBadgeColor: ItemModel.prototype.getRiskBadgeColor,
      } as ItemModel;

      expect(item.getRiskBadgeColor()).toBe('#F44336');
    });

    it('should return null when dependencyRisk is not set', () => {
      const item = {
        dependencyRisk: undefined,
        getRiskBadgeColor: ItemModel.prototype.getRiskBadgeColor,
      } as ItemModel;

      expect(item.getRiskBadgeColor()).toBe(null);
    });
  });
});
