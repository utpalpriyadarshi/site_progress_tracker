/**
 * Manual test script for SessionService
 * Run this to verify all SessionService methods work correctly
 *
 * Usage: npx ts-node scripts/testSessionService.ts
 */

import { database } from '../models/database';
import { SessionService } from '../services/auth/SessionService';

async function testSessionService() {
  console.log('🧪 Testing SessionService...\n');

  try {
    // Test 1: Create a session
    console.log('✅ Test 1: Create session');
    const testUserId = 'test-user-123';
    const testAccessToken = 'test-access-token-xyz';
    const testRefreshToken = 'test-refresh-token-abc';
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

    const session = await SessionService.createSession({
      userId: testUserId,
      accessToken: testAccessToken,
      refreshToken: testRefreshToken,
      expiresAt: expiresAt,
      deviceInfo: 'Test Device',
      ipAddress: '127.0.0.1',
    });

    console.log(`   Created session: ${session.id}`);
    console.log(`   User ID: ${session.userId}`);
    console.log(`   Is Active: ${session.isActive}`);
    console.log(`   Expires At: ${new Date(session.expiresAt).toISOString()}\n`);

    // Test 2: Get active session
    console.log('✅ Test 2: Get active session');
    const activeSession = await SessionService.getActiveSession(testUserId, testAccessToken);
    if (activeSession) {
      console.log(`   Found session: ${activeSession.id}`);
      console.log(`   Is valid: ${activeSession.isValid()}\n`);
    } else {
      console.log('   ❌ Session not found!\n');
    }

    // Test 3: Validate session
    console.log('✅ Test 3: Validate session');
    const isValid = await SessionService.validateSession(session.id);
    console.log(`   Session ${session.id} is valid: ${isValid}\n`);

    // Test 4: Get user active sessions
    console.log('✅ Test 4: Get user active sessions');
    const activeSessions = await SessionService.getUserActiveSessions(testUserId);
    console.log(`   Found ${activeSessions.length} active sessions for user ${testUserId}\n`);

    // Test 5: Get session stats
    console.log('✅ Test 5: Get session stats');
    const stats = await SessionService.getSessionStats(testUserId);
    console.log(`   Total: ${stats.total}, Active: ${stats.active}, Expired: ${stats.expired}, Revoked: ${stats.revoked}\n`);

    // Test 6: Revoke session
    console.log('✅ Test 6: Revoke session');
    const revoked = await SessionService.revokeSession(session.id);
    console.log(`   Session revoked: ${revoked}`);

    // Verify revocation
    const isValidAfterRevoke = await SessionService.validateSession(session.id);
    console.log(`   Session valid after revoke: ${isValidAfterRevoke}\n`);

    // Test 7: Create multiple sessions and revoke all
    console.log('✅ Test 7: Revoke all user sessions');

    // Create 3 more sessions
    await SessionService.createSession({
      userId: testUserId,
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    });
    await SessionService.createSession({
      userId: testUserId,
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    });
    await SessionService.createSession({
      userId: testUserId,
      accessToken: 'token-3',
      refreshToken: 'refresh-3',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
    });

    const statsBeforeRevokeAll = await SessionService.getSessionStats(testUserId);
    console.log(`   Sessions before revoke all: Active=${statsBeforeRevokeAll.active}`);

    const revokedCount = await SessionService.revokeAllUserSessions(testUserId);
    console.log(`   Revoked ${revokedCount} sessions`);

    const statsAfterRevokeAll = await SessionService.getSessionStats(testUserId);
    console.log(`   Sessions after revoke all: Active=${statsAfterRevokeAll.active}, Revoked=${statsAfterRevokeAll.revoked}\n`);

    // Test 8: Cleanup expired sessions
    console.log('✅ Test 8: Cleanup expired sessions');

    // Create an expired session
    await SessionService.createSession({
      userId: testUserId,
      accessToken: 'expired-token',
      refreshToken: 'expired-refresh',
      expiresAt: Date.now() - 1000, // Expired 1 second ago
    });

    const cleanedCount = await SessionService.cleanupExpiredSessions(false);
    console.log(`   Cleaned up ${cleanedCount} expired sessions\n`);

    console.log('✅ All SessionService tests passed!\n');

    // Cleanup: Delete test sessions
    console.log('🧹 Cleaning up test data...');
    const allTestSessions = await database.collections
      .get('sessions')
      .query()
      .fetch();

    await database.write(async () => {
      for (const s of allTestSessions) {
        if (s.userId === testUserId) {
          await s.markAsDeleted();
        }
      }
    });
    console.log(`   Deleted ${allTestSessions.length} test sessions\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testSessionService().then(() => {
  console.log('✅ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
