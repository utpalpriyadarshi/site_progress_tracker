# How to Check Database Records During Testing

This guide shows you how to verify database records (sessions, password history) during manual testing.

---

## Method 1: Console Logs (Easiest - Already Working!)

The app already logs session creation. Just check your console/logcat!

### Steps:
1. **Open Metro Bundler Console** or **React Native Debugger**
2. **Login** to the app
3. **Look for these log messages:**

```
AuthService: Starting login for user: admin
AuthService: Password verified, generating tokens...
AuthService: Creating session in database...
SessionService: Creating session for user [user-id]
SessionService: Session created successfully: [session-id]
AuthService: Login successful, tokens and session stored
```

### What to Verify:
- ✅ "Session created successfully" message appears
- ✅ Session ID is shown (long alphanumeric string)
- ✅ No error messages

---

## Method 2: Test Script (Most Detailed)

Use the provided test script to inspect database records.

### Setup (One-time):
1. Open `App.tsx`
2. Add import at the top:
```typescript
import { checkLatestSession, checkAllSessions } from './scripts/testCheckSessions';
```

3. Add a button or call it after login in `AuthContext.tsx` login function:
```typescript
// In AuthContext.tsx, after successful login:
const result = await AuthService.login(username, password);
if (result.success) {
  // Add this debug line:
  import('./scripts/testCheckSessions').then(m => m.checkLatestSession());

  // ... rest of login code
}
```

### Usage:
After login, check console for detailed output:
```
========================================
DATABASE SESSION CHECK - LATEST SESSION
========================================

📊 LATEST SESSION DETAILS:
─────────────────────────────────────
✓ ID: abc123def456
✓ User ID: user-admin-001
✓ Access Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
✓ Refresh Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQ...
✓ Device Info: (empty)
✓ IP Address: (empty)
✓ Expires At: 11/5/2025, 3:15:00 PM
✓ Revoked At: Not revoked
✓ Is Active: ✅ YES
✓ Created At: 10/29/2025, 3:15:00 PM
✓ Updated At: 10/29/2025, 3:15:00 PM

🔍 SESSION STATUS:
   Is Valid: ✅ YES
   Is Expired: ✅ NO (still valid)
   Time Until Expiry: 7 days, 0 hours

========================================
```

### Available Functions:
```typescript
checkLatestSession()      // Shows most recent session (RECOMMENDED)
checkAllSessions()        // Shows ALL sessions in database
checkUserSessions(userId) // Shows sessions for specific user
checkActiveSessions()     // Shows only active sessions
quickSessionCheck()       // Alias for checkLatestSession()
fullSessionCheck()        // Shows all + active sessions
```

---

## Method 3: React Native Debugger (Advanced)

If you have React Native Debugger installed:

### Steps:
1. **Open React Native Debugger**
2. **Enable "Break on all exceptions"** (optional)
3. **Login to the app**
4. **Open Console tab** - see same logs as Method 1
5. **Add breakpoint** in `SessionService.createSession()` to inspect values

---

## Method 4: Direct Database Query (Android Only)

For Android, you can directly inspect the SQLite database.

### Steps:
1. **Find database file on device:**
```bash
adb shell "run-as com.siteprogresstracker ls /data/data/com.siteprogresstracker/files/"
```

2. **Pull database file:**
```bash
adb shell "run-as com.siteprogresstracker cat /data/data/com.siteprogresstracker/files/watermelon.db" > watermelon.db
```

3. **Open with SQLite browser:**
   - Download: https://sqlitebrowser.org/
   - Open the pulled `watermelon.db` file
   - Browse to `sessions` table
   - View records

### Query Examples:
```sql
-- View all sessions
SELECT * FROM sessions;

-- View active sessions only
SELECT * FROM sessions WHERE is_active = 1;

-- View sessions for specific user
SELECT * FROM sessions WHERE user_id = 'user-admin-001';

-- View latest session
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1;

-- Count total sessions
SELECT COUNT(*) FROM sessions;

-- View sessions with user info (join)
SELECT s.*, u.username, u.full_name
FROM sessions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
```

---

## Method 5: Add Debug Screen (Optional)

Create a hidden debug screen in the app.

### Quick Implementation:
Add this to `RoleManagementScreen.tsx` or create new debug screen:

```typescript
import { checkLatestSession } from '../../scripts/testCheckSessions';

// Add button in UI:
<Button
  mode="outlined"
  onPress={() => checkLatestSession()}
  style={{ margin: 10 }}
>
  🔍 Check Latest Session (Debug)
</Button>
```

Then tap button after login to see console output.

---

## Verification Checklist for Test 1.1.1

After login with `admin` / `Admin@2025`:

### In Console, verify you see:
- [ ] ✅ "Session created successfully" message
- [ ] ✅ Session ID displayed (e.g., `abc123def456`)
- [ ] ✅ User ID matches logged-in user
- [ ] ✅ No errors during session creation

### Session Properties (from test script or DB):
- [ ] ✅ `user_id` = logged-in user's ID
- [ ] ✅ `access_token` = populated (JWT token string)
- [ ] ✅ `refresh_token` = populated (JWT token string)
- [ ] ✅ `is_active` = true (or 1 in SQLite)
- [ ] ✅ `expires_at` = future timestamp (7 days from now)
- [ ] ✅ `revoked_at` = null (or 0 in SQLite)
- [ ] ✅ `created_at` = current timestamp
- [ ] ✅ `updated_at` = current timestamp

### AsyncStorage (Optional):
- [ ] ✅ SessionId key exists
- [ ] ✅ Value matches database session ID

---

## Troubleshooting

### "No sessions found in database"
- Make sure you logged in AFTER Week 3 implementation
- Old logins (before Day 13) won't have sessions
- Try logout and login again

### "Cannot find module './scripts/testCheckSessions'"
- Check file path: `scripts/testCheckSessions.ts` (not `src/scripts/`)
- Make sure file was created
- Restart Metro bundler

### "Table sessions does not exist"
- Database schema not migrated to v15
- Delete app and reinstall to trigger migration
- Check schema version in database

### Console logs not appearing
- Make sure Metro bundler is running
- Check correct console window (not browser console)
- Try `console.log('TEST')` to verify logging works

---

## Quick Reference

**Recommended for Testing:**
1. **Use Method 1 (Console Logs)** - Already working, no setup needed
2. **Add Method 2 (Test Script)** - For detailed verification
3. **Use Method 4 (Direct DB)** - For deep inspection if needed

**For Test 1.1.1 specifically:**
- Just check console logs after login
- Look for "Session created successfully" message
- Session ID should be displayed

---

**Created:** October 29, 2025
**Last Updated:** October 29, 2025
**Version:** 1.0
