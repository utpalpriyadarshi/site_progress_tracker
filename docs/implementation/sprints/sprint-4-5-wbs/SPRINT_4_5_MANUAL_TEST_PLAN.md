# Sprint 4 & 5 Manual Testing Plan

**Version**: v1.4-v1.5
**Date**: October 2025
**Sprint**: 4 (WBS Management & Item Creation) + 5 (Context Menu & Editing)
**Estimated Testing Time**: 30-45 minutes

---

## Prerequisites

### Setup Requirements
- ✅ App installed on Android/iOS device or emulator
- ✅ Database initialized with default data
- ✅ Logged in as **Planner** role
- ✅ At least one project and site created

### Test Data Required
- **Project**: Any test project
- **Site**: At least one site under the project
- **Categories**: Default categories (Installation, Construction, etc.)

---

## Test Execution Checklist

### Sprint 4: WBS Management & Item Creation

#### Test Group 1: WBS Management Screen Access (5 min)

**TC-4.1: Navigate to WBS Management**
- [ok ] Login as Planner
- [ok ] Navigate to Planning tab
- [ok ] Tap "WBS" or "📋 WBS" tab
- [ok ] **Expected**: WBS Management screen loads
- [ok ] **Expected**: Site selector displayed at top
- [ok ] **Expected**: "Select a Site" message shown if no site selected

**TC-4.2: Site Selection**
- [ok ] Tap site selector dropdown
- [ok ] **Expected**: List of sites appears
- [ok ] Select a site from dropdown
- [ok ] **Expected**: Site name displayed in selector
- [ok ] **Expected**: Phase filter chips appear below selector
- [ok ] **Expected**: Empty state message: "No items in this phase"

---

#### Test Group 2: Root Item Creation (10 min)

**TC-4.3: Create First Root Item**
- [ok ] With site selected, tap FAB (+) button
- [ok ] **Expected**: ItemCreationScreen opens
- [ok ] **Expected**: WBS Code preview shows "1.0.0.0"
- [ok ] **Expected**: Helper text: "This will be a root-level item (Level 1)"

**TC-4.4: Fill Item Creation Form**
- [ok ] Enter Item Name: "Substation Foundation Work"
- [ok ] Tap Category dropdown → Select "Foundation Work"
- [ok ] **Expected**: Category description appears below selector
- [ok ] Tap Phase dropdown → Select "🔨 Construction"
- [ok ] **Expected**: Phase description appears with color-coded border
- [ok ] Enter Duration: "30"
- [ok ] Enter Quantity: "1"
- [ok ] Enter Unit: "Set"
- [ok ] Toggle "Milestone" chip ON
- [ok ] Toggle "Critical Path" chip ON
- [ok ] **Expected**: Float Days field disappears (auto = 0 for critical path)
- [ok ] Select Dependency Risk: "High"
- [ok ] **Expected**: Risk Notes field appears
- [ok ] Enter Risk Notes: "Foundation requires soil testing approval"

**TC-4.5: Save First Item**
- [ok ] Tap check (✓) icon in app bar OR "Create Item" button
- [ok ] **Expected**: Green snackbar appears: "WBS item created successfully"
- [ok ] **Expected**: After 1.5 seconds, navigates back to WBS Management
- [ok ] **Expected**: New item appears in list with WBS code "1.0.0.0"
- [ok ] **Expected**: Item shows phase chip "🔨 Construction"
- [ok,but badge is partial visible, refer @prompts\Firstitem.png ] **Expected**: Item shows "🔴 Critical" badge
- [ok,but badge is partial visible, refer @prompts\Firstitem.png ] **Expected**: Item shows "⚠️ High Risk" badge
- [ok ] **Expected**: Item shows milestone star "⭐"

**TC-4.6: Create Second Root Item**
- [ok ] Tap FAB (+) button again
- [ok ] **Expected**: WBS Code shows "2.0.0.0"
- [ok ] Enter Item Name: "Power Transformer Installation"
- [ok ] Select Category: "Installation"
- [ok ] Select Phase: "⚡ Commissioning"
- [ok ] Enter Duration: "45"
- [ok ] Enter Quantity: "2"
- [ok ] Select Dependency Risk: "Medium"
- [ok ] Tap Create Item
- [ok ] **Expected**: Success snackbar
- [ok ] **Expected**: Item appears with WBS code "2.0.0.0"
- [ok, badge is clipped ] **Expected**: Item shows "⚡ Med Risk" badge

---

#### Test Group 3: Child Item Creation (10 min)

**TC-4.7: Verify Child Item Creation Option**
- [OK, but behaviousr is not smooth, sometimes opens sometimes not ] Long-press on first item (1.0.0.0)
- [ok, not smmoth behaviour ] **Expected**: Context menu appears with three dots icon
- [ok ] Tap three dots icon (or context menu auto-opens)
- [ok ] **Expected**: Menu shows "Add Child Item" option
- [ok ] **Expected**: Menu shows "Edit" option
- [ok ] **Expected**: Menu shows "Delete" option

**TC-4.8: Create First Child Item**
- [ok ] Tap "Add Child Item" from menu
- [ok ] **Expected**: ItemCreationScreen opens
- [ok ] **Expected**: WBS Code shows "1.1.0.0"
- [ok ] **Expected**: Helper text: "Child of: 1.0.0.0"
- [ok ] **Expected**: Helper text: "This will be a child item (Level 2)"
- [ok ] Enter Item Name: "Foundation Excavation"
- [ok ] Select Category: "Foundation Work"
- [ok ] Select Phase: "🏗️ Site Preparation"
- [ok ] Enter Duration: "10"
- [ok ] Enter Quantity: "1"
- [ok ] Tap Create Item
- [ok ] **Expected**: Item created with WBS code "1.1.0.0"
- [ok ] **Expected**: Item appears indented under parent (1.0.0.0)

**TC-4.9: Create Second Child at Same Level**
- [ok ] Long-press on parent item (1.0.0.0)
- [ok ] Tap "Add Child Item"
- [ok ] **Expected**: WBS Code shows "1.2.0.0"
- [ok ] Enter Item Name: "Foundation Reinforcement"
- [ok ] Fill required fields
- [ok ] Tap Create Item
- [ok ] **Expected**: Item created with WBS code "1.2.0.0"
- [ok ] **Expected**: Item appears at same indent level as 1.1.0.0

**TC-4.10: Create Nested Child (Level 3)**
- [OK ] Long-press on child item (1.1.0.0)
- [OK ] Tap "Add Child Item"
- [OK ] **Expected**: WBS Code shows "1.1.1.0"
- [OK ] **Expected**: Helper text: "This will be a child item (Level 3)"
- [OK ] Enter Item Name: "Site Survey"
- [OK ] Fill required fields
- [OK ] Tap Create Item
- [OK ] **Expected**: Item created with WBS code "1.1.1.0"
- [OK ] **Expected**: Item appears double-indented (under 1.1.0.0)

**TC-4.11: Create Level 4 Item (Maximum Depth)**
- [ok ] Long-press on level 3 item (1.1.1.0)
- [ok ] Tap "Add Child Item"
- [ok ] **Expected**: WBS Code shows "1.1.1.1"
- [ok ] **Expected**: Helper text: "This will be a child item (Level 4)"
- [ok ] Enter Item Name: "Survey Equipment Setup"
- [ok ] Fill required fields
- [ok ] Tap Create Item
- [ok ] **Expected**: Item created with WBS code "1.1.1.1"
- [ok ] **Expected**: Item appears triple-indented (maximum)

---

#### Test Group 4: Category & Phase Selectors (5 min)

**TC-4.12: Test Category Selector**
- [ok ] Create new item
- [ok ] Tap Category dropdown
- [ok ] **Expected**: List of categories from database appears
- [ok ] **Expected**: Each category shows name
- [ok ] Select different categories
- [ok ] **Expected**: Description updates below selector
- [ok ] **Expected**: Selected category name displays in dropdown

**TC-4.13: Test Phase Selector**
- [ok ] Tap Phase dropdown
- [ok ] **Expected**: 11 phases displayed:
  - ✏️ Design & Engineering
  - 📋 Statutory Approvals
  - 🚛 Mobilization
  - 🛒 Procurement
  - 🔗 Interface Coordination
  - 🏗️ Site Preparation
  - 🔨 Construction
  - 🧪 Testing & Pre-commissioning
  - ⚡ Commissioning
  - ✅ Site Acceptance Test
  - 📦 Handover & Documentation
- [ok ] Select each phase
- [ok ] **Expected**: Description updates with phase-specific text
- [ok ] **Expected**: Border color changes for each phase

---

#### Test Group 5: Form Validation (3 min)

**TC-4.14: Test Required Field Validation**
- [ok ] Create new item
- [ok ] Leave Item Name empty
- [ok ] Tap Create Item
- [ok ] **Expected**: Error text: "Item name is required"
- [ok ] Leave Category unselected
- [ok ] Tap Create Item
- [ok ] **Expected**: Error text: "Category is required"
- [ok ] Enter Duration: "0"
- [ok ] Tap Create Item
- [ok ] **Expected**: Error text: "Duration must be greater than 0"

**TC-4.15: Test Numeric Field Validation**
- [ok ] Enter Duration: "abc"
- [ok ] **Expected**: Text not accepted (numeric only)
- [ok ] Enter Quantity: "-5"
- [ok ] **Expected**: Negative numbers not accepted
- [ok ] Enter Duration: "30"
- [ok ] **Expected**: Numeric value accepted

---

#### Test Group 6: Phase Filtering (3 min)

**TC-4.16: Filter Items by Phase**
- [ok ] Return to WBS Management screen
- [ok ] **Expected**: Phase filter chips displayed below site selector
- [ok ] Tap "All Phases" chip
- [ok ] **Expected**: All items displayed
- [ok ] Tap "Construction" chip
- [ok ] **Expected**: Only construction phase items displayed
- [ok ] **Expected**: Header shows: "Filtered by: Construction"
- [ok ] Tap "Design" chip
- [ ] **Expected**: Only design phase items displayed (or empty)
- [ok ] Tap "All Phases" again
- [ok ] **Expected**: All items reappear

---

### Sprint 5: Context Menu & Item Editing

#### Test Group 7: Context Menu Display (3 min)

**TC-5.1: Open Context Menu (Long-Press)**
- [ok ] Long-press on any WBS item card
- [ok ] **Expected**: Context menu appears (may auto-open)
- [ok ] **Expected**: Three dots (⋮) icon button visible

**TC-5.2: Open Context Menu (Tap Icon)**
- [ok ] Tap three dots icon on WBS item card
- [ok ] **Expected**: Menu opens with options:
  - "Add Child Item" (with plus-box icon)
  - "Edit" (with pencil icon)
  - "Delete" (with delete icon in red)

**TC-5.3: Close Context Menu**
- [ok ] Tap outside menu
- [ok ] **Expected**: Menu closes
- [ok ] Tap three dots again → Tap elsewhere
- [ok ] **Expected**: Menu closes

---

#### Test Group 8: Edit Menu Item (2 min)

**TC-5.4: Navigate to Edit Screen**
- [ok ] Open context menu on any item
- [ok ] Tap "Edit"
- [no ] **Expected**: Alert appears: "Baseline Locked" (if implemented)
  - OR navigation to ItemEdit screen (if edit screen implemented)
- [ok ] **Note**: Edit screen implementation is Sprint 6
- [ok ] **Expected**: No crash or error

---

#### Test Group 9: Delete Menu Item (5 min)

**TC-5.5: Delete Item with Confirmation**
- [ok ] Create a test item (to delete safely)
- [ok ] Open context menu on test item
- [ok ] Tap "Delete"
- [ok ] **Expected**: Confirmation dialog appears
- [ok ] **Expected**: Dialog shows: "Are you sure you want to delete \"{item name}\"?"
- [ok ] **Expected**: Dialog has "Cancel" and "Delete" buttons
- [ok ] Tap "Cancel"
- [ok ] **Expected**: Dialog closes, item NOT deleted

**TC-5.6: Confirm Deletion**
- [ok ] Open context menu on same test item
- [ok ] Tap "Delete"
- [ok ] Tap "Delete" in confirmation dialog
- [ok ] **Expected**: Success alert: "Item deleted successfully"
- [ok ] **Expected**: Item disappears from list
- [ok ] **Expected**: WBS list refreshes automatically

---

#### Test Group 10: Add Child Item via Menu (2 min)

**TC-5.7: Add Child via Context Menu**
- [ok ] Open context menu on root item
- [ok ] Tap "Add Child Item"
- [ok ] **Expected**: ItemCreationScreen opens
- [ok ] **Expected**: WBS code shows child code (e.g., 1.3.0.0)
- [ok ] **Expected**: Helper text shows parent code
- [ok ] Create item and verify child is added correctly

---

#### Test Group 11: Max Level Enforcement (3 min)

**TC-5.8: Attempt to Add Child to Level 4 Item**
- [ok ] Navigate to a level 4 item (e.g., 1.1.1.1)
- [ok ] Open context menu on level 4 item
- [ok ] **Expected**: "Add Child Item" option is DISABLED or NOT shown
- [Not applicable ] If shown, tap "Add Child Item"
- [NA ] **Expected**: Alert dialog appears
- [NA ] **Expected**: Alert message: "Maximum Level Reached"
- [NA ] **Expected**: Alert message: "Cannot create child items beyond level 4."
- [NA ] Tap OK
- [NA] **Expected**: Dialog closes, no item created

**TC-5.9: Verify Level 1-3 Allow Children**
- [ok ] Open context menu on level 1 item
- [ok ] **Expected**: "Add Child Item" enabled
- [ok ] Open context menu on level 2 item
- [ok ] **Expected**: "Add Child Item" enabled
- [ok ] Open context menu on level 3 item
- [ok ] **Expected**: "Add Child Item" enabled

---

#### Test Group 12: Baseline Lock Enforcement (5 min)

**TC-5.10: Lock Baseline (Manual Database Edit)**
- [not done ] Use database tool or set `is_baseline_locked = true` for an item
- [ok ] **Alternative**: If baseline locking UI exists, lock an item's baseline
- [ok ] **Expected**: Item shows "🔒 Locked" badge

**TC-5.11: Verify Edit Disabled When Locked**
- [ok ] Open context menu on locked item
- [ok ] **Expected**: "Edit" menu item is GRAYED OUT (disabled)
- [ok ] Tap "Edit" (if possible)
- [ok ] **Expected**: Alert: "Baseline Locked - Cannot edit items after baseline is locked."
- [ok ] Tap OK
- [ok ] **Expected**: No edit screen opens

**TC-5.12: Verify Delete Disabled When Locked**
- [ ] Open context menu on locked item
- [ ] **Expected**: "Delete" menu item is GRAYED OUT (disabled)
- [ok ] Tap "Delete" (if possible)
- [ ] **Expected**: Alert: "Baseline Locked - Cannot delete items after baseline is locked."
- [ok ] Tap OK
- [ok ] **Expected**: No deletion occurs

**TC-5.13: Verify Add Child Disabled When Locked**
- [ ] Open context menu on locked item (level < 4)
- [ ] **Expected**: "Add Child Item" menu item is GRAYED OUT (disabled)
- [ok ] Tap "Add Child Item" (if possible)
- [ok ] **Expected**: Alert: "Baseline Locked - Cannot add child items after baseline is locked."
- [ok ] Tap OK
- [ok ] **Expected**: No navigation to item creation

---

#### Test Group 13: Auto-Refresh on Navigation (2 min)

**TC-5.14: Verify List Refreshes After Item Creation**
- [noted, 6 items ] Note current item count
- [ok ] Create a new item via FAB
- [ok ] After save, navigate back to WBS Management
- [ok, 7 items ] **Expected**: List automatically refreshes
- [ok ] **Expected**: New item appears without manual refresh
- [ok ] **Expected**: Item count increased by 1

**TC-5.15: Verify List Refreshes After Deletion**
- [ok ] Note current item count
- [ok ] Delete an item via context menu
- [ok ] After deletion success alert
- [ok ] **Expected**: List automatically refreshes
- [ok ] **Expected**: Deleted item no longer visible
- [ok ] **Expected**: Item count decreased by 1

---

## Visual Verification Checklist

### WBS Item Card Visual Elements

For each item card, verify the following elements display correctly:

**TC-5.16: Card Layout**
- [ok ] **WBS Code**: Displayed in monospace font with gray background (e.g., "1.2.3.0")
- [ok ] **Item Name**: Bold title text
- [ok ] **Phase Chip**: Color-coded chip with emoji and phase name
- [ok ] **Duration**: "Duration: X days" displayed
- [ok ] **Float Days**: "Float: X days" (if not critical path)
- [ok ] **Status**: "Status: not started / in progress / completed"
- [ok ] **Progress Bar**: Visual bar showing completion percentage
- [ok ] **Progress Text**: Percentage displayed (e.g., "50%")
- [ok ] **Dates**: Start and end dates in small gray text
- [ok ] **Three Dots Menu**: Icon button on top-right

**TC-5.17: Badge Display**
- [ok but Display is clipped, refer screenshot @prompts\Firstitem.png ] **Critical Path Badge**: 🔴 Critical (red background) for critical items
- [ok but display is clipped ] **High Risk Badge**: ⚠️ High Risk (orange background)
- [ok, display clipped ] **Medium Risk Badge**: ⚡ Med Risk (yellow background)
- [ok display is clipped ] **Locked Badge**: 🔒 Locked (gray background) when baseline locked
- [ok ] **Milestone Star**: ⭐ appears after item name for milestones

**TC-5.18: Indentation Levels**
- [ok ] **Level 1 (Root)**: Left margin = 16px (no indent)
- [ok ] **Level 2**: Left margin = 36px (1 indent unit)
- [ok ] **Level 3**: Left margin = 56px (2 indent units)
- [ok ] **Level 4**: Left margin = 76px (3 indent units)

**TC-5.19: Risk Notes Display**
- [ok but border only one side is seen ] Items with risk notes show orange-bordered box
- [ok ] Risk notes text prefixed with ⚠️ emoji
- [ok ] Text is readable and properly formatted

---

## Edge Cases & Error Handling

**TC-5.20: Network Errors (If Applicable)**-will be done later
- [ ] Test with airplane mode ON
- [ ] Create item
- [ ] **Expected**: Item saves to local database
- [ ] **Expected**: No crash or network error

**TC-5.21: Empty States**-will be done later
- [ ] Select site with no items
- [ ] **Expected**: Empty state message: "No items in this phase"
- [ ] **Expected**: Subtext: "Tap the + button to add items"

**TC-5.22: Long Item Names**-will be done later
- [ ] Create item with very long name (100+ characters)
- [ ] **Expected**: Name wraps correctly on card
- [ ] **Expected**: No text overflow or cutoff

**TC-5.23: Special Characters**-will be done later
- [ ] Create item with name: "Item #1: Test & Verify (2024)"
- [ ] **Expected**: Special characters saved correctly
- [ ] **Expected**: Display shows all characters properly

---

## Performance Checks

**TC-5.24: Large Item List**-will be done later
- [ ] Create 50+ items across multiple levels
- [ ] **Expected**: List scrolls smoothly
- [ ] **Expected**: No lag when opening context menus
- [ ] **Expected**: Phase filtering responds quickly

**TC-5.25: Rapid Navigation**
- [ok ] Quickly navigate: WBS → Create → Back → WBS → Create → Back
- [ok ] **Expected**: No crashes
- [ok ] **Expected**: Data persists correctly
- [ok ] **Expected**: No memory leaks or slowdowns

---

## Test Summary Template

### Test Execution Results

| Test Group | Total Tests | Passed | Failed | Blocked | Notes |
|------------|-------------|--------|--------|---------|-------|
| TC-4.1 - 4.2 | 2 | | | | WBS Screen Access |
| TC-4.3 - 4.6 | 4 | | | | Root Item Creation |
| TC-4.7 - 4.11 | 5 | | | | Child Item Creation |
| TC-4.12 - 4.13 | 2 | | | | Selectors |
| TC-4.14 - 4.15 | 2 | | | | Form Validation |
| TC-4.16 | 1 | | | | Phase Filtering |
| TC-5.1 - 5.3 | 3 | | | | Context Menu |
| TC-5.4 | 1 | | | | Edit Menu |
| TC-5.5 - 5.6 | 2 | | | | Delete Menu |
| TC-5.7 | 1 | | | | Add Child via Menu |
| TC-5.8 - 5.9 | 2 | | | | Max Level Enforcement |
| TC-5.10 - 5.13 | 4 | | | | Baseline Lock |
| TC-5.14 - 5.15 | 2 | | | | Auto-Refresh |
| TC-5.16 - 5.19 | 4 | | | | Visual Elements |
| TC-5.20 - 5.23 | 4 | | | | Edge Cases |
| TC-5.24 - 5.25 | 2 | | | | Performance |
| **TOTAL** | **41** | | | | |

### Issues Found

| Issue ID | Test Case | Severity | Description | Status |
|----------|-----------|----------|-------------|--------|
| | | | | |

### Test Environment

- **Device**: _____________________
- **OS Version**: _____________________
- **App Version**: v1.5
- **Database Schema**: v12
- **Tester**: _____________________
- **Test Date**: _____________________
- **Test Duration**: _____ minutes

---

## Sign-Off

**Testing Completed By**: ________________________
**Date**: ________________________
**Overall Result**: ⬜ PASS  ⬜ PASS WITH ISSUES  ⬜ FAIL

**Approval for Production**: ⬜ YES  ⬜ NO

**Notes**:
-Test 4.5:-Badge clipped,
-Test 5.4:-After edit tap WBS code is displaying generating
-After baseline locking can we revert if any correction is required._______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

**End of Sprint 4 & 5 Manual Test Plan**
