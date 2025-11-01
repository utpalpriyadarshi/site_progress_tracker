/**
 * SyncService Integration Tests - Week 9, Day 2
 *
 * Tests offline→online scenarios and conflict resolution:
 * - Create record offline → sync to server
 * - Update record offline → sync with conflict resolution
 * - Multi-device sync scenarios
 * - Network interruption recovery
 * - Conflict resolution (Last-Write-Wins + version comparison)
 *
 * These tests verify end-to-end sync flows with realistic mocking.
 */

import { SyncService } from '../../services/sync/SyncService';
import { database } from '../../models/database';
import TokenStorage from '../../services/storage/TokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Helper to create mock records
const createMockProject = (id: string, name: string, syncStatus: string, version: number) => ({
  id,
  name,
  syncStatus,
  version,
  _raw: {
    id,
    name,
    client: 'Test Client',
    sync_status: syncStatus,
    _version: version,
  },
  update: jest.fn((callback: any) => {
    const record: any = { syncStatus, version };
    callback(record);
    return Promise.resolve();
  }),
});

const createMockSite = (id: string, name: string, projectId: string, syncStatus: string, version: number) => ({
  id,
  name,
  projectId,
  syncStatus,
  version,
  _raw: {
    id,
    name,
    project_id: projectId,
    sync_status: syncStatus,
    _version: version,
  },
  update: jest.fn((callback: any) => {
    const record: any = { syncStatus, version };
    callback(record);
    return Promise.resolve();
  }),
});

describe('SyncService - Integration Tests (Offline→Online Scenarios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    (TokenStorage.getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('0');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Scenario 1: Create Record Offline → Sync to Server', () => {
    it('should successfully sync newly created offline record to server', async () => {
      // Setup: User creates a project offline
      const offlineProject = createMockProject('offline-proj-1', 'Offline Project', 'pending', 1);

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([offlineProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // Mock: Server accepts the record
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Action: User goes online and syncs
      const syncResult = await SyncService.syncUp();

      // Verification
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedRecords).toBe(1);
      expect(syncResult.message).toContain('Successfully synced');

      // Verify record updated to 'synced'
      expect(offlineProject.update).toHaveBeenCalled();
      const updateCallback = (offlineProject.update as jest.Mock).mock.calls[0][0];
      const mockRecord: any = { syncStatus: 'pending' };
      updateCallback(mockRecord);
      expect(mockRecord.syncStatus).toBe('synced');
    });

    it('should sync multiple offline records across different tables', async () => {
      // Setup: User creates project and site offline
      const offlineProject = createMockProject('proj-1', 'Project', 'pending', 1);
      const offlineSite = createMockSite('site-1', 'Site', 'proj-1', 'pending', 1);

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([offlineProject]);
            if (tableName === 'sites') return Promise.resolve([offlineSite]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // Mock: Server accepts both records
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Action: Sync
      const syncResult = await SyncService.syncUp();

      // Verification
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedRecords).toBe(2);
      expect(offlineProject.update).toHaveBeenCalled();
      expect(offlineSite.update).toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Update Record Offline → Sync to Server', () => {
    it('should sync updated record with version increment', async () => {
      // Setup: User updates an existing project offline
      const updatedProject = createMockProject('proj-1', 'Updated Name', 'pending', 2);

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([updatedProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // Mock: Server accepts update
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Action: Sync
      const syncResult = await SyncService.syncUp();

      // Verification
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedRecords).toBe(1);
      expect(updatedProject.update).toHaveBeenCalled();
    });
  });

  describe('Scenario 3: Conflict Resolution (Last-Write-Wins)', () => {
    it('should accept server version when server has newer version', async () => {
      // Setup: Local version 1, Server has version 2
      const serverUpdate = {
        id: 'proj-1',
        name: 'Server Updated Name',
        client: 'Server Client',
        _version: 2, // Newer
        created_at: Date.now() - 5000,
        updated_at: Date.now(),
      };

      const localProject = {
        _raw: { _version: 1 }, // Older
        update: jest.fn((callback: any) => {
          callback({});
          return Promise.resolve();
        }),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
        find: jest.fn(() => Promise.resolve(localProject)),
        create: jest.fn(),
      }));

      // Mock: Server returns updated record
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          changes: {
            projects: [serverUpdate],
          },
        }),
      });

      // Action: Sync from server
      const syncResult = await SyncService.syncDown();

      // Verification: Server version should be accepted
      expect(syncResult.success).toBe(true);
      expect(localProject.update).toHaveBeenCalled();
    });

    it('should reject server version when local has newer version', async () => {
      // Setup: Local version 3, Server has version 2
      const serverUpdate = {
        id: 'proj-1',
        name: 'Server Old Name',
        _version: 2, // Older
        created_at: Date.now() - 10000,
        updated_at: Date.now() - 5000,
      };

      const localProject = {
        version: 3, // Newer - must be a property, not just in _raw
        _raw: { _version: 3 },
        update: jest.fn(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
        find: jest.fn(() => Promise.resolve(localProject)),
        create: jest.fn(),
      }));

      // Mock: Server returns older record
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          changes: {
            projects: [serverUpdate],
          },
        }),
      });

      // Action: Sync from server
      const syncResult = await SyncService.syncDown();

      // Verification: Local version should be preserved (update not called)
      expect(syncResult.success).toBe(true);
      expect(localProject.update).not.toHaveBeenCalled();
    });

    it('should use Last-Write-Wins when versions are equal', async () => {
      // Setup: Both version 2, but server updated more recently
      const serverUpdate = {
        id: 'proj-1',
        name: 'Server Same Version',
        _version: 2,
        created_at: Date.now() - 5000,
        updated_at: Date.now(), // More recent
      };

      const localProject = {
        _raw: {
          _version: 2,
          updated_at: Date.now() - 2000, // Less recent
        },
        update: jest.fn((callback: any) => {
          callback({});
          return Promise.resolve();
        }),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
        find: jest.fn(() => Promise.resolve(localProject)),
        create: jest.fn(),
      }));

      // Mock: Server returns recent update
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          changes: {
            projects: [serverUpdate],
          },
        }),
      });

      // Action: Sync from server
      const syncResult = await SyncService.syncDown();

      // Verification: Server version wins (more recent)
      expect(syncResult.success).toBe(true);
      expect(localProject.update).toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Multi-Device Sync', () => {
    it('should handle concurrent updates from two devices', async () => {
      // Device 1 creates record offline
      const device1Project = createMockProject('proj-1', 'Device 1 Project', 'pending', 1);

      // Device 2 creates different record (simulated via server)
      const device2Project = {
        id: 'proj-2',
        name: 'Device 2 Project',
        _version: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([device1Project]);
            return Promise.resolve([]);
          }),
        })),
        find: jest.fn(() => Promise.reject(new Error('Not found'))),
        create: jest.fn((callback: any) => {
          callback({});
          return Promise.resolve({});
        }),
      }));

      // Mock: syncDown returns Device 2's record
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            changes: {
              projects: [device2Project],
            },
          }),
        })
        // Mock: syncUp accepts Device 1's record
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      // Action: Bidirectional sync
      const syncResult = await SyncService.syncAll();

      // Verification: Both devices' records should be synced
      expect(syncResult.success).toBe(true);
      expect(syncResult.message).toContain('Pull:');
      expect(syncResult.message).toContain('Push:');
    });
  });

  describe('Scenario 5: Network Interruption Recovery', () => {
    it('should retry sync after network failure', async () => {
      const offlineProject = createMockProject('proj-1', 'Network Test', 'pending', 1);

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([offlineProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // First attempt: Network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));

      let syncResult = await SyncService.syncUp();

      // Verify first attempt failed
      expect(syncResult.success).toBe(false);
      expect(syncResult.message).toContain('Network error');
      expect(offlineProject.update).not.toHaveBeenCalled();

      // Reset mock
      offlineProject.update.mockClear();

      // Second attempt: Network recovered
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      syncResult = await SyncService.syncUp();

      // Verify retry succeeded
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedRecords).toBe(1);
      expect(offlineProject.update).toHaveBeenCalled();
    });

    it('should handle HTTP 500 errors gracefully', async () => {
      const offlineProject = createMockProject('proj-1', 'HTTP Error Test', 'pending', 1);

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([offlineProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // Mock: Server error
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Database error' }),
      });

      const syncResult = await SyncService.syncUp();

      // Verify error handled gracefully
      expect(syncResult.success).toBe(false);
      expect(syncResult.message).toContain('Database error');
      expect(offlineProject.update).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 6: Partial Sync Failures', () => {
    it('should continue syncing after individual record failure', async () => {
      const successProject = createMockProject('proj-success', 'Success', 'pending', 1);
      const failProject = createMockProject('proj-fail', 'Fail', 'pending', 1);

      // Make one update fail
      failProject.update.mockRejectedValue(new Error('Update failed'));

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([successProject, failProject]);
            return Promise.resolve([]);
          }),
        })),
      }));

      // Mock: Server accepts batch
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const syncResult = await SyncService.syncUp();

      // Verify partial success
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedRecords).toBe(1); // Only one succeeded
      expect(syncResult.errors).toBeDefined();
      expect(syncResult.errors!.length).toBeGreaterThan(0);
      expect(successProject.update).toHaveBeenCalled();
    });
  });

  describe('Scenario 7: Bidirectional Sync Flow', () => {
    it('should perform full bidirectional sync (pull then push)', async () => {
      // Setup: Local has pending changes
      const localProject = createMockProject('local-proj', 'Local', 'pending', 1);

      // Setup: Server has new records
      const serverProject = {
        id: 'server-proj',
        name: 'Server Project',
        _version: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      (database.collections.get as jest.Mock).mockImplementation((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => {
            if (tableName === 'projects') return Promise.resolve([localProject]);
            return Promise.resolve([]);
          }),
        })),
        find: jest.fn(() => Promise.reject(new Error('Not found'))),
        create: jest.fn(),
      }));

      // Mock: syncDown returns server record
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            changes: {
              projects: [serverProject],
            },
          }),
        })
        // Mock: syncUp accepts local record
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const syncResult = await SyncService.syncAll();

      // Verify bidirectional sync
      expect(syncResult.success).toBe(true);
      expect(syncResult.message).toContain('Pull:');
      expect(syncResult.message).toContain('Push:');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Scenario 8: Empty Sync', () => {
    it('should handle empty sync gracefully (no pending changes)', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      const syncUpResult = await SyncService.syncUp();

      expect(syncUpResult.success).toBe(true);
      expect(syncUpResult.syncedRecords).toBe(0);
      expect(syncUpResult.message).toContain('No pending changes');
    });

    it('should handle empty server response gracefully', async () => {
      (database.collections.get as jest.Mock).mockReturnValue({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
        })),
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ changes: null }),
      });

      const syncDownResult = await SyncService.syncDown();

      expect(syncDownResult.success).toBe(true);
      expect(syncDownResult.syncedRecords).toBe(0);
      expect(syncDownResult.message).toContain('No changes from server');
    });
  });
});
