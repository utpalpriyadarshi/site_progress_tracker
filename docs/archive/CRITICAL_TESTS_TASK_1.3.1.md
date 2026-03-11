# Critical Path Testing - Task 1.3.1: SiteInspectionScreen Refactor

**Date:** 2025-12-10
**Estimated Time:** 15-20 minutes
**Purpose:** Verify core functionality after refactoring

---

## Pre-Flight Check (2 min)

### Build & Launch
```bash
npm run android
# Wait for app to build and launch
```

- [ ] App builds successfully (no compilation errors)
- [ ] App launches without crashing
- [ ] Navigate to: Supervisor Dashboard → Site Inspections
- [ ] Screen loads without errors

**If any fails, STOP and fix errors. If all pass, continue →**

---

## Critical Test Cases (15 essential tests)

### 1. Screen Load & Data Fetch (1 min)
- [ ] Screen loads and displays SiteSelector at top
- [ ] If inspections exist, they display in a list
- [ ] If no inspections, shows: "No inspections found. Tap + to create your first inspection."
- [ ] No errors in logcat (check for "Cannot find module" or React errors)

**✅ PASS / ❌ FAIL:** _______
Observation:- Pass
---

### 2. Create Inspection - Happy Path (2 min)
- [ ] Select a specific site from SiteSelector
- [ ] Tap "+ New Inspection" FAB button
- [ ] Dialog opens with form
- [ ] Select Inspection Type: "Safety"
- [ ] Select Overall Rating: "Good"
- [ ] Tap "Save"
- [ ] Success snackbar: "Inspection created successfully"
- [ ] Dialog closes
- [ ] New inspection appears at top of list

**✅ PASS / ❌ FAIL:** _______
Observation:- Pass
---

### 3. Validation - Site Required (30 sec)
- [ ] Select "All Sites" from SiteSelector
- [ ] Tap "+ New Inspection" FAB button
- [ ] Warning snackbar: "Please select a specific site to create an inspection"
- [ ] Dialog does NOT open

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 4. Photo Upload - Camera (2 min)
- [ ] Open create/edit dialog
- [ ] Tap "Add Photo" button
- [ ] Menu shows: "Take Photo" and "Choose from Gallery"
- [ ] Select "Take Photo"
- [ ] Camera opens (grant permission if asked)
- [ ] Take a photo
- [ ] Photo thumbnail appears in dialog
- [ ] Counter shows "(1/10)"

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 5. Photo Upload - Gallery (1 min)
- [ ] Tap "Add Photo" button again
- [ ] Select "Choose from Gallery"
- [ ] Gallery opens
- [ ] Select 1-2 photos
- [ ] Photos appear as thumbnails
- [ ] Counter updates: "(2/10)" or "(3/10)"

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 6. Photo Removal (30 sec)
- [ ] Tap "X" button on a photo thumbnail
- [ ] Photo is removed
- [ ] Counter decreases
- [ ] Other photos remain intact

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 7. Checklist Functionality (1 min)
- [ ] In create/edit dialog, scroll to checklist section
- [ ] All 21 items display with status buttons (Pass/Fail/N/A)
- [ ] Tap "Pass" on 3 items → buttons turn green
- [ ] Tap "Fail" on 2 items → buttons turn red
- [ ] Summary updates: "3 Pass, 2 Fail, 16 N/A" (or similar)
- [ ] Add notes to 1 item → notes field accepts text

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 8. Save with Full Data (1 min)
- [ ] Create an inspection with:
  - Inspection Type: "Quality"
  - Overall Rating: "Excellent"
  - Safety Flag: ON
  - Notes: "Test inspection"
  - 2-3 photos
  - 5+ checklist items with different statuses
- [ ] Tap "Save"
- [ ] Success snackbar appears
- [ ] Inspection created and appears in list

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 9. Edit Inspection - Data Pre-population (2 min)
- [ ] Tap "Edit" button on the inspection just created
- [ ] Dialog opens with ALL data pre-populated:
  - [ ] Inspection type matches
  - [ ] Overall rating matches
  - [ ] Safety flag state matches
  - [ ] Notes text appears
  - [ ] Photos display (2-3 thumbnails)
  - [ ] Checklist items show saved statuses

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 10. Edit Inspection - Update (1 min)
- [ ] Change inspection type to "Safety"
- [ ] Change overall rating to "Fair"
- [ ] Update notes
- [ ] Remove 1 photo
- [ ] Change 2 checklist statuses
- [ ] Tap "Save"
- [ ] Success snackbar: "Inspection updated successfully"
- [ ] Dialog closes
- [ ] Changes appear in the inspection card

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 11. Edit - Cancel (30 sec)
- [ ] Tap "Edit" on an inspection
- [ ] Make some changes
- [ ] Tap "Cancel"
- [ ] Dialog closes
- [ ] Changes are NOT saved (original data remains)

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 12. Delete Inspection (1 min)
- [ ] Tap "Delete" button on an inspection
- [ ] Confirmation dialog appears
- [ ] Message: "Are you sure you want to delete this inspection? This action cannot be undone."
- [ ] Tap "Delete"
- [ ] Success snackbar: "Inspection deleted successfully"
- [ ] Inspection disappears from list

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 13. Site Filtering (30 sec)
- [ ] Create inspections for 2 different sites (if not already done)
- [ ] Select "All Sites" → shows all inspections
- [ ] Select specific Site A → shows only Site A's inspections
- [ ] Select specific Site B → shows only Site B's inspections
- [ ] Filtering works correctly

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 14. Pull-to-Refresh Sync (1 min)
- [ ] On inspection list, swipe down from top
- [ ] Loading indicator appears
- [ ] Sync operation executes
- [ ] Check logcat for: "Sync completed"
- [ ] Loading indicator disappears
- [ ] If pending records: snackbar shows "X records synced successfully"
- [ ] If no pending records: no snackbar (silent refresh)

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

### 15. Auto-Sync (2-second delay) (2 min)
- [ ] Close Site Inspection screen
- [ ] Reopen Site Inspection screen
- [ ] Wait exactly 2 seconds
- [ ] Check logcat for: "Auto-sync triggered"
- [ ] Check logcat for: "Auto-sync completed"
- [ ] No user-facing interruption (silent background sync)

**✅ PASS / ❌ FAIL:** _______
Observation:-Pass
---

## Quick Logcat Check (1 min)

**Run in terminal:**
```bash
adb logcat -s ReactNativeJS:* | grep -i "error\|cannot find"
```

- [ ] No "Cannot find module" errors
- [ ] No "undefined is not an object" errors
- [ ] No unhandled promise rejections

**✅ PASS / ❌ FAIL:** _______
Observation:- grep : The term 'grep' is not recognized as the name of a cmdlet, function, 
script file, or operable program. Check the spelling of the name, or if a path 
was included, verify that the path is correct and try again.
At line:1 char:33
+ adb logcat -s ReactNativeJS:* | grep -i "error\|cannot find"
+                                 ~~~~
    + CategoryInfo          : ObjectNotFound: (grep:String) [], CommandNotFound 
   Exception
    + FullyQualifiedErrorId : CommandNotFoundException

---

## Test Results Summary

**Total Critical Tests:** 15
**Passed:** 14 passed, Test no 15 could not be done_____ / 15
**Failed:** _____ / 15

**Overall Status:** ☐ APPROVED  ☐ NEEDS FIXES

---

## If All Tests Pass ✅

**You're ready to commit!**

1. All core CRUD operations work
2. Photo upload integration verified
3. Checklist functionality confirmed
4. Sync operations functional
5. No critical errors

**Next steps:**
- Commit the refactored code
- Update roadmap status to "✅ Completed"
- Move to Task 1.3.2

---

## If Any Test Fails ❌

**Document the failure:**

**Test #:** _____
**What failed:** _________________________________________
**Error message (if any):** _________________________________________
**Steps to reproduce:** _________________________________________

**Stop testing and fix the issue before proceeding.**

---

## Optional: Stress Tests (if time permits)

Only run these if you want extra confidence:

- [ ] Create 10+ inspections → list scrolling is smooth
- [ ] Upload 10 photos to a single inspection → counter shows "(10/10)", button disappears
- [ ] Turn off internet, try sync → error message, app doesn't crash
- [ ] Open/close dialog 10 times → no memory leaks, no orphaned dialogs

---

**End of Critical Path Testing**

**Time Estimate:** 15-20 minutes for all 15 critical tests
