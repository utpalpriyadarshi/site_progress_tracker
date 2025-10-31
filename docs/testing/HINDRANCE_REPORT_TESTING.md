# Hindrance Report Testing Plan

## Test Environment
- **Device**: Android Emulator/Physical Device
- **User Role**: Supervisor
- **Test Credentials**: supervisor / supervisor123

## Pre-Test Setup
1. Launch the app
2. Login as supervisor (supervisor / supervisor123)
3. Navigate to "Issues" tab (Hindrance Reports Screen)

---

## Test Cases

### TC1: Initial Screen Load
**Objective**: Verify the screen loads correctly and shows empty state

**Steps**:
1. Navigate to "Issues" tab
2. Observe the screen

**Expected Results**:
- ✅ Site selector dropdown is visible at the top
- ✅ "Report Hindrance" button is visible
- ✅ If no site selected (showing "All Sites"), button should be disabled
- ✅ Empty state message: "Select a site to view hindrances" OR "No hindrances reported for this site"

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC2: Site Selection
**Objective**: Verify site selection functionality

**Steps**:
1. Tap on the site selector dropdown
2. Select a specific site (e.g., "Main Site")
3. Observe the screen changes

**Expected Results**:
- ✅ Site selector shows the selected site name
- ✅ "Report Hindrance" button becomes enabled
- ✅ If no hindrances exist, shows "No hindrances reported for this site"

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC3: Create New Hindrance (Basic Fields Only)
**Objective**: Create a hindrance with only required fields

**Steps**:
1. Select a site
2. Tap "Report Hindrance" button
3. Fill in the form:
   - Title: "Test Hindrance 1"
   - Description: "This is a test hindrance"
   - Priority: Medium
   - Status: Open
   - Related Item: None
   - Photos: None
4. Tap "Create"

**Expected Results**:
- ✅ Dialog opens with form fields
- ✅ All fields are visible (Title, Description, Priority, Status, Related Item, Photos)
- ✅ Priority default is "Medium"
- ✅ Status default is "Open"
- ✅ Success alert shows "Hindrance created"
- ✅ Dialog closes
- ✅ New hindrance appears in the list
- ✅ Hindrance card shows:
   - Title: "Test Hindrance 1"
   - Site name
   - Priority chip: MEDIUM (orange background)
   - Status chip: Open (red background)
   - Sync status chip: pending

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC4: Hindrance Card Display
**Objective**: Verify all information displays correctly on hindrance cards

**Steps**:
1. View the created hindrance from TC3
2. Check all displayed information

**Expected Results**:
- ✅ Title is bold and prominent
- ✅ Site name is shown below title in gray
- ✅ Priority chip shows correct color:
   - High: Red (#F44336)
   - Medium: Orange (#FF9800)
   - Low: Green (#4CAF50)
- ✅ Status chip shows correct color:
   - Open: Red (#F44336)
   - In Progress: Blue (#2196F3)
   - Resolved: Green (#4CAF50)
   - Closed: Gray (#9E9E9E)
- ✅ Description is shown (if provided)
- ✅ Edit and Delete buttons are visible

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC5: Photo Capture - Take Photo with Camera
**Objective**: Add photos to hindrance using camera

**Steps**:
1. Tap "Report Hindrance"
2. Fill in Title: "Hindrance with Camera Photo"
3. Tap "Add Photos (0)" button
4. Select "Take Photo" from menu
5. Grant camera permission if prompted
6. Take a photo using the camera
7. Verify photo appears in gallery
8. Tap "Create"

**Expected Results**:
- ✅ Menu opens with "Take Photo" and "Select from Gallery" options
- ✅ Camera launches successfully
- ✅ After taking photo, thumbnail appears in horizontal gallery
- ✅ Button text updates to "Add Photos (1)"
- ✅ Photo thumbnail is 100x100px with rounded corners
- ✅ Remove button (X) appears on top-right of thumbnail
- ✅ After saving, hindrance card shows camera icon with "1"

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC6: Photo Capture - Select from Gallery
**Objective**: Add photos from gallery

**Steps**:
1. Tap "Report Hindrance"
2. Fill in Title: "Hindrance with Gallery Photos"
3. Tap "Add Photos (0)" button
4. Select "Select from Gallery"
5. Select 3 photos from gallery
6. Verify all photos appear
7. Tap "Create"

**Expected Results**:
- ✅ Gallery picker opens
- ✅ Can select up to 5 photos
- ✅ All selected photos appear as thumbnails
- ✅ Button text shows "Add Photos (3)"
- ✅ Photos are arranged horizontally in scrollable view
- ✅ After saving, hindrance card shows camera icon with "3"

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC7: Remove Photo
**Objective**: Remove a photo from the list before saving

**Steps**:
1. Tap "Report Hindrance"
2. Add 3 photos (any method)
3. Tap the X button on the second photo
4. Observe changes

**Expected Results**:
- ✅ Photo is removed from gallery
- ✅ Remaining photos shift to fill the gap
- ✅ Button text updates to "Add Photos (2)"
- ✅ Gallery view updates correctly

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC8: Maximum Photos Limit
**Objective**: Verify photo limit enforcement

**Steps**:
1. Tap "Report Hindrance"
2. Select "Select from Gallery"
3. Try to select more than 5 photos

**Expected Results**:
- ✅ Gallery picker limits selection to 5 photos (selectionLimit: 5)
- ✅ Cannot add more than 5 photos total

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC9: Edit Existing Hindrance
**Objective**: Edit a previously created hindrance

**Steps**:
1. Tap "Edit" on an existing hindrance
2. Modify:
   - Title: "Updated Title"
   - Priority: High
   - Status: In Progress
3. Tap "Update"

**Expected Results**:
- ✅ Dialog opens pre-filled with existing data
- ✅ All fields show current values
- ✅ Photos are loaded and displayed
- ✅ After update, success alert shows "Hindrance updated"
- ✅ Card reflects changes immediately
- ✅ Priority chip is now red (High)
- ✅ Status chip is now blue (In Progress)

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC10: Edit Hindrance - Add Photos
**Objective**: Add photos to existing hindrance

**Steps**:
1. Create a hindrance without photos
2. Tap "Edit" on the hindrance
3. Add 2 photos
4. Tap "Update"
5. View the updated hindrance

**Expected Results**:
- ✅ Can add photos to existing hindrance
- ✅ Photos are saved successfully
- ✅ Card now shows camera icon with "2"
- ✅ If edited again, photos are loaded correctly

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC11: Edit Hindrance - Remove Photos
**Objective**: Remove photos from existing hindrance

**Steps**:
1. Edit a hindrance that has 3 photos
2. Remove 1 photo using X button
3. Tap "Update"
4. Edit again to verify

**Expected Results**:
- ✅ Photo is removed from the list
- ✅ After update, only 2 photos remain
- ✅ Camera icon shows "2"
- ✅ When edited again, only 2 photos are loaded

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC12: Delete Hindrance
**Objective**: Delete a hindrance

**Steps**:
1. Tap "Delete" on a hindrance
2. Observe confirmation dialog
3. Tap "Delete" to confirm

**Expected Results**:
- ✅ Confirmation alert appears: "Are you sure you want to delete this hindrance?"
- ✅ Alert has "Cancel" and "Delete" buttons
- ✅ After confirming, success alert shows "Hindrance deleted"
- ✅ Hindrance is removed from the list immediately

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC13: Cancel Delete
**Objective**: Verify cancel works on delete confirmation

**Steps**:
1. Tap "Delete" on a hindrance
2. Tap "Cancel" on confirmation dialog

**Expected Results**:
- ✅ Confirmation dialog closes
- ✅ Hindrance remains in the list
- ✅ No changes occur

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC14: Priority Levels
**Objective**: Test all priority levels

**Steps**:
1. Create 3 hindrances with different priorities:
   - Hindrance 1: Low priority
   - Hindrance 2: Medium priority
   - Hindrance 3: High priority
2. Observe the cards

**Expected Results**:
- ✅ Low priority: Green chip (#4CAF50)
- ✅ Medium priority: Orange chip (#FF9800)
- ✅ High priority: Red chip (#F44336)
- ✅ All chips show white text

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC15: Status Levels
**Objective**: Test all status levels

**Steps**:
1. Create 4 hindrances with different statuses:
   - Hindrance 1: Open
   - Hindrance 2: In Progress
   - Hindrance 3: Resolved
   - Hindrance 4: Closed
2. Observe the cards

**Expected Results**:
- ✅ Open: Red chip (#F44336)
- ✅ In Progress: Blue chip (#2196F3)
- ✅ Resolved: Green chip (#4CAF50)
- ✅ Closed: Gray chip (#9E9E9E)
- ✅ All chips show white text with correct labels

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC16: Related Item Selection
**Objective**: Link hindrance to a specific item

**Steps**:
1. Select a site that has items
2. Tap "Report Hindrance"
3. Scroll to "Related Item" section
4. Tap on an item chip
5. Fill other fields and create

**Expected Results**:
- ✅ "Related Item (Optional)" section appears with item chips
- ✅ "None" chip is selected by default
- ✅ Tapping an item chip selects it (visual feedback)
- ✅ Only one item can be selected at a time
- ✅ After saving, item name appears on the card: "Item: [Item Name]"

**Status**: [✅] Pass / [ ] Fail
**Notes**: ✅ FIXED: Added 7 more construction items: Concrete Pouring, Steel Framework, Drywall Installation, Electrical Wiring, Plumbing Installation, Roofing Work, Painting & Finishing, Flooring Installation, HVAC Installation (total 10 items now)

---

### TC17: No Related Item
**Objective**: Create hindrance without linking to an item

**Steps**:
1. Create a hindrance
2. Keep "None" selected for Related Item
3. Save the hindrance

**Expected Results**:
- ✅ Hindrance saves successfully
- ✅ No "Item: [name]" text appears on the card
- ✅ Only site name is shown

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC18: Form Validation - Empty Title
**Objective**: Verify title is required

**Steps**:
1. Tap "Report Hindrance"
2. Leave Title empty
3. Fill Description: "Test"
4. Tap "Create"

**Expected Results**:
- ✅ Alert appears: "Please enter a title"
- ✅ Form is not submitted
- ✅ Dialog remains open

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC19: Cancel Form
**Objective**: Cancel hindrance creation

**Steps**:
1. Tap "Report Hindrance"
2. Fill in some fields
3. Add a photo
4. Tap "Cancel"

**Expected Results**:
- ✅ Dialog closes
- ✅ No hindrance is created
- ✅ Form data is discarded
- ✅ No changes to the list

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC20: Pull to Refresh
**Objective**: Test refresh functionality

**Steps**:
1. On the hindrance list
2. Pull down from the top to refresh
3. Observe the refresh indicator

**Expected Results**:
- ✅ Refresh indicator appears
- ✅ List reloads
- ✅ Indicator disappears when complete

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC21: Sort Order
**Objective**: Verify hindrances are sorted by reported date (newest first)

**Steps**:
1. Create 3 hindrances at different times:
   - Hindrance A (wait 10 seconds)
   - Hindrance B (wait 10 seconds)
   - Hindrance C
2. Observe the list order

**Expected Results**:
- ✅ Hindrances appear in order: C, B, A (newest first)
- ✅ Sorting is by `reported_at` timestamp descending

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC22: Filter by Site
**Objective**: Verify filtering works when changing sites

**Steps**:
1. Create hindrances on Site 1
2. Create hindrances on Site 2
3. Switch site selector to "Site 1"
4. Observe the list
5. Switch to "Site 2"
6. Observe the list

**Expected Results**:
- ✅ When Site 1 selected, only Site 1 hindrances appear
- ✅ When Site 2 selected, only Site 2 hindrances appear
- ✅ Switching sites updates the list immediately

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC23: All Sites View
**Objective**: View hindrances across all sites

**Steps**:
1. Create hindrances on multiple sites
2. Select "All Sites" from site selector
3. Observe the list

**Expected Results**:
- ✅ All hindrances from all sites appear in the list
- ✅ Each card shows its respective site name
- ✅ "Report Hindrance" button is disabled
- ✅ Message shows "Select a site to view hindrances"

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC24: Sync Status Indicator
**Objective**: Verify sync status is displayed

**Steps**:
1. Create a new hindrance
2. Observe the sync status chip

**Expected Results**:
- ✅ Sync status chip appears with "pending" label
- ✅ Cloud upload icon is visible
- ✅ (Future: After sync, should show "synced" with cloud-check icon)

**Status**: [✅] Pass / [ ] Fail
**Notes**:
✅ FIXED: Cloud upload icon now visible with improved styling (light blue background #E3F2FD, blue text #1976D2)
---

### TC25: Description Display
**Objective**: Verify description shows correctly

**Steps**:
1. Create a hindrance with a long description (200+ characters)
2. Create a hindrance without description
3. Observe both cards

**Expected Results**:
- ✅ Long description displays properly with line breaks
- ✅ Card without description doesn't show description section
- ✅ Description divider appears only when description exists

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC26: Camera Permission Denied
**Objective**: Handle camera permission denial gracefully

**Steps**:
1. If permissions already granted, revoke camera permission in device settings
2. Tap "Report Hindrance"
3. Tap "Add Photos"
4. Tap "Take Photo"
5. Deny camera permission when prompted

**Expected Results**:
- ✅ Permission request appears
- ✅ After denial, alert shows "Camera permission is required to take photos"
- ✅ App doesn't crash
- ✅ User can try again or use gallery instead

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC27: Memory - Many Photos
**Objective**: Test app stability with multiple hindrances containing photos

**Steps**:
1. Create 10 hindrances
2. Add 5 photos to each
3. Scroll through the list
4. Edit some hindrances

**Expected Results**:
- ✅ App remains responsive
- ✅ No memory warnings or crashes
- ✅ Photos load correctly
- ✅ Scrolling is smooth

**Status**: [✅] Pass / [ ] Fail
**Notes**:
✅ FIXED: Performance optimized with React.memo for photo thumbnails, useCallback for handlers, and improved array validation
---

### TC28: Back Navigation During Edit
**Objective**: Verify data is not lost on back press

**Steps**:
1. Tap "Report Hindrance"
2. Fill in all fields
3. Add photos
4. Press device back button

**Expected Results**:
- ✅ Dialog closes (data is lost - expected behavior)
- ✅ No hindrance is created
- ✅ App returns to list view

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC29: Photo Persistence
**Objective**: Verify photos persist after app restart

**Steps**:
1. Create a hindrance with 3 photos
2. Close the app completely
3. Reopen the app
4. Login and navigate to Issues tab
5. Edit the hindrance

**Expected Results**:
- ✅ Hindrance appears in the list
- ✅ Camera icon shows "3"
- ✅ When edited, all 3 photos load correctly
- ✅ Photo URIs are valid and images display

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

### TC30: Multiple Sites Workflow
**Objective**: Test switching between multiple sites and creating hindrances

**Steps**:
1. Select Site A
2. Create 2 hindrances
3. Select Site B
4. Create 2 hindrances
5. Switch back to Site A
6. Verify only Site A hindrances appear

**Expected Results**:
- ✅ Each site maintains its own hindrance list
- ✅ No cross-contamination of hindrances
- ✅ Counts are accurate for each site

**Status**: [OK] Pass / [ ] Fail
**Notes**:

---

## Summary

**Total Test Cases**: 30
**Passed**: 30
**Failed**: 0
**Not Tested**: 0

**Pass Rate**: 100%

---

## Critical Issues Found (All Resolved)

| Issue # | Test Case | Description | Severity | Status |
|---------|-----------|-------------|----------|--------|
| 1 | TC24 | Sync status cloud upload icon not visible | Medium | ✅ FIXED |
| 2 | TC27 | Performance sluggish with many photos | Medium | ✅ FIXED |
| 3 | TC16 | Limited related item options (only 2 items) | Low | ✅ FIXED |

---

## Notes and Observations

**General Observations**:
All test cases now pass successfully. All identified issues have been resolved in this update.

**Fixes Implemented (2025-10-07)**:
1. **TC24 - Sync Status Icon**: Added explicit background color (#E3F2FD) and text color (#1976D2) to make cloud upload icon clearly visible
2. **TC27 - Performance**: Optimized photo rendering with React.memo for PhotoThumbnail component, useCallback for event handlers, and improved JSON array validation
3. **TC16 - Related Items**: Added 7 additional construction items to database initialization (Electrical Wiring, Plumbing, Roofing, Painting, Flooring, HVAC) for total of 10 items

**Performance**:
✅ Improved - Photo loading and scrolling optimized with memoization

**UI/UX**:
✅ Improved - Sync status indicator now clearly visible with proper color scheme

**Recommendations**:
All critical issues resolved. App ready for production testing.

---

## Sign-off

**Tester Name**: _Utpal Priyadarshi
**Date**: _07-10-2025
**Build Version**: v0.8 (Schema v8)
