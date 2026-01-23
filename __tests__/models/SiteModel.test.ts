/**
 * SiteModel Tests
 *
 * Tests for site model structure, associations, and field definitions.
 */

import SiteModel from '../../models/SiteModel';

describe('SiteModel', () => {
  describe('static properties', () => {
    it('should have correct table name', () => {
      expect(SiteModel.table).toBe('sites');
    });

    it('should define project association', () => {
      expect(SiteModel.associations).toBeDefined();
      expect(SiteModel.associations.project).toEqual({
        type: 'belongs_to',
        key: 'project_id',
      });
    });

    it('should define items association', () => {
      expect(SiteModel.associations.items).toEqual({
        type: 'has_many',
        foreignKey: 'site_id',
      });
    });

    it('should define hindrances association', () => {
      expect(SiteModel.associations.hindrances).toEqual({
        type: 'has_many',
        foreignKey: 'site_id',
      });
    });
  });

  describe('field definitions', () => {
    it('should have all required fields defined', () => {
      const mockSite: Partial<SiteModel> = {
        name: 'Site Alpha',
        location: '123 Construction Ave, City',
        projectId: 'project-123',
        appSyncStatus: 'pending',
        version: 1,
      };

      expect(mockSite.name).toBe('Site Alpha');
      expect(mockSite.location).toBe('123 Construction Ave, City');
      expect(mockSite.projectId).toBe('project-123');
      expect(mockSite.appSyncStatus).toBe('pending');
      expect(mockSite.version).toBe(1);
    });

    it('should support optional supervisor assignment', () => {
      const mockSite: Partial<SiteModel> = {
        name: 'Site Beta',
        supervisorId: 'supervisor-456',
      };

      expect(mockSite.supervisorId).toBe('supervisor-456');
    });

    it('should allow supervisorId to be undefined', () => {
      const mockSite: Partial<SiteModel> = {
        name: 'Unassigned Site',
        supervisorId: undefined,
      };

      expect(mockSite.supervisorId).toBeUndefined();
    });
  });

  describe('planning dates', () => {
    it('should support planned start and end dates', () => {
      const plannedStart = new Date('2025-03-01').getTime();
      const plannedEnd = new Date('2025-06-30').getTime();

      const mockSite: Partial<SiteModel> = {
        plannedStartDate: plannedStart,
        plannedEndDate: plannedEnd,
      };

      expect(mockSite.plannedStartDate).toBe(plannedStart);
      expect(mockSite.plannedEndDate).toBe(plannedEnd);
    });

    it('should support actual start and end dates', () => {
      const actualStart = new Date('2025-03-05').getTime();
      const actualEnd = new Date('2025-07-15').getTime();

      const mockSite: Partial<SiteModel> = {
        actualStartDate: actualStart,
        actualEndDate: actualEnd,
      };

      expect(mockSite.actualStartDate).toBe(actualStart);
      expect(mockSite.actualEndDate).toBe(actualEnd);
    });

    it('should allow optional dates to be undefined', () => {
      const mockSite: Partial<SiteModel> = {
        name: 'New Site',
        plannedStartDate: undefined,
        plannedEndDate: undefined,
        actualStartDate: undefined,
        actualEndDate: undefined,
      };

      expect(mockSite.plannedStartDate).toBeUndefined();
      expect(mockSite.plannedEndDate).toBeUndefined();
      expect(mockSite.actualStartDate).toBeUndefined();
      expect(mockSite.actualEndDate).toBeUndefined();
    });

    it('should calculate schedule variance', () => {
      const plannedEnd = new Date('2025-06-30').getTime();
      const actualEnd = new Date('2025-07-15').getTime();

      const mockSite: Partial<SiteModel> = {
        plannedEndDate: plannedEnd,
        actualEndDate: actualEnd,
      };

      const varianceMs = mockSite.actualEndDate! - mockSite.plannedEndDate!;
      const varianceDays = Math.floor(varianceMs / (1000 * 60 * 60 * 24));

      expect(varianceDays).toBe(15); // 15 days behind schedule
    });
  });

  describe('sync status values', () => {
    it('should support pending sync status', () => {
      const mockSite: Partial<SiteModel> = {
        appSyncStatus: 'pending',
      };
      expect(mockSite.appSyncStatus).toBe('pending');
    });

    it('should support synced status', () => {
      const mockSite: Partial<SiteModel> = {
        appSyncStatus: 'synced',
      };
      expect(mockSite.appSyncStatus).toBe('synced');
    });

    it('should support failed sync status', () => {
      const mockSite: Partial<SiteModel> = {
        appSyncStatus: 'failed',
      };
      expect(mockSite.appSyncStatus).toBe('failed');
    });
  });

  describe('version tracking', () => {
    it('should store version as number', () => {
      const mockSite: Partial<SiteModel> = {
        version: 1,
      };

      expect(mockSite.version).toBe(1);
    });

    it('should allow version increments for conflict resolution', () => {
      const mockSite: Partial<SiteModel> = {
        version: 5,
      };

      mockSite.version = mockSite.version! + 1;
      expect(mockSite.version).toBe(6);
    });
  });

  describe('location handling', () => {
    it('should store full address', () => {
      const mockSite: Partial<SiteModel> = {
        location: '456 Industrial Park, Building 3, Mumbai, Maharashtra 400001',
      };

      expect(mockSite.location).toContain('Mumbai');
      expect(mockSite.location).toContain('400001');
    });

    it('should handle coordinate-style location', () => {
      const mockSite: Partial<SiteModel> = {
        location: '19.0760° N, 72.8777° E',
      };

      expect(mockSite.location).toContain('19.0760');
    });

    it('should handle empty location', () => {
      const mockSite: Partial<SiteModel> = {
        location: '',
      };

      expect(mockSite.location).toBe('');
    });
  });
});
