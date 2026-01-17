# Manager Phase 3 Manual Testing Checklist

**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Manager
**Testing Date:** _____________
**Tested By:** _____________
**Build/Branch:** manager/phase3-implementation

---

## Test Environment Setup

**Prerequisites:**
- [ ] App installed on Android device or emulator
- [ ] User logged in as Manager role
- [ ] Manager has at least one project assigned
- [ ] Project has sites with items, milestones, BOMs, and supervisors
- [ ] Network connectivity (or offline mode tested separately)

**Demo Manager Account:**
- Username: `manager` / Password: `Manager@2025`

---

## 1. Dashboard Widget System Tests (Task 3.1)

### 1.1 Widget Display and Layout

- [ ] **Test 1.1.1:** Dashboard displays all 7 widgets
  - **Steps:** Login as Manager → Navigate to Dashboard
  - **Expected:** All widgets visible: KPI Overview, Engineering Progress, Site Progress, Equipment & Materials, Financial Summary, Testing & Commissioning, Handover Status
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.1.2:** Widgets show loading state initially
  - **Steps:** Force refresh dashboard
  - **Expected:** Each widget shows loading skeleton/spinner before data appears
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.1.3:** Widget error handling
  - **Steps:** Disconnect network → Refresh widget
  - **Expected:** Widget shows error state with retry option
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.2 KPI Overview Widget

- [ ] **Test 1.2.1:** Overall completion percentage displays correctly
  - **Steps:** View KPI widget
  - **Expected:** Shows overall completion % matching actual project data
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.2.2:** Budget utilization displays correctly
  - **Expected:** Shows budget utilization % based on actual costs vs budget
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.2.3:** Sites on schedule/delayed counts are accurate
  - **Expected:** StatusBadge shows correct counts for on-schedule vs delayed sites
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.3 Engineering Progress Widget

- [ ] **Test 1.3.1:** PM200 progress displays correctly
  - **Expected:** Shows engineering phase progress percentage
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.3.2:** DOORS status displays correctly
  - **Expected:** Shows DOORS package status (pending/approved/completed)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.3.3:** RFQ status displays correctly
  - **Expected:** Shows RFQ counts by status
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.4 Site Progress Widget

- [ ] **Test 1.4.1:** Sites comparison chart displays
  - **Expected:** Chart shows all sites with their progress percentages
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.4.2:** Chart is interactive (if applicable)
  - **Expected:** Tap on site shows details or navigates to site view
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.5 Equipment & Materials Widget

- [ ] **Test 1.5.1:** PM300/PM400 progress displays
  - **Expected:** Shows equipment and materials phase progress
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.5.2:** PO status displays correctly
  - **Expected:** Shows purchase order counts by status
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.6 Financial Summary Widget

- [ ] **Test 1.6.1:** Budget information displays
  - **Expected:** Shows budget amount, spent amount, remaining
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.6.2:** P&L summary displays
  - **Expected:** Shows profit/loss indicators
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.6.3:** BOM costs summary displays
  - **Expected:** Shows total BOM costs across project
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.7 Testing & Commissioning Widget

- [ ] **Test 1.7.1:** PM500/PM600 progress displays
  - **Expected:** Shows testing and commissioning phase progress
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.7.2:** Inspections status displays
  - **Expected:** Shows inspection counts (pending/completed/failed)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.8 Handover Status Widget

- [ ] **Test 1.8.1:** PM700 progress displays
  - **Expected:** Shows handover phase progress
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.8.2:** Documentation status displays
  - **Expected:** Shows documentation completion status
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.8.3:** Punch list status displays
  - **Expected:** Shows open/closed punch list items
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 1.9 Widget Refresh Functionality

- [ ] **Test 1.9.1:** Individual widget refresh works
  - **Steps:** Tap refresh button on a widget
  - **Expected:** Widget reloads data, shows loading then updated content
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 1.9.2:** Pull-to-refresh refreshes all widgets
  - **Steps:** Pull down on dashboard screen
  - **Expected:** All widgets refresh simultaneously
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 2. Accessibility Tests (Task 3.2)

### 2.1 Screen Reader Support

- [ ] **Test 2.1.1:** Enable TalkBack (Android) or VoiceOver (iOS)
  - **Steps:** Enable screen reader → Navigate to Manager Dashboard
  - **Expected:** All widgets are announced with meaningful labels
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.1.2:** Widget content is read correctly
  - **Steps:** Focus on each widget with screen reader
  - **Expected:** Widget title, content, and values are announced
  - **Example:** "Project Overview widget. Overall completion 75%. Budget utilization 60%."
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.1.3:** StatusBadge is accessible
  - **Steps:** Focus on StatusBadge elements
  - **Expected:** Badge label is announced (e.g., "5 sites on schedule", "2 delayed")
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.1.4:** Interactive elements have accessibility hints
  - **Expected:** Buttons announce "Double tap to [action]"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 2.2 Keyboard/D-pad Navigation (if applicable)

- [ ] **Test 2.2.1:** Can navigate between widgets using keyboard/D-pad
  - **Steps:** Connect hardware keyboard or use emulator
  - **Expected:** Tab/arrow keys move focus between widgets
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.2.2:** Focus indicator is visible
  - **Expected:** Currently focused element has visible outline/highlight
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 2.3 BOM Management Accessibility

- [ ] **Test 2.3.1:** BOM list items are accessible
  - **Steps:** Navigate to BOM Management → Enable screen reader
  - **Expected:** BOM items announced with name, quantity, cost
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.3.2:** Search results are announced
  - **Steps:** Perform search in BOM Management
  - **Expected:** "Found X BOMs matching [query]" is announced
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 2.4 Milestone Management Accessibility

- [ ] **Test 2.4.1:** Milestone cards are accessible
  - **Steps:** Navigate to Milestone Management → Enable screen reader
  - **Expected:** Milestone name, progress, dates announced
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 2.4.2:** Batch approval dialog is accessible
  - **Steps:** Open batch approval dialog → Navigate with screen reader
  - **Expected:** Dialog title, checkboxes, and buttons are announced
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 3. Enhanced Empty States Tests (Task 3.3)

### 3.1 Dashboard Empty States

- [ ] **Test 3.1.1:** No project assigned empty state
  - **Steps:** Login as Manager without assigned project
  - **Expected:** Dashboard shows "No Project Assigned" with helpful message
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.1.2:** Empty state has action button (if applicable)
  - **Expected:** "Contact Admin" or similar action available
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 3.2 BOM Management Empty States

- [ ] **Test 3.2.1:** No BOMs empty state (Estimating tab)
  - **Steps:** Navigate to BOM Management → Estimating tab (no BOMs)
  - **Expected:** Shows "No bills of materials for estimating" with create button
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.2.2:** No BOMs empty state (Execution tab)
  - **Steps:** Navigate to BOM Management → Execution tab (no BOMs)
  - **Expected:** Shows context-appropriate message for execution phase
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.2.3:** No search results empty state
  - **Steps:** Search for non-existent BOM
  - **Expected:** Shows "No BOMs found matching [query]" with clear search option
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 3.3 Financial Reports Empty States

- [ ] **Test 3.3.1:** No project empty state
  - **Steps:** View Financial Reports without project
  - **Expected:** Shows appropriate message about no project assigned
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.3.2:** No financial data empty state
  - **Steps:** View Financial Reports with project but no data
  - **Expected:** Shows "No financial data available" message
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 3.4 Milestone Management Empty States

- [ ] **Test 3.4.1:** No milestones empty state
  - **Steps:** View Milestone Management with no milestones
  - **Expected:** Shows "No milestones defined" with "Create Milestone" button
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.4.2:** Create button is functional
  - **Steps:** Tap "Create Milestone" from empty state
  - **Expected:** Opens milestone creation dialog/screen
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 3.5 Team Performance Empty States

- [ ] **Test 3.5.1:** No project empty state
  - **Steps:** View Team Performance without project
  - **Expected:** Shows appropriate message
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 3.5.2:** No supervisors empty state
  - **Steps:** View Team Performance with project but no supervisors
  - **Expected:** Shows "No supervisors assigned to this project"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 4. Search & Filter Performance Tests (Task 3.4)

### 4.1 BOM Search Performance

- [ ] **Test 4.1.1:** Search input is debounced
  - **Steps:** Type quickly in BOM search field
  - **Expected:** Search executes after 300ms pause, not on every keystroke
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.2:** Search by BOM name works
  - **Steps:** Search for partial BOM name
  - **Expected:** Matching BOMs displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.3:** Search by category works
  - **Steps:** Search by BOM category name
  - **Expected:** BOMs in that category displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.4:** Search by description works
  - **Steps:** Search by text in BOM description
  - **Expected:** BOMs with matching description displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.5:** Search by status works
  - **Steps:** Search by status text (e.g., "approved", "pending")
  - **Expected:** BOMs with that status displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.6:** Result count displayed in header
  - **Steps:** Perform search
  - **Expected:** Header shows "X results" or "Showing X of Y"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.1.7:** Clear search resets results
  - **Steps:** Clear search input
  - **Expected:** Full BOM list displayed again
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 4.2 Team Performance Search

- [ ] **Test 4.2.1:** Supervisor search is debounced
  - **Steps:** Type quickly in supervisor search field
  - **Expected:** Search executes after pause, not on every keystroke
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.2.2:** Search by supervisor name works
  - **Steps:** Search for supervisor name
  - **Expected:** Matching supervisors displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.2.3:** Search by site name works
  - **Steps:** Search for site name
  - **Expected:** Supervisors assigned to that site displayed
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.2.4:** Result count displayed
  - **Expected:** Shows number of matching supervisors
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 4.3 Performance with Large Data Sets

- [ ] **Test 4.3.1:** BOM list with 100+ items scrolls smoothly
  - **Expected:** No lag or frame drops when scrolling
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 4.3.2:** Search on large list is responsive
  - **Steps:** Search in list with 100+ items
  - **Expected:** Results appear within 500ms
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 5. Advanced Features Tests (Task 3.5)

### 5.1 BOM Export Functionality

- [ ] **Test 5.1.1:** Export button visible on BOM
  - **Steps:** Navigate to BOM Management → View a BOM
  - **Expected:** Export button/icon visible
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.1.2:** Export to Excel works
  - **Steps:** Tap Export → Select Excel format
  - **Expected:** File download initiated or share sheet appears
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.1.3:** Exported file contains correct data
  - **Steps:** Open exported Excel file
  - **Expected:** All BOM items with correct quantities, costs, descriptions
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 5.2 Batch Approval UI

- [ ] **Test 5.2.1:** Batch Approve button visible on milestone cards
  - **Steps:** Navigate to Milestone Management
  - **Expected:** "Batch Approve" button visible on milestone cards (only if sites are incomplete)
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.2:** Button hidden if all sites complete
  - **Steps:** View milestone where all sites are complete
  - **Expected:** "Batch Approve" button not visible
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.3:** Batch approval dialog opens
  - **Steps:** Tap "Batch Approve" button
  - **Expected:** Dialog opens with site selection list
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.4:** Sites displayed with checkboxes
  - **Expected:** Each eligible site has a checkbox
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.5:** Completed sites have disabled checkboxes
  - **Expected:** Already completed sites have grayed-out/disabled checkbox
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.6:** Eligible sites pre-selected
  - **Expected:** Sites not already completed are pre-checked
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.7:** Select All button works
  - **Steps:** Tap "Select All"
  - **Expected:** All eligible sites selected
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.8:** Deselect All button works
  - **Steps:** Tap "Deselect All"
  - **Expected:** All sites deselected
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.9:** Batch approve executes successfully
  - **Steps:** Select sites → Tap "Approve Selected"
  - **Expected:** Progress records updated, success message shown
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.10:** Approved sites reflect updated status
  - **Steps:** Check milestone after batch approval
  - **Expected:** Approved sites show 100% completion
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 5.2.11:** Accessibility announcement for batch approve
  - **Steps:** Perform batch approval with screen reader enabled
  - **Expected:** Announcement like "5 sites approved"
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 6. Integration Tests

### 6.1 Data Consistency

- [ ] **Test 6.1.1:** Dashboard widgets reflect database changes
  - **Steps:** Update data in another screen → Return to Dashboard
  - **Expected:** Widgets show updated data
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 6.1.2:** BOM search results match database
  - **Expected:** Search results accurate with current database state
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

### 6.2 Offline Behavior

- [ ] **Test 6.2.1:** Dashboard works offline (cached data)
  - **Steps:** Enable airplane mode → View Dashboard
  - **Expected:** Widgets show cached data with offline indicator
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 6.2.2:** Search works offline
  - **Expected:** Can search cached BOM data while offline
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## 7. Regression Tests

### 7.1 Existing Functionality

- [ ] **Test 7.1.1:** BOM CRUD operations still work
  - **Steps:** Create, Read, Update, Delete a BOM
  - **Expected:** All operations successful
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 7.1.2:** Milestone CRUD operations still work
  - **Steps:** Create, Read, Update, Delete a milestone
  - **Expected:** All operations successful
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 7.1.3:** Team management still works
  - **Expected:** Can view and manage team members
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

- [ ] **Test 7.1.4:** Financial reports still work
  - **Expected:** Can view and generate financial reports
  - **Result:** ☐ Pass ☐ Fail
  - **Notes:** _________________________________________________

---

## Test Summary

| Category | Total Tests | Passed | Failed | Blocked | Notes |
|----------|-------------|--------|--------|---------|-------|
| 1. Dashboard Widgets | 20 | | | | |
| 2. Accessibility | 10 | | | | |
| 3. Empty States | 10 | | | | |
| 4. Search Performance | 12 | | | | |
| 5. Advanced Features | 13 | | | | |
| 6. Integration | 4 | | | | |
| 7. Regression | 4 | | | | |
| **TOTAL** | **73** | | | | |

**Pass Rate:** _____ / 73 = _____%

**Critical Issues Found:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Minor Issues Found:**
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

**Sign-off:**

Tested By: _________________________ Date: _____________

Reviewed By: _________________________ Date: _____________

---

**Document Created:** 2026-01-17
**Phase:** Manager Phase 3
**Version:** 1.0
