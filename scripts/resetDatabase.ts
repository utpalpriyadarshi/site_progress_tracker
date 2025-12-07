/**
 * Database Reset Script
 *
 * This script clears all data from the local database and triggers re-initialization.
 * Use this when you need to:
 * - Add new default users (like Design Engineer in v2.11)
 * - Reset test data
 * - Fix database corruption
 *
 * WARNING: This will delete ALL local data!
 */

import { database } from '../models/database';

export async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Get all collections
    const collections = [
      'users',
      'roles',
      'projects',
      'sites',
      'categories',
      'items',
      'reports',
      'materials',
      'material_requests',
      'material_deliveries',
      'suppliers',
      'sessions',
      'milestones',
      'milestone_progress',
      'doors_packages',
      'doors_requirements',
      'rfqs',
      'rfq_vendors',
      'rfq_vendor_quotes',
      'purchase_orders',
      'vendors',
      'boms',
      'bom_items',
      'budgets',
      'costs',
      'invoices',
    ];

    console.log(`📊 Found ${collections.length} collections to clear`);

    // Delete all records from each collection
    for (const collectionName of collections) {
      try {
        const collection = database.collections.get(collectionName);
        const records = await collection.query().fetch();

        if (records.length > 0) {
          await database.write(async () => {
            await database.batch(
              ...records.map((record) => record.prepareDestroyPermanently())
            );
          });
          console.log(`  ✅ Cleared ${records.length} records from ${collectionName}`);
        } else {
          console.log(`  ⏭️  ${collectionName} was already empty`);
        }
      } catch (error) {
        console.log(`  ⚠️  Collection ${collectionName} not found or error: ${error}`);
      }
    }

    console.log('✅ Database reset complete!');
    console.log('');
    console.log('📌 Next steps:');
    console.log('   1. Restart the app');
    console.log('   2. Default data will be re-initialized automatically');
    console.log('   3. You can now login with:');
    console.log('      - admin / Admin@2025');
    console.log('      - supervisor / Supervisor@2025');
    console.log('      - manager / Manager@2025');
    console.log('      - planner / Planner@2025');
    console.log('      - logistics / Logistics@2025');
    console.log('      - designer / Designer@2025 (NEW in v2.11)');
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
