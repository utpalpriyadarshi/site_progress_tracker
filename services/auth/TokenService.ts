// @ts-nocheck
import * as KJUR from 'jsrsasign';
import { JWT_CONFIG, AccessTokenPayload, RefreshTokenPayload } from '../../config/jwt.config';

/**
 * TokenService
 *
 * Service for JWT token generation, validation, and management
 * v2.2 - Activity 1, Week 2, Day 7
 *
 * Features:
 * - Generate access tokens (15min expiry)
 * - Generate refresh tokens (7 days expiry)
 * - Verify and decode tokens
 * - Handle expired/invalid tokens
 */

export interface TokenGenerationResult {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: AccessTokenPayload | RefreshTokenPayload;
  error?: string;
  expired?: boolean;
}

class TokenService {
  /**
   * Generate an access token for a user
   *
   * @param userId - User's database ID
   * @param username - User's username
   * @param role - User's role (admin, supervisor, manager, planner, logistics)
   * @param sessionId - Optional session ID (will be added in Week 3)
   * @returns JWT access token string
   */
  generateAccessToken(
    userId: string,
    username: string,
    role: string,
    sessionId?: string
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (15 * 60); // 15 minutes

    const payload = {
      userId,
      username,
      role,
      sessionId,
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE,
      iat: now,
      exp,
    };

    try {
      // Create JWT header
      const header = { alg: 'HS256', typ: 'JWT' };

      // Sign the token
      const token = KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), JWT_CONFIG.ACCESS_TOKEN_SECRET);
      return token;
    } catch (error) {
      console.error('TokenService: Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate a refresh token for a user
   *
   * @param userId - User's database ID
   * @param sessionId - Optional session ID (will be added in Week 3)
   * @returns JWT refresh token string
   */
  generateRefreshToken(userId: string, sessionId?: string): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (7 * 24 * 60 * 60); // 7 days

    const payload = {
      userId,
      sessionId,
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE,
      iat: now,
      exp,
    };

    try {
      // Create JWT header
      const header = { alg: 'HS256', typ: 'JWT' };

      // Sign the token
      const token = KJUR.jws.JWS.sign('HS256', JSON.stringify(header), JSON.stringify(payload), JWT_CONFIG.REFRESH_TOKEN_SECRET);
      return token;
    } catch (error) {
      console.error('TokenService: Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   *
   * @param userId - User's database ID
   * @param username - User's username
   * @param role - User's role
   * @param sessionId - Optional session ID
   * @returns Object containing both tokens and their expiry times
   */
  generateTokenPair(
    userId: string,
    username: string,
    role: string,
    sessionId?: string
  ): TokenGenerationResult {
    const accessToken = this.generateAccessToken(userId, username, role, sessionId);
    const refreshToken = this.generateRefreshToken(userId, sessionId);

    // Calculate expiry timestamps
    const now = Date.now();
    const accessTokenExpiry = now + (15 * 60 * 1000); // 15 minutes
    const refreshTokenExpiry = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    };
  }

  /**
   * Verify an access token
   *
   * @param token - JWT access token string
   * @returns Verification result with payload or error
   */
  verifyAccessToken(token: string): TokenVerificationResult {
    try {
      // Verify the token signature
      const isValid = KJUR.jws.JWS.verifyJWT(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
        alg: ['HS256'],
      });

      if (!isValid) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid token signature',
        };
      }

      // Parse the payload
      const payloadObj = KJUR.jws.JWS.readSafeJSONString(KJUR.b64utoutf8(token.split('.')[1]));
      const payload = payloadObj as AccessTokenPayload;

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          valid: false,
          expired: true,
          error: 'Access token has expired',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        error: `Invalid access token: ${error}`,
      };
    }
  }

  /**
   * Verify a refresh token
   *
   * @param token - JWT refresh token string
   * @returns Verification result with payload or error
   */
  verifyRefreshToken(token: string): TokenVerificationResult {
    try {
      // Verify the token signature
      const isValid = KJUR.jws.JWS.verifyJWT(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
        alg: ['HS256'],
      });

      if (!isValid) {
        return {
          valid: false,
          expired: false,
          error: 'Invalid token signature',
        };
      }

      // Parse the payload
      const payloadObj = KJUR.jws.JWS.readSafeJSONString(KJUR.b64utoutf8(token.split('.')[1]));
      const payload = payloadObj as RefreshTokenPayload;

      // Check expiry
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          valid: false,
          expired: true,
          error: 'Refresh token has expired',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        expired: false,
        error: `Invalid refresh token: ${error}`,
      };
    }
  }

  /**
   * Decode a token without verification
   *
   * Useful for inspecting token contents without validating signature
   * WARNING: Do not use for authentication - always verify tokens first
   *
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload | null {
    try {
      // Parse the payload without verification
      const payloadObj = KJUR.jws.JWS.readSafeJSONString(KJUR.b64utoutf8(token.split('.')[1]));
      return payloadObj as AccessTokenPayload | RefreshTokenPayload;
    } catch (error) {
      console.error('TokenService: Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   *
   * @param token - JWT token string
   * @returns True if expired, false if valid or invalid format
   */
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    return decoded.exp < now;
  }

  /**
   * Get token expiry time
   *
   * @param token - JWT token string
   * @returns Expiry timestamp in milliseconds, or null if invalid
   */
  getTokenExpiry(token: string): number | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return decoded.exp * 1000; // Convert to milliseconds
  }

  /**
   * Get time remaining until token expiry
   *
   * @param token - JWT token string
   * @returns Milliseconds until expiry, or 0 if expired/invalid
   */
  getTimeUntilExpiry(token: string): number {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) {
      return 0;
    }

    const remaining = expiry - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Check if token should be refreshed
   *
   * Recommended to refresh when less than 5 minutes remaining
   *
   * @param token - JWT access token string
   * @returns True if should refresh, false otherwise
   */
  shouldRefreshToken(token: string): boolean {
    const remaining = this.getTimeUntilExpiry(token);
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return remaining < fiveMinutes && remaining > 0;
  }
}

// Export singleton instance
export default new TokenService();
