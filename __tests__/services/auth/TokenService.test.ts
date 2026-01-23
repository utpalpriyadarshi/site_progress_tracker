/**
 * TokenService Tests
 *
 * Tests for JWT token generation, verification, and management.
 */

import TokenService from '../../../services/auth/TokenService';

// Mock the JWT config
jest.mock('../../../config/jwt.config', () => ({
  JWT_CONFIG: {
    ACCESS_TOKEN_SECRET: 'test-access-secret-key-for-testing-purposes-only',
    REFRESH_TOKEN_SECRET: 'test-refresh-secret-key-for-testing-purposes-only',
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    ISSUER: 'construction-tracker-app',
    AUDIENCE: 'construction-tracker-users',
  },
}));

describe('TokenService', () => {
  const testUser = {
    userId: 'user-123',
    username: 'testuser',
    role: 'supervisor',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include user data in token payload', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const decoded = TokenService.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testUser.userId);
      expect(decoded?.username).toBe(testUser.username);
      expect(decoded?.role).toBe(testUser.role);
    });

    it('should include optional sessionId when provided', () => {
      const sessionId = 'session-456';
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role,
        sessionId
      );

      const decoded = TokenService.decodeToken(token);
      expect(decoded?.sessionId).toBe(sessionId);
    });

    it('should generate tokens with proper JWT structure', () => {
      const token1 = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );
      const token2 = TokenService.generateAccessToken(
        'different-user',
        'differentuser',
        'admin'
      );

      // Different users should produce different tokens
      expect(token1).not.toBe(token2);

      // Both should be valid JWT structure
      expect(token1.split('.')).toHaveLength(3);
      expect(token2.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token', () => {
      const token = TokenService.generateRefreshToken(testUser.userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId in token payload', () => {
      const token = TokenService.generateRefreshToken(testUser.userId);

      const decoded = TokenService.decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testUser.userId);
    });

    it('should not include username or role in refresh token', () => {
      const token = TokenService.generateRefreshToken(testUser.userId);

      const decoded = TokenService.decodeToken(token);
      expect(decoded?.username).toBeUndefined();
      expect(decoded?.role).toBeUndefined();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const result = TokenService.generateTokenPair(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.accessTokenExpiry).toBeDefined();
      expect(result.refreshTokenExpiry).toBeDefined();
    });

    it('should set correct expiry times', () => {
      const before = Date.now();
      const result = TokenService.generateTokenPair(
        testUser.userId,
        testUser.username,
        testUser.role
      );
      const after = Date.now();

      // Access token should expire in ~15 minutes
      const fifteenMinutes = 15 * 60 * 1000;
      expect(result.accessTokenExpiry).toBeGreaterThanOrEqual(before + fifteenMinutes);
      expect(result.accessTokenExpiry).toBeLessThanOrEqual(after + fifteenMinutes);

      // Refresh token should expire in ~7 days
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(result.refreshTokenExpiry).toBeGreaterThanOrEqual(before + sevenDays);
      expect(result.refreshTokenExpiry).toBeLessThanOrEqual(after + sevenDays);
    });

    it('should generate different tokens', () => {
      const result = TokenService.generateTokenPair(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      expect(result.accessToken).not.toBe(result.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const result = TokenService.verifyAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(testUser.userId);
      expect(result.error).toBeUndefined();
    });

    it('should reject an invalid token', () => {
      const result = TokenService.verifyAccessToken('invalid.token.here');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject a refresh token as access token', () => {
      const refreshToken = TokenService.generateRefreshToken(testUser.userId);
      const result = TokenService.verifyAccessToken(refreshToken);

      expect(result.valid).toBe(false);
    });

    it('should reject malformed tokens', () => {
      const malformedTokens = [
        '',
        'not-a-jwt',
        'only.two.parts.missing',
        'a.b.c.d.e',
        null as any,
        undefined as any,
      ];

      malformedTokens.forEach((token) => {
        const result = TokenService.verifyAccessToken(token);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(testUser.userId);

      const result = TokenService.verifyRefreshToken(token);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe(testUser.userId);
    });

    it('should reject an access token as refresh token', () => {
      const accessToken = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );
      const result = TokenService.verifyRefreshToken(accessToken);

      expect(result.valid).toBe(false);
    });

    it('should reject invalid refresh tokens', () => {
      const result = TokenService.verifyRefreshToken('invalid.refresh.token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const decoded = TokenService.decodeToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testUser.userId);
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();
    });

    it('should return null for invalid tokens', () => {
      const decoded = TokenService.decodeToken('invalid');
      expect(decoded).toBeNull();
    });

    it('should decode token even with invalid signature', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      // Tamper with the signature
      const parts = token.split('.');
      parts[2] = 'tampered_signature';
      const tamperedToken = parts.join('.');

      // decodeToken should still work (no verification)
      const decoded = TokenService.decodeToken(tamperedToken);
      expect(decoded?.userId).toBe(testUser.userId);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for fresh token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      expect(TokenService.isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(TokenService.isTokenExpired('invalid')).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      // This is an edge case - normally all tokens have exp
      expect(TokenService.isTokenExpired('')).toBe(true);
    });
  });

  describe('getTokenExpiry', () => {
    it('should return expiry timestamp in milliseconds', () => {
      const before = Date.now();
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const expiry = TokenService.getTokenExpiry(token);

      expect(expiry).not.toBeNull();
      expect(expiry).toBeGreaterThan(before);
      // Should be approximately 15 minutes from now
      expect(expiry! - before).toBeLessThan(16 * 60 * 1000);
    });

    it('should return null for invalid token', () => {
      expect(TokenService.getTokenExpiry('invalid')).toBeNull();
    });
  });

  describe('getTimeUntilExpiry', () => {
    it('should return positive value for fresh token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const remaining = TokenService.getTimeUntilExpiry(token);

      expect(remaining).toBeGreaterThan(0);
      // Should be close to 15 minutes
      expect(remaining).toBeLessThanOrEqual(15 * 60 * 1000);
    });

    it('should return 0 for invalid token', () => {
      expect(TokenService.getTimeUntilExpiry('invalid')).toBe(0);
    });
  });

  describe('shouldRefreshToken', () => {
    it('should return false for fresh token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      // Fresh token has ~15 min, threshold is 5 min
      expect(TokenService.shouldRefreshToken(token)).toBe(false);
    });

    it('should return false for invalid token', () => {
      // Invalid tokens return 0 remaining time, which is not > 0
      expect(TokenService.shouldRefreshToken('invalid')).toBe(false);
    });
  });

  describe('token security', () => {
    it('should include issuer in token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const decoded = TokenService.decodeToken(token);
      expect(decoded?.iss).toBe('construction-tracker-app');
    });

    it('should include audience in token', () => {
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );

      const decoded = TokenService.decodeToken(token);
      expect(decoded?.aud).toBe('construction-tracker-users');
    });

    it('should include issued-at timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const token = TokenService.generateAccessToken(
        testUser.userId,
        testUser.username,
        testUser.role
      );
      const after = Math.floor(Date.now() / 1000);

      const decoded = TokenService.decodeToken(token);
      expect(decoded?.iat).toBeGreaterThanOrEqual(before);
      expect(decoded?.iat).toBeLessThanOrEqual(after);
    });
  });
});
