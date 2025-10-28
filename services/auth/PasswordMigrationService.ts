import bcrypt from 'react-native-bcrypt';
import { database } from '../../models/database';
import UserModel from '../../models/UserModel';

/**
 * PasswordMigrationService
 *
 * Service for migrating plaintext passwords to bcrypt hashed passwords
 * v2.2 - Activity 1, Day 2
 *
 * This service provides functionality to:
 * - Hash all plaintext passwords with bcrypt
 * - Verify migration success
 * - Rollback capability if needed
 */

const SALT_ROUNDS = 8; // bcrypt salt rounds (mobile optimized: 8-10, provides good security with better performance)

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  duration: number; // milliseconds
}

export interface MigrationVerificationResult {
  success: boolean;
  verifiedCount: number;
  failedCount: number;
  errors: string[];
}

class PasswordMigrationService {
  /**
   * Hash all plaintext passwords in the users table
   *
   * For each user:
   * 1. Read plaintext password
   * 2. Generate bcrypt hash (salt rounds: 12)
   * 3. Store hash in password_hash field
   * 4. Keep plaintext password field (for rollback)
   *
   * @returns MigrationResult with success status and statistics
   */
  async hashAllPasswords(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log('PasswordMigrationService: Starting password migration...');

      // Fetch all users
      const users = await database.collections
        .get<UserModel>('users')
        .query()
        .fetch();

      console.log(`PasswordMigrationService: Found ${users.length} users to migrate`);

      // Hash each user's password
      for (const user of users) {
        try {
          // Skip if already migrated (password_hash exists)
          if (user.passwordHash && user.passwordHash.length > 0) {
            console.log(`PasswordMigrationService: User ${user.username} already migrated, skipping`);
            continue;
          }

          // Read plaintext password
          const plaintextPassword = user.password;

          if (!plaintextPassword || plaintextPassword.length === 0) {
            const error = `User ${user.username} has no password`;
            console.error(`PasswordMigrationService: ${error}`);
            result.errors.push(error);
            result.failedCount++;
            continue;
          }

          console.log(`PasswordMigrationService: Hashing password for user ${user.username}...`);

          // Generate bcrypt hash (using callback-based API for react-native-bcrypt)
          const hash = await new Promise<string>((resolve, reject) => {
            bcrypt.hash(plaintextPassword, SALT_ROUNDS, (err: Error | undefined, hash: string) => {
              if (err) {
                reject(err);
              } else {
                resolve(hash);
              }
            });
          });

          // Store hash in password_hash field
          // user.update already wraps in a write transaction
          await user.update(() => {
            (user as any)._raw.password_hash = hash;
          });

          console.log(`PasswordMigrationService: Successfully migrated user ${user.username}`);
          result.migratedCount++;
        } catch (error) {
          const errorMessage = `Failed to migrate user ${user.username}: ${error}`;
          console.error(`PasswordMigrationService: ${errorMessage}`);
          result.errors.push(errorMessage);
          result.failedCount++;
          result.success = false;
        }
      }

      result.duration = Date.now() - startTime;

      console.log(`PasswordMigrationService: Migration complete in ${result.duration}ms`);
      console.log(`PasswordMigrationService: Migrated: ${result.migratedCount}, Failed: ${result.failedCount}`);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      result.duration = Date.now() - startTime;
      console.error('PasswordMigrationService: Migration failed:', error);
      return result;
    }
  }

  /**
   * Verify that all password hashes match their original plaintext passwords
   *
   * For each user:
   * 1. Read plaintext password
   * 2. Read password_hash
   * 3. Use bcrypt.compare() to verify they match
   *
   * @returns MigrationVerificationResult with verification statistics
   */
  async verifyMigration(): Promise<MigrationVerificationResult> {
    const result: MigrationVerificationResult = {
      success: true,
      verifiedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      console.log('PasswordMigrationService: Starting migration verification...');

      // Fetch all users
      const users = await database.collections
        .get<UserModel>('users')
        .query()
        .fetch();

      console.log(`PasswordMigrationService: Verifying ${users.length} users...`);

      // Verify each user's password hash
      for (const user of users) {
        try {
          const plaintextPassword = user.password;
          const passwordHash = user.passwordHash;

          // Check if both fields exist
          if (!plaintextPassword || plaintextPassword.length === 0) {
            const error = `User ${user.username} has no plaintext password`;
            console.error(`PasswordMigrationService: ${error}`);
            result.errors.push(error);
            result.failedCount++;
            result.success = false;
            continue;
          }

          if (!passwordHash || passwordHash.length === 0) {
            const error = `User ${user.username} has no password hash`;
            console.error(`PasswordMigrationService: ${error}`);
            result.errors.push(error);
            result.failedCount++;
            result.success = false;
            continue;
          }

          // Verify hash matches plaintext (using callback-based API for react-native-bcrypt)
          const isMatch = await new Promise<boolean>((resolve, reject) => {
            bcrypt.compare(plaintextPassword, passwordHash, (err: Error | undefined, result: boolean) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });

          if (isMatch) {
            console.log(`PasswordMigrationService: User ${user.username} verified successfully`);
            result.verifiedCount++;
          } else {
            const error = `User ${user.username} hash does not match plaintext password`;
            console.error(`PasswordMigrationService: ${error}`);
            result.errors.push(error);
            result.failedCount++;
            result.success = false;
          }
        } catch (error) {
          const errorMessage = `Failed to verify user ${user.username}: ${error}`;
          console.error(`PasswordMigrationService: ${errorMessage}`);
          result.errors.push(errorMessage);
          result.failedCount++;
          result.success = false;
        }
      }

      console.log(`PasswordMigrationService: Verification complete`);
      console.log(`PasswordMigrationService: Verified: ${result.verifiedCount}, Failed: ${result.failedCount}`);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Verification failed: ${error}`);
      console.error('PasswordMigrationService: Verification failed:', error);
      return result;
    }
  }

  /**
   * Rollback migration by clearing password_hash fields
   *
   * This allows re-running the migration if needed
   * The plaintext password field is preserved for rollback purposes
   *
   * @returns Success status and count of rolled back users
   */
  async rollbackMigration(): Promise<{ success: boolean; count: number; errors: string[] }> {
    const result = {
      success: true,
      count: 0,
      errors: [] as string[],
    };

    try {
      console.log('PasswordMigrationService: Starting rollback...');

      // Fetch all users with password_hash
      const users = await database.collections
        .get<UserModel>('users')
        .query()
        .fetch();

      console.log(`PasswordMigrationService: Rolling back ${users.length} users...`);

      for (const user of users) {
        try {
          if (user.passwordHash && user.passwordHash.length > 0) {
            await user.update(() => {
              (user as any)._raw.password_hash = '';
            });
            console.log(`PasswordMigrationService: Rolled back user ${user.username}`);
            result.count++;
          }
        } catch (error) {
          const errorMessage = `Failed to rollback user ${user.username}: ${error}`;
          console.error(`PasswordMigrationService: ${errorMessage}`);
          result.errors.push(errorMessage);
          result.success = false;
        }
      }

      console.log(`PasswordMigrationService: Rollback complete. Rolled back ${result.count} users.`);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Rollback failed: ${error}`);
      console.error('PasswordMigrationService: Rollback failed:', error);
      return result;
    }
  }

  /**
   * Get migration status
   *
   * @returns Statistics about migrated vs non-migrated users
   */
  async getMigrationStatus(): Promise<{
    totalUsers: number;
    migratedUsers: number;
    pendingUsers: number;
    percentComplete: number;
  }> {
    try {
      const users = await database.collections
        .get<UserModel>('users')
        .query()
        .fetch();

      const totalUsers = users.length;
      const migratedUsers = users.filter(
        (u) => u.passwordHash && u.passwordHash.length > 0
      ).length;
      const pendingUsers = totalUsers - migratedUsers;
      const percentComplete = totalUsers > 0 ? (migratedUsers / totalUsers) * 100 : 0;

      return {
        totalUsers,
        migratedUsers,
        pendingUsers,
        percentComplete: Math.round(percentComplete),
      };
    } catch (error) {
      console.error('PasswordMigrationService: Failed to get status:', error);
      return {
        totalUsers: 0,
        migratedUsers: 0,
        pendingUsers: 0,
        percentComplete: 0,
      };
    }
  }

  /**
   * Re-hash all passwords with current SALT_ROUNDS setting
   *
   * This is useful when you need to update password hashes with different salt rounds
   * for performance optimization (e.g., reducing from 12 to 8 rounds for mobile)
   *
   * NOTE: This requires knowing the plaintext passwords. If you don't have them,
   * users will need to reset their passwords.
   *
   * @param plaintextPasswords - Map of userId to plaintext password
   * @returns MigrationResult with success status and statistics
   */
  async rehashAllPasswords(plaintextPasswords: Map<string, string>): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log('PasswordMigrationService: Starting password re-hashing...');
      console.log(`PasswordMigrationService: Using SALT_ROUNDS = ${SALT_ROUNDS}`);

      // Fetch all users
      const users = await database.collections
        .get<UserModel>('users')
        .query()
        .fetch();

      console.log(`PasswordMigrationService: Found ${users.length} users to re-hash`);

      // Re-hash each user's password
      for (const user of users) {
        try {
          const plaintextPassword = plaintextPasswords.get(user.id);

          if (!plaintextPassword) {
            const error = `No plaintext password provided for user ${user.username}`;
            console.error(`PasswordMigrationService: ${error}`);
            result.errors.push(error);
            result.failedCount++;
            continue;
          }

          console.log(`PasswordMigrationService: Re-hashing password for user ${user.username}...`);

          // Generate new bcrypt hash with current SALT_ROUNDS
          const hash = await new Promise<string>((resolve, reject) => {
            bcrypt.hash(plaintextPassword, SALT_ROUNDS, (err: Error | undefined, hash: string) => {
              if (err) {
                reject(err);
              } else {
                resolve(hash);
              }
            });
          });

          // Update password hash
          await user.update(() => {
            (user as any)._raw.password_hash = hash;
          });

          console.log(`PasswordMigrationService: Successfully re-hashed user ${user.username}`);
          result.migratedCount++;
        } catch (error) {
          const errorMessage = `Failed to re-hash user ${user.username}: ${error}`;
          console.error(`PasswordMigrationService: ${errorMessage}`);
          result.errors.push(errorMessage);
          result.failedCount++;
          result.success = false;
        }
      }

      result.duration = Date.now() - startTime;

      console.log(`PasswordMigrationService: Re-hashing complete in ${result.duration}ms`);
      console.log(`PasswordMigrationService: Re-hashed: ${result.migratedCount}, Failed: ${result.failedCount}`);

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Re-hashing failed: ${error}`);
      result.duration = Date.now() - startTime;
      console.error('PasswordMigrationService: Re-hashing failed:', error);
      return result;
    }
  }
}

// Export singleton instance
export default new PasswordMigrationService();
