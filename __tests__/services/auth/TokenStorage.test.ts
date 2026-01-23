/**
 * TokenStorage Tests
 *
 * Tests for token and user info storage in AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import TokenStorage from '../../../services/storage/TokenStorage';

describe('TokenStorage', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const testTokens = {
    accessToken: 'test-access-token-123',
    refreshToken: 'test-refresh-token-456',
    accessTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 minutes
    refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const testUserInfo = {
    userId: 'user-123',
    username: 'testuser',
    role: 'supervisor',
  };

  describe('storeTokens', () => {
    it('should store all tokens successfully', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      // Verify tokens were stored
      const stored = await TokenStorage.getTokens();
      expect(stored).not.toBeNull();
      expect(stored?.accessToken).toBe(testTokens.accessToken);
      expect(stored?.refreshToken).toBe(testTokens.refreshToken);
      expect(stored?.accessTokenExpiry).toBe(testTokens.accessTokenExpiry);
      expect(stored?.refreshTokenExpiry).toBe(testTokens.refreshTokenExpiry);
    });

    it('should overwrite existing tokens', async () => {
      // Store initial tokens
      await TokenStorage.storeTokens(
        'old-access-token',
        'old-refresh-token',
        Date.now(),
        Date.now()
      );

      // Store new tokens
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const stored = await TokenStorage.getTokens();
      expect(stored?.accessToken).toBe(testTokens.accessToken);
      expect(stored?.refreshToken).toBe(testTokens.refreshToken);
    });
  });

  describe('storeUserInfo', () => {
    it('should store user info successfully', async () => {
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      const stored = await TokenStorage.getUserInfo();
      expect(stored).not.toBeNull();
      expect(stored?.userId).toBe(testUserInfo.userId);
      expect(stored?.username).toBe(testUserInfo.username);
      expect(stored?.role).toBe(testUserInfo.role);
    });

    it('should overwrite existing user info', async () => {
      await TokenStorage.storeUserInfo('old-user', 'oldname', 'admin');
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      const stored = await TokenStorage.getUserInfo();
      expect(stored?.userId).toBe(testUserInfo.userId);
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when stored', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const token = await TokenStorage.getAccessToken();
      expect(token).toBe(testTokens.accessToken);
    });

    it('should return null when no token stored', async () => {
      const token = await TokenStorage.getAccessToken();
      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token when stored', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const token = await TokenStorage.getRefreshToken();
      expect(token).toBe(testTokens.refreshToken);
    });

    it('should return null when no token stored', async () => {
      const token = await TokenStorage.getRefreshToken();
      expect(token).toBeNull();
    });
  });

  describe('getTokens', () => {
    it('should return all tokens when stored', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const stored = await TokenStorage.getTokens();
      expect(stored).toEqual(testTokens);
    });

    it('should return null when no tokens stored', async () => {
      const stored = await TokenStorage.getTokens();
      expect(stored).toBeNull();
    });

    it('should return null when only partial tokens stored', async () => {
      // Store only access token
      await AsyncStorage.setItem('@auth/access_token', testTokens.accessToken);

      const stored = await TokenStorage.getTokens();
      expect(stored).toBeNull();
    });
  });

  describe('getUserInfo', () => {
    it('should return user info when stored', async () => {
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      const stored = await TokenStorage.getUserInfo();
      expect(stored).toEqual(testUserInfo);
    });

    it('should return null when no user info stored', async () => {
      const stored = await TokenStorage.getUserInfo();
      expect(stored).toBeNull();
    });

    it('should return null when only partial user info stored', async () => {
      await AsyncStorage.setItem('@auth/user_id', testUserInfo.userId);

      const stored = await TokenStorage.getUserInfo();
      expect(stored).toBeNull();
    });
  });

  describe('updateAccessToken', () => {
    it('should update only the access token', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const newAccessToken = 'new-access-token';
      const newExpiry = Date.now() + 30 * 60 * 1000;

      await TokenStorage.updateAccessToken(newAccessToken, newExpiry);

      const stored = await TokenStorage.getTokens();
      expect(stored?.accessToken).toBe(newAccessToken);
      expect(stored?.accessTokenExpiry).toBe(newExpiry);
      // Refresh token should remain unchanged
      expect(stored?.refreshToken).toBe(testTokens.refreshToken);
      expect(stored?.refreshTokenExpiry).toBe(testTokens.refreshTokenExpiry);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      await TokenStorage.clearTokens();

      const stored = await TokenStorage.getTokens();
      expect(stored).toBeNull();
    });

    it('should not affect user info', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      await TokenStorage.clearTokens();

      const userInfo = await TokenStorage.getUserInfo();
      expect(userInfo).not.toBeNull();
      expect(userInfo?.userId).toBe(testUserInfo.userId);
    });
  });

  describe('clearUserInfo', () => {
    it('should clear user info', async () => {
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      await TokenStorage.clearUserInfo();

      const stored = await TokenStorage.getUserInfo();
      expect(stored).toBeNull();
    });

    it('should not affect tokens', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );

      await TokenStorage.clearUserInfo();

      const tokens = await TokenStorage.getTokens();
      expect(tokens).not.toBeNull();
      expect(tokens?.accessToken).toBe(testTokens.accessToken);
    });
  });

  describe('storeSessionId', () => {
    it('should store session ID', async () => {
      const sessionId = 'session-789';
      await TokenStorage.storeSessionId(sessionId);

      const stored = await TokenStorage.getSessionId();
      expect(stored).toBe(sessionId);
    });
  });

  describe('getSessionId', () => {
    it('should return session ID when stored', async () => {
      const sessionId = 'session-789';
      await TokenStorage.storeSessionId(sessionId);

      const stored = await TokenStorage.getSessionId();
      expect(stored).toBe(sessionId);
    });

    it('should return null when no session ID stored', async () => {
      const stored = await TokenStorage.getSessionId();
      expect(stored).toBeNull();
    });
  });

  describe('clearSessionId', () => {
    it('should clear session ID', async () => {
      await TokenStorage.storeSessionId('session-789');
      await TokenStorage.clearSessionId();

      const stored = await TokenStorage.getSessionId();
      expect(stored).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('should clear tokens, user info, and session ID', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );
      await TokenStorage.storeUserInfo(
        testUserInfo.userId,
        testUserInfo.username,
        testUserInfo.role
      );
      await TokenStorage.storeSessionId('session-789');

      await TokenStorage.clearAll();

      expect(await TokenStorage.getTokens()).toBeNull();
      expect(await TokenStorage.getUserInfo()).toBeNull();
      expect(await TokenStorage.getSessionId()).toBeNull();
    });
  });

  describe('hasTokens', () => {
    it('should return true when both tokens exist', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const hasTokens = await TokenStorage.hasTokens();
      expect(hasTokens).toBe(true);
    });

    it('should return false when no tokens exist', async () => {
      const hasTokens = await TokenStorage.hasTokens();
      expect(hasTokens).toBe(false);
    });

    it('should return false when only access token exists', async () => {
      await AsyncStorage.setItem('@auth/access_token', testTokens.accessToken);

      const hasTokens = await TokenStorage.hasTokens();
      expect(hasTokens).toBe(false);
    });

    it('should return false when only refresh token exists', async () => {
      await AsyncStorage.setItem('@auth/refresh_token', testTokens.refreshToken);

      const hasTokens = await TokenStorage.hasTokens();
      expect(hasTokens).toBe(false);
    });
  });

  describe('getAccessTokenExpiry', () => {
    it('should return expiry when stored', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const expiry = await TokenStorage.getAccessTokenExpiry();
      expect(expiry).toBe(testTokens.accessTokenExpiry);
    });

    it('should return null when not stored', async () => {
      const expiry = await TokenStorage.getAccessTokenExpiry();
      expect(expiry).toBeNull();
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return expiry when stored', async () => {
      await TokenStorage.storeTokens(
        testTokens.accessToken,
        testTokens.refreshToken,
        testTokens.accessTokenExpiry,
        testTokens.refreshTokenExpiry
      );

      const expiry = await TokenStorage.getRefreshTokenExpiry();
      expect(expiry).toBe(testTokens.refreshTokenExpiry);
    });

    it('should return null when not stored', async () => {
      const expiry = await TokenStorage.getRefreshTokenExpiry();
      expect(expiry).toBeNull();
    });
  });
});
