# Test Checklist - Version 2.12
## Phase 3: Task 3.3 & Task 3.5

**Tester:** _Utpal Priyadarshi________________
**Date:** 15/12/2025_________________
**Device/Emulator:** 'sdk_gphone64_x86_64 - 16 - API 36'
________________
**OS Version:** _________________

---

## Task 3.3: Enhanced Empty States Testing

### 1. SiteManagementScreen

#### Test Case 1.1: No Sites Empty State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Site Management screen
2. Ensure no sites exist (delete all or fresh database)

**Expected Results:**
- Animated fade-in of empty state
- Icon displayed in colored circle
- Title: "No Sites Yet"
- Help text about construction sites displayed
- 3 bullet point tips with info icons visible
- "Create Site" button appears
- Tapping button opens add site dialog

**Actual Results:**
```
Observations: All expected results met/Passed




```

**Issues Found:**
```



```

---

#### Test Case 1.2: Search/Filter Empty State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Site Management with existing sites
2. Search for non-existent site name (e.g., "XYZ123")

**Expected Results:**
- "No Sites Found" title displayed
- Search variant styling applied
- Message: "No sites match your current search or filter criteria."
- "Clear Filters" button appears
- Tapping "Clear Filters" clears the search

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

### 2. ItemsManagementScreen

#### Test Case 2.1: No Site Selected State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Items Management screen
2. Set site selector to "All Sites"

**Expected Results:**
- "Select a Site" empty state displayed
- Icon and message instructional
- Tips about selecting sites shown
- No action button (instructional only)

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

#### Test Case 2.2: No Items Empty State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Select a specific site with no items

**Expected Results:**
- "No Items Yet" message
- Help text about work items
- 3 tips displayed with info icons
- "Add Item" button visible and functional

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

### 3. MaterialTrackingScreen

#### Test Case 3.1: No Site Selected State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Material Tracking screen
2. Set to "All Sites"

**Expected Results:**
- Instructional empty state: "Select a Site"
- Helpful tips displayed
- No action button

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

#### Test Case 3.2: No Materials Empty State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Select site with no material tracking records

**Expected Results:**
- "No Materials Yet" message
- Help text about material tracking
- Tips displayed
- "Track Material" button functional

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

### 4. ReportsHistoryScreen

#### Test Case 4.1: No Site Selected State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Reports History
2. Set to "All Sites"

**Expected Results:**
- Instructional empty state displayed
- Tips about viewing reports
- No action button

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

#### Test Case 4.2: No Reports Empty State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Select site with no reports

**Expected Results:**
- "No Reports Yet" message
- Help text and tips
- "Create Report" button functional

**Actual Results:**
```
Observations:All expected results met except Create Report button, Partial pass




```

**Issues Found:** No Create Report button
```



```

---

#### Test Case 4.3: Search No Results
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Search for non-existent report

**Expected Results:**
- Search variant empty state
- "Clear Search" button appears
- Button clears search term

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

### 5. DashboardScreen

#### Test Case 5.1: No Data Available State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Navigate to Dashboard
2. Select site with no data

**Expected Results:**
- "No Data Available" empty state
- Large variant displayed
- Helpful tips shown
- Smooth fade-in animation

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```



```

---

## Task 3.5: Offline Mode Indicators Testing

### 6. Online State

#### Test Case 6.1: Normal Online State
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Ensure device has internet connection
2. Open SiteInspectionScreen

**Expected Results:**
- No offline banner visible at top
- Sync button shows cloud-sync icon (blue/gray)
- Sync button is enabled

**Actual Results:**
```
Observations:All expected results met, passed




```

**Issues Found:**
```



```

---

### 7. Offline Detection

#### Test Case 7.1: Go Offline
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Enable Airplane Mode OR disable WiFi/mobile data
2. Observe UI changes

**Expected Results:**
- Orange banner slides in from top
- Banner text: "You're offline. Changes will sync automatically when reconnected."
- Sync button changes to cloud-off icon (orange)
- Sync button is DISABLED

**Actual Results:**
```
Observations:All expected results met/Passed




```

**Issues Found:**
```
No change in Sync button color however icon is disableb


```

---

#### Test Case 7.2: Return Online
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Disable Airplane Mode / re-enable network
2. Observe UI changes

**Expected Results:**
- Orange banner slides out smoothly
- Sync button returns to normal cloud-sync icon
- Sync button becomes enabled

**Actual Results:**
```
Observations:All expected results met/Passed, sysnc button is enable in grey color




```

**Issues Found:**
```



```

---

### 8. Pending Items Counter

#### Test Case 8.1: SiteInspectionScreen - Create Pending Items
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Go offline (Airplane Mode)
2. Create new inspection with photos and notes
3. Save inspection
4. Create 2 more inspections

**Expected Results:**
- After 1st: Blue banner appears: "1 item pending sync..."
- Sync button shows badge with "1"
- After 2nd: Banner updates to "2 items pending sync..."
- Badge shows "2"
- After 3rd: Banner shows "3 items pending sync..."
- Badge shows "3"

**Actual Results:** followed the steps, created inspections with photos and saved, results is opposite, during offline no blue banner with count pending, after making online banner appears with count but not syncing, refer scrennshots in @prompts\app3.png and @prompts\app4.png
```
Observations:
Result is opposite



```

**Issues Found:**
```



```

---

#### Test Case 8.2: HindranceReportScreen - Create Pending Items
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Go offline
2. Create 2-3 hindrance reports
3. Edit existing hindrance

**Expected Results:**
- Pending counter increments correctly
- Badge updates with each create/edit
- Banner shows accurate count

**Actual Results:** Created as indicated in steps, badge is updating with each create/edit, there is no pending counter
```
Observations:




```

**Issues Found:**
```
Not meeting entirely expected results


```

---

### 9. Manual Sync

#### Test Case 9.1: Sync Pending Items
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Create 3-5 items while offline
2. Go back online
3. Tap sync button in header (or tap pending banner)
4. Wait for sync completion

**Expected Results:**
- Sync button shows loading spinner
- Button is disabled during sync
- After completion: Success snackbar "Data synced successfully"
- Pending count resets to 0
- Blue pending banner disappears
- Badge on sync button disappears

**Actual Results:** all ok but there is no pending count reset to 0 in hindrance report screen, but available in inspection no badge on sync button
```
Observations:




```

**Issues Found:**
```



```

---

#### Test Case 9.2: Sync Button States
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Test each sync status state

**Expected Results:**
- **Idle:** cloud-sync icon (gray/blue)
- **Syncing:** Loading spinner animation
- **Success:** cloud-check icon (green) - briefly
- **Error:** cloud-alert icon (red)
- **Offline:** cloud-off-outline icon (orange)

**Actual Results:** All expected results meets
```
Idle state:


Syncing state:


Success state:


Error state:


Offline state:


```

**Issues Found:**
```



```

---

### 10. Edge Cases

#### Test Case 10.1: Multiple Screen Sync
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Create 2 items in SiteInspectionScreen
2. Navigate to HindranceReportScreen
3. Create 3 items in HindranceReportScreen
4. Sync from one screen

**Expected Results:**
- Each screen tracks its own pending count correctly
- Syncing from either screen syncs ALL pending items
- Both screens update pending count to 0 after sync

**Actual Results:** Followed steps as mentioned, Even after syncing pending count persistes in Site inspection screen. There was no pending count status in Hindrance screen however message is data synced succesfully.
```
Observations:




```

**Issues Found:**
```



```

---

#### Test Case 10.2: Rapid Online/Offline Toggle
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Toggle airplane mode on/off quickly (5-6 times)
2. Observe banner and button behavior

**Expected Results:**
- Banner animations handle transitions smoothly
- No duplicate banners appear
- No UI glitches or crashes
- Final state matches actual network state

**Actual Results:** All ok, it is smooth.
```
Observations:




```

**Issues Found:**
```



```

---

#### Test Case 10.3: 99+ Pending Items Badge
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Create 100+ items offline (if feasible, or modify counter for testing)

**Expected Results:**
- Badge shows "99+" instead of exact number
- Banner still shows accurate count (e.g., "127 items pending sync")

**Actual Results:** pending item badge working in site inspection screen but pending item badge is not seen in hindrance screen.
```
Observations:
Data is syncing succesfully but count badge is still there.



```

**Issues Found:**
```



```

---

#### Test Case 10.4: Banner Tap-to-Sync
- [ ] **PASS** / [ ] **FAIL**

**Steps:**
1. Create pending items while offline
2. Go online
3. Tap the blue pending banner (not the sync button)

**Expected Results:**
- Tapping banner triggers manual sync
- Same sync behavior as tapping sync button
- Sync completes successfully

**Actual Results:** All ok but results as indicated in above tests
```
Observations:




```

**Issues Found:**
```



```

---

## Animation Performance

#### Test Case 11.1: Empty State Animations
- [ ] **PASS** / [ ] **FAIL**

**Expected Results:**
- Smooth fade-in animation (no lag)
- Scale animation feels natural
- No visual glitches during animation

**Actual Results:**
```
Observations: All ok




```

---

#### Test Case 11.2: Banner Slide Animations
- [ ] **PASS** / [ ] **FAIL**

**Expected Results:**
- Smooth slide-in from top
- Smooth slide-out
- No layout shifts during animation
- Duration feels appropriate (~300ms)

**Actual Results:**
```
Observations: All ok




```

---

## Overall Assessment

### Task 3.3: Enhanced Empty States
- **Total Test Cases:** 9
- **Passed:** _____
- **Failed:** _____
- **Pass Rate:** _____%

**Summary:**
```
Observations are mentioned against each test with pass/fail.
Overall it is good but some issues are there which are mentioned.
We need to maintain uniformity across screens like site selector, search are placed randomly in different screens. we can plan this once we have done complete task.



```

---

### Task 3.5: Offline Mode Indicators
- **Total Test Cases:** 13
- **Passed:** _____
- **Failed:** _____
- **Pass Rate:** _____%

**Summary:**
```
Test observations are marked on each tests, we need to work on User experience with maintaining uniformity once completed.



```

---

## Critical Issues Found
**Priority:** HIGH / MEDIUM / LOW

1.
2.
3.

---

## Minor Issues / Improvements
1.
2.
3.

---

## Sign-off

- [ ] All critical issues resolved
- [ ] Ready for production
- [ ] Requires additional work

**Tester Signature:** _________________
**Date:** _________________

**Notes:**
```




```
