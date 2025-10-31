# Sync Troubleshooting Guide

**Document Version:** 1.0
**Last Updated:** October 31, 2025
**Activity:** Activity 2 - Week 9 Documentation

---

## 📋 Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Sync Failures](#sync-failures)
4. [Network Problems](#network-problems)
5. [Authentication Issues](#authentication-issues)
6. [Conflict Resolution](#conflict-resolution)
7. [Performance Issues](#performance-issues)
8. [Database Problems](#database-problems)
9. [Dead Letter Queue](#dead-letter-queue)
10. [Debugging Tools](#debugging-tools)
11. [FAQ](#faq)

---

## Quick Diagnostics

### Check Sync Status

**Method 1: SyncIndicator Component**
- Look at the sync indicator in the app header
- 🟢 Green: All synced
- 🟡 Yellow: Syncing in progress
- 🔴 Red: Sync error

**Method 2: Admin Screen**
```typescript
// Navigate to: Admin → Sync Monitoring Screen
// View:
// - Last sync timestamp
// - Pending records count
// - Dead letter queue size
// - Error messages
```

**Method 3: Console Logs**
```typescript
// Check React Native logs for:
console.log('🔄 Syncing...')
console.log('✅ Sync complete: 10 records')
console.error('❌ Sync failed: Network error')
```

---

### Quick Health Check

Run these commands in your debug console:

```typescript
// 1. Check network status
const isOnline = await NetworkMonitor.isConnected();
console.log('Network:', isOnline);

// 2. Check authentication
const token = await TokenStorage.getAccessToken();
console.log('Has token:', !!token);

// 3. Check sync queue
const queue = await SyncService.getSyncQueue();
console.log('Pending records:', queue.length);

// 4. Check last sync time
const state = AutoSyncManager.getSyncState();
console.log('Last sync:', new Date(state.lastSyncAt));

// 5. Trigger manual sync
await AutoSyncManager.triggerManualSync();
```

---

## Common Issues

### Issue 1: "Sync Failed - Network Error"

**Symptoms:**
- Sync indicator shows red error
- Console: `❌ Sync failed: Network error`
- Changes remain in queue

**Common Causes:**

1. **No Internet Connection**
   ```
   Solution: Connect to WiFi or mobile data
   Verify: Check NetworkMonitor.isConnected()
   ```

2. **Backend Server Unreachable**
   ```
   Solution: Verify backend URL in SyncService.ts
   Development: http://localhost:3000 should be running
   Production: https://api.construction-tracker.com should be accessible
   Test: curl <API_URL>/health
   ```

3. **Firewall Blocking Requests**
   ```
   Solution: Check firewall/antivirus settings
   Development: Allow connections to localhost:3000
   Corporate: Check company network restrictions
   ```

4. **Request Timeout**
   ```
   Solution: Increase timeout in SyncService.ts
   Current: 30 seconds (API_CONFIG.TIMEOUT)
   Recommendation: Keep at 30s, check network quality instead
   ```

**Resolution Steps:**

```typescript
// 1. Check network
const isConnected = await NetworkMonitor.isConnected();
if (!isConnected) {
  console.log('⚠️ No network connection');
  // Wait for network, sync will auto-trigger when restored
}

// 2. Verify backend is running (development)
// Terminal: npm start (in backend directory)
// Or check: curl http://localhost:3000/health

// 3. Manual retry
await AutoSyncManager.triggerManualSync();
```

---

### Issue 2: "401 Unauthorized"

**Symptoms:**
- Sync fails with authentication error
- Console: `❌ HTTP 401: Unauthorized`
- Redirected to login screen

**Common Causes:**

1. **Token Expired**
   ```
   Solution: Token expires after 1 hour
   Auto-fix: App should auto-refresh token
   Manual: Log out and log back in
   ```

2. **Invalid Token**
   ```
   Solution: Clear tokens and re-login
   Code:
   await TokenStorage.clearTokens();
   // Navigate to login screen
   ```

3. **Token Refresh Failed**
   ```
   Solution: Check refresh token validity
   Refresh tokens expire after 7 days
   Action: Re-login required
   ```

**Resolution Steps:**

```typescript
// 1. Check token exists
const accessToken = await TokenStorage.getAccessToken();
console.log('Has access token:', !!accessToken);

// 2. Check token expiry
const user = await TokenStorage.getCurrentUser();
console.log('User:', user);

// 3. Try manual token refresh
try {
  await TokenStorage.refreshAccessToken();
  console.log('✅ Token refreshed');
} catch (error) {
  console.log('❌ Refresh failed, need re-login');
  await TokenStorage.clearTokens();
  // Navigate to login
}
```

---

### Issue 3: "Changes Not Syncing"

**Symptoms:**
- User makes changes
- Sync completes without errors
- Changes not visible on other devices

**Common Causes:**

1. **sync_status Not Set**
   ```typescript
   // ❌ WRONG - Changes won't sync
   await item.update(i => {
     i.name = 'New Name';
     // Missing: i.syncStatus = 'pending'
   });

   // ✅ CORRECT
   await item.update(i => {
     i.name = 'New Name';
     i.syncStatus = 'pending';  // Mark for sync
   });
   ```

2. **Sync Queue Not Processing**
   ```typescript
   // Check queue
   const queue = await SyncService.getSyncQueue();
   console.log('Queue:', queue);

   // Force process
   await SyncService.syncUp();
   ```

3. **Server Rejected Changes**
   ```typescript
   // Check server logs
   // Look for validation errors or foreign key violations
   ```

**Resolution Steps:**

```typescript
// 1. Verify record is in queue
const queue = await SyncService.getSyncQueue();
const myRecord = queue.find(q => q.recordId === 'item-123');
console.log('In queue:', !!myRecord);

// 2. Check sync_status field
const item = await database.get('items').find('item-123');
console.log('Sync status:', item.syncStatus);

// 3. Manual sync
await SyncService.syncNow();

// 4. Check for errors
const state = AutoSyncManager.getSyncState();
console.log('Last error:', state.lastSyncError);
```

---

### Issue 4: "Slow Sync Performance"

**Symptoms:**
- Sync takes > 60 seconds
- App freezes during sync
- Users complain about wait times

**Common Causes:**

1. **Large Initial Sync**
   ```
   Cause: First sync pulls entire database
   Expected: 1000 records may take 30-60 seconds
   Solution: Show progress indicator, this only happens once
   ```

2. **Poor Network Connection**
   ```
   Cause: Slow mobile data or weak WiFi
   Solution: Recommend WiFi for initial sync
   Test: Check NetworkMonitor.getConnectionType()
   ```

3. **Too Many Pending Changes**
   ```
   Cause: User worked offline for long period
   Solution: Queue processing is automatic
   Recommendation: Sync periodically when online
   ```

**Resolution Steps:**

```typescript
// 1. Check queue size
const queue = await SyncService.getSyncQueue();
console.log('Pending:', queue.length);
// If > 500: Large sync expected, show progress

// 2. Check network type
const connectionType = await NetworkMonitor.getConnectionType();
console.log('Connection:', connectionType);
// If 'cellular': Warn user about data usage

// 3. Measure sync time
const startTime = Date.now();
await SyncService.syncNow();
const duration = Date.now() - startTime;
console.log('Sync took:', duration, 'ms');

// 4. Consider incremental sync
// Already implemented: Only syncs changes since last_sync_at
```

---

## Sync Failures

### Persistent Sync Failures

**Problem:** Sync fails repeatedly, changes stuck in queue

**Diagnosis:**

```typescript
// 1. Check dead letter queue
const dlq = await SyncService.getDeadLetterQueue();
console.log('Failed items:', dlq.length);

// 2. Inspect failed items
dlq.forEach(item => {
  console.log('Failed:', item.tableName, item.recordId);
  console.log('Error:', item.lastError);
  console.log('Retries:', item.retryCount);
});
```

**Common Failure Reasons:**

1. **Foreign Key Violations**
   ```
   Error: "Invalid project_id: Project does not exist"

   Cause: Referenced record doesn't exist on server
   Solution: Sync parent records first

   Example: Syncing item-123 that references site-456
   - site-456 must exist on server before syncing item-123
   - Or: Delete item-123 if site-456 was deleted
   ```

2. **Validation Errors**
   ```
   Error: "Validation error: status field is required"

   Cause: Required fields missing
   Solution: Update local record with required fields

   Fix:
   await item.update(i => {
     i.status = 'not_started';  // Add missing field
     i.syncStatus = 'pending';
   });
   ```

3. **Version Conflicts**
   ```
   Error: "Version conflict: server has newer version"

   Cause: Same record edited on multiple devices
   Solution: Auto-resolved by Last-Write-Wins
   Action: Pull latest version from server

   Fix:
   await SyncService.syncDown();  // Get server version
   ```

**Manual Recovery:**

```typescript
// Option 1: Retry failed items
const dlq = await SyncService.getDeadLetterQueue();
for (const item of dlq) {
  try {
    await SyncService.retryDeadLetterItem(item.id);
    console.log('✅ Retried:', item.id);
  } catch (error) {
    console.log('❌ Still failing:', item.id, error.message);
  }
}

// Option 2: Clear dead letter queue (last resort)
await SyncService.clearDeadLetterQueue();
console.log('⚠️ Dead letter queue cleared');

// Option 3: Clear entire sync queue (nuclear option)
await SyncService.clearSyncQueue();
console.log('⚠️ Sync queue cleared - pending changes lost!');
```

---

## Network Problems

### Offline Detection

**Problem:** App thinks it's online but sync fails

**Diagnosis:**

```typescript
// Check connection
const state = await NetInfo.fetch();
console.log('Connected:', state.isConnected);
console.log('Internet reachable:', state.isInternetReachable);
console.log('Type:', state.type);
```

**Possible Issues:**

1. **Connected to WiFi but No Internet**
   ```
   state.isConnected = true
   state.isInternetReachable = false

   Solution: NetInfo detects this
   Action: Wait for real internet connection
   ```

2. **Captive Portal (Hotel WiFi)**
   ```
   WiFi connected but requires login/acceptance

   Solution: Open browser, accept terms
   Then: Sync will auto-trigger
   ```

3. **VPN Issues**
   ```
   VPN blocks API requests

   Solution: Disable VPN or whitelist API domain
   Test: Disable VPN and try manual sync
   ```

---

### Network Change Sync Not Working

**Problem:** Sync doesn't trigger when network is restored

**Diagnosis:**

```typescript
// Check NetworkMonitor initialization
// In App.tsx, should have:
NetworkMonitor.initialize();

// Check auto-sync is enabled
NetworkMonitor.enableAutoSync();

// Check listener is registered
NetworkMonitor.addListener((isConnected, type) => {
  console.log('Network changed:', isConnected, type);
});
```

**Resolution:**

```typescript
// Re-initialize NetworkMonitor
NetworkMonitor.cleanup();
NetworkMonitor.initialize();

// Verify listener
const isConnected = await NetworkMonitor.isConnected();
console.log('Currently connected:', isConnected);

// Manual sync to verify backend is reachable
await SyncService.syncNow();
```

---

## Authentication Issues

### Token Expiry

**Problem:** Token expires mid-session

**Auto-Handled:** App automatically refreshes tokens before expiry

**Manual Check:**

```typescript
// Check token age
const user = await TokenStorage.getCurrentUser();
// Token expires after 1 hour

// Force refresh
try {
  await TokenStorage.refreshAccessToken();
} catch (error) {
  console.log('Refresh failed:', error.message);
  // Re-login required
}
```

---

### "No Access Token" Error

**Problem:** Sync fails with "No access token available"

**Cause:** User not logged in or tokens cleared

**Resolution:**

```typescript
// 1. Check if user is logged in
const token = await TokenStorage.getAccessToken();
if (!token) {
  console.log('User not logged in');
  // Navigate to login screen
}

// 2. Verify token storage
const allKeys = await AsyncStorage.getAllKeys();
const authKeys = allKeys.filter(k => k.startsWith('@auth'));
console.log('Auth keys:', authKeys);
// Should have: @auth/access_token, @auth/refresh_token, @auth/user

// 3. Re-login
// Navigate user to LoginScreen
```

---

## Conflict Resolution

### Understanding Conflicts

**What is a Conflict:**
```
Device A (offline):        Device B (offline):
Update item-1 at 10:00     Update item-1 at 10:05
         │                          │
         └─────────┬────────────────┘
                   │ Both sync to server
                   ▼
              CONFLICT DETECTED
         (both claim same version)
```

**How Conflicts Are Resolved:**
```
Last-Write-Wins (LWW) Strategy
- Compare version numbers
- If same version: Compare updated_at timestamps
- Latest timestamp wins
- Losing device receives winner's version on next pull
```

---

### Detecting Conflicts

**Method 1: Console Logs**
```typescript
console.log('⚠️ Conflict detected: item-1')
console.log('Client version: 5, Server version: 7')
console.log('Applying server version (server is newer)')
```

**Method 2: Sync Service**
```typescript
// Check sync result
const result = await SyncService.syncNow();
if (result.conflicts && result.conflicts.length > 0) {
  console.log('Conflicts:', result.conflicts);
}
```

---

### Handling Conflicts

**Automatic (Default):**
```typescript
// Conflicts are auto-resolved by LWW
// No user intervention needed
// Losing changes are overwritten
```

**Manual Review:**
```typescript
// If you need to track overwritten changes
// Currently: No UI for manual conflict resolution
// Recommendation: Rely on LWW for construction tracking
```

---

## Performance Issues

### Large Database Sync

**Problem:** Initial sync takes > 2 minutes

**Solutions:**

1. **Show Progress Indicator**
   ```typescript
   // In SyncIndicator component
   {isSyncing && <ProgressBar message="Syncing 500 of 1000 records..." />}
   ```

2. **Batch Size Optimization**
   ```typescript
   // Already implemented in SyncService
   // Processes records in batches of 100
   ```

3. **Selective Sync (Future Enhancement)**
   ```typescript
   // Only sync current project
   await SyncService.syncProject(projectId);
   // Not yet implemented
   ```

---

### Memory Issues

**Problem:** App crashes during large sync

**Diagnosis:**
```typescript
// Monitor memory in profiler
// React Native Debugger → Performance Monitor
```

**Solutions:**

1. **Reduce Batch Size**
   ```typescript
   // In SyncService.ts
   const BATCH_SIZE = 50;  // Reduce from 100
   ```

2. **Clear Cached Data**
   ```typescript
   // Periodically clean up old sync queue records
   await SyncService.clearSyncQueue();
   ```

---

## Database Problems

### Corruption Detection

**Symptoms:**
- App crashes on startup
- "Unable to open database" error
- Queries fail with cryptic errors

**Diagnosis:**

```typescript
// Try to query database
try {
  const items = await database.get('items').query().fetch();
  console.log('Database OK, items:', items.length);
} catch (error) {
  console.error('Database error:', error);
  // Corruption suspected
}
```

**Recovery:**

```typescript
// Option 1: Clear app data (last resort)
// Settings → Apps → Construction Tracker → Clear Data

// Option 2: Re-sync from server
// 1. Clear local database
await database.write(async () => {
  await database.unsafeResetDatabase();
});

// 2. Re-sync all data
await SyncService.syncDown();
```

---

### Migration Failures

**Problem:** App crashes after update with new schema

**Cause:** Migration from v19 → v20 failed

**Symptoms:**
```
Error: Migration failed at step 5
Error: Column '_version' does not exist
```

**Resolution:**

```typescript
// Check current schema version
const schemaVersion = database.schema.version;
console.log('Schema version:', schemaVersion);
// Should be: 20

// If migration failed:
// 1. Uninstall app
// 2. Reinstall app
// 3. Fresh sync from server
```

---

## Dead Letter Queue

### What is the DLQ?

**Purpose:** Capture items that fail repeatedly for manual intervention

**When Items Enter DLQ:**
- After 10+ failed sync attempts
- Prevents infinite retry loops
- Allows admin to investigate and fix

---

### Viewing DLQ

**Admin Screen:**
```
Navigate: Admin → Sync Monitoring → Dead Letter Queue section
```

**Programmatically:**
```typescript
const dlq = await SyncService.getDeadLetterQueue();
console.log('DLQ size:', dlq.length);

dlq.forEach(item => {
  console.log({
    table: item.tableName,
    id: item.recordId,
    error: item.lastError,
    retries: item.retryCount,
  });
});
```

---

### Clearing DLQ

**Option 1: Retry Individual Items**
```typescript
// Retry single item
await SyncService.retryDeadLetterItem('item-123');

// Retry all items
const dlq = await SyncService.getDeadLetterQueue();
for (const item of dlq) {
  await SyncService.retryDeadLetterItem(item.id);
}
```

**Option 2: Clear Entire DLQ**
```typescript
// ⚠️ Warning: Permanently removes failed items
await SyncService.clearDeadLetterQueue();
console.log('DLQ cleared');
```

---

## Debugging Tools

### Enable Verbose Logging

**In SyncService.ts:**
```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('[SyncService] syncUp: Processing', queue.length, 'items');
  console.log('[SyncService] Sending to:', API_CONFIG.BASE_URL + endpoint);
  console.log('[SyncService] Request body:', JSON.stringify(body, null, 2));
  console.log('[SyncService] Response:', response);
}
```

---

### React Native Debugger

**Enable:**
1. Install: `npm install -g react-native-debugger`
2. Run: `react-native-debugger`
3. In app: Shake device → "Debug"

**Features:**
- Console logs
- Network requests
- Redux DevTools
- Performance monitor

---

### Network Inspector

**Method 1: Chrome DevTools**
```
1. Open app in Debug mode
2. Open Chrome: chrome://inspect
3. Click "inspect" on device
4. Go to Network tab
5. Watch API requests
```

**Method 2: Flipper**
```
1. Install Flipper: https://fbflipper.com/
2. Enable Network plugin
3. View all HTTP requests
4. Inspect headers, body, response
```

---

### Database Inspector

**Method 1: Flipper Database Plugin**
```
1. Enable Databases plugin in Flipper
2. View all tables
3. Run SQL queries
4. Inspect records
```

**Method 2: Manual Query**
```typescript
// Query sync_queue table
const queue = await database.get('sync_queue')
  .query(Q.where('synced_at', null))
  .fetch();

console.log('Queue:', queue.map(q => q._raw));

// Query by sync_status
const pending = await database.get('items')
  .query(Q.where('sync_status', 'pending'))
  .fetch();

console.log('Pending items:', pending.length);
```

---

## FAQ

### Q1: How often does auto-sync run?

**A:** Auto-sync has 4 triggers:
1. **App launch:** 2 seconds after login
2. **Network change:** When offline → online (2s delay)
3. **Periodic:** Every 5 minutes while app is active
4. **App foreground:** When app returns from background (1min cooldown)

---

### Q2: What happens if I edit the same record on two devices?

**A:** Last-Write-Wins conflict resolution:
- Device with newer timestamp wins
- Other device receives winner's version
- No user intervention needed
- Data from losing device is overwritten

---

### Q3: Can I work completely offline?

**A:** Yes!
- All CRUD operations work offline
- Changes are queued locally
- When online, changes sync automatically
- No data loss if offline for days/weeks

---

### Q4: How do I know if sync is working?

**A:** Check sync indicator:
- 🟢 Green cloud: All synced
- 🟡 Yellow cloud: Currently syncing
- 🔴 Red cloud with X: Sync failed

Also check "Last synced: 5 minutes ago" text

---

### Q5: What if sync fails with "Network error"?

**A:**
1. Check internet connection
2. Verify backend is running (dev) or accessible (prod)
3. Wait - auto-retry happens automatically
4. Manual retry: Click sync button in app
5. Check dead letter queue for persistent failures

---

### Q6: How do I clear all pending changes?

**A:** ⚠️ **Warning:** This loses unsent data!
```typescript
await SyncService.clearSyncQueue();
```

Only do this if:
- Testing in development
- Data is corrupted beyond repair
- You've backed up important changes

---

### Q7: Can I sync specific models only?

**A:** Not currently implemented. Sync always includes all model types.

Future enhancement: Selective sync by project/site/model.

---

### Q8: What's the maximum offline period?

**A:** No hard limit!
- Queue has no size limit
- Can work offline for weeks
- When online: All queued changes sync
- Recommendation: Sync daily when possible

---

### Q9: How do I force a full re-sync?

**A:**
```typescript
// Clear last_sync_at timestamp
await AsyncStorage.removeItem('@sync/last_sync_at');

// Next sync will pull all records
await SyncService.syncDown();
```

---

### Q10: Why are my changes not appearing on other devices?

**A:** Check:
1. Did sync complete without errors?
2. Is sync_status set to 'pending' when making changes?
3. Is the other device also syncing?
4. Check console logs for version conflicts
5. Try manual sync on both devices

---

## Getting Help

### Support Channels

1. **Check Console Logs**
   - Most issues show error messages
   - Look for ❌ or ⚠️ symbols

2. **Admin Screen**
   - Navigate: Admin → Sync Monitoring
   - View detailed sync status
   - Check dead letter queue

3. **GitHub Issues**
   - Report bugs with console logs
   - Include network conditions
   - Specify device/OS version

4. **Development Team**
   - Provide: Error message, steps to reproduce
   - Include: Console logs, network logs
   - Specify: Environment (dev/prod)

---

## Related Documents

- `docs/sync/SYNC_ARCHITECTURE.md` - How sync works
- `docs/api/API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE_UNIFIED.md` - Overall architecture
- `DATABASE.md` - Database schema

---

**Document Status:** ✅ Complete
**Created:** October 31, 2025
**Author:** Development Team
**Activity:** Activity 2 - Week 9 Documentation

---

**END OF TROUBLESHOOTING GUIDE**
