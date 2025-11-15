/**
 * Utility to clear all BOMs from database
 * Use this to reset to empty state for testing
 */

import { database } from '../../models/database';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';

export async function clearAllBoms(): Promise<void> {
  try {
    console.log('[ClearBoms] Starting to clear all BOMs...');

    await database.write(async () => {
      // Delete all BOM items
      const itemsCollection = database.collections.get<BomItemModel>('bom_items');
      const allItems = await itemsCollection.query().fetch();

      for (const item of allItems) {
        await item.markAsDeleted();
      }

      console.log(`[ClearBoms] Deleted ${allItems.length} BOM items`);

      // Delete all BOMs
      const bomsCollection = database.collections.get<BomModel>('boms');
      const allBoms = await bomsCollection.query().fetch();

      for (const bom of allBoms) {
        await bom.markAsDeleted();
      }

      console.log(`[ClearBoms] Deleted ${allBoms.length} BOMs`);
    });

    console.log('[ClearBoms] ✅ All BOMs cleared successfully!');
  } catch (error) {
    console.error('[ClearBoms] ❌ Error clearing BOMs:', error);
    throw error;
  }
}
