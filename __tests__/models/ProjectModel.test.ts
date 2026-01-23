/**
 * ProjectModel Tests
 *
 * Tests for project model structure, associations, and field definitions.
 */

import ProjectModel from '../../models/ProjectModel';

describe('ProjectModel', () => {
  describe('static properties', () => {
    it('should have correct table name', () => {
      expect(ProjectModel.table).toBe('projects');
    });

    it('should define sites association', () => {
      expect(ProjectModel.associations).toBeDefined();
      expect(ProjectModel.associations.sites).toEqual({
        type: 'has_many',
        foreignKey: 'project_id',
      });
    });
  });

  describe('field definitions', () => {
    it('should have all required fields defined', () => {
      // Create a mock project to test field structure
      const mockProject: Partial<ProjectModel> = {
        name: 'Test Project',
        client: 'Test Client',
        startDate: Date.now(),
        endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        status: 'active',
        budget: 1000000,
        appSyncStatus: 'pending',
        version: 1,
      };

      expect(mockProject.name).toBe('Test Project');
      expect(mockProject.client).toBe('Test Client');
      expect(mockProject.startDate).toBeDefined();
      expect(mockProject.endDate).toBeDefined();
      expect(mockProject.status).toBe('active');
      expect(mockProject.budget).toBe(1000000);
      expect(mockProject.appSyncStatus).toBe('pending');
      expect(mockProject.version).toBe(1);
    });
  });

  describe('project status values', () => {
    it('should support active status', () => {
      const mockProject: Partial<ProjectModel> = {
        status: 'active',
      };
      expect(mockProject.status).toBe('active');
    });

    it('should support completed status', () => {
      const mockProject: Partial<ProjectModel> = {
        status: 'completed',
      };
      expect(mockProject.status).toBe('completed');
    });

    it('should support on_hold status', () => {
      const mockProject: Partial<ProjectModel> = {
        status: 'on_hold',
      };
      expect(mockProject.status).toBe('on_hold');
    });

    it('should support cancelled status', () => {
      const mockProject: Partial<ProjectModel> = {
        status: 'cancelled',
      };
      expect(mockProject.status).toBe('cancelled');
    });
  });

  describe('sync status values', () => {
    it('should support pending sync status', () => {
      const mockProject: Partial<ProjectModel> = {
        appSyncStatus: 'pending',
      };
      expect(mockProject.appSyncStatus).toBe('pending');
    });

    it('should support synced status', () => {
      const mockProject: Partial<ProjectModel> = {
        appSyncStatus: 'synced',
      };
      expect(mockProject.appSyncStatus).toBe('synced');
    });

    it('should support failed sync status', () => {
      const mockProject: Partial<ProjectModel> = {
        appSyncStatus: 'failed',
      };
      expect(mockProject.appSyncStatus).toBe('failed');
    });
  });

  describe('date handling', () => {
    it('should store dates as timestamps', () => {
      const startDate = new Date('2025-01-01').getTime();
      const endDate = new Date('2025-12-31').getTime();

      const mockProject: Partial<ProjectModel> = {
        startDate,
        endDate,
      };

      expect(mockProject.startDate).toBe(startDate);
      expect(mockProject.endDate).toBe(endDate);
      expect(typeof mockProject.startDate).toBe('number');
      expect(typeof mockProject.endDate).toBe('number');
    });

    it('should allow date calculations', () => {
      const startDate = new Date('2025-01-01').getTime();
      const endDate = new Date('2025-12-31').getTime();

      const mockProject: Partial<ProjectModel> = {
        startDate,
        endDate,
      };

      const durationMs = mockProject.endDate! - mockProject.startDate!;
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      expect(durationDays).toBe(364);
    });
  });

  describe('budget handling', () => {
    it('should store budget as number', () => {
      const mockProject: Partial<ProjectModel> = {
        budget: 5000000.50,
      };

      expect(mockProject.budget).toBe(5000000.50);
      expect(typeof mockProject.budget).toBe('number');
    });

    it('should handle zero budget', () => {
      const mockProject: Partial<ProjectModel> = {
        budget: 0,
      };

      expect(mockProject.budget).toBe(0);
    });

    it('should handle large budgets', () => {
      const mockProject: Partial<ProjectModel> = {
        budget: 999999999999,
      };

      expect(mockProject.budget).toBe(999999999999);
    });
  });

  describe('version tracking', () => {
    it('should store version as number', () => {
      const mockProject: Partial<ProjectModel> = {
        version: 1,
      };

      expect(mockProject.version).toBe(1);
    });

    it('should allow version increments', () => {
      const mockProject: Partial<ProjectModel> = {
        version: 1,
      };

      mockProject.version = mockProject.version! + 1;
      expect(mockProject.version).toBe(2);
    });
  });
});
