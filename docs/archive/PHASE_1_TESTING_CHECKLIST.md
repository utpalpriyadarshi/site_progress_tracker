# Phase 1 Testing Checklist - v2.10 Manager Role

## Overview
This checklist helps verify that Phase 1 (Database & Context Setup) is working correctly.

---

## Test 1: Migration Applied Successfully ✓

**What to check:**
- App launches without database errors
- No migration errors in console logs

**How to verify:**
1. Launch the app
2. Check console logs for migration messages
3. Look for: `Database migration to version 30` or similar
4. Ensure no errors related to "milestones", "milestone_progress", or "purchase_orders" tables

**Expected Result:**
- App launches successfully
- Console shows schema version 30
- No table-related errors

**Status:** [ok ] Pass [ ] Fail [ ] Notes: _______________

---

## Test 2: Default Milestones Auto-Creation ✓

**What to check:**
- When creating a new project, 7 default milestones are automatically created

**How to verify:**
1. Log in as Admin user
2. Navigate to Project Management screen
3. Create a new test project:
   - Name: "Test Project v2.10"
   - Client: "Test Client"
   - Budget: "1000000"
   - Status: "active"
4. Check console logs for: `[ProjectManagement] Created 7 default milestones for project...`
5. Note the project ID from the logs

**Expected Console Output:**
```
[ProjectManagement] Created 7 default milestones for project <project-id>
```

**Expected Milestones Created:**
- PM100: Requirements Management (DOORS) - 10% weightage
- PM200: Engineering & Design - 15% weightage
- PM300: Procurement - 15% weightage
- PM400: Manufacturing - 10% weightage
- PM500: Testing & Pre-commissioning - 15% weightage
- PM600: Commissioning - 20% weightage
- PM700: Handover - 15% weightage

**Status:** [ok ] Pass [ ] Fail [ ] Notes: _______________
Observation: I couldnot locate Milestones in log
---

## Test 3: ManagerContext Project Loading ✓

**What to check:**
- When a Manager logs in, ManagerContext automatically loads their assigned project

**Prerequisites:**
1. Create or use an existing Manager user
2. Assign the manager to a project (set `project_id` in users table)

**How to verify:**
1. Log in as a Manager user (who has `project_id` assigned)
2. Check console logs for:
   ```
   [ManagerContext] Loading project for user: <user-id>
   [ManagerContext] User projectId: <project-id>
   [ManagerContext] Setting project: <project-name>
   ```
3. Navigate to any Manager screen
4. Verify the project name appears in the header/context

**Expected Result:**
- Console shows ManagerContext loading the project
- Project is automatically set in context
- Manager sees their assigned project in the UI

**Alternative (if no project assigned):**
```
[ManagerContext] Loading project for user: <user-id>
[ManagerContext] No project assigned to user
```

**Status:** [Ok ] Pass [ ] Fail [ ] Notes: _______________
Observation:-Project name is not appearing in the header/context
---

## Test 4: Database Schema Verification ✓

**What to check:**
- New tables exist in the database
- Items table has `milestone_id` column

**How to verify:**
1. Use a database inspector or query the database directly
2. Check for these tables:
   - `milestones`
   - `milestone_progress`
   - `purchase_orders`
3. Check `items` table has `milestone_id` column

**Alternative (using console in app):**
Open a debugging console and run:
```javascript
database.collections.get('milestones').query().fetch().then(m => console.log('Milestones:', m.length));
database.collections.get('milestone_progress').query().fetch().then(m => console.log('Milestone Progress:', m.length));
database.collections.get('purchase_orders').query().fetch().then(m => console.log('Purchase Orders:', m.length));
```

**Expected Result:**
- All 3 collections exist and can be queried
- No errors when querying

**Status:** [ ] Pass [ ] Fail [ ] Notes: _______________
Observation: Test not performed
---

## Test 5: Milestone Data Integrity ✓

**What to check:**
- Milestones created with correct data structure
- Weightages add up to 100%

**How to verify:**
1. After creating a test project (Test 2)
2. Use database inspector or debugging console to query milestones:
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
  });
```

**Expected Output:**
```
PM100: Requirements Management (DOORS) - 10% (order: 1, custom: false)
PM200: Engineering & Design - 15% (order: 2, custom: false)
PM300: Procurement - 15% (order: 3, custom: false)
PM400: Manufacturing - 10% (order: 4, custom: false)
PM500: Testing & Pre-commissioning - 15% (order: 5, custom: false)
PM600: Commissioning - 20% (order: 6, custom: false)
PM700: Handover - 15% (order: 7, custom: false)
Total weightage: 100%
```

**Status:** [ ] Pass [ ] Fail [ ] Notes: _______________
Observation:- Test not performed
---

## Test 6: Models Association Check ✓

**What to check:**
- Models can query associations correctly
- No errors when accessing related records

**How to verify:**
1. Query a milestone and try to access its project:
```javascript
database.collections.get('milestones')
  .query()
  .fetch()
  .then(milestones => {
    if (milestones.length > 0) {
      const milestone = milestones[0];
      return database.collections.get('projects').find(milestone.projectId);
    }
  })
  .then(project => console.log('Project:', project?.name));
```

**Expected Result:**
- Can successfully fetch related project
- No association errors

**Status:** [ ] Pass [ ] Fail [ ] Notes: _______________
Observation:- Test not performed
---

## Common Issues & Troubleshooting

### Issue: Migration didn't run
**Solution:**
- Clear app data and reinstall
- Check `models/migrations/index.js` has v30 registered

### Issue: Milestones not created
**Solution:**
- Check console for errors in `createDefaultMilestones`
- Verify user is logged in when creating project (user.userId must exist)
- Check `ProjectManagementScreen` has `useAuth` imported

### Issue: ManagerContext not loading project
**Solution:**
- Verify the manager user has `project_id` set in database
- Check console logs for ManagerContext messages
- Ensure user is logged in

---

## Summary

**Phase 1 is complete when:**
- [ ] All tests above pass
- [ ] No console errors related to milestones/migration
- [ ] New projects automatically get 7 default milestones
- [ ] ManagerContext loads project for managers on login

**If all tests pass, proceed to:**
- Commit Phase 1 changes
- Move to Phase 2: Dashboard Section 1

---

## Notes
_Add any observations or issues found during testing:_
