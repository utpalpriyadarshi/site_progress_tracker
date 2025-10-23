# Manual Testing Guide - Alert.alert Migration

**Task:** Validate Alert.alert migration to Snackbar/Dialog system
**Files to Test:** 13 files (5 already tested, 8 remaining)
**Estimated Time:** 3-4 hours
**Date:** October 23, 2025

---

## 📋 Testing Overview

### Already Tested (10 files) ✅
1. ✅ WBSManagementScreen.tsx - All tests passed
2. ✅ SiteInspectionScreen.tsx - All tests passed
3. ✅ HindranceReportScreen.tsx - All tests passed
4. ✅ RoleManagementScreen.tsx - All tests passed
5. ✅ MaterialTrackingScreen.tsx - All tests passed (after import fix)
6. ✅ ItemsManagementScreen.tsx - All tests passed (after import fix)
7. ✅ ProjectManagementScreen.tsx - All tests passed
8. ✅ DailyReportsScreen.tsx - All tests passed (after syncStatus fix)
9. ✅ ReportsHistoryScreen.tsx - All tests passed
10. ✅ SiteManagementScreen.tsx (Supervisor) - All tests passed

### Remaining to Test (5 files) ⏳
1. ⏳ BaselineScreen.tsx
2. ⏳ DependencyModal.tsx
3. ⏳ ItemCreationScreen.tsx
4. ⏳ RoleSelectionScreen.tsx
5. ⏳ LoginScreen.tsx

---

## 🎯 Testing Objectives

### Primary Goals
1. ✅ Verify no Alert.alert dialogs appear
2. ✅ Verify all Snackbars appear at bottom of screen
3. ✅ Verify Snackbars auto-dismiss after 4 seconds
4. ✅ Verify ConfirmDialogs appear centered
5. ✅ Verify destructive actions show red confirm button
6. ✅ Verify validation snackbars are visible (not behind modals)
7. ✅ Verify correct colors: green (success), red (error), orange (warning), blue (info)

### Secondary Goals
1. Test error handling
2. Test edge cases
3. Verify data persistence
4. Check for console errors
5. Validate user workflow

---

## 📱 Test Environment Setup

### Prerequisites
```bash
# Start Metro bundler
npm start

# Run on Android (recommended for testing)
npm run android

# Or run on iOS
npm run ios
```

### Test Data Required
1. **Users:** admin, supervisor, manager, planner (create if missing)
2. **Projects:** At least 1 project with sites
3. **Sites:** At least 2 sites with items
4. **Items:** At least 5 WBS items with dates and dependencies
5. **Categories:** Default categories should exist

### Database Reset (If Needed)
```bash
# Option 1: Uninstall/reinstall app
# Option 2: Clear app data from device settings
# Option 3: Delete and reinstall (loses all data)
```

---

## 🧪 Detailed Test Cases

### 1. BaselineScreen.tsx (Planning Module) - 6 Alerts

**Login:** Use `planner` / `planner123`
**Navigate:** Planning → Baseline tab

#### Test Case 1.1: Load Items Error
**Steps:**
1. Select a project with no items
2. Observe empty state
3. Try to calculate critical path with no items

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears at bottom: "Failed to load items" (if error)
- ✅ Red color (error type)
- ✅ Auto-dismisses after 4 seconds

#### Test Case 1.2: Calculate Critical Path Success
**Steps:**
1. Select project with items that have dependencies
2. Click "Calculate Critical Path" button
3. Wait for calculation

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Critical Path: X items, Y days duration"
- ✅ Green color (success type)
- ✅ Critical path items highlighted in red borders
- ✅ Info card shows results

#### Test Case 1.3: Calculate Critical Path Error
**Steps:**
1. Select project with items
2. Force error (disconnect network if using backend)
3. Click "Calculate Critical Path"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Failed to calculate critical path"
- ✅ Red color (error type)

#### Test Case 1.4: Lock Baseline Confirmation
**Steps:**
1. Select project with items
2. Click "Lock Baseline" button
3. Observe confirmation dialog

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ ConfirmDialog appears centered
- ✅ Title: "Lock Baseline"
- ✅ Message: "This will save current planned dates as the baseline. This action cannot be easily undone. Continue?"
- ✅ Red "Lock Baseline" button (destructive)
- ✅ "Cancel" button (non-destructive)

#### Test Case 1.5: Lock Baseline Success
**Steps:**
1. Continue from 1.4, click "Lock Baseline"
2. Wait for operation

**Expected:**
- ✅ Dialog closes
- ✅ Snackbar appears: "Baseline locked successfully"
- ✅ Green color (success type)
- ✅ Items show locked indicator

#### Test Case 1.6: Lock Baseline Error
**Steps:**
1. Try locking when already locked or force error
2. Observe feedback

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Failed to lock baseline"
- ✅ Red color (error type)

---

### 2. DependencyModal.tsx (Planning Component) - 3 Alerts

**Login:** Use `planner` / `planner123`
**Navigate:** Planning → Baseline → Select item → "Manage Dependencies"

#### Test Case 2.1: Circular Dependency Validation
**Steps:**
1. Open dependency modal for Item A
2. Select Item B as dependency
3. Now open modal for Item B
4. Try to select Item A as dependency (circular)
5. Click Save

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Cannot save: Circular dependency detected"
- ✅ Red color (error type)
- ✅ Modal stays open (doesn't close)

#### Test Case 2.2: Save Dependencies Success
**Steps:**
1. Open dependency modal
2. Select 2-3 valid dependencies
3. Click Save

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Modal closes
- ✅ Snackbar appears: "Dependencies saved for [item name]"
- ✅ Green color (success type)
- ✅ Dependencies count updates on card

#### Test Case 2.3: Save Dependencies Error
**Steps:**
1. Open dependency modal
2. Force error (disconnect network if applicable)
3. Try to save

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Failed to save dependencies: [error]"
- ✅ Red color (error type)

---

### 3. ItemCreationScreen.tsx (Planning Module) - 1 Alert + Snackbar

**Login:** Use `planner` / `planner123`
**Navigate:** Planning → WBS → "+" button

#### Test Case 3.1: WBS Code Generation Error
**Steps:**
1. Navigate to ItemCreationScreen
2. Wait for WBS code generation
3. If error occurs (rare), observe feedback

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Failed to generate WBS code"
- ✅ Red color (error type)
- ✅ Custom Snackbar (not React Native Paper Snackbar)

#### Test Case 3.2: Create Item Success
**Steps:**
1. Fill in all required fields:
   - Item name: "Test Item"
   - Category: Select any
   - Quantity: "10"
   - Start date: Today
   - End date: Tomorrow
2. Click "Create Item" (checkmark icon)

**Expected:**
- ❌ NO Alert.alert dialog
- ❌ NO React Native Paper Snackbar
- ✅ Custom Snackbar appears: "WBS item created successfully"
- ✅ Green color (success type)
- ✅ Navigates back after 1.5 seconds

#### Test Case 3.3: Validation Errors
**Steps:**
1. Leave name empty
2. Click "Create Item"
3. Observe validation

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ HelperText shows under field (not snackbar)
- ✅ No navigation occurs

---

### 4. RoleSelectionScreen.tsx (Navigation) - 3 Alerts

**Login:** Complete login first
**Navigate:** Automatically shown after login

#### Test Case 4.1: Role Selection Validation
**Steps:**
1. Login as any user
2. Don't select any role
3. Click "Continue" button

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Please select a role"
- ✅ Orange color (warning type)
- ✅ No navigation occurs

#### Test Case 4.2: Navigate to Dashboard Success
**Steps:**
1. Select "Supervisor" role
2. Click "Continue"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ No snackbar (success flow)
- ✅ Navigates to Supervisor dashboard

#### Test Case 4.3: Navigate to Dashboard Error
**Steps:**
1. Select role
2. Force error (rare - may need to mock)
3. Click "Continue"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Failed to navigate to dashboard"
- ✅ Red color (error type)

#### Test Case 4.4: Logout
**Steps:**
1. Click logout icon (top right)
2. Observe navigation

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Navigates to LoginScreen
- ✅ If error: Snackbar "Failed to logout" (red)

---

### 5. LoginScreen.tsx (Auth Module) - 8 Alerts

**Navigate:** Start app

#### Test Case 5.1: Empty Credentials Validation
**Steps:**
1. Leave username and password empty
2. Click "Sign In"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Please enter both username and password"
- ✅ Orange color (warning type)

#### Test Case 5.2: Invalid Username
**Steps:**
1. Enter username: "nonexistent"
2. Enter password: "test123"
3. Click "Sign In"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Invalid username or password"
- ✅ Red color (error type)

#### Test Case 5.3: Invalid Password
**Steps:**
1. Enter username: "supervisor"
2. Enter password: "wrongpassword"
3. Click "Sign In"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Invalid username or password"
- ✅ Red color (error type)

#### Test Case 5.4: Inactive Account
**Steps:**
1. Create inactive user (via admin)
2. Try to login with inactive user

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Your account has been deactivated. Please contact an administrator."
- ✅ Red color (error type)

#### Test Case 5.5: Valid Login
**Steps:**
1. Enter username: "supervisor"
2. Enter password: "supervisor123"
3. Click "Sign In"

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ No snackbar (success flow)
- ✅ Navigates to RoleSelectionScreen or Dashboard

#### Test Case 5.6: Show Credentials Info Dialog
**Steps:**
1. Click "Show Default Credentials" link at bottom

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ ConfirmDialog appears centered
- ✅ Title: "Default Test Accounts"
- ✅ Message shows bullet list:
  - • admin / admin123
  - • supervisor / supervisor123
  - • manager / manager123
  - • planner / planner123
  - • logistics / logistics123
- ✅ Single "OK" button (non-destructive)
- ✅ Clicking OK or Cancel closes dialog

#### Test Case 5.7: Unknown Role Error
**Steps:**
1. Login with user that has unknown role (rare)

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "Unknown role type"
- ✅ Red color (error type)

#### Test Case 5.8: Login Error
**Steps:**
1. Force error during login (rare)

**Expected:**
- ❌ NO Alert.alert dialog
- ✅ Snackbar appears: "An error occurred during login"
- ✅ Red color (error type)

---

## ✅ Cross-Module Verification Tests

After completing file-specific tests, perform these cross-module checks:

### Test Set A: Visual Consistency
1. [ ] All Snackbars appear at **bottom** of screen
2. [ ] All ConfirmDialogs appear **centered**
3. [ ] Success snackbars are **green** (#4CAF50)
4. [ ] Error snackbars are **red** (#F44336)
5. [ ] Warning snackbars are **orange** (#FF9800)
6. [ ] Info snackbars are **blue** (#2196F3)

### Test Set B: Behavior Consistency
1. [ ] All Snackbars auto-dismiss after **4 seconds**
2. [ ] Snackbars can be dismissed by **swiping down**
3. [ ] ConfirmDialogs stay open until user clicks button
4. [ ] Destructive confirmations show **red** confirm button
5. [ ] Non-destructive confirmations show **blue** confirm button

### Test Set C: Validation Visibility
1. [ ] Validation snackbars appear **on top** of screen content
2. [ ] Validation snackbars are **NOT hidden** behind modals
3. [ ] Dialog closes **before** validation snackbar shows

### Test Set D: No Regressions
1. [ ] No Alert.alert dialogs appear **anywhere**
2. [ ] No console errors related to Snackbar/Dialog
3. [ ] App doesn't crash during any operation
4. [ ] All existing functionality still works

---

## 📊 Test Results Template

### File: ___________________________

| Test Case | Expected | Actual | Pass/Fail | Notes |
|-----------|----------|--------|-----------|-------|
| 1. | | | ☐ Pass ☐ Fail | |
| 2. | | | ☐ Pass ☐ Fail | |
| 3. | | | ☐ Pass ☐ Fail | |
| 4. | | | ☐ Pass ☐ Fail | |

### Issues Found:
1.
2.
3.

### Screenshots:
- [ ] Success snackbar
- [ ] Error snackbar
- [ ] Warning snackbar
- [ ] ConfirmDialog

---

## 🐛 Common Issues to Watch For

### Issue 1: Snackbar Behind Modal
**Symptom:** Validation snackbar not visible when dialog is open
**Cause:** Dialog not closed before showing snackbar
**Check:** Look for pattern: `setDialogVisible(false); showSnackbar(...);`

### Issue 2: Wrong Import Path
**Symptom:** "snackbar is not implemented" error
**Cause:** Import path incorrect
**Check:** Should be `../components/Snackbar` (one level up)

### Issue 3: Readonly Property Error
**Symptom:** Console error about readonly property
**Cause:** Using getter instead of field
**Check:** Use `syncStatusField` not `syncStatus`

### Issue 4: Snackbar Not Auto-Dismissing
**Symptom:** Snackbar stays visible indefinitely
**Cause:** Duration not set or wrong
**Check:** SnackbarProvider should have 4000ms duration

### Issue 5: Wrong Colors
**Symptom:** All snackbars same color
**Cause:** Type not passed correctly
**Check:** Second parameter should be: 'success', 'error', 'warning', or 'info'

---

## 📈 Testing Progress Tracker

### Session 1 (Already Completed) ✅
- [x] WBSManagementScreen.tsx
- [x] SiteInspectionScreen.tsx
- [x] HindranceReportScreen.tsx

### Session 2 (Already Completed) ✅
- [x] RoleManagementScreen.tsx
- [x] MaterialTrackingScreen.tsx
- [x] ItemsManagementScreen.tsx
- [x] ProjectManagementScreen.tsx

### Session 3 (Already Completed) ✅
- [x] DailyReportsScreen.tsx
- [x] ReportsHistoryScreen.tsx
- [x] SiteManagementScreen.tsx (Supervisor)

### Session 4 (Current - Remaining) ⏳
- [ ] BaselineScreen.tsx (~30 minutes)
- [ ] DependencyModal.tsx (~20 minutes)
- [ ] ItemCreationScreen.tsx (~20 minutes)
- [ ] RoleSelectionScreen.tsx (~15 minutes)
- [ ] LoginScreen.txt (~20 minutes)
- [ ] Cross-module verification (~30 minutes)

**Estimated Time:** 2-2.5 hours

---

## 🎯 Definition of Done

### File Testing Complete When:
- [ ] All test cases executed
- [ ] All expected behaviors verified
- [ ] No Alert.alert dialogs found
- [ ] All snackbars/dialogs work correctly
- [ ] No console errors
- [ ] Screenshots captured (optional)
- [ ] Issues documented

### Migration Complete When:
- [ ] All 13 files tested
- [ ] All test cases pass
- [ ] Cross-module verification passes
- [ ] No regressions found
- [ ] User feedback collected
- [ ] Final report updated

---

## 📞 Support

### If Issues Found:
1. Document issue in test results
2. Check common issues list above
3. Review migration patterns in SPRINT_1_DAY_3_PROGRESS_UPDATE.md
4. Check commit history for fixes
5. Create issue in GitHub if critical

### Resources:
- **Progress Report:** SPRINT_1_DAY_3_PROGRESS_UPDATE.md
- **Final Report:** ALERT_MIGRATION_COMPLETE.md
- **Planning Status:** PLANNING_MASTER_STATUS.md
- **Commit History:** `git log --oneline feature/v2.0`

---

**Tester:** ____________________
**Date Started:** ____________________
**Date Completed:** ____________________
**Overall Result:** ☐ Pass ☐ Fail (with issues)

---

**Good luck with testing! 🚀**
