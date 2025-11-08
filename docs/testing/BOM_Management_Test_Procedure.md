# BOM Management - Manual Test Procedure

**Feature:** Manager BOM Management Screen
**Date:** November 7, 2025
**Version:** v2.3
**Tester:** [Your Name]
**Status:** 🔴 Not Started

---

## 📋 Test Overview

This document provides step-by-step instructions for testing the BOM (Bill of Materials) Management feature in the Manager role. The feature follows the same pattern as Supervisor screens (SiteManagement, MaterialTracking).

### Success Criteria

✅ **PASS** = All steps work as described, data appears immediately
⚠️ **PARTIAL** = Feature works but with issues (document the issues)
❌ **FAIL** = Feature doesn't work, critical errors

---

## 🚀 Pre-Test Setup

### Step 1: Start the Application

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Run on Android (or iOS)
npm run android
# OR
npm run ios
```

**Expected:** App launches without errors

### Step 2: Login as Manager

1. Open the app
2. Login with Manager credentials
3. Navigate to Manager role (if not already selected)

**Expected:** Manager Navigator appears with 5 tabs:
- Overview
- Team
- Finance
- Requests
- **BOM** ← Click this tab

### Step 3: Navigate to BOM Management

**Expected:** BOM Management screen opens with:
- Header: "BOM Management" + "Add BOM" button
- Two tabs: "Pre-Contract (Estimating)" | "Post-Contract (Execution)"
- Empty state message (if no BOMs exist)

---

## 📝 Test Scenarios

---

## **Test Scenario 1: Empty State Display**

### Objective
Verify that the empty state displays correctly when no BOMs exist.

### Prerequisites
- No BOMs in database (fresh install OR delete all BOMs first)

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1.1 | Open BOM Management tab | Empty state card appears | [ ] | |
| 1.2 | Verify empty state text | Shows: "No Estimating BOMs found" | [ ] | |
| 1.3 | Verify hint text | Shows: "Click 'Add BOM' to create your first BOM" | [ ] | |
| 1.4 | Switch to "Post-Contract" tab | Shows: "No Execution BOMs found" | [ ] | |
| 1.5 | Switch back to "Pre-Contract" tab | Tab switches smoothly | [ ] | |

**Result:** [ Yes] PASS / [ ] PARTIAL / [ ] FAIL

**Issues Found:**
```
[Write any issues here]
```

---

## **Test Scenario 2: Create First BOM (Pre-Contract)**

### Objective
Create a BOM and verify it appears immediately in the list.

### Prerequisites
- At least 1 project exists (if not, create one first from Manager → Overview)

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 2.1 | Click "Add BOM" button | Dialog opens with title "Add New BOM" | [ ] | |
| 2.2 | Verify form fields visible | BOM Name, Project selector, Type selector, Quantity, Unit, Client, Description | [ ] | |
| 2.3 | Enter BOM Name: "Test BOM v1.0" | Text appears in field | [ ] | |
| 2.4 | Select a project from list | Project gets selected (radio button marked) | [ ] | |
| 2.5 | Verify BOM Type | "Estimating" is pre-selected | [ ] | |
| 2.6 | Enter Quantity: "2" | Number appears | [ ] | |
| 2.7 | Enter Unit: "apartments" | Text appears | [ ] | |
| 2.8 | Enter Client: "ABC Builders" | Text appears | [ ] | |
| 2.9 | Enter Description: "Main tower BOM for tender" | Text appears | [ ] | |
| 2.10 | Click "Create" button | Dialog closes | [ ] | |
| 2.11 | **CRITICAL:** Verify BOM appears in list | **Card with "Test BOM v1.0" appears IMMEDIATELY** | [ ] | **KEY TEST** |
| 2.12 | Verify status chip | Shows "draft" in gray | [ ] | |
| 2.13 | Verify BOM details on card | Shows: Project, Quantity (2 apartments), Version (v1.0), Client | [ ] | |
| 2.14 | Verify items section | Shows "Items (0)" with "Add Item" button | [ ] | |
| 2.15 | Verify empty items text | Shows: "No items added yet. Click 'Add Item' to start." | [ ] | |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL

**Issues Found:**
```
-status chip 'draft' is not clearly visible, 
-want to add following fields for BOM categorization ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct as dropdown, 
-Since we are dealing one project with muliple sites (like RSS1, RSS2, ASS1, Ass2) etc at a time, client name at this place is not required.
-Actually Add items is having several of these things, please clarify what is Add item within Add BOM
[Write any issues here]

Example:
- BOM created but didn't appear in list (had to refresh)
- Total cost not showing
- Status chip wrong color
```

---

## **Test Scenario 3: Add BOM Items**

### Objective
Add multiple items to a BOM and verify they appear immediately with cost calculations.

### Prerequisites
- BOM created from Test Scenario 2 (or create one)

### Test Steps - Item 1: Material

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 3.1 | Click "Add Item" on BOM card | Item dialog opens with title "Add Item" | [ ] | |
| 3.2 | Verify form fields | Item Code, Description, Category (chips), Quantity, Unit, Unit Cost, Phase, WBS Code | [ ] | |
| 3.3 | Enter Item Code: "MAT-001" | Text appears | [ ] | |
| 3.4 | Enter Description: "Portland Cement OPC 53" | Text appears | [ ] | |
| 3.5 | Select Category: "material" | Chip becomes filled/selected | [ ] | |
| 3.6 | Enter Quantity: "100" | Number appears | [ ] | |
| 3.7 | Enter Unit: "bags" | Text appears | [ ] | |
| 3.8 | Enter Unit Cost: "450" | Number appears | [ ] | |
| 3.9 | Enter Phase: "foundation" | Text appears | [ ] | |
| 3.10 | Enter WBS Code: "1.2.1" | Text appears | [ ] | |
| 3.11 | Click "Add" button | Dialog closes | [ ] | |
| 3.12 | **CRITICAL:** Verify item appears | **Item "MAT-001" appears in BOM card IMMEDIATELY** | [ ] | **KEY TEST** |
| 3.13 | Verify item details | Shows: Portland Cement OPC 53, 100 bags × ₹450 = ₹45,000 | [ ] | |
| 3.14 | Verify category chip | Shows "material" chip | [ ] | |
| 3.15 | Verify item count | "Items (1)" instead of (0) | [ ] | |
| 3.16 | **CRITICAL:** Verify total cost appears | **"Total Estimated Cost: ₹45,000"** appears at bottom | [ ] | **KEY TEST** |

**Result:** [yes ] PASS / [ ] PARTIAL / [ ] FAIL

### Test Steps - Item 2: Labor

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 3.17 | Click "Add Item" again | Dialog opens | [ ] | |
| 3.18 | Enter Item Code: "LAB-001" | Text appears | [ ] | |
| 3.19 | Enter Description: "Mason work" | Text appears | [ ] | |
| 3.20 | Select Category: "labor" | Labor chip selected | [ ] | |
| 3.21 | Enter Quantity: "200" | Number appears | [ ] | |
| 3.22 | Enter Unit: "hours" | Text appears | [ ] | |
| 3.23 | Enter Unit Cost: "500" | Number appears | [ ] | |
| 3.24 | Click "Add" | Dialog closes | [ ] | |
| 3.25 | **CRITICAL:** Verify item appears | **LAB-001 appears IMMEDIATELY** | [ ] | **KEY TEST** |
| 3.26 | Verify calculation | Shows: 200 hours × ₹500 = ₹1,00,000 | [ ] | |
| 3.27 | Verify item count | "Items (2)" | [ ] | |
| 3.28 | **CRITICAL:** Verify total updated | **"Total Estimated Cost: ₹1,45,000"** (45k + 100k) | [ ] | **KEY TEST** |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL
The button below added item is not visible
### Test Steps - Item 3: Equipment

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 3.29 | Add third item: "EQP-001" | - | [ ] | |
| 3.30 | Description: "Concrete Mixer Rental" | - | [ ] | |
| 3.31 | Category: "equipment" | - | [ ] | |
| 3.32 | Quantity: "30", Unit: "days" | - | [ ] | |
| 3.33 | Unit Cost: "2000" | - | [ ] | |
| 3.34 | Click "Add" | Item appears immediately | [ ] | |
| 3.35 | **CRITICAL:** Verify total updated | **"Total Estimated Cost: ₹2,05,000"** (145k + 60k) | [ ] | **KEY TEST** |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL

**Issues Found:**
```
[Write any issues here]

Example:
- Items added but total cost not updating
- Category chip not showing
- Calculation incorrect (100 × 450 ≠ 45,000)
```

---

## **Test Scenario 4: Edit BOM**

### Objective
Edit a BOM and verify changes appear immediately.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 4.1 | Click ✏️ (pencil) icon on BOM card | Edit dialog opens with pre-filled data | [ ] | |
| 4.2 | Verify BOM Type field | Should be **disabled/hidden** (can't change type after creation) | [ ] | | Not diasble
| 4.3 | Change BOM Name to: "Test BOM v1.1" | Text updates | [ ] | | yes
| 4.4 | Change Quantity to: "3" | Number updates | [ ] | |
| 4.5 | Change Client to: "ABC Builders Ltd" | Text updates | [ ] | |
| 4.6 | Update Description | Text updates | [ ] | |
| 4.7 | Click "Update" button | Dialog closes | [ ] | |
| 4.8 | **CRITICAL:** Verify changes appear | **Card shows "Test BOM v1.1", "3 apartments", updated client IMMEDIATELY** | [ ] | **KEY TEST** |

**Result:** [Yes ] PASS / [yes ] PARTIAL / [ ] FAIL

---

## **Test Scenario 5: Edit BOM Item**

### Objective
Edit an item and verify total cost recalculates immediately.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 5.1 | Click ✏️ icon on MAT-001 item | Edit item dialog opens | [ ] | |
| 5.2 | Verify fields pre-filled | All data from creation is present | [ ] | |
| 5.3 | Change Quantity to: "150" | Number updates | [ ] | |
| 5.4 | Change Unit Cost to: "480" | Number updates | [ ] | |
| 5.5 | Click "Update" | Dialog closes | [ ] | |
| 5.6 | **CRITICAL:** Verify item updates | **Shows: 150 bags × ₹480 = ₹72,000** | [ ] | **KEY TEST** |
| 5.7 | **CRITICAL:** Verify total recalculates | **Total: ₹2,32,000** (72k + 100k + 60k) | [ ] | **KEY TEST** |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL

**Issues Found:**
```
[Write any issues here]
```

---

## **Test Scenario 6: Delete BOM Item**

### Objective
Delete an item and verify total cost recalculates immediately.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 6.1 | Click 🗑️ icon on EQP-001 item | Confirmation dialog appears | [ ] | |
| 6.2 | Verify confirmation message | Shows: "Are you sure you want to delete 'EQP-001'?" | [ ] | |
| 6.3 | Click "Confirm" | Dialog closes | [ ] | |
| 6.4 | **CRITICAL:** Verify item removed | **EQP-001 disappears from card IMMEDIATELY** | [ ] | **KEY TEST** |
| 6.5 | Verify item count | "Items (2)" instead of (3) | [ ] | |
| 6.6 | **CRITICAL:** Verify total recalculates | **Total: ₹1,72,000** (72k + 100k, equipment removed) | [ ] | **KEY TEST** |

**Result:** [yes ] PASS / [ ] PARTIAL / [ ] FAIL

---

## **Test Scenario 7: Delete BOM**

### Objective
Delete a BOM and verify it's removed immediately with all items.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 7.1 | Click 🗑️ icon on BOM card | Confirmation dialog appears | [ ] | |
| 7.2 | Verify confirmation message | Shows: "Are you sure you want to delete 'Test BOM v1.1'? All items will be deleted." | [ ] | |
| 7.3 | Click "Confirm" | Dialog closes | [ ] | |
| 7.4 | **CRITICAL:** Verify BOM removed | **BOM card disappears IMMEDIATELY** | [ ] | **KEY TEST** |
| 7.5 | Verify empty state | If no other BOMs, empty state appears again | [ ] | |

**Result:** [yes] PASS / [ ] PARTIAL / [ ] FAIL

---

## **Test Scenario 8: Multiple BOMs (Pre-Contract vs Post-Contract)**

### Objective
Create BOMs of different types and verify tab filtering works.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 8.1 | Create BOM: "Estimating BOM 1" (type: estimating) | BOM appears in Pre-Contract tab | [ ] | |
| 8.2 | Create BOM: "Estimating BOM 2" (type: estimating) | Second BOM appears | [ ] | |
| 8.3 | Verify count | 2 BOMs visible in Pre-Contract tab | [ ] | |
| 8.4 | Switch to "Post-Contract" tab | Should show empty state | [ ] | |
| 8.5 | Click "Add BOM" in Post-Contract tab | Dialog opens | [ ] | |
| 8.6 | Verify BOM Type pre-selected | "Execution" should be pre-selected | [ ] | |
| 8.7 | Create BOM: "Execution BOM 1" (type: execution) | BOM appears in Post-Contract tab | [ ] | |
| 8.8 | Verify status | Should show "baseline" (not "draft") | [ ] | |
| 8.9 | Switch back to Pre-Contract tab | Shows 2 estimating BOMs | [ ] | |
| 8.10 | Verify execution BOM not shown | Execution BOM only in Post-Contract tab | [ ] | |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL
Actually pre contract BOM should be possible to copy to post contract data where editing, deleting should be possible.
---

## **Test Scenario 9: Data Persistence (App Restart)**

### Objective
Verify BOMs and items persist after closing and reopening the app.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 9.1 | Note down number of BOMs and items | Example: 3 BOMs, BOM 1 has 5 items | [ ] | |
| 9.2 | Close the app completely | App closes | [ ] | |
| 9.3 | Reopen the app | App launches | [ ] | |
| 9.4 | Login and navigate to BOM Management | Screen opens | [ ] | |
| 9.5 | **CRITICAL:** Verify all BOMs present | **All 3 BOMs appear** | [ ] | **KEY TEST** |
| 9.6 | **CRITICAL:** Verify all items present | **BOM 1 still has 5 items** | [ ] | **KEY TEST** |
| 9.7 | Verify cost calculations preserved | Total costs match what was created | [ ] | |

**Result:** [Yes ] PASS / [ ] PARTIAL / [ ] FAIL

---

## **Test Scenario 10: Edge Cases & Validation**

### Objective
Test error handling and validation.

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 10.1 | Click "Add BOM" | Dialog opens | [ ] | |
| 10.2 | Leave BOM Name empty, click "Create" | Warning snackbar: "Please fill in all required fields" | [ ] | |
| 10.3 | Enter name, leave Quantity empty, click "Create" | Warning appears | [ ] | |
| 10.4 | Enter name, leave Unit empty, click "Create" | Warning appears | [ ] | |
| 10.5 | Fill all required fields, click "Create" | BOM created successfully | [ ] | |
| 10.6 | Click "Add Item" | Dialog opens | [ ] | |
| 10.7 | Leave Item Code empty, click "Add" | Warning: "Please fill in all required fields" | [ ] | |
| 10.8 | Enter code, leave Description empty, click "Add" | Warning appears | [ ] | |
| 10.9 | Enter non-numeric Quantity "abc", click "Add" | Should handle gracefully (0 or error) | [ ] | |
| 10.10 | Enter negative Unit Cost "-100" | Should handle gracefully | [ ] | | negative quantity is added
| 10.11 | Fill all valid fields, click "Add" | Item created successfully | [ ] | |

**Result:** [yes ] PASS / [yes ] PARTIAL / [ ] FAIL

---

## **Test Scenario 11: Category Filtering (Visual Test)**

### Objective
Verify different item categories display correctly.

### Prerequisites
- Create 1 BOM with items from all 4 categories

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 11.1 | Add item with category "material" | Chip shows "material" | [ ] | |
| 11.2 | Add item with category "labor" | Chip shows "labor" | [ ] | |
| 11.3 | Add item with category "equipment" | Chip shows "equipment" | [ ] | |
| 11.4 | Add item with category "subcontractor" | Chip shows "subcontractor" | [ ] | |
| 11.5 | Verify all 4 items visible | All items display correctly | [ ] | |
| 11.6 | Verify total cost | Sum of all 4 items | [ ] | |

**Result:** [yes ] PASS / [ ] PARTIAL / [ ] FAIL

---

## **Test Scenario 12: No Projects Available**

### Objective
Test behavior when no projects exist.

### Prerequisites
- Delete all projects (or test on fresh database)

### Test Steps

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 12.1 | Click "Add BOM" | Dialog should show error OR | [ ] | |
| 12.2 | Verify snackbar message | "Please create a project first" | [ ] | |
| 12.3 | Dialog closes or shows empty project list | User is prevented from creating BOM | [ ] | |

**Result:** [yes ] PASS / [ ] PARTIAL / [ ] FAIL

---

## 📊 Test Summary

### Overall Test Results

| Scenario | Status | Critical Issues | Minor Issues |
|----------|--------|----------------|--------------|
| 1. Empty State | [ ] PASS / [ ] FAIL | | |
| 2. Create BOM | [ ] PASS / [ ] FAIL | | |
| 3. Add Items | [ ] PASS / [ ] FAIL | | |
| 4. Edit BOM | [ ] PASS / [ ] FAIL | | |
| 5. Edit Item | [ ] PASS / [ ] FAIL | | |
| 6. Delete Item | [ ] PASS / [ ] FAIL | | |
| 7. Delete BOM | [ ] PASS / [ ] FAIL | | |
| 8. Tab Filtering | [ ] PASS / [ ] FAIL | | |
| 9. Data Persistence | [ ] PASS / [ ] FAIL | | |
| 10. Validation | [ ] PASS / [ ] FAIL | | |
| 11. Categories | [ ] PASS / [ ] FAIL | | |
| 12. No Projects | [ ] PASS / [ ] FAIL | | |

### **Overall Assessment**

- **Total Scenarios:** 12
- **Passed:** ___
- **Failed:** ___
- **Partial:** ___

**Final Status:** [ ] ✅ READY FOR PRODUCTION / [ ] ⚠️ NEEDS FIXES / [ ] ❌ MAJOR ISSUES

---

## 🐛 Issues Log

### Critical Issues (Blockers)

```
-I have provided my pass/fail status in each test scenario, -I have provide some observations also. This test gives me confidence that we are proceeding in write direction. Some correction/adjustment will give us desired output.
-Item code and WBS code are not essential here
-Select project shoulbe good if is dropdown.
-BOM Management appears two times one left side of Logout and one left side of Add BOM

[List critical issues that prevent feature from working]

Example:
1. BOMs created but don't appear in list - requires app restart
2. Total cost calculation incorrect: 100 × 450 = 4500 instead of 45000
3. Deleting BOM doesn't delete items
```

### Minor Issues (Non-Blockers)

```
[List minor issues that don't prevent core functionality]

Example:
1. Status chip color slightly off
2. Currency formatting shows ₹45000 instead of ₹45,000
3. Edit dialog takes 2 seconds to open
```

### UI/UX Suggestions

```
[List improvements for better user experience]

Example:
1. Add search/filter for BOMs-Yes
2. Show item count badge on BOM card-yes
3. Add sort by date/name-yes
3. Sould be able to export
```

---

## 📸 Screenshots

**Attach screenshots here:**

1. Empty state:
2. BOM card with items:
3. Add BOM dialog:
4. Add Item dialog:
5. Confirmation dialogs:
refer screenshots in @prompts folder with file name BOM1.png, BOM2.png, BOM3.png
---

## ✅ Sign-Off

**Tester Name:** ___________________
**Date:** ___________________
**Signature:** ___________________

**Approval Status:**
- [ ] Approved for Production
- [ ] Approved with Minor Fixes
- [ ] Not Approved - Major Fixes Required

**Next Steps:**
```
[Write next actions here]

Example:
1. Fix total cost calculation bug
2. Add search functionality
3. Re-test scenarios 3, 5, 6
4. Deploy to staging environment
```

---

**END OF TEST PROCEDURE**
