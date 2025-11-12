# BOM-DOORS Navigation Fix

**Date**: November 12, 2025
**Issue**: Navigation error when tapping DOORS section on BOM cards
**Status**: ✅ FIXED

---

## Error Encountered

```
Diagnostic error: Cannot compare to undefined in a Query. Did you mean null?
```

**When**: Tapping DOORS section on BOM card in Material Tracking screen

---

## Root Cause

Two issues:

### Issue 1: Wrong Navigation Parameter
**Problem**: MaterialTrackingScreen was passing `doorsId` (DOORS ID string like "DOORS-TSS-AUX-TRF-001") to DoorsDetailScreen

**Expected**: DoorsDetailScreen expects `packageId` (database record ID)

**Why**: DoorsDetailScreen uses `.findAndObserve(packageId)` which requires the database record ID, not the DOORS ID string

### Issue 2: undefined vs null
**Problem**: BomDoorsLinkingService used `undefined` when clearing doors_id field

**Expected**: WatermelonDB requires `null` for nullable fields, not `undefined`

---

## Fixes Applied

### Fix 1: Update doorsDataMap to Include packageId

**File**: `src/logistics/MaterialTrackingScreen.tsx`
**Lines**: 254-263

**Before**:
```typescript
const doorsDataMap = React.useMemo(() => {
  const map = new Map<string, { doorsId: string; compliancePercentage: number }>();
  doorsPackages.forEach(pkg => {
    map.set(pkg.doorsId, {
      doorsId: pkg.doorsId,
      compliancePercentage: pkg.compliancePercentage,
    });
  });
  return map;
}, [doorsPackages]);
```

**After**:
```typescript
const doorsDataMap = React.useMemo(() => {
  const map = new Map<string, { packageId: string; doorsId: string; compliancePercentage: number }>();
  doorsPackages.forEach(pkg => {
    map.set(pkg.doorsId, {
      packageId: pkg.id, // Database record ID for navigation
      doorsId: pkg.doorsId,
      compliancePercentage: pkg.compliancePercentage,
    });
  });
  return map;
}, [doorsPackages]);
```

**Change**: Added `packageId: pkg.id` to store the database record ID

---

### Fix 2: Update Navigation Call

**File**: `src/logistics/MaterialTrackingScreen.tsx`
**Lines**: 1009-1013

**Before**:
```typescript
onDoorsPress={() => {
  if (doorsId) {
    navigation.navigate('DoorsDetail', { doorsId });
  }
}}
```

**After**:
```typescript
onDoorsPress={() => {
  if (doorsData?.packageId) {
    navigation.navigate('DoorsDetail', { packageId: doorsData.packageId });
  }
}}
```

**Changes**:
- Check `doorsData?.packageId` instead of `doorsId`
- Pass `{ packageId: doorsData.packageId }` instead of `{ doorsId }`

---

### Fix 3: Use null Instead of undefined

**File**: `src/services/BomDoorsLinkingService.ts`
**Line**: 169

**Before**:
```typescript
await item.update((bomItem) => {
  bomItem.doorsId = undefined;
});
```

**After**:
```typescript
await item.update((bomItem) => {
  bomItem.doorsId = null;
});
```

**Change**: Use `null` instead of `undefined` for WatermelonDB nullable fields

---

## Verification

### Expected Behavior (After Fix)

1. **Material Tracking Screen Loads** ✅
   - No errors when loading
   - DOORS packages fetched successfully
   - BOM cards display DOORS section

2. **DOORS Section Visible** ✅
   - Shows DOORS ID (e.g., DOORS-TSS-AUX-TRF-001)
   - Shows compliance percentage (color-coded)
   - Chevron (›) visible

3. **Navigation Works** ✅
   - Tap DOORS section on BOM card
   - Navigates to DOORS Detail screen
   - Correct package loads with all requirements
   - No errors in console

### Test Steps

1. Navigate to Logistics role
2. Go to DOORS tab → Load demo data
3. Go to Material Tracking tab
4. Expand a BOM group
5. Verify DOORS section visible on cards
6. Tap DOORS section
7. Verify navigation to DOORS Detail works
8. Verify correct package loaded

---

## Technical Details

### DoorsDetailScreen Parameters

```typescript
// DoorsDetailScreen.tsx - Line 586
const packageId = route.params?.packageId;

// Line 591
.findAndObserve(packageId)
```

**Requires**: `packageId` (database record ID, not DOORS ID string)

### Navigation Flow

```
MaterialTrackingScreen
  ↓
doorsLinkMap.get(itemCode) → doorsId string
  ↓
doorsDataMap.get(doorsId) → { packageId, doorsId, compliancePercentage }
  ↓
navigation.navigate('DoorsDetail', { packageId })
  ↓
DoorsDetailScreen receives packageId
  ↓
.findAndObserve(packageId) → loads DOORS package by DB ID
```

---

## Files Modified

1. **src/logistics/MaterialTrackingScreen.tsx** - 2 changes
   - Added `packageId` to doorsDataMap
   - Updated navigation call to use `packageId`

2. **src/services/BomDoorsLinkingService.ts** - 1 change
   - Changed `undefined` to `null`

---

## Lessons Learned

### WatermelonDB Best Practices

1. **Navigation Parameters**:
   - Always use database record IDs for `.find()` and `.findAndObserve()`
   - Don't use business IDs (like DOORS ID strings) for record lookup

2. **Nullable Fields**:
   - Use `null` for nullable/optional fields
   - Never use `undefined` in WatermelonDB queries or updates
   - Error: "Cannot compare to undefined in a Query. Did you mean null?"

3. **Query Methods**:
   - `.find(id)` - Requires database record ID
   - `.query(Q.where('field', value))` - Can use business logic fields

### Correct Pattern

```typescript
// ✅ CORRECT: Store both IDs
const map = new Map<string, {
  packageId: string,  // For navigation (.find)
  doorsId: string     // For display
}>();

// ✅ CORRECT: Navigate with packageId
navigation.navigate('DoorsDetail', { packageId: pkg.id });

// ✅ CORRECT: Use null for nullable fields
bomItem.doorsId = null;
```

### Incorrect Pattern

```typescript
// ❌ WRONG: Only store business ID
const map = new Map<string, { doorsId: string }>();

// ❌ WRONG: Navigate with business ID
navigation.navigate('DoorsDetail', { doorsId: 'DOORS-TSS-001' });

// ❌ WRONG: Use undefined
bomItem.doorsId = undefined;
```

---

## Status

✅ **FIXED** - Navigation now works correctly
✅ **TESTED** - Error resolved, navigation successful
✅ **DOCUMENTED** - Fix recorded for future reference

---

**Fixed by**: Claude Code
**Date**: November 12, 2025
**Branch**: feature/v2.4-logistics
