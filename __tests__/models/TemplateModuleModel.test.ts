/**
 * TemplateModuleModel Unit Tests (Sprint 1)
 *
 * Tests for template module model including JSON parsing and helper methods
 */

import { database } from '../../models/database';
import TemplateModuleModel from '../../models/TemplateModuleModel';

describe('TemplateModuleModel', () => {
  // No database reset needed - Jest provides clean environment
  // Each test cleans up its own data

  describe('Model Creation', () => {
    it('should create a template module with required fields', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = '220kV Substation';
            m.category = 'substation';
            m.voltageLevel = '220kV';
            m.itemsJson = JSON.stringify([
              {
                name: 'Design SLD',
                phase: 'design',
                duration: 30,
                dependencies: [],
                wbsCode: '1.1.0.0',
              },
            ]);
            m.compatibleModules = JSON.stringify([]);
            m.isPredefined = true;
            m.description = 'Complete 220kV substation template';
          });
      });

      expect(module).toBeDefined();
      expect(module!.name).toBe('220kV Substation');
      expect(module!.category).toBe('substation');
      expect(module!.voltageLevel).toBe('220kV');
      expect(module!.isPredefined).toBe(true);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should support all category types', async () => {
      const categories: Array<'substation' | 'ohe' | 'third_rail' | 'building' | 'interface'> = [
        'substation',
        'ohe',
        'third_rail',
        'building',
        'interface',
      ];

      for (const category of categories) {
        let module: TemplateModuleModel | undefined;

        await database.write(async () => {
          module = await database.collections
            .get<TemplateModuleModel>('template_modules')
            .create((m) => {
              m.name = `Test ${category}`;
              m.category = category;
              m.itemsJson = '[]';
              m.compatibleModules = '[]';
              m.isPredefined = false;
              m.description = `Test for ${category}`;
            });
        });

        expect(module!.category).toBe(category);

        // Cleanup
        if (module) {
          await database.write(async () => {
            await module!.destroyPermanently();
          });
        }
      }
    });

    it('should support all voltage levels', async () => {
      const voltageLevels: Array<'220kV' | '132kV' | '66kV' | '33kV' | '25kV' | '650VDC'> = [
        '220kV',
        '132kV',
        '66kV',
        '33kV',
        '25kV',
        '650VDC',
      ];

      for (const voltage of voltageLevels) {
        let module: TemplateModuleModel | undefined;

        await database.write(async () => {
          module = await database.collections
            .get<TemplateModuleModel>('template_modules')
            .create((m) => {
              m.name = `Test ${voltage}`;
              m.category = 'substation';
              m.voltageLevel = voltage;
              m.itemsJson = '[]';
              m.compatibleModules = '[]';
              m.isPredefined = false;
              m.description = `Test for ${voltage}`;
            });
        });

        expect(module!.voltageLevel).toBe(voltage);

        // Cleanup
        if (module) {
          await database.write(async () => {
            await module!.destroyPermanently();
          });
        }
      }
    });
  });

  describe('getItems()', () => {
    it('should parse items JSON correctly', async () => {
      let module: TemplateModuleModel | undefined;

      const testItems = [
        {
          name: 'Design SLD',
          phase: 'design',
          duration: 30,
          dependencies: [],
          wbsCode: '1.1.0.0',
          isMilestone: false,
        },
        {
          name: 'Procurement Transformer',
          phase: 'procurement',
          duration: 180,
          dependencies: ['item-1'],
          wbsCode: '1.2.0.0',
          isMilestone: true,
          quantity: 2,
          unit: 'Nos',
        },
      ];

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = JSON.stringify(testItems);
            m.compatibleModules = '[]';
            m.isPredefined = true;
            m.description = 'Test module';
          });
      });

      const items = module!.getItems();

      expect(items).toHaveLength(2);
      expect(items[0].name).toBe('Design SLD');
      expect(items[0].phase).toBe('design');
      expect(items[0].duration).toBe(30);
      expect(items[1].name).toBe('Procurement Transformer');
      expect(items[1].quantity).toBe(2);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should return empty array for invalid JSON', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = 'invalid-json-{';
            m.compatibleModules = '[]';
            m.isPredefined = false;
            m.description = 'Test module';
          });
      });

      const items = module!.getItems();
      expect(items).toEqual([]);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should return empty array for empty JSON array', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = '[]';
            m.compatibleModules = '[]';
            m.isPredefined = false;
            m.description = 'Test module';
          });
      });

      const items = module!.getItems();
      expect(items).toEqual([]);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });
  });

  describe('getCompatibleModuleIds()', () => {
    it('should parse compatible modules correctly', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = '[]';
            m.compatibleModules = JSON.stringify(['module-1', 'module-2', 'module-3']);
            m.isPredefined = true;
            m.description = 'Test module';
          });
      });

      const compatibleIds = module!.getCompatibleModuleIds();

      expect(compatibleIds).toHaveLength(3);
      expect(compatibleIds).toContain('module-1');
      expect(compatibleIds).toContain('module-2');
      expect(compatibleIds).toContain('module-3');

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should return empty array for invalid JSON', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = '[]';
            m.compatibleModules = 'invalid-json-[';
            m.isPredefined = false;
            m.description = 'Test module';
          });
      });

      const compatibleIds = module!.getCompatibleModuleIds();
      expect(compatibleIds).toEqual([]);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });
  });

  describe('getItemCount()', () => {
    it('should return correct item count', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = JSON.stringify([
              { name: 'Item 1', phase: 'design', duration: 10, dependencies: [], wbsCode: '1.0.0.0' },
              { name: 'Item 2', phase: 'procurement', duration: 20, dependencies: [], wbsCode: '2.0.0.0' },
              { name: 'Item 3', phase: 'construction', duration: 30, dependencies: [], wbsCode: '3.0.0.0' },
            ]);
            m.compatibleModules = '[]';
            m.isPredefined = true;
            m.description = 'Test module';
          });
      });

      expect(module!.getItemCount()).toBe(3);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should return 0 for empty items', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = '[]';
            m.compatibleModules = '[]';
            m.isPredefined = false;
            m.description = 'Test module';
          });
      });

      expect(module!.getItemCount()).toBe(0);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });
  });

  describe('getEstimatedDuration()', () => {
    it('should return max duration from items', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = JSON.stringify([
              { name: 'Item 1', phase: 'design', duration: 30, dependencies: [], wbsCode: '1.0.0.0' },
              { name: 'Item 2', phase: 'procurement', duration: 180, dependencies: [], wbsCode: '2.0.0.0' },
              { name: 'Item 3', phase: 'construction', duration: 90, dependencies: [], wbsCode: '3.0.0.0' },
            ]);
            m.compatibleModules = '[]';
            m.isPredefined = true;
            m.description = 'Test module';
          });
      });

      // Simple max duration (actual critical path would require dependency analysis)
      expect(module!.getEstimatedDuration()).toBe(180);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });

    it('should return 0 for empty items', async () => {
      let module: TemplateModuleModel | undefined;

      await database.write(async () => {
        module = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .create((m) => {
            m.name = 'Test Module';
            m.category = 'substation';
            m.itemsJson = '[]';
            m.compatibleModules = '[]';
            m.isPredefined = false;
            m.description = 'Test module';
          });
      });

      expect(module!.getEstimatedDuration()).toBe(0);

      // Cleanup
      if (module) {
        await database.write(async () => {
          await module!.destroyPermanently();
        });
      }
    });
  });
});
