/**
 * Category Names Migration Script
 *
 * This script updates category names in existing databases:
 * - "Finishing" → "Handing Over"
 * - "Framing" → "Punch List"
 *
 * Run this script ONCE if you have existing data in your database.
 *
 * Usage:
 *   import { migrateCategoryNames } from './scripts/migrateCategoryNames';
 *   await migrateCategoryNames();
 */

import { database } from '../models/database';
import { Q } from '@nozbe/watermelondb';
import CategoryModel from '../models/CategoryModel';

interface CategoryUpdate {
  oldName: string;
  newName: string;
  newDescription: string;
}

const CATEGORY_UPDATES: CategoryUpdate[] = [
  {
    oldName: 'Finishing',
    newName: 'Handing Over',
    newDescription: 'Final handover and closeout tasks',
  },
  {
    oldName: 'Framing',
    newName: 'Punch List',
    newDescription: 'Final inspection and defect rectification',
  },
];

export async function migrateCategoryNames(): Promise<void> {
  console.log('🔄 Starting category names migration...');

  try {
    const categoriesCollection = database.collections.get<CategoryModel>('categories');
    let updatedCount = 0;
    let skippedCount = 0;

    for (const update of CATEGORY_UPDATES) {
      console.log(`\n📝 Looking for category: "${update.oldName}"`);

      // Find category by old name
      const categories = await categoriesCollection
        .query(Q.where('name', update.oldName))
        .fetch();

      if (categories.length === 0) {
        console.log(`   ⏭️  Category "${update.oldName}" not found - skipping`);
        skippedCount++;
        continue;
      }

      if (categories.length > 1) {
        console.warn(`   ⚠️  Multiple categories found with name "${update.oldName}"`);
      }

      // Update each matching category
      for (const category of categories) {
        await database.write(async () => {
          await category.update((c: any) => {
            c.name = update.newName;
            c.description = update.newDescription;
          });
        });

        console.log(`   ✅ Updated "${update.oldName}" → "${update.newName}"`);
        updatedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration completed successfully!');
    console.log(`   📊 Categories updated: ${updatedCount}`);
    console.log(`   ⏭️  Categories skipped: ${skippedCount}`);
    console.log('\n📋 Category Display Order:');
    console.log('   Categories will be displayed in the following order:');
    console.log('   1. Foundation Work');
    console.log('   2. Civil Works');
    console.log('   3. MEP (Mechanical, Electrical, Plumbing)');
    console.log('   4. Architectural Finishes');
    console.log('   5. Installation');
    console.log('   6. Testing');
    console.log('   7. Commissioning');
    console.log('   8. Punch List');
    console.log('   9. Handing Over');
    console.log('\n   💡 Ordering handled by: src/utils/categoryOrder.ts');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration by listing all categories
 */
export async function verifyCategoryMigration(): Promise<void> {
  console.log('\n🔍 Verifying categories...\n');

  try {
    const categoriesCollection = database.collections.get<CategoryModel>('categories');
    const allCategories = await categoriesCollection.query().fetch();

    console.log(`Found ${allCategories.length} categories:\n`);

    allCategories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name}`);
      console.log(`   Description: ${category.description}`);
      console.log(`   ID: ${category.id}\n`);
    });

    // Check if old names still exist
    const finishingExists = allCategories.some(c => c.name === 'Finishing');
    const framingExists = allCategories.some(c => c.name === 'Framing');

    if (finishingExists || framingExists) {
      console.log('⚠️  Warning: Old category names still exist:');
      if (finishingExists) console.log('   - "Finishing" should be "Handing Over"');
      if (framingExists) console.log('   - "Framing" should be "Punch List"');
    } else {
      console.log('✅ All categories have been migrated successfully!');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

/**
 * Rollback migration (restore old names)
 * Use this only if you need to revert the changes
 */
export async function rollbackCategoryMigration(): Promise<void> {
  console.log('🔄 Rolling back category names migration...\n');

  const ROLLBACK_UPDATES: CategoryUpdate[] = [
    {
      oldName: 'Handing Over',
      newName: 'Finishing',
      newDescription: 'Finishing and detailing tasks',
    },
    {
      oldName: 'Punch List',
      newName: 'Framing',
      newDescription: 'Structural framing tasks',
    },
  ];

  try {
    const categoriesCollection = database.collections.get<CategoryModel>('categories');
    let rolledBackCount = 0;

    for (const update of ROLLBACK_UPDATES) {
      const categories = await categoriesCollection
        .query(Q.where('name', update.oldName))
        .fetch();

      for (const category of categories) {
        await database.write(async () => {
          await category.update((c: any) => {
            c.name = update.newName;
            c.description = update.newDescription;
          });
        });

        console.log(`✅ Rolled back "${update.oldName}" → "${update.newName}"`);
        rolledBackCount++;
      }
    }

    console.log(`\n✅ Rollback completed! ${rolledBackCount} categories restored.`);
  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
    throw error;
  }
}

// Export all functions
export default {
  migrateCategoryNames,
  verifyCategoryMigration,
  rollbackCategoryMigration,
};
