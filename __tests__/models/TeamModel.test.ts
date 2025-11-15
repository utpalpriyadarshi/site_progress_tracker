/**
 * Team Management Models Tests
 *
 * Tests for TeamModel, TeamMemberModel, and ResourceRequestModel
 * Added for Activity 3: Manager Role - Week 1, Day 1
 */

import { database } from '../../models/database';
import TeamModel from '../../models/TeamModel';
import TeamMemberModel from '../../models/TeamMemberModel';
import ResourceRequestModel from '../../models/ResourceRequestModel';

describe('Team Management Models', () => {
  // Database is already initialized by jest.setup.js
  // No beforeAll needed - tests will use the mocked database

  describe('TeamModel', () => {
    let testTeam: TeamModel;

    beforeEach(async () => {
      await database.write(async () => {
        testTeam = await database.collections.get<TeamModel>('teams').create((team) => {
          team.name = 'Construction Team A';
          team.siteId = 'site-1';
          team.teamLeadId = 'user-1';
          team.createdDate = Date.now();
          team.status = 'active';
          team.specialization = 'electrical';
          team.appSyncStatus = 'pending';
          team.version = 1;
        });
      });
    });

    afterEach(async () => {
      await database.write(async () => {
        await testTeam.destroyPermanently();
      });
    });

    it('should save and retrieve team name', () => {
      expect(testTeam.name).toBe('Construction Team A');
    });

    it('should save and retrieve team status', () => {
      expect(testTeam.status).toBe('active');
    });

    it('should save and retrieve team specialization', () => {
      expect(testTeam.specialization).toBe('electrical');
    });

    it('should save and retrieve siteId', () => {
      expect(testTeam.siteId).toBe('site-1');
    });

    it('should save and retrieve teamLeadId', () => {
      expect(testTeam.teamLeadId).toBe('user-1');
    });

    it('should have sync_status field', () => {
      expect(testTeam.appSyncStatus).toBe('pending');
    });

    it('should have version field for conflict resolution', () => {
      expect(testTeam.version).toBe(1);
    });
  });

  describe('TeamMemberModel', () => {
    let testMember: TeamMemberModel;

    beforeEach(async () => {
      await database.write(async () => {
        testMember = await database.collections.get<TeamMemberModel>('team_members').create((member) => {
          member.teamId = 'team-1';
          member.userId = 'user-1';
          member.role = 'lead';
          member.assignedDate = Date.now();
          member.status = 'active';
          member.appSyncStatus = 'pending';
          member.version = 1;
        });
      });
    });

    afterEach(async () => {
      await database.write(async () => {
        await testMember.destroyPermanently();
      });
    });

    it('should save and retrieve teamId', () => {
      expect(testMember.teamId).toBe('team-1');
    });

    it('should save and retrieve userId', () => {
      expect(testMember.userId).toBe('user-1');
    });

    it('should save and retrieve role', () => {
      expect(testMember.role).toBe('lead');
    });

    it('should save and retrieve status', () => {
      expect(testMember.status).toBe('active');
    });

    it('should have sync_status field', () => {
      expect(testMember.appSyncStatus).toBe('pending');
    });

    it('should have version field for conflict resolution', () => {
      expect(testMember.version).toBe(1);
    });
  });

  describe('ResourceRequestModel', () => {
    let testRequest: ResourceRequestModel;

    beforeEach(async () => {
      await database.write(async () => {
        testRequest = await database.collections.get<ResourceRequestModel>('resource_requests').create((request) => {
          request.requestedBy = 'user-1';
          request.siteId = 'site-1';
          request.resourceType = 'equipment';
          request.resourceName = 'Excavator';
          request.quantity = 2;
          request.priority = 'high';
          request.requestedDate = Date.now();
          request.neededByDate = Date.now() + 86400000; // +1 day
          request.approvalStatus = 'pending';
          request.appSyncStatus = 'pending';
          request.version = 1;
        });
      });
    });

    afterEach(async () => {
      await database.write(async () => {
        await testRequest.destroyPermanently();
      });
    });

    it('should save and retrieve resource name', () => {
      expect(testRequest.resourceName).toBe('Excavator');
    });

    it('should save and retrieve quantity', () => {
      expect(testRequest.quantity).toBe(2);
    });

    it('should save and retrieve priority', () => {
      expect(testRequest.priority).toBe('high');
    });

    it('should save and retrieve approval status', () => {
      expect(testRequest.approvalStatus).toBe('pending');
    });

    it('should save and retrieve resource type', () => {
      expect(testRequest.resourceType).toBe('equipment');
    });

    it('should save and retrieve requestedBy', () => {
      expect(testRequest.requestedBy).toBe('user-1');
    });

    it('should save and retrieve siteId', () => {
      expect(testRequest.siteId).toBe('site-1');
    });

    it('should have sync_status field', () => {
      expect(testRequest.appSyncStatus).toBe('pending');
    });

    it('should have version field for conflict resolution', () => {
      expect(testRequest.version).toBe(1);
    });

    it('should support different priority levels', async () => {
      const priorities = ['low', 'medium', 'high', 'urgent'];

      for (const priority of priorities) {
        let request: ResourceRequestModel | undefined;

        await database.write(async () => {
          request = await database.collections.get<ResourceRequestModel>('resource_requests').create((r) => {
            r.requestedBy = 'user-1';
            r.siteId = 'site-1';
            r.resourceType = 'material';
            r.resourceName = 'Cement';
            r.quantity = 100;
            r.priority = priority;
            r.requestedDate = Date.now();
            r.neededByDate = Date.now() + 86400000;
            r.approvalStatus = 'pending';
            r.appSyncStatus = 'pending';
            r.version = 1;
          });
        });

        expect(request?.priority).toBe(priority);

        if (request) {
          await database.write(async () => {
            await request!.destroyPermanently();
          });
        }
      }
    });

    it('should support different approval statuses', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'fulfilled'];

      for (const status of statuses) {
        let request: ResourceRequestModel | undefined;

        await database.write(async () => {
          request = await database.collections.get<ResourceRequestModel>('resource_requests').create((r) => {
            r.requestedBy = 'user-1';
            r.siteId = 'site-1';
            r.resourceType = 'personnel';
            r.resourceName = 'Workers';
            r.quantity = 5;
            r.priority = 'medium';
            r.requestedDate = Date.now();
            r.neededByDate = Date.now() + 86400000;
            r.approvalStatus = status;
            r.appSyncStatus = 'pending';
            r.version = 1;
          });
        });

        expect(request?.approvalStatus).toBe(status);

        if (request) {
          await database.write(async () => {
            await request!.destroyPermanently();
          });
        }
      }
    });
  });
});
