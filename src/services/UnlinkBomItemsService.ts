import { database } from '../../models/database';
import BomItemModel from '../../models/BomItemModel';

/**
 * Utility service to unlink BOM items from DOORS packages
 * Used for testing manual linking feature
 */
class UnlinkBomItemsService {
  private bomItemsCollection = database.collections.get<BomItemModel>('bom_items');

  /**
   * Unlink the first N BOM items for testing
   */
  async unlinkFirstNItems(count: number = 5): Promise<void> {
    try {
      const bomItems = await this.bomItemsCollection.query().fetch();
      const itemsToUnlink = bomItems.slice(0, count);

      await database.write(async () => {
        for (const item of itemsToUnlink) {
          await item.update(i => {
            i.doorsId = undefined;
            i.linkType = undefined;
            i.linkedById = undefined;
            i.linkedAt = undefined;
          });
        }
      });

      console.log(`[UnlinkBomItems] Unlinked ${itemsToUnlink.length} BOM items for testing`);
    } catch (error) {
      console.error('[UnlinkBomItems] Error:', error);
      throw error;
    }
  }

  /**
   * Unlink all BOM items
   */
  async unlinkAllItems(): Promise<void> {
    try {
      const bomItems = await this.bomItemsCollection.query().fetch();

      await database.write(async () => {
        for (const item of bomItems) {
          await item.update(i => {
            i.doorsId = undefined;
            i.linkType = undefined;
            i.linkedById = undefined;
            i.linkedAt = undefined;
          });
        }
      });

      console.log(`[UnlinkBomItems] Unlinked all ${bomItems.length} BOM items`);
    } catch (error) {
      console.error('[UnlinkBomItems] Error:', error);
      throw error;
    }
  }
}

export default new UnlinkBomItemsService();
