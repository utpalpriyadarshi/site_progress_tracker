import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import SessionModel from '../../models/SessionModel';

/**
 * SessionService - Manages user sessions for JWT authentication
 *
 * Handles session creation, validation, revocation, and cleanup.
 * Sessions are stored in the database for security tracking and management.
 */

// TypeScript interfaces for session data
export interface CreateSessionParams {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface SessionData {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: number;
  revokedAt: number | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export class SessionService {
  /**
   * Create a new session record in the database
   * Called during login after JWT tokens are generated
   *
   * @param params - Session creation parameters
   * @returns The created session object
   */
  static async createSession(params: CreateSessionParams): Promise<SessionModel> {
    const { userId, accessToken, refreshToken, expiresAt, deviceInfo, ipAddress } = params;

    const session = await database.write(async () => {
      return await database.collections.get<SessionModel>('sessions').create((session) => {
        session.userId = userId;
        session.accessToken = accessToken;
        session.refreshToken = refreshToken;
        session.expiresAt = expiresAt;
        session.deviceInfo = deviceInfo || '';
        session.ipAddress = ipAddress || '';
        session.isActive = true;
        session.revokedAt = 0; // 0 means not revoked (null not supported for number type)
      });
    });

    console.log(`SessionService: Created session ${session.id} for user ${userId}`);
    return session;
  }

  /**
   * Get an active session by userId and accessToken
   * Validates that session is active, not revoked, and not expired
   *
   * @param userId - User ID to search for
   * @param accessToken - Access token to match
   * @returns Session object or null if not found/invalid
   */
  static async getActiveSession(
    userId: string,
    accessToken: string
  ): Promise<SessionModel | null> {
    try {
      const now = Date.now();

      const sessions = await database.collections
        .get<SessionModel>('sessions')
        .query(
          Q.where('user_id', userId),
          Q.where('access_token', accessToken),
          Q.where('is_active', true),
          Q.where('expires_at', Q.gt(now)) // expires_at > now
        )
        .fetch();

      // Filter out revoked sessions (revoked_at > 0 means revoked)
      const activeSessions = sessions.filter(s => !s.revokedAt || s.revokedAt === 0);

      if (activeSessions.length > 0) {
        return activeSessions[0];
      }

      return null;
    } catch (error) {
      console.error('SessionService: Error getting active session:', error);
      return null;
    }
  }

  /**
   * Validate a session by ID
   * Checks if session exists, is active, not revoked, and not expired
   *
   * @param sessionId - Session ID to validate
   * @returns true if session is valid, false otherwise
   */
  static async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await database.collections
        .get<SessionModel>('sessions')
        .find(sessionId);

      if (!session) {
        return false;
      }

      // Use the helper method from SessionModel
      return session.isValid();
    } catch (error) {
      console.error('SessionService: Error validating session:', error);
      return false;
    }
  }

  /**
   * Revoke a session by ID
   * Sets revoked_at timestamp and is_active to false
   * Called during logout
   *
   * @param sessionId - Session ID to revoke
   * @returns true if session was revoked, false otherwise
   */
  static async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const session = await database.collections
        .get<SessionModel>('sessions')
        .find(sessionId);

      if (!session) {
        console.warn(`SessionService: Session ${sessionId} not found for revocation`);
        return false;
      }

      await database.write(async () => {
        await session.update((s) => {
          s.revokedAt = Date.now();
          s.isActive = false;
        });
      });

      console.log(`SessionService: Revoked session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('SessionService: Error revoking session:', error);
      return false;
    }
  }

  /**
   * Revoke all sessions for a specific user
   * Used during password reset to force re-login
   *
   * @param userId - User ID whose sessions should be revoked
   * @returns Number of sessions revoked
   */
  static async revokeAllUserSessions(userId: string): Promise<number> {
    try {
      const sessions = await database.collections
        .get<SessionModel>('sessions')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true)
        )
        .fetch();

      let revokedCount = 0;
      const now = Date.now();

      await database.write(async () => {
        for (const session of sessions) {
          await session.update((s) => {
            s.revokedAt = now;
            s.isActive = false;
          });
          revokedCount++;
        }
      });

      console.log(`SessionService: Revoked ${revokedCount} sessions for user ${userId}`);
      return revokedCount;
    } catch (error) {
      console.error('SessionService: Error revoking user sessions:', error);
      return 0;
    }
  }

  /**
   * Cleanup expired sessions
   * Sets is_active to false for sessions where expires_at < current time
   * Optional: Delete sessions older than 30 days
   *
   * @param deleteOldSessions - If true, delete sessions older than 30 days
   * @returns Number of sessions cleaned up
   */
  static async cleanupExpiredSessions(deleteOldSessions: boolean = false): Promise<number> {
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds

      // Find expired sessions that are still marked as active
      const expiredSessions = await database.collections
        .get<SessionModel>('sessions')
        .query(
          Q.where('expires_at', Q.lt(now)), // expires_at < now
          Q.where('is_active', true)
        )
        .fetch();

      let cleanedCount = 0;

      // Mark expired sessions as inactive
      await database.write(async () => {
        for (const session of expiredSessions) {
          await session.update((s) => {
            s.isActive = false;
          });
          cleanedCount++;
        }
      });

      // Optional: Delete very old sessions (older than 30 days)
      if (deleteOldSessions) {
        const oldSessions = await database.collections
          .get<SessionModel>('sessions')
          .query(Q.where('created_at', Q.lt(thirtyDaysAgo)))
          .fetch();

        await database.write(async () => {
          for (const session of oldSessions) {
            await session.markAsDeleted();
          }
        });

        console.log(`SessionService: Deleted ${oldSessions.length} old sessions (>30 days)`);
      }

      console.log(`SessionService: Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      console.error('SessionService: Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a specific user
   * Used for displaying "Active Devices" or session management UI
   *
   * @param userId - User ID to query sessions for
   * @returns Array of active session objects
   */
  static async getUserActiveSessions(userId: string): Promise<SessionModel[]> {
    try {
      const now = Date.now();

      const sessions = await database.collections
        .get<SessionModel>('sessions')
        .query(
          Q.where('user_id', userId),
          Q.where('is_active', true),
          Q.where('expires_at', Q.gt(now))
        )
        .fetch();

      // Filter out revoked sessions
      const activeSessions = sessions.filter(s => !s.revokedAt || s.revokedAt === 0);

      console.log(`SessionService: Found ${activeSessions.length} active sessions for user ${userId}`);
      return activeSessions;
    } catch (error) {
      console.error('SessionService: Error getting user active sessions:', error);
      return [];
    }
  }

  /**
   * Get session count for a user (for debugging/monitoring)
   *
   * @param userId - User ID to count sessions for
   * @returns Object with total, active, and expired session counts
   */
  static async getSessionStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
  }> {
    try {
      const now = Date.now();

      const allSessions = await database.collections
        .get<SessionModel>('sessions')
        .query(Q.where('user_id', userId))
        .fetch();

      const stats = {
        total: allSessions.length,
        active: 0,
        expired: 0,
        revoked: 0,
      };

      allSessions.forEach((session) => {
        if (session.revokedAt && session.revokedAt > 0) {
          stats.revoked++;
        } else if (session.expiresAt <= now) {
          stats.expired++;
        } else if (session.isActive) {
          stats.active++;
        }
      });

      return stats;
    } catch (error) {
      console.error('SessionService: Error getting session stats:', error);
      return { total: 0, active: 0, expired: 0, revoked: 0 };
    }
  }
}
