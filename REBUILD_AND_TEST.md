# v2.9 - Rebuild and Test Instructions

**Status:** All Phase 4 code changes completed. Context initialization logic added.

---

## What Was Just Fixed

### 1. Project Display in Admin Screen
- ✅ Admin can now assign projects when creating/editing supervisors
- ✅ User cards show "📁 Project: Project Name" for supervisors
- ✅ Project selector dropdown available in create/edit modal

### 2. SiteContext Initialization on Login
- ✅ Added `useAuth()` hook to SiteContext
- ✅ Added `useEffect` to load supervisor's project from database when user logs in
- ✅ Automatically sets `projectId`, `projectName`, and `supervisorId` from database
- ✅ Persists to AsyncStorage for offline access
- ✅ Added console logging for debugging

**Key Code in SiteContext.tsx (lines 40-75):**
```typescript
useEffect(() => {
  const loadSupervisorProject = async () => {
    if (!user || !user.id) return;

    try {
      console.log('[SiteContext] Loading project for user:', user.id);

      const userRecord = await database.collections.get('users').find(user.id);

      if (userRecord) {
        const projectId = (userRecord as any).projectId;
        console.log('[SiteContext] User projectId:', projectId);

        if (projectId) {
          const project = await database.collections.get('projects').find(projectId);
          const projectName = (project as any).name;

          console.log('[SiteContext] Setting project:', projectName);

          await setProjectId(projectId);
          await setProjectName(projectName);
          await setSupervisorId(user.id);
        }
      }
    } catch (error) {
      console.error('[SiteContext] Error loading supervisor project:', error);
    }
  };

  loadSupervisorProject();
}, [user]);
```

---

## How to Rebuild and Test

### Step 1: Rebuild the App

```bash
# Kill any running Metro bundler
# Then rebuild
npx react-native run-android
```

### Step 2: Clear App Data (if needed)

If you experience caching issues:
1. Long-press app icon → App info → Storage → Clear data
2. Or uninstall and reinstall

### Step 3: Setup Test Data

**Login as Admin:**
- Username: `admin`
- Password: `admin123`

**Create Projects:**
1. Go to "Project Management" tab
2. Create **Project A**
3. Create **Project B**

**Create Supervisors:**

**Supervisor 1:**
- Username: `supervisor1`
- Password: `supervisor123`
- Full Name: Supervisor One
- Role: **Supervisor**
- **Assigned Project: Project A** ← Should now be visible!

**Supervisor 2:**
- Username: `supervisor2`
- Password: `supervisor123`
- Full Name: Supervisor Two
- Role: **Supervisor**
- **Assigned Project: Project B** ← Should now be visible!

**Verify in User Cards:**
- Each supervisor card should show: `📁 Project: Project A` or `📁 Project: Project B`

### Step 4: Create Sites for Each Project

**Still logged in as Admin:**

1. Go to "Site Management" tab
2. Create sites for Project A:
   - Site A1 (Location: Area A1, Project: **Project A**)
   - Site A2 (Location: Area A2, Project: **Project A**)
3. Create sites for Project B:
   - Site B1 (Location: Area B1, Project: **Project B**)
   - Site B2 (Location: Area B2, Project: **Project B**)

### Step 5: Test Supervisor 1 Login

**Logout from Admin, then Login:**
- Username: `supervisor1`
- Password: `supervisor123`

**Monitor LogCat for Console Logs:**
```bash
# In separate terminal
adb logcat | grep "\[SiteContext\]"
```

**Expected LogCat Output:**
```
[SiteContext] Loading project for user: <supervisor1-id>
[SiteContext] User projectId: <project-a-id>
[SiteContext] Setting project: Project A
```

**What to Verify:**

✅ **Site Management Tab:**
- Header shows: `📁 Your Assigned Project: Project A`
- Message: "All sites belong to this project"
- **ONLY Site A1 and Site A2 visible**
- Site B1 and B2 are **NOT visible**

✅ **Items Management Tab:**
- If you have items, only items from Site A1/A2 visible
- Items from Site B1/B2 **NOT visible**

✅ **Materials Tab:**
- Materials linked to Project A items only
- No crash/error

✅ **All Other Tabs:**
- Daily Reports, Hindrances, Inspections, Reports History
- All should show ONLY Project A data

### Step 6: Test Supervisor 2 Login (Critical Test!)

**Logout from Supervisor 1, then Login:**
- Username: `supervisor2`
- Password: `supervisor123`

**Expected LogCat Output:**
```
[SiteContext] Loading project for user: <supervisor2-id>
[SiteContext] User projectId: <project-b-id>
[SiteContext] Setting project: Project B
```

**What to Verify:**

✅ **Complete Isolation:**
- Header shows: `📁 Your Assigned Project: Project B`
- **ONLY Site B1 and B2 visible**
- Site A1 and A2 are **NOT visible**
- **ZERO overlap with Project A data**

---

## What to Report Back

### If Successful:
```
✅ SiteContext logs show correct project loading
✅ Supervisor 1 sees only Project A (sites A1, A2)
✅ Supervisor 2 sees only Project B (sites B1, B2)
✅ Complete data isolation confirmed
✅ No crashes or errors
```

**Next Step:** Proceed with full test plan in `v2.9_TESTING_RESULTS.md`

### If Issues:

**Report:**
1. What you see vs what you expected
2. LogCat output (especially `[SiteContext]` lines)
3. Screenshots if helpful
4. Which specific step failed

**Common Issues:**

**Issue 1: No console logs in LogCat**
- Possible cause: Metro bundler cached old code
- Fix: Stop Metro, clear cache, rebuild: `npx react-native start --reset-cache`

**Issue 2: Supervisor sees all projects instead of assigned project**
- Check LogCat for: `[SiteContext] No project assigned to user`
- Possible cause: projectId not saved in database
- Fix: Re-create supervisor with project assignment

**Issue 3: Project selector not visible in admin modal**
- Possible cause: Old build still running
- Fix: Completely stop app, rebuild, clear app data

**Issue 4: App crashes on Materials tab**
- Check LogCat for specific error
- Possible cause: Database query issue
- Report full error message

---

## Files Modified in This Fix

1. `src/supervisor/context/SiteContext.tsx` - Added initialization logic
2. `src/admin/RoleManagementScreen.tsx` - Added project assignment UI
3. `src/supervisor/MaterialTrackingScreen.tsx` - Fixed nested query issue
4. All supervisor screens - Added project filtering queries

---

## Next Steps After Testing

**If Phase 5 Testing Passes:**
- [ ] Complete full test plan in `v2.9_TESTING_RESULTS.md`
- [ ] Document any minor issues found
- [ ] Proceed to Phase 6: Final commit and documentation

**If Phase 5 Testing Fails:**
- [ ] Report issues with details
- [ ] Debug and fix issues
- [ ] Re-test until isolation confirmed

---

## Quick Verification Checklist

Before reporting success, verify these critical points:

- [ ] Admin can assign projects when creating supervisors
- [ ] Supervisor cards show project assignment
- [ ] LogCat shows `[SiteContext] Setting project: <name>`
- [ ] Supervisor 1 sees ONLY Project A sites
- [ ] Supervisor 2 sees ONLY Project B sites
- [ ] Materials tab loads without error
- [ ] No data leakage between projects
- [ ] Search/filters respect project isolation

---

**Ready to test!** Rebuild the app and follow the steps above.
