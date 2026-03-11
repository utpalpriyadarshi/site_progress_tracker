# TypeScript Error Fix Plan

This document tracks all 293 pre-existing TypeScript errors in the `site_progress_tracker` codebase as of **2026-02-21**. Errors span `src/`, `services/` (root-level), `scripts/`, `models/`, and one root-level script. The goal is to reach **0 errors in `src/`** (the quality gate), while also cleaning up root-level service and script errors where practical. Errors in `__tests__/` are excluded from the gate.

The 10 steps below are ordered from fastest/cheapest to fix first, maximizing momentum and reviewer confidence.

---

## Overview Table

| Step | Category | Files Affected | Error Count | Estimated Effort |
|------|----------|---------------|-------------|-----------------|
| 1 | Delete stale backup files | 4 backup `.tsx` files | 7 | 2 min |
| 2 | Fix barrel / index export duplicates | 2 index barrel files | 9 | 15 min |
| 3 | Fix `@types/node` + `NodeJS.Timeout` | 6 files (`services/` + `src/hooks/`) | 13 | 30 min |
| 4 | Fix Promise callback arity (`.then(() => void)`) | 5 files | 7 | 20 min |
| 5 | Remove `IntersectionObserver` web hook | 1 file (`usePerformance.ts`) | 5 | 15 min |
| 6 | Fix unresolved module imports | 3 files | 3 | 20 min |
| 7 | Fix react-native-paper API mismatches | 7 files | 16 | 45 min |
| 8 | Fix `LoggingService` catch block errors — `unknown → Error` cast | 37 files in `src/` | 95 | 1 h |
| 9 | Fix `LoggingService` primitive `context` args | 19 files in `src/` | 22 | 30 min |
| 10 | Fix WatermelonDB model missing fields | 7 files | 40 | 2 h |

**Total: 217 errors across 10 categories** (remaining 76 are in `scripts/`, root `services/`, `models/`, and `update_admin_email.ts` — low priority, outside the `src/` gate)

---

## Step 1 — Delete Stale Backup Files

**Branch:** `feat/ts-fix-step1-delete-backups`
**Error count:** 7
**Error codes:** TS2769, TS2322, TS2339, TS2551, TS7006
**Status:** [ ] Not started

### Root Cause

Four files named `*_Phase3_backup.tsx` and `*_placeholder_backup.tsx` are old snapshot copies kept alongside their active replacements. They reference properties that no longer exist on current models (`currentStock`, `unitCost`, `allocatedBoms`) and use deprecated component APIs. Because they are compiled by TypeScript they produce real errors even though they are never imported.

### Files to Change

| File | Action | Note |
|------|--------|------|
| `C:\Projects\site_progress_tracker\src\logistics\DeliverySchedulingScreen_Phase3_backup.tsx` | Delete | TS2769 — `No overload matches` at line 317 |
| `C:\Projects\site_progress_tracker\src\logistics\InventoryManagementScreen_Phase3_backup.tsx` | Delete | TS2339 `currentStock`, `unitCost`; TS2551 `allocatedBoms`; TS7006 implicit any — lines 96,135,333,379,409–415 |
| `C:\Projects\site_progress_tracker\src\logistics\MaterialTrackingScreen_Phase3_backup.tsx` | Delete | TS2322 `string \| undefined` not assignable to `string` — line 287 |
| `C:\Projects\site_progress_tracker\src\logistics\EquipmentManagementScreen_placeholder_backup.tsx` | Delete | No errors listed in gate but prevents future accumulation |

### Fix Pattern

```bash
# Before: files exist and are compiled
ls src/logistics/*backup*
# DeliverySchedulingScreen_Phase3_backup.tsx
# InventoryManagementScreen_Phase3_backup.tsx
# MaterialTrackingScreen_Phase3_backup.tsx
# EquipmentManagementScreen_placeholder_backup.tsx

# After: files are removed
git rm src/logistics/DeliverySchedulingScreen_Phase3_backup.tsx
git rm src/logistics/InventoryManagementScreen_Phase3_backup.tsx
git rm src/logistics/MaterialTrackingScreen_Phase3_backup.tsx
git rm src/logistics/EquipmentManagementScreen_placeholder_backup.tsx
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "_backup" | wc -l
# Expected: 0  (was 7)
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 7
```

---

## Step 2 — Fix Barrel / Index Export Duplicates

**Branch:** `feat/ts-fix-step2-barrel-exports`
**Error count:** 9
**Error codes:** TS2300, TS2305, TS2614
**Status:** [ ] Not started

### Root Cause

Two barrel `index.ts` files re-export the same identifiers twice. In `src/design_engineer/shared/index.ts` three skeleton prop types are exported once from `'./types'` (line 20–22) and again from `'./skeletons'` (line 26), but those types do not exist in `./types` at all — they live only in `./skeletons`. This causes both a "duplicate identifier" (TS2300) and a "no exported member" (TS2305) error per identifier. In `src/hooks/index.ts` two types are re-exported with `export type { ... }` but the underlying module exports them as `default` exports (TS2614), and `IntersectionObserverOptions` does not exist at all in `usePerformance.ts` (TS2724) — that is fixed in Step 5 by removing the web hook.

### Files to Change

| File | Action | Note |
|------|--------|------|
| `C:\Projects\site_progress_tracker\src\design_engineer\shared\index.ts` | Edit — remove duplicate `export type` block from `'./types'` at lines 20–22 | Types only exist in `./skeletons`, not in `./types` |
| `C:\Projects\site_progress_tracker\src\hooks\index.ts` | Edit — remove `IntersectionObserverOptions` from the `export type` block; fix `CachedDataResult` and `WindowedListResult` if they are not named exports | Depends on Step 5 for `IntersectionObserverOptions` removal |

### Fix Pattern

**`src/design_engineer/shared/index.ts`** — Before:
```typescript
export type {
  DesignRfq,
  DesignRfqCardProps,
  DoorsPackage,
  DoorsPackageCardProps,
  Trend,
  TrendDirection,
  StatsCardProps,
  DesignRfqListSkeletonProps,      // line 20 — does not exist in './types'
  DoorsPackageListSkeletonProps,   // line 21 — does not exist in './types'
  DashboardSkeletonProps,          // line 22 — does not exist in './types'
} from './types';

// Skeleton types are re-exported from skeletons directory
export type { DesignRfqListSkeletonProps, DoorsPackageListSkeletonProps, DashboardSkeletonProps } from './skeletons';
```

After:
```typescript
export type {
  DesignRfq,
  DesignRfqCardProps,
  DoorsPackage,
  DoorsPackageCardProps,
  Trend,
  TrendDirection,
  StatsCardProps,
} from './types';

export type { DesignRfqListSkeletonProps, DoorsPackageListSkeletonProps, DashboardSkeletonProps } from './skeletons';
```

**`src/hooks/index.ts`** — Before:
```typescript
export type {
  CachedDataResult,
  WindowedListResult,
  IntersectionObserverOptions,   // removed in Step 5
} from './usePerformance';
```

After (post Step 5):
```typescript
export type {
  CachedDataResult,
  WindowedListResult,
} from './usePerformance';
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "TS2300\|TS2305\|TS2614" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 9
```

---

## Step 3 — Fix `@types/node` + `NodeJS.Timeout`

**Branch:** `feat/ts-fix-step3-node-types`
**Error count:** 13
**Error codes:** TS2503, TS2591, TS2304
**Status:** [ ] Not started

### Root Cause

Several files in `services/` (root-level) and `src/hooks/` use Node.js-specific globals (`NodeJS.Timeout`, `process`, `module`, `global`, `Buffer`) which are not available in the React Native TypeScript environment without `@types/node`. The tsconfig does not include `"node"` in the `types` array, so these names are undefined. The cleanest fix for React Native code is to replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` (which works without `@types/node`) and to fix the `process`/`module`/`global`/`Buffer` usages inline.

### Files to Change

| File | Line(s) | Error | Fix |
|------|---------|-------|-----|
| `C:\Projects\site_progress_tracker\services\BackgroundPdfQueue.ts` | 19 | TS2503 `NodeJS.Timeout` | Replace with `ReturnType<typeof setInterval>` |
| `C:\Projects\site_progress_tracker\services\sync\AutoSyncManager.ts` | 29 | TS2503 `NodeJS.Timeout` | Replace with `ReturnType<typeof setInterval>` |
| `C:\Projects\site_progress_tracker\src\hooks\useOfflineSync.ts` | 138 | TS2503 `NodeJS.Timeout` | Replace with `ReturnType<typeof setInterval>` |
| `C:\Projects\site_progress_tracker\src\hooks\usePerformance.ts` | 275 | TS2503 `NodeJS.Timeout` | Replace with `ReturnType<typeof setTimeout>` |
| `C:\Projects\site_progress_tracker\scripts\resetDatabase.ts` | 94,98,102 | TS2591 `module`, `process` | Add `// @ts-ignore` or cast; low priority (scripts/) |
| `C:\Projects\site_progress_tracker\scripts\testSessionService.ts` | 142,145 | TS2591 `process` | Same as above |
| `C:\Projects\site_progress_tracker\scripts\testPasswordMigration.ts` | 79,80 | TS2304 `global` | Same as above |
| `C:\Projects\site_progress_tracker\src\services\LogisticsIntegrationService.ts` | 953 | TS2591 `Buffer` | Replace `Buffer.from(...).toString('base64')` with RN-compatible base64 utility or cast |

### Fix Pattern

**Before (`services/BackgroundPdfQueue.ts` line 19):**
```typescript
private processingInterval: NodeJS.Timeout | null = null;
```

**After:**
```typescript
private processingInterval: ReturnType<typeof setInterval> | null = null;
```

**Before (`services/sync/AutoSyncManager.ts` line 29):**
```typescript
private static intervalId: NodeJS.Timeout | null = null;
```

**After:**
```typescript
private static intervalId: ReturnType<typeof setInterval> | null = null;
```

**Before (`src/hooks/useOfflineSync.ts` line 138):**
```typescript
const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

**After:**
```typescript
const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
```

**Before (`src/hooks/usePerformance.ts` line 275):**
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null);
```

**After:**
```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

**Before (`src/services/LogisticsIntegrationService.ts` line 953):**
```typescript
return `sha256=${Buffer.from(JSON.stringify(data) + secret).toString('base64')}`;
```

**After:**
```typescript
// React Native does not have Node's Buffer; use btoa or a RN base64 lib
const raw = JSON.stringify(data) + secret;
return `sha256=${btoa(unescape(encodeURIComponent(raw)))}`;
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "TS2503\|TS2591\|Cannot find namespace 'NodeJS'" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 13
```

---

## Step 4 — Fix Promise Callback Arity

**Branch:** `feat/ts-fix-step4-promise-arity`
**Error count:** 7
**Error codes:** TS2345
**Status:** [ ] Not started

### Root Cause

Several `.then()` / `.catch()` callbacks are written as `(value: unknown) => void` where the API expects `() => void`. This occurs when a developer writes `.then((value) => doSomething())` on a `Promise<void>` whose `.then` typing requires a zero-argument callback. TypeScript 4.x + strict mode rejects this because a function accepting one parameter is not assignable to a type that expects zero parameters when variance is checked. The fix is to either drop the unused parameter or use `(_: unknown) => ...`.

### Files to Change

| File | Line | Fix |
|------|------|-----|
| `C:\Projects\site_progress_tracker\services\network\NetworkMonitor.ts` | 86 | Change `(value: unknown) => void` to `() => void` or `(_: unknown) => void` |
| `C:\Projects\site_progress_tracker\services\sync\AutoSyncManager.ts` | 96 | Same fix |
| `C:\Projects\site_progress_tracker\services\sync\AutoSyncManager.ts` | 118 | Same fix |
| `C:\Projects\site_progress_tracker\services\sync\SyncService.ts` | 917 | Same fix |
| `C:\Projects\site_progress_tracker\src\test\SnackbarTestScreen.tsx` | 112 | Same fix |
| `C:\Projects\site_progress_tracker\src\utils\PerformanceUtils.ts` | 452 | Same fix |

### Fix Pattern

**Before:**
```typescript
somePromise.then((value: unknown) => {
  doWork();
});
```

**After:**
```typescript
somePromise.then(() => {
  doWork();
});
// Or if the parameter was intentionally captured but unused:
somePromise.then((_value) => {
  doWork();
});
```

**Concrete example (`services/network/NetworkMonitor.ts` line 86):**
```typescript
// Before
.then((value: unknown) => resolve())

// After
.then(() => resolve())
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "Argument of type '(value: unknown) => void'" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 7
```

---

## Step 5 — Remove `IntersectionObserver` Web Hook

**Branch:** `feat/ts-fix-step5-intersectionobserver`
**Error count:** 5
**Error codes:** TS2304, TS7031, TS2554, TS2724
**Status:** [ ] Not started

### Root Cause

`src/hooks/usePerformance.ts` contains a `useIntersectionObserver` hook (lines 377–401) that relies on the browser-only `IntersectionObserver` and `IntersectionObserverInit` globals. React Native has no DOM and therefore these names do not exist, producing TS2304. Additionally at line 144, `useRef<T>()` is called with no argument where the type requires one (TS2554), and the barrel re-exports `IntersectionObserverOptions` which does not exist (TS2724, fixed in Step 2). The hook is fundamentally non-functional in React Native; it should be removed or stubbed out.

### Files to Change

| File | Action | Note |
|------|--------|------|
| `C:\Projects\site_progress_tracker\src\hooks\usePerformance.ts` | Remove `useIntersectionObserver` function (lines ~377–401) and the `IntersectionObserverInit` / `IntersectionObserver` usages; fix `useRef<T>()` call at line 144 | Hook is Web-only, unused in RN screens |
| `C:\Projects\site_progress_tracker\src\hooks\index.ts` | Remove `useIntersectionObserver` from the `export` list and remove `IntersectionObserverOptions` from the `export type` list | Completed as part of Step 2 |

### Fix Pattern

**Before (`src/hooks/usePerformance.ts`):**
```typescript
export function useIntersectionObserver(
  ref: React.RefObject<any>,
  options?: IntersectionObserverInit   // TS2304: IntersectionObserverInit not defined in RN
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {  // TS2304: IntersectionObserver not defined
      setIsIntersecting(entry.isIntersecting);                // TS7031: 'entry' implicitly has 'any'
    }, options);

    observer.observe(element);
    return () => { observer.unobserve(element); };
  }, [ref, options]);

  return isIntersecting;
}
```

**After:** Entire function removed. If callers need lazy loading, use `react-native`'s `onViewableItemsChanged` / `Animated` instead.

**Fix for `useRef` arity error (line 144):**
```typescript
// Before
const ref = useRef<T>();

// After
const ref = useRef<T | undefined>(undefined);
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "IntersectionObserver\|TS2304.*IntersectionObserver\|TS7031.*entry" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 5
```

---

## Step 6 — Fix Unresolved Module Imports

**Branch:** `feat/ts-fix-step6-missing-modules`
**Error count:** 3
**Error codes:** TS2307, TS2614, TS7016
**Status:** [ ] Not started

### Root Cause

Three distinct import failures exist. First, `src/logistics/doors-package/state/doorsPackageFormReducer.ts` imports from `'../../../models/DoorsPackageModel'` which resolves to a path that doesn't match the actual model location (TS2307) — the model exists at `models/DoorsPackageModel.ts` (root) and the relative path from `src/logistics/doors-package/state/` should be `'../../../../models/DoorsPackageModel'`. Second, `src/auth/PasswordChangeScreen.tsx` uses a named import `{ PasswordResetService }` but the module uses a default export (TS2614). Third, `services/auth/TokenService.ts` imports `jsrsasign` which has no type declarations (TS7016).

### Files to Change

| File | Line | Error | Fix |
|------|------|-------|-----|
| `C:\Projects\site_progress_tracker\src\logistics\doors-package\state\doorsPackageFormReducer.ts` | 14 | TS2307 — wrong relative path to `DoorsPackageModel` | Change `'../../../models/DoorsPackageModel'` to `'../../../../models/DoorsPackageModel'` |
| `C:\Projects\site_progress_tracker\src\auth\PasswordChangeScreen.tsx` | 14 | TS2614 — named vs default import | Change `{ PasswordResetService }` to `PasswordResetService` (default import) |
| `C:\Projects\site_progress_tracker\services\auth\TokenService.ts` | 1 | TS7016 — no declaration for `jsrsasign` | Add `declare module 'jsrsasign';` in a local `.d.ts` file, or install `@types/jsrsasign` if available |

### Fix Pattern

**`doorsPackageFormReducer.ts` — Before:**
```typescript
import DoorsPackageModel from '../../../models/DoorsPackageModel';
```

**After:**
```typescript
import DoorsPackageModel from '../../../../models/DoorsPackageModel';
```

**`PasswordChangeScreen.tsx` — Before:**
```typescript
import { PasswordResetService } from '../services/PasswordResetService';
```

**After:**
```typescript
import PasswordResetService from '../services/PasswordResetService';
```

**`TokenService.ts` — add `src/types/jsrsasign.d.ts` (or `services/auth/jsrsasign.d.ts`):**
```typescript
declare module 'jsrsasign';
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "TS2307\|TS2614\|TS7016" | wc -l
# Expected: 0 (from src/ gate perspective)
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 3
```

---

## Step 7 — Fix react-native-paper API Mismatches

**Branch:** `feat/ts-fix-step7-rnpaper-api`
**Error count:** 16
**Error codes:** TS2322, TS2769
**Status:** [ ] Not started

### Root Cause

Several components pass props that do not match the current react-native-paper v5 API. There are three distinct sub-issues: (1) `Menu` / `Menu.Item` in `DoorsPackageManagementScreen` and `DesignRfqManagementScreen` pass `accessibilityRole` and `accessibilityLabel` as top-level props but `Menu.Item` in v5 does not accept these directly — they must be wrapped or the prop name changed. (2) `DataTable.Title`'s `sortDirection` prop expects `"ascending" | "descending" | undefined` but the code passes a local `SortOrder` string union which is a superset. (3) `TextInput` from react-native-paper does not accept a `helperText` prop directly; it should be a separate `HelperText` component. (4) `Menu.Item` in `KeyDateSiteManager` is passed a `description` prop that does not exist on the v5 `Menu.Item` type.

### Files to Change

| File | Line(s) | Issue | Fix |
|------|---------|-------|-----|
| `C:\Projects\site_progress_tracker\src\design_engineer\DoorsPackageManagementScreen.tsx` | 399,409,419,429,439 | `Menu.Item` receives `accessibilityRole` | Remove `accessibilityRole` prop or wrap in `View` with `accessibilityRole` |
| `C:\Projects\site_progress_tracker\src\design_engineer\DoorsPackageManagementScreen.tsx` | 388 | `Menu` receives `accessible` as top-level prop | Remove or move to inner `View` |
| `C:\Projects\site_progress_tracker\src\design_engineer\DesignRfqManagementScreen.tsx` | 885 | `Menu` receives `accessibilityLabel` which is not in `Props` | Remove prop or move to anchor element |
| `C:\Projects\site_progress_tracker\src\commercial\shared\components\CostBreakdownTable.tsx` | 183,190,198,205 | `sortDirection` receives `SortOrder \| undefined`, expected `"ascending" \| "descending" \| undefined` | Cast or map local `SortOrder` to paper's union |
| `C:\Projects\site_progress_tracker\src\design_engineer\components\CreateDesignDocumentDialog.tsx` | 336 | `TextInput` from `react-native-paper` does not accept `helperText` | Replace with `<HelperText>` component beneath `<TextInput>` |
| `C:\Projects\site_progress_tracker\src\planning\key-dates\components\KeyDateSiteManager.tsx` | 489 | `Menu.Item` receives `description` which does not exist in v5 props | Remove `description` prop |
| `C:\Projects\site_progress_tracker\src\planning\ItemCreationScreen.tsx` | 315 | Component prop `error` type mismatch in `QuantitySectionProps` | Align the `error` prop type between parent and child |
| `C:\Projects\site_progress_tracker\src\components\common\EmptyState.tsx` | 230 | `No overload matches this call` — likely `Icon` component prop mismatch | Check icon component import and prop spelling |
| `C:\Projects\site_progress_tracker\src\components\skeletons\Skeleton.tsx` | 120,127 | `string \| number` not assignable to `DimensionValue \| undefined` | Cast to `DimensionValue`: `width as DimensionValue` |

### Fix Pattern

**`CostBreakdownTable.tsx` — `sortDirection` mismatch — Before:**
```typescript
// SortOrder is defined locally as 'asc' | 'desc' | undefined
sortDirection={sortField === 'category' ? sortOrder : undefined}
```

**After:**
```typescript
// Map to react-native-paper's accepted literals
const toRnpSortDirection = (s: SortOrder | undefined): 'ascending' | 'descending' | undefined => {
  if (s === 'asc') return 'ascending';
  if (s === 'desc') return 'descending';
  return undefined;
};
sortDirection={sortField === 'category' ? toRnpSortDirection(sortOrder) : undefined}
```

**`CreateDesignDocumentDialog.tsx` — `helperText` prop — Before:**
```tsx
<TextInput
  label="Weightage"
  helperText="Total weightage per site should equal 100%"
  ...
/>
```

**After:**
```tsx
<TextInput label="Weightage" ... />
<HelperText type="info">Total weightage per site should equal 100%</HelperText>
```

**`Skeleton.tsx` — `DimensionValue` — Before:**
```typescript
width: width,   // string | number
height: height, // string | number
```

**After:**
```typescript
import { DimensionValue } from 'react-native';
width: width as DimensionValue,
height: height as DimensionValue,
```

**`Menu.Item` `accessibilityRole` — Before:**
```tsx
<Menu.Item
  title="Pending"
  accessibilityLabel="Filter by pending status"
  accessibilityRole="menuitem"
/>
```

**After:**
```tsx
<Menu.Item
  title="Pending"
  accessibilityLabel="Filter by pending status"
/>
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "react-native-paper\|IntrinsicAttributes & Props\|TS2322.*sortDirection\|TS2769" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 16
```

---

## Step 8 — Fix `LoggingService` Catch Block Errors — `unknown → Error` Cast

**Branch:** `feat/ts-fix-step8-catch-unknown-error`
**Error count:** 95
**Error codes:** TS2345
**Status:** [ ] Not started

### Root Cause

`LoggingService.error()` has the signature `error(message: string, error?: Error, context?: LogContext): void`. TypeScript 4.x changed the type of `catch (error)` clause variables from `any` to `unknown`. When callers pass the caught variable directly as the second argument — `logger.error('msg', error, context)` — TypeScript now reports TS2345 because `unknown` is not assignable to `Error | undefined`. The fix is to cast in each catch block: `error as Error` (or use a type guard if strict safety is required).

### Files to Change

All 37 files below have one or more `catch (error) { logger.error('...', error, ...) }` patterns:

| File | Affected Line(s) |
|------|-----------------|
| `C:\Projects\site_progress_tracker\src\admin\context\AdminContext.tsx` | 34, 51 |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useAdminDashboard.ts` | 51, 91, 173, 252 |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useCategoryMigration.ts` | 37 |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useDashboardStats.ts` | 36 |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useDatabaseReset.ts` | 75 |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\usePasswordMigration.ts` | 27 |
| `C:\Projects\site_progress_tracker\src\admin\project-management\hooks\useProjectData.ts` | 19 |
| `C:\Projects\site_progress_tracker\src\admin\project-management\hooks\useProjectDelete.ts` | 120 |
| `C:\Projects\site_progress_tracker\src\admin\project-management\hooks\useProjectForm.ts` | 94 |
| `C:\Projects\site_progress_tracker\src\admin\role-management\hooks\usePasswordReset.ts` | 73 |
| `C:\Projects\site_progress_tracker\src\admin\role-management\hooks\useUserData.ts` | 25 |
| `C:\Projects\site_progress_tracker\src\admin\role-management\hooks\useUserForm.ts` | 125, 147, 162 |
| `C:\Projects\site_progress_tracker\src\admin\SyncMonitoringScreen.tsx` | 79 |
| `C:\Projects\site_progress_tracker\src\commercial\BudgetManagementScreen.tsx` | 95, 163, 198, 220 |
| `C:\Projects\site_progress_tracker\src\commercial\CommercialDashboardScreen.tsx` | 151 |
| `C:\Projects\site_progress_tracker\src\commercial\context\CommercialContext.tsx` | 143, 156, 166, 176, 192 |
| `C:\Projects\site_progress_tracker\src\commercial\dashboard\hooks\useDashboardData.ts` | 96 |
| `C:\Projects\site_progress_tracker\src\commercial\invoice-management\hooks\useInvoiceData.ts` | 75, 108, 138, 165, 195 |
| `C:\Projects\site_progress_tracker\src\commercial\InvoiceManagementScreen.tsx` | 95, 173, 202, 220, 241 |
| `C:\Projects\site_progress_tracker\src\design_engineer\components\VendorQuotesSheet.tsx` | 372 |
| `C:\Projects\site_progress_tracker\src\design_engineer\context\DesignEngineerContext.tsx` | 118, 127, 161, 174, 184, 194, 204 |
| `C:\Projects\site_progress_tracker\src\design_engineer\dashboard\hooks\useDashboardData.ts` | 351 |
| `C:\Projects\site_progress_tracker\src\design_engineer\DesignRfqManagementScreen.tsx` | 114, 158, 180, 229, 375, 427, 454, 480, 509, 552, 644 |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDashboardMetrics.ts` | 85 |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDesignRfqs.ts` | 38, 83, 138, 159, 178 |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackageCrud.ts` | 54, 66, 174, 354, 396, 414, 521, 652, 714 |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackages.ts` | 32, 83, 119, 140, 160 |
| `C:\Projects\site_progress_tracker\src\logistics\analytics\hooks\useAnalyticsOverview.ts` | 60 |
| `C:\Projects\site_progress_tracker\src\logistics\analytics\hooks\useCostAnalytics.ts` | 53 |
| `C:\Projects\site_progress_tracker\src\logistics\analytics\hooks\useDemandAnalytics.ts` | 81 |
| `C:\Projects\site_progress_tracker\src\logistics\analytics\hooks\useOptimizationData.ts` | 129 |
| `C:\Projects\site_progress_tracker\src\logistics\analytics\hooks\usePerformanceAnalytics.ts` | 86 |
| `C:\Projects\site_progress_tracker\src\logistics\components\DoorsLinkingModal.tsx` | 72 |
| `C:\Projects\site_progress_tracker\src\logistics\delivery-scheduling\hooks\useDeliveryData.ts` | 68 |
| `C:\Projects\site_progress_tracker\src\logistics\DoorsPackageEditScreen.tsx` | 72 |
| `C:\Projects\site_progress_tracker\src\logistics\DoorsRegisterScreen.tsx` | 133, 163 |
| `C:\Projects\site_progress_tracker\src\logistics\DoorsRequirementEditScreen.tsx` | 71 |
| `C:\Projects\site_progress_tracker\src\logistics\EquipmentManagementScreen.tsx` | 81 |
| `C:\Projects\site_progress_tracker\src\logistics\LogisticsAnalyticsScreen.tsx` | 352 |
| `C:\Projects\site_progress_tracker\src\logistics\LogisticsDashboardScreen.tsx` | 95 |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useAnalyticsData.ts` | 42 |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useMaterialTrackingData.ts` | 37 |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useProcurementData.ts` | 43, 70 |
| `C:\Projects\site_progress_tracker\src\logistics\MaterialTrackingScreen.tsx` | 178, 200, 214, 266 |
| `C:\Projects\site_progress_tracker\src\logistics\PurchaseOrderManagementScreen.tsx` | 91, 114, 169, 250, 278 |
| `C:\Projects\site_progress_tracker\src\logistics\RfqCreateScreen.tsx` | 215, 274 |
| `C:\Projects\site_progress_tracker\src\logistics\RfqListScreen.tsx` | 177, 201 |
| `C:\Projects\site_progress_tracker\src\utils\accessibility\useAccessibility.ts` | 34, 57, 73, 88 |

### Fix Pattern

**Before (any catch block in the above files):**
```typescript
} catch (error) {
  logger.error('Failed to load data', error, { component: 'MyComponent' });
}
```

**After:**
```typescript
} catch (error) {
  logger.error('Failed to load data', error as Error, { component: 'MyComponent' });
}
```

**If a type guard is preferred (stricter):**
```typescript
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to load data', err, { component: 'MyComponent' });
}
```

> **Tip:** Use a codemod or global search-and-replace in VS Code across `src/`:
> Find: `` logger\.error\(([^,]+),\s*error, ``
> Replace: `` logger.error($1, error as Error, ``

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "Argument of type 'unknown' is not assignable to parameter of type 'Error" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 95
```

---

## Step 9 — Fix `LoggingService` Primitive `context` Args

**Branch:** `feat/ts-fix-step9-logcontext-primitives`
**Error count:** 22
**Error codes:** TS2345
**Status:** [ ] Not started

### Root Cause

`LoggingService` methods (`debug`, `info`, `warn`, `error`) have a `context?: LogContext` parameter where `LogContext` is `{ component?: string; action?: string; [key: string]: any }`. Callers are passing raw primitives (`string`, `number`, `boolean`) or the result of `typeof someVar` (which is a string union of type names) directly as the `context` argument instead of wrapping them in a `LogContext` object. These are all the TS2345 errors of the form "Argument of type 'string' is not assignable to parameter of type 'LogContext'".

### Files to Change

| File | Line(s) | Offending value | Fix |
|------|---------|----------------|-----|
| `C:\Projects\site_progress_tracker\src\commercial\BudgetManagementScreen.tsx` | 61 | `string` | Wrap: `{ budgetId: theString }` |
| `C:\Projects\site_progress_tracker\src\commercial\BudgetManagementScreen.tsx` | 92 | `number` | Wrap: `{ amount: theNumber }` |
| `C:\Projects\site_progress_tracker\src\commercial\CommercialDashboardScreen.tsx` | 91 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\context\CommercialContext.tsx` | 89, 105 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\dashboard\hooks\useDashboardData.ts` | 47 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\invoice-management\hooks\useInvoiceData.ts` | 45 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\invoice-management\hooks\useInvoiceData.ts` | 72 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\InvoiceManagementScreen.tsx` | 66 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\commercial\InvoiceManagementScreen.tsx` | 92 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\context\DesignEngineerContext.tsx` | 66, 82 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\context\DesignEngineerContext.tsx` | 100 | `typeof` string union | Remove or wrap `{ typeofResult: ... }` |
| `C:\Projects\site_progress_tracker\src\design_engineer\DesignEngineerDashboardScreen.tsx` | 102 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\DesignRfqManagementScreen.tsx` | 192 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\DesignRfqManagementScreen.tsx` | 224 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDashboardMetrics.ts` | 34 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDesignRfqs.ts` | 50 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDesignRfqs.ts` | 80 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackageCrud.ts` | 78 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackageCrud.ts` | 168 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackageCrud.ts` | 321 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackages.ts` | 44 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\design_engineer\hooks\useDoorsPackages.ts` | 80 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\LogisticsDashboardScreen.tsx` | 77 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useAnalyticsData.ts` | 40 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useMaterialTrackingData.ts` | 35 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\material-tracking\hooks\useProcurementData.ts` | 41, 66 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\PurchaseOrderManagementScreen.tsx` | 127 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\PurchaseOrderManagementScreen.tsx` | 166 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\RfqCreateScreen.tsx` | 108 | `number` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\logistics\RfqCreateScreen.tsx` | 260 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useAdminDashboard.ts` | 218 | `unknown` as `LogContext` | Cast to `LogContext` or wrap |
| `C:\Projects\site_progress_tracker\src\admin\dashboard\hooks\useDatabaseReset.ts` | 41 | `unknown` as `LogContext` | Cast or wrap |
| `C:\Projects\site_progress_tracker\src\utils\accessibility\useAccessibility.ts` | 32 | `string` | Wrap in object |
| `C:\Projects\site_progress_tracker\src\utils\accessibility\useAccessibility.ts` | 70, 85 | `boolean` | Wrap in object |

### Fix Pattern

**Before:**
```typescript
logger.info('Loading invoices', invoiceId);          // string passed as LogContext
logger.debug('Count', totalCount);                   // number passed as LogContext
logger.warn('Accessibility changed', isEnabled);     // boolean passed as LogContext
```

**After:**
```typescript
logger.info('Loading invoices', { invoiceId });
logger.debug('Count', { totalCount });
logger.warn('Accessibility changed', { isEnabled });
```

**Special case — `typeof` result as context (`DesignEngineerContext.tsx` line 100):**
```typescript
// Before — passes typeof-result string as context arg
logger.debug('[DesignEngineerContext] type:', typeof userRecord);

// After — wrap in an object key
logger.debug('[DesignEngineerContext] type:', { userRecordType: typeof userRecord });
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "Argument of type 'string' is not assignable to parameter of type 'LogContext'\|Argument of type 'number' is not assignable to parameter of type 'LogContext'\|Argument of type 'boolean' is not assignable to parameter of type 'LogContext'" | wc -l
# Expected: 0
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: drops by 22
```

---

## Step 10 — Fix WatermelonDB Model Missing Fields

**Branch:** `feat/ts-fix-step10-watermelondb-models`
**Error count:** 40
**Error codes:** TS2339, TS2345, TS2551, TS2304, TS2367, TS2591, TS2322
**Status:** [ ] Not started

### Root Cause

Multiple files access properties on WatermelonDB `Model` instances that are either (a) not declared on the model class (so TypeScript sees the base `Model` type, which has no application fields), (b) the field exists under a different name, or (c) the field was removed from the model but callers still use the old name. The main clusters are: `SiteModel` missing `name` field (two SiteSelector components access `site.name` on a `Model` return type); `ItemModel` fields accessed through the generic `Model` type in `ItemsManagementScreen`; `MaterialModel` missing `unitCost` and `category`; `ScheduleRevisionModel` using `appSyncStatusField` instead of `appSyncStatus`; `SyncQueueModel` missing `createdAt`; `User` type missing `id` and `role` in `DoorsPackageEditScreen`; `LogisticsContextValue` missing `setSelectedProjectId`; `BomItemModel.doorsId` typed as `string | undefined` not `string | null`; and `FinancialReportsScreen` using `RNFS.base64encode` (non-existent) and `btoa` (not in RN).

### Files to Change

| File | Line(s) | Root Issue | Fix |
|------|---------|-----------|-----|
| `C:\Projects\site_progress_tracker\src\supervisor\components\SiteSelector.tsx` | 38 | `site.name` on `Model` | Cast fetch result: `const supervisorSites = ... as SiteModel[]` (already done on line 29; ensure `supervisorSites.find(s => s.id === selectedSiteId)` result is typed as `SiteModel`) |
| `C:\Projects\site_progress_tracker\src\design_engineer\components\SiteSelector.tsx` | 39 | Same as above | Same fix |
| `C:\Projects\site_progress_tracker\src\supervisor\ItemsManagementScreen.tsx` | 349–362, 782 | Properties (`name`, `siteId`, `categoryId`, etc.) on `Model` inside `database.write()` callback; withObservables hoc type mismatch | Type the `item` parameter: `item => { (item as ItemModel).name = ...` or use proper WatermelonDB create callback typing |
| `C:\Projects\site_progress_tracker\src\supervisor\MaterialTrackingScreen.tsx` | 485 | `withObservables` HOC type mismatch — `Query<Model>` vs `Query<MaterialModel>` | Annotate the `enhance` call with specific model types |
| `C:\Projects\site_progress_tracker\src\services\LogisticsOptimizationService.ts` | 163, 174, 212, 238, 275, 307, 343, 347 | `material.unitCost` and `material.category` do not exist on `MaterialModel` | Add `@field('unit_cost') unitCost!: number` and `@field('category') category!: string` to `models/MaterialModel.ts`, or cast to `any` if fields exist in DB schema but not in model class |
| `C:\Projects\site_progress_tracker\src\services\LogisticsOptimizationService.ts` | 120, 121 | `material.id` typed as `string | undefined` not `string` | The WatermelonDB `Model.id` is always `string`; cast or use `material.id!` |
| `C:\Projects\site_progress_tracker\src\services\MaterialProcurementService.ts` | 155, 156, 158 | `material.id`, `material.name`, etc. typed as `string | undefined` | Use `!` non-null assertion or ensure type is narrowed |
| `C:\Projects\site_progress_tracker\services\planning\PlanningService.ts` | 428 | `appSyncStatusField` → should be `appSyncStatus` on `ScheduleRevisionModel` | Rename to `appSyncStatus` (TS2551 suggests the correct name) |
| `C:\Projects\site_progress_tracker\services\sync\SyncService.ts` | 1037, 1040, 1067 | `"PUT"` / `"DELETE"` not in `"GET" | "POST" | undefined`; `createdAt` missing on `SyncQueueModel` | Extend the HTTP method union type or cast; add `@readonly @date('created_at') createdAt!: number` to `SyncQueueModel` |
| `C:\Projects\site_progress_tracker\src\logistics\DoorsPackageEditScreen.tsx` | 118, 119, 177, 624 | `user.id` and `user.role` don't exist on `User` type; component missing required props at export | Add `id` and `role` to the `User` interface/type in auth context; fix the export wrapper to pass props |
| `C:\Projects\site_progress_tracker\src\logistics\DoorsRequirementEditScreen.tsx` | 479 | Same export wrapper missing props pattern | Fix the export wrapper |
| `C:\Projects\site_progress_tracker\src\logistics\LogisticsDashboardScreen.tsx` | 45 | `setSelectedProjectId` not in `LogisticsContextValue` | Add it to the context interface and provide it in the context value |
| `C:\Projects\site_progress_tracker\src\logistics\MaterialTrackingScreen.tsx` | 384, 385 | Comparing `'demo' | 'production'` with `'mock'` — dead code | Remove the `=== 'mock'` branches or update `AppMode` type |
| `C:\Projects\site_progress_tracker\src\logistics\DeliverySchedulingScreen.tsx` | 83 | `string | null` passed where `string | undefined` expected | Use nullish coalescing: `selectedProjectId ?? undefined` |
| `C:\Projects\site_progress_tracker\src\services\BomDoorsLinkingService.ts` | 169 | `null` assigned to `doorsId` typed as `string | undefined` | Either change model field type to include `null`, or use `undefined` instead: `bomItem.doorsId = undefined` |
| `C:\Projects\site_progress_tracker\src\manager\FinancialReportsScreen.tsx` | 404 | `RNFS.base64encode` does not exist; `btoa` not in RN | Use `Buffer` via `react-native-quick-base64` or replace with `btoa` from a polyfill package |
| `C:\Projects\site_progress_tracker\models\UserModel.ts` | 28 | `RoleModel.fetch` does not exist | Use WatermelonDB `relation` decorator correctly; the relation is accessed via `.fetch()` only on a `Relation` type |
| `C:\Projects\site_progress_tracker\update_admin_email.ts` | 24 | `model.email` on base `Model` type | Cast to `UserModel` or use proper typed query |
| `C:\Projects\site_progress_tracker\src\planning\WBSManagementScreen.tsx` | 559 | `Props` not found in scope | Import or define the `Props` type; it's used in the `ErrorBoundary` wrapper but not imported |

### Fix Pattern

**`MaterialModel` — add missing fields — Before (`models/MaterialModel.ts`):**
```typescript
export default class MaterialModel extends Model {
  static table = 'materials';
  @field('name') name!: string;
  @field('quantity_available') quantityAvailable!: number;
  // ... no unitCost, no category
}
```

**After:**
```typescript
export default class MaterialModel extends Model {
  static table = 'materials';
  @field('name') name!: string;
  @field('quantity_available') quantityAvailable!: number;
  @field('unit_cost') unitCost!: number;        // add if column exists in schema
  @field('category') category!: string;          // add if column exists in schema
  // ...
}
```

**`ScheduleRevisionModel` — field name typo — Before (`services/planning/PlanningService.ts` line 428):**
```typescript
record.appSyncStatusField = 'pending';
```

**After:**
```typescript
record.appSyncStatus = 'pending';
```

**`DeliverySchedulingScreen.tsx` — null vs undefined — Before:**
```typescript
useDeliveryFilters(deliveries, selectedProjectId)
// selectedProjectId: string | null
```

**After:**
```typescript
useDeliveryFilters(deliveries, selectedProjectId ?? undefined)
```

**`BomDoorsLinkingService.ts` — null assignment — Before:**
```typescript
bomItem.doorsId = null;
```

**After:**
```typescript
bomItem.doorsId = undefined;
// Or update BomItemModel field type to: doorsId!: string | null | undefined
```

**`withObservables` HOC type fix pattern (`ItemsManagementScreen.tsx`):**
```typescript
// Before: TypeScript infers Query<Model> which has no app fields
const enhance = withObservables([], ({ supervisorId, projectId }) => ({
  items: database.collections.get('items').query(...),
}));

// After: annotate return type explicitly
const enhance = withObservables<InputProps, ObservedProps>([], ...)
```

### Verification

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Expected: 0 (within src/) after all 10 steps complete
npx tsc --noEmit 2>&1 | grep "src/" | grep "error TS" | wc -l
# Expected: 0
```

---

## Progress Tracker

- [ ] Step 1 — Delete stale backup files (7 errors, 2 min)
- [ ] Step 2 — Fix barrel / index export duplicates (9 errors, 15 min)
- [ ] Step 3 — Fix `@types/node` + `NodeJS.Timeout` (13 errors, 30 min)
- [ ] Step 4 — Fix Promise callback arity (7 errors, 20 min)
- [ ] Step 5 — Remove `IntersectionObserver` web hook (5 errors, 15 min)
- [ ] Step 6 — Fix unresolved module imports (3 errors, 20 min)
- [ ] Step 7 — Fix react-native-paper API mismatches (16 errors, 45 min)
- [ ] Step 8 — Fix `LoggingService` catch block errors — `unknown → Error` cast (95 errors, 1 h)
- [ ] Step 9 — Fix `LoggingService` primitive context args (22 errors, 30 min)
- [ ] Step 10 — Fix WatermelonDB model missing fields (40 errors, 2 h)

---

## Notes

- TypeScript errors in `__tests__/` (~240 additional errors) are **excluded from the quality gate** and should not be modified as part of this plan unless a `src/` fix requires it.
- Files under `scripts/` and root-level `services/` are **low priority vs `src/`** — they are outside the gate. Fix them only where the change is trivial (e.g., `NodeJS.Timeout` replacement in `services/`).
- Do **not** modify generated files or anything under `node_modules/`.
- When adding fields to WatermelonDB models in `models/`, verify the corresponding column exists in the database schema (`models/schema.ts`) before adding the `@field` decorator, or you will introduce a runtime schema mismatch.
- The branch naming convention `feat/ts-fix-stepN-<slug>` keeps each step independently reviewable and reversible.
- After completing all 10 steps, run `npx tsc --noEmit 2>&1 | grep "src/" | wc -l` to confirm the `src/` gate is at 0. Errors remaining in `scripts/`, `services/`, `models/`, and root `.ts` files are acceptable per current policy.
