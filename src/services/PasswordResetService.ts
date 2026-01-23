/**
 * Password Reset Service
 *
 * Handles local password reset using WatermelonDB for user storage
 * and Supabase for token storage and email delivery.
 */

import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { supabase } from './supabase/supabaseClient';
import { logger } from './LoggingService';
import bcrypt from 'react-native-bcrypt';
// @ts-ignore - react-native-randombytes has no type declarations
import { randomBytes } from 'react-native-randombytes';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: any;
  resetLink?: string; // For testing - will be removed when email is implemented
}

export interface TokenValidationResult {
  valid: boolean;
  message: string;
  email?: string;
}

class PasswordResetService {
  private static instance: PasswordResetService;

  private constructor() {}

  static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * Hash password using bcrypt
   */
  private hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 8, (err: Error | undefined, hash: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  /**
   * Generate a cryptographically secure random token
   * Uses react-native-randombytes for secure random generation
   */
  private generateToken(): string {
    // Generate 32 bytes (256 bits) of cryptographically secure random data
    const bytes = randomBytes(32);
    // Convert to hex string for URL-safe token
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  /**
   * Check if user exists in WatermelonDB by email
   */
  private async findUserByEmail(email: string): Promise<any | null> {
    try {
      const users = await database.collections
        .get('users')
        .query(Q.where('email', email))
        .fetch();

      if (users.length === 0) {
        return null;
      }

      return users[0];
    } catch (error) {
      logger.error('Error finding user by email', error as Error, {
        component: 'PasswordResetService',
        action: 'findUserByEmail',
        email,
      });
      throw error;
    }
  }

  /**
   * Send password reset request
   * For now, this logs the reset link. Later we'll add email sending via Edge Function.
   */
  async sendPasswordResetRequest(email: string): Promise<PasswordResetResult> {
    try {
      logger.info('Password reset requested', {
        component: 'PasswordResetService',
        action: 'sendPasswordResetRequest',
        email,
      });

      // Step 1: Check if user exists in WatermelonDB
      const user = await this.findUserByEmail(email);
      if (!user) {
        logger.warn('Password reset requested for non-existent email', {
          component: 'PasswordResetService',
          action: 'sendPasswordResetRequest',
          email,
        });

        // Return success even for non-existent emails (security best practice)
        return {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        };
      }

      // Step 2: Generate secure token
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Step 3: Store token in Supabase
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .insert({
          email: email.toLowerCase(),
          token,
          expires_at: expiresAt.toISOString(),
          used: false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to store password reset token', error as Error, {
          component: 'PasswordResetService',
          action: 'sendPasswordResetRequest',
          email,
        });

        return {
          success: false,
          message: 'Failed to create password reset request. Please try again.',
          error,
        };
      }

      // Step 4: Generate reset link
      const resetLink = `myapp://reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      logger.info('Password reset token created', {
        component: 'PasswordResetService',
        action: 'sendPasswordResetRequest',
        email,
        tokenId: data.id,
        expiresAt,
      });

      // Step 4: Send email via Edge Function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-reset-email', {
          body: {
            email: email.toLowerCase(),
            token,
            resetLink,
          },
        });

        if (emailError) {
          logger.error('Failed to send password reset email', emailError as Error, {
            component: 'PasswordResetService',
            action: 'sendPasswordResetRequest',
            email,
          });
          // Don't fail the whole request if email fails
          // Token is still created and valid
        } else {
          logger.info('Password reset email sent successfully', {
            component: 'PasswordResetService',
            action: 'sendPasswordResetRequest',
            email,
            emailId: emailData?.emailId,
          });
        }
      } catch (emailError) {
        logger.error('Error calling email function', emailError as Error, {
          component: 'PasswordResetService',
          action: 'sendPasswordResetRequest',
          email,
        });
        // Continue anyway - token is created
      }

      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link shortly.',
      };
    } catch (error) {
      logger.error('Error sending password reset request', error as Error, {
        component: 'PasswordResetService',
        action: 'sendPasswordResetRequest',
        email,
      });

      return {
        success: false,
        message: 'An error occurred. Please try again.',
        error,
      };
    }
  }

  /**
   * Validate password reset token
   */
  async validateToken(token: string, email: string): Promise<TokenValidationResult> {
    try {
      logger.info('Validating password reset token', {
        component: 'PasswordResetService',
        action: 'validateToken',
        email,
      });

      // Query Supabase for the token
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('email', email.toLowerCase())
        .eq('used', false)
        .single();

      if (error || !data) {
        logger.warn('Invalid or expired token', {
          component: 'PasswordResetService',
          action: 'validateToken',
          email,
          error,
        });

        return {
          valid: false,
          message: 'Invalid or expired reset link.',
        };
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        logger.warn('Expired token used', {
          component: 'PasswordResetService',
          action: 'validateToken',
          email,
          expiresAt,
        });

        return {
          valid: false,
          message: 'This reset link has expired. Please request a new one.',
        };
      }

      logger.info('Token validated successfully', {
        component: 'PasswordResetService',
        action: 'validateToken',
        email,
      });

      return {
        valid: true,
        message: 'Token is valid',
        email: data.email,
      };
    } catch (error) {
      logger.error('Error validating token', error as Error, {
        component: 'PasswordResetService',
        action: 'validateToken',
        email,
      });

      return {
        valid: false,
        message: 'An error occurred while validating the token.',
      };
    }
  }

  /**
   * Reset password - Update password in WatermelonDB and mark token as used
   */
  async resetPassword(
    token: string,
    email: string,
    newPassword: string
  ): Promise<PasswordResetResult> {
    try {
      logger.info('Resetting password', {
        component: 'PasswordResetService',
        action: 'resetPassword',
        email,
      });

      // Step 1: Validate token
      const validation = await this.validateToken(token, email);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
        };
      }

      // Step 2: Find user in WatermelonDB
      const user = await this.findUserByEmail(email);
      if (!user) {
        logger.warn('User not found during password reset', {
          component: 'PasswordResetService',
          action: 'resetPassword',
          email,
        });

        return {
          success: false,
          message: 'User not found.',
        };
      }

      // Step 3: Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Step 4: Update password in WatermelonDB
      await database.write(async () => {
        await user.update((u: any) => {
          u.passwordHash = hashedPassword;
        });
      });

      logger.info('Password updated in database', {
        component: 'PasswordResetService',
        action: 'resetPassword',
        email,
        userId: user.id,
      });

      // Step 5: Mark token as used in Supabase
      const { error: updateError } = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token)
        .eq('email', email.toLowerCase());

      if (updateError) {
        logger.warn('Failed to mark token as used', {
          component: 'PasswordResetService',
          action: 'resetPassword',
          email,
          error: updateError.message,
        });
        // Continue anyway - password was updated successfully
      }

      logger.info('Password reset completed successfully', {
        component: 'PasswordResetService',
        action: 'resetPassword',
        email,
      });

      return {
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
      };
    } catch (error) {
      logger.error('Error resetting password', error as Error, {
        component: 'PasswordResetService',
        action: 'resetPassword',
        email,
      });

      return {
        success: false,
        message: 'An error occurred while resetting your password. Please try again.',
        error,
      };
    }
  }

  /**
   * Reset password by admin - Direct password reset without token
   * Used by admin role management screen
   */
  async resetPasswordByAdmin(
    userId: string,
    newPassword: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string; details?: string }> {
    try {
      logger.info('Admin resetting password', {
        component: 'PasswordResetService',
        action: 'resetPasswordByAdmin',
        userId,
        adminUserId,
      });

      // Step 1: Find user in WatermelonDB
      const user = await database.collections
        .get('users')
        .find(userId);

      if (!user) {
        logger.warn('User not found during admin password reset', {
          component: 'PasswordResetService',
          action: 'resetPasswordByAdmin',
          userId,
        });

        return {
          success: false,
          error: 'User not found.',
        };
      }

      // Step 2: Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Step 3: Update password in WatermelonDB
      await database.write(async () => {
        await user.update((u: any) => {
          u.passwordHash = hashedPassword;
        });
      });

      logger.info('Admin password reset completed successfully', {
        component: 'PasswordResetService',
        action: 'resetPasswordByAdmin',
        userId,
        adminUserId,
      });

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Error in admin password reset', error as Error, {
        component: 'PasswordResetService',
        action: 'resetPasswordByAdmin',
        userId,
      });

      return {
        success: false,
        error: 'An error occurred while resetting the password.',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export default PasswordResetService.getInstance();
