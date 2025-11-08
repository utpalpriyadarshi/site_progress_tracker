import { database } from '../../models/database';
import ResourceRequestModel from '../../models/ResourceRequestModel';
import { Q } from '@nozbe/watermelondb';

/**
 * Data structure for creating resource requests
 */
export interface RequestData {
  requestedBy: string;
  siteId: string;
  resourceType: string;
  resourceName: string;
  quantity: number;
  priority: string;
  neededByDate: number;
  notes?: string;
}

/**
 * ResourceRequestService
 *
 * Service for managing resource requests (equipment, materials, personnel).
 * Provides approval workflow and tracking functionality.
 *
 * Features:
 * - Create and manage resource requests
 * - Approval/rejection workflow
 * - Query requests by status, priority, or site
 * - Track fulfillment status
 */
class ResourceRequestService {
  /**
   * Create a new resource request
   *
   * @param data - Request data (resource details, priority, etc.)
   * @returns Promise resolving to created ResourceRequestModel
   * @throws Error if request creation fails
   */
  async createRequest(data: RequestData): Promise<ResourceRequestModel> {
    try {
      const request = await database.write(async () => {
        return await database.collections
          .get<ResourceRequestModel>('resource_requests')
          .create((record) => {
            record.requestedBy = data.requestedBy;
            record.siteId = data.siteId;
            record.resourceType = data.resourceType;
            record.resourceName = data.resourceName;
            record.quantity = data.quantity;
            record.priority = data.priority;
            record.requestedDate = Date.now();
            record.neededByDate = data.neededByDate;
            record.approvalStatus = 'pending';
            record.notes = data.notes;
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
      return request;
    } catch (error) {
      console.error('Error creating resource request:', error);
      throw new Error('Failed to create resource request');
    }
  }

  /**
   * Get all pending requests (awaiting approval)
   *
   * @returns Promise resolving to array of pending ResourceRequestModel
   */
  async getPendingRequests(): Promise<ResourceRequestModel[]> {
    try {
      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(Q.where('approval_status', 'pending'))
        .fetch();
      return requests;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw new Error('Failed to fetch pending requests');
    }
  }

  /**
   * Get all requests for a specific site
   *
   * @param siteId - ID of the site
   * @returns Promise resolving to array of ResourceRequestModel
   */
  async getRequestsBySite(siteId: string): Promise<ResourceRequestModel[]> {
    try {
      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(Q.where('site_id', siteId))
        .fetch();
      return requests;
    } catch (error) {
      console.error('Error fetching requests by site:', error);
      throw new Error('Failed to fetch requests by site');
    }
  }

  /**
   * Get requests by priority level
   *
   * @param priority - Priority level (low, medium, high, urgent)
   * @returns Promise resolving to array of ResourceRequestModel
   */
  async getRequestsByPriority(priority: string): Promise<ResourceRequestModel[]> {
    try {
      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(Q.where('priority', priority))
        .fetch();
      return requests;
    } catch (error) {
      console.error('Error fetching requests by priority:', error);
      throw new Error('Failed to fetch requests by priority');
    }
  }

  /**
   * Get requests by approval status
   *
   * @param status - Approval status (pending, approved, rejected, fulfilled)
   * @returns Promise resolving to array of ResourceRequestModel
   */
  async getRequestsByStatus(status: string): Promise<ResourceRequestModel[]> {
    try {
      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(Q.where('approval_status', status))
        .fetch();
      return requests;
    } catch (error) {
      console.error('Error fetching requests by status:', error);
      throw new Error('Failed to fetch requests by status');
    }
  }

  /**
   * Approve a resource request
   *
   * @param requestId - ID of the request to approve
   * @param approverId - ID of the user approving the request
   * @returns Promise resolving to approved ResourceRequestModel
   * @throws Error if request not found or approval fails
   */
  async approveRequest(requestId: string, approverId: string): Promise<ResourceRequestModel> {
    try {
      const request = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .find(requestId);

      const approvedRequest = await database.write(async () => {
        return await request.update((record) => {
          record.approvalStatus = 'approved';
          record.approvedBy = approverId;
          record.approvalDate = Date.now();
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      return approvedRequest;
    } catch (error) {
      console.error('Error approving request:', error);
      throw new Error('Failed to approve request');
    }
  }

  /**
   * Reject a resource request
   *
   * @param requestId - ID of the request to reject
   * @param approverId - ID of the user rejecting the request
   * @param reason - Reason for rejection
   * @returns Promise resolving to rejected ResourceRequestModel
   * @throws Error if request not found or rejection fails
   */
  async rejectRequest(
    requestId: string,
    approverId: string,
    reason: string
  ): Promise<ResourceRequestModel> {
    try {
      const request = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .find(requestId);

      const rejectedRequest = await database.write(async () => {
        return await request.update((record) => {
          record.approvalStatus = 'rejected';
          record.approvedBy = approverId;
          record.approvalDate = Date.now();
          record.rejectionReason = reason;
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      return rejectedRequest;
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw new Error('Failed to reject request');
    }
  }

  /**
   * Mark a request as fulfilled
   *
   * @param requestId - ID of the request to mark as fulfilled
   * @returns Promise resolving to fulfilled ResourceRequestModel
   * @throws Error if request not found or update fails
   */
  async markFulfilled(requestId: string): Promise<ResourceRequestModel> {
    try {
      const request = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .find(requestId);

      const fulfilledRequest = await database.write(async () => {
        return await request.update((record) => {
          record.approvalStatus = 'fulfilled';
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      return fulfilledRequest;
    } catch (error) {
      console.error('Error marking request as fulfilled:', error);
      throw new Error('Failed to mark request as fulfilled');
    }
  }

  /**
   * Get urgent requests (high priority and needed soon)
   *
   * @param daysThreshold - Number of days to consider as "soon" (default: 7)
   * @returns Promise resolving to array of urgent ResourceRequestModel
   */
  async getUrgentRequests(daysThreshold: number = 7): Promise<ResourceRequestModel[]> {
    try {
      const thresholdTimestamp = Date.now() + daysThreshold * 24 * 60 * 60 * 1000;

      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(
          Q.where('approval_status', 'pending'),
          Q.or(
            Q.where('priority', 'urgent'),
            Q.where('priority', 'high')
          )
        )
        .fetch();

      // Filter by needed_by_date (WatermelonDB doesn't support timestamp comparisons in queries)
      return requests.filter((r) => r.neededByDate <= thresholdTimestamp);
    } catch (error) {
      console.error('Error fetching urgent requests:', error);
      throw new Error('Failed to fetch urgent requests');
    }
  }

  /**
   * Get requests submitted by a specific user
   *
   * @param userId - ID of the user
   * @returns Promise resolving to array of ResourceRequestModel
   */
  async getRequestsByUser(userId: string): Promise<ResourceRequestModel[]> {
    try {
      const requests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query(Q.where('requested_by', userId))
        .fetch();
      return requests;
    } catch (error) {
      console.error('Error fetching requests by user:', error);
      throw new Error('Failed to fetch requests by user');
    }
  }

  /**
   * Update request priority
   *
   * @param requestId - ID of the request
   * @param priority - New priority level
   * @returns Promise resolving to updated ResourceRequestModel
   * @throws Error if request not found or update fails
   */
  async updatePriority(requestId: string, priority: string): Promise<ResourceRequestModel> {
    try {
      const request = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .find(requestId);

      const updatedRequest = await database.write(async () => {
        return await request.update((record) => {
          record.priority = priority;
          record.appSyncStatus = 'pending';
          record.version = record.version + 1;
        });
      });

      return updatedRequest;
    } catch (error) {
      console.error('Error updating request priority:', error);
      throw new Error('Failed to update request priority');
    }
  }

  /**
   * Get statistics for resource requests
   *
   * @returns Promise resolving to request statistics
   */
  async getRequestStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    fulfilled: number;
    byPriority: {
      low: number;
      medium: number;
      high: number;
      urgent: number;
    };
  }> {
    try {
      const allRequests = await database.collections
        .get<ResourceRequestModel>('resource_requests')
        .query()
        .fetch();

      const stats = {
        total: allRequests.length,
        pending: allRequests.filter((r) => r.approvalStatus === 'pending').length,
        approved: allRequests.filter((r) => r.approvalStatus === 'approved').length,
        rejected: allRequests.filter((r) => r.approvalStatus === 'rejected').length,
        fulfilled: allRequests.filter((r) => r.approvalStatus === 'fulfilled').length,
        byPriority: {
          low: allRequests.filter((r) => r.priority === 'low').length,
          medium: allRequests.filter((r) => r.priority === 'medium').length,
          high: allRequests.filter((r) => r.priority === 'high').length,
          urgent: allRequests.filter((r) => r.priority === 'urgent').length,
        },
      };

      return stats;
    } catch (error) {
      console.error('Error fetching request statistics:', error);
      throw new Error('Failed to fetch request statistics');
    }
  }
}

export default new ResourceRequestService();
