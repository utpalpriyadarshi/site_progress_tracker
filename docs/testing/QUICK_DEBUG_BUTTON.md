# Quick Debug Button for Testing

Add this to RoleManagementScreen to check sessions during testing.

---

## Option 1: Add Debug Button (Recommended for Testing)

### Steps:

1. **Open:** `src/admin/RoleManagementScreen.tsx`

2. **Add import at top (around line 32):**
```typescript
// Import debug functions
import {
  checkLatestSession,
  checkAllSessions,
  checkActiveSessions,
} from '../../scripts/testCheckSessions';
```

3. **Add button in the UI (after Searchbar, around line 384):**
```typescript
<Searchbar
  placeholder="Search users..."
  onChangeText={setSearchQuery}
  value={searchQuery}
  style={styles.searchbar}
/>

{/* DEBUG BUTTON - REMOVE AFTER TESTING */}
<View style={{ flexDirection: 'row', paddingHorizontal: 15, gap: 10, marginBottom: 10 }}>
  <Button
    mode="outlined"
    onPress={() => checkLatestSession()}
    icon="database-search"
    style={{ flex: 1 }}
  >
    Check Latest Session
  </Button>
  <Button
    mode="outlined"
    onPress={() => checkAllSessions()}
    icon="database"
    style={{ flex: 1 }}
  >
    Check All Sessions
  </Button>
</View>
{/* END DEBUG BUTTON */}
```

4. **Usage:**
   - Login as admin
   - Go to User & Role Management screen
   - Tap "Check Latest Session" to see most recent session
   - Tap "Check All Sessions" to see all sessions
   - Check console for detailed output

5. **After Testing:**
   - Remove or comment out the debug button code
   - Remove the import statement

---

## Option 2: Add to Login Screen (Alternative)

Add to `LoginScreen.tsx` to check immediately after login:

### Steps:

1. **Open:** `src/auth/LoginScreen.tsx`

2. **Add import:**
```typescript
import { checkLatestSession } from '../../scripts/testCheckSessions';
```

3. **In handleLogin function (after successful login):**
```typescript
const handleLogin = async () => {
  // ... existing login code ...

  if (result.success) {
    // DEBUG: Check session after login
    setTimeout(() => {
      console.log('🔍 Checking session after login...');
      checkLatestSession();
    }, 1000);

    // ... rest of code ...
  }
};
```

4. **Usage:**
   - Login normally
   - After successful login, wait 1 second
   - Check console for session details

---

## Option 3: Add to AuthContext (Most Automatic)

Automatically log session details after every login.

### Steps:

1. **Open:** `src/auth/AuthContext.tsx`

2. **Add import at top:**
```typescript
import { checkLatestSession } from '../../scripts/testCheckSessions';
```

3. **In login function (after setUser):**
```typescript
const login = async (username: string, password: string) => {
  const result = await AuthService.login(username, password);

  if (result.success && result.user) {
    setUser({
      userId: result.user.id,
      username: result.user.username,
      fullName: result.user.fullName,
      email: result.user.email,
      role: result.user.role,
    });

    // DEBUG: Automatically check session after login
    setTimeout(() => {
      console.log('🔍 AUTO-CHECK: Session after login');
      checkLatestSession();
    }, 500);
  }

  return result;
};
```

4. **Usage:**
   - Login from anywhere in the app
   - Session details automatically logged to console
   - No need to tap any buttons

---

## Full Code Example: RoleManagementScreen with Debug Buttons

```typescript
// Add import at top
import {
  checkLatestSession,
  checkAllSessions,
  checkActiveSessions,
} from '../../scripts/testCheckSessions';

// In the render/return section (around line 377-447):
return (
  <View style={styles.container}>
    <Searchbar
      placeholder="Search users..."
      onChangeText={setSearchQuery}
      value={searchQuery}
      style={styles.searchbar}
    />

    {/* DEBUG BUTTONS - WEEK 3 TESTING */}
    {__DEV__ && (
      <View style={styles.debugContainer}>
        <Paragraph style={styles.debugTitle}>
          🔧 Debug Tools (Development Only)
        </Paragraph>
        <View style={styles.debugButtons}>
          <Button
            mode="outlined"
            onPress={() => checkLatestSession()}
            icon="database-search"
            compact
          >
            Latest Session
          </Button>
          <Button
            mode="outlined"
            onPress={() => checkActiveSessions()}
            icon="check-circle"
            compact
          >
            Active Sessions
          </Button>
          <Button
            mode="outlined"
            onPress={() => checkAllSessions()}
            icon="database"
            compact
          >
            All Sessions
          </Button>
        </View>
      </View>
    )}
    {/* END DEBUG BUTTONS */}

    <ScrollView style={styles.scrollView}>
      {/* ... existing user cards ... */}
    </ScrollView>

    {/* ... rest of component ... */}
  </View>
);

// Add these styles at the bottom (around line 852):
const styles = StyleSheet.create({
  // ... existing styles ...

  // Debug styles
  debugContainer: {
    backgroundColor: '#FFF3E0',
    margin: 15,
    marginTop: 0,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});
```

**Note:** The `__DEV__` check ensures debug buttons only show in development mode, not production.

---

## Testing Workflow

### For Test 1.1.1 (Login Session Creation):

1. **Setup:** Add debug button (Option 1, 2, or 3)
2. **Login:** username: `admin`, password: `Admin@2025`
3. **Check:**
   - Tap debug button OR check console automatically
   - Verify session details appear
4. **Verify checklist items:**
   - ✅ Session ID exists
   - ✅ User ID matches admin
   - ✅ Access token populated
   - ✅ Refresh token populated
   - ✅ is_active = true
   - ✅ expires_at > current time
   - ✅ revoked_at = null

### For Test 1.3.1 (Logout Session Revocation):

1. **Login:** as admin
2. **Check session:** Tap debug button → note session ID and is_active = true
3. **Logout:** Tap Logout button
4. **Login again:** as admin
5. **Check sessions again:** Tap "Check All Sessions"
6. **Verify:**
   - Old session has revoked_at timestamp
   - Old session has is_active = false
   - New session created with is_active = true

---

## Console Output Example

After tapping "Check Latest Session", you'll see:

```
========================================
DATABASE SESSION CHECK - LATEST SESSION
========================================

📊 LATEST SESSION DETAILS:
─────────────────────────────────────
✓ ID: kx8h2j9f4m3p1q5r
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

Use this output to fill in your test checklist!

---

**Created:** October 29, 2025
**Version:** 1.0
