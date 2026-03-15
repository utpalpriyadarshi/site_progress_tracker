/**
 * WBS Progress Rollup
 *
 * When a child WBS item's progress changes, this utility propagates
 * the change upward through all ancestor levels.
 *
 * Algorithm (bottom-up, iterative):
 *   1. Fetch all items for the site into an in-memory map
 *   2. Find the max wbsLevel present
 *   3. For each level from max down to 2:
 *      - For every item at that level, locate its parent
 *      - Parent's completedQuantity = sum of all direct children's completedQuantity
 *      - Parent's plannedQuantity   = sum of all direct children's plannedQuantity
 *      - Parent's status            = derived from the new quantities
 *      - Update the in-memory map immediately so the next level up sees
 *        the already-rolled-up value
 *   4. Persist all changed parents in a single database.write()
 */

import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../../models/ItemModel';

function deriveStatus(completedQty: number, plannedQty: number): string {
  if (plannedQty === 0 || completedQty === 0) return 'not_started';
  if (completedQty >= plannedQty) return 'completed';
  return 'in_progress';
}

export async function rollupSiteWBSProgress(
  siteId: string,
  db: Database,
): Promise<void> {
  // Fetch all items for this site
  const allItems = await db.collections
    .get<ItemModel>('items')
    .query(Q.where('site_id', siteId))
    .fetch();

  if (allItems.length === 0) return;

  // In-memory snapshot: wbsCode → { completedQuantity, plannedQuantity }
  // We mutate this as we roll up so each level sees correct child values.
  const snapshot = new Map<string, { completed: number; planned: number }>();
  for (const item of allItems) {
    snapshot.set(item.wbsCode, {
      completed: item.completedQuantity,
      planned: item.plannedQuantity,
    });
  }

  // Build children map: parentWbsCode → child items
  const childrenOf = new Map<string, ItemModel[]>();
  for (const item of allItems) {
    if (!item.parentWbsCode) continue;
    const siblings = childrenOf.get(item.parentWbsCode) ?? [];
    siblings.push(item);
    childrenOf.set(item.parentWbsCode, siblings);
  }

  // Find unique levels and sort descending (deepest first)
  const levels = [...new Set(allItems.map(i => i.wbsLevel))].sort((a, b) => b - a);

  // Track which parent items need DB updates
  const toUpdate = new Map<string, { item: ItemModel; completed: number; planned: number }>();

  for (const level of levels) {
    if (level < 2) continue; // level-1 items have no parent

    const itemsAtLevel = allItems.filter(i => i.wbsLevel === level);

    for (const child of itemsAtLevel) {
      if (!child.parentWbsCode) continue;

      // Find the parent item object
      const parent = allItems.find(i => i.wbsCode === child.parentWbsCode);
      if (!parent) continue;

      // Sum all direct children of this parent using current snapshot values
      const siblings = childrenOf.get(parent.wbsCode) ?? [];
      if (siblings.length === 0) continue;

      const totalCompleted = siblings.reduce((sum, s) => {
        return sum + (snapshot.get(s.wbsCode)?.completed ?? s.completedQuantity);
      }, 0);
      const totalPlanned = siblings.reduce((sum, s) => {
        return sum + (snapshot.get(s.wbsCode)?.planned ?? s.plannedQuantity);
      }, 0);

      // Update snapshot so the grandparent level sees the rolled-up value
      snapshot.set(parent.wbsCode, { completed: totalCompleted, planned: totalPlanned });

      // Only queue a DB write if the values actually changed
      const changed =
        parent.completedQuantity !== totalCompleted ||
        parent.plannedQuantity !== totalPlanned;

      if (changed) {
        toUpdate.set(parent.wbsCode, {
          item: parent,
          completed: totalCompleted,
          planned: totalPlanned,
        });
      }
    }
  }

  if (toUpdate.size === 0) return;

  // Persist all parent updates in a single write transaction
  await db.write(async () => {
    for (const { item, completed, planned } of toUpdate.values()) {
      await item.update((p: any) => {
        p.completedQuantity = completed;
        p.plannedQuantity = planned;
        p.status = deriveStatus(completed, planned);
      });
    }
  });
}
