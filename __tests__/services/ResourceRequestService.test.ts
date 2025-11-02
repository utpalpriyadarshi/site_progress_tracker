/**
 * ResourceRequestService Tests
 *
 * Tests for resource request creation and approval workflow
 * Added for Activity 3: Manager Role - Week 1, Day 2
 */

import { database } from '../../models/database';
import ResourceRequestService from '../../services/resource/ResourceRequestService';
import ResourceRequestModel from '../../models/ResourceRequestModel';

describe('ResourceRequestService', () => {
  // Database is already initialized by jest.setup.js

  describe('Request Creation', () => {
    let createdRequestId: string;

    afterEach(async () => {
      // Clean up created request
      if (createdRequestId) {
        try {
          const request = await database.collections
            .get<ResourceRequestModel>('resource_requests')
            .find(createdRequestId);
          await database.write(async () => {
            await request.destroyPermanently();
          });
        } catch (error) {
          // Request may not exist, ignore
        }
        createdRequestId = '';
      }
    });

    it('should create a new resource request', async () => {
      const requestData = {
        requestedBy: 'user-123',
        siteId: 'site-456',
        resourceType: 'equipment',
        resourceName: 'Excavator',
        quantity: 2,
        priority: 'high',
        neededByDate: Date.now() + 86400000, // +1 day
        notes: 'Needed for foundation work',
      };

      const request = await ResourceRequestService.createRequest(requestData);
      createdRequestId = request.id;

      expect(request.requestedBy).toBe(requestData.requestedBy);
      expect(request.siteId).toBe(requestData.siteId);
      expect(request.resourceType).toBe(requestData.resourceType);
      expect(request.resourceName).toBe(requestData.resourceName);
      expect(request.quantity).toBe(requestData.quantity);
      expect(request.priority).toBe(requestData.priority);
      expect(request.approvalStatus).toBe('pending');
      expect(request.notes).toBe(requestData.notes);
      expect(request.appSyncStatus).toBe('pending');
      expect(request.version).toBe(1);
    });
  });

  describe('Request Queries', () => {
    let testRequests: ResourceRequestModel[] = [];

    beforeEach(async () => {
      // Create multiple test requests
      await database.write(async () => {
        const req1 = await database.collections
          .get<ResourceRequestModel>('resource_requests')
          .create((record) => {
            record.requestedBy = 'user-1';
            record.siteId = 'site-A';
            record.resourceType = 'equipment';
            record.resourceName = 'Crane';
            record.quantity = 1;
            record.priority = 'urgent';
            record.requestedDate = Date.now();
            record.neededByDate = Date.now() + 86400000;
            record.approvalStatus = 'pending';
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        const req2 = await database.collections
          .get<ResourceRequestModel>('resource_requests')
          .create((record) => {
            record.requestedBy = 'user-2';
            record.siteId = 'site-A';
            record.resourceType = 'material';
            record.resourceName = 'Cement';
            record.quantity = 100;
            record.priority = 'medium';
            record.requestedDate = Date.now();
            record.neededByDate = Date.now() + 172800000; // +2 days
            record.approvalStatus = 'approved';
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        const req3 = await database.collections
          .get<ResourceRequestModel>('resource_requests')
          .create((record) => {
            record.requestedBy = 'user-1';
            record.siteId = 'site-B';
            record.resourceType = 'personnel';
            record.resourceName = 'Workers';
            record.quantity = 5;
            record.priority = 'high';
            record.requestedDate = Date.now();
            record.neededByDate = Date.now() + 259200000; // +3 days
            record.approvalStatus = 'pending';
            record.appSyncStatus = 'pending';
            record.version = 1;
          });

        testRequests = [req1, req2, req3];
      });
    });

    afterEach(async () => {
      // Clean up test requests
      await database.write(async () => {
        for (const request of testRequests) {
          await request.destroyPermanently();
        }
      });
      testRequests = [];
    });

    it('should get pending requests', async () => {
      const pendingRequests = await ResourceRequestService.getPendingRequests();
      const ourPendingRequests = pendingRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      expect(ourPendingRequests.length).toBe(2);
      expect(ourPendingRequests.every((r) => r.approvalStatus === 'pending')).toBe(true);
    });

    it('should get requests by site', async () => {
      const siteRequests = await ResourceRequestService.getRequestsBySite('site-A');
      const ourSiteRequests = siteRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      expect(ourSiteRequests.length).toBe(2);
      expect(ourSiteRequests.every((r) => r.siteId === 'site-A')).toBe(true);
    });

    it('should get requests by priority', async () => {
      const highPriorityRequests = await ResourceRequestService.getRequestsByPriority('high');
      const ourHighPriorityRequests = highPriorityRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      expect(ourHighPriorityRequests.length).toBe(1);
      expect(ourHighPriorityRequests[0].priority).toBe('high');
    });

    it('should get requests by status', async () => {
      const approvedRequests = await ResourceRequestService.getRequestsByStatus('approved');
      const ourApprovedRequests = approvedRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      expect(ourApprovedRequests.length).toBe(1);
      expect(ourApprovedRequests[0].approvalStatus).toBe('approved');
    });

    it('should get urgent requests', async () => {
      const urgentRequests = await ResourceRequestService.getUrgentRequests(7);
      const ourUrgentRequests = urgentRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      // Should include urgent and high priority requests needed within 7 days
      expect(ourUrgentRequests.length).toBeGreaterThanOrEqual(1);
    });

    it('should get requests by user', async () => {
      const userRequests = await ResourceRequestService.getRequestsByUser('user-1');
      const ourUserRequests = userRequests.filter((r) =>
        testRequests.map((req) => req.id).includes(r.id)
      );
      expect(ourUserRequests.length).toBe(2);
      expect(ourUserRequests.every((r) => r.requestedBy === 'user-1')).toBe(true);
    });
  });

  describe('Approval Workflow', () => {
    let testRequest: ResourceRequestModel;

    beforeEach(async () => {
      // Create test request
      await database.write(async () => {
        testRequest = await database.collections
          .get<ResourceRequestModel>('resource_requests')
          .create((record) => {
            record.requestedBy = 'user-123';
            record.siteId = 'site-456';
            record.resourceType = 'equipment';
            record.resourceName = 'Bulldozer';
            record.quantity = 1;
            record.priority = 'medium';
            record.requestedDate = Date.now();
            record.neededByDate = Date.now() + 86400000;
            record.approvalStatus = 'pending';
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
    });

    afterEach(async () => {
      // Clean up test request
      await database.write(async () => {
        await testRequest.destroyPermanently();
      });
    });

    it('should approve a request', async () => {
      const approvedRequest = await ResourceRequestService.approveRequest(
        testRequest.id,
        'manager-123'
      );

      expect(approvedRequest.approvalStatus).toBe('approved');
      expect(approvedRequest.approvedBy).toBe('manager-123');
      expect(approvedRequest.approvalDate).toBeDefined();
      expect(approvedRequest.version).toBe(2);
      expect(approvedRequest.appSyncStatus).toBe('pending');
    });

    it('should reject a request with reason', async () => {
      const reason = 'Equipment not available';
      const rejectedRequest = await ResourceRequestService.rejectRequest(
        testRequest.id,
        'manager-123',
        reason
      );

      expect(rejectedRequest.approvalStatus).toBe('rejected');
      expect(rejectedRequest.approvedBy).toBe('manager-123');
      expect(rejectedRequest.approvalDate).toBeDefined();
      expect(rejectedRequest.rejectionReason).toBe(reason);
      expect(rejectedRequest.version).toBe(2);
      expect(rejectedRequest.appSyncStatus).toBe('pending');
    });

    it('should mark a request as fulfilled', async () => {
      // First approve the request
      await ResourceRequestService.approveRequest(testRequest.id, 'manager-123');

      // Then mark as fulfilled
      const fulfilledRequest = await ResourceRequestService.markFulfilled(testRequest.id);

      expect(fulfilledRequest.approvalStatus).toBe('fulfilled');
      expect(fulfilledRequest.version).toBe(3);
      expect(fulfilledRequest.appSyncStatus).toBe('pending');
    });

    it('should update request priority', async () => {
      const updatedRequest = await ResourceRequestService.updatePriority(
        testRequest.id,
        'urgent'
      );

      expect(updatedRequest.priority).toBe('urgent');
      expect(updatedRequest.version).toBe(2);
      expect(updatedRequest.appSyncStatus).toBe('pending');
    });
  });

  describe('Request Statistics', () => {
    let testRequests: ResourceRequestModel[] = [];

    beforeEach(async () => {
      // Create requests with various statuses and priorities
      await database.write(async () => {
        const statuses = ['pending', 'approved', 'rejected', 'fulfilled'];
        const priorities = ['low', 'medium', 'high', 'urgent'];

        for (let i = 0; i < 10; i++) {
          const request = await database.collections
            .get<ResourceRequestModel>('resource_requests')
            .create((record) => {
              record.requestedBy = `user-${i}`;
              record.siteId = 'site-test';
              record.resourceType = 'equipment';
              record.resourceName = `Resource-${i}`;
              record.quantity = i + 1;
              record.priority = priorities[i % 4];
              record.requestedDate = Date.now();
              record.neededByDate = Date.now() + 86400000;
              record.approvalStatus = statuses[i % 4];
              record.appSyncStatus = 'pending';
              record.version = 1;
            });
          testRequests.push(request);
        }
      });
    });

    afterEach(async () => {
      // Clean up test requests
      await database.write(async () => {
        for (const request of testRequests) {
          await request.destroyPermanently();
        }
      });
      testRequests = [];
    });

    it('should get request statistics', async () => {
      const stats = await ResourceRequestService.getRequestStatistics();

      // We created 10 test requests
      expect(stats.total).toBeGreaterThanOrEqual(10);
      expect(stats.pending).toBeGreaterThanOrEqual(2); // 2 or more pending
      expect(stats.approved).toBeGreaterThanOrEqual(2); // 2 or more approved
      expect(stats.rejected).toBeGreaterThanOrEqual(2); // 2 or more rejected
      expect(stats.fulfilled).toBeGreaterThanOrEqual(2); // 2 or more fulfilled

      // Priority distribution
      expect(stats.byPriority.low).toBeGreaterThanOrEqual(2);
      expect(stats.byPriority.medium).toBeGreaterThanOrEqual(2);
      expect(stats.byPriority.high).toBeGreaterThanOrEqual(2);
      expect(stats.byPriority.urgent).toBeGreaterThanOrEqual(2);
    });
  });
});
