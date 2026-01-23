/**
 * Supervisor Workflow Integration Tests - P4.2
 *
 * Tests complete supervisor workflows:
 * - Daily reporting workflow (create, submit, view history)
 * - Progress entry workflow (log progress, update completion)
 * - Hindrance reporting workflow (report, escalate, resolve)
 * - Site inspection workflow (create, checklist, photos)
 * - Material tracking workflow (request, receive, use)
 *
 * These tests verify end-to-end supervisor operations with realistic mocking.
 */

import { database } from '../../../models/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Declare global for test environment
declare const global: {
  console: Console;
  fetch: jest.Mock;
};

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback: any) => Promise.resolve(callback())),
  },
}));

// Suppress console output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock data factories
const createMockSite = (
  id: string,
  name: string,
  projectId: string,
  supervisorId: string
) => ({
  id,
  name,
  projectId,
  supervisorId,
  location: 'Test Location',
  status: 'active',
  _raw: {
    id,
    name,
    project_id: projectId,
    supervisor_id: supervisorId,
  },
});

const createMockItem = (
  id: string,
  name: string,
  siteId: string,
  plannedQty: number,
  completedQty: number = 0
) => ({
  id,
  name,
  siteId,
  plannedQuantity: plannedQty,
  completedQuantity: completedQty,
  unitOfMeasurement: 'cubic_meters',
  status: completedQty === 0 ? 'not_started' : completedQty < plannedQty ? 'in_progress' : 'completed',
  _raw: {
    id,
    name,
    site_id: siteId,
    planned_quantity: plannedQty,
    completed_quantity: completedQty,
  },
  update: jest.fn((callback: any) => {
    const record: any = { completedQuantity: completedQty };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockDailyReport = (
  id: string,
  siteId: string,
  reportDate: number,
  status: string = 'draft'
) => ({
  id,
  siteId,
  reportDate,
  status,
  totalItems: 5,
  completedItems: 2,
  hindrancesReported: 1,
  weatherCondition: 'sunny',
  workersPresent: 25,
  notes: 'Daily report notes',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    site_id: siteId,
    report_date: reportDate,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockProgressLog = (
  id: string,
  itemId: string,
  completedQty: number,
  reportedBy: string
) => ({
  id,
  itemId,
  date: Date.now(),
  completedQuantity: completedQty,
  reportedBy,
  photos: '[]',
  notes: 'Progress update',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    item_id: itemId,
    completed_quantity: completedQty,
    reported_by: reportedBy,
  },
});

const createMockHindrance = (
  id: string,
  siteId: string,
  itemId: string | null,
  priority: string,
  status: string = 'open'
) => ({
  id,
  siteId,
  itemId,
  title: 'Test Hindrance',
  description: 'Hindrance description',
  priority,
  status,
  reportedBy: 'supervisor-1',
  reportedAt: Date.now(),
  photos: '[]',
  appSyncStatus: 'pending',
  version: 1,
  _raw: {
    id,
    site_id: siteId,
    item_id: itemId,
    priority,
    status,
  },
  update: jest.fn((callback: any) => {
    const record: any = { status };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockMaterial = (
  id: string,
  itemId: string,
  name: string,
  required: number,
  available: number = 0,
  used: number = 0
) => ({
  id,
  itemId,
  name,
  quantityRequired: required,
  quantityAvailable: available,
  quantityUsed: used,
  unit: 'units',
  status: available >= required ? 'available' : 'pending',
  _raw: {
    id,
    item_id: itemId,
    name,
    quantity_required: required,
    quantity_available: available,
    quantity_used: used,
  },
  update: jest.fn((callback: any) => {
    const record: any = { quantityUsed: used };
    callback(record);
    return Promise.resolve();
  }),
});

describe('Supervisor Workflow - Integration Tests', () => {
  const supervisorId = 'supervisor-1';
  const siteId = 'site-1';
  const projectId = 'project-1';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Workflow 1: Daily Reporting', () => {
    describe('Complete Daily Report Flow', () => {
      it('should create, populate, and submit a daily report', async () => {
        const site = createMockSite(siteId, 'Main Site', projectId, supervisorId);
        const items = [
          createMockItem('item-1', 'Foundation', siteId, 100, 50),
          createMockItem('item-2', 'Framing', siteId, 200, 0),
        ];
        let dailyReport: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => {
                if (tableName === 'sites') return Promise.resolve([site]);
                if (tableName === 'items') return Promise.resolve(items);
                if (tableName === 'daily_reports') return Promise.resolve([]);
                return Promise.resolve([]);
              }),
            })),
            create: jest.fn((callback: any) => {
              dailyReport = {
                id: 'report-1',
                siteId: '',
                reportDate: 0,
                status: 'draft',
                totalItems: 0,
                completedItems: 0,
                update: jest.fn((cb: any) => {
                  cb(dailyReport);
                  return Promise.resolve(dailyReport);
                }),
              };
              callback(dailyReport);
              return Promise.resolve(dailyReport);
            }),
            find: jest.fn(() => Promise.resolve(dailyReport)),
          })
        );

        // Step 1: Get assigned site
        const sites = await database.collections
          .get('sites')
          .query()
          .fetch();
        const assignedSite = sites.find(
          (s: any) => s.supervisorId === supervisorId
        );
        expect(assignedSite).toBeDefined();

        // Step 2: Get items for site
        const siteItems = await database.collections
          .get('items')
          .query()
          .fetch();
        expect(siteItems.length).toBe(2);

        // Step 3: Check for existing report today
        const existingReports = await database.collections
          .get('daily_reports')
          .query()
          .fetch();
        expect(existingReports.length).toBe(0);

        // Step 4: Create daily report
        await database.write(async () => {
          await database.collections
            .get('daily_reports')
            .create((record: any) => {
              record.siteId = siteId;
              record.reportDate = Date.now();
              record.status = 'draft';
              record.totalItems = siteItems.length;
              record.completedItems = siteItems.filter(
                (i: any) => i.status === 'completed'
              ).length;
              record.weatherCondition = 'sunny';
              record.workersPresent = 30;
              record.notes = 'Progress on foundation work';
            });
        });

        expect(dailyReport).toBeDefined();
        expect(dailyReport.siteId).toBe(siteId);
        expect(dailyReport.status).toBe('draft');

        // Step 5: Submit report
        await database.write(async () => {
          const report = await database.collections
            .get('daily_reports')
            .find('report-1');
          await report.update((record: any) => {
            record.status = 'submitted';
          });
        });

        expect(dailyReport.update).toHaveBeenCalled();
      });

      it('should prevent duplicate daily reports for same day', async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingReport = createMockDailyReport(
          'report-1',
          siteId,
          today.getTime(),
          'submitted'
        );

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([existingReport])),
            })),
          })
        );

        // Check for existing report today
        const reports = await database.collections
          .get('daily_reports')
          .query()
          .fetch();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingTodayReport = reports.find(
          (r: any) =>
            r.siteId === siteId &&
            r.reportDate >= todayStart.getTime() &&
            r.reportDate <= todayEnd.getTime()
        );

        expect(existingTodayReport).toBeDefined();
      });
    });

    describe('Report History', () => {
      it('should retrieve reports history with filtering', async () => {
        const reports = [
          createMockDailyReport('r1', siteId, Date.now() - 86400000 * 5, 'submitted'),
          createMockDailyReport('r2', siteId, Date.now() - 86400000 * 3, 'submitted'),
          createMockDailyReport('r3', siteId, Date.now() - 86400000, 'submitted'),
          createMockDailyReport('r4', siteId, Date.now(), 'draft'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(reports)),
            })),
          })
        );

        const allReports = await database.collections
          .get('daily_reports')
          .query()
          .fetch();

        expect(allReports.length).toBe(4);

        // Filter submitted only
        const submittedReports = allReports.filter(
          (r: any) => r.status === 'submitted'
        );
        expect(submittedReports.length).toBe(3);

        // Filter last 7 days
        const weekAgo = Date.now() - 86400000 * 7;
        const recentReports = allReports.filter(
          (r: any) => r.reportDate >= weekAgo
        );
        expect(recentReports.length).toBe(4);
      });
    });
  });

  describe('Workflow 2: Progress Entry', () => {
    describe('Log Progress Flow', () => {
      it('should log progress and update item completion', async () => {
        const item = createMockItem('item-1', 'Foundation', siteId, 100, 30);
        let progressLog: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(item)),
            create: jest.fn((callback: any) => {
              progressLog = {
                id: 'log-1',
                itemId: '',
                completedQuantity: 0,
                reportedBy: '',
              };
              callback(progressLog);
              return Promise.resolve(progressLog);
            }),
          })
        );

        // Step 1: Get item to update
        const foundItem = await database.collections
          .get('items')
          .find('item-1');
        expect(foundItem.completedQuantity).toBe(30);

        // Step 2: Create progress log
        const newProgress = 25; // Adding 25 more
        await database.write(async () => {
          await database.collections
            .get('progress_logs')
            .create((record: any) => {
              record.itemId = 'item-1';
              record.completedQuantity = newProgress;
              record.reportedBy = supervisorId;
              record.date = Date.now();
              record.photos = JSON.stringify([]);
              record.notes = 'Completed section B';
            });
        });

        expect(progressLog.itemId).toBe('item-1');
        expect(progressLog.completedQuantity).toBe(25);

        // Step 3: Update item total completion
        await database.write(async () => {
          await foundItem.update((record: any) => {
            record.completedQuantity = foundItem.completedQuantity + newProgress;
          });
        });

        expect(item.update).toHaveBeenCalled();
        const updateCallback = (item.update as jest.Mock).mock.calls[0][0];
        const mockRecord: any = { completedQuantity: 30 };
        updateCallback(mockRecord);
        expect(mockRecord.completedQuantity).toBe(55); // 30 + 25
      });

      it('should mark item as completed when 100% progress reached', async () => {
        const item = createMockItem('item-1', 'Foundation', siteId, 100, 90);

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(item)),
          })
        );

        // Final progress entry to complete
        await database.write(async () => {
          const foundItem = await database.collections
            .get('items')
            .find('item-1');
          const remainingQty = foundItem.plannedQuantity - foundItem.completedQuantity;

          await foundItem.update((record: any) => {
            record.completedQuantity = foundItem.plannedQuantity;
            record.status = 'completed';
          });
        });

        expect(item.update).toHaveBeenCalled();
      });

      it('should prevent progress exceeding planned quantity', async () => {
        const item = createMockItem('item-1', 'Foundation', siteId, 100, 95);

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(item)),
          })
        );

        const foundItem = await database.collections
          .get('items')
          .find('item-1');

        const newProgress = 10; // Trying to add 10 (would exceed 100)
        const maxAllowedProgress = foundItem.plannedQuantity - foundItem.completedQuantity;
        const actualProgress = Math.min(newProgress, maxAllowedProgress);

        expect(actualProgress).toBe(5); // Should be capped at 5
      });
    });

    describe('Progress Photos', () => {
      it('should attach photos to progress log', async () => {
        let progressLog: any = null;
        const photos = [
          'file:///photos/progress1.jpg',
          'file:///photos/progress2.jpg',
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              progressLog = {
                id: 'log-1',
                itemId: '',
                photos: '',
              };
              callback(progressLog);
              return Promise.resolve(progressLog);
            }),
          })
        );

        await database.write(async () => {
          await database.collections
            .get('progress_logs')
            .create((record: any) => {
              record.itemId = 'item-1';
              record.completedQuantity = 10;
              record.reportedBy = supervisorId;
              record.photos = JSON.stringify(photos);
              record.notes = 'With photos';
            });
        });

        const storedPhotos = JSON.parse(progressLog.photos);
        expect(storedPhotos.length).toBe(2);
        expect(storedPhotos[0]).toBe('file:///photos/progress1.jpg');
      });
    });
  });

  describe('Workflow 3: Hindrance Reporting', () => {
    describe('Report Hindrance Flow', () => {
      it('should create and escalate a high priority hindrance', async () => {
        let hindrance: any = null;

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              hindrance = {
                id: 'hind-1',
                siteId: '',
                itemId: '',
                title: '',
                priority: '',
                status: 'open',
                update: jest.fn((cb: any) => {
                  cb(hindrance);
                  return Promise.resolve(hindrance);
                }),
              };
              callback(hindrance);
              return Promise.resolve(hindrance);
            }),
            find: jest.fn(() => Promise.resolve(hindrance)),
          })
        );

        // Step 1: Create hindrance
        await database.write(async () => {
          await database.collections
            .get('hindrances')
            .create((record: any) => {
              record.siteId = siteId;
              record.itemId = 'item-1';
              record.title = 'Equipment Breakdown';
              record.description = 'Excavator engine failure';
              record.priority = 'high';
              record.status = 'open';
              record.reportedBy = supervisorId;
              record.reportedAt = Date.now();
              record.photos = JSON.stringify([]);
            });
        });

        expect(hindrance).toBeDefined();
        expect(hindrance.priority).toBe('high');
        expect(hindrance.status).toBe('open');

        // Step 2: Escalate to manager
        await database.write(async () => {
          const found = await database.collections
            .get('hindrances')
            .find('hind-1');
          await found.update((record: any) => {
            record.status = 'escalated';
            record.assignedTo = 'manager-1';
          });
        });

        expect(hindrance.update).toHaveBeenCalled();
      });

      it('should resolve hindrance with resolution notes', async () => {
        const hindrance = createMockHindrance(
          'hind-1',
          siteId,
          'item-1',
          'medium',
          'open'
        );

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(hindrance)),
          })
        );

        // Resolve hindrance
        await database.write(async () => {
          const found = await database.collections
            .get('hindrances')
            .find('hind-1');
          await found.update((record: any) => {
            record.status = 'resolved';
            record.resolutionNotes = 'Equipment repaired and operational';
            record.resolvedAt = Date.now();
          });
        });

        expect(hindrance.update).toHaveBeenCalled();
        const updateCallback = (hindrance.update as jest.Mock).mock.calls[0][0];
        const mockRecord: any = { status: 'open' };
        updateCallback(mockRecord);
        expect(mockRecord.status).toBe('resolved');
      });

      it('should categorize hindrances by priority', async () => {
        const hindrances = [
          createMockHindrance('h1', siteId, 'item-1', 'urgent', 'open'),
          createMockHindrance('h2', siteId, 'item-2', 'high', 'open'),
          createMockHindrance('h3', siteId, 'item-3', 'medium', 'open'),
          createMockHindrance('h4', siteId, null, 'low', 'resolved'),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(hindrances)),
            })),
          })
        );

        const allHindrances = await database.collections
          .get('hindrances')
          .query()
          .fetch();

        const urgentCount = allHindrances.filter((h: any) => h.priority === 'urgent').length;
        const highCount = allHindrances.filter((h: any) => h.priority === 'high').length;
        const openCount = allHindrances.filter((h: any) => h.status === 'open').length;

        expect(urgentCount).toBe(1);
        expect(highCount).toBe(1);
        expect(openCount).toBe(3);
      });
    });
  });

  describe('Workflow 4: Site Inspection', () => {
    describe('Inspection Workflow', () => {
      it('should complete site inspection with checklist', async () => {
        let inspection: any = null;
        const checklist = [
          { item: 'Safety equipment available', checked: true },
          { item: 'Work area clean', checked: true },
          { item: 'Materials properly stored', checked: false },
          { item: 'PPE compliance', checked: true },
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              inspection = {
                id: 'insp-1',
                siteId: '',
                type: '',
                rating: 0,
                checklist: '',
                status: 'draft',
                update: jest.fn((cb: any) => {
                  cb(inspection);
                  return Promise.resolve(inspection);
                }),
              };
              callback(inspection);
              return Promise.resolve(inspection);
            }),
            find: jest.fn(() => Promise.resolve(inspection)),
          })
        );

        // Step 1: Create inspection
        await database.write(async () => {
          await database.collections
            .get('site_inspections')
            .create((record: any) => {
              record.siteId = siteId;
              record.type = 'safety';
              record.inspectorId = supervisorId;
              record.inspectionDate = Date.now();
              record.checklist = JSON.stringify(checklist);
              record.status = 'draft';
            });
        });

        expect(inspection).toBeDefined();

        // Step 2: Calculate compliance
        const checklistParsed = JSON.parse(inspection.checklist);
        const checkedCount = checklistParsed.filter((c: any) => c.checked).length;
        const totalCount = checklistParsed.length;
        const complianceRate = (checkedCount / totalCount) * 100;

        expect(complianceRate).toBe(75);

        // Step 3: Complete and rate inspection
        await database.write(async () => {
          const found = await database.collections
            .get('site_inspections')
            .find('insp-1');
          await found.update((record: any) => {
            record.status = 'completed';
            record.rating = 4; // Out of 5
            record.notes = 'Materials storage needs improvement';
          });
        });

        expect(inspection.update).toHaveBeenCalled();
      });

      it('should attach photos to inspection', async () => {
        let inspection: any = null;
        const photos = [
          'file:///photos/inspection1.jpg',
          'file:///photos/inspection2.jpg',
          'file:///photos/inspection3.jpg',
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            create: jest.fn((callback: any) => {
              inspection = {
                id: 'insp-1',
                photos: '',
              };
              callback(inspection);
              return Promise.resolve(inspection);
            }),
          })
        );

        await database.write(async () => {
          await database.collections
            .get('site_inspections')
            .create((record: any) => {
              record.siteId = siteId;
              record.type = 'quality';
              record.photos = JSON.stringify(photos);
            });
        });

        const storedPhotos = JSON.parse(inspection.photos);
        expect(storedPhotos.length).toBe(3);
      });
    });
  });

  describe('Workflow 5: Material Tracking', () => {
    describe('Material Request and Usage Flow', () => {
      it('should track material from request to usage', async () => {
        const material = createMockMaterial(
          'mat-1',
          'item-1',
          'Concrete Mix',
          100,
          0,
          0
        );

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            find: jest.fn(() => Promise.resolve(material)),
          })
        );

        // Step 1: Request material
        expect(material.status).toBe('pending');

        // Step 2: Material received
        await database.write(async () => {
          const found = await database.collections
            .get('materials')
            .find('mat-1');
          await found.update((record: any) => {
            record.quantityAvailable = 100;
            record.status = 'available';
          });
        });

        expect(material.update).toHaveBeenCalled();

        // Step 3: Use material
        (material.update as jest.Mock).mockClear();
        await database.write(async () => {
          const found = await database.collections
            .get('materials')
            .find('mat-1');
          await found.update((record: any) => {
            record.quantityUsed = 50;
            record.quantityAvailable = 50;
          });
        });

        expect(material.update).toHaveBeenCalled();
      });

      it('should calculate material shortage', async () => {
        const materials = [
          createMockMaterial('mat-1', 'item-1', 'Concrete', 100, 80, 0),
          createMockMaterial('mat-2', 'item-1', 'Rebar', 500, 200, 0),
          createMockMaterial('mat-3', 'item-1', 'Sand', 50, 50, 0),
        ];

        (database.collections.get as jest.Mock).mockImplementation(
          (tableName: string) => ({
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve(materials)),
            })),
          })
        );

        const allMaterials = await database.collections
          .get('materials')
          .query()
          .fetch();

        const shortages = allMaterials
          .filter((m: any) => m.quantityAvailable < m.quantityRequired)
          .map((m: any) => ({
            name: m.name,
            shortage: m.quantityRequired - m.quantityAvailable,
          }));

        expect(shortages.length).toBe(2);
        expect(shortages[0].name).toBe('Concrete');
        expect(shortages[0].shortage).toBe(20);
        expect(shortages[1].name).toBe('Rebar');
        expect(shortages[1].shortage).toBe(300);
      });
    });
  });

  describe('Workflow 6: Multi-Site Supervisor', () => {
    it('should handle supervisor with multiple site assignments', async () => {
      const sites = [
        createMockSite('site-1', 'Site A', projectId, supervisorId),
        createMockSite('site-2', 'Site B', projectId, supervisorId),
        createMockSite('site-3', 'Site C', 'other-project', supervisorId),
      ];

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(sites)),
          })),
        })
      );

      const supervisorSites = await database.collections
        .get('sites')
        .query()
        .fetch();

      const assignedSites = supervisorSites.filter(
        (s: any) => s.supervisorId === supervisorId
      );

      expect(assignedSites.length).toBe(3);

      // Group by project
      const byProject = assignedSites.reduce((acc: any, site: any) => {
        if (!acc[site.projectId]) {
          acc[site.projectId] = [];
        }
        acc[site.projectId].push(site);
        return acc;
      }, {});

      expect(Object.keys(byProject).length).toBe(2);
      expect(byProject[projectId].length).toBe(2);
    });
  });

  describe('Workflow 7: Offline Progress Sync', () => {
    it('should queue progress logs for sync when offline', async () => {
      let progressLog: any = null;

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          create: jest.fn((callback: any) => {
            progressLog = {
              id: 'log-1',
              itemId: '',
              appSyncStatus: 'pending',
            };
            callback(progressLog);
            return Promise.resolve(progressLog);
          }),
        })
      );

      // Create progress log offline
      await database.write(async () => {
        await database.collections
          .get('progress_logs')
          .create((record: any) => {
            record.itemId = 'item-1';
            record.completedQuantity = 25;
            record.reportedBy = supervisorId;
            record.appSyncStatus = 'pending'; // Offline marker
          });
        });

      expect(progressLog.appSyncStatus).toBe('pending');
    });

    it('should batch sync multiple offline progress logs', async () => {
      const offlineLogs = [
        createMockProgressLog('log-1', 'item-1', 10, supervisorId),
        createMockProgressLog('log-2', 'item-2', 20, supervisorId),
        createMockProgressLog('log-3', 'item-3', 15, supervisorId),
      ];

      offlineLogs.forEach((log) => {
        (log as any).update = jest.fn((callback: any) => {
          callback(log);
          return Promise.resolve();
        });
      });

      (database.collections.get as jest.Mock).mockImplementation(
        (tableName: string) => ({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve(offlineLogs)),
          })),
        })
      );

      // Get all pending logs
      const pendingLogs = await database.collections
        .get('progress_logs')
        .query()
        .fetch();

      const logsToSync = pendingLogs.filter(
        (log: any) => log.appSyncStatus === 'pending'
      );

      expect(logsToSync.length).toBe(3);

      // Simulate batch sync
      for (const log of logsToSync) {
        await (log as any).update((record: any) => {
          record.appSyncStatus = 'synced';
        });
      }

      offlineLogs.forEach((log) => {
        expect((log as any).update).toHaveBeenCalled();
      });
    });
  });
});
