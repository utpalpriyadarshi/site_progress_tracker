/**
 * Test Script: Check Sessions in Database
 *
 * Purpose: Manually inspect session records for testing
 * Usage: Run after login to verify session creation
 *
 * To run this script:
 * 1. Import it in App.tsx temporarily
 * 2. Call checkSessions() after login
 * 3. Check console logs for session details
 */

import { database } from '../models/database';
import SessionModel from '../models/SessionModel';
import { Q } from '@nozbe/watermelondb';

/**
 * Check all sessions in database
 * Prints detailed information about each session
 */
export async function checkAllSessions() {
  try {
    console.log('\n========================================');
    console.log('DATABASE SESSION CHECK - ALL SESSIONS');
    console.log('========================================\n');

    const sessions = await database.collections
      .get<SessionModel>('sessions')
      .query()
      .fetch();

    console.log(`Total sessions in database: ${sessions.length}\n`);

    if (sessions.length === 0) {
      console.log('❌ No sessions found in database');
      return;
    }

    sessions.forEach((session, index) => {
      console.log(`--- Session ${index + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`User ID: ${session.userId}`);
      console.log(`Access Token: ${session.accessToken.substring(0, 50)}...`);
      console.log(`Refresh Token: ${session.refreshToken.substring(0, 50)}...`);
      console.log(`Device Info: ${session.deviceInfo || '(empty)'}`);
      console.log(`IP Address: ${session.ipAddress || '(empty)'}`);
      console.log(`Expires At: ${new Date(session.expiresAt).toLocaleString()}`);
      console.log(`Revoked At: ${session.revokedAt ? new Date(session.revokedAt).toLocaleString() : 'Not revoked'}`);
      console.log(`Is Active: ${session.isActive ? '✅ YES' : '❌ NO'}`);
      console.log(`Created At: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`Is Valid: ${session.isValid() ? '✅ YES' : '❌ NO'}`);
      console.log(`Is Expired: ${session.isExpired() ? '⏰ YES' : '✅ NO'}`);
      console.log('');
    });

    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Error checking sessions:', error);
  }
}

/**
 * Check sessions for a specific user
 * @param userId - User ID to filter by
 */
export async function checkUserSessions(userId: string) {
  try {
    console.log('\n========================================');
    console.log(`DATABASE SESSION CHECK - USER: ${userId}`);
    console.log('========================================\n');

    const sessions = await database.collections
      .get<SessionModel>('sessions')
      .query(Q.where('user_id', userId))
      .fetch();

    console.log(`Total sessions for user ${userId}: ${sessions.length}\n`);

    if (sessions.length === 0) {
      console.log(`❌ No sessions found for user ${userId}`);
      return;
    }

    sessions.forEach((session, index) => {
      console.log(`--- Session ${index + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`Access Token: ${session.accessToken.substring(0, 50)}...`);
      console.log(`Is Active: ${session.isActive ? '✅ YES' : '❌ NO'}`);
      console.log(`Is Valid: ${session.isValid() ? '✅ YES' : '❌ NO'}`);
      console.log(`Expires At: ${new Date(session.expiresAt).toLocaleString()}`);
      console.log(`Revoked At: ${session.revokedAt ? new Date(session.revokedAt).toLocaleString() : 'Not revoked'}`);
      console.log(`Created At: ${new Date(session.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Error checking user sessions:', error);
  }
}

/**
 * Check active sessions only
 */
export async function checkActiveSessions() {
  try {
    console.log('\n========================================');
    console.log('DATABASE SESSION CHECK - ACTIVE ONLY');
    console.log('========================================\n');

    const sessions = await database.collections
      .get<SessionModel>('sessions')
      .query(Q.where('is_active', true))
      .fetch();

    console.log(`Total ACTIVE sessions: ${sessions.length}\n`);

    if (sessions.length === 0) {
      console.log('❌ No active sessions found');
      return;
    }

    sessions.forEach((session, index) => {
      console.log(`--- Active Session ${index + 1} ---`);
      console.log(`ID: ${session.id}`);
      console.log(`User ID: ${session.userId}`);
      console.log(`Is Valid: ${session.isValid() ? '✅ YES' : '❌ NO'}`);
      console.log(`Expires At: ${new Date(session.expiresAt).toLocaleString()}`);
      console.log(`Created At: ${new Date(session.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('========================================\n');
  } catch (error) {
    console.error('❌ Error checking active sessions:', error);
  }
}

/**
 * Check the most recent session
 */
export async function checkLatestSession() {
  try {
    console.log('\n========================================');
    console.log('DATABASE SESSION CHECK - LATEST SESSION');
    console.log('========================================\n');

    // Get all sessions and sort in JavaScript to handle invalid created_at values
    const allSessions = await database.collections
      .get<SessionModel>('sessions')
      .query()
      .fetch();

    if (allSessions.length === 0) {
      console.log('❌ No sessions found in database');
      return;
    }

    console.log(`Found ${allSessions.length} total sessions in database`);

    // Debug: Show all session IDs with their timestamps
    console.log('\n🔍 All sessions (for debugging):');
    allSessions.forEach((s, idx) => {
      console.log(`  ${idx + 1}. ID: ${s.id} | Active: ${s.isActive} | Created: ${s.createdAt} | Updated: ${s.updatedAt}`);
    });
    console.log('');

    // Sort by WatermelonDB internal timestamps first, then by created_at
    // For new sessions, _raw._changed should have a value
    const sortedSessions = allSessions.sort((a, b) => {
      // Prefer sessions with valid created_at timestamps
      const aTime = a.createdAt > 0 ? a.createdAt : a.updatedAt > 0 ? a.updatedAt : 0;
      const bTime = b.createdAt > 0 ? b.createdAt : b.updatedAt > 0 ? b.updatedAt : 0;

      // If both have valid timestamps, compare them
      if (aTime > 0 && bTime > 0) {
        return bTime - aTime;
      }

      // If only one has a valid timestamp, prefer that one
      if (aTime > 0) return -1;
      if (bTime > 0) return 1;

      // Both have invalid timestamps, prefer active sessions
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;

      // Fall back to ID comparison (newer IDs are typically created later)
      return 0;
    });

    const session = sortedSessions[0];
    console.log(`Selected session: ${session.id} (Active: ${session.isActive})\n`);
    console.log(`📊 LATEST SESSION DETAILS (${allSessions.length} total sessions):`);
    console.log('─────────────────────────────────────');
    console.log(`✓ ID: ${session.id}`);
    console.log(`✓ User ID: ${session.userId}`);
    console.log(`✓ Access Token (first 50 chars): ${session.accessToken.substring(0, 50)}...`);
    console.log(`✓ Refresh Token (first 50 chars): ${session.refreshToken.substring(0, 50)}...`);
    console.log(`✓ Device Info: ${session.deviceInfo || '(empty)'}`);
    console.log(`✓ IP Address: ${session.ipAddress || '(empty)'}`);
    console.log(`✓ Expires At: ${new Date(session.expiresAt).toLocaleString()}`);
    console.log(`✓ Revoked At: ${session.revokedAt ? new Date(session.revokedAt).toLocaleString() : 'Not revoked'}`);
    console.log(`✓ Is Active: ${session.isActive ? '✅ YES' : '❌ NO'}`);

    // Handle potentially invalid timestamps from migrated data
    const createdAtStr = session.createdAt > 0
      ? new Date(session.createdAt).toLocaleString()
      : '(not set - old session)';
    const updatedAtStr = session.updatedAt > 0
      ? new Date(session.updatedAt).toLocaleString()
      : '(not set - old session)';

    console.log(`✓ Created At: ${createdAtStr}`);
    console.log(`✓ Updated At: ${updatedAtStr}`);
    console.log('');
    console.log('🔍 SESSION STATUS:');
    console.log(`   Is Valid: ${session.isValid() ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Expired: ${session.isExpired() ? '⏰ YES (expired)' : '✅ NO (still valid)'}`);

    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    const daysUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24));
    const hoursUntilExpiry = Math.floor((timeUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    console.log(`   Time Until Expiry: ${daysUntilExpiry} days, ${hoursUntilExpiry} hours`);

    console.log('\n========================================\n');
  } catch (error) {
    console.error('❌ Error checking latest session:', error);
  }
}

/**
 * Quick test for manual testing - checks latest session
 */
export async function quickSessionCheck() {
  await checkLatestSession();
}

/**
 * Full test for manual testing - checks all sessions
 */
export async function fullSessionCheck() {
  await checkAllSessions();
  await checkActiveSessions();
}
