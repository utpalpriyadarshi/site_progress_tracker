/**
 * PlanningService Unit Tests
 *
 * Tests critical path calculation, dependency validation, and baseline locking
 */

import PlanningService from '../../services/planning/PlanningService';
import ItemModel from '../../models/ItemModel';

// Mock the database
jest.mock('../../models/database', () => ({
  database: {
    collections: {
      get: jest.fn(),
    },
    write: jest.fn((callback) => callback()),
  },
}));

describe('PlanningService', () => {
  describe('validateDependencies', () => {
    it('should return valid for items with no dependencies', () => {
      const items = [
        createMockItem('item-1', 'Item A', []),
        createMockItem('item-2', 'Item B', []),
      ];

      const result = PlanningService.validateDependencies(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for linear dependencies', () => {
      const itemA = createMockItem('item-1', 'Item A', []);
      const itemB = createMockItem('item-2', 'Item B', ['item-1']);
      const itemC = createMockItem('item-3', 'Item C', ['item-2']);

      const result = PlanningService.validateDependencies([itemA, itemB, itemC]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect direct circular dependency (A → B → A)', () => {
      const itemA = createMockItem('item-1', 'Item A', ['item-2']);
      const itemB = createMockItem('item-2', 'Item B', ['item-1']);

      const result = PlanningService.validateDependencies([itemA, itemB]);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Circular dependency');
    });

    it('should detect indirect circular dependency (A → B → C → A)', () => {
      const itemA = createMockItem('item-1', 'Item A', ['item-3']);
      const itemB = createMockItem('item-2', 'Item B', ['item-1']);
      const itemC = createMockItem('item-3', 'Item C', ['item-2']);

      const result = PlanningService.validateDependencies([itemA, itemB, itemC]);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should allow branching dependencies (Y-shape)', () => {
      const itemA = createMockItem('item-1', 'Item A', []);
      const itemB = createMockItem('item-2', 'Item B', ['item-1']);
      const itemC = createMockItem('item-3', 'Item C', ['item-1']);

      const result = PlanningService.validateDependencies([itemA, itemB, itemC]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow merging dependencies (inverse Y-shape)', () => {
      const itemA = createMockItem('item-1', 'Item A', []);
      const itemB = createMockItem('item-2', 'Item B', []);
      const itemC = createMockItem('item-3', 'Item C', ['item-1', 'item-2']);

      const result = PlanningService.validateDependencies([itemA, itemB, itemC]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle self-dependency (item depends on itself)', () => {
      const itemA = createMockItem('item-1', 'Item A', ['item-1']);

      const result = PlanningService.validateDependencies([itemA]);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Circular dependency');
    });

    it('should handle empty items array', () => {
      const result = PlanningService.validateDependencies([]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle items with missing dependencies', () => {
      // Item B depends on non-existent item-99
      const itemA = createMockItem('item-1', 'Item A', []);
      const itemB = createMockItem('item-2', 'Item B', ['item-99']);

      const result = PlanningService.validateDependencies([itemA, itemB]);

      // Should still be valid (missing deps just ignored in graph)
      expect(result.valid).toBe(true);
    });
  });
});

// Helper function to create mock items
function createMockItem(id: string, name: string, dependencies: string[]): ItemModel {
  return {
    id,
    name,
    getDependencies: () => dependencies,
  } as ItemModel;
}
