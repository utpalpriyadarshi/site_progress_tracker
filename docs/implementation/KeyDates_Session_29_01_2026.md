# Key Dates Session Summary - 29 January 2026

## Issues Reported

1. **Form not scrollable** - Key Date create form bottom portion not accessible
2. **Header text too long** - "Key Date Management" causing Logout button to wrap to two lines
3. **Snackbar hidden** - Error messages appearing behind the form dialog
4. **`createdAt` readonly error** - WatermelonDB error when saving Key Date and adding sites
5. **Progress not reflecting** - Site progress updates in Timeline/List tabs not reflecting in Key Dates tab

---

## Completed Fixes

### 1. Form Scrollability
**File:** `src/planning/key-dates/KeyDateManagementScreen.tsx`

- Added `ScrollView` import from `react-native`
- Changed `Dialog.ScrollArea` to `Dialog.Content` with explicit `ScrollView`
- Added styles: `dialogContent` (maxHeight: 450) and `dialogScrollView` (flexGrow: 1)

### 2. Header Text
**File:** `src/nav/PlanningNavigator.tsx` (line 298)

- Changed `headerTitle: 'Key Date Management'` to `headerTitle: 'KD Management'`

### 3. Snackbar Visibility
**File:** `src/planning/key-dates/KeyDateManagementScreen.tsx`

- Wrapped `Snackbar` component in its own `<Portal>` to render above dialogs

### 4. `createdAt` Readonly Errors
**Files:**
- `src/planning/key-dates/KeyDateManagementScreen.tsx` (line 238)
- `src/planning/key-dates/components/KeyDateSiteManager.tsx` (line 214)

**Cause:** `KeyDateModel` and `KeyDateSiteModel` have `@readonly @field('created_at')` decorator. WatermelonDB automatically sets this field on record creation.

**Fix:** Removed manual `record.createdAt = Date.now();` assignments.

### 5. Progress Aggregation Architecture
**Files:**
- `src/planning/key-dates/components/KeyDateCard.tsx`
- `src/planning/key-dates/components/KeyDateSiteManager.tsx`

**KeyDateCard.tsx changes:**
```typescript
// Added imports
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';

// Added progress calculation function
const calculateAggregatedProgress = (sites: KeyDateSiteModel[]): number => {
  if (!sites || sites.length === 0) return 0;
  return sites.reduce((total, site) => total + site.getWeightedProgress(), 0);
};

// Added withObservables to fetch associated sites
const enhance = withObservables(['keyDate'], ({ keyDate }) => ({
  keyDate,
  keyDateSites: database.collections
    .get<KeyDateSiteModel>('key_date_sites')
    .query(Q.where('key_date_id', keyDate.id))
    .observe(),
}));

export const KeyDateCard = enhance(KeyDateCardInner);
```

**KeyDateSiteManager.tsx changes:**
- Added `handleUpdateProgress` function to update site progress
- Made progress chip editable (tap to edit)
- Auto-updates status based on progress (0% = not_started, 1-99% = in_progress, 100% = completed)

---

## Remaining Issues

### 1. Key Date Progress Not Reflecting
The aggregated progress from associated sites may not be displaying correctly in Key Dates tab.

**To Verify:**
- Is `withObservables` fetching sites correctly?
- Is `calculateAggregatedProgress()` being called?
- Check Metro logs for runtime errors

### 2. Architecture Gap - Schedule Item to KeyDateSite Link
Currently there's no automatic connection between:
- Schedule item progress (updates shown in Timeline/List tabs)
- KeyDateSite progress (must be manually updated in Manage Sites dialog)

**Current Flow:**
```
Schedule Items → Timeline/List tabs (working)
KeyDateSites → Key Dates tab progress (manual update required)
```

**Potential Solution:**
Link schedule items to KeyDateSites so that when a schedule item's progress updates, it automatically updates the corresponding KeyDateSite progress.

---

## Progress Calculation Formula

```
KeyDate Progress = Σ (Site Contribution% × Site Progress%)

Example:
- Site A: 40% contribution, 50% progress → 20% weighted
- Site B: 30% contribution, 100% progress → 30% weighted
- Site C: 30% contribution, 0% progress → 0% weighted
- Total Key Date Progress = 50%
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/planning/key-dates/KeyDateManagementScreen.tsx` | ScrollView, Snackbar Portal, removed createdAt |
| `src/nav/PlanningNavigator.tsx` | Header text shortened |
| `src/planning/key-dates/components/KeyDateCard.tsx` | withObservables for progress calculation |
| `src/planning/key-dates/components/KeyDateSiteManager.tsx` | Editable progress, removed createdAt |

---

## Next Steps

1. Debug why Key Date progress is not updating in UI
2. Consider linking schedule items to KeyDateSites for automatic progress sync
3. Test the complete flow end-to-end
4. When we are in Schedule tab and Key date tab, progress is 100% not correct, refer Schedule1.jpeg, when we KD3 card status is progress 0% and badge says completed, refer Schedule2.jpeg, Both screenshots are kept in prompts folder. Also it is observed that when we click KD3 card it opens with addition of sites update progress and edit. Badge on right site of KD3 is not clearly visible, need to review properly, also review Topmost card, status should change, it is fixed at the moment, in progress is showing 0, total sites are 4 but showing 3 only.


**Status Badge Pattern (CRITICAL - Use for ALL Roles):**
```typescript
// ✅ CORRECT - Supervisor-style badge (used in ItemCard, HindranceCard)
// Use react-native-paper Chip component with mode="flat"
import { Chip } from 'react-native-paper';

<Chip
  mode="flat"
  style={{
    backgroundColor: getStatusColor(status),
  }}
  textStyle={styles.statusChipText}>
  {status.toUpperCase()}
</Chip>

// Styles - MUST match exactly
statusChipText: {
  color: 'white',        // Always 'white' (not '#FFF' or '#FFFFFF')
  fontSize: 12,          // Consistent font size across all roles
  fontWeight: 'bold',    // Always bold for visibility
}

// ❌ INCORRECT - Custom badges cause visibility issues
// DO NOT use custom View+Text badges
// DO NOT use inline styles for textStyle
// DO NOT use different font sizes or colors across roles
// DO NOT use Chip props like height, paddingHorizontal (let Paper handle it)
```

**Why This Pattern is Mandatory:**
- Text is clearly visible with proper contrast on all colored backgrounds
- Consistent appearance across ALL user roles (Supervisor, Manager, Design Engineer, etc.)
- React Native Paper handles padding, sizing, and layout automatically
- Proven to work in supervisor screens without visibility issues
- No text clipping, no hard-to-read badges
- User-tested and approved in production

**Badge Implementation Checklist:**
- ✅ Import Chip from 'react-native-paper'
- ✅ Use `mode="flat"` (required)
- ✅ Set backgroundColor via inline style object
- ✅ Use statusChipText with exact styling above
- ✅ Always use `color: 'white'` (literal string)
- ✅ Always use `fontSize: 12` and `fontWeight: 'bold'`
- ✅ Apply to ALL card components across ALL roles

**Currently Applied To:**
- ✅ Supervisor: ItemCard, HindranceCard, InspectionCard
- ✅ Design Engineer: DoorsPackageCard, DesignRfqCard (Phase 3)


### Action to be taken
#### For all improvement please create branch then implement succesfully, check for quality and errors, commit, create PR, Push to remote and merge.
