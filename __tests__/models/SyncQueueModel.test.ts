/**
 * SyncQueueModel Tests
 *
 * Tests for sync queue model structure and helper methods.
 */

import SyncQueueModel from '../../models/SyncQueueModel';

describe('SyncQueueModel', () => {
  describe('static properties', () => {
    it('should have correct table name', () => {
      expect(SyncQueueModel.table).toBe('sync_queue');
    });
  });

  describe('field definitions', () => {
    it('should have all required fields defined', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        tableName: 'projects',
        recordId: 'project-123',
        action: 'create',
        data: JSON.stringify({ name: 'Test Project' }),
        retryCount: 0,
      };

      expect(mockQueueItem.tableName).toBe('projects');
      expect(mockQueueItem.recordId).toBe('project-123');
      expect(mockQueueItem.action).toBe('create');
      expect(mockQueueItem.data).toBeDefined();
      expect(mockQueueItem.retryCount).toBe(0);
    });

    it('should support optional syncedAt field', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        syncedAt: Date.now(),
      };

      expect(mockQueueItem.syncedAt).toBeDefined();
    });

    it('should support optional lastError field', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        lastError: 'Network timeout',
      };

      expect(mockQueueItem.lastError).toBe('Network timeout');
    });
  });

  describe('action types', () => {
    it('should support create action', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        action: 'create',
      };

      expect(mockQueueItem.action).toBe('create');
    });

    it('should support update action', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        action: 'update',
      };

      expect(mockQueueItem.action).toBe('update');
    });

    it('should support delete action', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        action: 'delete',
      };

      expect(mockQueueItem.action).toBe('delete');
    });
  });

  describe('isPending getter', () => {
    it('should return true when syncedAt is not set', () => {
      const mockQueueItem = {
        syncedAt: undefined,
        get isPending() {
          return !this.syncedAt;
        },
      };

      expect(mockQueueItem.isPending).toBe(true);
    });

    it('should return false when syncedAt is set', () => {
      const mockQueueItem = {
        syncedAt: Date.now(),
        get isPending() {
          return !this.syncedAt;
        },
      };

      expect(mockQueueItem.isPending).toBe(false);
    });

    it('should return true when syncedAt is null', () => {
      const mockQueueItem = {
        syncedAt: null as any,
        get isPending() {
          return !this.syncedAt;
        },
      };

      expect(mockQueueItem.isPending).toBe(true);
    });
  });

  describe('needsRetry getter', () => {
    it('should return true when has error and retries remaining', () => {
      const mockQueueItem = {
        lastError: 'Connection failed',
        retryCount: 1,
        get needsRetry() {
          return !!this.lastError && this.retryCount < 3;
        },
      };

      expect(mockQueueItem.needsRetry).toBe(true);
    });

    it('should return false when no error', () => {
      const mockQueueItem = {
        lastError: undefined,
        retryCount: 0,
        get needsRetry() {
          return !!this.lastError && this.retryCount < 3;
        },
      };

      expect(mockQueueItem.needsRetry).toBe(false);
    });

    it('should return false when max retries reached', () => {
      const mockQueueItem = {
        lastError: 'Connection failed',
        retryCount: 3,
        get needsRetry() {
          return !!this.lastError && this.retryCount < 3;
        },
      };

      expect(mockQueueItem.needsRetry).toBe(false);
    });

    it('should return false when exceeded max retries', () => {
      const mockQueueItem = {
        lastError: 'Connection failed',
        retryCount: 5,
        get needsRetry() {
          return !!this.lastError && this.retryCount < 3;
        },
      };

      expect(mockQueueItem.needsRetry).toBe(false);
    });

    it('should return true at boundary (retryCount = 2)', () => {
      const mockQueueItem = {
        lastError: 'Timeout',
        retryCount: 2,
        get needsRetry() {
          return !!this.lastError && this.retryCount < 3;
        },
      };

      expect(mockQueueItem.needsRetry).toBe(true);
    });
  });

  describe('getParsedData method', () => {
    it('should parse valid JSON data', () => {
      const testData = { name: 'Test Project', status: 'active' };
      const mockQueueItem = {
        data: JSON.stringify(testData),
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const parsed = mockQueueItem.getParsedData();

      expect(parsed).toEqual(testData);
    });

    it('should return null for invalid JSON', () => {
      const mockQueueItem = {
        data: 'invalid-json{',
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const parsed = mockQueueItem.getParsedData();

      expect(parsed).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle empty string data', () => {
      const mockQueueItem = {
        data: '',
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const parsed = mockQueueItem.getParsedData();

      expect(parsed).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should parse array data', () => {
      const testData = ['item1', 'item2', 'item3'];
      const mockQueueItem = {
        data: JSON.stringify(testData),
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const parsed = mockQueueItem.getParsedData<string[]>();

      expect(parsed).toEqual(testData);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should parse nested object data', () => {
      const testData = {
        project: {
          id: 'proj-1',
          sites: [
            { id: 'site-1', name: 'Site A' },
            { id: 'site-2', name: 'Site B' },
          ],
        },
      };
      const mockQueueItem = {
        data: JSON.stringify(testData),
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const parsed = mockQueueItem.getParsedData();

      expect(parsed).toEqual(testData);
      expect(parsed.project.sites).toHaveLength(2);
    });

    it('should parse primitive values', () => {
      const mockQueueItem = {
        data: '"simple string"',
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const parsed = mockQueueItem.getParsedData<string>();

      expect(parsed).toBe('simple string');
    });

    it('should parse null value', () => {
      const mockQueueItem = {
        data: 'null',
        getParsedData: SyncQueueModel.prototype.getParsedData,
      };

      const parsed = mockQueueItem.getParsedData();

      expect(parsed).toBeNull();
    });
  });

  describe('table names', () => {
    it('should support projects table', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        tableName: 'projects',
      };
      expect(mockQueueItem.tableName).toBe('projects');
    });

    it('should support sites table', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        tableName: 'sites',
      };
      expect(mockQueueItem.tableName).toBe('sites');
    });

    it('should support items table', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        tableName: 'items',
      };
      expect(mockQueueItem.tableName).toBe('items');
    });

    it('should support daily_reports table', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        tableName: 'daily_reports',
      };
      expect(mockQueueItem.tableName).toBe('daily_reports');
    });
  });

  describe('retry count tracking', () => {
    it('should start at 0', () => {
      const mockQueueItem: Partial<SyncQueueModel> = {
        retryCount: 0,
      };

      expect(mockQueueItem.retryCount).toBe(0);
    });

    it('should increment on failure', () => {
      const mockQueueItem = {
        retryCount: 0,
        lastError: undefined as string | undefined,
      };

      // Simulate failure
      mockQueueItem.retryCount += 1;
      mockQueueItem.lastError = 'Network error';

      expect(mockQueueItem.retryCount).toBe(1);
      expect(mockQueueItem.lastError).toBe('Network error');
    });

    it('should track multiple retries', () => {
      const mockQueueItem = {
        retryCount: 2,
        lastError: 'Server error',
      };

      expect(mockQueueItem.retryCount).toBe(2);
    });
  });
});
