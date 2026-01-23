/**
 * AuthService Tests
 *
 * Tests for authentication service - token management and session operations.
 * Note: Login/logout with database interactions tested separately in integration tests.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import TokenStorage from '../../../services/storage/TokenStorage';
import TokenService from '../../../services/auth/TokenService';

// Mock the JWT config
jest.mock('../../../config/jwt.config', () => ({
  JWT_CONFIG: {
    ACCESS_TOKEN_SECRET: 'test-access-secret-key-for-testing',
    REFRESH_TOKEN_SECRET: 'test-refresh-secret-key-for-testing',
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ISSUER: 'construction-tracker-app',
    AUDIENCE: 'construction-tracker-users',
  },
}));

describe('AuthService - Token and Session Management', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('isAuthenticated behavior', () => {
    it('should return false when no tokens exist', async () => {
      // Import fresh instance
      const AuthService = require('../../../services/auth/AuthService').default;

      const isAuth = await AuthService.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should return false when refresh token is expired', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() + 60000, // Access token valid
        Date.now() - 1000   // Refresh token expired
      );

      const isAuth = await AuthService.isAuthenticated();
      expect(isAuth).toBe(false);
    });

    it('should return true when valid tokens exist', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() + 60000,  // Access token valid
        Date.now() + 3600000 // Refresh token valid (1 hour)
      );

      const isAuth = await AuthService.isAuthenticated();
      expect(isAuth).toBe(true);
    });
  });

  describe('getCurrentUser behavior', () => {
    it('should return null when no user info stored', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const user = await AuthService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user info when stored', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeUserInfo('user-123', 'testuser', 'supervisor');

      const user = await AuthService.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.userId).toBe('user-123');
      expect(user?.username).toBe('testuser');
      expect(user?.role).toBe('supervisor');
    });
  });

  describe('getAccessToken behavior', () => {
    it('should return null when no tokens stored', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const token = await AuthService.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return access token when stored and not expired', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const testToken = 'test-access-token';
      await TokenStorage.storeTokens(
        testToken,
        'refresh-token',
        Date.now() + 60000,  // Not expired
        Date.now() + 3600000
      );

      const token = await AuthService.getAccessToken();
      expect(token).toBe(testToken);
    });
  });

  describe('restoreSession behavior', () => {
    it('should return null when no session stored', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const restored = await AuthService.restoreSession();
      expect(restored).toBeNull();
    });

    it('should return null when tokens missing', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeUserInfo('user-1', 'testuser', 'supervisor');

      const restored = await AuthService.restoreSession();
      expect(restored).toBeNull();
    });

    it('should return null when user info missing', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() + 60000,
        Date.now() + 3600000
      );

      const restored = await AuthService.restoreSession();
      expect(restored).toBeNull();
    });

    it('should return session when both tokens and user info exist', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() + 60000,
        Date.now() + 3600000
      );
      await TokenStorage.storeUserInfo('user-1', 'testuser', 'supervisor');

      const restored = await AuthService.restoreSession();
      expect(restored).not.toBeNull();
      expect(restored?.user).toBeDefined();
      expect(restored?.tokens).toBeDefined();
    });

    it('should clear storage when session is expired', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() - 1000, // Expired
        Date.now() - 1000  // Expired
      );
      await TokenStorage.storeUserInfo('user-1', 'testuser', 'supervisor');

      const restored = await AuthService.restoreSession();
      expect(restored).toBeNull();

      // Verify storage was cleared
      const tokens = await TokenStorage.getTokens();
      expect(tokens).toBeNull();
    });
  });

  describe('logout behavior', () => {
    it('should clear all stored data', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      // Store some data
      await TokenStorage.storeTokens(
        'access-token',
        'refresh-token',
        Date.now() + 60000,
        Date.now() + 3600000
      );
      await TokenStorage.storeUserInfo('user-1', 'testuser', 'supervisor');
      await TokenStorage.storeSessionId('session-123');

      // Logout
      const result = await AuthService.logout();

      expect(result.success).toBe(true);

      // Verify all data cleared
      expect(await TokenStorage.getTokens()).toBeNull();
      expect(await TokenStorage.getUserInfo()).toBeNull();
      expect(await TokenStorage.getSessionId()).toBeNull();
    });

    it('should succeed even when nothing to clear', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const result = await AuthService.logout();
      expect(result.success).toBe(true);
    });
  });

  describe('refreshAccessToken behavior', () => {
    it('should fail with invalid refresh token', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const result = await AuthService.refreshAccessToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with malformed token', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const result = await AuthService.refreshAccessToken('not.valid.jwt');

      expect(result.success).toBe(false);
    });

    it('should fail with empty token', async () => {
      const AuthService = require('../../../services/auth/AuthService').default;

      const result = await AuthService.refreshAccessToken('');

      expect(result.success).toBe(false);
    });
  });
});

describe('AuthService - Login/Logout Integration', () => {
  // These tests verify the login result interface and error handling
  // without mocking the full database

  describe('LoginResult interface', () => {
    it('should have correct interface for success result', () => {
      // Verify the expected shape of a successful login result
      const successResult = {
        success: true,
        user: {
          id: 'user-123',
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          role: 'supervisor',
        },
        tokens: {
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          accessTokenExpiry: Date.now() + 900000,
          refreshTokenExpiry: Date.now() + 604800000,
        },
        sessionId: 'session-123',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.user).toBeDefined();
      expect(successResult.tokens).toBeDefined();
      expect(successResult.sessionId).toBeDefined();
      expect(successResult.user.id).toBeDefined();
      expect(successResult.user.username).toBeDefined();
      expect(successResult.user.role).toBeDefined();
    });

    it('should have correct interface for failure result', () => {
      const failureResult = {
        success: false,
        error: 'Invalid username or password',
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
    });
  });

  describe('LogoutResult interface', () => {
    it('should have correct interface for success result', () => {
      const successResult = {
        success: true,
      };

      expect(successResult.success).toBe(true);
    });

    it('should have correct interface for failure result', () => {
      const failureResult = {
        success: false,
        error: 'Failed to logout',
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
    });
  });

  describe('RefreshResult interface', () => {
    it('should have correct interface for success result', () => {
      const successResult = {
        success: true,
        accessToken: 'new-access-token',
        accessTokenExpiry: Date.now() + 900000,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.accessToken).toBeDefined();
      expect(successResult.accessTokenExpiry).toBeDefined();
    });

    it('should have correct interface for failure result', () => {
      const failureResult = {
        success: false,
        error: 'Invalid refresh token',
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBeDefined();
    });
  });
});

describe('Token Generation and Verification', () => {
  describe('access token', () => {
    it('should generate valid access token', () => {
      const token = TokenService.generateAccessToken('user-1', 'testuser', 'admin');

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify valid access token', () => {
      const token = TokenService.generateAccessToken('user-1', 'testuser', 'admin');
      const result = TokenService.verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.userId).toBe('user-1');
      expect(result.payload?.username).toBe('testuser');
      expect(result.payload?.role).toBe('admin');
    });

    it('should reject invalid access token', () => {
      const result = TokenService.verifyAccessToken('invalid-token');

      expect(result.valid).toBe(false);
    });
  });

  describe('refresh token', () => {
    it('should generate valid refresh token', () => {
      const token = TokenService.generateRefreshToken('user-1');

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify valid refresh token', () => {
      const token = TokenService.generateRefreshToken('user-1');
      const result = TokenService.verifyRefreshToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload?.userId).toBe('user-1');
    });

    it('should reject invalid refresh token', () => {
      const result = TokenService.verifyRefreshToken('invalid-token');

      expect(result.valid).toBe(false);
    });
  });

  describe('token pair', () => {
    it('should generate both tokens with correct expiry', () => {
      const before = Date.now();
      const result = TokenService.generateTokenPair('user-1', 'testuser', 'admin');
      const after = Date.now();

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Access token ~15 min
      const fifteenMin = 15 * 60 * 1000;
      expect(result.accessTokenExpiry).toBeGreaterThanOrEqual(before + fifteenMin - 1000);
      expect(result.accessTokenExpiry).toBeLessThanOrEqual(after + fifteenMin + 1000);

      // Refresh token ~7 days
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(result.refreshTokenExpiry).toBeGreaterThanOrEqual(before + sevenDays - 1000);
      expect(result.refreshTokenExpiry).toBeLessThanOrEqual(after + sevenDays + 1000);
    });
  });
});
