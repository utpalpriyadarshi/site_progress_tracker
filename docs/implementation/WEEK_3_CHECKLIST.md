# Week 3 Checklist - Session Management & Password Reset

**Activity:** Activity 1 - Security Implementation
**Week:** 3 of 3 (Days 11-15)
**Focus:** Session Management & Password Reset Workflow
**Status:** 🚧 **READY TO START** (2025-10-28)
**Reference:** `ACTIVITY_1_SECURITY_IMPLEMENTATION.md`

---

## 📋 Daily Checklists

### Day 11: Sessions Database Schema & Model ⏳

**Morning Tasks:**
- [ ] Read `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` (Week 3 section, Lines 254-340)
- [ ] Verify you're on the correct branch: `git branch` (should show `feature/v2.2`)
- [ ] Review current schema version:
  ```bash
  # Check models/schema/index.ts - should be version 14
  ```
- [ ] Verify Week 2 completion (JWT tokens working)

**Afternoon Tasks:**
- [ ] Update schema: `models/schema/index.ts`
  - Add `sessions` table to schema
  - Increment version: v14 → v15
  - Add all required columns (snake_case)
- [ ] Create migration in `models/migrations/index.js`
  - Write migration logic to add sessions table (v15)
  - Use `createTable()` from WatermelonDB migrations
- [ ] Create SessionModel: `models/SessionModel.ts`
  - Extend Model class
  - Add field decorators (camelCase properties)
  - Add user relation: `@relation('users', 'user_id')`
- [ ] Register SessionModel in `models/database.ts` modelClasses array

**Sessions Table Schema:**
```typescript
sessions {
  id: string (primary key, auto-generated)
  user_id: string (foreign key → users.id, indexed)
  access_token: string
  refresh_token: string
  device_info: string (optional, keep simple)
  ip_address: string (optional, keep simple)
  expires_at: number (timestamp)
  revoked_at: number (nullable, optional)
  is_active: boolean
  created_at: number (auto-managed)
  updated_at: number (auto-managed)
}
```

**Evening Review:**
- [ ] Test schema migration runs without errors
- [ ] Verify `sessions` table exists in database
- [ ] SessionModel registered and imports correctly
- [ ] Commit changes: `git commit -m "v2.2: Add sessions table and SessionModel (Week 3, Day 11)"`

**Deliverables:**
- Updated `models/schema/index.ts` (v14 → v15)
- New `models/SessionModel.ts`
- Updated `models/migrations/index.js` (v15 migration)
- Updated `models/database.ts` (SessionModel registered)

---

### Day 12: SessionService Implementation ⏳

**Morning Tasks:**
- [ ] Create `services/auth/SessionService.ts`
- [ ] Implement `createSession()` method:
  - Parameters: userId, accessToken, refreshToken, expiresAt, deviceInfo?, ipAddress?
  - Create new session record in database
  - Set `is_active` to true
  - Return session object
- [ ] Implement `getActiveSession()` method:
  - Parameters: userId, accessToken
  - Query sessions table for matching userId and accessToken
  - Check `is_active` is true, `revoked_at` is null, `expires_at` is in future
  - Return session or null

**Afternoon Tasks:**
- [ ] Implement `validateSession()` method:
  - Parameter: sessionId
  - Fetch session by ID
  - Validate: exists, is_active, not revoked, not expired
  - Return boolean
- [ ] Implement `revokeSession()` method:
  - Parameter: sessionId
  - Update session: set `revoked_at` to now, set `is_active` to false
  - Return success boolean
- [ ] Implement `revokeAllUserSessions()` method:
  - Parameter: userId
  - Query all sessions for userId
  - Revoke all sessions
  - Used during password reset
  - Return count of revoked sessions

**Evening Tasks:**
- [ ] Implement `cleanupExpiredSessions()` method:
  - Query sessions where `expires_at` < current timestamp
  - Set `is_active` to false
  - Optional: Delete old sessions (older than 30 days)
  - Return count of cleaned sessions
- [ ] Implement `getUserActiveSessions()` method:
  - Parameter: userId
  - Query all active sessions for user
  - Return array of session objects
- [ ] Add TypeScript interfaces for session data
- [ ] Test all SessionService methods

**Evening Review:**
- [ ] All SessionService methods implemented
- [ ] TypeScript compilation successful (no errors)
- [ ] Basic tests for each method (manual console tests OK)
- [ ] Commit changes: `git commit -m "v2.2: Implement SessionService (Week 3, Day 12)"`

**Deliverables:**
- `services/auth/SessionService.ts` (~250 lines)

---

### Day 13: Integrate Sessions with Auth Flow ⏳

**Morning Tasks:**
- [ ] Update `services/auth/AuthService.ts`:
  - Import SessionService
  - In `login()` method, after token generation:
    - Calculate session expiry (from refresh token expiry)
    - Call `SessionService.createSession()`
    - Return sessionId along with tokens
- [ ] Update `services/storage/TokenStorage.ts`:
  - Add `storeSessionId(sessionId)` method
  - Add `getSessionId()` method
  - Add `clearSessionId()` method (called on logout)

**Afternoon Tasks:**
- [ ] Update `src/auth/context/AuthContext.tsx`:
  - Add `sessionId: string | null` to context state
  - Update `login()` to store sessionId
  - Update `logout()` to revoke session via SessionService
- [ ] Update `src/auth/LoginScreen.tsx`:
  - Update login flow to handle sessionId
  - Store sessionId in AsyncStorage via TokenStorage
- [ ] Test complete login flow:
  - Login creates session in database
  - SessionId stored in AsyncStorage
  - Logout revokes session

**Evening Tasks:**
- [ ] Test session validation:
  - Active sessions can be validated
  - Revoked sessions cannot be validated
  - Expired sessions cannot be validated
- [ ] Test with all 5 test users:
  - [ ] Login as admin → verify session created
  - [ ] Login as supervisor → verify session created
  - [ ] Login as manager → verify session created
  - [ ] Login as planner → verify session created
  - [ ] Login as logistics → verify session created
  - [ ] Logout for each → verify session revoked

**Evening Review:**
- [ ] Login creates session in database ✅
- [ ] SessionId stored and retrieved correctly ✅
- [ ] Logout revokes session properly ✅
- [ ] All 5 test users tested successfully ✅
- [ ] Commit changes: `git commit -m "v2.2: Integrate SessionService with auth flow (Week 3, Day 13)"`

**Deliverables:**
- Updated: `services/auth/AuthService.ts`
- Updated: `services/storage/TokenStorage.ts`
- Updated: `src/auth/context/AuthContext.tsx`
- Updated: `src/auth/LoginScreen.tsx`

**Updated Login Flow:**
```
1. User enters credentials
2. AuthService validates with bcrypt
3. TokenService generates access + refresh tokens
4. SessionService.createSession() → returns sessionId
5. Store tokens + sessionId in AsyncStorage
6. Update AuthContext with user + tokens + sessionId
7. Navigate to role-based screen
```

**Updated Logout Flow:**
```
1. User clicks logout
2. Get sessionId from AuthContext/AsyncStorage
3. SessionService.revokeSession(sessionId)
4. Clear tokens + sessionId from AsyncStorage
5. Update AuthContext (user = null)
6. Navigate to login screen
```

---

### Day 14: Password Reset Implementation ⏳

**Morning Tasks:**
- [ ] Update schema: `models/schema/index.ts`
  - Add `password_history` table to schema
  - Increment version: v15 → v16
- [ ] Create migration in `models/migrations/index.js`
  - Write migration logic to add password_history table (v16)
- [ ] Create PasswordHistoryModel: `models/PasswordHistoryModel.ts`
  - Extend Model class
  - Add field decorators: `@field('user_id') userId!: string`
  - Add field: `@field('password_hash') passwordHash!: string`
  - Add user relation: `@relation('users', 'user_id')`
- [ ] Register PasswordHistoryModel in `models/database.ts`

**Password History Table Schema:**
```typescript
password_history {
  id: string (primary key)
  user_id: string (foreign key → users.id, indexed)
  password_hash: string
  created_at: number (auto-managed)
}
```

**Afternoon Tasks:**
- [ ] Create `utils/passwordValidator.ts`:
  - Implement `validatePasswordStrength(password)` function
  - Check: min 8 chars, uppercase, lowercase, number, special char
  - Return: `{isValid: boolean, errors: string[]}`
  - Implement `isPasswordReused(newPasswordHash, oldHashes)` function
  - Use bcrypt.compare() to check against last 5 password hashes
  - Return: Promise<boolean>

**Evening Tasks:**
- [ ] Create `services/auth/PasswordResetService.ts`:
  - Implement `getPasswordHistory(userId, limit = 5)`
  - Implement `addPasswordToHistory(userId, passwordHash)`
  - Implement `validateNewPassword(userId, newPassword)`
  - Implement `resetPasswordByAdmin(userId, newPassword, adminUserId)`
  - Implement `changePasswordByUser(userId, currentPassword, newPassword)`

**PasswordResetService Methods:**
```typescript
getPasswordHistory(userId, limit = 5):
  - Query password_history for userId
  - Order by created_at DESC, limit N
  - Return array of password hashes

addPasswordToHistory(userId, passwordHash):
  - Create new password_history record
  - Return success boolean

validateNewPassword(userId, newPassword):
  - Check password strength
  - Get password history (last 5)
  - Check if password matches any old passwords
  - Return validation result

resetPasswordByAdmin(userId, newPassword, adminUserId):
  - Validate new password strength
  - Check password history (prevent reuse)
  - Hash new password with bcrypt
  - Add current password_hash to password_history
  - Update user's password_hash field
  - Revoke all user sessions (force re-login)
  - Return success with detailed result

changePasswordByUser(userId, currentPassword, newPassword):
  - Verify current password with bcrypt.compare()
  - Validate new password strength
  - Check password history (prevent reuse)
  - Hash new password with bcrypt
  - Add old password_hash to password_history
  - Update user's password_hash field
  - Revoke all OTHER sessions (keep current)
  - Return success with detailed result
```

**Evening Review:**
- [ ] Schema updated to v16
- [ ] PasswordHistoryModel created and registered
- [ ] passwordValidator.ts created with all validation rules
- [ ] PasswordResetService.ts created with all methods
- [ ] TypeScript compilation successful
- [ ] Commit changes: `git commit -m "v2.2: Implement password reset service (Week 3, Day 14)"`

**Deliverables:**
- Updated `models/schema/index.ts` (v15 → v16)
- New `models/PasswordHistoryModel.ts`
- Updated `models/migrations/index.js` (v16 migration)
- Updated `models/database.ts` (PasswordHistoryModel registered)
- New `utils/passwordValidator.ts` (~80 lines)
- New `services/auth/PasswordResetService.ts` (~300 lines)

---

### Day 15: UI Implementation & Testing ⏳

**Morning Tasks:**
- [ ] Locate admin user management screen (likely `src/admin/RoleManagementScreen.tsx`)
- [ ] Add "Reset Password" button next to each user in the user list
- [ ] Create password reset dialog/modal component:
  - New password input (with show/hide toggle)
  - Confirm password input
  - Password strength meter (visual indicator: red/yellow/green)
  - Password requirements checklist display
  - Reset button (disabled until valid password)
  - Cancel button
- [ ] Integrate PasswordResetService.resetPasswordByAdmin():
  - Call on Reset button click
  - Handle validation errors (show error messages)
  - Handle success (show success message, close dialog)

**Afternoon Tasks:**
- [ ] Create `src/auth/PasswordChangeScreen.tsx`:
  - New screen for user-initiated password changes
  - Current password input (with show/hide)
  - New password input (with show/hide)
  - Confirm new password input (with show/hide)
  - Password strength meter
  - Requirements checklist
  - Change password button
  - Cancel/back button
- [ ] Add PasswordChangeScreen to navigation:
  - Add route definition (likely in AuthNavigator or MainNavigator)
  - Add navigation link from user profile/settings menu
- [ ] Integrate PasswordResetService.changePasswordByUser():
  - Call on Change Password button click
  - Validate current password first
  - Check new password strength and confirmation
  - Handle errors and success

**Evening Tasks:**
- [ ] Test admin password reset flow:
  - [ ] Admin can view user list
  - [ ] "Reset Password" button visible for each user
  - [ ] Dialog opens with password inputs
  - [ ] Password strength meter updates in real-time
  - [ ] Weak password rejected (show error message)
  - [ ] Reused password rejected (show error message)
  - [ ] Valid password reset succeeds (show success)
  - [ ] User's sessions are revoked (verify in database)
  - [ ] User can login with new password
  - [ ] User cannot login with old password
- [ ] Test user password change flow:
  - [ ] User can navigate to password change screen
  - [ ] Wrong current password shows error
  - [ ] Weak new password rejected
  - [ ] Reused password rejected (last 5)
  - [ ] Confirm password mismatch shows error
  - [ ] Valid password change succeeds
  - [ ] User remains logged in (current session maintained)
- [ ] Create `WEEK_3_COMPLETION_SUMMARY.md`

**Evening Review:**
- [ ] Admin password reset UI complete and tested
- [ ] User password change screen complete and tested
- [ ] All validation rules working (strength, reuse, confirmation)
- [ ] Session revocation working correctly
- [ ] Password history tracking working (last 5 passwords)
- [ ] Commit changes: `git commit -m "v2.2: Complete Week 3 - Session management and password reset (Day 15)"`

**Deliverables:**
- Updated: `src/admin/RoleManagementScreen.tsx` (admin password reset)
- New: `src/auth/PasswordChangeScreen.tsx` (~300 lines)
- Updated: Navigation files (route for PasswordChangeScreen)
- New: `WEEK_3_COMPLETION_SUMMARY.md`

---

## ✅ Week 3 Deliverables Checklist

### Code Files Created:
- [ ] `models/SessionModel.ts` (~50 lines)
- [ ] `models/PasswordHistoryModel.ts` (~40 lines)
- [ ] `services/auth/SessionService.ts` (~250 lines)
- [ ] `services/auth/PasswordResetService.ts` (~300 lines)
- [ ] `utils/passwordValidator.ts` (~80 lines)
- [ ] `src/auth/PasswordChangeScreen.tsx` (~300 lines)

### Code Files Modified:
- [ ] `models/schema/index.ts` (v14 → v15 → v16)
- [ ] `models/migrations/index.js` (added v15 and v16 migrations)
- [ ] `models/database.ts` (registered SessionModel, PasswordHistoryModel)
- [ ] `services/auth/AuthService.ts` (integrated SessionService)
- [ ] `services/storage/TokenStorage.ts` (added sessionId storage)
- [ ] `src/auth/context/AuthContext.tsx` (added sessionId state)
- [ ] `src/auth/LoginScreen.tsx` (updated login flow)
- [ ] `src/admin/RoleManagementScreen.tsx` (added admin password reset)
- [ ] Navigation files (added PasswordChangeScreen route)

### Database Changes:
- [ ] Schema version: v14 → v16 (two new tables)
- [ ] New table: `sessions` (v15)
- [ ] New table: `password_history` (v16)

### Testing Completed:
- [ ] Manual testing: Session creation on login (5/5 users)
- [ ] Manual testing: Session revocation on logout (5/5 users)
- [ ] Manual testing: Session validation (active, revoked, expired)
- [ ] Manual testing: Admin password reset flow
- [ ] Manual testing: User password change flow
- [ ] Manual testing: Password strength validation
- [ ] Manual testing: Password reuse prevention (last 5)

### Documentation:
- [ ] Create `WEEK_3_COMPLETION_SUMMARY.md`
- [ ] Update `WEEK_3_CHECKLIST.md` with completion status

---

## 🚨 Common Issues & Solutions

### Issue 1: Schema migration fails with "table already exists"
**Solution:** Drop and recreate database or make migration idempotent:
```bash
# Reset database (development only)
# Uninstall and reinstall app
# Or use migrations to check if table exists first
```

### Issue 2: SessionModel not registering in database
**Solution:**
- Verify SessionModel is imported in `models/database.ts`
- Check SessionModel is added to `modelClasses` array
- Restart Metro bundler: `npm start -- --reset-cache`

### Issue 3: Password validation rejecting valid passwords
**Solution:**
- Check regex patterns in passwordValidator.ts
- Test each validation rule independently
- Log validation errors to identify which rule is failing

### Issue 4: bcrypt.compare() timing out
**Solution:**
- bcrypt is CPU-intensive (salt rounds = 12)
- This is expected and secure behavior
- Consider showing loading indicator during password validation

### Issue 5: Sessions not revoked on logout
**Solution:**
- Check SessionService.revokeSession() is called in logout flow
- Verify sessionId is retrieved from AsyncStorage correctly
- Check database to confirm revoked_at is set and is_active is false

---

## 📊 Progress Tracking

**Daily Standup Template:**
```
Yesterday: [what you completed]
Today: [what you're working on]
Blockers: [any issues]
```

**End of Week 3 Goals:**
- [ ] Sessions table created (schema v15)
- [ ] Password history table created (schema v16)
- [ ] SessionService implemented and integrated
- [ ] PasswordResetService implemented
- [ ] Admin password reset UI complete
- [ ] User password change screen complete
- [ ] All validation rules working
- [ ] Manual testing complete (5/5 users)
- [ ] Week 3 summary document created
- [ ] Ready for Activity 1 final review

---

## 🎯 Activity 1 Completion Preview

**After Week 3 Completion:**
- ✅ Week 1: Password hashing with bcrypt (COMPLETE)
- ✅ Week 2: JWT token implementation (COMPLETE)
- ✅ Week 3: Session management & password reset (IN PROGRESS)

**Next Steps (Day 16+):**
- Write comprehensive unit tests (SessionService, PasswordResetService)
- Create security documentation (SESSION_MANAGEMENT.md, PASSWORD_POLICY.md)
- Conduct security audit
- Create security audit report
- Update ARCHITECTURE_UNIFIED.md
- Activity 1 sign-off and handoff to Activity 2

---

## 🔒 Security Checklist (Week 3 Focus)

**Session Management Security:**
- [ ] Sessions stored securely in database
- [ ] Tokens not logged or exposed in console
- [ ] Expired sessions cannot be used
- [ ] Revoked sessions cannot be reactivated
- [ ] Session cleanup removes old sessions
- [ ] No session ID collision (unique IDs)
- [ ] Multiple concurrent sessions supported

**Password Reset Security:**
- [ ] No plaintext passwords in database or logs
- [ ] Password history stores only hashes
- [ ] bcrypt.compare() prevents timing attacks
- [ ] Last 5 passwords cannot be reused
- [ ] Password strength enforced for all users
- [ ] Admin actions properly logged (audit trail)
- [ ] Password reset forces session revocation
- [ ] Current password verified before change (user-initiated)

**Overall Security (Week 3 Additions):**
- [ ] Session hijacking prevented (token + session validation)
- [ ] Concurrent sessions supported (multiple devices)
- [ ] Session revocation works (logout, password reset)
- [ ] Password policies enforced consistently
- [ ] Password reuse prevented (history tracking)
- [ ] No sensitive data exposed in logs or errors

---

## 📖 Reference Documents

- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - Full activity plan
- `WEEK_1_CHECKLIST.md` - Week 1 (Password Hashing) - COMPLETE
- `WEEK_2_CHECKLIST.md` - Week 2 (JWT Tokens) - COMPLETE
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap analysis

---

**Password Strength Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Cannot be same as last 5 passwords

---

**Estimated Time:** 40 hours (5 days × 8 hours)
**Completion Target:** End of Week 3
**Next:** Activity 1 Final Review & Testing (Days 16-17)

---

**Status:** 🚧 **READY TO START WEEK 3** (2025-10-28)
**Ready to begin Day 11!**
