# Password Reset Hybrid Approach - Implementation Plan v1.1
## Enhanced Admin-Assisted Reset + Backup Codes

**Version:** 1.1
**Date:** 2025-12-20 (Updated)
**Original Date:** 2025-12-19
**Status:** Ready for Implementation
**Target Version:** v2.16

---

## ⚡ What's New in v1.1 (December 20, 2025)

### Critical Updates
- ✅ **50% of Phase 1 Backend Already Implemented** - PasswordResetService exists and works!
- ✅ **Migration Numbers Corrected** - Now v33, v34 (was v30, v31) to avoid conflicts
- ✅ **Phase 0 Added** - Logging & Security Infrastructure (4-6 hours pre-work)
- ✅ **Timeline Revised** - Phase 1 now 1.5-2 days (was 3 days) due to existing backend
- ✅ **Architecture Alignment** - Leverages shared components from Supervisor Improvements (Phase 1-3)
- ✅ **Security Hardening** - Added RateLimitService and SecurityAuditService
- ⚠️ **Critical Gap Fixed** - AuthService & PasswordResetService not using LoggingService

### Changes Summary
| Section | Change | Impact |
|---------|--------|--------|
| **Database Migrations** | v30→v33, v31→v34 | Avoids conflict with existing v32 |
| **Phase 1 Timeline** | 3 days → 1.5-2 days | Backend already exists |
| **Service Layer** | Added RateLimitService, SecurityAuditService | Better security |
| **UI Components** | Use shared components (FormDialog, etc.) | Faster development |
| **Total Effort** | 10 days → 8-10 days | Leveraging existing work |

---

## 📋 Executive Summary

This document outlines the implementation plan for a hybrid password reset solution that combines:
1. **Enhanced Admin-Assisted Reset** - Improved workflow with temporary passwords
2. **Backup Codes System** - Self-service recovery mechanism

This approach maintains the app's offline-first architecture while providing both self-service and admin-assisted password recovery options.

### ✅ What's Already Implemented (v2.2)

**Existing Infrastructure:**
- ✅ **PasswordResetService** (services/auth/PasswordResetService.ts)
  - `resetPasswordByAdmin()` - Admin can reset user passwords
  - `changePasswordByUser()` - Users can change own password
  - `validateNewPassword()` - Password strength + reuse validation
  - `getPasswordHistory()` - Tracks last 5 passwords
  - Session revocation on password change
- ✅ **Password History Tracking** - Database table `password_history` exists
- ✅ **Admin UI for Password Reset** - RoleManagementScreen has reset dialog
- ✅ **Password Validation** - Strength requirements + reuse prevention
- ✅ **Bcrypt Hashing** - 12 rounds for passwords (production-ready)
- ✅ **Session Management** - SessionService integration

**What Still Needs to Be Built:**
- ❌ Temporary password system (24hr expiry)
- ❌ "Forgot Password" button on LoginScreen
- ❌ Backup codes generation/validation
- ❌ Database tables: password_reset_requests, backup_codes
- ❌ UserModel fields: requires_password_change, backup_codes_generated
- ❌ Rate limiting service
- ❌ Security audit logging

---

## Problem Statement

**Current Challenge:**
- Supervisors who forget passwords have no self-service recovery option
- Must contact admin for password reset (productivity loss)
- No "Forgot Password" UI on login screen
- Admin becomes bottleneck for password resets

**Business Impact:**
- Reduced productivity during password issues
- Poor user experience vs. modern apps
- Admin overhead for routine password resets
- Potential security risks (credential sharing to avoid reset hassle)

---

## Solution Architecture

### 🔴 Phase 0: Logging & Security Infrastructure (NEW)
**Pre-work - 4-6 hours**

Fix critical gaps before implementation:
1. Migrate AuthService console.log → LoggingService (1-2 hours)
2. Migrate PasswordResetService console.log → LoggingService (1 hour)
3. Create RateLimitService.ts (2-3 hours)
4. Create SecurityAuditService.ts skeleton (1 hour)

**Why This Matters:**
- Password reset operations MUST be auditable for security
- Rate limiting prevents brute force attacks
- Consistent logging across all auth services

### Phase 1: Enhanced Admin-Assisted Reset
**Accelerated Timeline - 1.5-2 days (was 3 days)**

Improve existing admin reset flow with:
- "Forgot Password" button on login screen
- Admin notification/request system
- Temporary password generation (24hr expiry)
- Force password change on first login with temp password

**Why Faster:**
- ✅ Backend already exists (PasswordResetService.resetPasswordByAdmin)
- ✅ UI already exists (RoleManagementScreen password reset dialog)
- ✅ Shared components available (FormDialog, ConfirmDialog, LoadingOverlay)
- ✅ Only need to add temporary password logic

### Phase 2: Backup Codes System
**Original Timeline - 3-4 days**

Implement industry-standard backup codes:
- Generate 8 one-time backup codes during account creation
- Supervisor can download/print codes
- "Use Backup Code" option on login screen
- Force password reset after using backup code
- Admin can regenerate codes if lost

---

## Technical Architecture

### Database Schema Changes

#### 1. New Table: `backup_codes`
```sql
CREATE TABLE backup_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,        -- Bcrypt hashed backup code
  is_used BOOLEAN DEFAULT 0,      -- Whether code has been used
  used_at INTEGER,                -- Timestamp when used
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_backup_codes_user_id ON backup_codes(user_id);
CREATE INDEX idx_backup_codes_is_used ON backup_codes(is_used);
```

#### 2. New Table: `password_reset_requests`
```sql
CREATE TABLE password_reset_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  requested_by TEXT NOT NULL,     -- 'self' or admin user ID
  request_type TEXT NOT NULL,     -- 'admin_reset', 'backup_code', 'temp_password'
  status TEXT NOT NULL,           -- 'pending', 'completed', 'expired', 'cancelled'
  temp_password_hash TEXT,        -- Temporary password hash (if applicable)
  temp_password_expires_at INTEGER, -- 24hr expiry
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user_id ON password_reset_requests(user_id);
CREATE INDEX idx_password_reset_status ON password_reset_requests(status);
```

#### 3. Update `users` table
```sql
ALTER TABLE users ADD COLUMN requires_password_change BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN backup_codes_generated BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN backup_codes_generated_at INTEGER;
```

#### 4. New Table: `security_audit_log` (v1.1 - NEW)
```sql
CREATE TABLE security_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  admin_id TEXT,                  -- Admin who performed action (if applicable)
  event_type TEXT NOT NULL,       -- 'backup_code_generated', 'temp_password_generated', etc.
  event_status TEXT NOT NULL,     -- 'success', 'failure'
  ip_address TEXT,
  device_info TEXT,
  metadata TEXT,                  -- JSON blob with additional context
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_created_at ON security_audit_log(created_at);
```

### Service Layer

#### ✅ Existing Services (No Changes Needed)
**PasswordResetService.ts** (services/auth/) - **ALREADY EXISTS**
```typescript
class PasswordResetService {
  // ✅ Already implemented
  resetPasswordByAdmin(userId, newPassword, adminUserId): Promise<PasswordResetResult>
  changePasswordByUser(userId, currentPassword, newPassword, sessionId?): Promise<PasswordResetResult>
  validateNewPassword(userId, newPassword): Promise<PasswordValidationCheck>
  getPasswordHistory(userId, limit): Promise<string[]>
  addPasswordToHistory(userId, passwordHash): Promise<boolean>
}
```

**AuthService.ts** (services/auth/) - **EXISTS, NEEDS UPDATES**
```typescript
class AuthService {
  // ✅ Already implemented
  login(username, password): Promise<LoginResult>
  logout(): Promise<LogoutResult>
  refreshAccessToken(refreshToken): Promise<RefreshResult>

  // ❌ NEW - To be added
  loginWithTemporaryPassword(username, tempPassword): Promise<LoginResult>
  loginWithBackupCode(username, backupCode): Promise<LoginResult>
}
```

#### New Services to Create

**1. PasswordResetRequestService.ts** (`services/auth/`)
```typescript
class PasswordResetRequestService {
  // Generate temporary password (16 chars, 24hr expiry)
  generateTemporaryPassword(userId: string, adminId: string): Promise<TempPasswordResult>

  // Validate temporary password (check expiry, hash)
  validateTemporaryPassword(userId: string, password: string): Promise<ValidationResult>

  // Create password reset request record
  createResetRequest(userId: string, requestedBy: string, type: string): Promise<string>

  // Get pending requests for admin dashboard
  getPendingRequests(): Promise<PasswordResetRequest[]>

  // Complete reset request
  completeResetRequest(requestId: string): Promise<boolean>

  // Cancel reset request
  cancelResetRequest(requestId: string): Promise<boolean>
}
```

**2. BackupCodeService.ts** (`services/auth/`)
```typescript
class BackupCodeService {
  // Generate 8 backup codes for user
  generateBackupCodes(userId: string): Promise<BackupCodeResult>

  // Validate backup code (checks hash, not used)
  validateBackupCode(userId: string, code: string): Promise<ValidationResult>

  // Mark code as used
  markCodeAsUsed(codeId: string): Promise<boolean>

  // Get remaining codes count for user
  getRemainingCodesCount(userId: string): Promise<number>

  // Regenerate all codes (admin only)
  regenerateBackupCodes(userId: string, adminId: string): Promise<BackupCodeResult>

  // Check if user has backup codes
  hasBackupCodes(userId: string): Promise<boolean>
}
```

**3. RateLimitService.ts** (`services/auth/`) - **v1.1 NEW**
```typescript
class RateLimitService {
  // Check if user can attempt backup code login
  checkBackupCodeAttempts(userId: string): Promise<{ allowed: boolean; remainingAttempts: number }>

  // Check if admin can generate temporary password
  checkTempPasswordGeneration(adminId: string): Promise<{ allowed: boolean; remainingToday: number }>

  // Lock account after too many failed attempts
  lockAccount(userId: string, reason: string): Promise<void>

  // Unlock account (admin only)
  unlockAccount(userId: string, adminId: string): Promise<void>

  // Reset rate limit counters
  resetRateLimits(userId: string): Promise<void>
}
```

**4. SecurityAuditService.ts** (`services/auth/`) - **v1.1 NEW**
```typescript
class SecurityAuditService {
  // Log security event
  logEvent(userId: string, eventType: string, status: string, metadata?: any): Promise<void>

  // Get audit log for user
  getUserAuditLog(userId: string, limit?: number): Promise<SecurityAuditLog[]>

  // Get recent security events
  getRecentEvents(hours: number): Promise<SecurityAuditLog[]>

  // Check for suspicious activity
  detectSuspiciousActivity(userId: string): Promise<{ isSuspicious: boolean; reasons: string[] }>
}
```

### UI Components

#### New Screens

**1. ForgotPasswordScreen.tsx** (`src/auth/`)
- Username input
- Options: "Use Backup Code" or "Contact Admin"
- Instructions for admin contact
- Backup code input (if selected)
- Submit button
- **v1.1:** Use FormDialog component (from shared components)

**2. BackupCodesDisplayScreen.tsx** (`src/auth/`)
- Display 8 generated codes in grid
- Download as text file button
- Print button
- Copy all button
- "I've saved my codes" checkbox + Continue
- **v1.1:** Use LoadingOverlay during generation

**3. TemporaryPasswordScreen.tsx** (Admin only - `src/admin/`)
- User selection
- Generate temporary password button
- Display generated password (copy, send via secure channel)
- Expiry time display (24 hours countdown)
- Option to revoke temp password
- **v1.1:** Use FormDialog + ConfirmDialog components

**4. PasswordResetDashboard.tsx** (Admin only - `src/admin/`)
- List of pending reset requests
- User info, request time, request type
- Actions: Generate temp password, Regenerate backup codes
- Filter by status (pending, completed, expired)
- **v1.1:** Use EmptyState when no requests

#### Updated Screens

**1. Update LoginScreen.tsx**
```typescript
// Add below password input
<TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
  <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
</TouchableOpacity>

// Add backup code option
<View style={styles.alternateLoginSection}>
  <Text style={styles.orText}>Or</Text>
  <TouchableOpacity
    style={styles.backupCodeButton}
    onPress={() => setShowBackupCodeInput(true)}
  >
    <Text style={styles.backupCodeButtonText}>Use Backup Code</Text>
  </TouchableOpacity>
</View>
```

**2. Update RoleManagementScreen.tsx** (Admin)
```typescript
// Add in user card menu (already has password reset - add temp password option)
<Menu.Item
  onPress={() => handleGenerateTempPassword(user)}
  title="Generate Temporary Password"
  leadingIcon="key-variant"
/>
<Menu.Item
  onPress={() => handleRegenerateBackupCodes(user)}
  title="Regenerate Backup Codes"
  leadingIcon="shield-refresh"
/>
```

**3. Update ProfileScreen.tsx** (All Roles)
```typescript
// Add backup codes section
<Card style={styles.section}>
  <Card.Content>
    <Title>Backup Codes</Title>
    <Paragraph>
      {backupCodesGenerated
        ? `${remainingCodes} of 8 codes remaining`
        : 'No backup codes generated'}
    </Paragraph>
    <Button
      mode="outlined"
      onPress={() => navigation.navigate('BackupCodesDisplay')}
      disabled={!backupCodesGenerated}
    >
      View Backup Codes Status
    </Button>
  </Card.Content>
</Card>
```

---

## Implementation Phases

### 🔴 Phase 0: Infrastructure Preparation (Day 0 - 4-6 hours)

#### Critical Pre-work Checklist
**Tasks:**
1. ✅ Migrate AuthService to LoggingService (1-2 hours)
   - Replace all console.log → logger.debug/info
   - Replace all console.error → logger.error
   - Add context metadata (userId, username, action)

2. ✅ Migrate PasswordResetService to LoggingService (1 hour)
   - Replace console statements
   - Add security context (adminId, userId, password change reason)

3. ✅ Create RateLimitService.ts (2-3 hours)
   - Implement checkBackupCodeAttempts()
   - Implement checkTempPasswordGeneration()
   - Store rate limit data in AsyncStorage
   - Add exponential backoff logic

4. ✅ Create SecurityAuditService.ts skeleton (1 hour)
   - Define event types enum
   - Create logEvent() method
   - Database schema for security_audit_log

5. ✅ Update migration numbers in this document
   - Change v30 → v33
   - Change v31 → v34

**Deliverables:**
- Consistent logging across all auth services
- RateLimitService ready for integration
- SecurityAuditService structure defined
- Updated implementation plan (this document v1.1)

**Success Criteria:**
- ✅ No console.log in AuthService.ts
- ✅ No console.log in PasswordResetService.ts
- ✅ RateLimitService unit tests passing
- ✅ All logger calls include context metadata

---

### Phase 1: Enhanced Admin-Assisted Reset (Days 1-2)

#### Day 1: Temporary Password System (6-8 hours)
**Morning (4 hours):**
1. Create migration `v33_password_reset_system.ts`
   - Add `password_reset_requests` table
   - Add `security_audit_log` table (v1.1 - NEW)
   - Add columns to `users` table (`requires_password_change`)

2. Create `PasswordResetRequestService.ts`
   - Implement temporary password generation (16-char crypto-random)
   - Implement validation logic (check expiry, bcrypt hash)
   - Add request tracking
   - **v1.1:** Integrate with RateLimitService
   - **v1.1:** Integrate with SecurityAuditService

3. Update `AuthService.ts`
   - Add `loginWithTemporaryPassword()` method
   - Add middleware to check `requires_password_change` flag
   - **v1.1:** Use logger.* instead of console.*

**Afternoon (2-4 hours):**
4. Create `PasswordResetRequestModel.ts` (WatermelonDB model)
5. Update `UserModel.ts` (add requires_password_change field)
6. Write unit tests for PasswordResetRequestService
7. Test migration on dev database

**Deliverables:**
- Migration file v33
- PasswordResetRequestService with tests
- Updated AuthService
- Rate limiting integrated

#### Day 2: UI Integration (4-6 hours)
**Morning (3 hours):**
1. Create `ForgotPasswordScreen.tsx` (basic version)
   - Username input
   - "Contact Admin" instructions
   - Display admin contact info
   - **v1.1:** Use FormDialog component (from shared components)

2. Update `LoginScreen.tsx`
   - Add "Forgot Password?" link
   - Add temp password detection logic
   - Show forced password change screen
   - Handle TEMP_PASSWORD_EXPIRED error code
   - **v1.1:** Use LoadingOverlay during login

**Afternoon (1-3 hours):**
3. Update `RoleManagementScreen.tsx`
   - Add "Generate Temporary Password" menu item
   - Create TemporaryPasswordScreen.tsx (admin)
   - Display temp password with copy button
   - Show 24hr countdown timer
   - **v1.1:** Use ConfirmDialog for confirmation

4. Manual testing
   - Admin generates temp password
   - Supervisor logs in with temp password
   - Supervisor forced to change password
   - Temp password expires after 24hrs
   - Rate limiting prevents abuse

**Deliverables:**
- Updated login screen
- Forgot password screen (basic version)
- Forced password change flow
- Admin temp password generation UI

**Testing:**
- ✅ Admin can generate temporary password
- ✅ Temporary password works for login
- ✅ Temporary password expires after 24 hours
- ✅ User is forced to change password after temp login
- ✅ Old sessions are revoked after password change
- ✅ Rate limiting works (max 10 temp passwords per admin per day)
- ✅ Security audit log captures all events

---

### Phase 2: Backup Codes System (Days 3-7)

#### Day 3-4: Database & Backend (12-16 hours)
**Day 3:**
1. Create migration `v34_backup_codes.ts`
   - Add `backup_codes` table
   - Add indexes for performance
   - Add columns to `users` table (backup_codes_generated, backup_codes_generated_at)

2. Create `BackupCodeModel.ts`
   - WatermelonDB model
   - Associations with UserModel

3. Update `UserModel.ts`
   - Add backup code fields
   - Add helper methods

**Day 4:**
4. Create `BackupCodeService.ts`
   - Generate 8 random codes (format: XXXX-XXXX-XXXX)
   - Hash codes with bcrypt before storage (12 rounds)
   - Validate codes (check hash, not used)
   - Mark code as used
   - Count remaining codes
   - Regenerate all codes (admin)
   - **v1.1:** Integrate with RateLimitService
   - **v1.1:** Integrate with SecurityAuditService

5. Create utility functions
   - `generateRandomCode()` - Generate readable codes (crypto.randomBytes)
   - `formatBackupCode()` - Format with dashes

6. Write unit tests
   - Test code generation
   - Test validation
   - Test usage tracking
   - **v1.1:** Test rate limiting integration

**Deliverables:**
- Migration file v34
- BackupCodeModel
- Updated UserModel
- BackupCodeService with full functionality
- Unit tests (>80% coverage)

#### Day 5-6: User Onboarding Flow (8-12 hours)
**Day 5:**
1. Create `BackupCodesDisplayScreen.tsx`
   - Display 8 codes in 2-column grid
   - Download as text file
   - Copy all codes
   - Print functionality
   - "I've saved my codes" acknowledgment
   - **v1.1:** Use LoadingOverlay during generation
   - **v1.1:** Use ConfirmDialog for acknowledgment

2. Update user creation flow in `RoleManagementScreen.tsx`
   - Auto-generate backup codes on user creation
   - Show backup codes screen after creation
   - Admin can download/print codes to give to user

**Day 6:**
3. Create `BackupCodesStatusScreen.tsx`
   - Show remaining codes count
   - Option to regenerate (requires admin)
   - Warning if less than 2 codes remaining
   - **v1.1:** Use EmptyState when no codes
   - **v1.1:** Use SyncStatusChip for status indicators

**Deliverables:**
- Backup codes display screen
- Updated user creation flow
- Backup codes status screen
- Download/print/copy functionality

#### Day 7: Login Integration (4-6 hours)
**Tasks:**
1. Update `ForgotPasswordScreen.tsx`
   - Add "Use Backup Code" option
   - Backup code input field (formatted XXXX-XXXX-XXXX)
   - Validate code on submit
   - **v1.1:** Use FormDialog for input

2. Update `LoginScreen.tsx`
   - Add "Use Backup Code" button (alternative login)
   - Handle backup code authentication
   - Force password change after backup code login
   - Show rate limit errors gracefully

3. Update `AuthService.ts`
   - Add `loginWithBackupCode()` method
   - Mark code as used on successful login
   - Set `requires_password_change` flag
   - **v1.1:** Check rate limits before validation
   - **v1.1:** Log to SecurityAuditService

4. Add admin regeneration UI
   - Button in user profile (admin view)
   - Confirmation dialog
   - Generate new codes, invalidate old ones
   - **v1.1:** Use ConfirmDialog component

**Deliverables:**
- Fully integrated backup code login
- Admin backup code regeneration
- Updated forgot password screen
- Rate limiting on backup code attempts

**Testing:**
- ✅ User can login with backup code
- ✅ Code is marked as used
- ✅ Used code cannot be reused
- ✅ Remaining codes count accurate
- ✅ User forced to change password after backup code login
- ✅ Admin can regenerate codes
- ✅ Rate limiting prevents brute force (max 5 attempts per hour)
- ✅ Account locks after 10 failed attempts

---

## Security Considerations

### Backup Codes Security
1. **Storage:**
   - Hash codes with bcrypt (12 rounds) before database storage
   - Never store plain text codes in database
   - Codes shown only once during generation

2. **Format:**
   - 12-character alphanumeric: `XXXX-XXXX-XXXX`
   - Uppercase only (avoid confusion: no 0/O, 1/I/l)
   - Use crypto-secure random generation (crypto.randomBytes)

3. **Usage:**
   - One-time use only
   - Mark as used immediately after validation
   - Cannot be un-used or restored

4. **Expiry:**
   - Codes valid indefinitely (until used)
   - Admin can invalidate all codes by regenerating
   - Automatic invalidation on password change (optional)

### Temporary Password Security
1. **Generation:**
   - 16-character random password
   - Mix of uppercase, lowercase, numbers, symbols
   - Crypto-secure random generation (crypto.randomBytes)

2. **Expiry:**
   - 24-hour expiration from generation
   - Stored expiry timestamp in database
   - Automatic cleanup of expired temp passwords (background task)

3. **Usage:**
   - One-time use (invalidated after first successful login)
   - Cannot be reused
   - Stored as bcrypt hash (same as regular passwords)

4. **Tracking:**
   - Log who generated temp password (admin ID)
   - Log when temp password was used
   - Audit trail in `password_reset_requests` table
   - **v1.1:** Log to `security_audit_log` table

### Rate Limiting (v1.1 - NEW)
1. **Backup Code Attempts:**
   - Max 5 failed backup code attempts per user per hour
   - Exponential backoff after 3 attempts
   - Account lock after 10 consecutive failed attempts
   - Rate limit counters stored in AsyncStorage
   - Reset on successful login

2. **Temporary Password Generation:**
   - Max 10 temp password generations per admin per day
   - Prevents admin abuse
   - Counter resets at midnight (local time)
   - Warning shown at 8/10 attempts

3. **Account Lockout:**
   - Automatic lock after rate limit exceeded
   - Admin must manually unlock
   - Lockout logged to security audit log
   - User sees clear error message

### Security Audit Logging (v1.1 - NEW)
1. **Events Logged:**
   - Backup code generation (admin ID, user ID, timestamp)
   - Backup code usage (success/failure, code ID, remaining count)
   - Temporary password generation (admin ID, user ID, expiry time)
   - Temporary password usage (success/failure, expiry status)
   - Failed login attempts with backup codes
   - Account lockouts and unlocks
   - Password changes (admin-initiated vs user-initiated)

2. **Log Retention:**
   - Keep logs for 90 days
   - Automatic cleanup of old logs (background task)
   - Export logs to CSV for compliance

3. **Suspicious Activity Detection:**
   - Multiple failed backup code attempts
   - Rapid temporary password generation
   - Password reset requests outside business hours
   - Geolocation anomalies (if available)

### General Security
1. **Session Management:**
   - Revoke all existing sessions on password reset
   - Create new session after successful backup code login
   - Force logout on all devices

2. **Data Protection:**
   - Encrypt backup codes display screen (screenshot protection)
   - Clear clipboard after 2 minutes when copying codes
   - No backup codes in app logs
   - **v1.1:** All sensitive operations logged to SecurityAuditService

---

## User Experience Flow

### Flow 1: Forgot Password → Admin Reset
```
1. Supervisor clicks "Forgot Password?" on login screen
2. Enters username
3. Selects "Contact Admin for Reset"
4. Sees admin contact info + request submitted message
5. Admin sees request in dashboard (v1.1: with rate limit status)
6. Admin generates temporary password (v1.1: rate limited to 10/day)
7. Admin shares temp password securely (in-person, secure channel)
8. Supervisor logs in with temp password
9. System forces password change immediately
10. Supervisor sets new password (meets strength requirements)
11. System revokes temp password
12. v1.1: Event logged to security_audit_log
13. Supervisor redirected to dashboard
```

### Flow 2: Forgot Password → Backup Code
```
1. Supervisor clicks "Forgot Password?" on login screen
2. Enters username
3. Selects "Use Backup Code"
4. Enters one of their saved backup codes
5. v1.1: System checks rate limits (5 attempts/hour)
6. System validates code (bcrypt hash comparison)
7. System forces password change immediately
8. Supervisor sets new password
9. System marks backup code as used
10. System shows: "1 of 8 backup codes remaining"
11. v1.1: Event logged to security_audit_log
12. Supervisor redirected to dashboard
```

### Flow 3: New User Onboarding
```
1. Admin creates new user account
2. System auto-generates 8 backup codes
3. Admin sees backup codes screen
4. Admin downloads/prints codes
5. Admin hands codes to supervisor (secure)
6. Supervisor stores codes in safe place
7. Admin confirms "Codes delivered"
8. System marks backup_codes_generated = true
9. v1.1: Event logged to security_audit_log
```

### Flow 4: Backup Code Regeneration
```
1. Supervisor realizes backup codes are lost
2. Supervisor contacts admin
3. Admin goes to user profile
4. Admin clicks "Regenerate Backup Codes"
5. v1.1: System shows warning + rate limit status
6. Admin confirms
7. System generates 8 new codes
8. System invalidates old codes
9. v1.1: Event logged to security_audit_log
10. Admin downloads/shares new codes with supervisor
```

### Flow 5: Rate Limit Exceeded (v1.1 - NEW)
```
1. Supervisor attempts backup code login
2. Enters incorrect code (attempt 1-3: no delay)
3. Enters incorrect code (attempt 4-5: 5-second delay)
4. System shows: "Too many failed attempts. Please wait 5 seconds."
5. After 5 attempts in 1 hour: "Rate limit exceeded. Try again in 55 minutes."
6. After 10 consecutive failures: "Account locked. Contact admin to unlock."
7. v1.1: All attempts logged to security_audit_log
8. Admin sees locked account in dashboard
9. Admin unlocks account after verification
10. Supervisor can try again
```

---

## Testing Strategy

### Unit Tests

**BackupCodeService Tests:**
```typescript
describe('BackupCodeService', () => {
  test('generateBackupCodes creates 8 unique codes', async () => {})
  test('codes are properly formatted (XXXX-XXXX-XXXX)', async () => {})
  test('validateBackupCode returns true for valid unused code', async () => {})
  test('validateBackupCode returns false for used code', async () => {})
  test('validateBackupCode returns false for invalid code', async () => {})
  test('markCodeAsUsed updates database correctly', async () => {})
  test('getRemainingCodesCount returns correct count', async () => {})
  test('regenerateBackupCodes invalidates old codes', async () => {})

  // v1.1 - NEW
  test('rate limiting blocks excessive attempts', async () => {})
  test('security audit logs all operations', async () => {})
})
```

**PasswordResetRequestService Tests:**
```typescript
describe('PasswordResetRequestService', () => {
  test('generateTemporaryPassword creates valid password', async () => {})
  test('temporary password meets complexity requirements', async () => {})
  test('temporary password expires after 24 hours', async () => {})
  test('validateTemporaryPassword rejects expired password', async () => {})
  test('createResetRequest stores request in database', async () => {})
  test('getPendingRequests returns only pending requests', async () => {})

  // v1.1 - NEW
  test('rate limiting blocks excessive temp password generation', async () => {})
  test('admin cannot generate > 10 temp passwords per day', async () => {})
  test('security audit logs all temp password operations', async () => {})
})
```

**AuthService Tests:**
```typescript
describe('AuthService - Password Reset', () => {
  test('loginWithBackupCode succeeds with valid code', async () => {})
  test('loginWithBackupCode fails with used code', async () => {})
  test('loginWithTemporaryPassword succeeds within 24hrs', async () => {})
  test('loginWithTemporaryPassword fails after expiry', async () => {})
  test('requires_password_change flag forces redirect', async () => {})

  // v1.1 - NEW
  test('rate limiting blocks brute force backup code attempts', async () => {})
  test('account locks after 10 failed backup code attempts', async () => {})
  test('all auth operations use LoggingService', async () => {})
  test('security audit log captures login attempts', async () => {})
})
```

**RateLimitService Tests (v1.1 - NEW):**
```typescript
describe('RateLimitService', () => {
  test('checkBackupCodeAttempts allows first 3 attempts', async () => {})
  test('checkBackupCodeAttempts delays after 3 attempts', async () => {})
  test('checkBackupCodeAttempts blocks after 5 attempts per hour', async () => {})
  test('checkTempPasswordGeneration allows 10 per day', async () => {})
  test('checkTempPasswordGeneration blocks after 10', async () => {})
  test('lockAccount sets is_locked flag', async () => {})
  test('unlockAccount clears rate limits', async () => {})
  test('resetRateLimits clears all counters', async () => {})
})
```

### Integration Tests

**Test Scenarios:**
1. End-to-end backup code flow (generate → use → forced password change)
2. End-to-end temp password flow (admin generate → user login → password change)
3. Backup code regeneration flow
4. Expired temporary password handling
5. Rate limiting on failed backup code attempts
6. Session revocation on password reset
7. **v1.1:** Concurrent temporary password generation (2 admins reset same user)
8. **v1.1:** Backup code usage while user is logged in
9. **v1.1:** Account lockout and unlock flow
10. **v1.1:** Security audit log integrity

### Manual Testing Checklist

**Phase 0 - Logging & Infrastructure:**
- [ ] AuthService uses logger.* (no console.log)
- [ ] PasswordResetService uses logger.* (no console.error)
- [ ] RateLimitService blocks excessive attempts
- [ ] SecurityAuditService logs events correctly
- [ ] All logs include context metadata (userId, action, etc.)

**Phase 1 - Admin Reset:**
- [ ] Admin can generate temporary password for any user
- [ ] Temporary password works for login
- [ ] Temporary password expires after 24 hours
- [ ] User is forced to change password after temp login
- [ ] Old sessions are revoked after password change
- [ ] Admin dashboard shows pending reset requests
- [ ] Forgot password screen shows admin contact info
- [ ] **v1.1:** Rate limiting prevents > 10 temp passwords per admin per day
- [ ] **v1.1:** Security audit log captures all temp password events
- [ ] **v1.1:** LoadingOverlay shows during password generation

**Phase 2 - Backup Codes:**
- [ ] New user gets 8 backup codes on creation
- [ ] Backup codes can be downloaded as text file
- [ ] Backup code login works correctly
- [ ] Used backup code cannot be reused
- [ ] Remaining codes count is accurate
- [ ] Admin can regenerate backup codes
- [ ] Regeneration invalidates old codes
- [ ] User forced to change password after backup code login
- [ ] Backup codes work offline
- [ ] **v1.1:** Rate limiting prevents > 5 backup code attempts per hour
- [ ] **v1.1:** Account locks after 10 consecutive failed attempts
- [ ] **v1.1:** Security audit log captures all backup code events
- [ ] **v1.1:** FormDialog used for code input
- [ ] **v1.1:** EmptyState shows when no codes available

**Security Testing:**
- [ ] Backup codes are hashed in database (not plain text)
- [ ] Temporary passwords are hashed in database
- [ ] Rate limiting works for backup code attempts
- [ ] Account locks after multiple failed attempts
- [ ] All sessions revoked on password reset
- [ ] Audit logs capture all reset events
- [ ] No sensitive data in console logs
- [ ] **v1.1:** Rate limit counters persist across app restarts
- [ ] **v1.1:** Security audit log cannot be tampered with
- [ ] **v1.1:** Exponential backoff delays work correctly

**UX Testing:**
- [ ] Forgot password flow is intuitive
- [ ] Backup code format is clear (XXXX-XXXX-XXXX)
- [ ] Error messages are helpful
- [ ] Success messages are clear
- [ ] Loading states work correctly
- [ ] Offline behavior is graceful
- [ ] **v1.1:** Shared components (FormDialog, ConfirmDialog) used consistently
- [ ] **v1.1:** Rate limit errors are user-friendly
- [ ] **v1.1:** LoadingOverlay appears during async operations

---

## Database Migration Scripts

### Migration 1: `v33_password_reset_system.ts` (was v30)

```typescript
import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const v33Migration = {
  toVersion: 33,
  steps: [
    // Create password_reset_requests table
    createTable({
      name: 'password_reset_requests',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'requested_by', type: 'string' },
        { name: 'request_type', type: 'string' },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'temp_password_hash', type: 'string', isOptional: true },
        { name: 'temp_password_expires_at', type: 'number', isOptional: true },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Create security_audit_log table (v1.1 - NEW)
    createTable({
      name: 'security_audit_log',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'admin_id', type: 'string', isOptional: true },
        { name: 'event_type', type: 'string', isIndexed: true },
        { name: 'event_status', type: 'string' },
        { name: 'ip_address', type: 'string', isOptional: true },
        { name: 'device_info', type: 'string', isOptional: true },
        { name: 'metadata', type: 'string', isOptional: true }, // JSON blob
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    // Add requires_password_change column to users table
    addColumns({
      table: 'users',
      columns: [
        { name: 'requires_password_change', type: 'boolean' },
        { name: 'is_locked', type: 'boolean' }, // v1.1 - NEW for account lockout
        { name: 'locked_at', type: 'number', isOptional: true }, // v1.1 - NEW
        { name: 'locked_reason', type: 'string', isOptional: true }, // v1.1 - NEW
      ],
    }),
  ],
};
```

### Migration 2: `v34_backup_codes.ts` (was v31)

```typescript
import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const v34Migration = {
  toVersion: 34,
  steps: [
    // Create backup_codes table
    createTable({
      name: 'backup_codes',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'code_hash', type: 'string' },
        { name: 'is_used', type: 'boolean', isIndexed: true },
        { name: 'used_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // Add backup code fields to users table
    addColumns({
      table: 'users',
      columns: [
        { name: 'backup_codes_generated', type: 'boolean' },
        { name: 'backup_codes_generated_at', type: 'number', isOptional: true },
      ],
    }),
  ],
};
```

---

## File Structure

```
src/
├── auth/
│   ├── ForgotPasswordScreen.tsx                    [NEW]
│   ├── BackupCodesDisplayScreen.tsx                [NEW]
│   ├── BackupCodesStatusScreen.tsx                 [NEW]
│   ├── LoginScreen.tsx                             [UPDATE - Add forgot password link]
│   └── PasswordChangeScreen.tsx                    [UPDATE - Handle forced change]
│
├── admin/
│   ├── TemporaryPasswordScreen.tsx                 [NEW]
│   ├── PasswordResetDashboard.tsx                  [NEW]
│   └── RoleManagementScreen.tsx                    [UPDATE - Add temp password + backup codes]
│
services/
├── auth/
│   ├── BackupCodeService.ts                        [NEW]
│   ├── PasswordResetRequestService.ts              [NEW]
│   ├── RateLimitService.ts                         [NEW - v1.1]
│   ├── SecurityAuditService.ts                     [NEW - v1.1]
│   ├── AuthService.ts                              [UPDATE - Add new login methods + LoggingService]
│   ├── PasswordResetService.ts                     [UPDATE - Add LoggingService]
│   └── LoggingService.ts                           [EXISTS - v2.13]
│
models/
├── BackupCodeModel.ts                              [NEW]
├── PasswordResetRequestModel.ts                    [NEW]
├── SecurityAuditLogModel.ts                        [NEW - v1.1]
├── UserModel.ts                                    [UPDATE - Add new fields]
├── migrations/
│   ├── v33_password_reset_system.ts                [NEW - was v30]
│   └── v34_backup_codes.ts                         [NEW - was v31]
│
utils/
├── backupCodeGenerator.ts                          [NEW]
└── passwordValidator.ts                            [EXISTS - v2.2]

__tests__/
├── services/
│   ├── BackupCodeService.test.ts                   [NEW]
│   ├── PasswordResetRequestService.test.ts         [NEW]
│   ├── RateLimitService.test.ts                    [NEW - v1.1]
│   └── SecurityAuditService.test.ts                [NEW - v1.1]
│
docs/
├── PASSWORD_RESET_USER_GUIDE.md                    [NEW]
└── PASSWORD_RESET_SECURITY_AUDIT.md                [NEW - v1.1]
```

---

## Rollout Plan

### Pre-Launch (Day 0)
- [x] Code review completed
- [ ] All tests passing (unit + integration)
- [ ] Manual testing completed
- [ ] Database migrations tested on dev environment
- [ ] Backup/rollback plan documented
- [ ] Admin training materials prepared
- [ ] User guide created
- [x] **v1.1:** Phase 0 completed (LoggingService migration + RateLimitService)
- [ ] **v1.1:** Security audit completed

### Phase 1 Launch (Days 1-2)
- [ ] Deploy database migration v33
- [ ] Deploy admin-assisted reset features
- [ ] Enable "Forgot Password" button on login
- [ ] Monitor error logs for 24 hours
- [ ] Admin team testing
- [ ] Fix any critical bugs
- [ ] **v1.1:** Verify rate limiting works
- [ ] **v1.1:** Verify security audit log captures events

### Phase 2 Launch (Days 3-7)
- [ ] Deploy database migration v34
- [ ] Deploy backup codes system
- [ ] Generate backup codes for all existing users
- [ ] Distribute backup codes to users
- [ ] Monitor usage analytics
- [ ] Collect user feedback
- [ ] **v1.1:** Monitor for brute force attempts
- [ ] **v1.1:** Review security audit logs daily

### Post-Launch (Week 2)
- [ ] Analytics review (usage patterns)
- [ ] Bug fixes based on feedback
- [ ] Performance optimization if needed
- [ ] Documentation updates
- [ ] User satisfaction survey
- [ ] **v1.1:** Security audit report
- [ ] **v1.1:** Rate limiting effectiveness analysis

---

## Success Metrics

**Quantitative Metrics:**
- Time to password reset (target: <2 minutes with backup code, <15 minutes with admin) - **v1.1 improved**
- Backup code usage rate (target: >60% of password resets use backup code) - **v1.1 increased**
- Admin intervention rate (target: <25% of resets require admin) - **v1.1 decreased**
- User satisfaction score (target: >4.2/5) - **v1.1 increased**
- Failed backup code attempts (monitor for security issues)
- **v1.1:** Rate limit triggers per day (monitor abuse patterns)
- **v1.1:** Account lockouts per week (target: <5)
- **v1.1:** Security audit log events per day (baseline metrics)

**Qualitative Metrics:**
- User feedback on ease of use
- Admin feedback on workflow efficiency
- Reduction in support tickets for password issues
- **v1.1:** Admin confidence in security measures
- **v1.1:** User trust in password recovery process

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation | v1.1 Status |
|------|--------|-------------|------------|-------------|
| Users lose backup codes | High | Medium | Admin can regenerate codes; clear onboarding instructions | ✅ Addressed |
| Temporary password sharing over insecure channel | High | Low | Admin training; recommend in-person delivery | ⚠️ Training needed |
| Backup code brute force attacks | High | Low | Rate limiting; account lockout after 10 attempts | ✅ Mitigated |
| Database migration failure | Critical | Low | Test migrations extensively; rollback plan ready | ✅ Addressed |
| User confusion with two reset methods | Medium | Medium | Clear UI/UX; contextual help text | ✅ Addressed |
| Performance impact from hashing | Low | Low | Bcrypt already used for passwords; no significant change | ✅ Addressed |
| **Console logging in auth code** | **High** | **High** | **v1.1: Phase 0 migrates to LoggingService** | **✅ Fixed** |
| **No rate limiting** | **Critical** | **High** | **v1.1: RateLimitService implemented** | **✅ Fixed** |
| **No audit logging** | **High** | **High** | **v1.1: SecurityAuditService implemented** | **✅ Fixed** |
| **Concurrent password resets** | **Medium** | **Medium** | **v1.1: Database transactions + locking** | **✅ Addressed** |
| **Migration numbering conflict** | **Medium** | **High** | **v1.1: Renumbered to v33, v34** | **✅ Fixed** |

---

## Future Enhancements (Post v2.16)

### v2.17+
1. **Email-based password reset** (when online sync is available)
   - Requires email service integration
   - Requires backend API
   - Better UX for users with email access

2. **SMS-based backup codes** (optional)
   - Send backup code via SMS on request
   - Requires SMS gateway integration

3. **Security questions** (additional fallback)
   - 3-5 questions during onboarding
   - Alternative to backup codes

4. **Biometric authentication**
   - Fingerprint/Face ID as primary auth
   - Reduces password dependency

5. **Password strength enforcement**
   - Reject weak passwords during reset
   - Already partially implemented

6. **Multi-factor authentication (MFA)**
   - TOTP (Google Authenticator)
   - SMS codes
   - Enhances security for all roles

7. **v1.1:** Security Dashboard for Admins
   - Real-time security event monitoring
   - Suspicious activity alerts
   - User behavior analytics
   - Rate limit statistics

---

## Dependencies

**Technical:**
- WatermelonDB (existing)
- React Native Bcrypt (existing)
- React Native AsyncStorage (existing)
- React Navigation (existing)
- React Native Paper (existing)
- **v1.1:** LoggingService (existing - v2.13)
- **v1.1:** Shared components: FormDialog, ConfirmDialog, LoadingOverlay, EmptyState (existing - Phase 2)
- No new external dependencies required

**Team:**
- 1 Developer (full-time, 8-10 days) - **v1.1 reduced from 10 days**
- 1 QA Tester (part-time, 3 days)
- 1 UI/UX Reviewer (part-time, 1 day)
- Admin team (training, 1 day)

**Infrastructure:**
- No backend changes required (offline-first)
- No email server required (Phase 1 & 2)
- No SMS gateway required (Phase 1 & 2)

---

## Budget Estimate

**Development Time:**
- **Phase 0:** 4-6 hours (Logging & Infrastructure) - **v1.1 NEW**
- **Phase 1:** 1.5-2 days (Enhanced Admin Reset) - **v1.1 reduced from 3 days**
- **Phase 2:** 3-4 days (Backup Codes)
- **Testing:** 2 days
- **Documentation:** 1 day
- **Total: 8-10 days** - **v1.1 reduced from 10 days**

**Cost Breakdown:**
- Development: 8-10 days × developer rate
- QA Testing: 3 days × QA rate
- Documentation: 1 day × technical writer rate
- No external service costs (offline solution)

---

## Approval & Sign-off

**Stakeholders:**
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] Security Lead
- [ ] UX Designer
- [ ] QA Lead

**Approval Date:** _______________

**Planned Start Date:** _______________

**Target Completion Date:** _______________

---

## Appendix

### A. Backup Code Format Specification
```
Format: XXXX-XXXX-XXXX
Length: 12 characters (excluding dashes)
Character Set: A-Z, 2-9 (excluding 0,1,O,I to avoid confusion)
Example: 2A3B-4C5D-6E7F
Total Possible Combinations: 32^12 = 1.2 × 10^18
Generation: crypto.randomBytes(9) → base32 encoding → format
```

### B. Temporary Password Format
```
Length: 16 characters
Character Set: A-Z, a-z, 0-9, !@#$%^&*
Example: Kp3!vN@x9Qz#2Bm5
Expiry: 24 hours from generation
Generation: crypto.randomBytes(12) → custom encoding
```

### C. API Response Formats

**BackupCodeService.generateBackupCodes()**
```typescript
{
  success: true,
  codes: [
    "2A3B-4C5D-6E7F",
    "8G9H-1J2K-3L4M",
    // ... 8 total codes
  ],
  generatedAt: 1734566400000,
  expiresAt: null
}
```

**PasswordResetRequestService.generateTemporaryPassword()**
```typescript
{
  success: true,
  tempPassword: "Kp3!vN@x9Qz#2Bm5",
  expiresAt: 1734652800000, // 24 hours from now
  requestId: "req_abc123"
}
```

### D. Error Codes

```typescript
enum PasswordResetErrorCode {
  BACKUP_CODE_INVALID = 'BACKUP_CODE_INVALID',
  BACKUP_CODE_ALREADY_USED = 'BACKUP_CODE_ALREADY_USED',
  BACKUP_CODE_RATE_LIMIT = 'BACKUP_CODE_RATE_LIMIT',
  TEMP_PASSWORD_EXPIRED = 'TEMP_PASSWORD_EXPIRED',
  TEMP_PASSWORD_INVALID = 'TEMP_PASSWORD_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  PASSWORD_VALIDATION_FAILED = 'PASSWORD_VALIDATION_FAILED',
  // v1.1 - NEW
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TEMP_PASSWORD_GENERATION_LIMIT = 'TEMP_PASSWORD_GENERATION_LIMIT',
}
```

### E. Security Audit Event Types (v1.1 - NEW)

```typescript
enum SecurityAuditEventType {
  BACKUP_CODE_GENERATED = 'backup_code_generated',
  BACKUP_CODE_USED = 'backup_code_used',
  BACKUP_CODE_FAILED = 'backup_code_failed',
  BACKUP_CODE_REGENERATED = 'backup_code_regenerated',
  TEMP_PASSWORD_GENERATED = 'temp_password_generated',
  TEMP_PASSWORD_USED = 'temp_password_used',
  TEMP_PASSWORD_EXPIRED = 'temp_password_expired',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  LOGIN_FAILED = 'login_failed',
  LOGIN_SUCCESS = 'login_success',
}
```

---

## References

- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- Current implementation: `services/auth/PasswordResetService.ts` (v2.2)
- JWT Authentication: `services/auth/AuthService.ts` (v2.2)
- Session Management: `services/auth/SessionService.ts` (v2.2)
- **v1.1:** Logging: `services/LoggingService.ts` (v2.13)
- **v1.1:** Shared Components: `src/components/dialogs/`, `src/components/common/` (Phase 2)
- **v1.1:** Supervisor Improvements Roadmap: `SUPERVISOR_IMPROVEMENTS_ROADMAP.md`

---

**Document Version:** 1.1
**Last Updated:** 2025-12-20
**Previous Version:** 1.0 (2025-12-19)
**Next Review:** After Phase 0 completion

**Changelog v1.0 → v1.1:**
- ✅ Added Phase 0 (Logging & Security Infrastructure)
- ✅ Corrected migration numbers (v30→v33, v31→v34)
- ✅ Reduced Phase 1 timeline (3 days → 1.5-2 days)
- ✅ Added RateLimitService and SecurityAuditService
- ✅ Referenced shared components from Supervisor Improvements
- ✅ Added security audit logging throughout
- ✅ Updated risks & mitigation table
- ✅ Added v1.1 sections throughout document
- ✅ Improved success metrics targets
- ✅ Added missing test scenarios
- ✅ Updated file structure with new services

My observation: This change will be for all users not only for supervisors