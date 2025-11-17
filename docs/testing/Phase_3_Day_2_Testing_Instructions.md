# Phase 3 Day 2 - Requirement Edit Testing Instructions

**Feature:** DOORS Requirement Edit Screen with Auto-Statistics Recalculation
**Date:** November 14, 2025
**Tester:** _____________
**Test Environment:** React Native App (Metro Electrification Tracker)

---

## Pre-Test Setup

### 1. Start the Application
```bash
npm start
```

### 2. Login Credentials
- **Username:** `logistics`
- **Password:** `logistics123`
- **Role:** Logistics

### 3. Navigation Path
1. Open the app
2. Login as Logistics user
3. Tap on **DOORS** tab (📋 icon in bottom navigation)
4. You should see the DOORS Register with 5 packages

---

## Test Suite: Requirement Editing

### **Test 1: Verify Edit Icons on Requirements**
**Objective:** Confirm edit icons appear on requirement cards

**Steps:**
1. From DOORS Register, tap on **Package 1: Auxiliary Transformer (DRAFT)**
2. You'll see the Requirements tab with multiple requirements
3. Look at each requirement card

**Expected Result:**
- ✅ Each requirement card has a **pencil icon (✏️)** on the right side
- ✅ Icon is aligned with the requirement code and status badge

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Pass
_____________________________________________

---

### **Test 2: Navigate to Requirement Edit Screen**
**Objective:** Verify navigation to edit screen works

**Steps:**
1. On DoorsDetailScreen (Package 1), find requirement **TR-001**
2. Tap the **edit icon (✏️)** on TR-001 requirement card

**Expected Result:**
- ✅ DoorsRequirementEditScreen opens
- ✅ Screen shows header: "Edit Requirement"
- ✅ Cancel and Save buttons visible in header
- ✅ Requirement code "TR-001" displayed in read-only section

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Pass
_____________________________________________

---

### **Test 3: Read-Only Fields Display**
**Objective:** Verify read-only requirement details shown correctly

**Steps:**
1. While editing TR-001, review the "Requirement Details (Read-Only)" section

**Expected Result:**
- ✅ Shows Code: "TR-001"
- ✅ Shows full Requirement text (e.g., "Rated Power 1000kVA")
- ✅ Shows Specification Clause (if exists)
- ✅ Shows Acceptance Criteria
- ✅ All fields in gray background (read-only style)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** All Pass
_____________________________________________

---

### **Test 4: Edit Compliance Status to "Compliant"**
**Objective:** Change compliance status and verify save

**Steps:**
1. Editing TR-001 requirement
2. In "Compliance Status" section, tap **COMPLIANT** button
3. Note: Percentage field should NOT appear for "compliant" status
4. Tap **Save** button

**Expected Result:**
- ✅ Success alert: "Requirement updated successfully. Package statistics recalculated."
- ✅ Returns to DoorsDetailScreen
- ✅ TR-001 now shows status badge "compliant" (green)
- ✅ Tap on "Compliance" tab at top
- ✅ Overall compliance percentage should increase (was 0%, now should be ~8.3% = 1/12 requirements)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** After clicking Save button, it is circling and not updating. Save is not happenning.
_____________________________________________

---

### **Test 5: Edit Compliance Status to "Partial" with Percentage**
**Objective:** Test partial compliance with percentage input

**Steps:**
1. From DoorsDetailScreen (Package 1), find requirement **TR-002**
2. Tap edit icon on TR-002
3. In "Compliance Status" section, tap **PARTIAL** button
4. Verify that "Compliance Percentage (0-100)" input field appears
5. Enter **75** in the percentage field
6. Scroll down to "Vendor Response" section
7. Enter: "Vendor confirms 75% compliance. Remaining 25% pending test results."
8. Tap **Save**

**Expected Result:**
- ✅ Success alert appears
- ✅ Returns to DoorsDetailScreen
- ✅ TR-002 shows status "partial" (orange badge)
- ✅ Shows "75%" next to requirement
- ✅ Compliance tab shows increased percentage (now ~16.6% = 2/12 if counting compliant + partial)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working.
_____________________________________________

---

### **Test 6: Partial Compliance Validation (Invalid Percentage)**
**Objective:** Verify validation for partial compliance percentage

**Steps:**
1. Edit requirement **TR-003**
2. Select **PARTIAL** status
3. In percentage field, enter **150** (invalid - over 100)
4. Tap **Save**

**Expected Result:**
- ✅ Alert shows: "Compliance percentage must be between 0 and 100 for partial compliance"
- ✅ Does NOT save
- ✅ Stays on edit screen

**Steps (continued):**
5. Change percentage to **-10** (invalid - negative)
6. Tap **Save**

**Expected Result:**
- ✅ Same validation error appears
- ✅ Does NOT save

**Steps (continued):**
7. Change percentage to **50** (valid)
8. Tap **Save**

**Expected Result:**
- ✅ Success - saves correctly

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Fail, save not working
_____________________________________________

---

### **Test 7: Edit Review Status and Comments**
**Objective:** Test engineering review fields

**Steps:**
1. Edit requirement **TR-004**
2. In "Engineering Review" section, tap **APPROVED** button
3. In "Review Comments" field, enter: "Technical specifications verified. Approved for procurement."
4. Tap **Save**

**Expected Result:**
- ✅ Saves successfully
- ✅ Returns to detail screen
- ✅ (Review status is internal - not visible on card, but saved to DB)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

### **Test 8: Test All Compliance Status Options**
**Objective:** Verify all status buttons work

**Steps:**
1. Edit requirement **TR-005**
2. Tap each status button one by one:
   - NON_COMPLIANT
   - NOT_VERIFIED
   - COMPLIANT
   - PARTIAL (then enter percentage)
3. Finally select **NON_COMPLIANT**
4. Save

**Expected Result:**
- ✅ Each button highlights when selected (blue for compliance, green for review)
- ✅ Percentage field only appears when PARTIAL is selected
- ✅ Saves successfully with NON_COMPLIANT status
- ✅ Requirement shows red badge "non_compliant" on detail screen

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

### **Test 9: Cancel Without Saving**
**Objective:** Test cancel functionality and confirmation dialog

**Steps:**
1. Edit requirement **TR-006**
2. Change compliance status to **COMPLIANT**
3. Enter vendor response: "Test data"
4. Tap **Cancel** button (top left)

**Expected Result:**
- ✅ Alert shows: "Discard Changes?" with two options
- ✅ "Continue Editing" button - stays on screen
- ✅ "Discard" button (destructive style) - goes back

**Steps (continued):**
5. Tap "Continue Editing"

**Expected Result:**
- ✅ Stays on edit screen
- ✅ Changes still present

**Steps (continued):**
6. Tap Cancel again
7. Tap "Discard"

**Expected Result:**
- ✅ Returns to detail screen
- ✅ Changes NOT saved
- ✅ TR-006 still shows original status

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Pass
_____________________________________________

---

### **Test 10: Auto-Statistics Recalculation**
**Objective:** Verify package statistics update automatically after requirement edits

**Setup:**
1. From DOORS Register, tap **Package 1: Auxiliary Transformer**
2. Tap "Compliance" tab
3. Note the current "Overall Compliance" percentage: ___94____% (write it down)

**Steps:**
1. Go back to "Requirements" tab
2. Edit requirement **DS-001** (datasheet requirement)
3. Set compliance status to **COMPLIANT**
4. Save
5. You're back on DoorsDetailScreen
6. Tap "Compliance" tab

**Expected Result:**
- ✅ Overall compliance percentage has INCREASED (auto-recalculated)
- ✅ "Category Breakdown" section shows "Datasheet" category percentage increased
- ✅ No manual refresh needed - statistics updated automatically

**Steps (continued):**
7. Edit another requirement **DS-002**
8. Set to **COMPLIANT**
9. Save
10. Check Compliance tab again

**Expected Result:**
- ✅ Percentage increases again
- ✅ "Datasheet" category compliance continues to improve
- ✅ Changes are immediate

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** could not be verified due to save button
_not working____________________________________________

---

### **Test 11: Edit Requirements in Different Categories**
**Objective:** Verify category-wise compliance updates correctly

**Steps:**
1. Still on Package 1 detail screen
2. Edit a **Type Test** requirement (TT-001)
3. Set to **COMPLIANT**
4. Save
5. Check Compliance tab → verify "Type Test" category updated

**Expected Result:**
- ✅ Type Test compliance percentage increases

**Steps (continued):**
6. Edit a **Routine Test** requirement (RT-001)
7. Set to **COMPLIANT**
8. Save
9. Check Compliance tab → verify "Routine Test" category updated

**Expected Result:**
- ✅ Routine Test compliance percentage increases
- ✅ Each category updates independently

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save issue
_____________________________________________

---

### **Test 12: UI Refresh After Edit (Critical Test)**
**Objective:** Verify UI refreshes immediately without logout/tab switch

**Steps:**
1. Edit requirement **TR-007**
2. Note current compliance status (visible on card)
3. Change status to **COMPLIANT**
4. Save
5. **DO NOT switch tabs or logout**
6. Immediately look at TR-007 card

**Expected Result:**
- ✅ TR-007 card IMMEDIATELY shows updated status (green "compliant" badge)
- ✅ No need to logout/relogin
- ✅ No need to switch tabs
- ✅ Changes visible instantly

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

### **Test 13: Permission Test - Edit Approved Package**
**Objective:** Verify regular Logistics user cannot edit requirements in approved packages

**Steps:**
1. Go back to DOORS Register
2. Find **Package 2: OCS Equipment (APPROVED)**
3. Tap on it to open detail screen
4. Try to tap edit icon on any requirement

**Expected Result:**
- ✅ Edit icon should still be visible (permission check happens on save)
- ✅ Tap edit icon to open edit screen
- ✅ Make a change (e.g., set to COMPLIANT)
- ✅ Tap Save
- ✅ Error alert: "You don't have permission to edit requirements in this package. Package status: approved"
- ✅ Does NOT save

**Note:** Only Supervisors can edit requirements in approved packages (same permission as package editing)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

### **Test 14: Multiple Requirements Editing Session**
**Objective:** Test editing multiple requirements in sequence

**Steps:**
1. Return to **Package 1** (draft status)
2. Edit **TR-001** → Set COMPLIANT → Save
3. Edit **TR-002** → Set COMPLIANT → Save
4. Edit **TR-003** → Set COMPLIANT → Save
5. Edit **DS-001** → Set COMPLIANT → Save
6. Edit **DS-002** → Set COMPLIANT → Save

**Expected Result:**
- ✅ All edits save successfully
- ✅ Each time you return to detail screen, previous edits are visible
- ✅ No errors
- ✅ Compliance percentage increases with each save
- ✅ Final compliance should be ~41.7% (5 out of 12 requirements)

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

### **Test 15: Vendor Response Field (Multi-line Text)**
**Objective:** Test vendor response textarea

**Steps:**
1. Edit any requirement
2. In "Vendor Response" section, enter a long multi-line text:
```
Vendor confirms full compliance with technical specifications.

Test reports available:
- Temperature rise test: PASSED
- Voltage ratio test: PASSED
- No-load loss test: PASSED

Certification documents will be submitted by 2025-12-01.
```
3. Save

**Expected Result:**
- ✅ Multi-line text saves correctly
- ✅ Line breaks preserved
- ✅ No truncation

**Status:** ⬜ Pass / ⬜ Fail
**Observation:** Save not working
_____________________________________________

---

## Summary

**Total Tests:** 15
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

---

## Key Features Verified

- ✅ Edit icon navigation
- ✅ Read-only requirement details display
- ✅ Compliance status editing (all 4 statuses)
- ✅ Partial compliance with percentage validation
- ✅ Vendor response field
- ✅ Review status and comments
- ✅ Cancel with confirmation dialog
- ✅ Permission system (draft vs approved)
- ✅ **Auto-statistics recalculation** (CRITICAL)
- ✅ **Immediate UI refresh** (CRITICAL)
- ✅ Category-wise compliance updates
- ✅ Multi-line text fields

---

## Known Issues / Bugs Found

_____________________________________________
_____________________________________________
_____________________________________________

---

## Tester Notes

_____________________________________________
_____________________________________________
_____________________________________________

---

**Testing Complete:** ⬜ Yes / ⬜ No
**Ready for Day 3:** ⬜ Yes / ⬜ No
**Tester Signature:** _____________
**Date:** _____________
