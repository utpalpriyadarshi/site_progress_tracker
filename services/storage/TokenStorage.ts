import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * TokenStorage
 *
 * Service for storing and retrieving JWT tokens in AsyncStorage
 * v2.2 - Activity 1, Week 2, Day 8
 *
 * Security Notes:
 * - AsyncStorage is secure for React Native apps (sandboxed per app)
 * - Tokens are stored encrypted on device
 * - For additional security, consider using react-native-keychain in production
 */

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth/access_token',
  REFRESH_TOKEN: '@auth/refresh_token',
  ACCESS_TOKEN_EXPIRY: '@auth/access_token_expiry',
  REFRESH_TOKEN_EXPIRY: '@auth/refresh_token_expiry',
  USER_ID: '@auth/user_id',
  USERNAME: '@auth/username',
  ROLE: '@auth/role',
} as const;

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

export interface StoredUserInfo {
  userId: string;
  username: string;
  role: string;
}

class TokenStorage {
  /**
   * Store JWT tokens and their expiry times
   *
   * @param accessToken - JWT access token
   * @param refreshToken - JWT refresh token
   * @param accessTokenExpiry - Access token expiry timestamp (ms)
   * @param refreshTokenExpiry - Refresh token expiry timestamp (ms)
   */
  async storeTokens(
    accessToken: string,
    refreshToken: string,
    accessTokenExpiry: number,
    refreshTokenExpiry: number
  ): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry.toString()],
        [STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, refreshTokenExpiry.toString()],
      ]);
      console.log('TokenStorage: Tokens stored successfully');
    } catch (error) {
      console.error('TokenStorage: Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Store user information
   *
   * @param userId - User's database ID
   * @param username - User's username
   * @param role - User's role
   */
  async storeUserInfo(userId: string, username: string, role: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_ID, userId],
        [STORAGE_KEYS.USERNAME, username],
        [STORAGE_KEYS.ROLE, role],
      ]);
      console.log('TokenStorage: User info stored successfully');
    } catch (error) {
      console.error('TokenStorage: Failed to store user info:', error);
      throw new Error('Failed to store user information');
    }
  }

  /**
   * Get access token
   *
   * @returns Access token or null if not found
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return token;
    } catch (error) {
      console.error('TokenStorage: Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   *
   * @returns Refresh token or null if not found
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      return token;
    } catch (error) {
      console.error('TokenStorage: Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Get all stored tokens with expiry times
   *
   * @returns Stored tokens or null if not found
   */
  async getTokens(): Promise<StoredTokens | null> {
    try {
      const keys = [
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
      ];
      const values = await AsyncStorage.multiGet(keys);

      const [accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry] = values.map(
        ([_, value]) => value
      );

      if (!accessToken || !refreshToken || !accessTokenExpiry || !refreshTokenExpiry) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        accessTokenExpiry: parseInt(accessTokenExpiry, 10),
        refreshTokenExpiry: parseInt(refreshTokenExpiry, 10),
      };
    } catch (error) {
      console.error('TokenStorage: Failed to get tokens:', error);
      return null;
    }
  }

  /**
   * Get stored user information
   *
   * @returns Stored user info or null if not found
   */
  async getUserInfo(): Promise<StoredUserInfo | null> {
    try {
      const keys = [STORAGE_KEYS.USER_ID, STORAGE_KEYS.USERNAME, STORAGE_KEYS.ROLE];
      const values = await AsyncStorage.multiGet(keys);

      const [userId, username, role] = values.map(([_, value]) => value);

      if (!userId || !username || !role) {
        return null;
      }

      return { userId, username, role };
    } catch (error) {
      console.error('TokenStorage: Failed to get user info:', error);
      return null;
    }
  }

  /**
   * Update only the access token (used during token refresh)
   *
   * @param accessToken - New JWT access token
   * @param accessTokenExpiry - New access token expiry timestamp (ms)
   */
  async updateAccessToken(accessToken: string, accessTokenExpiry: number): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, accessTokenExpiry.toString()],
      ]);
      console.log('TokenStorage: Access token updated successfully');
    } catch (error) {
      console.error('TokenStorage: Failed to update access token:', error);
      throw new Error('Failed to update access token');
    }
  }

  /**
   * Clear all stored tokens
   *
   * Used during logout
   */
  async clearTokens(): Promise<void> {
    try {
      const keys = [
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.ACCESS_TOKEN_EXPIRY,
        STORAGE_KEYS.REFRESH_TOKEN_EXPIRY,
      ];
      await AsyncStorage.multiRemove(keys);
      console.log('TokenStorage: Tokens cleared successfully');
    } catch (error) {
      console.error('TokenStorage: Failed to clear tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Clear all stored user information
   *
   * Used during logout
   */
  async clearUserInfo(): Promise<void> {
    try {
      const keys = [STORAGE_KEYS.USER_ID, STORAGE_KEYS.USERNAME, STORAGE_KEYS.ROLE];
      await AsyncStorage.multiRemove(keys);
      console.log('TokenStorage: User info cleared successfully');
    } catch (error) {
      console.error('TokenStorage: Failed to clear user info:', error);
      throw new Error('Failed to clear user information');
    }
  }

  /**
   * Clear all authentication data (tokens + user info)
   *
   * Used during logout
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([this.clearTokens(), this.clearUserInfo()]);
      console.log('TokenStorage: All authentication data cleared');
    } catch (error) {
      console.error('TokenStorage: Failed to clear all data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  /**
   * Check if tokens exist in storage
   *
   * @returns True if tokens exist, false otherwise
   */
  async hasTokens(): Promise<boolean> {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      return !!(accessToken && refreshToken);
    } catch (error) {
      console.error('TokenStorage: Failed to check tokens:', error);
      return false;
    }
  }

  /**
   * Get access token expiry time
   *
   * @returns Expiry timestamp (ms) or null if not found
   */
  async getAccessTokenExpiry(): Promise<number | null> {
    try {
      const expiry = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('TokenStorage: Failed to get access token expiry:', error);
      return null;
    }
  }

  /**
   * Get refresh token expiry time
   *
   * @returns Expiry timestamp (ms) or null if not found
   */
  async getRefreshTokenExpiry(): Promise<number | null> {
    try {
      const expiry = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);
      return expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('TokenStorage: Failed to get refresh token expiry:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new TokenStorage();
