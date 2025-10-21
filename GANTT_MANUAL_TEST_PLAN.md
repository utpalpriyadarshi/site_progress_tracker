# Gantt Chart Manual Test Plan

**Version**: v1.10 (Phase 2.4)
**Date**: October 20, 2025
**Feature**: Enhanced Gantt Chart Screen
**Estimated Testing Time**: 20-30 minutes

---

## Prerequisites

### Setup Requirements
- ✅ App installed on Android/iOS device or emulator
- ✅ Database initialized with default data
- ✅ Logged in as **Planner** role
- ✅ At least one site with multiple WBS items created
- ✅ Items should have varying start/end dates for timeline visualization

### Test Data Required
- **Site**: Test site with 5-10 WBS items
- **Items**: Mix of phases (Design, Construction, Testing, etc.)
- **Dates**: Items spanning at least 1-2 months
- **Critical Path**: At least 1-2 items marked as critical

---

## Test Execution Checklist

### Test Group 1: Initial Rendering (3 min)

**TC-1.1: Screen Navigation**
- [ ] Login as Planner
- [ ] Navigate to Planning tab
- [ ] Tap "Gantt" or "📊 Gantt" tab
- [ ] **Expected**: Gantt Chart screen loads
- [ ] **Expected**: Site selector displayed at top
- [ ] **Expected**: "Please select a site" message shown

**TC-1.2: Site Selector**
- [ ] Tap site selector dropdown
- [ ] **Expected**: List of sites appears
- [ ] Select a site from dropdown
- [ ] **Expected**: Site name displayed in selector
- [ ] **Expected**: Zoom controls appear below selector
- [ ] **Expected**: Legend card appears
- [ ] **Expected**: Gantt chart renders with items

---

### Test Group 2: Zoom Controls (5 min)

**TC-2.1: Week View (Default)**
- [ ] Verify "Week" is selected by default
- [ ] **Expected**: Timeline header shows "W1, W2, W3..." format
- [ ] **Expected**: Each column is ~80px wide
- [ ] **Expected**: Task bars are positioned correctly
- [ ] **Expected**: Columns have vertical separator lines

**TC-2.2: Day View**
- [ ] Tap "Day" zoom button
- [ ] **Expected**: Zoom changes to Day view
- [ ] **Expected**: Timeline header shows "Oct 15, Oct 16, Oct 17..." format
- [ ] **Expected**: Each column is ~60px wide
- [ ] **Expected**: Weekend columns (Sat/Sun) have gray background
- [ ] **Expected**: Task bars adjust to new scale
- [ ] **Expected**: More columns visible (finer granularity)

**TC-2.3: Month View**
- [ ] Tap "Month" zoom button
- [ ] **Expected**: Zoom changes to Month view
- [ ] **Expected**: Timeline header shows "Oct 2025, Nov 2025..." format
- [ ] **Expected**: Each column is ~120px wide
- [ ] **Expected**: Task bars adjust to new scale
- [ ] **Expected**: Fewer columns (broader view)

**TC-2.4: Zoom Switching**
- [ ] Switch between Day → Week → Month → Day
- [ ] **Expected**: Smooth transition between zoom levels
- [ ] **Expected**: Task bars recalculate positions correctly
- [ ] **Expected**: Timeline bounds remain consistent
- [ ] **Expected**: No visual glitches or overlaps

---

### Test Group 3: Timeline Rendering (5 min)

**TC-3.1: Timeline Header**
- [ ] Scroll timeline header horizontally
- [ ] **Expected**: Timeline scrolls smoothly
- [ ] **Expected**: Date labels remain visible
- [ ] **Expected**: Vertical separator lines visible
- [ ] **Expected**: Header synchronized with task rows

**TC-3.2: Timeline Bounds**
- [ ] Verify timeline starts before earliest item
- [ ] Verify timeline ends after latest item
- [ ] **Expected**: 3 days padding before earliest item
- [ ] **Expected**: 3 days padding after latest item
- [ ] **Expected**: All items visible within timeline

**TC-3.3: Today Marker**
- [ ] Look for blue vertical line in timeline
- [ ] **Expected**: Today marker visible if today is within timeline
- [ ] **Expected**: Marker spans full height of Gantt chart
- [ ] **Expected**: Marker color is #2196F3 (blue)
- [ ] **Expected**: Marker positioned at correct date

---

### Test Group 4: Task Bar Visualization (7 min)

**TC-4.1: Task Bar Position**
- [ ] Verify task bars start at correct date position
- [ ] Verify task bars end at correct date position
- [ ] **Expected**: Bar left edge aligns with start date
- [ ] **Expected**: Bar right edge aligns with end date
- [ ] **Expected**: Bar width represents duration

**TC-4.2: Phase Colors**
- [ ] Check task bar colors match phases
- [ ] **Expected**: Design items = Blue (#2196F3)
- [ ] **Expected**: Construction items = Green (#4CAF50)
- [ ] **Expected**: Testing items = Red (#F44336)
- [ ] **Expected**: Each phase has distinct color
- [ ] **Expected**: Colors match WBS Management screen

**TC-4.3: Progress Overlay**
- [ ] Check progress overlay on task bars
- [ ] **Expected**: Darker color overlay from left edge
- [ ] **Expected**: Overlay width = completion percentage
- [ ] **Expected**: Progress % text visible on bar (if bar > 50px)
- [ ] **Expected**: 0% progress = no overlay visible
- [ ] **Expected**: 100% progress = full bar colored

**TC-4.4: Critical Path Highlighting**
- [ ] Identify items marked as critical
- [ ] **Expected**: Critical items have thick red border (3px)
- [ ] **Expected**: Border color is #d32f2f (red)
- [ ] **Expected**: Non-critical items have thin phase-color border (1px)
- [ ] **Expected**: "Critical" chip visible in task metadata

**TC-4.5: Task Bar Minimum Width**
- [ ] Find tasks with very short duration (1-2 days)
- [ ] **Expected**: Even short tasks have minimum 20px width
- [ ] **Expected**: Small tasks remain visible and clickable
- [ ] **Expected**: No task bars are invisible

---

### Test Group 5: Task Metadata (4 min)

**TC-5.1: Left Column Display**
- [ ] Check left column (fixed 200px width)
- [ ] **Expected**: WBS code visible (e.g., "1.2.3.0")
- [ ] **Expected**: Task name visible (truncated if long)
- [ ] **Expected**: Format: "{WBS} - {Name}"
- [ ] **Expected**: Text truncates with ellipsis if too long

**TC-5.2: Phase Chips**
- [ ] Check phase chips below task names
- [ ] **Expected**: Small compact chip with phase name
- [ ] **Expected**: Chip background color matches phase (20% opacity)
- [ ] **Expected**: Chip text color is solid phase color
- [ ] **Expected**: Font size is small (9px)

**TC-5.3: Critical Chips**
- [ ] Check critical items for "Critical" chip
- [ ] **Expected**: Red chip with text "Critical"
- [ ] **Expected**: Background: #ffebee (light red)
- [ ] **Expected**: Text color: #d32f2f (red)
- [ ] **Expected**: Only visible on critical path items

---

### Test Group 6: Legend (2 min)

**TC-6.1: Legend Display**
- [ ] Check legend card below zoom controls
- [ ] **Expected**: "Progress" - green box
- [ ] **Expected**: "Critical Path" - red bordered box
- [ ] **Expected**: "Today" - blue box (if today is visible)
- [ ] **Expected**: Legend items laid out horizontally
- [ ] **Expected**: Clear and easy to read

**TC-6.2: Legend Accuracy**
- [ ] Verify legend matches actual visualizations
- [ ] **Expected**: Progress color matches overlay color
- [ ] **Expected**: Critical box matches border style
- [ ] **Expected**: Today color matches marker line

---

### Test Group 7: Empty & Loading States (3 min)

**TC-7.1: No Site Selected**
- [ ] Clear site selection (if possible, or reload screen)
- [ ] **Expected**: Empty state message displayed
- [ ] **Expected**: "Please select a site to view the Gantt chart"
- [ ] **Expected**: No Gantt chart rendered
- [ ] **Expected**: Zoom controls hidden

**TC-7.2: Site with No Items**
- [ ] Select a site with zero WBS items
- [ ] **Expected**: Empty state message displayed
- [ ] **Expected**: "No items found for this site. Create items in the WBS tab to see them here."
- [ ] **Expected**: No task bars rendered
- [ ] **Expected**: Zoom controls still visible

**TC-7.3: Loading State (brief)**
- [ ] Change site selection
- [ ] **Expected**: Brief loading indicator appears
- [ ] **Expected**: "Loading tasks..." text visible
- [ ] **Expected**: Loading spinner visible
- [ ] **Expected**: Loads within 1-2 seconds

---

### Test Group 8: Scrolling & Interaction (4 min)

**TC-8.1: Horizontal Scrolling**
- [ ] Scroll timeline header left/right
- [ ] **Expected**: Smooth scrolling
- [ ] **Expected**: Task rows scroll in sync
- [ ] **Expected**: Left column (task info) stays fixed
- [ ] **Expected**: Scroll indicator visible

**TC-8.2: Vertical Scrolling**
- [ ] Scroll through tasks vertically
- [ ] **Expected**: Smooth scrolling
- [ ] **Expected**: Header row stays fixed at top
- [ ] **Expected**: All tasks accessible via scroll
- [ ] **Expected**: Scroll indicator visible

**TC-8.3: Two-Dimensional Scrolling**
- [ ] Scroll both horizontally and vertically
- [ ] **Expected**: Both dimensions scroll independently
- [ ] **Expected**: No scroll conflicts
- [ ] **Expected**: Smooth multi-directional scrolling

---

### Test Group 9: Data Accuracy (5 min)

**TC-9.1: Item Count**
- [ ] Count items in WBS Management screen
- [ ] Count items in Gantt Chart screen
- [ ] **Expected**: Same number of items in both screens
- [ ] **Expected**: All items from selected site visible

**TC-9.2: Date Accuracy**
- [ ] Pick an item from Gantt chart
- [ ] Note its start/end dates visually
- [ ] Go to WBS → Edit that item
- [ ] Compare actual dates
- [ ] **Expected**: Dates match exactly
- [ ] **Expected**: Bar position/width reflects dates accurately

**TC-9.3: Sorting Order**
- [ ] Check order of tasks in Gantt chart
- [ ] **Expected**: Tasks sorted by start date (earliest first)
- [ ] **Expected**: If same start date, sorted by WBS code
- [ ] **Expected**: Consistent with database query sort

**TC-9.4: Critical Path Accuracy**
- [ ] Note critical items in Gantt chart
- [ ] Go to Baseline screen and check critical path
- [ ] **Expected**: Same items marked as critical
- [ ] **Expected**: Red highlighting matches critical path calculation

**TC-9.5: Progress Accuracy**
- [ ] Pick an item with progress in Gantt chart
- [ ] Go to WBS → View that item details
- [ ] Compare progress percentages
- [ ] **Expected**: Progress % matches between screens
- [ ] **Expected**: Progress overlay width is accurate

---

## Edge Cases & Error Scenarios

### EC-1: Very Short Tasks (< 1 day)
- [ ] Create item with same start/end date
- [ ] **Expected**: Task bar still visible (20px minimum)
- [ ] **Expected**: Progress % may not be visible due to small width

### EC-2: Very Long Tasks (> 3 months)
- [ ] Create item spanning many months
- [ ] **Expected**: Task bar spans multiple columns
- [ ] **Expected**: Bar doesn't overflow screen
- [ ] **Expected**: Horizontal scrolling works correctly

### EC-3: Overlapping Tasks
- [ ] Multiple tasks with same start date
- [ ] **Expected**: Tasks stack vertically (different rows)
- [ ] **Expected**: No visual overlap
- [ ] **Expected**: All tasks visible

### EC-4: Tasks Outside Current Month
- [ ] Tasks far in future or past
- [ ] **Expected**: Timeline adjusts to show all tasks
- [ ] **Expected**: Padding still applies
- [ ] **Expected**: Today marker may not be visible

### EC-5: Zoom on Large Timeline
- [ ] Site with 100+ days of tasks
- [ ] Switch to Day zoom
- [ ] **Expected**: Many columns generated (scrollable)
- [ ] **Expected**: No performance lag
- [ ] **Expected**: Smooth scrolling maintained

---

## Performance Checks

### P-1: Rendering Time
- [ ] Select site with 50+ items
- [ ] **Expected**: Renders within 2-3 seconds
- [ ] **Expected**: No visible lag or stutter

### P-2: Zoom Switching Performance
- [ ] Switch zoom levels rapidly
- [ ] **Expected**: Instant transitions (<500ms)
- [ ] **Expected**: No flickering
- [ ] **Expected**: Smooth recalculations

### P-3: Scrolling Performance
- [ ] Scroll quickly through 50+ items
- [ ] **Expected**: Smooth 60fps scrolling
- [ ] **Expected**: No dropped frames
- [ ] **Expected**: Responsive to touch

---

## Browser/Device Specific Tests

### iOS Testing
- [ ] Test on iOS simulator or device
- [ ] **Expected**: All features work identically
- [ ] **Expected**: Scrolling gestures natural
- [ ] **Expected**: No iOS-specific bugs

### Android Testing
- [ ] Test on Android emulator or device
- [ ] **Expected**: All features work identically
- [ ] **Expected**: Material Design styling consistent
- [ ] **Expected**: No Android-specific bugs

---

## Integration Tests

### I-1: WBS Integration
- [ ] Create item in WBS tab
- [ ] Switch to Gantt tab
- [ ] **Expected**: New item appears in Gantt chart
- [ ] **Expected**: Position and dates accurate

### I-2: Edit Item Integration
- [ ] Edit item dates in WBS tab
- [ ] Switch to Gantt tab
- [ ] **Expected**: Task bar position updates
- [ ] **Expected**: Changes reflect immediately

### I-3: Delete Item Integration
- [ ] Delete item from WBS tab
- [ ] Switch to Gantt tab
- [ ] **Expected**: Item no longer visible in Gantt
- [ ] **Expected**: Timeline recalculates

---

## Summary

**Total Test Cases**: ~50+
**Critical Test Cases**: 30
**Pass Criteria**: 95%+ tests passing
**Estimated Time**: 20-30 minutes

**Sign-off**:
- [ ] All critical tests passed
- [ ] No major visual bugs
- [ ] Performance acceptable
- [ ] Ready for production

---

## Notes

Add any observations, bugs, or issues discovered during testing:

```
[Space for tester notes]
```
