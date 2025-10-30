/**
 * Schema v12 Migration Tests
 *
 * Tests database migration from v11 to v12 for WBS management features
 */

import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import TemplateModuleModel from '../../models/TemplateModuleModel';
import InterfacePointModel from '../../models/InterfacePointModel';

describe('Schema v12 Migration', () => {
  // Database is already initialized by jest.setup.js
  // No beforeAll needed - tests will use the mocked database

  describe('New Tables', () => {
    it('should have template_modules table', async () => {
      const collection = database.collections.get<TemplateModuleModel>('template_modules');
      expect(collection).toBeDefined();
      expect(collection.table).toBe('template_modules');
    });

    it('should have interface_points table', async () => {
      const collection = database.collections.get<InterfacePointModel>('interface_points');
      expect(collection).toBeDefined();
      expect(collection.table).toBe('interface_points');
    });
  });

  describe('Items Table - New Columns', () => {
    let testItem: ItemModel;

    beforeEach(async () => {
      await database.write(async () => {
        testItem = await database.collections.get<ItemModel>('items').create((item) => {
          item.name = 'Test WBS Item';
          item.siteId = 'test-site';
          item.categoryId = 'test-category';
          item.plannedQuantity = 100;
          item.completedQuantity = 0;
          item.unitOfMeasurement = 'Set';
          item.plannedStartDate = Date.now();
          item.plannedEndDate = Date.now() + 86400000;
          item.status = 'not_started';
          item.weightage = 10;
          item.isBaselineLocked = false;
          item.dependencies = '[]';

          // New v12 fields
          item.projectPhase = 'construction';
          item.isMilestone = false;
          item.createdByRole = 'planner';
          item.wbsCode = '1.2.3.0';
          item.wbsLevel = 3;
          item.parentWbsCode = '1.2.0.0';
          item.isCriticalPath = true;
          item.floatDays = 0;
          item.dependencyRisk = 'high';
          item.riskNotes = 'Test risk notes';

          // v18/v20 fields (Activity 2)
          item.syncStatus = 'pending';
          item.version = 1;
        });
      });
    });

    afterEach(async () => {
      await database.write(async () => {
        await testItem.destroyPermanently();
      });
    });

    it('should save and retrieve project_phase field', () => {
      expect(testItem.projectPhase).toBe('construction');
    });

    it('should save and retrieve is_milestone field', () => {
      expect(testItem.isMilestone).toBe(false);
    });

    it('should save and retrieve created_by_role field', () => {
      expect(testItem.createdByRole).toBe('planner');
    });

    it('should save and retrieve wbs_code field', () => {
      expect(testItem.wbsCode).toBe('1.2.3.0');
    });

    it('should save and retrieve wbs_level field', () => {
      expect(testItem.wbsLevel).toBe(3);
    });

    it('should save and retrieve parent_wbs_code field', () => {
      expect(testItem.parentWbsCode).toBe('1.2.0.0');
    });

    it('should save and retrieve is_critical_path field', () => {
      expect(testItem.isCriticalPath).toBe(true);
    });

    it('should save and retrieve float_days field', () => {
      expect(testItem.floatDays).toBe(0);
    });

    it('should save and retrieve dependency_risk field', () => {
      expect(testItem.dependencyRisk).toBe('high');
    });

    it('should save and retrieve risk_notes field', () => {
      expect(testItem.riskNotes).toBe('Test risk notes');
    });
  });

  describe('Items Table - Phase Values', () => {
    const phases = [
      'design',
      'approvals',
      'mobilization',
      'procurement',
      'interface',
      'site_prep',
      'construction',
      'testing',
      'commissioning',
      'sat',
      'handover',
    ];

    phases.forEach((phase) => {
      it(`should support phase: ${phase}`, async () => {
        let item: ItemModel | undefined;

        await database.write(async () => {
          item = await database.collections.get<ItemModel>('items').create((i) => {
            i.name = `Test ${phase} Item`;
            i.siteId = 'test-site';
            i.categoryId = 'test-category';
            i.plannedQuantity = 100;
            i.completedQuantity = 0;
            i.unitOfMeasurement = 'Set';
            i.plannedStartDate = Date.now();
            i.plannedEndDate = Date.now() + 86400000;
            i.status = 'not_started';
            i.weightage = 10;
            i.isBaselineLocked = false;
            i.dependencies = '[]';
            i.projectPhase = phase as any;
            i.isMilestone = false;
            i.createdByRole = 'planner';
            i.wbsCode = '1.0.0.0';
            i.wbsLevel = 1;
            i.isCriticalPath = false;
            i.syncStatus = 'pending';
            i.version = 1;
          });
        });

        expect(item?.projectPhase).toBe(phase);

        if (item) {
          await database.write(async () => {
            await item!.destroyPermanently();
          });
        }
      });
    });
  });

  describe('Items Table - Risk Levels', () => {
    const riskLevels = ['low', 'medium', 'high'];

    riskLevels.forEach((risk) => {
      it(`should support risk level: ${risk}`, async () => {
        let item: ItemModel | undefined;

        await database.write(async () => {
          item = await database.collections.get<ItemModel>('items').create((i) => {
            i.name = `Test ${risk} Risk Item`;
            i.siteId = 'test-site';
            i.categoryId = 'test-category';
            i.plannedQuantity = 100;
            i.completedQuantity = 0;
            i.unitOfMeasurement = 'Set';
            i.plannedStartDate = Date.now();
            i.plannedEndDate = Date.now() + 86400000;
            i.status = 'not_started';
            i.weightage = 10;
            i.isBaselineLocked = false;
            i.dependencies = '[]';
            i.projectPhase = 'construction';
            i.isMilestone = false;
            i.createdByRole = 'planner';
            i.wbsCode = '1.0.0.0';
            i.wbsLevel = 1;
            i.isCriticalPath = false;
            i.dependencyRisk = risk as any;
            i.syncStatus = 'pending';
            i.version = 1;
          });
        });

        expect(item?.dependencyRisk).toBe(risk);

        if (item) {
          await database.write(async () => {
            await item!.destroyPermanently();
          });
        }
      });
    });
  });
});
