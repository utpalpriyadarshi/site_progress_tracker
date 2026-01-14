/**
 * JWT Configuration
 *
 * v2.2 - Activity 1, Week 2, Day 6
 * Updated: 2026-01-14 - Security Enhancement (moved secrets to environment variables)
 *
 * Security Notes:
 * - Secrets are loaded from environment variables (.env file)
 * - Secrets are 256-bit random strings for maximum security
 * - Access tokens expire in 15 minutes (short-lived)
 * - Refresh tokens expire in 7 days (long-lived)
 * - Never commit .env file to git - it's in .gitignore
 */

import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from '@env';

export const JWT_CONFIG = {
  // Access Token Configuration
  ACCESS_TOKEN_SECRET: JWT_ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes

  // Refresh Token Configuration
  REFRESH_TOKEN_SECRET: JWT_REFRESH_TOKEN_SECRET,
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
