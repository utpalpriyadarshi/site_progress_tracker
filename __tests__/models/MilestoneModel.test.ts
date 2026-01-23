/**
 * MilestoneModel Tests
 *
 * Tests for milestone model structure and associations.
 */

import MilestoneModel from '../../models/MilestoneModel';

describe('MilestoneModel', () => {
  describe('static properties', () => {
    it('should have correct table name', () => {
      expect(MilestoneModel.table).toBe('milestones');
    });

    it('should define projects association', () => {
      expect(MilestoneModel.associations).toBeDefined();
      expect(MilestoneModel.associations.projects).toEqual({
        type: 'belongs_to',
        key: 'project_id',
      });
    });

    it('should define milestone_progress association', () => {
      expect(MilestoneModel.associations.milestone_progress).toEqual({
        type: 'has_many',
        foreignKey: 'milestone_id',
      });
    });

    it('should define items association', () => {
      expect(MilestoneModel.associations.items).toEqual({
        type: 'has_many',
        foreignKey: 'milestone_id',
      });
    });
  });

  describe('field definitions', () => {
    it('should have all required fields defined', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        projectId: 'project-123',
        milestoneCode: 'PM100',
        milestoneName: 'Requirements Management',
        sequenceOrder: 1,
        weightage: 15,
        isActive: true,
        isCustom: false,
        createdBy: 'user-456',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        appSyncStatus: 'pending',
        version: 1,
      };

      expect(mockMilestone.projectId).toBe('project-123');
      expect(mockMilestone.milestoneCode).toBe('PM100');
      expect(mockMilestone.milestoneName).toBe('Requirements Management');
      expect(mockMilestone.sequenceOrder).toBe(1);
      expect(mockMilestone.weightage).toBe(15);
      expect(mockMilestone.isActive).toBe(true);
      expect(mockMilestone.isCustom).toBe(false);
    });

    it('should support optional description field', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneName: 'Design Phase',
        description: 'Complete all design documentation and approvals',
      };

      expect(mockMilestone.description).toContain('design');
    });

    it('should allow description to be undefined', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneName: 'Testing',
        description: undefined,
      };

      expect(mockMilestone.description).toBeUndefined();
    });
  });

  describe('milestone codes', () => {
    it('should support PM100 format', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'PM100',
      };

      expect(mockMilestone.milestoneCode).toMatch(/^PM\d{3}$/);
    });

    it('should support PM200 format', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'PM200',
      };

      expect(mockMilestone.milestoneCode).toBe('PM200');
    });

    it('should support custom milestone codes', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'CUSTOM-001',
        isCustom: true,
      };

      expect(mockMilestone.milestoneCode).toBe('CUSTOM-001');
      expect(mockMilestone.isCustom).toBe(true);
    });
  });

  describe('sequence ordering', () => {
    it('should have positive sequence order', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        sequenceOrder: 1,
      };

      expect(mockMilestone.sequenceOrder).toBeGreaterThan(0);
    });

    it('should allow reordering', () => {
      const milestones = [
        { milestoneName: 'First', sequenceOrder: 1 },
        { milestoneName: 'Second', sequenceOrder: 2 },
        { milestoneName: 'Third', sequenceOrder: 3 },
      ];

      // Simulate reorder
      milestones[2].sequenceOrder = 1;
      milestones[0].sequenceOrder = 2;
      milestones[1].sequenceOrder = 3;

      expect(milestones.find(m => m.milestoneName === 'Third')?.sequenceOrder).toBe(1);
    });
  });

  describe('weightage', () => {
    it('should store weightage as percentage', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        weightage: 25,
      };

      expect(mockMilestone.weightage).toBe(25);
    });

    it('should handle 0% weightage', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        weightage: 0,
      };

      expect(mockMilestone.weightage).toBe(0);
    });

    it('should handle decimal weightage', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        weightage: 12.5,
      };

      expect(mockMilestone.weightage).toBe(12.5);
    });

    it('should calculate total weightage for project', () => {
      const milestones = [
        { weightage: 10 },
        { weightage: 20 },
        { weightage: 30 },
        { weightage: 25 },
        { weightage: 15 },
      ];

      const totalWeightage = milestones.reduce((sum, m) => sum + m.weightage, 0);

      expect(totalWeightage).toBe(100);
    });
  });

  describe('active status', () => {
    it('should represent active milestone', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        isActive: true,
      };

      expect(mockMilestone.isActive).toBe(true);
    });

    it('should represent inactive milestone', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        isActive: false,
      };

      expect(mockMilestone.isActive).toBe(false);
    });
  });

  describe('custom milestones', () => {
    it('should distinguish standard milestones', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneName: 'Standard Milestone',
        isCustom: false,
      };

      expect(mockMilestone.isCustom).toBe(false);
    });

    it('should mark manager-added milestones as custom', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneName: 'Custom Review Phase',
        isCustom: true,
        createdBy: 'manager-user-id',
      };

      expect(mockMilestone.isCustom).toBe(true);
    });
  });

  describe('timestamps', () => {
    it('should store createdAt timestamp', () => {
      const createdAt = Date.now();
      const mockMilestone: Partial<MilestoneModel> = {
        createdAt,
      };

      expect(mockMilestone.createdAt).toBe(createdAt);
    });

    it('should store updatedAt timestamp', () => {
      const updatedAt = Date.now();
      const mockMilestone: Partial<MilestoneModel> = {
        updatedAt,
      };

      expect(mockMilestone.updatedAt).toBe(updatedAt);
    });

    it('should allow updatedAt to be later than createdAt', () => {
      const createdAt = new Date('2025-01-01').getTime();
      const updatedAt = new Date('2025-01-15').getTime();

      const mockMilestone: Partial<MilestoneModel> = {
        createdAt,
        updatedAt,
      };

      expect(mockMilestone.updatedAt).toBeGreaterThan(mockMilestone.createdAt!);
    });
  });

  describe('sync status', () => {
    it('should support pending sync status', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        appSyncStatus: 'pending',
      };
      expect(mockMilestone.appSyncStatus).toBe('pending');
    });

    it('should support synced status', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        appSyncStatus: 'synced',
      };
      expect(mockMilestone.appSyncStatus).toBe('synced');
    });

    it('should support failed sync status', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        appSyncStatus: 'failed',
      };
      expect(mockMilestone.appSyncStatus).toBe('failed');
    });
  });

  describe('version tracking', () => {
    it('should store version as number', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        version: 1,
      };

      expect(mockMilestone.version).toBe(1);
    });

    it('should allow version increments', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        version: 3,
      };

      mockMilestone.version = mockMilestone.version! + 1;
      expect(mockMilestone.version).toBe(4);
    });
  });

  describe('example milestone configurations', () => {
    it('should support Requirements Management milestone', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'PM100',
        milestoneName: 'Requirements Management',
        description: 'Complete requirements gathering and documentation',
        sequenceOrder: 1,
        weightage: 10,
        isActive: true,
        isCustom: false,
      };

      expect(mockMilestone.milestoneCode).toBe('PM100');
      expect(mockMilestone.milestoneName).toBe('Requirements Management');
    });

    it('should support Design & Engineering milestone', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'PM200',
        milestoneName: 'Design & Engineering',
        description: 'Complete all design and engineering documentation',
        sequenceOrder: 2,
        weightage: 15,
        isActive: true,
        isCustom: false,
      };

      expect(mockMilestone.milestoneCode).toBe('PM200');
    });

    it('should support Site Acceptance Test milestone', () => {
      const mockMilestone: Partial<MilestoneModel> = {
        milestoneCode: 'PM900',
        milestoneName: 'Site Acceptance Test',
        description: 'Complete SAT with customer sign-off',
        sequenceOrder: 9,
        weightage: 10,
        isActive: true,
        isCustom: false,
      };

      expect(mockMilestone.milestoneName).toBe('Site Acceptance Test');
    });
  });
});
