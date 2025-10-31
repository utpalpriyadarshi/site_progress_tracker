# Site Inspection Screen - Comprehensive Testing Guide

## Overview
Testing documentation for the Site Inspection feature, which allows supervisors to conduct comprehensive site safety inspections with photos, checklists, ratings, and follow-up scheduling.

**Screen Location**: `src/supervisor/SiteInspectionScreen.tsx` (1,100+ lines)
**Database Table**: `site_inspections` (Schema v9)
**Navigator**: SupervisorNavigator → SiteInspection tab (🔍 icon)

---

## Test Environment Setup

### Prerequisites
1. App running with SupervisorNavigator active
2. At least one site created in SiteManagementScreen
3. Camera/gallery permissions granted (Android)
4. Test device with camera functionality

### Login Credentials
- **Username**: `supervisor`
- **Password**: `supervisor123`

---

## Feature Set

### Core Features
1. ✅ Site-based inspection management
2. ✅ Multiple inspection types (Daily/Weekly/Safety/Quality)
3. ✅ Overall rating system (Excellent/Good/Fair/Poor)
4. ✅ Safety flag for critical issues
5. ✅ 21-item safety checklist across 5 categories
6. ✅ Photo capture (camera & gallery, up to 10 photos)
7. ✅ Follow-up inspection scheduling
8. ✅ Offline-first with sync status
9. ✅ Pull-to-refresh
10. ✅ Edit & delete functionality

---

## Test Cases

### 1. Basic Inspection Creation

#### Test 1.1: Create Daily Inspection (Basic)
**Steps**:
1. Navigate to SiteInspection tab (🔍 icon)
2. Select a site from dropdown
3. Tap "New Inspection" button
4. Select inspection type: "Daily"
5. Select overall rating: "Good"
6. Add notes: "Daily inspection - all clear"
7. Tap "Create"

**Expected Result**:
- ✅ Success message displayed
- ✅ New inspection card appears in list
- ✅ Card shows: Daily (green chip), Good rating, site name, date/time
- ✅ Sync status shows "pending"

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 1.2: Create Safety Inspection with Flag
**Steps**:
1. Tap "New Inspection"
2. Select type: "Safety"
3. Select rating: "Fair"
4. Toggle "Safety Issue Found?" to "Yes - Flagged"
5. Add notes: "Scaffolding requires attention"
6. Tap "Create"

**Expected Result**:
- ✅ Card shows Safety (red chip) + SAFETY alert chip
- ✅ Rating shows Fair (orange chip)
- ✅ Safety flag clearly visible

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 2. Photo Capture & Management

#### Test 2.1: Take Photo with Camera
**Steps**:
1. Create new inspection
2. Scroll to "Photos (0/10)" section
3. Tap "Add Photo" button
4. Select "Take Photo" from menu
5. Grant camera permission if prompted
6. Take a photo
7. Verify photo appears in grid
8. Tap "Create"

**Expected Result**:
- ✅ Camera opens successfully
- ✅ Photo thumbnail appears (100x100px)
- ✅ Remove button (X) visible on thumbnail
- ✅ Photos count updates: "Photos (1/10)"
- ✅ Photo saved with inspection

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

Observation:-Open debugger to view warning

#### Test 2.2: Select Photo from Gallery
**Steps**:
1. Create new inspection
2. Tap "Add Photo" → "Choose from Gallery"
3. Select multiple photos (up to 5 at once)
4. Verify thumbnails appear
5. Tap "Create"

**Expected Result**:
- ✅ Gallery opens
- ✅ Multiple selection works
- ✅ All selected photos appear as thumbnails
- ✅ Photo counter updates correctly

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 2.3: Remove Photo
**Steps**:
1. Create inspection with 3 photos
2. Tap X button on middle photo thumbnail
3. Verify photo is removed
4. Add another photo
5. Save inspection

**Expected Result**:
- ✅ Photo removes instantly
- ✅ Grid re-arranges
- ✅ Counter decrements then increments
- ✅ Final inspection has correct photos

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 2.4: Photo Limit (10 photos max)
**Steps**:
1. Create new inspection
2. Add 10 photos via gallery/camera
3. Verify "Add Photo" button disappears
4. Remove one photo
5. Verify "Add Photo" button reappears

**Expected Result**:
- ✅ Counter shows "Photos (10/10)"
- ✅ Add button hidden at limit
- ✅ Add button returns when < 10

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 3. Safety Checklist

#### Test 3.1: Expand/Collapse Categories
**Steps**:
1. Create new inspection
2. Scroll to "Safety Checklist" section
3. Tap "PPE & Safety Equipment" accordion
4. Verify it expands showing 5 items
5. Tap again to collapse
6. Expand "Fire Safety & Emergency"

**Expected Result**:
- ✅ Accordion expands smoothly
- ✅ All 5 PPE items visible
- ✅ Collapses on second tap
- ✅ Only one category can expand at a time
- ✅ Each category shows pass count (e.g., "0/5")

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 3.2: Mark Checklist Items (Pass)
**Steps**:
1. Expand "PPE & Safety Equipment"
2. For "Hard hats worn by all workers":
   - Select "Pass" radio button
3. For "Safety boots in good condition":
   - Select "Pass"
4. Verify category count updates: "2/5"
5. Check summary shows "2 Pass / 0 Fail"

**Expected Result**:
- ✅ Radio button selection works
- ✅ Green color for Pass
- ✅ Category counter updates
- ✅ Overall summary updates
- ✅ No notes field appears for Pass

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 3.3: Mark Items as Fail (Requires Notes)
**Steps**:
1. Expand "Scaffolding & Work at Height"
2. Select "Scaffolding properly erected and tagged"
3. Choose "Fail" radio button
4. Verify notes field appears
5. Add notes: "Tags expired, needs re-inspection"
6. Verify notes are saved

**Expected Result**:
- ✅ Red color for Fail
- ✅ Notes field appears immediately
- ✅ Field labeled "Notes (required for failed items)"
- ✅ Notes persist when reopening
- ✅ Summary shows "0 Pass / 1 Fail"

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

Fail:-No red color on card, no notes on card

#### Test 3.4: Mark Items as N/A
**Steps**:
1. Select any checklist item
2. Choose "N/A" radio button
3. Verify no notes field appears
4. Verify it doesn't count in Pass/Fail summary

**Expected Result**:
- ✅ Gray color for N/A
- ✅ No notes required
- ✅ Doesn't affect pass/fail counts

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 3.5: Complete Full Checklist
**Steps**:
1. Go through all 5 categories:
   - PPE & Safety Equipment (5 items)
   - Scaffolding & Work at Height (4 items)
   - Equipment & Tools (4 items)
   - Fire Safety & Emergency (4 items)
   - Housekeeping & Site Conditions (4 items)
2. Mark mix of Pass/Fail/NA
3. Add notes for all failed items
4. Save inspection

**Expected Result**:
- ✅ All 21 items accessible
- ✅ Summary accurate (e.g., "15 Pass / 3 Fail")
- ✅ Inspection saves successfully
- ✅ Card shows checklist summary

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 4. Follow-up Scheduling

#### Test 4.1: Schedule Follow-up Inspection
**Steps**:
1. Create new safety inspection
2. Mark some items as "Fail"
3. Scroll to "Schedule Follow-up Inspection"
4. Tap "Schedule" button (turns orange)
5. Enter date: 2025-11-01
6. Add follow-up notes: "Re-check scaffolding tags and fall protection"
7. Save inspection

**Expected Result**:
- ✅ Button changes to "Scheduled" (contained, orange)
- ✅ Date and notes fields appear
- ✅ Validation requires date when scheduled
- ✅ Orange banner appears on card: "Follow-up: 11/1/2025"
- ✅ Calendar icon shows in banner

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 4.2: Cancel Follow-up
**Steps**:
1. Edit inspection with follow-up scheduled
2. Tap "Scheduled" button to toggle off
3. Verify fields disappear
4. Save

**Expected Result**:
- ✅ Button returns to "Schedule" (outlined)
- ✅ Date/notes fields hide
- ✅ Follow-up banner removed from card

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

- pass --

#### Test 4.3: Follow-up Date Validation
**Steps**:
1. Create inspection
2. Toggle "Schedule" ON
3. Leave date field empty
4. Tap "Create"

**Expected Result**:
- ✅ Error alert: "Please select a follow-up date"
- ✅ Dialog stays open
- ✅ No inspection created

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

--- pass

### 5. Inspection Management

#### Test 5.1: Edit Existing Inspection
**Steps**:
1. Create inspection with photos and checklist
2. Tap "Edit" button on card
3. Change rating from "Good" to "Excellent"
4. Add 2 more photos
5. Update some checklist items
6. Tap "Update"

**Expected Result**:
- ✅ Dialog opens with all existing data
- ✅ Photos load correctly
- ✅ Checklist states preserved
- ✅ Changes save successfully
- ✅ Card reflects updates

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 5.2: Delete Inspection
**Steps**:
1. Tap "Delete" on any inspection card
2. Tap "Cancel" in confirmation dialog
3. Tap "Delete" again
4. Tap "Delete" in confirmation
5. Verify inspection removed

**Expected Result**:
- ✅ Confirmation dialog appears
- ✅ Cancel works (no deletion)
- ✅ Delete removes inspection
- ✅ Success message shown
- ✅ Card disappears from list

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 5.3: Pull to Refresh
**Steps**:
1. Pull down on inspections list
2. Observe loading indicator
3. Verify list refreshes

**Expected Result**:
- ✅ Pull gesture works
- ✅ Spinner shows while loading
- ✅ List updates

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 6. Site Filtering

#### Test 6.1: Filter by Site
**Steps**:
1. Create inspections for Site A (2 inspections)
2. Create inspections for Site B (1 inspection)
3. Select "Site A" from dropdown
4. Verify only Site A inspections show
5. Select "Site B"
6. Select "All Sites"

**Expected Result**:
- ✅ Inspections filter correctly
- ✅ Site name on card matches filter
- ✅ "All Sites" shows all inspections

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 6.2: New Inspection Button Disabled for "All Sites"
**Steps**:
1. Select "All Sites" from dropdown
2. Observe "New Inspection" button

**Expected Result**:
- ✅ Button is grayed out/disabled
- ✅ Tapping shows: "Select a specific site to create an inspection"

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 7. Inspection Types & Ratings

#### Test 7.1: All Inspection Types
**Steps**:
Create 4 inspections, one of each type:
1. Daily → Green chip
2. Weekly → Orange chip
3. Safety → Red chip
4. Quality → Blue chip

**Expected Result**:
- ✅ Each type has distinct color
- ✅ Type label shows in uppercase
- ✅ Colors: Daily=Green, Weekly=Orange, Safety=Red, Quality=Blue

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 7.2: All Rating Levels
**Steps**:
Create 4 inspections with different ratings:
1. Excellent → Dark green
2. Good → Light green
3. Fair → Orange
4. Poor → Red

**Expected Result**:
- ✅ Ratings display in top-right of card
- ✅ Color codes correct
- ✅ Labels uppercase

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 8. Card Display & UI

#### Test 8.1: Inspection Card Components
**Steps**:
1. Create comprehensive inspection:
   - Type: Safety
   - Rating: Fair
   - Safety flagged: Yes
   - 3 photos
   - 15 Pass / 3 Fail checklist
   - Follow-up scheduled
   - Notes: "Issues found"
2. View the card

**Expected Result**:
Card displays all:
- ✅ Type chip (red "SAFETY")
- ✅ Safety alert chip (red "SAFETY")
- ✅ Rating chip (orange "FAIR")
- ✅ Site name
- ✅ Date/time stamp
- ✅ Notes section
- ✅ Checklist summary: "15 Pass, 3 Fail"
- ✅ Photos preview: "3 photo(s)"
- ✅ Follow-up banner: "Follow-up: [date]"
- ✅ Sync status chip
- ✅ Edit & Delete buttons

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

Observation: No notes section-
            Even after pulling down not not sync, it is still pending

#### Test 8.2: Empty State
**Steps**:
1. Select site with no inspections
2. Observe empty state

**Expected Result**:
- ✅ Clipboard icon displayed
- ✅ "No Inspections" title
- ✅ Message: "No inspections recorded for this site"

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 9. Edge Cases & Error Handling

#### Test 9.1: Create Without Site Selection
**Steps**:
1. Select "All Sites"
2. Try to tap "New Inspection"

**Expected Result**:
- ✅ Button disabled
- ✅ No action occurs

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 9.2: Camera Permission Denied
**Steps**:
1. Deny camera permission
2. Try to take photo
3. Verify error message

**Expected Result**:
- ✅ Alert: "Camera permission is required to take photos"
- ✅ Returns to inspection form
- ✅ No crash

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 9.3: Invalid Follow-up Date Format
**Steps**:
1. Schedule follow-up
2. Enter invalid date: "abc"
3. Save

**Expected Result**:
- ✅ Date parsing handles gracefully
- ✅ Either validation error or saves as 0

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 9.4: Very Long Notes
**Steps**:
1. Add 500+ character notes
2. Save and view card

**Expected Result**:
- ✅ Text wraps properly
- ✅ Card expands to fit
- ✅ No truncation errors

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### 10. Performance & Memory

#### Test 10.1: Multiple Photos Performance
**Steps**:
1. Add 10 large photos (5+ MB each)
2. Scroll through form
3. Save inspection

**Expected Result**:
- ✅ No lag when adding photos
- ✅ Thumbnails render quickly
- ✅ Save completes without timeout
- ✅ No memory warnings

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 10.2: Large Inspection List
**Steps**:
1. Create 20+ inspections
2. Scroll through list
3. Pull to refresh

**Expected Result**:
- ✅ Smooth scrolling
- ✅ Cards render efficiently
- ✅ No performance degradation

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### Test 10.3: Checklist Expansion Performance
**Steps**:
1. Rapidly expand/collapse all 5 categories
2. Scroll while expanded
3. Update multiple items quickly

**Expected Result**:
- ✅ Smooth animations
- ✅ No UI freezing
- ✅ State updates correctly

**Status**: ⬜ Not Tested | ✅ Pass | ❌ Fail

---

## Test Summary

| Category | Total Tests | Passed | Failed | Not Tested |
|----------|-------------|--------|--------|------------|
| Basic Creation | 2 | - | - | - |
| Photo Capture | 4 | - | - | - |
| Safety Checklist | 5 | - | - | - |
| Follow-up Scheduling | 3 | - | - | - |
| Inspection Management | 3 | - | - | - |
| Site Filtering | 2 | - | - | - |
| Types & Ratings | 2 | - | - | - |
| Card Display & UI | 2 | - | - | - |
| Edge Cases | 4 | - | - | - |
| Performance | 3 | - | - | - |
| **TOTAL** | **30** | **0** | **0** | **30** |

---

## Known Issues
_Document any bugs or issues found during testing:_

1. ⚠️ **Issue**: Icon not showing in tab (🔍 emoji may not render on all devices)
   - **Workaround**: Use MaterialCommunityIcons instead of emoji
   - **Priority**: Low
   - **Status**: Open

---

## Testing Notes
Fail:-No red color on card, no notes on card
No notes section-
Even after pulling down not not sync, it is still pending
Schedule toggle button is clipped
Cloud button is in pending status



### Testing Environment
- **Device/Emulator**: _____________
- **OS Version**: _____________
- **App Version**: v0.9
- **Date Tested**: _____________
- **Tester Name**: _____________

### Additional Observations
_Add any additional notes, suggestions, or observations:_

-Visula experience is not appealing, can be worked later--

## Feature Completion Checklist

### Database (Schema v9)
- ✅ SiteInspectionModel created
- ✅ Migration to schema v9
- ✅ All fields implemented (12 columns)
- ✅ Relationships configured

### UI Components
- ✅ Site selector integration
- ✅ Inspection type selector (4 types)
- ✅ Rating selector (4 levels)
- ✅ Safety flag toggle
- ✅ Photo capture (camera/gallery)
- ✅ 21-item checklist (5 categories)
- ✅ Follow-up scheduling
- ✅ Notes fields
- ✅ Create/Edit dialog
- ✅ Inspection cards
- ✅ Empty state

### Functionality
- ✅ Create inspection
- ✅ Edit inspection
- ✅ Delete inspection
- ✅ Photo management (add/remove)
- ✅ Checklist state management
- ✅ Follow-up validation
- ✅ Site filtering
- ✅ Pull to refresh
- ✅ Sync status tracking
- ✅ Offline-first support

---

## Sign-off

**Tested By**: Utpal Priyadarshi________________
**Date**: _08/10/2025_______________
**Overall Status**: ⬜ Pass | ⬜ Fail | ⬜ Needs Revision

**Approver**: ________________
**Date**: ________________
**Approval**: ⬜ Approved | ⬜ Rejected | ⬜ Conditional

---

**Document Version**: 1.0
**Last Updated**: 2025-10-07
**Related Documents**:
- HINDRANCE_REPORT_TESTING.md
- DATABASE.md (Schema v9)
- ARCHITECTURE.md
