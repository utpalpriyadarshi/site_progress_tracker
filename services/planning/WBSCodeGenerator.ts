import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import { Q } from '@nozbe/watermelondb';

export class WBSCodeGenerator {
  /**
   * Generate next available WBS code at the same level as parent
   * @param siteId Site ID
   * @param parentWbsCode Parent WBS code (e.g., "1.2.0.0")
   * @returns Next available WBS code (e.g., "1.2.1.0")
   */
  static async generateChildCode(
    siteId: string,
    parentWbsCode: string
  ): Promise<string> {
    // Parse parent code
    const parentParts = parentWbsCode.split('.').map(Number);
    const parentLevel = parentParts.filter(p => p > 0).length;

    // Find all children of this parent
    const children = await database.collections
      .get<ItemModel>('items')
      .query(
        Q.where('site_id', siteId),
        Q.where('parent_wbs_code', parentWbsCode)
      )
      .fetch();

    // Find max child number
    let maxChildNumber = 0;
    children.forEach(child => {
      const childParts = child.wbsCode.split('.').map(Number);
      const childNumber = childParts[parentLevel]; // Get number at child level
      if (childNumber > maxChildNumber) {
        maxChildNumber = childNumber;
      }
    });

    // Generate next code
    const newParts = [...parentParts];
    newParts[parentLevel] = maxChildNumber + 1;

    return newParts.join('.');
  }

  /**
   * Generate next available sibling code
   * @param siteId Site ID
   * @param siblingWbsCode Sibling WBS code (e.g., "1.2.0.0")
   * @returns Next available sibling code (e.g., "1.3.0.0")
   */
  static async generateSiblingCode(
    siteId: string,
    siblingWbsCode: string
  ): Promise<string> {
    const siblingParts = siblingWbsCode.split('.').map(Number);
    const level = siblingParts.filter(p => p > 0).length;

    // Get parent code
    const parentParts = [...siblingParts];
    parentParts[level - 1] = 0;
    const parentWbsCode = parentParts.join('.');

    // Use generateChildCode logic
    return this.generateChildCode(siteId, parentWbsCode);
  }

  /**
   * Generate first code at root level
   * @param siteId Site ID
   * @returns First root-level code (e.g., "1.0.0.0")
   */
  static async generateRootCode(siteId: string): Promise<string> {
    // Find all root-level items (level 1)
    const rootItems = await database.collections
      .get<ItemModel>('items')
      .query(Q.where('site_id', siteId), Q.where('wbs_level', 1))
      .fetch();

    // Find max first number
    let maxRootNumber = 0;
    rootItems.forEach(item => {
      const parts = item.wbsCode.split('.').map(Number);
      if (parts[0] > maxRootNumber) {
        maxRootNumber = parts[0];
      }
    });

    return `${maxRootNumber + 1}.0.0.0`;
  }

  /**
   * Validate WBS code uniqueness
   * @param siteId Site ID
   * @param wbsCode WBS code to validate
   * @param excludeItemId Exclude this item ID (for editing)
   * @returns true if code is unique
   */
  static async isCodeUnique(
    siteId: string,
    wbsCode: string,
    excludeItemId?: string
  ): Promise<boolean> {
    const query = [
      Q.where('site_id', siteId),
      Q.where('wbs_code', wbsCode),
    ];

    if (excludeItemId) {
      query.push(Q.where('id', Q.notEq(excludeItemId)));
    }

    const existing = await database.collections
      .get<ItemModel>('items')
      .query(...query)
      .fetch();

    return existing.length === 0;
  }

  /**
   * Calculate WBS level from code
   * @param wbsCode WBS code (e.g., "1.2.3.0")
   * @returns Level (1-4)
   */
  static calculateLevel(wbsCode: string): number {
    const parts = wbsCode.split('.').map(Number);
    return parts.filter(p => p > 0).length;
  }

  /**
   * Get parent code from child code
   * @param wbsCode Child WBS code (e.g., "1.2.3.4")
   * @returns Parent WBS code (e.g., "1.2.3.0")
   */
  static getParentCode(wbsCode: string): string | null {
    const parts = wbsCode.split('.').map(Number);
    const level = parts.filter(p => p > 0).length;

    if (level <= 1) return null; // Root has no parent

    const parentParts = [...parts];
    parentParts[level - 1] = 0;

    return parentParts.join('.');
  }
}
