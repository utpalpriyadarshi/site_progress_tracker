# Activity 1: Security Implementation

**Phase:** Phase 1 - Critical Path
**Activity Duration:** 3 weeks (15 working days)
**Priority:** 🔴 CRITICAL - Production Blocker
**Prerequisites:** None (first activity in Phase 1)
**Depends On:** None
**Blocks:** Activity 2 (SyncService needs secure authentication)

---

## 📋 Overview

### Current State (Gap Analysis Reference: Lines 193-211)

**Critical Security Vulnerabilities:**
- ❌ Passwords stored as **plaintext** in database
- ❌ No JWT authentication
- ❌ No session management
- ❌ No password reset workflow
- ❌ Security Score: **1/10**

**Impact:** Cannot deploy to production - major security vulnerability, legal/compliance risk

### Target State

**After Activity 1 Completion:**
- ✅ Passwords hashed with bcrypt (salt rounds: 12)
- ✅ JWT token authentication with access + refresh tokens
- ✅ Session management with token expiration
- ✅ Password reset workflow (email or admin-assisted)
- ✅ Security Score: **9/10**

---

## 🎯 Objectives

1. **Eliminate plaintext password storage**
   - Migrate existing passwords to bcrypt hashes
   - Update login logic to use hash comparison
   - Ensure backward compatibility during migration

2. **Implement JWT authentication**
   - Generate access tokens (15min expiry)
   - Generate refresh tokens (7 days expiry)
   - Token validation middleware
   - Token refresh endpoint

3. **Add session management**
   - Store active sessions in database
   - Track device/IP for security monitoring
   - Implement session expiry and cleanup
   - Support multiple concurrent sessions per user

4. **Create password reset workflow**
   - Admin-assisted password reset (Phase 1)
   - Email-based reset (Phase 2 - requires email service)
   - Password strength validation
   - Password history (prevent reuse)

---

## 📊 Gap Analysis Alignment

**Reference:** `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` Section "4. Security Vulnerabilities" (Lines 193-211)

**Gap Analysis Estimates:**
- Effort: 2-3 weeks ✅
- Tasks identified: 4 tasks ✅
- Priority: CRITICAL ✅

**This Activity Addresses:**
- Password hashing with bcrypt (3 days) → Week 1
- JWT token implementation (1 week) → Week 2
- Session management & refresh tokens (3 days) → Week 2-3
- Password reset workflow (3 days) → Week 3

---

## 🗓️ Week-by-Week Implementation Plan

### **Week 1: Password Hashing & Migration**

#### Days 1-2: Setup & Schema Updates
**Tasks:**
- [ ] Install dependencies: `bcrypt`, `@types/bcrypt`
- [ ] Update database schema (add `password_hash` field to users table)
- [ ] Create migration script: `migrations/v13_add_password_hashing.ts`
- [ ] Update `UserModel` with `passwordHash` field
- [ ] Increment schema version: v12 → v13

**Deliverables:**
- Updated schema file: `models/schema/index.ts`
- Migration file: `models/migrations/v13_add_password_hashing.ts`
- Updated model: `models/UserModel.ts`

**Files to Modify:**
```
models/schema/index.ts
models/UserModel.ts
models/migrations/v13_add_password_hashing.ts (new)
```

**Acceptance Criteria:**
- Schema migration runs without errors
- `password_hash` field added to users table
- Existing `password` field retained for migration

---

#### Days 3-4: Password Migration Script
**Tasks:**
- [ ] Create `PasswordMigrationService.ts`
- [ ] Hash all existing plaintext passwords
- [ ] Verify hash comparison works for all users
- [ ] Add rollback capability (keep plaintext until verified)
- [ ] Test with all default users (manager, supervisor, planner, admin)

**Deliverables:**
- Service: `services/auth/PasswordMigrationService.ts`
- Migration script can be run from Admin panel
- Verification report showing all passwords migrated

**Migration Logic:**
```typescript
// For each user:
1. Read plaintext password
2. Generate bcrypt hash (salt rounds: 12)
3. Store hash in password_hash field
4. Verify hash matches original password
5. Mark user as migrated
6. After all users verified, remove password field
```

**Acceptance Criteria:**
- All test users can login with existing passwords
- Password hashes are unique (different salts)
- Migration can be safely rolled back
- Migration takes < 1 second for test dataset

---

#### Day 5: Update Login Logic
**Tasks:**
- [ ] Update `AuthService.login()` to use bcrypt.compare()
- [ ] Add password strength validation for new users
- [ ] Update `RoleManagementScreen` to hash passwords on creation
- [ ] Test login flow with hashed passwords
- [ ] Remove plaintext password field from schema (migration complete)

**Deliverables:**
- Updated: `services/auth/AuthService.ts`
- Updated: `src/admin/RoleManagementScreen.tsx`
- Final migration: `migrations/v14_remove_plaintext_password.ts`

**Files to Modify:**
```
services/auth/AuthService.ts
src/admin/RoleManagementScreen.tsx
models/schema/index.ts (remove password field)
models/migrations/v14_remove_plaintext_password.ts (new)
```

**Acceptance Criteria:**
- Login works with bcrypt hashed passwords
- New users created with hashed passwords only
- No plaintext passwords remain in database
- All 4 test users can login successfully

---

### **Week 2: JWT Token Implementation**

#### Days 6-8: JWT Infrastructure
**Tasks:**
- [ ] Install dependencies: `jsonwebtoken`, `@types/jsonwebtoken`
- [ ] Create JWT configuration file (secret keys, expiry times)
- [ ] Implement `TokenService.generateAccessToken()`
- [ ] Implement `TokenService.generateRefreshToken()`
- [ ] Create token validation middleware
- [ ] Add token storage in AsyncStorage (client-side)

**Deliverables:**
- Service: `services/auth/TokenService.ts`
- Config: `config/jwt.config.ts`
- Middleware: `services/auth/TokenValidationMiddleware.ts` (for future API)

**JWT Configuration:**
```typescript
ACCESS_TOKEN_EXPIRY: '15m'
REFRESH_TOKEN_EXPIRY: '7d'
ACCESS_TOKEN_SECRET: <generated>
REFRESH_TOKEN_SECRET: <generated>
```

**Token Payload:**
```typescript
{
  userId: string
  username: string
  role: string
  sessionId: string
  iat: number
  exp: number
}
```

**Acceptance Criteria:**
- Tokens generated successfully on login
- Tokens stored in AsyncStorage
- Token validation works correctly
- Expired tokens are rejected

---

#### Days 9-10: Login Flow Integration
**Tasks:**
- [ ] Update `AuthService.login()` to return JWT tokens
- [ ] Store tokens in AsyncStorage on successful login
- [ ] Update `AuthContext` to include token state
- [ ] Add token refresh logic (when access token expires)
- [ ] Test token-based authentication flow

**Deliverables:**
- Updated: `services/auth/AuthService.ts`
- Updated: `src/auth/context/AuthContext.tsx`
- Token refresh logic implemented

**Files to Modify:**
```
services/auth/AuthService.ts
src/auth/context/AuthContext.tsx
```

**Login Flow (Updated):**
```
1. User enters credentials
2. AuthService validates with bcrypt
3. Generate access + refresh tokens
4. Store tokens in AsyncStorage
5. Update AuthContext with user + tokens
6. Navigate to role-based screen
```

**Acceptance Criteria:**
- Login returns both access and refresh tokens
- Tokens stored securely in AsyncStorage
- AuthContext maintains token state
- Logout clears tokens from storage

---

### **Week 3: Session Management & Password Reset**

#### Days 11-12: Session Management
**Tasks:**
- [ ] Create `sessions` database table
- [ ] Create `SessionModel.ts`
- [ ] Update schema to v15
- [ ] Implement `SessionService.createSession()`
- [ ] Implement `SessionService.validateSession()`
- [ ] Implement `SessionService.revokeSession()`
- [ ] Add session cleanup job (delete expired sessions)

**Deliverables:**
- Model: `models/SessionModel.ts`
- Service: `services/auth/SessionService.ts`
- Schema migration: `migrations/v15_add_sessions_table.ts`

**Sessions Table Schema:**
```typescript
sessions {
  id: string (primary key)
  user_id: string (foreign key → users)
  access_token: string
  refresh_token: string
  device_info: string (JSON)
  ip_address: string
  created_at: number
  expires_at: number
  revoked_at: number (nullable)
  is_active: boolean
}
```

**Acceptance Criteria:**
- Sessions created on login
- Sessions validated on API requests (future)
- Sessions can be revoked (logout)
- Expired sessions cleaned up automatically

---

#### Days 13-14: Password Reset Workflow
**Tasks:**
- [ ] Create `PasswordResetService.ts`
- [ ] Add admin-assisted reset in `RoleManagementScreen`
- [ ] Add password strength validator
- [ ] Add password history table (prevent reuse)
- [ ] Test password reset flow
- [ ] Add password change screen (user-initiated)

**Deliverables:**
- Service: `services/auth/PasswordResetService.ts`
- Updated: `src/admin/RoleManagementScreen.tsx`
- New screen: `src/auth/PasswordChangeScreen.tsx`
- Table: `password_history` (store last 5 password hashes)

**Password Strength Rules:**
```
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)
- Cannot be same as last 5 passwords
```

**Password Reset Flow (Admin-Assisted):**
```
1. Admin navigates to RoleManagement
2. Selects user and clicks "Reset Password"
3. Admin enters new password (must meet strength rules)
4. System hashes new password
5. System stores old hash in password_history
6. System updates user's password_hash
7. System invalidates all user sessions
8. User must login with new password
```

**Acceptance Criteria:**
- Admin can reset user passwords
- Password strength validation enforced
- Old passwords cannot be reused (last 5)
- All user sessions revoked on password reset
- User-initiated password change works

---

#### Day 15: Testing & Documentation
**Tasks:**
- [ ] Write unit tests for `TokenService`
- [ ] Write unit tests for `SessionService`
- [ ] Write unit tests for `PasswordResetService`
- [ ] Write integration tests for login flow
- [ ] Conduct security audit (manual testing)
- [ ] Update `ARCHITECTURE_UNIFIED.md` with security implementation
- [ ] Create security documentation

**Deliverables:**
- Test suite: `__tests__/services/auth/`
- Security audit report: `docs/security/SECURITY_AUDIT_REPORT.md`
- Updated architecture docs

**Security Audit Checklist:**
- [ ] No plaintext passwords in database
- [ ] Bcrypt salt rounds appropriate (12+)
- [ ] JWT secrets are strong (256-bit)
- [ ] Tokens expire appropriately (15m / 7d)
- [ ] Refresh token rotation implemented
- [ ] Sessions can be revoked
- [ ] Password reset invalidates sessions
- [ ] Password strength enforced
- [ ] No sensitive data in JWT payload
- [ ] Tokens stored securely (AsyncStorage)

**Acceptance Criteria:**
- All unit tests passing (coverage > 80%)
- Integration tests passing
- Security audit score: 9/10
- Documentation complete

---

## 🧪 Testing Strategy

### Unit Tests
**Target Coverage: 80%+**

**Files to Test:**
- `services/auth/AuthService.ts` - Login, logout, token validation
- `services/auth/TokenService.ts` - Token generation, validation, refresh
- `services/auth/SessionService.ts` - Session CRUD, expiry, revocation
- `services/auth/PasswordResetService.ts` - Reset flow, validation
- `services/auth/PasswordMigrationService.ts` - Migration logic

**Test Cases:**
```typescript
AuthService:
  ✓ Login with correct credentials succeeds
  ✓ Login with incorrect credentials fails
  ✓ Login returns access + refresh tokens
  ✓ Logout clears tokens and revokes session
  ✓ Token refresh works with valid refresh token
  ✓ Token refresh fails with invalid refresh token

TokenService:
  ✓ Generate access token with correct payload
  ✓ Generate refresh token with correct payload
  ✓ Validate token with correct signature
  ✓ Reject token with invalid signature
  ✓ Reject expired token
  ✓ Token contains correct user info

SessionService:
  ✓ Create session on login
  ✓ Validate active session
  ✓ Reject revoked session
  ✓ Reject expired session
  ✓ Cleanup expired sessions

PasswordResetService:
  ✓ Reset password with valid new password
  ✓ Reject weak passwords
  ✓ Reject reused passwords (last 5)
  ✓ Invalidate sessions on password reset
  ✓ Password history stored correctly
```

---

### Integration Tests
**Test Complete User Flows**

**Test Scenarios:**
1. **New User Creation Flow**
   - Admin creates user with password
   - Password is hashed (not plaintext)
   - User can login with password
   - Tokens generated correctly

2. **Login Flow**
   - User enters credentials
   - Bcrypt comparison succeeds
   - Access + refresh tokens generated
   - Session created in database
   - User navigated to correct role screen

3. **Token Refresh Flow**
   - Access token expires
   - Client sends refresh token
   - New access token generated
   - Session updated with new token

4. **Password Reset Flow**
   - Admin resets user password
   - Old password hash stored in history
   - New password hash saved
   - All user sessions revoked
   - User can login with new password
   - User cannot reuse old password

5. **Logout Flow**
   - User clicks logout
   - Tokens cleared from AsyncStorage
   - Session revoked in database
   - User navigated to login screen

---

### Manual Security Testing

**Checklist:**
- [ ] Inspect database: verify no plaintext passwords
- [ ] Attempt login with wrong password: should fail
- [ ] Attempt login with correct password: should succeed
- [ ] Verify JWT tokens in AsyncStorage (DevTools)
- [ ] Manually expire access token: verify refresh works
- [ ] Manually expire refresh token: verify logout occurs
- [ ] Reset password: verify old password doesn't work
- [ ] Create weak password: verify rejection
- [ ] Attempt to reuse password: verify rejection
- [ ] Logout: verify tokens cleared
- [ ] Check sessions table: verify active sessions tracked

---

## 📦 Deliverables Checklist

### Code Deliverables
- [ ] `models/UserModel.ts` - Updated with `passwordHash` field
- [ ] `models/SessionModel.ts` - New session management model
- [ ] `models/PasswordHistoryModel.ts` - Password reuse prevention
- [ ] `services/auth/AuthService.ts` - Updated login/logout logic
- [ ] `services/auth/TokenService.ts` - JWT generation and validation
- [ ] `services/auth/SessionService.ts` - Session management
- [ ] `services/auth/PasswordResetService.ts` - Password reset logic
- [ ] `services/auth/PasswordMigrationService.ts` - One-time migration
- [ ] `src/admin/RoleManagementScreen.tsx` - Admin password reset
- [ ] `src/auth/PasswordChangeScreen.tsx` - User password change
- [ ] `src/auth/context/AuthContext.tsx` - Updated with tokens
- [ ] `config/jwt.config.ts` - JWT configuration

### Schema Deliverables
- [ ] `migrations/v13_add_password_hashing.ts`
- [ ] `migrations/v14_remove_plaintext_password.ts`
- [ ] `migrations/v15_add_sessions_table.ts`
- [ ] `migrations/v16_add_password_history_table.ts`
- [ ] Schema version: v12 → v16

### Testing Deliverables
- [ ] `__tests__/services/auth/AuthService.test.ts`
- [ ] `__tests__/services/auth/TokenService.test.ts`
- [ ] `__tests__/services/auth/SessionService.test.ts`
- [ ] `__tests__/services/auth/PasswordResetService.test.ts`
- [ ] Integration test suite

### Documentation Deliverables
- [ ] `docs/security/SECURITY_AUDIT_REPORT.md`
- [ ] `docs/security/JWT_IMPLEMENTATION.md`
- [ ] `docs/security/PASSWORD_POLICY.md`
- [ ] Updated `ARCHITECTURE_UNIFIED.md` (authentication section)

---

## 🚨 Risk Management

### Risk 1: Migration Breaking Login
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Keep plaintext password field until migration verified
- Test migration on copy of database first
- Add rollback script
- Migration can be run multiple times (idempotent)

**Contingency:**
- If migration fails, rollback to plaintext
- Fix issues and retry migration
- Worst case: 1 day delay

---

### Risk 2: JWT Secret Compromise
**Probability:** Low
**Impact:** High
**Mitigation:**
- Generate strong secrets (256-bit random)
- Store secrets in environment variables (not committed to git)
- Add `.env` file with secrets to `.gitignore`
- Document secret rotation procedure

**Contingency:**
- If secrets leaked, rotate immediately
- Invalidate all existing sessions
- Force all users to re-login

---

### Risk 3: Token Expiry Too Aggressive
**Probability:** Medium
**Impact:** Low
**Mitigation:**
- Start with conservative expiry (15m access, 7d refresh)
- Monitor user complaints about frequent logouts
- Easy to adjust in config file
- Implement "remember me" option later

**Contingency:**
- Extend access token to 1 hour if users complain
- Extend refresh token to 30 days for "remember me"

---

### Risk 4: Password Reset Workflow Unclear
**Probability:** Low
**Impact:** Low
**Mitigation:**
- Start with admin-assisted reset (simple)
- Document process clearly
- Add email-based reset in Phase 2

**Contingency:**
- If admin-assisted is insufficient, prioritize email reset
- Can be added in 2-3 days

---

## 🎯 Acceptance Criteria

### Activity 1 is complete when:

#### Security Requirements
- [ ] Zero plaintext passwords in database
- [ ] All passwords hashed with bcrypt (salt rounds 12+)
- [ ] JWT tokens generated on login
- [ ] Tokens stored securely in AsyncStorage
- [ ] Access token expiry: 15 minutes
- [ ] Refresh token expiry: 7 days
- [ ] Sessions tracked in database
- [ ] Sessions can be revoked
- [ ] Password reset workflow functional
- [ ] Password strength validation enforced
- [ ] Password history prevents reuse (last 5)

#### Functional Requirements
- [ ] All 4 test users can login with existing passwords
- [ ] Login returns valid JWT tokens
- [ ] Token refresh works automatically
- [ ] Logout clears tokens and revokes session
- [ ] Admin can reset user passwords
- [ ] Users can change their own passwords
- [ ] Weak passwords are rejected
- [ ] Reused passwords are rejected

#### Testing Requirements
- [ ] Unit test coverage > 80%
- [ ] All integration tests passing
- [ ] Manual security audit completed
- [ ] Security score: 9/10

#### Documentation Requirements
- [ ] Security audit report completed
- [ ] JWT implementation documented
- [ ] Password policy documented
- [ ] Architecture docs updated

---

## 📞 Stakeholder Sign-Off

**Activity Owner:** [Name]
**Reviewer:** [Name]
**Security Auditor:** [Name]
**Approved By:** [Name]
**Approval Date:** [Date]

---

## 🔄 Dependencies for Next Activity

**Activity 2: SyncService Implementation**

Activity 2 **depends on** Activity 1 because:
- SyncService needs JWT tokens for API authentication
- Backend API will validate JWT tokens
- Session management needed for sync token handling

**Blockers Removed:**
- ✅ Secure authentication system in place
- ✅ JWT tokens can be sent in API requests
- ✅ Session tracking prevents unauthorized sync

**Can Start Activity 2 When:**
- Activity 1 fully complete and tested
- Security audit passed
- All acceptance criteria met

---

## 📚 Reference Documents

- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap Analysis (Lines 193-211)
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `ARCHITECTURE_UNIFIED.md` - Current architecture
- `DATABASE.md` - Database schema reference

---

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Created:** October 26, 2025
**Estimated Start:** [Date]
**Estimated Completion:** [Date + 3 weeks]
**Owner:** Development Team

---

**END OF ACTIVITY 1: SECURITY IMPLEMENTATION**
