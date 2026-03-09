# UI/UX Uniformity Plan — App Store Readiness

**Date**: March 2026
**Scope**: All 7 roles — Admin, Planner, Design Engineer, Supervisor, Manager, Logistics, Commercial
**Goal**: Consistent look, feel, and interaction patterns before App Store submission

---

## Current State Summary

| Aspect | Status | Severity |
|--------|--------|----------|
| Header / navigation pattern | Inconsistent | 🔴 Critical |
| Error feedback (Alert vs Snackbar) | Inconsistent | 🔴 Critical |
| Loading states | 4 different approaches | 🔴 Critical |
| **Hardcoded colors (3,918 instances)** | **Critical** | 🔴 Critical |
| **No custom Paper theme configured** | **Defaults only** | 🔴 Critical |
| **iOS/Material color mix** | **249 unique hardcoded values** | 🔴 Critical |
| Empty state component | Partially shared | 🟡 Medium |
| Card / elevation style | Mostly consistent | 🟡 Medium |
| FAB strategy | Not defined | 🟡 Medium |
| Pull-to-refresh | Mostly consistent | 🟢 Low |
| Tutorial coverage | 6/7 roles | 🟢 Low |
| Typography / screen titles | Minor inconsistencies | 🟢 Low |

---

## Issue Inventory

### 🔴 ISSUE-01 — Header shown/hidden inconsistency

**Problem**: No consistent rule for whether role tab screens show the system header or use a custom one.

| Role | `headerShown` in tabs | Header type |
|------|-----------------------|-------------|
| Planning | `true` | Navigator default (Primary bg, hamburger + logout) |
| Logistics | `true` | Navigator default |
| Manager | `true` | Navigator default |
| Commercial | `true` | Navigator default |
| Admin | `true` | Navigator default (no hamburger — no drawer) |
| Design Engineer | `false` | Custom screen-level header |
| Supervisor | `false` | `SupervisorHeader` custom component |

**Impact**: Design Engineer and Supervisor look structurally different from all other roles. The title placement, back button area, and height vary.

**Fix**:
- Standardize all roles to `headerShown: true` driven by the navigator.
- Replace `SupervisorHeader` with the standard navigator header + `headerRight` (SyncHeaderButton + logout) — matching the Planning/Logistics/Manager pattern.
- Design Engineer tabs should also set `headerShown: true` and remove per-screen custom headers.
- **Exception allowed**: Screens that use a Search bar in the header (can use a themed `headerTitle` component).

---

### 🔴 ISSUE-02 — Error & feedback: Alert vs Snackbar

**Problem**: No clear rule for when to use `Alert.alert()` vs `Snackbar`. Both are used for errors, successes, and confirmations, mixed across all roles.

**Current state**:

| Role | Alert usage | Snackbar usage |
|------|-------------|----------------|
| Supervisor | ❌ None | ✅ All feedback via `useSnackbar()` |
| Admin | ❌ None | ✅ All feedback via `useSnackbar()` |
| Planning | Mix | Mix |
| Design Engineer | ✅ Errors, RFQ ops | ❌ Minimal |
| Logistics | ✅ Errors, DOORS ops | ❌ Minimal |
| Manager | ✅ Change orders, approvals | ❌ Minimal |
| Commercial | ✅ Validation, errors | Custom `useSnackbar` hook |

**Correct rule to enforce**:

```
Alert.alert()   → Destructive / irreversible confirmations only
                  (e.g., Delete, Reset Database, Submit for Approval)

Snackbar        → All success messages
                  All non-critical errors
                  All info / warning notifications
                  All undo opportunities
```

**Fix**:
- Audit every `Alert.alert()` call that is NOT a confirmation dialog — replace with Snackbar.
- Delete the custom `useSnackbar` hook in Commercial; use the shared `SnackbarProvider` context.
- Ensure all roles import `useSnackbar` from the same path: `src/components/Snackbar/`.

---

### 🔴 ISSUE-03 — Loading state: 4 different approaches

**Problem**: Different roles use different loading indicators with no shared component.

| Approach | Used by | Problem |
|----------|---------|---------|
| Skeleton cards (shimmer) | Planning, Design Engineer | Best UX but not shared |
| `<ActivityIndicator>` inline | Supervisor, Admin, Logistics | Bare spinner, no layout |
| Widget-level loading flags | Manager | Inconsistent timing |
| No loading indicator | Some Commercial screens | Blank screen flash |

**Fix**: Create `src/components/common/LoadingState.tsx` with three variants and use consistently:

```typescript
// Variant 1 — Full screen center spinner (for initial load)
<LoadingState variant="screen" />

// Variant 2 — Inline section spinner (for refreshing a list)
<LoadingState variant="inline" />

// Variant 3 — Skeleton (for dashboards / card lists)
<LoadingState variant="skeleton" count={3} />
```

**Rule**:
- Initial data load → `variant="screen"` until first data arrives
- Pull-to-refresh → `RefreshControl` spinner (native, already standard)
- Background/silent refresh → no indicator (already handled with `silentUpdate` flag in reactive hooks)
- Section reload → `variant="inline"` within the section

---

### 🟡 ISSUE-04 — EmptyState component: not used consistently

**Problem**: Shared `EmptyState` component exists but Commercial and Admin have custom empty state components.

**Fix**:
- Remove `DashboardEmptyState` (Commercial) and any `AdminEmptyState`.
- Use shared `<EmptyState icon="..." title="..." message="..." />` everywhere.
- Add `variant="compact"` support if not already present (for use inside widgets vs full-screen).

**Standard usage**:
```tsx
<EmptyState
  icon="chart-arc"
  title="No Data"
  message="Add items to see data here"
  variant="compact"          // for inside a card/widget
  actionText="Get Started"   // optional CTA
  onAction={onPress}
/>
```

---

### 🟡 ISSUE-05 — Card elevation and style inconsistency

**Problem**: All roles use `<Card>` from `react-native-paper` but with different `mode` props, padding values, and border-radius.

**Current state**:
- Planning: `mode="elevated"` explicit
- All others: default (which is `"elevated"` in Paper v5 but renders differently with no explicit prop)
- Padding inside `Card.Content`: ranges from 8 to 16 dp

**Fix**: Define a shared card style constant and always use it:

```typescript
// src/theme/cardStyles.ts  (new file)
export const CARD_STYLES = {
  default: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  elevated: {
    elevation: 2,
  },
  content: {
    padding: 16,
  },
};
```

Rule: All `<Card>` components → `mode="elevated"` + `style={CARD_STYLES.default}`.

---

### 🟡 ISSUE-06 — FAB: no strategy defined

**Problem**: No Floating Action Button anywhere in the app for primary create/add actions. All creation is via header buttons or in-list buttons.

**Current**: Every list screen uses a `+` button either in the header `headerRight` or as an inline button at the bottom of the list.

**Decision needed**:
- Option A: Add FAB to every list screen as the primary create action (Material Design standard).
- Option B: Keep header button pattern but make it consistent across all roles.

**Recommendation**: Option B (header button) — FAB is harder to implement consistently with the existing Card-based layouts and may conflict with bottom tabs. But if adopted:
- FAB position: `bottom: 24, right: 16` everywhere.
- FAB icon: `plus` (Material Community Icons).
- FAB color: `COLORS.PRIMARY`.

**Minimum fix (Option B)**:
- Ensure every list/management screen has `headerRight` with an `IconButton` (icon=`plus`) for the create action.
- Remove any inline "Add" `Button` components at bottom of list — replace with the header button pattern.

---

### 🟡 ISSUE-07 — Color usage: direct vs theme

**Problem**: Header background color set inconsistently.

| Method | Used in |
|--------|---------|
| `COLORS.PRIMARY` direct import | Design Engineer, Planning, Logistics |
| `theme.colors.primary` from `useTheme()` | Manager, some screens |
| Hardcoded `'#673AB7'` | A few isolated places |

**Fix**: Replace all `theme.colors.primary` and hardcoded hex with `COLORS.PRIMARY` import.

Add missing text color constants to `src/theme/colors.ts`:
```typescript
TEXT_PRIMARY:    '#212121',
TEXT_SECONDARY:  '#757575',
TEXT_DISABLED:   '#BDBDBD',
SURFACE:         '#FFFFFF',
BACKGROUND:      '#F5F5F5',
DIVIDER:         '#E0E0E0',
```

---

### 🟡 ISSUE-08 — Screen titles: format inconsistency

**Problem**: No naming convention for screen titles shown in the header.

**Examples**:
- "Planning" (role name)
- "Manager Dashboard"
- "Design Engineer"
- "Commercial Manager" (some screens say just "Commercial")
- Admin tabs use emoji labels (🏠 📁 👥) instead of text

**Fix**:
- All tab screens: title = the tab label (e.g., "Dashboard", "Key Dates", "Design Documents")
- All drawer screens: title = the screen function (e.g., "KD Billing", "IPC Readiness")
- Admin: Remove emoji labels from tab icons — use `tabBarIcon` with MaterialCommunityIcons + `tabBarLabel` as plain text

---

### 🟢 ISSUE-09 — Pull-to-refresh: Supervisor custom pattern

**Problem**: Supervisor uses a custom refresh mechanism inside `SupervisorHeader` instead of the standard `<FlatList refreshControl={...}>` pattern.

**Fix**: Once ISSUE-01 is resolved (moving Supervisor to standard navigator header), replace Supervisor's pull-to-refresh with the standard `RefreshControl` pattern used by all other roles.

---

### 🟢 ISSUE-10 — Tutorial: Admin excluded

**Problem**: 6/7 roles have tutorial. Admin is the only role without one.

**Decision**: Admin is typically used by technical staff who don't need onboarding. Document this explicitly in the tutorial step files as an intentional exclusion. No code change required.

---

### 🟢 ISSUE-11 — Typography inconsistency

**Problem**: Heading sizes in screen bodies vary slightly. Some use `variant="headlineMedium"` some use `variant="titleLarge"` for the same visual level.

**Standard to enforce** (react-native-paper Typography scale):
```
Screen title (in list header):    variant="titleLarge"
Section title:                    variant="titleMedium"
Card title:                       variant="titleSmall"  or  variant="labelLarge"
Card body text:                   variant="bodyMedium"
Caption / metadata:               variant="bodySmall"
KPI value (big number):           variant="headlineMedium"
```

---

---

## Color & Theme Audit

> **Audit result: 3,918 hardcoded hex color instances across 400+ files.**
> The COLORS file is well-defined but largely ignored — only 257 files import it.

---

### 🔴 ISSUE-12 — Phase 2 COLORS constants exist but are not used

**Problem**: `src/theme/colors.ts` already defines `TEXT_PRIMARY`, `TEXT_SECONDARY`, `BACKGROUND`, `SURFACE`, `BORDER`, `DIVIDER` — but the codebase still hardcodes those exact values everywhere.

| Hardcoded value | Should be | Instances |
|-----------------|-----------|-----------|
| `#333` / `#333333` | `COLORS.TEXT_PRIMARY` | ~385 |
| `#666` / `#666666` | `COLORS.TEXT_SECONDARY` | ~684 |
| `#999` / `#999999` | `COLORS.TEXT_TERTIARY` | ~120 est. |
| `#BDBDBD` | `COLORS.TEXT_DISABLED` | ~40 est. |
| `#F5F5F5` | `COLORS.BACKGROUND` | ~209 |
| `#E0E0E0` | `COLORS.BORDER` | ~262 |
| `#EEEEEE` | `COLORS.DIVIDER` | ~90 est. |
| `#FFF` / `#FFFFFF` | `COLORS.SURFACE` | ~490 |
| `#F44336` | `COLORS.ERROR` | ~27 |
| `#FF9800` | `COLORS.WARNING` | ~11 |
| `#2196F3` | `COLORS.INFO` | ~6 |
| `#4CAF50` | `COLORS.SUCCESS` | ~8 |
| `#9E9E9E` | `COLORS.DISABLED` | ~7 |

**Total replaceable with existing constants: ~2,339 instances.**

**Fix**: Grep-replace each value systematically per file. Start with the highest-count files.

---

### 🔴 ISSUE-13 — iOS/Material color mix: 249 unique custom colors

**Problem**: The app uses a mix of iOS Human Interface Guideline colors, Tailwind CSS colors, and Material Design colors with no documented palette. This means status colors look different depending on which screen you're on.

**Top offenders (no COLORS equivalent, widely used)**:

| Hardcoded hex | Source | Meaning in app | File count | Instances |
|---------------|--------|----------------|-----------|-----------|
| `#007AFF` | iOS system blue | Links, activity, primary actions | 73 | 95+ |
| `#1976D2` | Material blue 700 | Sync status, secondary actions | 33 | 44+ |
| `#10B981` | Tailwind emerald | Healthy/good status | 15 | 24+ |
| `#FF3B30` | iOS system red | Danger, delete actions | 18 | 35+ |
| `#3B82F6` | Tailwind blue 500 | Status indicators | 14 | 16+ |
| `#F59E0B` | Tailwind amber | Caution warnings | 9 | 11+ |
| `#00BCD4` | Material cyan | Info / active | 11 | 11+ |
| `#8B5CF6` | Tailwind violet | Category chips, priority | 6 | 8+ |
| `#34C759` | iOS system green | Success confirmations | 6 | 10+ |
| `#FF9500` | iOS orange | In-transit, pending | 6 | 11+ |
| `#6200EE` | Material Design v2 purple | Supervisor drawer tint | 1 | 1 |

**None of these belong in a Material Design 3 app.** They leak in from copy-pasted snippets and tutorial code.

**Fix**: Add a defined extended palette to `src/theme/colors.ts` and replace:

```typescript
// Additions to COLORS — extended status palette
BLUE_SECONDARY:    '#1976D2',   // replaces #1976D2, #007AFF, #3B82F6 → use one blue only
GREEN_ACCENT:      '#10B981',   // replaces #34C759, #10B981 → use one accent green
RED_DANGER:        '#FF3B30',   // replaces #FF3B30 (iOS red) — keep as alias to ERROR or merge
AMBER_CAUTION:     '#F59E0B',   // replaces #F59E0B, #FF9500 → one amber
CYAN_INFO:         '#00BCD4',   // replaces #00BCD4
PURPLE_ACCENT:     '#8B5CF6',   // replaces #8B5CF6
```

Longer term: consolidate `BLUE_SECONDARY` + `INFO` into one blue, `GREEN_ACCENT` + `SUCCESS` into one green, etc. — the app should have **1 color per semantic meaning**.

**Worst files to fix first** (highest hardcoded color count):

| File | Count | Role |
|------|-------|------|
| `src/logistics/EquipmentManagementScreen.tsx` | 65 | Logistics |
| `src/logistics/RfqDetailScreen.tsx` | 64 | Logistics |
| `src/logistics/DoorsDetailScreen.tsx` | 60 | Logistics |
| `src/manager/ManagerDashboardScreen.tsx` | 57 | Manager |
| `src/manager/TeamManagementScreen.tsx` | 54 | Manager |
| `src/logistics/LogisticsDashboardScreen.tsx` | 52 | Logistics |
| `src/logistics/RfqListScreen.tsx` | 47 | Logistics |
| `src/commercial/vendor-payment/VendorPaymentScreen.tsx` | 42 | Commercial |
| `src/commercial/final-bill/FinalBillScreen.tsx` | 40 | Commercial |
| `src/commercial/ipc-readiness/MilestoneReadinessScreen.tsx` | 39 | Commercial |

---

### 🔴 ISSUE-14 — No custom react-native-paper theme configured

**Problem**: The app uses `<PaperProvider>` with no custom theme object. This means:
- Paper components render with MD3 default colors (teal/lavender) not the app's purple brand
- `theme.colors.primary` in components returns the MD3 default, NOT `COLORS.PRIMARY`
- Any Paper component that auto-applies primary color (FABs, Chips, ProgressBar, Switch, CheckBox) will look inconsistent with the manually-colored header

**Current state**:
```tsx
// App.tsx — no theme passed
<PaperProvider>
  ...
</PaperProvider>
```

**Fix**: Create `src/theme/paperTheme.ts` and pass it to PaperProvider:

```typescript
// src/theme/paperTheme.ts
import { MD3LightTheme } from 'react-native-paper';
import { COLORS } from './colors';

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary:          COLORS.PRIMARY,
    primaryContainer: COLORS.PRIMARY_LIGHT,
    secondary:        COLORS.INFO,
    error:            COLORS.ERROR,
    errorContainer:   COLORS.ERROR_BG,
    background:       COLORS.BACKGROUND,
    surface:          COLORS.SURFACE,
    outline:          COLORS.BORDER,
    onPrimary:        '#FFFFFF',
    onBackground:     COLORS.TEXT_PRIMARY,
    onSurface:        COLORS.TEXT_PRIMARY,
  },
};
```

```tsx
// App.tsx
import { appTheme } from './src/theme/paperTheme';
<PaperProvider theme={appTheme}>
```

**Impact**: Once this is done, ALL Paper components (ProgressBar, Chip, Switch, FAB, Button, etc.) automatically use the correct brand purple with no per-component color prop needed.

---

### 🟡 ISSUE-15 — Supervisor drawer uses hardcoded `#6200ee`

**Problem**: `SupervisorDrawerNavigator.tsx` sets `drawerActiveTintColor: '#6200ee'` — this is the old Material Design v2 purple, not `COLORS.PRIMARY` (`#673AB7`).

**Fix**: One-line change:
```typescript
// Before
drawerActiveTintColor: '#6200ee',

// After
drawerActiveTintColor: COLORS.PRIMARY,
```

---

### Color Migration Strategy

**Phase A — Quick wins (existing COLORS constants, ~2,339 instances)**
Use find-and-replace per file. Can be done systematically without visual review.
```
'#333333' | '#333'   → COLORS.TEXT_PRIMARY
'#666666' | '#666'   → COLORS.TEXT_SECONDARY
'#999999' | '#999'   → COLORS.TEXT_TERTIARY
'#FFFFFF' | '#FFF' | '#fff'  → COLORS.SURFACE
'#F5F5F5' | '#f5f5f5'  → COLORS.BACKGROUND
'#E0E0E0' | '#e0e0e0'  → COLORS.BORDER
'#EEEEEE' | '#eeeeee'  → COLORS.DIVIDER
'#F44336'  → COLORS.ERROR
'#4CAF50'  → COLORS.SUCCESS
'#FF9800'  → COLORS.WARNING
'#2196F3'  → COLORS.INFO
'#9E9E9E'  → COLORS.DISABLED
```

**Phase B — Extended palette additions (~1,579 remaining instances)**
1. Add 6 new constants to `COLORS` (see ISSUE-13 above)
2. Replace top-10 files manually (650+ instances)
3. Remaining files iteratively

**Phase C — Paper theme (unblocks all Paper component colors)**
Configure `paperTheme.ts` and pass to `<PaperProvider>` — eliminates need for explicit `color` props on Paper components.

---

## Fix Priority & Effort Estimate (Updated)

| # | Issue | Priority | Effort | Screens affected |
|---|-------|----------|--------|-----------------|
| 01 | Header show/hide | 🔴 High | ~2 days | Design Engineer (all tabs), Supervisor (all tabs) |
| 02 | Alert vs Snackbar | 🔴 High | ~3 days | Design Eng, Logistics, Manager, Commercial (30+ screens) |
| 03 | Loading states | 🔴 High | ~2 days | All roles — replace inline ActivityIndicator |
| 12 | Phase 2 COLORS not used | 🔴 High | ~3 days | 400+ files, ~2,339 instances |
| 13 | iOS/Material color mix | 🔴 High | ~3 days | Top 10 files + extended palette definition |
| 14 | No Paper theme | 🔴 High | ~0.5 day | App.tsx + new paperTheme.ts |
| 04 | EmptyState | 🟡 Medium | ~0.5 day | Commercial, Admin dashboards |
| 05 | Card elevation | 🟡 Medium | ~1 day | All list screens |
| 06 | FAB strategy | 🟡 Medium | ~1 day | All list/management screens |
| 08 | Screen titles | 🟡 Medium | ~0.5 day | Admin tabs + scattered screens |
| 15 | Supervisor drawer tint | 🟡 Medium | ~0.1 day | 1 line in SupervisorDrawerNavigator |
| 09 | Pull-to-refresh | 🟢 Low | ~0.5 day | Supervisor only (after ISSUE-01) |
| 10 | Admin tutorial | 🟢 Low | Skip | — |
| 11 | Typography scale | 🟢 Low | ~1 day | KPI cards, section headers |

**Total estimated effort**: ~18 working days

---

## Recommended Fix Order (Updated)

### Sprint 1 — Foundation: Theme & Color (Days 1–4)
1. **ISSUE-14**: Create `paperTheme.ts`, wire to `PaperProvider` *(unlocks Phase A replacements)*
2. **ISSUE-12**: Phase A color replacement — find-replace all known COLORS constants (~2,339 instances)
3. **ISSUE-15**: Fix Supervisor drawer `#6200ee` → `COLORS.PRIMARY`

### Sprint 2 — Critical structural fixes (Days 5–9)
4. **ISSUE-13**: Add extended palette to COLORS; fix top-10 hardcoded-color files
5. **ISSUE-01**: Move Design Engineer and Supervisor to standard `headerShown: true`
6. **ISSUE-02**: Enforce Alert/Snackbar rule across Logistics, Design Eng, Manager, Commercial

### Sprint 3 — Loading & Empty states (Days 10–13)
7. **ISSUE-03**: Create `LoadingState` component; replace bare `ActivityIndicator` calls
8. **ISSUE-04**: Replace custom EmptyState variants with shared `EmptyState`
9. **ISSUE-05**: Create `CARD_STYLES` constant; apply `mode="elevated"` uniformly

### Sprint 4 — Final polish (Days 14–18)
10. **ISSUE-06**: Define and implement create-action pattern (header button or FAB)
11. **ISSUE-08**: Fix Admin tab labels; standardize screen title format
12. **ISSUE-09**: Supervisor pull-to-refresh standardization
13. **ISSUE-11**: Typography scale audit

---

## Uniformity Checklist (use per screen before App Store submission)

For each screen, verify:

**Colors & Theme**
- [ ] No hardcoded hex colors in StyleSheet — all use `COLORS.*` constants
- [ ] `COLORS.PRIMARY` used for header background (not `theme.colors.primary`, not `#673AB7`)
- [ ] `COLORS.TEXT_PRIMARY` / `TEXT_SECONDARY` / `TEXT_TERTIARY` used for all text colors
- [ ] `COLORS.SURFACE` for card/surface backgrounds (not `#FFF`)
- [ ] `COLORS.BACKGROUND` for screen background (not `#F5F5F5`)
- [ ] `COLORS.BORDER` for borders/dividers (not `#E0E0E0`)
- [ ] Status colors use semantic COLORS constants (SUCCESS, ERROR, WARNING, INFO)
- [ ] No iOS colors (`#007AFF`, `#FF3B30`, `#34C759`) — use Material Design equivalents

**Navigation**
- [ ] Header shown via navigator (not custom component)
- [ ] Header title is plain text, correct naming convention
- [ ] Drawer active tint = `COLORS.PRIMARY`

**Feedback**
- [ ] Success messages → `Snackbar`
- [ ] Non-destructive errors → `Snackbar`
- [ ] Destructive actions → `Alert.alert` with confirm/cancel only

**Loading & Empty**
- [ ] Initial load → `<LoadingState variant="screen" />`
- [ ] Empty list → `<EmptyState>` shared component (not custom)
- [ ] Pull-to-refresh → `<RefreshControl>` in `FlatList`

**Components**
- [ ] All `<Card>` → `mode="elevated"` + `CARD_STYLES.default`
- [ ] Create/add action → `headerRight` `IconButton` (icon: `plus`)
- [ ] Typography matches scale (headlineMedium → KPIs, titleMedium → sections, bodyMedium → cards)

---

## Files to Create / Modify

### New files
- `src/theme/paperTheme.ts` — custom MD3 Paper theme wired to COLORS
- `src/theme/cardStyles.ts` — shared card style constants
- `src/components/common/LoadingState.tsx` — unified loading component (screen / inline / skeleton)

### Key files to modify
- `src/App.tsx` — pass `appTheme` to `<PaperProvider theme={appTheme}>`
- `src/theme/colors.ts` — add extended palette constants (BLUE_SECONDARY, GREEN_ACCENT, AMBER_CAUTION, CYAN_INFO, PURPLE_ACCENT, RED_DANGER)
- `src/nav/SupervisorDrawerNavigator.tsx` — fix `#6200ee` → `COLORS.PRIMARY`; `headerShown: true`
- `src/nav/DesignEngineerDrawerNavigator.tsx` — `headerShown: true` for all tabs
- `src/commercial/dashboard/CommercialDashboardScreen.tsx` — use shared `EmptyState`
- `src/admin/dashboard/AdminDashboardScreen.tsx` — use shared `EmptyState`, fix tab labels
- Top 10 high-color-count screens (Logistics × 4, Manager × 2, Commercial × 4) — COLORS migration
- 30+ screens in Logistics, Design Eng, Manager, Commercial — Alert → Snackbar for non-destructive feedback

---

## Sprint Workflow (apply to every sprint)

Each sprint must follow this process before merging to `main`.

### Branch naming convention
```
fix/ui-sprint-1-theme-colors
fix/ui-sprint-2-headers-feedback
fix/ui-sprint-3-loading-empty
fix/ui-sprint-4-polish
```

### Per-sprint gate checklist

#### 1. TypeScript — zero errors in `src/`
```bash
npx tsc --noEmit
```
- Must report **0 errors** in `src/` before PR is opened.
- Errors in `__tests__/` or `models/UserModel.ts` are pre-existing and excluded.

#### 2. ESLint — no new warnings
```bash
npm run lint
```
- No new lint errors introduced by the sprint changes.
- Fix any lint warnings in files you touch (don't leave them worse than you found them).

#### 3. Jest tests — all passing
```bash
npm test
```
- All existing tests must continue to pass.
- If a sprint change breaks a test, fix the test (or the code) before merging.
- New shared components (`LoadingState`, `cardStyles`, `paperTheme`) should have at minimum a render smoke test.

#### 4. Visual review — check each changed screen on device/emulator
- Open every role that had files changed in the sprint.
- Verify: no visual regressions, colors look correct, headers render consistently.
- Pay special attention after Sprint 1 (Paper theme change affects every Paper component app-wide).

#### 5. PR description must include
- List of issues fixed (e.g., "Fixes ISSUE-12, ISSUE-14, ISSUE-15")
- Before/after screenshots for any visual change (header, card, color)
- TypeScript error count: `0 errors in src/`
- Test result: `X tests passed, 0 failed`

### Post-merge documentation update

After each sprint merges to `main`, update `docs/architecture/ARCHITECTURE_UNIFIED.md`:

| Sprint | Documentation updates required |
|--------|-------------------------------|
| Sprint 1 | Add `src/theme/paperTheme.ts` to project structure; update "Data Layer → Color & Theme" note; mark Phase 2 colors as active (not migration target) |
| Sprint 2 | Update "Navigation Architecture" — Supervisor & Design Engineer header pattern; update per-role Alert/Snackbar rule in Role Modules section |
| Sprint 3 | Add `LoadingState.tsx` to Shared Components table; remove references to bare `ActivityIndicator` pattern |
| Sprint 4 | Update Shared Components if FAB formalized; update typography scale note |

`README.md` — no update needed for any sprint unless new user-facing setup steps are introduced (none expected).
