/**
 * WBSCodeGenerator Service Tests (Sprint 1)
 *
 * Tests for WBS code generation logic
 */

import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';

describe('WBSCodeGenerator', () => {
  const testSiteId = 'test-site-wbs';

  // No database reset needed - Jest provides clean environment

  beforeEach(async () => {
    // Clean up items for this test site before each test
    await database.write(async () => {
      const existingItems = await database.collections
        .get<ItemModel>('items')
        .query()
        .fetch();

      for (const item of existingItems) {
        await item.destroyPermanently();
      }
    });
  });

  describe('generateRootCode()', () => {
    it('should generate 1.0.0.0 for first root item', async () => {
      const code = await WBSCodeGenerator.generateRootCode(testSiteId);
      expect(code).toBe('1.0.0.0');
    });

    it('should generate 2.0.0.0 when one root item exists', async () => {
      // Create first root item
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Root Item 1';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.0.0.0';
          item.wbsLevel = 1;
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      const code = await WBSCodeGenerator.generateRootCode(testSiteId);
      expect(code).toBe('2.0.0.0');
    });

    it('should generate 5.0.0.0 when four root items exist', async () => {
      // Create four root items
      for (let i = 1; i <= 4; i++) {
        await database.write(async () => {
          await database.collections.get<ItemModel>('items').create((item) => {
            item.name = `Root Item ${i}`;
            item.siteId = testSiteId;
            item.categoryId = 'test-cat';
            item.wbsCode = `${i}.0.0.0`;
            item.wbsLevel = 1;
            item.plannedQuantity = 1;
            item.completedQuantity = 0;
            item.unitOfMeasurement = 'Set';
            item.plannedStartDate = Date.now();
            item.plannedEndDate = Date.now() + 86400000;
            item.status = 'not_started';
            item.dependencies = '[]';
            item.isBaselineLocked = false;
            item.projectPhase = 'construction';
            item.isMilestone = false;
            item.createdByRole = 'planner';
            item.isCriticalPath = false;
          });
        });
      }

      const code = await WBSCodeGenerator.generateRootCode(testSiteId);
      expect(code).toBe('5.0.0.0');
    });
  });

  describe('generateChildCode()', () => {
    it('should generate 1.1.0.0 for first child of 1.0.0.0', async () => {
      const code = await WBSCodeGenerator.generateChildCode(testSiteId, '1.0.0.0');
      expect(code).toBe('1.1.0.0');
    });

    it('should generate 1.2.0.0 when one child exists', async () => {
      // Create parent
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Parent Item';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.0.0.0';
          item.wbsLevel = 1;
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      // Create first child
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Child Item 1';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.1.0.0';
          item.wbsLevel = 2;
          item.parentWbsCode = '1.0.0.0';
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      const code = await WBSCodeGenerator.generateChildCode(testSiteId, '1.0.0.0');
      expect(code).toBe('1.2.0.0');
    });

    it('should generate 1.2.3.0 for first child of 1.2.0.0', async () => {
      const code = await WBSCodeGenerator.generateChildCode(testSiteId, '1.2.0.0');
      expect(code).toBe('1.2.1.0');
    });

    it('should generate 1.2.3.1 for first child of 1.2.3.0', async () => {
      const code = await WBSCodeGenerator.generateChildCode(testSiteId, '1.2.3.0');
      expect(code).toBe('1.2.3.1');
    });

    it('should handle multiple children at level 3', async () => {
      // Create parent at level 2
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Parent Item';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.2.0.0';
          item.wbsLevel = 2;
          item.parentWbsCode = '1.0.0.0';
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      // Create two children
      for (let i = 1; i <= 2; i++) {
        await database.write(async () => {
          await database.collections.get<ItemModel>('items').create((item) => {
            item.name = `Child Item ${i}`;
            item.siteId = testSiteId;
            item.categoryId = 'test-cat';
            item.wbsCode = `1.2.${i}.0`;
            item.wbsLevel = 3;
            item.parentWbsCode = '1.2.0.0';
            item.plannedQuantity = 1;
            item.completedQuantity = 0;
            item.unitOfMeasurement = 'Set';
            item.plannedStartDate = Date.now();
            item.plannedEndDate = Date.now() + 86400000;
            item.status = 'not_started';
            item.dependencies = '[]';
            item.isBaselineLocked = false;
            item.projectPhase = 'construction';
            item.isMilestone = false;
            item.createdByRole = 'planner';
            item.isCriticalPath = false;
          });
        });
      }

      const code = await WBSCodeGenerator.generateChildCode(testSiteId, '1.2.0.0');
      expect(code).toBe('1.2.3.0');
    });
  });

  describe('generateSiblingCode()', () => {
    it('should generate 1.2.0.0 as sibling of 1.1.0.0', async () => {
      // Create the sibling item 1.1.0.0
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Sibling Item 1.1';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.1.0.0';
          item.wbsLevel = 2;
          item.parentWbsCode = '1.0.0.0';
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      const code = await WBSCodeGenerator.generateSiblingCode(testSiteId, '1.1.0.0');
      expect(code).toBe('1.2.0.0');
    });

    it('should generate 2.0.0.0 as sibling of 1.0.0.0', async () => {
      // Create the sibling item 1.0.0.0
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Root Item 1';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.0.0.0';
          item.wbsLevel = 1;
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      const code = await WBSCodeGenerator.generateSiblingCode(testSiteId, '1.0.0.0');
      expect(code).toBe('2.0.0.0');
    });
  });

  describe('isCodeUnique()', () => {
    it('should return true for unique code', async () => {
      const isUnique = await WBSCodeGenerator.isCodeUnique(testSiteId, '1.2.3.0');
      expect(isUnique).toBe(true);
    });

    it('should return false for existing code', async () => {
      // Create item with code 1.2.3.0
      await database.write(async () => {
        await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Test Item';
          item.siteId = testSiteId;
          item.categoryId = 'test-cat';
          item.wbsCode = '1.2.3.0';
          item.wbsLevel = 3;
          item.plannedQuantity = 1;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.dependencies = '[]';
          item.isBaselineLocked = false;
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.isCriticalPath = false;
        });
      });

      const isUnique = await WBSCodeGenerator.isCodeUnique(testSiteId, '1.2.3.0');
      expect(isUnique).toBe(false);
    });

    it('should return true when excluding item with same code', async () => {
      // Create item
      let item: ItemModel | undefined;
      await database.write(async () => {
        item = await database.collections.get<ItemModel>('items').create((i) => {
          i.name = 'Test Item';
          i.siteId = testSiteId;
          i.categoryId = 'test-cat';
          i.wbsCode = '1.2.3.0';
          i.wbsLevel = 3;
          i.plannedQuantity = 1;
          i.completedQuantity = 0;
          i.unitOfMeasurement = 'Set';
          i.plannedStartDate = Date.now();
          i.plannedEndDate = Date.now() + 86400000;
          i.status = 'not_started';
          i.dependencies = '[]';
          i.isBaselineLocked = false;
          i.projectPhase = 'construction';
          i.isMilestone = false;
          i.createdByRole = 'planner';
          i.isCriticalPath = false;
        });
      });

      const isUnique = await WBSCodeGenerator.isCodeUnique(testSiteId, '1.2.3.0', item!.id);
      expect(isUnique).toBe(true);
    });
  });

  describe('calculateLevel()', () => {
    it('should return 1 for root code 1.0.0.0', () => {
      expect(WBSCodeGenerator.calculateLevel('1.0.0.0')).toBe(1);
    });

    it('should return 2 for level 2 code 1.2.0.0', () => {
      expect(WBSCodeGenerator.calculateLevel('1.2.0.0')).toBe(2);
    });

    it('should return 3 for level 3 code 1.2.3.0', () => {
      expect(WBSCodeGenerator.calculateLevel('1.2.3.0')).toBe(3);
    });

    it('should return 4 for level 4 code 1.2.3.4', () => {
      expect(WBSCodeGenerator.calculateLevel('1.2.3.4')).toBe(4);
    });
  });

  describe('getParentCode()', () => {
    it('should return null for root code', () => {
      expect(WBSCodeGenerator.getParentCode('1.0.0.0')).toBeNull();
    });

    it('should return 1.0.0.0 for code 1.2.0.0', () => {
      expect(WBSCodeGenerator.getParentCode('1.2.0.0')).toBe('1.0.0.0');
    });

    it('should return 1.2.0.0 for code 1.2.3.0', () => {
      expect(WBSCodeGenerator.getParentCode('1.2.3.0')).toBe('1.2.0.0');
    });

    it('should return 1.2.3.0 for code 1.2.3.4', () => {
      expect(WBSCodeGenerator.getParentCode('1.2.3.4')).toBe('1.2.3.0');
    });
  });
});
