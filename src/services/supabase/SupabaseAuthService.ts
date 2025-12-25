import { supabase } from './supabaseClient';
import { logger } from '../LoggingService';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
  error?: any;
}

class SupabaseAuthService {
  private static instance: SupabaseAuthService;
  private logger = logger;

  private constructor() {
    // Logger already initialized above
  }

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * Send password reset email
   * @param email - User's email address
   * @returns AuthResult with success status and message
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      this.logger.info('Sending password reset email', {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
        email,
      });

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'myapp://reset-password',
      });

      if (error) {
        this.logger.error('Password reset email failed', error, {
          component: 'SupabaseAuthService',
          action: 'sendPasswordResetEmail',
          email,
        });

        return {
          success: false,
          message: 'Failed to send reset email. Please try again.',
          error,
        };
      }

      this.logger.info('Password reset email sent successfully', {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
        email,
      });

      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error) {
      this.logger.error('Unexpected error sending password reset', error as Error, {
        component: 'SupabaseAuthService',
        action: 'sendPasswordResetEmail',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Update user password (after clicking email link)
   * @param newPassword - The new password
   * @returns AuthResult with success status and user data
   */
  async updatePassword(newPassword: string): Promise<AuthResult> {
    try {
      this.logger.info('Updating user password', {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
      });

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        this.logger.error('Password update failed', error, {
          component: 'SupabaseAuthService',
          action: 'updatePassword',
        });

        return {
          success: false,
          message: 'Failed to update password. Please try again.',
          error,
        };
      }

      this.logger.info('Password updated successfully', {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
        userId: data.user?.id,
      });

      return {
        success: true,
        message: 'Password updated successfully.',
        user: data.user,
      };
    } catch (error) {
      this.logger.error('Unexpected error updating password', error as Error, {
        component: 'SupabaseAuthService',
        action: 'updatePassword',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Sign in with email and password
   * @param email - User's email address
   * @param password - User's password
   * @returns AuthResult with success status and user data
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      this.logger.info('Signing in with email', {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
        email,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.error('Sign in failed', error, {
          component: 'SupabaseAuthService',
          action: 'signInWithEmail',
          email,
        });

        return {
          success: false,
          message: 'Invalid email or password.',
          error,
        };
      }

      this.logger.info('Sign in successful', {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
        userId: data.user?.id,
      });

      return {
        success: true,
        message: 'Signed in successfully.',
        user: data.user,
      };
    } catch (error) {
      this.logger.error('Unexpected error signing in', error as Error, {
        component: 'SupabaseAuthService',
        action: 'signInWithEmail',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Sign out current user
   * @returns AuthResult with success status
   */
  async signOut(): Promise<AuthResult> {
    try {
      this.logger.info('Signing out user', {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.logger.error('Sign out failed', error, {
          component: 'SupabaseAuthService',
          action: 'signOut',
        });

        return {
          success: false,
          message: 'Failed to sign out.',
          error,
        };
      }

      this.logger.info('Sign out successful', {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      return {
        success: true,
        message: 'Signed out successfully.',
      };
    } catch (error) {
      this.logger.error('Unexpected error signing out', error as Error, {
        component: 'SupabaseAuthService',
        action: 'signOut',
      });

      return {
        success: false,
        message: 'An unexpected error occurred.',
        error,
      };
    }
  }

  /**
   * Get current session
   * @returns Current session or null
   */
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Get current user
   * @returns Current user or null
   */
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  /**
   * Listen to auth state changes
   * @param callback - Callback function to handle auth state changes
   * @returns Subscription object
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default SupabaseAuthService.getInstance();
