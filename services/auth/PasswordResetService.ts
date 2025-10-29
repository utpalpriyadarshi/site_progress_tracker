import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import bcrypt from 'react-native-bcrypt';
import UserModel from '../../models/UserModel';
import PasswordHistoryModel from '../../models/PasswordHistoryModel';
import { SessionService } from './SessionService';
import {
  validatePasswordStrength,
  isPasswordReused,
  PasswordValidationResult,
} from '../../utils/passwordValidator';

/**
 * PasswordResetService
 *
 * Handles password reset and password change operations
 * v2.2 - Activity 1, Week 3, Day 14
 *
 * Features:
 * - Admin-assisted password reset
 * - User-initiated password change
 * - Password strength validation
 * - Password reuse prevention (last 5 passwords)
 * - Automatic session revocation on password change
 * - Password history tracking
 */

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  details?: string;
}

export interface PasswordValidationCheck {
  isValid: boolean;
  strengthErrors: string[];
  isReused: boolean;
}

export class PasswordResetService {
  /**
   * Get password history for a user
   * Returns the last N password hashes (default: 5)
   *
   * @param userId - User ID
   * @param limit - Number of historical passwords to retrieve (default: 5)
   * @returns Array of password hashes
   */
  static async getPasswordHistory(userId: string, limit: number = 5): Promise<string[]> {
    try {
      const historyRecords = await database.collections
        .get<PasswordHistoryModel>('password_history')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('created_at', Q.desc),
          Q.take(limit)
        )
        .fetch();

      const passwordHashes = historyRecords.map((record) => record.passwordHash);
      console.log(`PasswordResetService: Retrieved ${passwordHashes.length} password history records for user ${userId}`);

      return passwordHashes;
    } catch (error) {
      console.error('PasswordResetService: Error getting password history:', error);
      return [];
    }
  }

  /**
   * Add a password hash to user's password history
   * Called after successful password change
   *
   * @param userId - User ID
   * @param passwordHash - Bcrypt hashed password
   * @returns Success boolean
   */
  static async addPasswordToHistory(userId: string, passwordHash: string): Promise<boolean> {
    try {
      await database.write(async () => {
        await database.collections
          .get<PasswordHistoryModel>('password_history')
          .create((record) => {
            record.userId = userId;
            record.passwordHash = passwordHash;
          });
      });

      console.log(`PasswordResetService: Added password to history for user ${userId}`);
      return true;
    } catch (error) {
      console.error('PasswordResetService: Error adding password to history:', error);
      return false;
    }
  }

  /**
   * Validate a new password against strength rules and password history
   *
   * @param userId - User ID
   * @param newPassword - Plain text new password
   * @returns Validation result with detailed errors
   */
  static async validateNewPassword(
    userId: string,
    newPassword: string
  ): Promise<PasswordValidationCheck> {
    // Check password strength
    const strengthValidation = validatePasswordStrength(newPassword);

    // Get password history (last 5)
    const passwordHistory = await this.getPasswordHistory(userId, 5);

    // Check if password was used before
    const isReused = await isPasswordReused(newPassword, passwordHistory);

    return {
      isValid: strengthValidation.isValid && !isReused,
      strengthErrors: strengthValidation.errors,
      isReused,
    };
  }

  /**
   * Hash a password using bcrypt
   * Helper method for password operations
   *
   * @param password - Plain text password
   * @returns Promise<string> - Bcrypt hashed password
   */
  private static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 12, (err: Error | undefined, hash: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  /**
   * Reset user password (Admin-assisted)
   * Validates new password, stores old hash in history, updates user password
   * Revokes all user sessions to force re-login
   *
   * @param userId - User ID whose password to reset
   * @param newPassword - New plain text password
   * @param adminUserId - Admin user ID performing the reset
   * @returns Reset result with success/error
   */
  static async resetPasswordByAdmin(
    userId: string,
    newPassword: string,
    adminUserId: string
  ): Promise<PasswordResetResult> {
    try {
      console.log(`PasswordResetService: Admin ${adminUserId} resetting password for user ${userId}`);

      // Validate new password
      const validation = await this.validateNewPassword(userId, newPassword);

      if (!validation.isValid) {
        const errorMessages: string[] = [];

        if (validation.strengthErrors.length > 0) {
          errorMessages.push('Password does not meet strength requirements:');
          errorMessages.push(...validation.strengthErrors);
        }

        if (validation.isReused) {
          errorMessages.push('This password has been used recently. Please choose a different password.');
        }

        return {
          success: false,
          error: 'Password validation failed',
          details: errorMessages.join('\n'),
        };
      }

      // Get user
      const user = await database.collections.get<UserModel>('users').find(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Store current password hash in history
      if (user.passwordHash && user.passwordHash.length > 0) {
        await this.addPasswordToHistory(userId, user.passwordHash);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update user's password
      await database.write(async () => {
        await user.update((u) => {
          u.passwordHash = newPasswordHash;
        });
      });

      // Revoke all user sessions (force re-login)
      const revokedCount = await SessionService.revokeAllUserSessions(userId);
      console.log(`PasswordResetService: Revoked ${revokedCount} sessions for user ${userId}`);

      console.log(`PasswordResetService: Password reset successful for user ${userId}`);

      return {
        success: true,
        details: `Password reset successfully. User must login with new password. ${revokedCount} active sessions revoked.`,
      };
    } catch (error) {
      console.error('PasswordResetService: Error resetting password:', error);
      return {
        success: false,
        error: 'Failed to reset password',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Change user password (User-initiated)
   * Verifies current password, validates new password, stores old hash in history
   * Revokes all OTHER sessions (keeps current session active)
   *
   * @param userId - User ID changing password
   * @param currentPassword - Current plain text password (for verification)
   * @param newPassword - New plain text password
   * @param currentSessionId - Current session ID to keep active (optional)
   * @returns Change result with success/error
   */
  static async changePasswordByUser(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string
  ): Promise<PasswordResetResult> {
    try {
      console.log(`PasswordResetService: User ${userId} changing password`);

      // Get user
      const user = await database.collections.get<UserModel>('users').find(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await new Promise<boolean>((resolve) => {
        bcrypt.compare(currentPassword, user.passwordHash, (err: Error | undefined, result: boolean) => {
          if (err) {
            console.error('PasswordResetService: Error verifying current password:', err);
            resolve(false);
          } else {
            resolve(result);
          }
        });
      });

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Validate new password
      const validation = await this.validateNewPassword(userId, newPassword);

      if (!validation.isValid) {
        const errorMessages: string[] = [];

        if (validation.strengthErrors.length > 0) {
          errorMessages.push('Password does not meet strength requirements:');
          errorMessages.push(...validation.strengthErrors);
        }

        if (validation.isReused) {
          errorMessages.push('This password has been used recently. Please choose a different password.');
        }

        return {
          success: false,
          error: 'Password validation failed',
          details: errorMessages.join('\n'),
        };
      }

      // Store current password hash in history
      await this.addPasswordToHistory(userId, user.passwordHash);

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update user's password
      await database.write(async () => {
        await user.update((u) => {
          u.passwordHash = newPasswordHash;
        });
      });

      // Revoke all other sessions (keep current session if provided)
      // For now, revoke all sessions for simplicity
      // TODO: Implement "keep current session" logic
      const revokedCount = await SessionService.revokeAllUserSessions(userId);
      console.log(`PasswordResetService: Revoked ${revokedCount} sessions for user ${userId}`);

      console.log(`PasswordResetService: Password change successful for user ${userId}`);

      return {
        success: true,
        details: `Password changed successfully. Please login again with your new password.`,
      };
    } catch (error) {
      console.error('PasswordResetService: Error changing password:', error);
      return {
        success: false,
        error: 'Failed to change password',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
