/**
 * BomDataService
 *
 * Service for loading and managing BOM data
 * Supports both database BOMs and mock data for testing
 */

import { database } from '../../models/database';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import { Q } from '@nozbe/watermelondb';
import { mockBOMs, MockBOM, MockBOMItem } from '../data/mockBOMs';
import { AppMode } from '../config/AppMode';

export interface BomDataOptions {
  projectId?: string;
  useMockData?: boolean;
  status?: string[];
}

class BomDataServiceClass {
  /**
   * Get BOMs for a project
   * Behavior depends on app mode:
   * - Demo Mode: Returns empty array if no BOMs (user must click "Load Sample BOMs")
   * - Production Mode: Auto-loads BOMs from database (created by Project Manager)
   */
  async getBoms(options: BomDataOptions = {}): Promise<BomModel[]> {
    const { projectId, useMockData = false, status = ['active', 'baseline'] } = options;

    try {
      const bomsCollection = database.collections.get<BomModel>('boms');

      // Build query
      let query = bomsCollection.query();

      if (projectId) {
        query = bomsCollection.query(
          Q.where('project_id', projectId),
          Q.where('status', Q.oneOf(status))
        );
      } else {
        query = bomsCollection.query(Q.where('status', Q.oneOf(status)));
      }

      const bomsList = await query.fetch();

      // Mode-based behavior
      const mode = AppMode.getMode();

      if (bomsList.length === 0) {
        if (mode === 'demo') {
          // Demo Mode: Don't auto-load, show empty state with button
          console.log('[BomDataService] Demo Mode - No BOMs found, showing empty state');
          return [];
        } else if (mode === 'production' && useMockData) {
          // Production Mode: If explicitly requested and no real BOMs exist,
          // this shouldn't normally happen (PM should create BOMs)
          console.log('[BomDataService] Production Mode - No BOMs found for project');
          return [];
        }
      }

      console.log(`[BomDataService] Loaded ${bomsList.length} BOMs for project ${projectId || 'all'}`);
      return bomsList;
    } catch (error) {
      console.error('[BomDataService] Error loading BOMs:', error);
      return [];
    }
  }

  /**
   * Get BOM items for specific BOMs
   */
  async getBomItems(bomIds: string[]): Promise<BomItemModel[]> {
    if (bomIds.length === 0) return [];

    try {
      const itemsCollection = database.collections.get<BomItemModel>('bom_items');

      const items = await itemsCollection
        .query(Q.where('bom_id', Q.oneOf(bomIds)))
        .fetch();

      return items;
    } catch (error) {
      console.error('[BomDataService] Error loading BOM items:', error);
      return [];
    }
  }

  /**
   * Load mock BOMs into database for testing
   * This creates actual database records from mock data
   */
  async loadMockBoms(projectId?: string): Promise<BomModel[]> {
    try {
      // Use all mock BOMs if projectId is specified (override projectId during creation)
      // If no projectId specified, use mock BOMs as-is
      const filteredMockBoms = mockBOMs;

      if (filteredMockBoms.length === 0) {
        console.log('[BomDataService] No mock BOMs available');
        return [];
      }

      // Check if mock BOMs already exist in database for this project
      const bomsCollection = database.collections.get<BomModel>('boms');

      // If projectId is specified, check if BOMs exist for this project
      // Otherwise check by mock BOM IDs
      let existingBoms: BomModel[];
      if (projectId) {
        existingBoms = await bomsCollection
          .query(Q.where('project_id', projectId))
          .fetch();
      } else {
        existingBoms = await bomsCollection
          .query(Q.where('id', Q.oneOf(filteredMockBoms.map(b => b.id))))
          .fetch();
      }

      if (existingBoms.length > 0) {
        console.log(`[BomDataService] BOMs already exist in database (${existingBoms.length} BOMs)`);
        return existingBoms;
      }

      // Create BOMs in database
      const createdBoms: BomModel[] = [];

      await database.write(async () => {
        const baseTimestamp = Date.now();

        for (let i = 0; i < filteredMockBoms.length; i++) {
          const mockBom = filteredMockBoms[i];

          // Generate unique IDs if projectId is specified (to avoid ID conflicts)
          // Use baseTimestamp + index to ensure uniqueness
          const bomId = projectId
            ? `bom_${projectId}_${baseTimestamp + i}`
            : mockBom.id;

          // Create BOM
          const bom = await bomsCollection.create((b: BomModel) => {
            b._raw.id = bomId;
            b.projectId = projectId || mockBom.projectId; // Use provided projectId or mock projectId
            b.name = mockBom.name;
            b.type = mockBom.type;
            b.status = mockBom.status;
            b.version = mockBom.version;
            b.quantity = mockBom.quantity;
            b.unit = mockBom.unit;
            b.description = mockBom.description || '';
            b.totalEstimatedCost = mockBom.totalEstimatedCost;
            b.totalActualCost = mockBom.totalActualCost;
            b.contingency = mockBom.contingency;
            b.profitMargin = mockBom.profitMargin;
            b.createdBy = mockBom.createdBy;
            b.createdDate = mockBom.createdDate;
            b.updatedDate = mockBom.updatedDate;
            b.appSyncStatus = mockBom.syncStatus;
            b._version = mockBom._version;
          });

          createdBoms.push(bom);

          // Create BOM items
          const itemsCollection = database.collections.get<BomItemModel>('bom_items');

          for (let j = 0; j < mockBom.items.length; j++) {
            const mockItem = mockBom.items[j];

            // Generate unique IDs for items if projectId is specified
            // Use baseTimestamp with multiple indices for uniqueness
            const itemId = projectId
              ? `bom_item_${projectId}_${baseTimestamp}_${i}_${j}`
              : mockItem.id;

            await itemsCollection.create((item: BomItemModel) => {
              item._raw.id = itemId;
              item.bomId = bomId; // Use the generated bomId
              item.itemCode = mockItem.itemCode;
              item.description = mockItem.description;
              item.category = mockItem.category;
              item.subCategory = mockItem.subCategory;
              item.quantity = mockItem.quantity;
              item.unit = mockItem.unit;
              item.unitCost = mockItem.unitCost;
              item.totalCost = mockItem.totalCost;
              item.wbsCode = mockItem.wbsCode;
              item.phase = mockItem.phase;
              item.notes = mockItem.notes;
              item.createdDate = mockItem.createdDate;
              item.updatedDate = mockItem.updatedDate;
              item.appSyncStatus = mockItem.syncStatus;
              item._version = mockItem._version;
            });
          }
        }
      });

      console.log(`[BomDataService] Created ${createdBoms.length} mock BOMs in database for project ${projectId || 'default'}`);
      return createdBoms;
    } catch (error) {
      console.error('[BomDataService] Error loading mock BOMs:', error);
      return [];
    }
  }

  /**
   * Clear all mock BOMs from database
   * Useful for resetting test data
   */
  async clearMockBoms(): Promise<void> {
    try {
      const bomsCollection = database.collections.get<BomModel>('boms');
      const mockBomIds = mockBOMs.map(b => b.id);

      const bomsToDelete = await bomsCollection
        .query(Q.where('id', Q.oneOf(mockBomIds)))
        .fetch();

      await database.write(async () => {
        for (const bom of bomsToDelete) {
          await bom.markAsDeleted();
        }
      });

      // Also delete BOM items
      const itemsCollection = database.collections.get<BomItemModel>('bom_items');
      const mockItemIds = mockBOMs.flatMap(b => b.items.map(i => i.id));

      const itemsToDelete = await itemsCollection
        .query(Q.where('id', Q.oneOf(mockItemIds)))
        .fetch();

      await database.write(async () => {
        for (const item of itemsToDelete) {
          await item.markAsDeleted();
        }
      });

      console.log('[BomDataService] Cleared mock BOMs from database');
    } catch (error) {
      console.error('[BomDataService] Error clearing mock BOMs:', error);
    }
  }

  /**
   * Check if database has any BOMs
   */
  async hasBoms(): Promise<boolean> {
    try {
      const bomsCollection = database.collections.get<BomModel>('boms');
      const count = await bomsCollection.query().fetchCount();
      return count > 0;
    } catch (error) {
      console.error('[BomDataService] Error checking BOM count:', error);
      return false;
    }
  }

  /**
   * Get mock BOM data without creating database records
   * Useful for preview/testing
   */
  getMockBOMsData(projectId?: string): MockBOM[] {
    if (projectId) {
      return mockBOMs.filter(bom => bom.projectId === projectId);
    }
    return mockBOMs;
  }

  /**
   * Get statistics about BOMs
   */
  async getBomStats(projectId?: string) {
    try {
      const boms = await this.getBoms({ projectId, useMockData: true });
      const bomIds = boms.map(b => b.id);
      const items = await this.getBomItems(bomIds);

      const totalEstimatedCost = boms.reduce((sum, bom) => sum + bom.totalEstimatedCost, 0);
      const totalActualCost = boms.reduce((sum, bom) => sum + bom.totalActualCost, 0);

      // Count items by category
      const categoryCount = items.reduce((acc, item) => {
        const cat = item.subCategory || 'Unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalBOMs: boms.length,
        activeBOMs: boms.filter(b => b.status === 'active').length,
        baselineBOMs: boms.filter(b => b.status === 'baseline').length,
        totalItems: items.length,
        totalEstimatedCost,
        totalActualCost,
        categoryCount,
      };
    } catch (error) {
      console.error('[BomDataService] Error getting BOM stats:', error);
      return {
        totalBOMs: 0,
        activeBOMs: 0,
        baselineBOMs: 0,
        totalItems: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0,
        categoryCount: {},
      };
    }
  }
}

export const BomDataService = new BomDataServiceClass();
