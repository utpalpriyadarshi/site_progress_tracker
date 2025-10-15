# Planning Module - Quick Validation Testing Session

**Date:** 2025-10-14
**Tester:** Utpal
**Duration:** 90 minutes
**Objective:** Validate current planning module before WBS implementation

---

## Pre-Test Setup

### 1. Environment Preparation (5 minutes)

- [ ] Close all unnecessary applications
- [ ] Open React Native development environment
- [ ] Ensure device/emulator is ready
- [ ] Open browser console/React Native Debugger (optional, for logs)

### 2. Launch Application

```bash
# Start Metro bundler
npm start

# In another terminal, run the app
npm run android
# OR
npm run ios
```

**Expected Result:**
- [ ] App launches without crashes
- [ ] No red screen errors
- [ ] Metro bundler running successfully

**If app fails to launch:**
```bash
# Clear cache and retry
npm start -- --reset-cache
```

---

## Test 1: Launch App & Basic Navigation (10 minutes)

### 1.1 Login and Role Selection

**Steps:**
1. Launch the app
2. Log in with test credentials:
   - **Planner role:** `planner` / `planner123`
   - OR **Manager role:** `manager` / `manager123`
3. Navigate to home screen

**Checklist:**
- [ok ] Login screen displays correctly
- [ok ] Can enter credentials
- [ok ] Login successful
- [for planner no but for admin yes ] Role selection screen shows (if applicable)
- [ok ] Home screen loads

**Screenshot Location:** _prompts folder planning1.png________

---

### 1.2 Navigate to Planning Module

**Steps:**
1. From home screen, select **"Planner"** role (if not already selected)
2. Look at bottom navigation tabs
3. Tap **"Baseline"** tab

**Checklist:**
- [ok ] Bottom navigation visible
- [ok ] "Baseline" tab present
- [ok ] Tapping "Baseline" navigates to Baseline screen
- [ok ] Screen title shows "Baseline Planning" or similar
- [No crashes ] No crashes or errors

**Actual Screen Title:** _________

**Screenshot Location:** prompts folder planning2.png_________

---

### 1.3 Initial Screen State

**What you should see:**
- Project selector button/dropdown at top
- Message: "Select a Project" or similar
- No items displayed yet

**Checklist:**
- [ok ] UI renders completely
- [ok ] No blank/white screen
- [ok ] No React error boundaries triggered
- [ok ] Project selector visible and tappable

**Issues Found:** __none_______

---

## Test 2: Project & Item Loading (15 minutes)

### 2.1 Verify Test Data Exists

**Before testing, ensure you have:**
- At least 1 project created
- At least 1 site under that project
- At least 5-10 items added to the site
- Items have planned start/end dates set

**If test data missing:**
- [ok ] Option A: Create test data manually via Supervisor screens
- [ ] Option B: Check if SimpleDatabaseService initializes default data
- [ ] Option C: Use database seeding script (if available)

**Test Data Available:**
- Project Name: MEGA EP2_________
- Number of Items: 3_________

---

### 2.2 Select Project

**Steps:**
1. Tap the "Choose Project" button/dropdown
2. Observe the project list
3. Select a project (e.g., "Default Project" or your test project)

**Checklist:**
- [ok ] Dropdown/modal opens
- [ok ] Projects are listed
- [ok ] Can tap a project to select
- [ok ] Dropdown/modal closes after selection
- [ok ] Button updates to show selected project name

**Selected Project:** _MEGA EP2________

**Screenshot Location:** 

---

### 2.3 Verify Items Load

**After selecting project, items should load automatically.**

**Checklist:**
- [ok ] Items appear on screen (list or cards)
- [ok ] Each item shows:
  - [ok ] Item name
  - [ok ] Planned start date
  - [ok ] Planned end date
  - [ok ] Duration (calculated)
  - [ok ] Status (not_started / in_progress / completed)
- [ok ] Scroll works if many items
- [ok ] Loading is reasonably fast (< 2 seconds)

**Number of Items Loaded:** _3________

**Screenshot Location:** 

---

### 2.4 Item Card Information Accuracy

**Pick one item and verify details:**

**Item Selected:** _________

**Details to Verify:**
- [ok ] Name matches database/expected value
- [ok ] Start date formatted correctly (e.g., "Jan 1, 2025")
- [ok ] End date formatted correctly
- [ok ] Duration calculation correct (end - start = X days)
- [ok ] Status matches expected
- [ok ] Dependencies count shown (may be 0 initially)

**Calculated Duration:** _________ days
**Expected Duration:** _________ days
**Match:** [ ] Yes [ ] No

**Issues Found:** _none________

---

## Test 3: Dependency Management (20 minutes)

### 3.1 Open Dependency Modal

**Steps:**
1. Find an item card
2. Locate "Dependencies: X" section
3. Tap **"Manage"** button

**Checklist:**
- [ok ] Modal opens
- [ok ] Modal title shows item name
- [ok ] List of available items displays
- [ok ] Current item NOT shown in list (can't depend on itself)
- [ok ] Search bar visible (if implemented)

**Screenshot Location:** 
---

### 3.2 Add Dependencies (Normal Case)

**Steps:**
1. In dependency modal, select 2-3 items by checking boxes
2. Observe the counter: "X dependencies selected"
3. Tap **"Save"**

**Checklist:**
- [pk ] Can check/uncheck items
- [ok ] Counter updates correctly
- [ok ] Checkboxes respond to taps
- [ok ] "Save" button enabled
- [ok ] Tapping "Save" closes modal
- [ok ] Item card updates to show new dependency count

**Dependencies Added:**
- Item 1: _Foundation________
- Item 2: _Base Frame________
- Item 3: _________

**New Dependency Count:** _2________

**Screenshot Location:** ___prompt folder planning4.png______
observation:critical path analysis partly hids first item( AT)
---

### 3.3 Verify Dependencies Persist

**Steps:**
1. Navigate away from Baseline screen (e.g., go to another tab)
2. Return to Baseline screen
3. Check the same item's dependency count

**Checklist:**
- [ok ] Dependency count still correct
- [ok ] Can open modal and see selected items still checked
- [ok ] Data persisted in database

**Dependency Count After Reload:** No change_________
**Match:** [OK ] Yes [ ] No

---

### 3.4 Test Circular Dependency Prevention

**Steps:**
1. Item A → Add dependency on Item B → Save
2. Open Item B's dependencies
3. Try to add Item A as dependency to Item B
4. Tap "Save"

**Expected Behavior:**
- Alert/error message should appear
- Message should say: "Circular dependency detected" or similar
- Dependencies should NOT save

**Checklist:**
- [ok ] Alert appears
- [ok ] Error message clear and informative
- [ok ] Modal stays open (or closes without saving)
- [ok ] Item B does NOT have Item A as dependency
- [ok ] Can dismiss alert and try again

**Actual Alert Message:** _invalid dependencies,cannot save:circular dependency detected involving item AT________

**Screenshot Location:** 

**Result:** [Ok ] PASS (circular prevented) [ ] FAIL (circular allowed)

---

### 3.5 Test Cancel Button

**Steps:**
1. Open dependency modal
2. Select some items
3. Tap **"Cancel"**

**Checklist:**
- [ok ] Modal closes
- [ok ] Changes discarded (count doesn't update)
- [ok ] No database changes made

**Result:** [ok ] PASS [ ] FAIL

---

## Test 4: Critical Path Calculation (20 minutes)

### 4.1 Set Up Test Scenario

**For accurate critical path test, set up a clear dependency chain:**

**Recommended Setup:**
```
Item A (Foundation) → 5 days → no dependencies
Item B (Framing) → 10 days → depends on Item A
Item C (Roofing) → 7 days → depends on Item B
Item D (Plumbing) → 3 days → depends on Item A (parallel to B)
Item E (Electrical) → 4 days → depends on Item B (parallel to C)
```

**Expected Critical Path:** A → B → C (total: 22 days)

**Your Setup:**
- [ok ] At least 5 items created
- [ok ] Dependency chain configured
- [ok ] Start dates set appropriately

**Dependency Chain:**
- _________
- _________
- _________

---

### 4.2 Calculate Critical Path

**Steps:**
1. Look for **"Calculate Critical Path"** button
2. Tap the button

**Checklist:**
- [ok ] Button exists and is tappable
- [i could nor see ] Loading indicator shows (if applicable)
- [ok ] Calculation completes (< 1 second for small projects)
- [ok ] Alert/dialog shows result

**Screenshot Location:** prompt folder planning6.png_________
observations: critical path cover topmost items, visibility clipped for first item.
---

### 4.3 Verify Critical Path Results

**Expected Alert/Dialog Content:**
- Number of critical items found
- Total project duration

**Example:** "Found 3 critical items. Total project duration: 22 days"
observation: found 1 critical items. Total project duration 34 days.

**Checklist:**
- [ ok] Alert displays
- [ok ] Critical item count shown
- [ok ] Total duration shown
- [ok ] Numbers are logical

**Actual Alert Message:** found 1 critical items. Total project duration 23 days._________

**Critical Items Count:** 1_________
**Total Duration:** 23_________ days
Observation: I changed the dates after that critical path vanishes
---

### 4.4 Visual Indicators for Critical Path

**After calculation, check item cards:**

**Checklist:**
- [ ] Critical items have RED border (or other visual indicator)
- [ok ] Critical items show "Critical Path" chip/badge
- [ok ] Non-critical items do NOT have red border
- [ok ] Visual distinction is clear

**Critical Items (should have red border):**
- [No ] Item A: _________
- [No ] Item B: _________
- [No ] Item C: _________

**Non-Critical Items (should NOT have red border):**
- [ ] Item D: _________
- [ok ] Item E: observation: after date change criticality vanishes_________

**Screenshot Location:** _prompt folder planning8.png________

**Result:** [ok ] PASS [ ] FAIL
look if any inconsistencies if any
---

### 4.5 Verify Database Updates

**Steps:**
1. Restart the app
2. Navigate back to Baseline screen
3. Check if critical path indicators persist

**Checklist:**
- [ok ] Critical path flags persist after restart
- [ok ] Red borders still visible
- [ok ] Database field `critical_path_flag` set correctly

**Result:** [ok ] PASS [ ] FAIL

---

### 4.6 Info Card Display

**After calculating critical path, look for an info card:**

**Checklist:**
- [didnot notice ] Blue info card appears (or similar)
- [ok ] Message explains critical path
- [ok ] Example: "Items with red borders are on the critical path"

**Screenshot Location:** _____

---

## Test 5: Baseline Locking (15 minutes)

### 5.1 Pre-Lock State

**Before locking, verify current state:**

**Checklist:**
- [ok ] "Lock Baseline" button visible and enabled
- [ok ] Date pickers are ENABLED (can tap and change dates)
- [ok ] Dependency "Manage" buttons are ENABLED
- [No ] No "Baseline Locked" warning card visible

**Screenshot Location:** _prompt folder planning9.png________

---

### 5.2 Lock Baseline

**Steps:**
1. Locate **"Lock Baseline"** button
2. Tap the button
3. Read confirmation dialog carefully

**Expected Dialog Content:**
- Warning that baseline will be locked
- Explanation that dates will be saved
- Note that action cannot be easily undone
- "Cancel" and "Lock Baseline" buttons

**Checklist:**
- [ok ] Confirmation dialog appears
- [ok ] Dialog text is clear
- [ok ] Both buttons present

**Screenshot Location:** 

---

### 5.3 Confirm Lock

**Steps:**
1. In confirmation dialog, tap **"Lock Baseline"**
2. Wait for success message

**Checklist:**
- [ok ] Success alert shows: "Baseline locked successfully" or similar
- [ok ] Dialog dismisses
- [ok ] UI updates immediately

**Screenshot Location:** _________

---

### 5.4 Post-Lock State Verification

**After locking, verify UI changes:**

**Button State:**
- [ok ] "Lock Baseline" button now shows "Baseline Locked"
- [ok ] Button is DISABLED (greyed out)
- [ok ] Cannot tap button again

**Warning Card:**
- [ok ] Orange/yellow warning card appears at top of screen
- [ok ] Message explains baseline is locked
- [no ] Example: "Baseline is locked. Dates cannot be edited."
observation: Baseline is locked, use schedule update screen to make changes.

**Item Cards:**
- [ok ] All item cards show "Locked" chip/badge
- [ok ] Date pickers are DISABLED (greyed out, not tappable)
- [ok ] Dependency "Manage" buttons are DISABLED

**Baseline Info Bars:**
- [ok ] Blue info bar appears on each item card
- [ok ] Shows baseline start and end dates
- [ok ] Example: "Baseline: Jan 1 - Jan 10"

**Screenshot Location:** _________

---

### 5.5 Try to Edit Dates (Should Fail)

**Steps:**
1. Try to tap a start date field
2. Try to tap an end date field

**Expected Behavior:**
- Date picker should NOT open
- Fields should be unresponsive

**Checklist:**
- [ok ] Start date field unresponsive
- [ok ] End date field unresponsive
- [ok ] No date picker opens
- [ok ] Visual indication fields are disabled (greyed out)

**Result:** [ok ] PASS (editing prevented) [ ] FAIL (can still edit)

---

### 5.6 Try to Manage Dependencies (Should Fail)

**Steps:**
1. Try to tap "Manage" button on any item

**Expected Behavior:**
- Button should be disabled
- Modal should NOT open
- OR alert should show explaining baseline is locked

**Checklist:**
- [ok ] "Manage" button disabled or shows warning
- [ok ] Cannot modify dependencies

**Result:** [ok ] PASS (editing prevented) [ ] FAIL (can still edit)

---

### 5.7 Database Verification (Optional - Advanced)

**If you have access to database inspection tools:**

**Steps:**
1. Query the items table
2. Check fields for one item

**Expected Database State:**
```javascript
{
  id: 'item-123',
  planned_start_date: 1704067200000,  // Jan 1, 2025
  planned_end_date: 1704672000000,    // Jan 7, 2025
  baseline_start_date: 1704067200000, // Same as planned (locked)
  baseline_end_date: 1704672000000,   // Same as planned (locked)
  is_baseline_locked: true,           // TRUE
}
```

**Checklist:**
- [ ] `is_baseline_locked` = true
- [ ] `baseline_start_date` = `planned_start_date`
- [ ] `baseline_end_date` = `planned_end_date`

**Result:** [ ] PASS [ ] FAIL [ ] SKIPPED

---

### 5.8 Baseline Persistence After Restart

**Steps:**
1. Close the app completely
2. Relaunch the app
3. Navigate back to Baseline screen

**Checklist:**
- [ok ] Baseline still locked
- [ok ] "Baseline Locked" button still disabled
- [ok ] Warning card still visible
- [ok ] Date fields still disabled
- [ok ] Baseline info bars still visible

**Result:** [ok ] PASS [ ] FAIL

---

## Test 6: Quick Regression Check (10 minutes)

**Objective:** Ensure planning module didn't break existing features.

### 6.1 Navigate to Other Screens

**Steps:**
1. From Baseline screen, navigate to other tabs:
   - Gantt Chart (if available)
   - Schedule Management (if available)
   - Resources (if available)

**Checklist:**
- [ok ] Can navigate to other tabs
- [ok ] Other screens load without crashes
- [ok ] No console errors

**Screenshot Locations:**
- Gantt: __ok_______
- Schedule: _ok________
- Resources: __ok
- milestones ok ( is also there)_______

---

### 6.2 Navigate to Supervisor Screens

**Steps:**
1. Go back to home/role selection
2. Switch to **Supervisor** role (if available)
3. Check these screens:
   - Items Management
   - Daily Reports
   - Progress Tracking

**Checklist:**
- [ok ] Can switch roles
- [ok ] Supervisor screens load
- [ok ] Items still display correctly
- [ok ] Can view progress
- [ok ] No crashes

**Issues Found:** _no________

---

### 6.3 Database Query Performance

**Steps:**
1. In Baseline screen, switch between projects multiple times
2. Observe loading time

**Checklist:**
- [ok ] Project switching is fast (< 1 second)
- [ok ] No noticeable lag
- [ok ] Items load quickly each time

**Average Loading Time:** _________ ms

**Result:** [ok ] PASS (< 2s) [ ] FAIL (> 2s)

---

## Test Results Summary

### Overall Results

**Total Tests Run:** _________
**Tests Passed:** _________
**Tests Failed:** _________
**Tests Blocked/Skipped:** _________

**Pass Rate:** _________ %

---

### Critical Issues Found

**Priority: CRITICAL (blocks WBS implementation)**

1. Issue: _________
   - Severity: Critical
   - Impact: _________
   - Must fix before WBS: [ ] Yes [ ] No

2. Issue: _________
   - Severity: Critical
   - Impact: _________
   - Must fix before WBS: [ ] Yes [ ] No

---

### Medium Issues Found

**Priority: MEDIUM (should fix but not blocking)**

1. Issue: _________
   - Severity: Medium
   - Impact: _________
   - Can defer to later: [ ] Yes [ ] No

2. Issue: _________
   - Severity: Medium
   - Impact: _________
   - Can defer to later: [ ] Yes [ ] No

---

### Minor Issues Found

**Priority: LOW (cosmetic or edge cases)**

1. Issue: _________
2. Issue: _________
3. Issue: _________

---

## Screenshots Collected

**Organize screenshots by test:**

1. Test 1 - Navigation: _________
2. Test 2 - Item Loading: _________
3. Test 3 - Dependency Modal: _________
4. Test 4 - Critical Path: _________
5. Test 5 - Baseline Lock: _________
6. Test 6 - Regression: _________

**Screenshot Folder:** _________

---

## Console Errors Log

**Any errors or warnings seen in console/debugger:**

```
Timestamp: _________
Error: _________
Stack Trace: _________
```

```
Timestamp: _________
Error: _________
Stack Trace: _________
```

---

## Performance Observations

**Loading Times:**
- App launch: _________ seconds
- Baseline screen first load: _________ seconds
- Project selection: _________ seconds
- Dependency modal open: _________ ms
- Critical path calculation: _________ ms
- Baseline lock: _________ ms

**Memory Usage (if available):**
- Initial: _________ MB
- After loading items: _________ MB
- After critical path: _________ MB

**CPU Usage:**
- [ ] Normal (no spikes)
- [ ] High during calculations
- [ ] Concerning/laggy

---

## Decision: Proceed with WBS Implementation?

### Assessment

**Current System Stability:**
- [ ] 🟢 STABLE - All tests passed, ready for WBS
- [ ] 🟡 MINOR ISSUES - Can proceed with minor fixes
- [ ] 🔴 UNSTABLE - Must fix critical issues first

### Recommendation

**Based on test results:**

- [ ] ✅ **PROCEED** - Start Sprint 1 (WBS Database) immediately
- [ ] ⚠️ **FIX FIRST** - Fix critical issues, then start WBS
- [ ] ❌ **STABILIZE** - Significant work needed before WBS

**Estimated Fix Time (if needed):** _________ hours

---

## Next Steps

### If All Tests Pass (Green Light)

**Immediate Actions:**
1. [ ] Tag current commit as `v1.4-baseline-tested`
2. [ ] Create backup of database
3. [ ] Review Sprint 1 plan (WBS Database)
4. [ ] Begin schema migration (v11 → v12)
5. [ ] Create new branch: `feature/v1.3-wbs`

**Timeline:**
- Start Sprint 1: _________
- Target completion: _________ (Week 1)

---

### If Issues Found (Yellow/Red Light)

**Immediate Actions:**
1. [ ] Document all issues in GitHub issues or tracking system
2. [ ] Prioritize critical issues
3. [ ] Estimate fix time for each issue
4. [ ] Fix critical issues first
5. [ ] Re-run tests after fixes
6. [ ] Iterate until green light

**Estimated Delay:** _________ hours/days

---

## Tester Sign-Off

**I certify that:**
- [ ] I have completed all applicable tests
- [ ] I have documented all issues found
- [ ] Screenshots have been collected
- [ ] Results are accurate to the best of my knowledge

**Tester Name:** Utpal
**Date:** 2025-10-14
**Signature:** _________________

**Recommendation:**
- [ ] Approve for WBS implementation
- [ ] Conditional approval (fix minor issues)
- [ ] Do not proceed (fix critical issues first)

---

## Additional Notes

**Any other observations, suggestions, or concerns:**

_________________________________________
_________________________________________
_________________________________________
_________________________________________

---

**END OF TESTING CHECKLIST**

**Good luck with testing!**

After completing this checklist, proceed to:
- Fix any issues found (if needed)
- Review `PLANNER_ITEM_CREATION_IMPLEMENTATION_PLAN.md`
- Begin Sprint 1 implementation
