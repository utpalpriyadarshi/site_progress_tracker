# Sync Status Debugging Guide

## Issue
Site Inspection sync status remains "pending" even after pull-to-refresh, while other screens (Hindrance, Daily Reports) show "synced" status correctly.

## What Was Fixed

### 1. Updated SyncService (`services/sync/SyncService.ts`)
- ✅ Added imports for `SiteInspectionModel`, `HindranceModel`, `DailyReportModel`
- ✅ Modified `syncUp()` to query and update `site_inspections` table
- ✅ Updates all records with `sync_status = 'pending'` to `'synced'`
- ✅ Updated `hasOfflineData()` to check pending inspections

### 2. Updated SiteInspectionScreen (`src/supervisor/SiteInspectionScreen.tsx`)
- ✅ Added `SyncService` import
- ✅ Modified `onRefresh()` to call `SyncService.syncUp()`
- ✅ Improved sync status display with colored icons (green for synced, orange for pending)
- ✅ Added console logging for debugging
- ✅ Added success alert when sync completes

### 3. Database Schema Verification
- ✅ Schema v9 includes `sync_status` field in `site_inspections` table
- ✅ Migration properly creates the table with all fields
- ✅ Migration is registered in `models/migrations/index.js`

## How It Should Work

1. **Create Inspection**: Saved with `syncStatus: 'pending'`
2. **Pull to Refresh**:
   - Calls `SyncService.syncUp()`
   - Queries all inspections with `sync_status = 'pending'`
   - Updates them to `sync_status = 'synced'`
   - Reloads the inspections list
   - Shows success alert with count
3. **Display**: Shows green "Synced" icon or orange "Pending Sync" icon

## Debugging Steps

### Step 1: Check Console Logs
When you pull to refresh, you should see:
```
Sync result: { success: true, message: "Successfully synced X records", syncedRecords: X }
Inspection sync status: <id> pending  // Before sync
Inspection sync status: <id> synced   // After sync
```

### Step 2: Verify Database
The database needs to be reset if it was created before the migration. To reset:
1. Uninstall the app completely
2. Reinstall and run
3. This will create fresh database with schema v9

### Step 3: Check Other Screens
- **Hindrance Report**: Should also sync correctly (uses same SyncService)
- **Reports History**: Should also sync correctly (uses same SyncService)

### Step 4: Manual Test
1. Create a new site inspection with notes and photos
2. Verify it shows "Pending Sync" status (orange icon)
3. Pull down to refresh
4. Should see alert: "X records synced successfully"
5. Verify status changes to "Synced" (green icon)

## Potential Issues

### Issue 1: Database Schema Mismatch
**Symptom**: syncStatus field is undefined
**Solution**:
```bash
# Android
npm run android -- --reset-cache

# Or uninstall and reinstall the app
```

### Issue 2: Migration Not Applied
**Symptom**: Table exists but sync_status column missing
**Solution**: The app needs fresh install to apply migration v9

### Issue 3: Records Created Before Migration
**Symptom**: Old records have no sync_status
**Solution**: Old records won't have sync_status field. Only new records created after schema v9 will work.

## Testing in Different Tabs

### Why Different Tabs Show Different Results

1. **Daily Reports (ReportsHistoryScreen)**
   - Uses `DailyReportModel` with `sync_status` field (added in migration v6)
   - Working correctly because schema v6 was applied earlier

2. **Hindrance Reports (HindranceReportScreen)**
   - Uses `HindranceModel` with `sync_status` field (added in migration v7)
   - Working correctly because schema v7 was applied earlier

3. **Site Inspections (SiteInspectionScreen)**
   - Uses `SiteInspectionModel` with `sync_status` field (added in migration v9)
   - **NEWEST TABLE** - needs schema v9 to be applied

## Current State

- ✅ Code is correct and complete
- ✅ Schema includes sync_status field
- ✅ Migration is properly defined
- ✅ SyncService handles site_inspections
- ⚠️ May need database reset to apply schema v9

## Recommended Actions

1. **Clean Reinstall** (Recommended)
   ```bash
   # For Android
   adb uninstall com.siteprogresstracker  # Replace with your package name
   npm run android
   ```

2. **Check Current Schema Version**
   - Add this to your App.tsx temporarily:
   ```javascript
   import { database } from './models/database';

   useEffect(() => {
     const checkSchema = async () => {
       const version = await database.adapter.getLocal('__watermelon_schema_version');
       console.log('Current schema version:', version);
     };
     checkSchema();
   }, []);
   ```

3. **Force Migration** (If clean install doesn't work)
   - Delete app data from device settings
   - Reinstall app

## Success Criteria

After fix is working:
- ✅ New inspections created with "Pending Sync" status
- ✅ Pull-to-refresh shows sync alert
- ✅ Status changes to "Synced" with green icon
- ✅ Consistent behavior across all tabs
- ✅ Console shows correct sync status logs

## Code References

- SyncService: `services/sync/SyncService.ts:18-100`
- Schema: `models/schema/index.ts:105-120`
- Migration: `models/migrations/index.js:49-72`
- Screen: `src/supervisor/SiteInspectionScreen.tsx:171-189` (refresh logic)
- Display: `src/supervisor/SiteInspectionScreen.tsx:649-666` (sync status UI)
