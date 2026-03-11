# Phase 1 Testing Instructions

## Completed Tests

### ✅ Test 1: Migration Applied Successfully - PASSED
- App launches without errors
- Schema version 30 applied

### ✅ Test 2: Default Milestones Auto-Creation - PASSED
- 7 default milestones created when project is created
- Console log confirms: `[ProjectManagement] Created 7 default milestones for project <id>`

### ⚠️ Test 3: ManagerContext Project Loading - PARTIAL PASS
- ✅ Manager user can be assigned to project
- ✅ Project assignment shown in RoleManagementScreen card (after fix)
- ⚠️ Project name not appearing in header/context (Note: Manager dashboard is placeholder, will be implemented in Phase 2)

## Remaining Tests (4, 5, 6)

To complete the remaining tests, you have two options:

### Option 1: Use the Test Utility Component (Recommended)

I've created a test utility component at `src/utils/Phase1TestUtility.tsx` that can run all remaining tests automatically.

**How to use it:**

1. Temporarily add the test utility to your navigation. For example, in your admin navigator or main app:

```typescript
import { Phase1TestUtility } from './src/utils/Phase1TestUtility';

// Add to your navigation:
<Stack.Screen
  name="Phase1Test"
  component={Phase1TestUtility}
  options={{ title: 'Phase 1 Tests' }}
/>
```

2. Navigate to the test screen
3. Click "Run All Tests" button
4. Review the results in the output area

The utility will automatically run:
- **Test 4:** Database Schema Verification
- **Test 5:** Milestone Data Integrity
- **Test 6:** Model Association Check

### Option 2: Run Tests Manually via Console

If you prefer console testing, you can run these commands in your React Native debugger console:

#### Test 4: Database Schema Verification
```javascript
// Check collections exist and can be queried
Promise.all([
  database.collections.get('milestones').query().fetch(),
  database.collections.get('milestone_progress').query().fetch(),
  database.collections.get('purchase_orders').query().fetch()
]).then(([milestones, progress, pos]) => {
  console.log('✓ Milestones:', milestones.length);
  console.log('✓ Milestone Progress:', progress.length);
  console.log('✓ Purchase Orders:', pos.length);
  console.log('✅ Test 4: PASSED');
});
```

#### Test 5: Milestone Data Integrity
```javascript
database.collections.get('milestones')
  .query()
  .fetch()
  .then(milestones => {
    milestones.forEach(m => {
      console.log(`${m.milestoneCode}: ${m.milestoneName} - ${m.weightage}% (order: ${m.sequenceOrder}, custom: ${m.isCustom})`);
    });
    const totalWeight = milestones.reduce((sum, m) => sum + m.weightage, 0);
    console.log(`Total weightage: ${totalWeight}%`);
    if (totalWeight === 100) {
      console.log('✅ Test 5: PASSED');
    }
  });
```

#### Test 6: Model Association Check
```javascript
database.collections.get('milestones')
  .query()
  .fetch()
  .then(async milestones => {
    if (milestones.length > 0) {
      const milestone = milestones[0];
      const project = await database.collections.get('projects').find(milestone.projectId);
      console.log('✓ Milestone:', milestone.milestoneName);
      console.log('✓ Project:', project.name);
      console.log('✅ Test 6: PASSED - Associations work');
    }
  });
```

## Test Results Summary

Once you complete tests 4-6, update the checklist:

- [ ] Test 4: Database Schema Verification
- [ ] Test 5: Milestone Data Integrity
- [ ] Test 6: Model Association Check

## Notes on Test 3 (ManagerContext)

The observation "Project name not appearing in header/context" is expected at this stage because:
1. Manager dashboard screens are placeholder/sample screens
2. Actual dashboard implementation is part of Phase 2-5
3. The ManagerContext IS working correctly (loads project on login)
4. Project assignment IS shown in RoleManagementScreen (after the fix)

This will be fully tested when we implement the Manager Dashboard in Phase 2.

## Next Steps

After all tests pass:
1. Update PHASE_1_TESTING_CHECKLIST.md with final results
2. Commit Phase 1 changes
3. Proceed to Phase 2: Manager Dashboard Implementation
