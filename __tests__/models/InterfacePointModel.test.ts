/**
 * InterfacePointModel Unit Tests (Sprint 1)
 *
 * Tests for interface point model (prepared for v1.4)
 */

import { database } from '../../models/database';
import InterfacePointModel from '../../models/InterfacePointModel';

describe('InterfacePointModel', () => {
  // No database reset needed - Jest provides clean environment
  // Each test cleans up its own data

  describe('Model Creation', () => {
    it('should create an interface point with required fields', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item-1';
            ip.fromContractor = 'Electrical Contractor A';
            ip.toContractor = 'Civil Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
            ip.targetDate = new Date('2025-02-01').getTime();
            ip.notes = 'Foundation handover for transformer installation';
          });
      });

      expect(interfacePoint).toBeDefined();
      expect(interfacePoint!.itemId).toBe('test-item-1');
      expect(interfacePoint!.fromContractor).toBe('Electrical Contractor A');
      expect(interfacePoint!.toContractor).toBe('Civil Contractor B');
      expect(interfacePoint!.interfaceType).toBe('handover');
      expect(interfacePoint!.status).toBe('pending');

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should support all interface types', async () => {
      const interfaceTypes: Array<'handover' | 'approval' | 'information'> = [
        'handover',
        'approval',
        'information',
      ];

      for (const type of interfaceTypes) {
        let interfacePoint: InterfacePointModel | undefined;

        await database.write(async () => {
          interfacePoint = await database.collections
            .get<InterfacePointModel>('interface_points')
            .create((ip) => {
              ip.itemId = `test-item-${type}`;
              ip.fromContractor = 'Contractor A';
              ip.toContractor = 'Contractor B';
              ip.interfaceType = type;
              ip.status = 'pending';
            });
        });

        expect(interfacePoint!.interfaceType).toBe(type);

        // Cleanup
        if (interfacePoint) {
          await database.write(async () => {
            await interfacePoint!.destroyPermanently();
          });
        }
      }
    });

    it('should support all status types', async () => {
      const statuses: Array<'pending' | 'in_progress' | 'resolved' | 'blocked'> = [
        'pending',
        'in_progress',
        'resolved',
        'blocked',
      ];

      for (const status of statuses) {
        let interfacePoint: InterfacePointModel | undefined;

        await database.write(async () => {
          interfacePoint = await database.collections
            .get<InterfacePointModel>('interface_points')
            .create((ip) => {
              ip.itemId = `test-item-${status}`;
              ip.fromContractor = 'Contractor A';
              ip.toContractor = 'Contractor B';
              ip.interfaceType = 'handover';
              ip.status = status;
            });
        });

        expect(interfacePoint!.status).toBe(status);

        // Cleanup
        if (interfacePoint) {
          await database.write(async () => {
            await interfacePoint!.destroyPermanently();
          });
        }
      }
    });
  });

  describe('isOverdue()', () => {
    it('should return true when target date is past and status is not resolved', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      const pastDate = new Date('2025-01-01').getTime(); // Past date

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
            ip.targetDate = pastDate;
          });
      });

      expect(interfacePoint!.isOverdue()).toBe(true);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should return false when target date is in future', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      const futureDate = new Date('2026-12-31').getTime(); // Future date

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
            ip.targetDate = futureDate;
          });
      });

      expect(interfacePoint!.isOverdue()).toBe(false);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should return false when status is resolved', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      const pastDate = new Date('2025-01-01').getTime();

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'resolved';
            ip.targetDate = pastDate;
            ip.actualDate = pastDate;
          });
      });

      expect(interfacePoint!.isOverdue()).toBe(false);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should return false when target date is not set', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
          });
      });

      expect(interfacePoint!.isOverdue()).toBe(false);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });
  });

  describe('getDaysOverdue()', () => {
    it('should return correct days overdue', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
            ip.targetDate = tenDaysAgo;
          });
      });

      const daysOverdue = interfacePoint!.getDaysOverdue();

      // Should be approximately 10 days (allow small margin for test execution time)
      expect(daysOverdue).toBeGreaterThanOrEqual(9);
      expect(daysOverdue).toBeLessThanOrEqual(11);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should return 0 when not overdue', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      const futureDate = Date.now() + 10 * 24 * 60 * 60 * 1000;

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
            ip.targetDate = futureDate;
          });
      });

      expect(interfacePoint!.getDaysOverdue()).toBe(0);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });

    it('should return 0 when target date is not set', async () => {
      let interfacePoint: InterfacePointModel | undefined;

      await database.write(async () => {
        interfacePoint = await database.collections
          .get<InterfacePointModel>('interface_points')
          .create((ip) => {
            ip.itemId = 'test-item';
            ip.fromContractor = 'Contractor A';
            ip.toContractor = 'Contractor B';
            ip.interfaceType = 'handover';
            ip.status = 'pending';
          });
      });

      expect(interfacePoint!.getDaysOverdue()).toBe(0);

      // Cleanup
      if (interfacePoint) {
        await database.write(async () => {
          await interfacePoint!.destroyPermanently();
        });
      }
    });
  });
});
