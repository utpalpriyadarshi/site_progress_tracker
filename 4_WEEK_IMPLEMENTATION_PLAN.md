# Site Progress Tracker — 4-Week Implementation Plan
## Code Quality, UI Consistency & Play Store Readiness

**Date:** February 2026
**Branch strategy:** One feature branch per task → quality check → commit → PR → merge to `main`
**Versioning:** Each week closes with a version bump (1.0.0 → 1.0.1 → 1.0.2 → 1.0.3)
**Rule:** No task is considered done until it has passed the quality gate and is merged to `main`.

---

## Overview

| Week | Theme | Items | Outcome |
|------|-------|-------|---------|
| **Week 1** | Foundation — Theme, States & Guards | C1, C5, U1, U2, U3, U11 | No blank screens, no double-submits, unified colours |
| **Week 2** | Code Health — Performance & Architecture | C2, C3, C4, C6, C9, C11 | Fast lists, no memory leaks, clean async |
| **Week 3** | UX Polish — Dialogs, Feedback & Sync | C7, C8, U4, U5, U6, U7, R2, R8, R9 | Consistent dialogs, keyboard-safe forms, sync visible |
| **Week 4** | Features & Play Store | C10, C12, U8, U9, U10, R1, R3–R7, R10 | Role gaps closed, app ready for store submission |

> Each item is **independent** — if one blocks, skip it and come back.
> Every task follows the same workflow: **branch → implement → quality check → commit → PR → merge**.
> See the [Task Workflow Protocol](#task-workflow-protocol) section for the exact steps.

---

## Week 1 — Foundation

**Goal:** Every screen loads safely, submits safely, and uses shared colours. No user-facing blank states.

---

### C1 · Create Colour Constants File *(2h)*--Completed

**Branch:** `refactor/theme-colors`
**Files to create:** `src/theme/colors.ts`
**Files to update:** All navigators, all card components, all status chips (global find-replace)

**Why:** 30+ files hardcode the same 8 colour values. Any brand colour change currently requires editing 30+ files.

**Implementation:**

Create `src/theme/colors.ts`:
```typescript
export const COLORS = {
  // Brand
  PRIMARY:           '#673AB7',
  PRIMARY_DARK:      '#4527A0',
  PRIMARY_LIGHT:     '#E8D5F2',

  // Semantic
  SUCCESS:           '#4CAF50',
  SUCCESS_BG:        '#E8F5E9',
  WARNING:           '#FF9800',
  WARNING_BG:        '#FFF3E0',
  ERROR:             '#F44336',
  ERROR_BG:          '#FFEBEE',
  INFO:              '#2196F3',
  INFO_BG:           '#E3F2FD',

  // Text
  TEXT_PRIMARY:      '#333333',
  TEXT_SECONDARY:    '#666666',
  TEXT_TERTIARY:     '#999999',
  TEXT_DISABLED:     '#BDBDBD',

  // Surface
  BACKGROUND:        '#F5F5F5',
  SURFACE:           '#FFFFFF',
  BORDER:            '#E0E0E0',
  DIVIDER:           '#EEEEEE',

  // Status palette (RFQ, DOORS, Documents)
  STATUS_DRAFT:      '#9E9E9E',
  STATUS_ISSUED:     '#2196F3',
  STATUS_RECEIVED:   '#FF9800',
  STATUS_EVALUATED:  '#9C27B0',
  STATUS_AWARDED:    '#4CAF50',
  STATUS_CANCELLED:  '#F44336',
  STATUS_APPROVED:   '#4CAF50',
  STATUS_CLOSED:     '#607D8B',
  STATUS_ACTIVE:     '#2196F3',
};
```

**Replacement pattern:**
- `'#673AB7'` → `COLORS.PRIMARY`
- `'#4CAF50'` → `COLORS.SUCCESS`
- `'#F44336'` → `COLORS.ERROR`
- `'#FF9800'` → `COLORS.WARNING`
- All `getStatusColor()` functions in cards → use `COLORS.STATUS_*`

**Testing:** Visual diff — no colour should change on screen.

---

### C5 · Loading Guard on All Form Submissions *(3h)*-completed

**Branch:** `fix/submit-guard`
**Files:** Every screen with a create/edit dialog

**Why:** Users on slow connections can tap FAB or dialog Submit multiple times, creating duplicate DB records.

**Pattern to apply (copy-paste to every handler):**
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  try {
    await database.write(async () => { /* ... */ });
    showSnackbar('Saved successfully');
  } catch (error) {
    logger.error('[Screen] Submit failed:', error);
    Alert.alert('Error', 'Failed to save. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Apply to:**
- `DesignRfqManagementScreen.tsx` → `handleCreateOrUpdateRfq` (lines 226–366)
- `DoorsPackageManagementScreen.tsx` → package create/edit handler
- `DesignDocumentManagementScreen.tsx` → document create/edit handler
- `AddVendorQuoteDialog.tsx` → quote submit handler
- `EvaluateQuoteDialog.tsx` → evaluate submit handler
- All manager BOM item save handlers
- All supervisor daily report / hindrance save handlers

**FAB and dialog buttons:**
```typescript
<FAB
  loading={isSubmitting}
  disabled={isSubmitting}
  onPress={handleSubmit}
/>
<Button
  loading={isSubmitting}
  disabled={isSubmitting}
  onPress={handleSubmit}
>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

---

### U1 · Add Loading Skeletons to 12 Screens *(6h)*

**Branch:** `fix/loading-states`
**Components available:** `SkeletonCard`, `SkeletonList` in `src/components/common/LoadingState.tsx`

**Why:** These screens show a blank white screen while data loads — looks broken to users.

**Pattern (same for all screens):**
```typescript
if (isLoading) {
  return <SkeletonList count={5} />;
}
```

**Screens to fix:**

| Screen | File | Skeleton type |
|--------|------|---------------|
| Material Tracking | `src/supervisor/MaterialTrackingScreen.tsx` | `SkeletonList count={4}` |
| Hindrance Reports | `src/supervisor/HindranceReportScreen.tsx` | `SkeletonList count={3}` |
| Site Inspection | `src/supervisor/SiteInspectionScreen.tsx` | `SkeletonList count={3}` |
| Reports History | `src/supervisor/ReportsHistoryScreen.tsx` | `SkeletonList count={5}` |
| Team Performance | `src/manager/TeamPerformanceScreen.tsx` | `SkeletonList count={4}` |
| Financial Reports | `src/manager/FinancialReportsScreen.tsx` | `SkeletonList count={3}` |
| Milestone Management | `src/manager/MilestoneManagementScreen.tsx` | `SkeletonList count={4}` |
| Resource Allocation | `src/manager/ResourceAllocationScreen.tsx` | `SkeletonList count={3}` |
| RFQ List | `src/logistics/RfqListScreen.tsx` | `SkeletonList count={5}` |
| RFQ Detail | `src/logistics/RfqDetailScreen.tsx` | `SkeletonCard` |
| Purchase Orders | `src/logistics/PurchaseOrderManagementScreen.tsx` | `SkeletonList count={4}` |
| Daily Reports | `src/supervisor/DailyReportsScreen.tsx` | `SkeletonList count={5}` |

---

### U2 · Add Empty States to 10 Screens *(5h)*

**Branch:** `fix/empty-states`
**Component available:** `EmptyState` in `src/components/common/EmptyState.tsx`

**Why:** Empty list = blank screen. Users don't know if data failed to load or genuinely doesn't exist.

**Pattern:**
```typescript
if (!isLoading && items.length === 0) {
  return (
    <EmptyState
      icon="clipboard-text-outline"
      title="No daily reports yet"
      message="Tap + to log today's work progress"
      action={{ label: 'Create First Report', onPress: handleCreateReport }}
    />
  );
}
```

**Screens and copy:**

| Screen | Icon | Title | Message |
|--------|------|-------|---------|
| Material Tracking | `package-variant` | No materials tracked | Log materials received or used on site |
| Hindrance Reports | `alert-circle-outline` | No hindrances reported | Report any obstacles affecting site progress |
| Site Inspection | `clipboard-check-outline` | No inspections logged | Record your first site inspection |
| Team Performance | `account-group-outline` | No team data yet | Add team members to track performance |
| Financial Reports | `chart-bar` | No financial data | Budgets and costs will appear here |
| RFQ List (Logistics) | `file-document-outline` | No RFQs assigned | Design Engineer RFQs will appear here once issued |
| Purchase Orders | `cart-outline` | No purchase orders | Purchase orders from BOMs will appear here |
| RFQ List (Design) | `file-send-outline` | No RFQs created | Create your first RFQ from a DOORS package |
| DOORS Packages | `package-variant-closed` | No DOORS packages | Create a package to begin equipment specification |
| Design Documents | `file-document-edit` | No documents yet | Create your first design document |

---

### U3 · Add Error State + Retry to All Screens *(4h)*

**Branch:** `fix/error-states`
**Components available:** `ErrorDisplay` in `src/components/common/`

**Why:** When a DB read fails, most screens silently show a blank list. Users have no way to retry without restarting the app.

**Pattern:**
```typescript
// Add to component state
const [loadError, setLoadError] = useState<string | null>(null);

// In load function
const loadData = async () => {
  setLoadError(null);
  try {
    // ... fetch
  } catch (error) {
    setLoadError('Failed to load data. Check your connection and try again.');
    logger.error('[Screen] Load failed:', error);
  }
};

// In render — before the FlatList
if (loadError) {
  return (
    <ErrorDisplay
      message={loadError}
      onRetry={loadData}
    />
  );
}
```

Apply to all screens updated in U1 and U2 above.

---

### U11 · Create `useSnackbar` Hook *(1h)*--completed

**Branch:** `refactor/use-snackbar`
**File to create:** `src/hooks/useSnackbar.ts`

**Why:** Each screen using a Snackbar manages 2 `useState` calls. This hook collapses them to one call.

```typescript
// src/hooks/useSnackbar.ts
import { useState, useCallback } from 'react';

export function useSnackbar() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return {
    show,
    snackbarProps: {
      visible,
      onDismiss: hide,
      children: message,
      duration: 3000,
    },
  };
}

// Usage in any screen:
const { show: showSnackbar, snackbarProps } = useSnackbar();
// ...
showSnackbar('RFQ created successfully');
// ...
<Snackbar {...snackbarProps} />
```

Replace the 2-useState pattern in:
- `DesignRfqManagementScreen.tsx` (lines 43–44)
- `DoorsPackageManagementScreen.tsx`
- `DesignDocumentManagementScreen.tsx`
- All logistics screens using snackbar

---

## Week 2 — Code Health

**Goal:** Lists render fast, async flows are safe, large screen files are split.

---

### C2 · FlatList Performance Hardening *(4h)*--Completed

**Branch:** `perf/flatlist-optimization`
**File to create:** `src/hooks/useFlatListProps.ts`

**Why:** 20+ FlatLists across the app are missing `keyExtractor`, `maxToRenderPerBatch`, and windowing — causes jank with 50+ items.

```typescript
// src/hooks/useFlatListProps.ts
import { useCallback } from 'react';

export function useFlatListProps<T extends { id: string }>(itemHeight?: number) {
  const keyExtractor = useCallback((item: T) => item.id, []);

  const getItemLayout = itemHeight
    ? (_: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })
    : undefined;

  return {
    keyExtractor,
    getItemLayout,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 8,
    windowSize: 5,
    removeClippedSubviews: true,
  };
}
```

**Apply to these FlatLists** (spread `...flatListProps`):

| File | Approx item height |
|------|-------------------|
| `DesignRfqManagementScreen.tsx` | 180 |
| `DoorsPackageManagementScreen.tsx` | 160 |
| `DesignDocumentManagementScreen.tsx` | 140 |
| `VendorQuotesSheet.tsx` | 200 |
| `src/logistics/RfqListScreen.tsx` | 150 |
| `src/supervisor/MaterialTrackingScreen.tsx` | 120 |
| `src/supervisor/HindranceReportScreen.tsx` | 130 |
| `src/planner/` schedule lists | 80 |
| `src/manager/MilestoneManagementScreen.tsx` | 140 |

---

### C3 · Memoize Inline Dispatch Callbacks *(2h)*--completed

**Branch:** `perf/memo-callbacks`
**File:** `src/design_engineer/DesignRfqManagementScreen.tsx` lines 841–856 (and similar in other screens)

**Why:** Arrow functions passed as props to FlatList items create new references on every render, forcing all visible cards to re-render even when data hasn't changed.

**Pattern:**
```typescript
// Before — new function every render
<DesignRfqCard
  onSelect={(id) => dispatch({ type: 'TOGGLE_RFQ_SELECTION', payload: { rfqId: id } })}
  onEdit={(id) => handleEditRfq(id)}
/>

// After — stable references
const handleSelectRfq = useCallback(
  (id: string) => dispatch({ type: 'TOGGLE_RFQ_SELECTION', payload: { rfqId: id } }),
  [dispatch]
);
const handleEditRfq = useCallback(
  (id: string) => { /* ... */ },
  [/* deps */]
);

<DesignRfqCard onSelect={handleSelectRfq} onEdit={handleEditRfq} />
```

Apply to all screens where card callbacks are defined inline.

---

### C4 · useMemo on Summary Bar / Status Counts *(1h)*--completed

**Branch:** `perf/memo-summary`
**File:** `src/design_engineer/DesignRfqManagementScreen.tsx` lines 765–805

**Why:** Status count summary bar recalculates across all RFQs on every render via an inline IIFE.

```typescript
// Before — IIFE runs every render
{(() => {
  const statusCounts = rfqs.reduce((acc, r) => { ... }, {});
  return <SummaryBar counts={statusCounts} />;
})()}

// After
const statusCounts = useMemo(
  () => state.data.rfqs.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  [state.data.rfqs]
);
// ... render
<SummaryBar counts={statusCounts} />
```

Apply the same pattern to any compliance percentage calculations in `DoorsPackageManagementScreen.tsx` and dashboard KPI calculations in manager/planner screens.

---

### C6 · Replace `any` Types with Model Types *(4h)*==completed

**Branch:** `refactor/remove-any`
**Files:** `src/design_engineer/DesignRfqManagementScreen.tsx`, `src/design_engineer/hooks/useDesignRfqs.ts`, `src/design_engineer/components/VendorQuotesSheet.tsx`

**Why:** `any` bypasses TypeScript safety — bugs that TypeScript would catch at compile time become runtime crashes.

**Key replacements:**

```typescript
// ❌ Current
packagesData.map(async (pkg: any) => {
  const site = await database.collections.get('sites').find(pkg.siteId);
  siteName = (site as any).name;
})

// ✅ Fix
import DoorsPackageModel from '../../models/DoorsPackageModel';
import SiteModel from '../../models/SiteModel';

packagesData.map(async (pkg: DoorsPackageModel) => {
  const site = await database.collections.get<SiteModel>('sites').find(pkg.siteId);
  siteName = site.name;
})
```

```typescript
// ❌ Current in VendorQuotesSheet.tsx
const freshQuotes = await RfqService.getQuotesForRfq(rfq.id);
const ranked = freshQuotes.find((q: any) => q.rank === 1);

// ✅ Fix
const freshQuotes: RfqVendorQuoteModel[] = await RfqService.getQuotesForRfq(rfq.id);
const ranked = freshQuotes.find(q => q.rank === 1);
```

**Search pattern:** `grep -r ": any" src/` — prioritise files with 5+ hits.

---

### C9 · Split Monolithic Screen Files *(8h)*--continue


**Branch:** `refactor/split-screens`

**Why:** `DesignDocumentManagementScreen.tsx` is 1,410 lines and handles 4 unrelated concerns. Files this large are hard to review and easy to break.

**DesignDocumentManagementScreen.tsx → split into:**
```
src/design_engineer/
  DesignDocumentManagementScreen.tsx     (orchestration, ~150 lines)
  components/
    DocumentList.tsx                     (FlatList + cards)
    CategoryManager.tsx                  (category CRUD dialogs)
    DocumentWorkflowDialogs.tsx          (copy/move/template dialogs)
  hooks/
    useDocumentCrud.ts                   (create/edit/delete handlers)
    useCategoryManagement.ts             (category handlers)
```

**DoorsPackageManagementScreen.tsx → split into:**
```
src/design_engineer/
  DoorsPackageManagementScreen.tsx       (orchestration, ~150 lines)
  components/
    PackageList.tsx                      (FlatList + cards)
    RequirementsSheet.tsx                (requirement management bottom sheet)
  hooks/
    useDoorsPackageCrud.ts
    useRequirementManagement.ts
```

**Rule of thumb during split:** If a function is >30 lines, it belongs in a hook. If JSX is >50 lines, it belongs in a component.

---

### C11 · Fix useEffect Async Error Handling *(2h)*--Skipped

**Branch:** `fix/effect-errors`
**File:** `src/design_engineer/DesignRfqManagementScreen.tsx` lines 58–74 (and all similar useEffects)

**Why:** `loadDomains()`, `loadVendors()`, `loadDoorsPackages()` called without `.catch()` — unhandled promise rejections crash silently.

```typescript
// ❌ Current
useEffect(() => {
  loadDomains();
  loadDoorsPackages();
  loadRfqs();
  loadVendors();
}, [projectId, refreshTrigger, engineerId]);

// ✅ Fix — parallel load with single error handler
useEffect(() => {
  if (!projectId) return;
  Promise.all([
    loadDomains(),
    loadDoorsPackages(),
    loadRfqs(),
    loadVendors(),
  ]).catch(err => {
    logger.error('[DesignRfq] Initial load failed:', err);
    setLoadError('Failed to load data. Please try again.');
  });
}, [projectId, refreshTrigger, engineerId]);
```

Apply to every `useEffect` that calls multiple async load functions without error handling.

---

## Week 3 — UX Polish

**Goal:** Dialogs are keyboard-safe, feedback is consistent, sync state is visible.

---

### C7 · Consolidate Dialog State into useReducer *(3h)*--/complete

**Branch:** `refactor/dialog-reducer`
**File:** `src/design_engineer/DesignRfqManagementScreen.tsx` lines 43–51

**Why:** Nine separate `useState` calls for dialog state alongside an existing `useReducer` — mixing two patterns in one component is hard to follow.

Move dialog state into the existing reducer's `ui` slice:

```typescript
// Add to state shape in state/index.ts
ui: {
  dialogVisible: boolean;
  editingRfqId: string | null;
  loading: boolean;
  // ADD:
  award: {
    visible: boolean;
    rfqId: string | null;
    value: string;
  };
  cancel: {
    visible: boolean;
    rfqId: string | null;
    reason: string;
  };
  filterMenuVisible: boolean;
}

// ADD action types
| { type: 'OPEN_AWARD_DIALOG'; payload: { rfqId: string } }
| { type: 'SET_AWARD_VALUE'; payload: { value: string } }
| { type: 'CLOSE_AWARD_DIALOG' }
| { type: 'OPEN_CANCEL_DIALOG'; payload: { rfqId: string } }
| { type: 'SET_CANCEL_REASON'; payload: { reason: string } }
| { type: 'CLOSE_CANCEL_DIALOG' }
```

Remove the 9 `useState` lines, update handlers and dialogs to use `state.ui.award.*` and `state.ui.cancel.*`.

---

### C8 · Reduce Props on Dialog Components *(3h)*--/complete

**Branch:** `refactor/dialog-props`
**File:** `src/design_engineer/DesignRfqManagementScreen.tsx` lines 879–908

**Why:** `CreateDesignRfqDialog` receives 16+ props. Every new field requires updating 3 call sites.

```typescript
// ❌ Current — 16 props
<CreateDesignRfqDialog
  visible={state.ui.dialogVisible}
  onDismiss={handleDismissDialog}
  onCreate={handleCreateOrUpdateRfq}
  isEditing={!!state.ui.editingRfqId}
  newTitle={state.form.title}
  setNewTitle={(title) => dispatch({ type: 'SET_FORM', payload: { title } })}
  newDescription={state.form.description}
  setNewDescription={(description) => dispatch({ type: 'SET_FORM', payload: { description } })}
  // ... 8 more props
/>

// ✅ Fix — 5 props
<CreateDesignRfqDialog
  visible={state.ui.dialogVisible}
  isEditing={!!state.ui.editingRfqId}
  formState={state.form}
  dispatch={dispatch}
  domains={state.data.domains}
  doorsPackages={state.data.doorsPackages}
  onDismiss={handleDismissDialog}
  onSubmit={handleCreateOrUpdateRfq}
/>
```

Update `CreateDesignRfqDialog` props interface to accept `formState` + `dispatch` instead of individual field pairs.

---

### U4 · KeyboardAvoidingView in All Form Dialogs *(3h)*--completed

**Branch:** `fix/keyboard-dialogs`

**Why:** On Android, the soft keyboard slides up and covers form inputs inside `Dialog.ScrollArea` (rendered in a Portal). Users can't see what they're typing.

**Pattern to apply to every form dialog:**
```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

<Portal>
  <Dialog visible={visible} onDismiss={onDismiss}>
    <Dialog.Title>{title}</Dialog.Title>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Dialog.ScrollArea style={{ maxHeight: 420 }}>
        <ScrollView>
          {/* TextInputs */}
        </ScrollView>
      </Dialog.ScrollArea>
    </KeyboardAvoidingView>
    <Dialog.Actions>
      <Button onPress={onDismiss}>Cancel</Button>
      <Button onPress={onSubmit}>Save</Button>
    </Dialog.Actions>
  </Dialog>
</Portal>
```

**Dialogs to fix:**
- `CreateDesignRfqDialog.tsx`
- `CreateDoorsPackageDialog.tsx`
- `AddVendorQuoteDialog.tsx`
- `EvaluateQuoteDialog.tsx`
- `ApprovalDialog.tsx` (manager)
- `StatusTransitionDialog.tsx`
- All commercial manager form dialogs
- All logistics form dialogs

---

### U5 · Unify Feedback: Alert vs Snackbar vs Dialog *(4h)*

**Branch:** `refactor/feedback-unification`

**Standard to implement:**

| Situation | Pattern | Component |
|-----------|---------|-----------|
| Destructive confirmation (delete/cancel) | Modal Dialog with red confirm button | `react-native-paper Dialog` |
| Success (create/save/update) | Auto-dismiss Snackbar | `useSnackbar` hook (from U11) |
| Non-fatal error | Auto-dismiss Snackbar with ⚠️ | `useSnackbar` with error variant |
| Fatal error / data load fail | Inline ErrorDisplay with Retry | `ErrorDisplay` component |
| Irrecoverable action warning | Alert.alert (native, hard to dismiss) | Keep as-is |

**Replace all supervisor/manager `Alert.alert` deletes with Dialog:**
```typescript
// ❌ Current (supervisor/manager screens)
Alert.alert('Delete', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete }
]);

// ✅ Standardised
<Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
  <Dialog.Title>Delete Report?</Dialog.Title>
  <Dialog.Content>
    <Paragraph>This cannot be undone.</Paragraph>
  </Dialog.Content>
  <Dialog.Actions>
    <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
    <Button textColor={COLORS.ERROR} onPress={handleDelete}>Delete</Button>
  </Dialog.Actions>
</Dialog>
```

---

### U6 · Standardise Button Labels *(2h)*--complete

**Branch:** `refactor/button-labels`

**Vocabulary standard:**

| Action | Standard label | Not |
|--------|----------------|-----|
| Create new item | `Create [Entity]` | "Add", "New", "+" text |
| Save dialog form | `Save` | "Submit", "OK", "Done" |
| Submit for review | `Submit` | "Send", "Issue" |
| Status transition | `Mark as [Status]` | "Set Active", "Approve" |
| Delete confirm | `Delete` (destructive style) | "Yes, delete", "Remove" |
| Cancel dialog | `Cancel` | "Dismiss", "Close", "No" |
| Discard changes | `Discard` | "Cancel changes" |

Do a search for button text across all screen files and align to this vocabulary.

---

### U7 · Add Icons to Status Chips *(2h)*--complete

**Branch:** `fix/status-chip-icons`

**Why:** Status conveyed by colour alone fails WCAG accessibility guidelines.

Create `src/utils/statusConfig.ts`:
```typescript
export const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  draft:           { color: COLORS.STATUS_DRAFT,      icon: 'pencil-outline',        label: 'Draft' },
  issued:          { color: COLORS.STATUS_ISSUED,     icon: 'send-outline',          label: 'Issued' },
  under_review:    { color: COLORS.WARNING,           icon: 'clock-outline',         label: 'Under Review' },
  quotes_received: { color: COLORS.WARNING,           icon: 'inbox-outline',         label: 'Quotes Received' },
  evaluated:       { color: '#9C27B0',                icon: 'clipboard-check',       label: 'Evaluated' },
  awarded:         { color: COLORS.STATUS_AWARDED,    icon: 'check-circle-outline',  label: 'Awarded' },
  approved:        { color: COLORS.STATUS_APPROVED,   icon: 'check-circle-outline',  label: 'Approved' },
  cancelled:       { color: COLORS.STATUS_CANCELLED,  icon: 'close-circle-outline',  label: 'Cancelled' },
  closed:          { color: COLORS.STATUS_CLOSED,     icon: 'archive-outline',       label: 'Closed' },
};
```

Replace all `getStatusColor(status)` calls with `STATUS_CONFIG[status]`:
```typescript
const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
<Chip icon={config.icon} style={{ backgroundColor: config.color + '20' }}>
  <Text style={{ color: config.color }}>{config.label}</Text>
</Chip>
```

---

### R2 · Offline Banner *(2h)*--complete

**Branch:** `feat/offline-banner`
**File to create:** `src/components/common/OfflineBanner.tsx`

**Why:** `NetworkMonitor.ts` already detects offline state but nothing is shown to the user. Field users on construction sites frequently lose signal.

```typescript
// src/components/common/OfflineBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NetworkMonitor } from '../../services/network/NetworkMonitor';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    return NetworkMonitor.addListener((state) => {
      setIsOffline(!state.isConnected);
    });
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <MaterialCommunityIcons name="wifi-off" size={16} color="#FFF" />
      <Text style={styles.text}>You're offline — changes will sync when reconnected</Text>
    </View>
  );
};
```

Mount in the root layout so it appears above all role navigators.

---

### R8 · Manual Sync Button in Header *(2h)*--complete

**Branch:** `feat/manual-sync`

**Why:** Auto-sync runs every 5 minutes. Field users finishing a session want to confirm their data uploaded before closing the app.

Add "Sync Now" to the 3-dot header menu in each role navigator:
```typescript
// In each navigator's headerRight menu (already has Tutorial + Logout)
{
  title: isSyncing ? 'Syncing...' : 'Sync Now',
  onPress: () => AutoSyncManager.triggerSync(),
  leadingIcon: isSyncing ? 'loading' : 'sync',
  disabled: isSyncing,
}
```

Add a sync status subscription to the navigator component to reflect `AutoSyncManager.isSyncing`.

---

### R9 · Pending Sync Badge on Header *(2h)*--complete

**Branch:** `feat/sync-badge`

**Why:** Users editing offline don't know if their changes are queued or lost.

```typescript
// In each role navigator header
const [pendingCount, setPendingCount] = React.useState(0);

React.useEffect(() => {
  const loadPending = async () => {
    const count = await database.collections
      .get('sync_queue')
      .query(Q.where('status', 'pending'))
      .fetchCount();
    setPendingCount(count);
  };
  const interval = setInterval(loadPending, 10000);
  loadPending();
  return () => clearInterval(interval);
}, []);

// In header:
{pendingCount > 0 && (
  <Badge style={styles.syncBadge}>{pendingCount}</Badge>
)}
```

---

## Week 4 — Features & Play Store

**Goal:** Close key role workflow gaps, then submit to Play Store internal testing track.

---

### C10 · Split DesignEngineerContext into Two Contexts *(4h)*--complete

**Branch:** `refactor/context-split`
**File:** `src/design_engineer/context/DesignEngineerContext.tsx`

**Why:** Context with 16 values causes every consumer to re-render on any change — filter changes re-render screens that only need project data.

```typescript
// Split into:

// 1. Stable project context (rarely changes)
const DesignEngineerProjectContext = createContext({
  projectId: null,
  engineerId: null,
  sites: [],
  domains: [],
});

// 2. Volatile filter context (changes on every chip tap)
const DesignEngineerFilterContext = createContext({
  filterStatus: null,
  setFilterStatus: () => {},
  filterCategory: null,
  setFilterCategory: () => {},
  filterDomain: null,
  setFilterDomain: () => {},
});
```

Screens that only need project data (`DesignDocumentManagementScreen`) won't re-render when filters change.

---

### C12 · Extract `ensureQuotesRanked` from VendorQuotesSheet *(1h)*--Complete

**Branch:** `refactor/extract-ranking`
**File:** `src/design_engineer/components/VendorQuotesSheet.tsx` lines 324–359

Move the 35-line nested conditional inside `handleAwardL1` to `RfqService.ts`:

```typescript
// src/services/RfqService.ts
async getOrRankL1Quote(rfqId: string): Promise<RfqVendorQuoteModel | null> {
  let l1 = await this.quotesCollection
    .query(Q.where('rfq_id', rfqId), Q.where('rank', 1))
    .fetchOne()
    .catch(() => null);

  if (!l1) {
    const hasScores = await this.quotesCollection
      .query(Q.where('rfq_id', rfqId), Q.where('technical_score', Q.notEq(null)))
      .fetchCount() > 0;

    if (hasScores) {
      await this.rankQuotes(rfqId);
      l1 = await this.quotesCollection
        .query(Q.where('rfq_id', rfqId), Q.where('rank', 1))
        .fetchOne()
        .catch(() => null);
    }
  }

  return l1 || null;
}
```

`handleAwardL1` in `VendorQuotesSheet` becomes:
```typescript
const handleAwardL1 = async () => {
  const l1Quote = await RfqService.getOrRankL1Quote(rfq.id);
  if (!l1Quote) {
    Alert.alert('No L1 vendor found', 'Evaluate and rank quotes first.');
    return;
  }
  // ... award flow
};
```

---

### U8 · Shared BaseCard Component *(6h)*--complete

**Branch:** `refactor/base-card`
**File to create:** `src/components/cards/BaseCard.tsx`

**Why:** 20+ card components across roles share the same structure: status chip + title + detail rows + action buttons. Each was written independently.

```typescript
// src/components/cards/BaseCard.tsx
interface DetailRow {
  label: string;
  value: string;
  icon?: string;
  valueColor?: string;
}

interface CardAction {
  label: string;
  icon?: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  color?: string;
  disabled?: boolean;
}

interface BaseCardProps {
  title: string;
  subtitle?: string;
  status?: { label: string; color: string; icon: string };
  details: DetailRow[];
  actions?: CardAction[];
  onPress?: () => void;
  style?: ViewStyle;
}

export const BaseCard: React.FC<BaseCardProps> = ({ ... }) => { ... };
```

**Cards to migrate to BaseCard** (in priority order):
1. `DesignRfqCard.tsx` — highest complexity, most duplicated
2. `DoorsPackageCard.tsx`
3. Supervisor `DailyReportCard`
4. Manager `MilestoneCard`
5. Logistics PO card

---

### U9 · Accessibility Labels on Cards and Chips *(4h)*--complete

**Branch:** `fix/accessibility`

**Reference pattern** (already correct in `EmptyState.tsx`, `DesignRfqCard.tsx`):
```typescript
// Action buttons on cards
<Button
  accessibilityLabel={`Edit RFQ ${rfq.rfqNumber}`}
  accessibilityRole="button"
  accessibilityHint="Double tap to open the edit form"
  onPress={() => onEdit(rfq.id)}
>
  Edit
</Button>

// Filter chips
<Chip
  accessibilityLabel={`Filter by status: ${label}. ${isSelected ? 'Selected' : 'Not selected'}`}
  accessibilityState={{ selected: isSelected }}
  onPress={() => onToggle(value)}
>
  {label}
</Chip>

// FlatList
<FlatList
  accessibilityLabel="RFQ list"
  // ...
/>
```

**Priority screens:** All supervisor screens (field users may use accessibility features), manager milestone screen, logistics RFQ list.

---

### U10 · Shared StyleSheet Constants *(3h)*--complete

**Branch:** `refactor/shared-styles`
**File to create:** `src/styles/common.ts`

```typescript
// src/styles/common.ts
import { StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export const commonStyles = StyleSheet.create({
  // Card
  card:         { marginBottom: 16, elevation: 2, borderRadius: 8 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle:    { fontSize: 16, fontWeight: '600', color: COLORS.TEXT_PRIMARY, flex: 1 },

  // Detail rows
  detailRow:    { flexDirection: 'row', marginBottom: 6 },
  detailLabel:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, flex: 1 },
  detailValue:  { fontSize: 13, color: COLORS.TEXT_PRIMARY, flex: 2 },

  // Action buttons
  actionRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 4, flexWrap: 'wrap' },

  // Screen layout
  screen:       { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content:      { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_SECONDARY, marginBottom: 8, marginTop: 16 },
});
```

---

### R1 · Supervisor — Photo Attachment for Daily Reports *(6h)*--complete

**Branch:** `feat/supervisor-photos`

**Permissions already in `AndroidManifest.xml`:** `CAMERA`, `READ_MEDIA_IMAGES`, `FileProvider`

**Implementation:**

1. Add `images` field to `DailyReportModel` (migration v46): `text` column storing JSON array of local file paths
2. Add camera/gallery picker to `DailyReportScreen.tsx`:
```typescript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const handleAddPhoto = () => {
  Alert.alert('Add Photo', 'Choose source', [
    { text: 'Camera', onPress: () => launchCamera({ mediaType: 'photo' }, handlePhotoResult) },
    { text: 'Gallery', onPress: () => launchImageLibrary({ mediaType: 'photo' }, handlePhotoResult) },
    { text: 'Cancel', style: 'cancel' },
  ]);
};
```
3. Display thumbnails in `ReportsHistoryScreen.tsx` daily report cards
4. Store file paths locally (no Supabase upload needed for v1)

---

### R3 · Planner — Baseline Schedule Overlay *(8h)*--complete

**Branch:** `feat/planner-baseline`

**Model available:** `ScheduleRevisionModel` (exists, not used in UI)

**Implementation:**
1. Add "Set as Baseline" action on the Key Dates screen — copies current `targetDays` values into a `ScheduleRevisionModel` record with `revisionNumber = 0` (baseline)
2. On Gantt/Timeline view, add toggle button "Show Baseline"
3. When enabled, render a second grey bar behind each item's current bar representing the baseline dates
4. Label current = solid colour, baseline = striped or faded

---

### R4 · Design Engineer — DOORS Package Revision History *(6h)*--complete

**Branch:** `feat/doors-revisions`

**Implementation:**
1. Migration v46: Add `doors_revisions` table:
   - `doors_package_id` (string)
   - `version_number` (number)
   - `snapshot_json` (text — JSON of the full package + requirements)
   - `changed_by_id` (string)
   - `changed_at` (number timestamp)
   - `change_summary` (string)

2. In the DOORS package update handler, write a revision row before overwriting:
```typescript
await revisionsCollection.create((rev) => {
  rev.doorsPackageId = pkg.id;
  rev.versionNumber = pkg.version + 1;
  rev.snapshotJson = JSON.stringify(pkg);
  rev.changedById = userId;
  rev.changedAt = Date.now();
});
```

3. Add "History" bottom sheet on the package detail view showing a timeline of revisions with diff summary.

---

### R5 · Design Engineer — Link Design Documents to DOORS Packages *(4h)*--complete

**Branch:** `feat/doc-doors-link`

**Implementation:**
1. Migration v46: Add `doors_package_id` (nullable string) to `design_documents` table
2. In `DesignDocumentManagementScreen.tsx`: Add a "Link to Package" chip in the create/edit dialog — shows a searchable picker of DOORS packages in the same domain
3. In `DoorsPackageManagementScreen.tsx` package detail view: Add "Linked Documents" section showing associated documents with navigation to them

---

### R6 · Logistics — Reuse VendorQuotesSheet *(3h)*--complete

**Branch:** `feat/logistics-quote-view`
**Files:** `src/logistics/RfqDetailScreen.tsx`, `src/design_engineer/components/VendorQuotesSheet.tsx`

**Why:** Design Engineer already has a complete quote comparison table. Logistics RFQ Detail shows only basic cards.

**Implementation:**
1. Add `readOnly?: boolean` prop to `VendorQuotesSheet`
2. When `readOnly=true`, hide Evaluate, Rank, Award buttons; show comparison table only
3. Import and render `VendorQuotesSheet` in `RfqDetailScreen.tsx` with `readOnly={true}`

---

### R7 · Manager — Change Order Tracking *(10h)*--complete

**Branch:** `feat/change-orders`

**Implementation:**
1. Migration v46: Add `change_orders` table:
   - `title`, `description` (string)
   - `impact_cost` (number — positive = cost increase)
   - `impact_days` (number — positive = delay)
   - `status`: `draft | submitted | approved | rejected`
   - `project_id`, `submitted_by_id`, `approved_by_id` (string)
   - `submitted_at`, `approved_at` (number)

2. Create `ChangeOrderModel.ts` in `models/`
3. Add "Changes" tab to Manager navigator (alongside Dashboard, BOM, Finance, Team)
4. Screens:
   - `ChangeOrderListScreen.tsx` — list with status filter chips
   - `ChangeOrderDetailScreen.tsx` — detail + approval action
5. Dashboard KPI card: "Pending Changes" count

---

### R10 · Tutorial Steps for All Roles *(8h)*--complete

**Branch:** `feat/role-tutorials`
**Reference:** `src/tutorial/plannerTutorialSteps.ts`

Create one file per role following the same pattern:
- `src/tutorial/supervisorTutorialSteps.ts`
- `src/tutorial/managerTutorialSteps.ts`
- `src/tutorial/logisticsTutorialSteps.ts`
- `src/tutorial/designEngineerTutorialSteps.ts`
- `src/tutorial/commercialManagerTutorialSteps.ts`

Each tutorial should cover 5–7 steps: the main tab purpose, how to create the primary record type, and where to find reports.

---

## Play Store Submission Checklist

To be completed during Week 4 alongside feature work.

### Step 1 — App Identity
- [ ] Update `app.json`: set `displayName` to `"Site Progress Tracker"`, add `version: "1.0.0"`
- [ ] Update `package.json`: `"version": "1.0.0"`
- [ ] Create app icon — 512×512 PNG, place in `android/app/src/main/res/mipmap-*/`
- [ ] Create splash screen — use existing purple brand colour `#673AB7`
- [ ] Create feature graphic — 1024×500 PNG for Play Store listing

### Step 2 — Android Build Config
- [ ] `android/app/build.gradle`:
  - `versionCode 1`
  - `versionName "1.0.0"`
  - Enable `minifyEnabled true` for release build
  - Reference release keystore (see Step 3)

### Step 3 — Release Signing
```bash
# Generate release keystore (run once, store securely)
keytool -genkey -v \
  -keystore android/app/release.keystore \
  -alias site_tracker \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Store credentials in ~/.gradle/gradle.properties (NOT in git)
SITE_TRACKER_STORE_FILE=release.keystore
SITE_TRACKER_STORE_PASSWORD=<password>
SITE_TRACKER_KEY_ALIAS=site_tracker
SITE_TRACKER_KEY_PASSWORD=<password>
```

In `build.gradle`:
```gradle
signingConfigs {
  release {
    storeFile file(SITE_TRACKER_STORE_FILE)
    storePassword SITE_TRACKER_STORE_PASSWORD
    keyAlias SITE_TRACKER_KEY_ALIAS
    keyPassword SITE_TRACKER_KEY_PASSWORD
  }
}
buildTypes {
  release {
    signingConfig signingConfigs.release
    minifyEnabled true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
  }
}
```

### Step 4 — Security
- [ ] Add `.env` to `.gitignore`
- [ ] Create `.env.example` with placeholder values
- [ ] Remove JWT secrets from `.env` — move signing to Supabase Edge Function
- [ ] Rotate the exposed JWT secrets

### Step 5 — Privacy Policy
- [ ] Host a privacy policy page (required by Google Play)
- [ ] Minimum content: what data is collected, how it's stored, contact email
- [ ] Note: app uses local SQLite storage only; no personal data sent to third parties unless Supabase sync is enabled

### Step 6 — Build & Upload
```bash
# Generate release AAB (Android App Bundle — preferred over APK)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

- [ ] Create [Google Play Console](https://play.google.com/console) account ($25 one-time fee)
- [ ] Create new app in Play Console
- [ ] Upload AAB to **Internal Testing** track first
- [ ] Add test users (email addresses)
- [ ] Run Google's pre-launch report (automated accessibility + crash tests)
- [ ] Fix any issues flagged
- [ ] Promote to **Closed Testing** (beta) → share with real users
- [ ] After beta validation → promote to **Production** (start at 20% rollout)

### Step 7 — Play Store Listing
- [ ] App name: `Site Progress Tracker`
- [ ] Short description (≤80 chars): `Construction site management for field engineers and project teams`
- [ ] Full description: role-by-role feature overview
- [ ] Screenshots: 2–4 per major role (Supervisor, Design Engineer, Manager)
- [ ] Content rating: complete questionnaire (likely `Everyone`)
- [ ] Target API level: minimum API 24 (Android 7), target API 34

---

## Weekly Milestones

| End of Week | Version | Completed | Test Focus |
|-------------|---------|-----------|------------|
| **Week 1** | `1.0.0` | C1, C5, U1, U2, U3, U11 | No blank screens on any role; no duplicate records on fast taps |
| **Week 2** | `1.0.1` | C2, C3, C4, C6, C9, C11 | Scroll 100-item list smoothly; edit then save with no TypeScript errors |
| **Week 3** | `1.0.2` | C7, C8, U4, U5, U6, U7, R2, R4, R8, R9 | Turn off WiFi → banner appears; type in dialog with keyboard open |
| **Week 4** | `1.0.3` | C10, C12, U8–U10, R1, R3–R10, Play Store | All role tutorials; install from internal track on real device |

---

## Task Workflow Protocol

Every task — regardless of size — follows these steps in order. No exceptions.

---

### Step 1 · Create Branch

Branch off `main`. Never work directly on `main`.

```bash
git checkout main
git pull origin main
git checkout -b <type>/<id>-<slug>
```

**Branch naming:**

| Prefix | When to use | Example |
|--------|-------------|---------|
| `refactor/` | Code restructuring, no new behaviour | `refactor/c1-theme-colors` |
| `fix/` | Bug fix or missing state | `fix/u1-loading-skeletons` |
| `feat/` | New feature or screen | `feat/r2-offline-banner` |
| `perf/` | Performance improvement only | `perf/c2-flatlist` |

---

### Step 2 · Implement

Work on the branch. Follow the task spec in this document. Keep changes scoped to the single task — do not fix unrelated things on the same branch.

---

### Step 3 · Quality Check

Run all of the following before committing. Fix every issue found.

**3a — TypeScript**
```bash
npx tsc --noEmit
```
Expected: zero new errors introduced by your changes.
(Pre-existing errors in unrelated test files are acceptable — do not add to them.)

**3b — Lint**
```bash
npx eslint src/ --ext .ts,.tsx --max-warnings 0
```
Expected: zero warnings in files you touched.

**3c — Unit tests (if tests exist for changed code)**
```bash
npx jest --testPathPattern=<relevant-pattern> --passWithNoTests
```
Expected: all tests pass.

**3d — Manual smoke test on device or emulator**

Run the app in development mode and verify:
- [ ] The screen(s) affected by this task render correctly
- [ ] No new blank/white screens during loading
- [ ] No crash on the happy path
- [ ] No crash on the empty state path
- [ ] If a form was changed — keyboard opens correctly, submit works, error case handled

```bash
npx react-native run-android
```

**3e — Check for console errors**

Open Metro bundler output and the device logcat. Confirm:
- No new `console.error` lines from your changes
- No unhandled promise rejections
- No React warnings (missing keys, invalid prop types)

```bash
# Watch device logs during smoke test
adb logcat -s ReactNativeJS
```

---

### Step 4 · Commit

Stage only the files relevant to this task. Do not bundle unrelated changes.

```bash
git add <specific files only>
git status   # confirm staging looks right
git commit -m "<type>(<id>): <short description>

- <bullet: what changed>
- <bullet: why>
- <bullet: files affected>"
```

**Commit message format:**

```
refactor(c1): add COLORS theme constants and replace hardcoded values

- Create src/theme/colors.ts with full colour palette
- Replace #673AB7 with COLORS.PRIMARY in 14 navigator files
- Replace status hex codes with COLORS.STATUS_* in all card components
- No visual change — pure refactor
```

Types: `refactor` | `fix` | `feat` | `perf` | `test` | `docs`

---

### Step 5 · Push and Open PR

```bash
git push origin <branch-name>
```

Open a Pull Request to `main` on GitHub with:
- **Title:** same as commit subject line
- **Body:**
  - What was changed and why (2–4 bullet points)
  - Screenshot or screen recording if UI changed
  - Test plan: what was manually verified
  - Link to task ID in this document (e.g., "Closes C1")

---

### Step 6 · Review and Merge

- Self-review the diff on GitHub before merging — read every line changed
- Confirm: no accidental debug code, no commented-out blocks, no unrelated files
- Merge strategy: **Squash and merge** (keeps `main` history clean)
- Delete the branch after merge

```bash
# After merge, update local main
git checkout main
git pull origin main
git branch -d <branch-name>
```

---

### Quick Reference Checklist (per task)

Copy this into your PR description for every task:

```
## Task Checklist
- [ ] Branch created from latest main
- [ ] Implementation matches task spec in 4_WEEK_IMPLEMENTATION_PLAN.md
- [ ] `npx tsc --noEmit` — zero new errors
- [ ] `npx eslint` — zero new warnings in touched files
- [ ] Jest tests pass (if applicable)
- [ ] Smoke tested on device/emulator — happy path
- [ ] Smoke tested — empty state path
- [ ] Smoke tested — error/offline path (if applicable)
- [ ] No new console.error or unhandled rejections
- [ ] Commit message follows format
- [ ] PR diff reviewed — no debug code, no unrelated changes
- [ ] Branch deleted after merge
```

---

## Weekly Milestones

| End of Week | Version | Completed | Test Focus |
|-------------|---------|-----------|------------|
| **Week 1** | `1.0.0` | C1, C5, U1, U2, U3, U11 | No blank screens on any role; no duplicate records on fast taps |
| **Week 2** | `1.0.1` | C2, C3, C4, C6, C9, C11 | Scroll 100-item list smoothly; edit then save with no TypeScript errors |
| **Week 3** | `1.0.2` | C7, C8, U4, U5, U6, U7, R2, R8, R9 | Turn off WiFi → banner appears; type in dialog with keyboard open |
| **Week 4** | `1.0.3` | C10, C12, U8–U10, R1, R3–R10, Play Store | All role tutorials; install from internal track on real device |

---

*Last updated: February 2026*
*31 independent improvements — each follows the Task Workflow Protocol above*
