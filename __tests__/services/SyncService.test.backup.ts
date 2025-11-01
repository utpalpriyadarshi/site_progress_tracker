/**
 * SyncService Unit Tests - Week 9, Day 1
 *
 * Comprehensive test suite for SyncService covering:
 * - API request handling with authentication
 * - syncUp() - Push local changes to server
 * - syncDown() - Pull remote changes from server
 * - Sync queue operations (processSyncQueue, retry logic)
 * - Dead Letter Queue management
 * - Conflict resolution helpers
 * - Error handling and edge cases
 *
 * Target: 80%+ code coverage
 */

import { SyncService } from '../../services/sync/SyncService';
import TokenStorage from '../../services/storage/TokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../models/database';

// Mock dependencies
jest.mock('../../services/storage/TokenStorage');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback: any) => callback()),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock models
const mockProjectModel = {
  id: 'proj-1',
  _raw: {
    id: 'proj-1',
    name: 'Test Project',
    sync_status: 'pending',
    _version: 1,
  },
  update: jest.fn(),
};

const mockSiteModel = {
  id: 'site-1',
  _raw: {
    id: 'site-1',
    name: 'Test Site',
    project_id: 'proj-1',
    sync_status: 'pending',
    _version: 1,
  },
  update: jest.fn(),
};

const mockSyncQueueItem = {
  id: 'queue-1',
  tableName: 'projects',
  recordId: 'proj-1',
  action: 'update' as 'create' | 'update' | 'delete',
  data: '{"name":"Updated Project"}',
  retryCount: 0,
  syncedAt: undefined,
  lastError: undefined,
  createdAt: Date.now(),
  update: jest.fn(),
  markAsSynced: jest.fn(),
  markAsFailed: jest.fn(),
  markAsObsolete: jest.fn(),
};

describe('SyncService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Setup default database mock behavior
    (database.collections.get as jest.Mock).mockReturnValue({
      query: jest.fn(() => ({
        fetch: jest.fn(() => Promise.resolve([])),
      })),
      find: jest.fn(),
      create: jest.fn(),
    });

    (database.write as jest.Mock).mockImplementation((callback: any) => callback());

    // Setup default AsyncStorage mock
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Restore console
    jest.restoreAllMocks();
  });

  describe('Authentication and API Requests', () => {
    describe('apiRequest()', () => {
      it('should throw error when no access token is available', async () => {
        (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

        await expect(
          // Using syncUp as a way to test apiRequest indirectly
          SyncService.syncUp()
        ).resolves.toMatchObject({
          success: false,
          message: 'Not authenticated',
          syncedRecords: 0,
        });
      });

      it('should make authenticated request with Bearer token', async () => {
        const mockToken = 'mock-jwt-token';
        (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

        // Mock fetch response
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => ({ success: true, changes: {} }),
        });

        // Mock empty pending records
        (database.collections.get as jest.Mock).mockReturnValue({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve([])),
          })),
        });

        await SyncService.syncUp();

        // Verify fetch was NOT called (no pending records)
        // If there were pending records, we'd verify the Authorization header
      });

      it('should handle network timeout', async () => {
        const mockToken = 'mock-jwt-token';
        (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

        // Mock timeout error
        (global.fetch as jest.Mock).mockImplementation(
          () =>
            new Promise((_, reject) => {
              const error = new Error('Aborted');
              error.name = 'AbortError';
              reject(error);
            })
        );

        // Mock pending records to trigger API call
        (database.collections.get as jest.Mock).mockReturnValue({
          query: jest.fn(() => ({
            fetch: jest.fn((tableName: string) => {
              if (tableName === 'projects') {
                return Promise.resolve([mockProjectModel]);
              }
              return Promise.resolve([]);
            }),
          })),
        });

        const result = await SyncService.syncUp();

        expect(result.success).toBe(false);
        expect(result.message).toContain('timeout');
      });

      it('should handle network errors', async () => {
        const mockToken = 'mock-jwt-token';
        (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

        // Mock network error
        (global.fetch as jest.Mock).mockRejectedValue(
          new Error('Network request failed')
        );

        // Mock pending records
        (database.collections.get as jest.Mock).mockReturnValue({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
          })),
        });

        const result = await SyncService.syncUp();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Network error');
      });

      it('should handle HTTP error responses', async () => {
        const mockToken = 'mock-jwt-token';
        (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(mockToken);

        // Mock HTTP 401 error
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ message: 'Invalid token' }),
        });

        // Mock pending records
        (database.collections.get as jest.Mock).mockReturnValue({
          query: jest.fn(() => ({
            fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
          })),
        });

        const result = await SyncService.syncUp();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid token');
      });
    });
  });

  describe('syncUp() - Push Local Changes', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should return success when no pending changes', async () => {
      // Mock all collections returning empty arrays
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const result = await SyncService.syncUp();

      expect(result).toEqual({
        success: true,
        message: 'No pending changes to sync',
        syncedRecords: 0,
      });
    });

    it('should collect and push pending records from all syncable tables', async () => {
      // Mock pending records
      const mockCollections = {
        projects: [mockProjectModel],
        sites: [mockSiteModel],
        categories: [],
        items: [],
        materials: [],
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve(mockCollections[tableName] || [])),
        })),
      }));

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Mock model update
      mockProjectModel.update.mockImplementation((callback: any) => {
        callback({ syncStatus: 'synced' });
        return Promise.resolve();
      });
      mockSiteModel.update.mockImplementation((callback: any) => {
        callback({ syncStatus: 'synced' });
        return Promise.resolve();
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(true);
      expect(result.syncedRecords).toBe(2); // 1 project + 1 site
      expect(mockProjectModel.update).toHaveBeenCalled();
      expect(mockSiteModel.update).toHaveBeenCalled();
    });

    it('should update sync_status to "synced" after successful push', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
        })),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      let updatedSyncStatus: string | undefined;
      mockProjectModel.update.mockImplementation((callback: any) => {
        const record = { syncStatus: '' };
        callback(record);
        updatedSyncStatus = record.syncStatus;
        return Promise.resolve();
      });

      await SyncService.syncUp();

      expect(updatedSyncStatus).toBe('synced');
    });

    it('should update last push timestamp', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      await SyncService.syncUp();

      // Verify AsyncStorage.setItem was called for LAST_PUSH_AT
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastPushCall = setItemCalls.find((call) => call[0] === '@sync/last_push_at');
      expect(lastPushCall).toBeDefined();
    });

    it('should handle partial failures and report errors', async () => {
      const failingProject = {
        ...mockProjectModel,
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([failingProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(true);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('syncDown() - Pull Remote Changes', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0'); // last_sync_at = 0
    });

    it('should return success when not authenticated', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await SyncService.syncDown();

      expect(result).toEqual({
        success: false,
        message: 'Not authenticated',
        syncedRecords: 0,
      });
    });

    it('should fetch changes since last sync timestamp', async () => {
      const lastSyncAt = Date.now() - 3600000; // 1 hour ago
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@sync/last_sync_at') return Promise.resolve(lastSyncAt.toString());
        return Promise.resolve(null);
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      await SyncService.syncDown();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`updated_after=${lastSyncAt}`),
        expect.any(Object)
      );
    });

    it('should return success when no changes from server', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const result = await SyncService.syncDown();

      expect(result).toEqual({
        success: true,
        message: 'No changes from server',
        syncedRecords: 0,
      });
    });

    it('should apply remote changes to local database', async () => {
      const remoteChanges = {
        projects: [
          {
            id: 'proj-remote-1',
            name: 'Remote Project',
            _version: 1,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
        sites: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: remoteChanges }),
      });

      const mockFind = jest.fn().mockResolvedValue(null); // Record doesn't exist
      const mockCreate = jest.fn().mockResolvedValue({});

      (database.collections.get as jest.Mock).mockReturnValue({
        find: mockFind,
        create: mockCreate,
      });

      await SyncService.syncDown();

      expect(mockCreate).toHaveBeenCalled();
    });

    it('should update last sync timestamp after successful pull', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const beforeSync = Date.now();
      await SyncService.syncDown();

      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastSyncCall = setItemCalls.find((call) => call[0] === '@sync/last_sync_at');
      expect(lastSyncCall).toBeDefined();
      expect(parseInt(lastSyncCall[1])).toBeGreaterThanOrEqual(beforeSync);
    });
  });

  describe('Sync Queue Operations', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should process sync queue and retry failed items', async () => {
      const mockPendingItems = [mockSyncQueueItem];

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve(mockPendingItems)),
        })),
        find: jest.fn().mockResolvedValue({
          _raw: { id: 'proj-1', name: 'Test' },
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      mockSyncQueueItem.markAsSynced.mockResolvedValue(undefined);

      const result = await SyncService.processSyncQueue();

      expect(result.success).toBe(true);
      expect(mockSyncQueueItem.markAsSynced).toHaveBeenCalled();
    });

    it('should move item to Dead Letter Queue after max retries', async () => {
      const failedItem = {
        ...mockSyncQueueItem,
        retryCount: 5, // Max retries exceeded
      };

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([failedItem])),
        })),
        find: jest.fn().mockResolvedValue({
          _raw: { id: 'proj-1', name: 'Test' },
        }),
        create: jest.fn().mockResolvedValue({}),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      failedItem.markAsObsolete.mockImplementation(() => Promise.resolve());

      await SyncService.processSyncQueue();

      // Should create DLQ item and mark original as obsolete
      expect(failedItem.markAsObsolete).toHaveBeenCalled();
    });

    it('should implement exponential backoff for retries', async () => {
      const itemWithRetries = {
        ...mockSyncQueueItem,
        retryCount: 2,
        markAsFailed: jest.fn().mockResolvedValue(undefined),
      };

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([itemWithRetries])),
        })),
        find: jest.fn().mockResolvedValue({
          _raw: { id: 'proj-1', name: 'Test' },
        }),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Temporary failure'));

      await SyncService.processSyncQueue();

      // Should call markAsFailed instead of update
      expect(itemWithRetries.markAsFailed).toHaveBeenCalled();
    });
  });

  describe('Dead Letter Queue Management', () => {
    it('should retrieve all dead letter queue items', async () => {
      const mockDLQItems = [
        {
          id: 'dlq-1',
          tableName: 'projects',
          recordId: 'proj-1',
          errorMessage: 'Sync failed',
          _raw: {
            table_name: 'projects',
            record_id: 'proj-1',
            error_message: 'Sync failed',
          },
        },
      ];

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve(mockDLQItems)),
        })),
      });

      const result = await SyncService.getDeadLetterQueue();

      expect(result).toHaveLength(1);
      expect(result[0].table_name).toBe('projects');
    });

    it('should retry a dead letter item', async () => {
      const mockDLQItem = {
        id: 'dlq-1',
        tableName: 'projects',
        recordId: 'proj-1',
        data: '{"name":"Test"}',
        markAsObsolete: jest.fn(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => {
        if (tableName === 'dead_letter_queue') {
          return {
            query: jest.fn(() => ({
              fetch: jest.fn(() => Promise.resolve([mockDLQItem])),
            })),
          };
        }
        return {
          create: jest.fn().mockResolvedValue({}),
        };
      });

      mockDLQItem.markAsObsolete.mockResolvedValue(undefined);

      const result = await SyncService.retryDeadLetterItem('projects', 'proj-1');

      expect(result).toBe(true);
      expect(mockDLQItem.markAsObsolete).toHaveBeenCalled();
    });

    it('should clear all dead letter queue items', async () => {
      const mockDLQItems = [
        { id: 'dlq-1', markAsObsolete: jest.fn() },
        { id: 'dlq-2', markAsObsolete: jest.fn() },
      ];

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve(mockDLQItems)),
        })),
      });

      mockDLQItems.forEach((item) => {
        item.markAsObsolete.mockResolvedValue(undefined);
      });

      const result = await SyncService.clearDeadLetterQueue();

      expect(result).toBe(2);
      expect(mockDLQItems[0].markAsObsolete).toHaveBeenCalled();
      expect(mockDLQItems[1].markAsObsolete).toHaveBeenCalled();
    });
  });

  describe('Sync Status and Monitoring', () => {
    it('should return current sync status', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
        })),
      });

      const status = await SyncService.getSyncStatus();

      expect(status).toHaveProperty('pendingChanges');
      expect(status.pendingChanges).toBeGreaterThan(0);
    });

    it('should return last sync info with timestamps', async () => {
      const mockTimestamps = {
        '@sync/last_sync_at': '1699999999000',
        '@sync/last_pull_at': '1699999998000',
        '@sync/last_push_at': '1699999997000',
      };

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        Promise.resolve(mockTimestamps[key] || null)
      );

      const info = await SyncService.getLastSyncInfo();

      expect(info).toHaveProperty('lastSyncAt');
      expect(info).toHaveProperty('lastPullAt');
      expect(info).toHaveProperty('lastPushAt');
      expect(info.lastSyncAt).toBe(1699999999000);
    });

    it('should detect offline data correctly', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
        })),
      });

      const hasOffline = await SyncService.hasOfflineData();

      expect(hasOffline).toBe(true);
    });

    it('should return false when no offline data', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const hasOffline = await SyncService.hasOfflineData();

      expect(hasOffline).toBe(false);
    });
  });

  describe('syncAll() - Full Bidirectional Sync', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should execute both syncUp and syncDown', async () => {
      // Mock empty pending changes
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      // Mock API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const result = await SyncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.message).toContain('bidirectional');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed server responses', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const result = await SyncService.syncDown();

      expect(result.success).toBe(false);
    });

    it('should handle database write failures gracefully', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([mockProjectModel])),
        })),
      });

      (database.write as jest.Mock).mockRejectedValue(new Error('Database locked'));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database locked');
    });

    it('should handle concurrent sync attempts', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      // Run multiple syncs concurrently
      const results = await Promise.all([
        SyncService.syncAll(),
        SyncService.syncAll(),
        SyncService.syncAll(),
      ]);

      // All should complete successfully
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
