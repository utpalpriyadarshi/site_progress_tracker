/**
 * JWT Configuration
 *
 * v2.2 - Activity 1, Week 2, Day 6
 *
 * Security Notes:
 * - Secrets are 256-bit random strings for maximum security
 * - Access tokens expire in 15 minutes (short-lived)
 * - Refresh tokens expire in 7 days (long-lived)
 * - IMPORTANT: In production, use environment variables instead of hardcoded secrets
 */

export const JWT_CONFIG = {
  // Access Token Configuration
  ACCESS_TOKEN_SECRET: 'e80fa395c86a15085338f731bdc623ad873c49eb1109041cb0004ceb6a3df1ab',
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes

  // Refresh Token Configuration
  REFRESH_TOKEN_SECRET: '2f92a007150b4191c34f4a532f470cf55350e54c1ad87d1add55d7559e14b970',
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days

  // Token Options
  ISSUER: 'construction-tracker-app',
  AUDIENCE: 'construction-tracker-users',
} as const;

// TypeScript types for JWT payloads
export interface AccessTokenPayload {
  userId: string;
  username: string;
  role: string;
  sessionId?: string; // Optional for now, will be added in Week 3
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
  aud: string; // Audience
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId?: string; // Optional for now, will be added in Week 3
  iat: number; // Issued at
  exp: number; // Expires at
  iss: string; // Issuer
  aud: string; // Audience
}

export type TokenType = 'access' | 'refresh';
