# Planning Module Testing Plan (Phases 1-3)

**Version:** v1.4 (Phases 1-3)
**Created:** 2025-10-13
**Test Environment:** Development
**Database Schema:** v11

---

## Pre-Testing Setup

### 1. Database Migration Verification

**Objective:** Ensure database upgrades from v10 to v11 without data loss.

#### Test Steps:
```bash
# 1. Backup existing database (if on physical device)
# Location: Check app data directory

# 2. Clear app data (for clean migration test)
npm run android  # or npm run ios

# 3. Check logs for migration success
# Look for: "Database migration to version 11 complete"
```

#### Expected Results:
- ✅ App starts without errors
- ✅ No crash on database initialization
- ✅ Existing projects and items load correctly
- ✅ New fields default to appropriate values:
  - `is_baseline_locked` = false
  - `critical_path_flag` = null or false
  - `dependencies` = null or empty array

#### Verification Queries (Optional - Dev Tools):
```javascript
// In React Native Debugger or console
const items = await database.collections.get('items').query().fetch();
console.log('First item:', items[0]._raw);
// Should see: baseline_start_date, baseline_end_date, dependencies, etc.
```

---

## Phase 1: Database Foundation Tests

### Test 1.1: ItemModel Helper Methods

**Objective:** Verify helper methods calculate correctly.

#### Setup:
Create a test item with known values:
- Planned: Jan 1, 2025 - Jan 10, 2025 (10 days)
- Baseline: Jan 1, 2025 - Jan 10, 2025
- Actual: Jan 1, 2025 - Jan 12, 2025 (12 days)

#### Test Cases:

| Method | Expected Result | Pass/Fail |
|--------|----------------|-----------|
| `getPlannedDuration()` | 10 days | |
| `getActualDuration()` | 12 days | |
| `getScheduleVariance()` | +2 days (delayed) | |
| `getBaselineVariance()` | 0 days (no change from baseline) | |
| `getDependencies()` | Returns empty array if null | |
| `getProgressPercentage()` | (completedQuantity / plannedQuantity) * 100 | |

#### Test Code:
```javascript
// In BaselineScreen or a test component
const testItem = await database.collections.get('items').find('item-id');
console.log('Duration:', testItem.getPlannedDuration());
console.log('Variance:', testItem.getScheduleVariance());
```

---

### Test 1.2: ScheduleRevisionModel

**Objective:** Verify revision tracking works.

#### Test Steps:
1. Create a revision manually (through PlanningService)
2. Fetch the revision from database
3. Test helper methods

#### Expected Results:
- ✅ Revision created with correct version number (1, 2, 3...)
- ✅ Old/new dates stored correctly
- ✅ `getImpactedItems()` returns array
- ✅ `getDurationChange()` calculates correctly
- ✅ `getStartDateShift()` calculates correctly

---

## Phase 2: Planning Service Tests

### Test 2.1: Critical Path Calculation

**Objective:** Verify Kahn's algorithm identifies critical path correctly.

#### Setup Test Scenario:
Create a project with dependencies:

```
Project Structure:
- Foundation (5 days) → no dependencies
- Framing (10 days) → depends on Foundation
- Roofing (7 days) → depends on Framing
- Plumbing (3 days) → depends on Foundation
- Electrical (4 days) → depends on Framing

Critical Path should be: Foundation → Framing → Roofing (22 days total)
```

#### Test Steps:
1. Navigate to Baseline screen
2. Select the test project
3. Set up dependencies as described above
4. Click "Calculate Critical Path"

#### Expected Results:
- ✅ Alert shows: "Found 3 critical items. Total project duration: 22 days"
- ✅ Foundation, Framing, and Roofing cards have red borders
- ✅ Plumbing and Electrical do NOT have red borders
- ✅ Critical path info card displays
- ✅ Database updated: `critical_path_flag` = true for critical items

#### Verification:
```javascript
const items = await database.collections.get('items')
  .query(Q.on('sites', 'project_id', projectId))
  .fetch();

const criticalItems = items.filter(i => i.criticalPathFlag);
console.log('Critical items:', criticalItems.map(i => i.name));
// Expected: ['Foundation', 'Framing', 'Roofing']
```

---

### Test 2.2: Circular Dependency Detection

**Objective:** Ensure circular dependencies are prevented.

#### Test Steps:
1. Create Item A
2. Open dependencies for Item A, select Item B
3. Save
4. Open dependencies for Item B, select Item A
5. Try to save

#### Expected Results:
- ✅ Alert displays: "Invalid Dependencies: Circular dependency detected involving item: Item B"
- ✅ Dependencies NOT saved
- ✅ Can dismiss alert and fix

---

### Test 2.3: Progress Metrics Calculation

**Objective:** Verify metrics calculate accurately.

#### Setup Test Data:
Create project with 5 items:
- Item 1: Status = completed, on schedule
- Item 2: Status = in_progress, 2 days delayed
- Item 3: Status = in_progress, on schedule
- Item 4: Status = not_started
- Item 5: Status = in_progress, 3 days ahead

#### Test Code:
```javascript
import PlanningService from './services/planning/PlanningService';

const metrics = await PlanningService.calculateProgressMetrics(projectId);
console.log('Metrics:', metrics);
```

#### Expected Results:
```javascript
{
  overallProgress: 40-60% (depends on quantities),
  averageScheduleVariance: -0.25 days (average of 0, +2, 0, 0, -3),
  onTrackCount: 2,
  delayedCount: 1,
  aheadCount: 1,
  notStartedCount: 1
}
```

---

### Test 2.4: Forecast Generation

**Objective:** Verify forecasting works with historical data.

#### Prerequisites:
- Project with progress logs from last 30 days
- At least 10 progress logs

#### Test Steps:
```javascript
const forecast = await PlanningService.generateForecast(projectId);
console.log('Forecast:', forecast);
```

#### Expected Results:
- ✅ `estimatedCompletionDate` is future timestamp
- ✅ `confidenceLevel` is 'high', 'medium', or 'low'
- ✅ `daysRemaining` > 0
- ✅ `averageVelocity` > 0
- ✅ `assumptions` array has 4 items

---

### Test 2.5: Baseline Locking

**Objective:** Verify baseline lock functionality.

#### Test Steps:
1. Create project with 3 items with planned dates
2. Navigate to Baseline screen
3. Click "Lock Baseline"
4. Confirm in dialog

#### Expected Results:
- ✅ Alert shows: "Baseline locked successfully"
- ✅ Button changes to "Baseline Locked" (disabled)
- ✅ All item cards show lock icon
- ✅ Date pickers are disabled
- ✅ Orange warning card appears at top
- ✅ Database verification:
```javascript
const items = await database.collections.get('items')
  .query(Q.on('sites', 'project_id', projectId))
  .fetch();

items.forEach(item => {
  console.log(item.name, {
    locked: item.isBaselineLocked, // Should be true
    baselineStart: item.baselineStartDate, // Should equal plannedStartDate
    baselineEnd: item.baselineEndDate // Should equal plannedEndDate
  });
});
```

---

## Phase 3: Baseline Screen UI Tests

### Test 3.1: Project Selection

**Objective:** Verify project dropdown works correctly.

#### Test Steps:
1. Open Baseline screen
2. Initial state: No project selected
3. Tap "Choose Project" button
4. Select a project from dropdown

#### Expected Results:
- ✅ Initial: Shows "Select a Project" message
- ✅ Dropdown opens with all projects listed
- ✅ Selected project has checkmark
- ✅ Button updates to show project name
- ✅ Items load for selected project
- ✅ Can change to different project
- ✅ Items update when project changes

---

### Test 3.2: Item Planning Cards Display

**Objective:** Verify cards display all information correctly.

#### Test Scenario:
Create item with:
- Name: "Install Foundation"
- Planned: Jan 1-10, 2025
- Baseline: Jan 1-10, 2025 (locked)
- Status: in_progress
- Dependencies: 2 items
- Critical path: Yes

#### Expected Card Display:
- ✅ Title: "Install Foundation"
- ✅ Red border (critical path)
- ✅ "Critical Path" chip (red)
- ✅ "Locked" chip (orange)
- ✅ Duration: "10 days"
- ✅ Status: "in progress"
- ✅ Start date: "Jan 1, 2025"
- ✅ End date: "Jan 10, 2025"
- ✅ Baseline info bar (blue) with dates
- ✅ Variance: "0 days" or "+/- X days"
- ✅ Dependencies: "2"
- ✅ "Manage" button visible but disabled (if locked)

---

### Test 3.3: Date Picker Functionality

**Objective:** Verify date editing works (when not locked).

#### Test Steps:
1. Select project with unlocked baseline
2. Tap a start date
3. Select new date from picker
4. Tap an end date
5. Select new date from picker

#### Expected Results:
- ✅ Date picker opens on tap
- ✅ Current date is pre-selected
- ✅ Can select any date
- ✅ Date updates in card immediately
- ✅ Database updates (verify with reload)
- ✅ Duration recalculates automatically
- ✅ Date pickers disabled when baseline locked

---

### Test 3.4: Dependency Modal

**Objective:** Verify dependency management modal works.

#### Test Steps:
1. Select item without dependencies
2. Tap "Manage" button
3. Modal opens
4. Search for an item
5. Check 2-3 items
6. Tap "Save"

#### Expected Results:
- ✅ Modal opens with item name in header
- ✅ Shows all other items (excludes current item)
- ✅ Search filters items correctly
- ✅ Can check/uncheck items
- ✅ Count updates: "X dependencies selected"
- ✅ Save updates database
- ✅ Card shows updated count
- ✅ Cancel discards changes

---

### Test 3.5: Circular Dependency Prevention

**Objective:** Verify circular dependency validation in UI.

#### Test Steps:
1. Item A → depends on Item B
2. Try to make Item B → depend on Item A
3. Tap Save

#### Expected Results:
- ✅ Alert appears: "Invalid Dependencies"
- ✅ Error message: "Cannot save: Circular dependency detected involving item: Item B"
- ✅ Modal stays open
- ✅ Dependencies NOT saved
- ✅ Can deselect and try again

---

### Test 3.6: Critical Path Visual Indicators

**Objective:** Verify critical path items are visually distinct.

#### Test Steps:
1. Create project with dependency chain
2. Calculate critical path
3. Observe item cards

#### Expected Results:
- ✅ Critical items have 2px red border
- ✅ Non-critical items have normal borders
- ✅ Critical path chip appears on critical items
- ✅ Info card displays critical path count
- ✅ Visual distinction is clear and obvious

---

### Test 3.7: Baseline Lock Workflow

**Objective:** Test complete baseline locking flow.

#### Test Steps:
1. Project with 3 items, unlocked
2. Edit some dates
3. Manage dependencies
4. Calculate critical path
5. Lock baseline
6. Verify locked state
7. Try to edit dates (should be disabled)
8. Try to manage dependencies (should be disabled)

#### Expected Results at Each Step:
1. ✅ Button shows "Lock Baseline" (enabled)
2. ✅ Dates update successfully
3. ✅ Dependencies save successfully
4. ✅ Critical path calculates
5. ✅ Confirmation dialog appears
6. ✅ Success message after confirm
7. ✅ Button shows "Baseline Locked" (disabled)
8. ✅ All date pickers disabled (greyed out)
9. ✅ All "Manage" buttons disabled
10. ✅ Orange warning card appears
11. ✅ Baseline dates visible in blue info bars

---

## Performance Tests

### Test P.1: Large Dataset Performance

**Objective:** Verify performance with many items.

#### Test Setup:
Create project with 50+ items with dependencies.

#### Performance Targets:

| Operation | Target Time | Actual Time | Pass/Fail |
|-----------|-------------|-------------|-----------|
| Load items for project | < 1s | | |
| Calculate critical path | < 1s | | |
| Open dependency modal | < 500ms | | |
| Save dependencies | < 500ms | | |
| Lock baseline | < 2s | | |

#### Test Method:
```javascript
console.time('Load Items');
await loadItems();
console.timeEnd('Load Items');

console.time('Critical Path');
await PlanningService.calculateCriticalPath(projectId);
console.timeEnd('Critical Path');
```

---

### Test P.2: Offline Functionality

**Objective:** Verify all features work offline.

#### Test Steps:
1. Enable Airplane Mode
2. Perform all baseline operations
3. Disable Airplane Mode
4. Verify sync (if sync implemented)

#### Expected Results:
- ✅ All screens load
- ✅ Can select projects
- ✅ Can edit dates
- ✅ Can manage dependencies
- ✅ Can calculate critical path
- ✅ Can lock baseline
- ✅ Changes persist after app restart
- ✅ Sync status indicators show "pending" (if applicable)

---

## Edge Cases & Error Handling

### Test E.1: Empty States

#### Test Cases:
1. **No projects exist**
   - ✅ Shows "Select a Project" message
   - ✅ Dropdown is empty or shows helpful message

2. **Project has no items**
   - ✅ Shows "No Items Found" message
   - ✅ Helpful text: "Add items to this project to start planning"

3. **No dependencies available**
   - ✅ Dependency modal shows "No items available"

---

### Test E.2: Invalid Date Ranges

**Objective:** Verify date validation.

#### Test Steps:
1. Set end date before start date
2. Try to calculate critical path

#### Expected Behavior:
- Should handle gracefully (either prevent or show warning)
- No crashes or undefined behavior

---

### Test E.3: Network Interruption

**Objective:** Verify resilience to network issues.

#### Test Steps:
1. Start operation (e.g., lock baseline)
2. Turn off network mid-operation
3. Turn network back on

#### Expected Results:
- ✅ No data corruption
- ✅ Operation completes or fails gracefully
- ✅ Appropriate error message if fails
- ✅ Can retry operation

---

## Regression Tests

### Test R.1: Existing Features Still Work

**Objective:** Ensure new code doesn't break existing functionality.

#### Test Cases:
- ✅ Can still create/edit items
- ✅ Progress logging still works
- ✅ Daily reports still generate
- ✅ Hindrance reporting still works
- ✅ Site inspection still works
- ✅ Navigation between screens works
- ✅ Database queries still performant

---

## User Acceptance Tests

### Test U.1: Real-World Scenario

**Scenario:** Construction Manager planning a 3-month project.

#### User Story:
"As a construction manager, I want to plan my project schedule, identify critical tasks, and lock my baseline plan for future comparison."

#### Test Flow:
1. Create new project "Downtown Office Building"
2. Add 10 construction items (Foundation → Structure → MEP → Finishes)
3. Set planned dates for each item (3-month span)
4. Define dependencies (Foundation before Structure, etc.)
5. Calculate critical path
6. Review critical items
7. Adjust dates if needed
8. Lock baseline
9. Verify cannot edit after lock

#### Success Criteria:
- ✅ Entire workflow completes in < 10 minutes
- ✅ Critical path calculation is logical
- ✅ UI is intuitive (no confusion)
- ✅ Data persists correctly
- ✅ User feels confident in the tool

---

## Bug Reporting Template

When you find issues, report them using this format:

```markdown
### Bug Report

**Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Environment:**
- Device: [Android/iOS]
- OS Version: [e.g., Android 13]
- App Version: v1.4

**Error Messages:**
[Any console errors or alerts]

**Additional Context:**
[Any other relevant information]
```

---

## Test Results Summary Template

```markdown
## Test Execution Summary

**Date:** [Date]
**Tester:** [Name]
**Build:** v1.4 Phases 1-3
**Device:** [Device info]

### Results Overview
- Total Tests: X
- Passed: X (X%)
- Failed: X (X%)
- Blocked: X (X%)

### Critical Issues Found
1. [Issue 1]
2. [Issue 2]

### Recommendations
- [ ] Recommendation 1
- [ ] Recommendation 2

### Sign-off
- [ ] Ready for Phase 4 implementation
- [ ] Needs fixes before proceeding
```

---

## Next Steps After Testing

### If All Tests Pass:
✅ Proceed to Phase 4 (Gantt Chart)
✅ Consider this baseline stable
✅ Tag commit as `v1.4-phase3-complete`

### If Tests Fail:
1. Document all failures
2. Prioritize critical issues
3. Fix issues
4. Re-test
5. Iterate until stable

---

## Testing Checklist Summary

```markdown
### Phase 1: Database
- [ ] Migration successful
- [ ] No data loss
- [ ] Helper methods work
- [ ] Revision tracking works

### Phase 2: Services
- [ ] Critical path accurate
- [ ] Circular deps prevented
- [ ] Metrics calculate correctly
- [ ] Forecast generates
- [ ] Baseline locks properly

### Phase 3: UI
- [ ] Project selection works
- [ ] Items display correctly
- [ ] Date pickers functional
- [ ] Dependency modal works
- [ ] Circular dep validation in UI
- [ ] Critical path visuals work
- [ ] Baseline lock flow complete
- [ ] All buttons/actions work

### Performance
- [ ] Fast with 50+ items
- [ ] Works offline
- [ ] No lag or freezing

### Edge Cases
- [ ] Empty states handled
- [ ] Errors handled gracefully
- [ ] Network issues handled

### Regression
- [ ] Existing features work
- [ ] No new crashes
```

---

**Estimated Testing Time:** 4-6 hours for comprehensive testing

**Priority Tests (Quick validation):**
- Test 2.1 (Critical Path)
- Test 3.7 (Baseline Lock Workflow)
- Test R.1 (Regression)

Start with priority tests, then expand to full suite if time permits.
