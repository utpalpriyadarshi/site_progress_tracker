/**
 * SyncService Unit Tests - Week 9, Day 1 (Simplified & Stable)
 *
 * Focused test suite covering critical SyncService functionality:
 * - Authentication checks
 * - syncUp() basic functionality
 * - syncDown() basic functionality
 * - Error handling
 *
 * Target: 80%+ code coverage with stable, reliable tests
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
    write: jest.fn((callback: any) => Promise.resolve(callback())),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Suppress console output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('SyncService - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Authentication', () => {
    it('should not sync when user is not authenticated', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await SyncService.syncUp();

      expect(result).toEqual({
        success: false,
        message: 'Not authenticated',
        syncedRecords: 0,
      });
    });
  });

  describe('syncUp() - Push Local Changes', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should return success with no pending changes', async () => {
      // Mock all collections returning empty arrays
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(true);
      expect(result.message).toContain('No pending changes');
      expect(result.syncedRecords).toBe(0);
    });

    it('should collect and push pending records', async () => {
      const mockProject = {
        id: 'proj-1',
        _raw: { id: 'proj-1', name: 'Test Project' },
        update: jest.fn((callback: any) => {
          callback({ syncStatus: 'synced' });
          return Promise.resolve();
        }),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([mockProject]);
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
      expect(result.syncedRecords).toBe(1);
      expect(mockProject.update).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const mockProject = {
        id: 'proj-1',
        _raw: { id: 'proj-1', name: 'Test Project' },
        update: jest.fn(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([mockProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

      const result = await SyncService.syncUp();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should handle HTTP errors', async () => {
      const mockProject = {
        id: 'proj-1',
        _raw: { id: 'proj-1', name: 'Test Project' },
        update: jest.fn(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([mockProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Server error');
    });
  });

  describe('syncDown() - Pull Remote Changes', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === '@sync/last_sync_at') return Promise.resolve('0');
        return Promise.resolve(null);
      });
    });

    it('should not sync when user is not authenticated', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);

      const result = await SyncService.syncDown();

      expect(result).toEqual({
        success: false,
        message: 'Not authenticated',
        syncedRecords: 0,
      });
    });

    it('should return success when no changes from server', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const result = await SyncService.syncDown();

      expect(result.success).toBe(true);
      expect(result.message).toContain('No changes from server');
      expect(result.syncedRecords).toBe(0);
    });

    it('should fetch changes with last sync timestamp', async () => {
      const lastSyncAt = 1699999999000;
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
  });

  describe('hasOfflineData()', () => {
    it('should return true when there is pending data', async () => {
      const mockProject = { id: 'proj-1' };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([mockProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      const result = await SyncService.hasOfflineData();

      expect(result).toBe(true);
    });

    it('should return false when there is no pending data', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const result = await SyncService.hasOfflineData();

      expect(result).toBe(false);
    });
  });

  describe('getLastSyncInfo()', () => {
    it('should return sync timestamps', async () => {
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
      expect(info.lastPullAt).toBe(1699999998000);
      expect(info.lastPushAt).toBe(1699999997000);
    });

    it('should handle missing timestamps', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const info = await SyncService.getLastSyncInfo();

      expect(info.lastSyncAt).toBe(0);
      expect(info.lastPullAt).toBe(0);
      expect(info.lastPushAt).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should handle malformed JSON responses', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await SyncService.syncDown();

      expect(result.success).toBe(false);
    });

    it('should handle database errors', async () => {
      (database.collections.get as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await SyncService.syncUp();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
    });
  });

  describe('syncDown() - Apply Remote Changes', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
    });

    it('should apply remote changes to local database (create)', async () => {
      const remoteChanges = {
        projects: [
          {
            id: 'proj-new',
            name: 'New Project',
            _version: 1,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: remoteChanges }),
      });

      const mockCreate = jest.fn().mockResolvedValue({});
      (database.collections.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockRejectedValue(new Error('Not found')), // Simulates record doesn't exist
        create: mockCreate,
      });

      const result = await SyncService.syncDown();

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should apply remote changes to local database (update)', async () => {
      const remoteChanges = {
        projects: [
          {
            id: 'proj-exists',
            name: 'Updated Project',
            _version: 2,
            created_at: Date.now() - 10000,
            updated_at: Date.now(),
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: remoteChanges }),
      });

      const mockUpdate = jest.fn((callback: any) => {
        callback({});
        return Promise.resolve();
      });
      const existingRecord = {
        _raw: { _version: 1 },
        update: mockUpdate,
      };

      (database.collections.get as jest.Mock).mockReturnValue({
        find: jest.fn().mockResolvedValue(existingRecord),
        create: jest.fn(),
      });

      const result = await SyncService.syncDown();

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('syncAll() - Full Bidirectional Sync', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
    });

    it('should run both syncUp and syncDown', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const result = await SyncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Pull:');
      expect(result.message).toContain('Push:');
    });
  });

  describe('getSyncStatus()', () => {
    it('should fetch sync status from API', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      const mockApiResponse = {
        serverTime: Date.now(),
        pendingChanges: 5,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const status = await SyncService.getSyncStatus();

      expect(status).toEqual(mockApiResponse);
    });

    it('should return null when API call fails', async () => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

      const status = await SyncService.getSyncStatus();

      expect(status).toBeNull();
    });
  });

  describe('Multiple Records', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should sync multiple records across different tables', async () => {
      const mockProject = {
        id: 'proj-1',
        _raw: { id: 'proj-1', name: 'Project 1' },
        update: jest.fn((callback: any) => {
          callback({ syncStatus: 'synced' });
          return Promise.resolve();
        }),
      };

      const mockSite = {
        id: 'site-1',
        _raw: { id: 'site-1', name: 'Site 1' },
        update: jest.fn((callback: any) => {
          callback({ syncStatus: 'synced' });
          return Promise.resolve();
        }),
      };

      const mockCategory = {
        id: 'cat-1',
        _raw: { id: 'cat-1', name: 'Category 1' },
        update: jest.fn((callback: any) => {
          callback({ syncStatus: 'synced' });
          return Promise.resolve();
        }),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([mockProject]);
            if (tableName === 'sites') return Promise.resolve([mockSite]);
            if (tableName === 'categories') return Promise.resolve([mockCategory]);
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
      expect(result.syncedRecords).toBe(3);
    });
  });

  describe('Partial Sync Failures', () => {
    beforeEach(() => {
      (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    });

    it('should handle partial failures and continue syncing', async () => {
      const successProject = {
        id: 'proj-success',
        _raw: { id: 'proj-success', name: 'Success' },
        update: jest.fn((callback: any) => {
          callback({ syncStatus: 'synced' });
          return Promise.resolve();
        }),
      };

      const failProject = {
        id: 'proj-fail',
        _raw: { id: 'proj-fail', name: 'Fail' },
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([successProject, failProject]);
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
      expect(result.syncedRecords).toBe(1); // Only one succeeded
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });
});
