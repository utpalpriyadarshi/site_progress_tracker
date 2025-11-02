/**
 * Test Password Migration Script
 * v2.2 - Activity 1, Day 2
 *
 * This script tests the PasswordMigrationService
 * Run this after the app starts to verify migration works
 */

import PasswordMigrationService from '../services/auth/PasswordMigrationService';

export async function testPasswordMigration() {
  console.log('=== Testing Password Migration ===\n');

  try {
    // Step 1: Get current status
    console.log('Step 1: Getting migration status...');
    const statusBefore = await PasswordMigrationService.getMigrationStatus();
    console.log('Status before migration:', statusBefore);
    console.log('');

    // Step 2: Run migration
    console.log('Step 2: Running password migration...');
    const migrationResult = await PasswordMigrationService.hashAllPasswords();
    console.log('Migration result:', {
      success: migrationResult.success,
      migratedCount: migrationResult.migratedCount,
      failedCount: migrationResult.failedCount,
      duration: `${migrationResult.duration}ms`,
      errors: migrationResult.errors,
    });
    console.log('');

    // Step 3: Verify migration
    console.log('Step 3: Verifying migration...');
    const verificationResult = await PasswordMigrationService.verifyMigration();
    console.log('Verification result:', {
      success: verificationResult.success,
      verifiedCount: verificationResult.verifiedCount,
      failedCount: verificationResult.failedCount,
      errors: verificationResult.errors,
    });
    console.log('');

    // Step 4: Get final status
    console.log('Step 4: Getting final status...');
    const statusAfter = await PasswordMigrationService.getMigrationStatus();
    console.log('Status after migration:', statusAfter);
    console.log('');

    // Summary
    console.log('=== Migration Test Summary ===');
    console.log(`✅ Migration: ${migrationResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Verification: ${verificationResult.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Users migrated: ${migrationResult.migratedCount}`);
    console.log(`✅ Migration time: ${migrationResult.duration}ms`);
    console.log(`✅ Progress: ${statusAfter.percentComplete}% complete`);

    if (migrationResult.errors.length > 0 || verificationResult.errors.length > 0) {
      console.log('\n⚠️  Errors occurred:');
      [...migrationResult.errors, ...verificationResult.errors].forEach((err) => {
        console.log(`  - ${err}`);
      });
    }

    return {
      migrationSuccess: migrationResult.success,
      verificationSuccess: verificationResult.success,
    };
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    return {
      migrationSuccess: false,
      verificationSuccess: false,
    };
  }
}

// For manual testing from React Native Debugger
if (typeof global !== 'undefined') {
  (global as any).testPasswordMigration = testPasswordMigration;
}
