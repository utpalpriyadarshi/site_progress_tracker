/**
 * BOM-DOORS Linking Service
 *
 * Links BOM items to DOORS packages for integrated requirements tracking
 */

import { database } from '../../models/database';
import BomItemModel from '../../models/BomItemModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';

/**
 * Link BOM items to DOORS packages based on equipment/material matching
 *
 * This function:
 * 1. Finds BOM items that match DOORS equipment (by description/keywords)
 * 2. Updates the doors_id field on those BOM items
 * 3. Enables navigation from Material Tracking to DOORS Detail
 *
 * @param projectId - Project ID to link BOM/DOORS for
 */
export async function linkBomItemsToDoors(projectId: string): Promise<number> {
  console.log('[BomDoorsLinking] Linking BOM items to DOORS packages for project:', projectId);

  let linkedCount = 0;

  await database.write(async () => {
    const bomItemsCollection = database.collections.get<BomItemModel>('bom_items');
    const doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');

    // Get all DOORS packages for this project
    const doorsPackages = await doorsPackagesCollection
      .query(Q.where('project_id', projectId))
      .fetch();

    if (doorsPackages.length === 0) {
      console.log('[BomDoorsLinking] No DOORS packages found for project');
      return;
    }

    // Create mapping of keywords to DOORS IDs
    const doorsMapping = new Map<string, string>();

    doorsPackages.forEach(pkg => {
      // Extract keywords from equipment name for matching
      const keywords = extractKeywords(pkg.equipmentName);
      keywords.forEach(keyword => {
        doorsMapping.set(keyword.toLowerCase(), pkg.doorsId);
      });
    });

    console.log('[BomDoorsLinking] DOORS mapping created:', Object.fromEntries(doorsMapping));

    // Get all BOM items (across all BOMs in this project)
    // Note: We need to get BOMs for this project first, then their items
    const bomsCollection = database.collections.get('boms');
    const boms = await bomsCollection
      .query(Q.where('project_id', projectId))
      .fetch();

    if (boms.length === 0) {
      console.log('[BomDoorsLinking] No BOMs found for project');
      return;
    }

    // Get all BOM items for these BOMs
    for (const bom of boms) {
      const items = await bomItemsCollection
        .query(Q.where('bom_id', bom.id))
        .fetch();

      // Try to match each BOM item to a DOORS package
      for (const item of items) {
        const matchedDoorsId = findMatchingDoors(
          item.description,
          item.itemCode,
          doorsMapping
        );

        if (matchedDoorsId && item.doorsId !== matchedDoorsId) {
          // Update the BOM item with the DOORS link
          await item.update((bomItem) => {
            bomItem.doorsId = matchedDoorsId;
          });
          linkedCount++;
          console.log(`[BomDoorsLinking] Linked "${item.description}" → ${matchedDoorsId}`);
        }
      }
    }
  });

  console.log(`[BomDoorsLinking] Successfully linked ${linkedCount} BOM items to DOORS packages`);
  return linkedCount;
}

/**
 * Extract keywords from equipment name for matching
 */
function extractKeywords(equipmentName: string): string[] {
  const keywords: string[] = [];
  const lower = equipmentName.toLowerCase();

  // Equipment type keywords
  if (lower.includes('transformer')) keywords.push('transformer', 'transf');
  if (lower.includes('circuit breaker') || lower.includes('cb')) keywords.push('circuit breaker', 'cb', 'breaker');
  if (lower.includes('mast')) keywords.push('mast', 'pole');
  if (lower.includes('rtu') || lower.includes('remote terminal')) keywords.push('rtu', 'scada');
  if (lower.includes('cable')) keywords.push('cable', 'power cable');

  // Voltage keywords
  if (lower.includes('33kv') || lower.includes('33 kv')) keywords.push('33kv', '33 kv');
  if (lower.includes('25kv') || lower.includes('25 kv')) keywords.push('25kv', '25 kv');

  // Category keywords
  if (lower.includes('auxiliary') || lower.includes('aux')) keywords.push('auxiliary', 'aux');
  if (lower.includes('ohe')) keywords.push('ohe');
  if (lower.includes('tss')) keywords.push('tss');

  return keywords;
}

/**
 * Find matching DOORS package for a BOM item
 */
function findMatchingDoors(
  description: string,
  itemCode: string,
  doorsMapping: Map<string, string>
): string | null {
  const descLower = description.toLowerCase();
  const codeLower = itemCode.toLowerCase();

  // Check description for keyword matches
  for (const [keyword, doorsId] of doorsMapping.entries()) {
    if (descLower.includes(keyword) || codeLower.includes(keyword)) {
      return doorsId;
    }
  }

  return null;
}

/**
 * Clear all DOORS links from BOM items
 */
export async function clearBomDoorsLinks(projectId: string): Promise<number> {
  console.log('[BomDoorsLinking] Clearing DOORS links from BOM items');

  let clearedCount = 0;

  await database.write(async () => {
    const bomItemsCollection = database.collections.get<BomItemModel>('bom_items');
    const bomsCollection = database.collections.get('boms');

    const boms = await bomsCollection
      .query(Q.where('project_id', projectId))
      .fetch();

    for (const bom of boms) {
      const items = await bomItemsCollection
        .query(
          Q.where('bom_id', bom.id),
          Q.where('doors_id', Q.notEq(null))
        )
        .fetch();

      for (const item of items) {
        await item.update((bomItem) => {
          bomItem.doorsId = undefined;
        });
        clearedCount++;
      }
    }
  });

  console.log(`[BomDoorsLinking] Cleared ${clearedCount} DOORS links`);
  return clearedCount;
}
