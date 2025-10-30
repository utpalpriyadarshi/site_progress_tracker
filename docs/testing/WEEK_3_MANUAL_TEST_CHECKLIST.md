# Week 3 Manual Testing Checklist

**Activity:** Activity 1 - Security Implementation
**Week:** 3 of 3 (Days 11-15)
**Testing Date:** _____________
**Tested By:** _____________

---

## Test Environment Setup

**Prerequisites:**
- [x] App installed on Android device or emulator
- [x] Database schema v17 (check: sessions and password_history tables exist with created_at/updated_at)
- [x] Fresh database or test database with demo users
- [x] Network connectivity for testing (though features work offline)

**Demo Users Available for Testing:**
- Admin: `admin` / `Admin@2025`
- Manager: `manager` / `Manager@2025`
- Supervisor: `supervisor` / `Supervisor@2025`
- Planner: `planner` / `Planner@2025`
- Logistics: `logistics` / `Logistics@2025`

---

## 1. Session Management Tests

### 1.1 Login Session Creation
**Test Objective:** Verify session is created when user logs in

- [ok ] **Test 1.1.1:** Login with valid credentials (admin/Admin@2025)
  - **Expected:** Login successful, redirected to dashboard
  - **Verify:** Check database `sessions` table for new record with:
    - `user_id` matching logged-in user
    - `access_token` populated
    - `refresh_token` populated
    - `is_active` = true
    - `expires_at` > current timestamp
    - `revoked_at` = null
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** ___Passed__________________________________________

- [ok ] **Test 1.1.2:** Verify session ID stored in AsyncStorage
  - **Expected:** SessionId key exists in AsyncStorage
  - **How to check:** Use React Native Debugger or console logs
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** ___passed__________________________________________

### 1.2 Session Validation
**Test Objective:** Verify active sessions are recognized

- [ok ] **Test 1.2.1:** Use app with active session
  - **Expected:** All protected screens accessible
  - **Try:** Navigate to different screens (Dashboard, Reports, Settings)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __Passed___________________________________________

- [ok ] **Test 1.2.2:** Check session validity after app restart
  - **Steps:** Close app completely → Reopen app
  - **Expected:** Still logged in (session persists)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

### 1.3 Logout Session Revocation
**Test Objective:** Verify session is revoked when user logs out

- [ok ] **Test 1.3.1:** Logout from app
  - **Steps:** Login → Navigate to User & Role Management → Tap "Logout"
  - **Expected:** Redirected to login screen
  - **Verify in DB:** `sessions` table record should have:
    - `revoked_at` = timestamp of logout
    - `is_active` = false
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

- [ok ] **Test 1.3.2:** Verify AsyncStorage cleared
  - **Expected:** SessionId, accessToken, refreshToken all removed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

### 1.4 Multiple Sessions
**Test Objective:** Verify multiple login sessions are tracked

- [ok ] **Test 1.4.1:** Login from same device multiple times
  - **Steps:** Login → Logout → Login again
  - **Expected:** Each login creates a new session record
  - **Verify in DB:** Multiple session records for same user
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

- [ok ] **Test 1.4.2:** Check session history after multiple logins
  - **Expected:** Old sessions marked with `revoked_at`
  - **Expected:** Only latest session has `is_active` = true
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** passed_____________________________________________

---

## 2. Admin Password Reset Tests

### 2.1 Access Password Reset UI
**Test Objective:** Verify admin can access password reset functionality

- [ok ] **Test 2.1.1:** Login as admin
  - **User:** `admin` / `Admin@2025`
  - **Navigate to:** User & Role Management screen
  - **Expected:** All users displayed with buttons
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** passed_____________________________________________

- [ok ] **Test 2.1.2:** Verify "Reset Password" button visible
  - **Expected:** Each user card shows 4 buttons in 2 rows:
    - Row 1: Deactivate/Activate, Edit
    - Row 2: Reset Password, Delete
  - **Expected:** No button clipping or overflow
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

### 2.2 Password Reset Dialog
**Test Objective:** Verify password reset dialog functionality

- [ok ] **Test 2.2.1:** Open password reset dialog
  - **Steps:** Tap "Reset Password" for supervisor user
  - **Expected:** Dialog opens showing:
    - Title: "Reset Password"
    - User info: "Reset password for: John Supervisor (supervisor)"
    - Password requirements list (5 items)
    - New password field with eye icon
    - Confirm password field
    - Cancel and Reset Password buttons
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

### 2.3 Password Strength Validation
**Test Objective:** Verify weak passwords are rejected

- [ok ] **Test 2.3.1:** Try weak password (too short)
  - **Input:** New password: `Test1!` (only 6 chars)
  - **Input:** Confirm password: `Test1!`
  - **Tap:** Reset Password button
  - **Expected:** Error snackbar: "Password validation failed: Must be at least 8 characters"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** passed_____________________________________________

- [ok ] **Test 2.3.2:** Try password without uppercase
  - **Input:** New password: `test123!@#` (no uppercase)
  - **Input:** Confirm password: `test123!@#`
  - **Expected:** Error: "Must contain at least one uppercase letter"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** passed_____________________________________________

- [ok ] **Test 2.3.3:** Try password without lowercase
  - **Input:** New password: `TEST123!@#` (no lowercase)
  - **Input:** Confirm password: `TEST123!@#`
  - **Expected:** Error: "Must contain at least one lowercase letter"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

- [ok ] **Test 2.3.4:** Try password without number
  - **Input:** New password: `TestPass!@#` (no number)
  - **Input:** Confirm password: `TestPass!@#`
  - **Expected:** Error: "Must contain at least one number"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** passed_____________________________________________

- [ok ] **Test 2.3.5:** Try password without special character
  - **Input:** New password: `TestPass123` (no special char)
  - **Input:** Confirm password: `TestPass123`
  - **Expected:** Error: "Must contain at least one special character"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** ___passed__________________________________________

### 2.4 Password Match Validation
**Test Objective:** Verify password confirmation works

- [ ok] **Test 2.4.1:** Try mismatched passwords
  - **Input:** New password: `ValidPass123!`
  - **Input:** Confirm password: `DifferentPass123!`
  - **Expected:** Error snackbar: "Passwords do not match"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

- [ok ] **Test 2.4.2:** Verify real-time mismatch indicator
  - **Steps:** Type in both fields while they don't match
  - **Expected:** Red error text appears below confirm field: "Passwords do not match"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

### 2.5 Password Strength Meter
**Test Objective:** Verify real-time password strength feedback

- [ok ] **Test 2.5.1:** Check strength meter with weak password
  - **Input:** Type `Test1!` (weak)
  - **Expected:** Strength bar appears below password field
  - **Expected:** Label shows "Very Weak" or "Weak"
  - **Expected:** Bar color is red or orange
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

- [ok ] **Test 2.5.2:** Check strength meter with strong password
  - **Input:** Type `SuperSecure123!@#` (strong)
  - **Expected:** Label shows "Strong" or "Very Strong"
  - **Expected:** Bar color is green
  - **Expected:** Bar fills most of the width
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

### 2.6 Successful Password Reset
**Test Objective:** Verify admin can successfully reset user password

- [ok ] **Test 2.6.1:** Reset supervisor password
  - **Steps:**
    1. Login as admin
    2. Open password reset for supervisor user
    3. Enter new password: `NewSuper123!@#`
    4. Confirm password: `NewSuper123!@#`
    5. Tap "Reset Password"
  - **Expected:** Success snackbar: "Password reset successful for supervisor"
  - **Expected:** Dialog closes automatically
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

- [ok ] **Test 2.6.2:** Verify password changed in database
  - **Check:** `users` table, supervisor record
  - **Expected:** `password_hash` field contains new bcrypt hash
  - **Expected:** Hash is different from before
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

- [ ok] **Test 2.6.3:** Verify old password stored in history
  - **Check:** `password_history` table
  - **Expected:** New record with:
    - `user_id` = supervisor's user ID
    - `password_hash` = old bcrypt hash
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

- [ ] **Test 2.6.4:** Verify user sessions revoked
  - **Check:** `sessions` table for supervisor user
  - **Expected:** All sessions have:
    - `is_active` = false
    - `revoked_at` = timestamp of password reset
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 2.7 Login with New Password
**Test Objective:** Verify user can login with new password after reset

- [ok ] **Test 2.7.1:** Try old password (should fail)
  - **Logout** as admin
  - **Try login:** username: `supervisor`, password: `Supervisor@2025` (old)
  - **Expected:** Login fails with error
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** __passed___________________________________________

- [ok ] **Test 2.7.2:** Login with new password (should succeed)
  - **Try login:** username: `supervisor`, password: `NewSuper123!@#` (new)
  - **Expected:** Login successful
  - **Expected:** Redirected to supervisor dashboard
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _passed____________________________________________

---

## 3. Password Reuse Prevention Tests

### 3.1 Test Reuse of Last Password
**Test Objective:** Verify user cannot reuse immediate previous password

- [ ] **Test 3.1.1:** Reset password, then try to reset back to same password
  - **Steps:**
    1. Admin resets supervisor password to `FirstPass123!@#`
    2. Supervisor logs in successfully
    3. Admin tries to reset supervisor password back to `FirstPass123!@#`
  - **Expected:** Error: "This password has been used recently. Please choose a different password."
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 3.2 Test Reuse of Last 5 Passwords
**Test Objective:** Verify user cannot reuse any of last 5 passwords

- [ ] **Test 3.2.1:** Reset password 5 times, then try to reuse 1st password
  - **Steps:**
    1. Reset to: `Pass1Test!@#`
    2. Reset to: `Pass2Test!@#`
    3. Reset to: `Pass3Test!@#`
    4. Reset to: `Pass4Test!@#`
    5. Reset to: `Pass5Test!@#`
    6. Try to reset back to: `Pass1Test!@#`
  - **Expected:** Error: "This password has been used recently"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 3.2.2:** Verify 6th password allows reuse of 1st password
  - **Steps:** Continue from above:
    7. Reset to: `Pass6Test!@#` (6th password)
    8. Now try to reset to: `Pass1Test!@#` (original)
  - **Expected:** Success (password from 6+ changes ago is allowed)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 3.3 Verify Password History Tracking
**Test Objective:** Verify password history records are created correctly

- [ ] **Test 3.3.1:** Check password_history table after multiple resets
  - **Query:** `SELECT * FROM password_history WHERE user_id = '<supervisor_id>' ORDER BY created_at DESC`
  - **Expected:** Multiple records with different password_hash values
  - **Expected:** Each hash is a valid bcrypt hash (starts with $2a$ or $2b$)
  - **Expected:** Timestamps are in chronological order
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

---

## 4. User Password Change Tests

### 4.1 Access Password Change Screen
**Test Objective:** Verify user can access password change functionality

- [ ] **Test 4.1.1:** Login as regular user (supervisor)
  - **User:** `supervisor` / current password
  - **Navigate to:** (Manual step - screen not yet in navigation)
  - **Note:** PasswordChangeScreen exists but not yet linked in nav
  - **Result:** ☐ Pass ☐ Fail ☐ N/A (not in navigation yet)
  - **Notes:** _____________________________________________

### 4.2 Password Change UI
**Test Objective:** Verify password change screen layout and functionality

- [ ] **Test 4.2.1:** Verify screen elements present
  - **Expected elements:**
    - Title: "Change Password"
    - Subtitle: "Update your password to keep your account secure"
    - Current password field with eye icon
    - New password field with eye icon
    - Confirm password field
    - Password strength meter (when typing new password)
    - Password requirements checklist (5 items)
    - Cancel button
    - Change Password button
    - Security notice card (yellow background)
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 4.3 Current Password Verification
**Test Objective:** Verify current password must be correct

- [ ] **Test 4.3.1:** Try wrong current password
  - **Input:** Current password: `WrongPassword123!`
  - **Input:** New password: `NewValidPass123!@#`
  - **Input:** Confirm password: `NewValidPass123!@#`
  - **Tap:** Change Password
  - **Expected:** Error: "Current password is incorrect"
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

- [ ] **Test 4.3.2:** Leave current password blank
  - **Input:** Current password: (empty)
  - **Input:** New password: `NewValidPass123!@#`
  - **Input:** Confirm password: `NewValidPass123!@#`
  - **Expected:** Error: "Please fill in all fields"
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 4.4 User Password Strength Validation
**Test Objective:** Verify same strength rules apply to user password changes

- [ ] **Test 4.4.1:** Try weak password (same as admin tests)
  - **Run through same weak password tests as section 2.3**
  - **Expected:** Same validation errors
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 4.5 Successful User Password Change
**Test Objective:** Verify user can successfully change their own password

- [ ] **Test 4.5.1:** Change password with valid inputs
  - **Steps:**
    1. Login as supervisor with current password
    2. Navigate to password change screen
    3. Enter current password correctly
    4. Enter new password: `UserNewPass123!@#`
    5. Confirm new password: `UserNewPass123!@#`
    6. Tap "Change Password"
  - **Expected:** Success snackbar: "Password changed successfully! Please login again."
  - **Expected:** Screen closes/navigates back after 1.5 seconds
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

- [ ] **Test 4.5.2:** Verify sessions revoked after password change
  - **Check:** `sessions` table for user
  - **Expected:** All sessions revoked (same as admin reset)
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

- [ ] **Test 4.5.3:** Verify old password in history
  - **Check:** `password_history` table
  - **Expected:** Old password hash added to history
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

- [ ] **Test 4.5.4:** Login with new password
  - **Logout** (should be automatic after password change)
  - **Login:** username: `supervisor`, password: `UserNewPass123!@#`
  - **Expected:** Login successful
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 4.6 User Password Reuse Prevention
**Test Objective:** Verify user cannot reuse own passwords

- [ ] **Test 4.6.1:** Try to reuse current password
  - **Steps:** User tries to change password to same password
  - **Expected:** Error: "This password has been used recently"
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

---

## 5. Edge Cases and Security Tests

### 5.1 Special Characters in Passwords
**Test Objective:** Verify all special characters work correctly

- [ ] **Test 5.1.1:** Test various special characters
  - **Try passwords with:** `!@#$%^&*()_+-=[]{}|;:,.<>?`
  - **Expected:** All special characters accepted
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 5.2 Password Visibility Toggle
**Test Objective:** Verify eye icon toggles password visibility

- [ ] **Test 5.2.1:** Toggle current password visibility (admin dialog)
  - **Steps:** Tap eye icon in password field
  - **Expected:** Password switches between hidden (•••) and visible (plain text)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 5.2.2:** Toggle in user password change screen
  - **Steps:** Test all 3 password fields (current, new, confirm)
  - **Expected:** Each field has own eye icon that works independently
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 5.3 Button States
**Test Objective:** Verify buttons are properly disabled during operations

- [ ] **Test 5.3.1:** Reset Password button disabled when loading
  - **Steps:** Tap "Reset Password" and observe during processing
  - **Expected:** Button shows loading spinner, is disabled
  - **Expected:** Cancel button also disabled during loading
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 5.3.2:** Change Password button disabled until valid
  - **Expected:** Button disabled if:
    - Any field is empty
    - New password ≠ confirm password
    - Loading is in progress
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 5.4 Session Cleanup
**Test Objective:** Verify expired sessions can be cleaned up

- [ ] **Test 5.4.1:** Manually test cleanupExpiredSessions method
  - **Note:** This requires manual testing script or dev tools
  - **Steps:** Call `SessionService.cleanupExpiredSessions(false)`
  - **Expected:** Method marks expired sessions as inactive
  - **Result:** ☐ Pass ☐ Fail ☐ N/A (requires dev tools)
  - **Notes:** _____________________________________________

### 5.5 Multiple Users
**Test Objective:** Verify features work correctly for multiple users

- [ ] **Test 5.5.1:** Reset passwords for multiple users
  - **Steps:** Admin resets passwords for all 5 demo users
  - **Expected:** Each reset works independently
  - **Expected:** Password history tracked separately per user
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 5.6 Cancel Operations
**Test Objective:** Verify cancel buttons work correctly

- [ ] **Test 5.6.1:** Cancel password reset dialog
  - **Steps:** Open dialog → Enter data → Tap Cancel
  - **Expected:** Dialog closes without changes
  - **Expected:** Form data cleared
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 5.6.2:** Cancel user password change
  - **Steps:** Open screen → Enter data → Tap Cancel
  - **Expected:** Navigate back without changes
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

---

## 6. UI/UX Tests

### 6.1 Card Layout
**Test Objective:** Verify user cards display correctly without clipping

- [ok ] **Test 6.1.1:** Check button layout on user cards
  - **Expected:** 4 buttons arranged in 2 rows
  - **Expected:** No button text clipping
  - **Expected:** No horizontal overflow
  - **Expected:** All buttons fully visible
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 6.2 Password Requirements Display
**Test Objective:** Verify password requirements are clear and visible

- [ok ] **Test 6.2.1:** Check requirements list in admin dialog
  - **Expected:** All 5 requirements listed:
    1. At least 8 characters
    2. At least 1 uppercase letter (A-Z)
    3. At least 1 lowercase letter (a-z)
    4. At least 1 number (0-9)
    5. At least 1 special character
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ok ] **Test 6.2.2:** Check requirements list in user screen
  - **Expected:** Same 5 requirements visible
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

### 6.3 Snackbar Notifications
**Test Objective:** Verify snackbar messages are clear and appropriate

- [ok ] **Test 6.3.1:** Success snackbars appear correctly
  - **Test:** Successful password reset
  - **Expected:** Green snackbar with success message
  - **Expected:** Auto-dismisses after a few seconds
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ok ] **Test 6.3.2:** Error snackbars appear correctly
  - **Test:** Failed validation
  - **Expected:** Red snackbar with clear error message
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 6.4 Security Notice
**Test Objective:** Verify security notice is visible and clear

- [ok ] **Test 6.4.1:** Check security notice in user password change
  - **Expected:** Yellow card at bottom of screen
  - **Expected:** Lock icon (🔒) visible
  - **Expected:** Text: "Security Notice: After changing your password, you will need to login again with your new password. All active sessions will be terminated."
  - **Result:** ☐ Pass ☐ Fail ☐ N/A
  - **Notes:** _____________________________________________

---

## 7. Database Integrity Tests

### 7.1 Schema Version
**Test Objective:** Verify database schema is correct version

- [ ] **Test 7.1.1:** Check schema version
  - **Query:** Check `schema_version` or app metadata
  - **Expected:** Schema version = 16
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 7.2 Tables Exist
**Test Objective:** Verify new tables are created

- [ ] **Test 7.2.1:** Check sessions table exists
  - **Query:** `SELECT * FROM sessions LIMIT 1`
  - **Expected:** Query succeeds (table exists)
  - **Expected:** Columns: id, user_id, access_token, refresh_token, device_info, ip_address, expires_at, revoked_at, is_active, created_at, updated_at
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 7.2.2:** Check password_history table exists
  - **Query:** `SELECT * FROM password_history LIMIT 1`
  - **Expected:** Query succeeds (table exists)
  - **Expected:** Columns: id, user_id, password_hash, created_at, updated_at
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 7.3 Indexes
**Test Objective:** Verify indexes exist for performance

- [ ] **Test 7.3.1:** Check user_id index on sessions
  - **Expected:** Index exists on `sessions.user_id`
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

- [ ] **Test 7.3.2:** Check user_id index on password_history
  - **Expected:** Index exists on `password_history.user_id`
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

### 7.4 Data Types
**Test Objective:** Verify column data types are correct

- [ ] **Test 7.4.1:** Check timestamp fields
  - **Expected:** expires_at, revoked_at are numbers (milliseconds)
  - **Expected:** created_at, updated_at are numbers (milliseconds)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

---

## 8. Performance Tests

### 8.1 Password Hashing Performance
**Test Objective:** Verify bcrypt operations don't freeze UI

- [ ] **Test 8.1.1:** Time password reset operation
  - **Steps:** Reset password and measure time
  - **Expected:** Completes within 2-3 seconds
  - **Expected:** UI remains responsive (loading indicator shows)
  - **Result:** ☐ Pass ☐ Fail
  - **Time:** _______ seconds
  - **Notes:** _____________________________________________

### 8.2 Password History Query Performance
**Test Objective:** Verify password history queries are fast

- [ ] **Test 8.2.1:** Check query time with 10+ history records
  - **Setup:** Create user with 10+ password changes
  - **Test:** Reset password again
  - **Expected:** Query and comparison completes quickly (<1 second)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _____________________________________________

---

## Test Summary

**Total Tests:** 90+
**Tests Passed:** _______
**Tests Failed:** _______
**Tests N/A (not yet implemented):** _______
**Success Rate:** _______%

### Critical Issues Found
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Non-Critical Issues Found
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Recommendations
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Sign-off

**Tester Name:** _____________________
**Date:** _______________
**Approved for Production:** ☐ Yes ☐ No ☐ With Conditions

**Conditions/Notes:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

---

**Document Status:** Ready for Testing
**Created:** October 29, 2025
**Last Updated:** October 29, 2025
**Version:** 1.0

---

**END OF WEEK 3 MANUAL TEST CHECKLIST**
