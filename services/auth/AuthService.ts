import bcrypt from 'react-native-bcrypt';
import { database } from '../../models/database';
import UserModel from '../../models/UserModel';
import { Q } from '@nozbe/watermelondb';
import TokenService from './TokenService';
import TokenStorage from '../storage/TokenStorage';

/**
 * AuthService
 *
 * Service for user authentication with JWT tokens
 * v2.2 - Activity 1, Week 2, Day 8
 *
 * Features:
 * - Login with bcrypt password verification
 * - JWT token generation (access + refresh)
 * - Token storage in AsyncStorage
 * - Token refresh logic
 * - Logout with token cleanup
 */

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
  };
  error?: string;
}

export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  accessTokenExpiry?: number;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

class AuthService {
  /**
   * Login with username and password
   *
   * @param username - User's username
   * @param password - User's plaintext password
   * @returns Login result with user data and JWT tokens
   */
  async login(username: string, password: string): Promise<LoginResult> {
    try {
      console.log('AuthService: Starting login for user:', username);

      // Query user from database
      const users = await database.collections
        .get<UserModel>('users')
        .query(Q.where('username', username))
        .fetch();

      if (users.length === 0) {
        console.log('AuthService: User not found');
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      const user = users[0];

      // Verify password with bcrypt
      const isPasswordValid = await new Promise<boolean>((resolve) => {
        bcrypt.compare(password, user.passwordHash, (err: Error | undefined, result: boolean) => {
          if (err) {
            console.error('AuthService: Bcrypt compare error:', err);
            resolve(false);
          } else {
            resolve(result);
          }
        });
      });

      if (!isPasswordValid) {
        console.log('AuthService: Invalid password');
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }

      // Check if user is active
      if (!user.isActive) {
        console.log('AuthService: User account is inactive');
        return {
          success: false,
          error: 'Your account has been deactivated. Please contact an administrator.',
        };
      }

      // Get user's role
      const roleRelation = user.role as any; // WatermelonDB relation type issue
      const role = await roleRelation.fetch();
      if (!role) {
        console.error('AuthService: Unable to fetch user role');
        return {
          success: false,
          error: 'Unable to determine user role',
        };
      }

      console.log('AuthService: Password verified, generating tokens...');

      // Generate JWT tokens
      const tokens = TokenService.generateTokenPair(
        user.id,
        user.username,
        role.name.toLowerCase()
      );

      // Store tokens in AsyncStorage
      await TokenStorage.storeTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.accessTokenExpiry,
        tokens.refreshTokenExpiry
      );

      // Store user info in AsyncStorage
      await TokenStorage.storeUserInfo(user.id, user.username, role.name.toLowerCase());

      console.log('AuthService: Login successful, tokens stored');

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: role.name.toLowerCase(),
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          accessTokenExpiry: tokens.accessTokenExpiry,
          refreshTokenExpiry: tokens.refreshTokenExpiry,
        },
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Current refresh token
   * @returns New access token or error
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    try {
      console.log('AuthService: Refreshing access token...');

      // Verify refresh token
      const verifyResult = TokenService.verifyRefreshToken(refreshToken);

      if (!verifyResult.valid) {
        console.log('AuthService: Invalid refresh token');
        return {
          success: false,
          error: verifyResult.error || 'Invalid refresh token',
        };
      }

      if (!verifyResult.payload) {
        console.log('AuthService: No payload in refresh token');
        return {
          success: false,
          error: 'Invalid token payload',
        };
      }

      // Get user info from token payload
      const { userId } = verifyResult.payload;

      // Fetch user from database to get current role
      const user = await database.collections.get<UserModel>('users').find(userId);
      const roleRelation = user.role as any; // WatermelonDB relation type issue
      const role = await roleRelation.fetch();

      if (!role) {
        console.error('AuthService: Unable to fetch user role');
        return {
          success: false,
          error: 'Unable to determine user role',
        };
      }

      // Generate new access token
      const accessToken = TokenService.generateAccessToken(
        user.id,
        user.username,
        role.name.toLowerCase()
      );

      const accessTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Update access token in storage
      await TokenStorage.updateAccessToken(accessToken, accessTokenExpiry);

      console.log('AuthService: Access token refreshed successfully');

      return {
        success: true,
        accessToken,
        accessTokenExpiry,
      };
    } catch (error) {
      console.error('AuthService: Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh access token',
      };
    }
  }

  /**
   * Logout user and clear all authentication data
   *
   * @returns Logout result
   */
  async logout(): Promise<LogoutResult> {
    try {
      console.log('AuthService: Logging out user...');

      // Clear all tokens and user info from storage
      await TokenStorage.clearAll();

      console.log('AuthService: Logout successful');

      return {
        success: true,
      };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return {
        success: false,
        error: 'Failed to logout',
      };
    }
  }

  /**
   * Check if user is currently authenticated
   *
   * Checks if tokens exist and refresh token is not expired
   *
   * @returns True if authenticated, false otherwise
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await TokenStorage.getTokens();

      if (!tokens) {
        return false;
      }

      // Check if refresh token is expired
      const now = Date.now();
      if (tokens.refreshTokenExpiry < now) {
        console.log('AuthService: Refresh token expired');
        return false;
      }

      return true;
    } catch (error) {
      console.error('AuthService: Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user from storage
   *
   * @returns User info or null if not authenticated
   */
  async getCurrentUser(): Promise<{
    userId: string;
    username: string;
    role: string;
  } | null> {
    try {
      const userInfo = await TokenStorage.getUserInfo();
      return userInfo;
    } catch (error) {
      console.error('AuthService: Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get current access token
   *
   * Automatically refreshes if expired
   *
   * @returns Access token or null if not authenticated
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await TokenStorage.getTokens();

      if (!tokens) {
        return null;
      }

      const now = Date.now();

      // Check if access token is expired
      if (tokens.accessTokenExpiry < now) {
        console.log('AuthService: Access token expired, refreshing...');

        // Try to refresh
        const refreshResult = await this.refreshAccessToken(tokens.refreshToken);

        if (refreshResult.success && refreshResult.accessToken) {
          return refreshResult.accessToken;
        } else {
          console.log('AuthService: Failed to refresh token');
          return null;
        }
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('AuthService: Error getting access token:', error);
      return null;
    }
  }

  /**
   * Restore session from storage
   *
   * Used on app startup to restore authentication state
   *
   * @returns User info and tokens if session exists, null otherwise
   */
  async restoreSession(): Promise<{
    user: { userId: string; username: string; role: string };
    tokens: { accessToken: string; refreshToken: string };
  } | null> {
    try {
      console.log('AuthService: Attempting to restore session...');

      const [tokens, userInfo] = await Promise.all([
        TokenStorage.getTokens(),
        TokenStorage.getUserInfo(),
      ]);

      if (!tokens || !userInfo) {
        console.log('AuthService: No stored session found');
        return null;
      }

      // Check if refresh token is expired
      const now = Date.now();
      if (tokens.refreshTokenExpiry < now) {
        console.log('AuthService: Session expired, clearing storage');
        await TokenStorage.clearAll();
        return null;
      }

      console.log('AuthService: Session restored successfully');

      return {
        user: userInfo,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      console.error('AuthService: Error restoring session:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new AuthService();
