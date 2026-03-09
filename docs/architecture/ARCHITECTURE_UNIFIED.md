# Construction Site Progress Tracker — Unified Architecture

**Version**: Current (March 2026)
**Database Schema**: v52 (commercial advanced billing migrations through v54)
**Platform**: React Native (Android & iOS)

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Data Layer](#data-layer)
4. [Navigation Architecture](#navigation-architecture)
5. [State Management](#state-management)
6. [Service Layer](#service-layer)
7. [Sync & Network](#sync--network)
8. [Role Modules](#role-modules)
9. [Shared Components & Hooks](#shared-components--hooks)
10. [TypeScript Quality Gate](#typescript-quality-gate)
11. [Demo Data](#demo-data)

---

## Overview

An offline-first React Native app for infrastructure construction project management (rail, OHE, TSS). Data is stored locally in WatermelonDB (SQLite) and synced when online. The app has 7 user roles, each with a dedicated navigator, screens, and context.

**Entity hierarchy**: Project → Domains → Sites → Items (WBS) / KeyDates / DesignDocuments

---

## Project Structure

```
site_progress_tracker/
├── android/                    # Android native
├── ios/                        # iOS native
├── models/                     # WatermelonDB models & schema (root-level)
│   ├── migrations/             # v{N}_name.ts migration files
│   │   └── index.js            # Migration registry
│   ├── schema/index.ts         # Schema v52 definition
│   ├── database.ts             # DB initialization
│   ├── ProjectModel.ts
│   ├── DomainModel.ts          # v44 — domain grouping
│   ├── SiteModel.ts
│   ├── ItemModel.ts            # WBS items; design_document_id FK (v50)
│   ├── KeyDateModel.ts
│   ├── DesignDocumentModel.ts
│   ├── DesignDocumentCategoryModel.ts
│   ├── DoorsPackageModel.ts
│   ├── RfqModel.ts
│   ├── BomModel.ts / BomItemModel.ts
│   ├── PurchaseOrderModel.ts
│   ├── ChangeOrderModel.ts     # v49
│   ├── InvoiceModel.ts         # v52
│   ├── AdvanceModel.ts         # v53
│   ├── RetentionModel.ts       # v53
│   ├── VariationOrderModel.ts  # v54
│   ├── SyncQueueModel.ts       # pending = synced_at IS NULL
│   ├── UserModel.ts
│   ├── RoleModel.ts
│   └── ...
├── services/                   # Root-level application services
│   ├── db/
│   │   ├── SimpleDatabaseService.ts   # Initialization & default data seed
│   │   └── DatabaseService.ts
│   ├── network/
│   │   └── NetworkMonitor.ts          # addListener((isConnected, type) => void)
│   ├── sync/
│   │   ├── AutoSyncManager.ts         # addListener(state), getSyncState(), manualSync()
│   │   └── SyncService.ts
│   ├── planning/
│   │   ├── PlanningService.ts         # Critical path (Kahn's), metrics, forecasting
│   │   └── WBSCodeGenerator.ts
│   ├── BomImportExportService.ts
│   ├── BomDoorsLinkingService.ts
│   ├── RfqService.ts
│   └── ...
├── src/                        # Application source (all TypeScript)
│   ├── admin/
│   ├── auth/
│   ├── commercial/
│   ├── components/             # Shared components
│   ├── design_engineer/
│   ├── logistics/
│   ├── manager/
│   ├── nav/                    # All navigators
│   ├── planning/
│   ├── services/               # src-level services (LoggingService, DemoDataService, etc.)
│   ├── supervisor/
│   ├── theme/
│   │   ├── colors.ts           # COLORS constants — single source of truth
│   │   ├── paperTheme.ts       # Custom MD3 Paper theme wired to COLORS (PR #217)
│   │   └── index.ts            # Re-exports COLORS, appTheme, ColorKey, AppTheme
│   ├── tutorial/
│   ├── types/
│   └── utils/
├── __tests__/                  # Jest tests (excluded from TS gate)
├── docs/                       # Architecture & implementation docs
└── supabase/                   # Edge functions (password reset email)
```

---

## Data Layer

### WatermelonDB (offline-first)
- All reads/writes via model collections — never raw SQL
- Record creation pattern: `collection.create((record: any) => { record.field = value; })`
- New records always include `appSyncStatus: 'pending'` for sync tracking
- `database.write()` required for all mutations including `database.unsafeResetDatabase()`

### Schema Migrations

| Version | Change |
|---------|--------|
| v36 | Design documents & categories |
| v44 | Domains (Project → Domain → Site hierarchy) |
| v48 | `design_documents.doors_package_id` (doc-DOORS link) |
| v49 | `change_orders` table |
| v50 | `items.design_document_id` (WBS-DesignDoc link) |
| v52 | Invoices extended + projects commercial fields |
| v53 | `advances` + `retentions` tables |
| v54 | `variation_orders` table |

### Key Model Notes
- **`_version`** (underscore): BomModel, BomItemModel, RfqModel — used for sync tracking
- **`version`** (no underscore): PurchaseOrderModel
- **`user.userId`** (not `user.id`) for auth user ID throughout the app
- **SyncQueue** pending query: `Q.where('synced_at', Q.eq(null))`

### Color & Theme System (PR #217)

**`src/theme/colors.ts`** — single source of truth for all colour values. Import as:
```typescript
import { COLORS } from '../../theme/colors'; // adjust depth
```

**`src/theme/paperTheme.ts`** — custom MD3 Light theme wired to `COLORS`. Passed to `<PaperProvider theme={appTheme}>` in `App.tsx`. Effect: all Paper components (Button, Chip, ProgressBar, FAB, Switch, Appbar) automatically use brand purple with no per-component `color` props needed.

**Rule**: all StyleSheet colour values must use `COLORS.*` constants — no hardcoded hex. Current migration status tracked in `UI_UX_UNIFORMITY_PLAN.md` (ISSUE-12/13).

**`SupervisorHeader`** (`src/components/common/SupervisorHeader.tsx`): uses `<Appbar.Header>` from Paper. Title must use `titleStyle={{ color: COLORS.SURFACE }}` explicitly — Paper's MD3 `Appbar.Content` defaults to `onSurface` (dark) even on a primary-coloured background unless told otherwise. React Navigation native headers handle this automatically via `headerTintColor`.

---

## Navigation Architecture

Each role has a dedicated Drawer + Tab navigator in `src/nav/`.

```
MainNavigator
├── AuthNavigator       # Login, ForgotPassword, ResetPassword
├── AdminNavigator      # Drawer + tabs: Dashboard, Users, Projects, SyncMonitor
├── PlanningDrawerNavigator
│   └── Tabs: Dashboard | Key Dates | Schedule | Gantt Chart
│   Drawer: Site Management | WBS Management | Milestone Tracking | Baseline | Resource Planning
├── DesignEngineerDrawerNavigator
│   └── Tabs: Dashboard | Design Documents | DOORS Packages | RFQ
│   Drawer: (site management via tab)
├── SupervisorDrawerNavigator
│   └── Tabs: Dashboard | Items | Daily Reports | Hindrance Reports | Site Inspection | Materials
│   Drawer: Reports History | Activity Templates | Site Management
├── ManagerDrawerNavigator
│   └── Tabs: Dashboard | BOM Management | BOM Import Wizard | Change Orders
│   Drawer: Design Doc Approvals
├── LogisticsDrawerNavigator
│   └── Tabs: Dashboard | Material Tracking | DOORS | RFQ
│   Drawer: Inventory | Delivery Scheduling | Analytics
└── CommercialDrawerNavigator
    └── Tabs: Dashboard
    Drawer: KD Billing | LD Risk | Advance Recovery | Retention Monitor
            Variation Orders | Vendor Payments | Cash Flow Forecast
            IPC Readiness | Final Bill
```

### Drawer Header Pattern
- Design Engineer, Planning, Logistics, Manager navigators: visible drawer header with `headerRight` showing **SyncHeaderButton** + logout
- Supervisor, Commercial navigators: `headerShown: false` (custom header in screens)
- Admin navigator: standard tabs, no SyncHeaderButton

### SyncHeaderButton (`src/nav/SyncHeaderButton.tsx`)
Subscribes to `AutoSyncManager`, shows sync/loading icon + red badge for pending `SyncQueue` items.

---

## State Management

### Per-screen `useReducer` pattern
Every major screen uses a dedicated reducer in `state/` subfolder:
```
screen/
  state/
    screenReducer.ts    # reducer + initial state
    screenActions.ts    # action type constants (optional)
  hooks/
    useScreenData.ts    # data fetching + dispatch
    useScreenForm.ts    # form state + validation
```

### Context providers
Each role has a context at `src/<role>/context/<Role>Context.tsx`:
- `PlanningContext`: `projectId`, `selectedSiteId`, `selectProject`
- `ManagerContext` (also exported as `useManager`): project, BOM state
- `SupervisorContext` / `SiteContext`: persistent site selection across tabs
- `CommercialContext`: project, contract config
- `AdminContext`: `AdminRole` type, `selectedRole`

### Reactive data hooks
```typescript
// Pattern for reactive updates without loading-skeleton flicker:
useEffect(() => {
  const sub = database.withChangesForTables(['table_name']).subscribe(() => {
    fetchData(true); // silentUpdate = true → skip loading spinner
  });
  return () => sub.unsubscribe();
}, []);
```

---

## Service Layer

### `src/services/DemoDataService.ts`
- One generator per role: `generatePlannerDemoData`, `generateDesignerDemoData`, `generateSupervisorDemoData`, `generateManagerDemoData`, `generateLogisticsData`, `generateCommercialManagerDemoData`
- All use `database.write()` atomic transactions
- Commercial generator is admin-triggered only; commercial config also set in `SimpleDatabaseService._doInitialize()` so dashboards work without demo data

### `src/services/TemplateService.ts`
- `seedPredefinedTemplates()`: 2 templates (TSS Substation 18 items, OHE Zone 1 15 items), each item has bundled `TemplateMaterial[]`
- `applyTemplateToSite()` → returns `{ created, skipped, materialsCreated }`
- Seed upgrade: checks `items.every(i => !i.materials)` before patching JSON in place

### `src/services/LoggingService.ts`
- 4 log levels: DEBUG, INFO, WARN, ERROR
- `logger.error('msg', error as Error)` — errors must be cast
- Primitive context values wrapped: `logger.info('msg', { value: primitive })`

### `SimpleDatabaseService`
- `initializeDefaultData()`: seeds 7 default users, roles, and project config
- `_doInitialize()`: sets commercial config fields (`contractValue` etc.) directly on project

---

## Sync & Network

```
NetworkMonitor (services/network/)
  .addListener((isConnected: boolean, connectionType: string) => void): () => void

AutoSyncManager (services/sync/)
  .addListener((state: SyncState) => void): () => void
  .getSyncState(): SyncState
  .manualSync(): Promise<void>

SyncQueue (models/SyncQueueModel.ts)
  table: sync_queue
  pending = Q.where('synced_at', Q.eq(null))
```

**OfflineBanner** (`src/components/common/OfflineBanner.tsx`): self-contained, subscribes to `NetworkMonitor`, auto-shown when offline. Mounted once in `App.tsx`.

---

## Role Modules

### Admin (`src/admin/`)
- Dashboard: project/site/user/item counts via `database.collections.get(table).query().fetch()`
- DB reset: `database.write(() => database.unsafeResetDatabase())` → `AsyncStorage.clear()` → `SimpleDatabaseService.initializeDefaultData()`
- Password migration: `PasswordMigrationService.hashAllPasswords()` + `verifyMigration()`
- Category migration: `migrateCategoryNames()` + `verifyCategoryMigration()`
- Role navigation: `ROLE_NAVIGATION_MAP[role]` in `src/admin/dashboard/utils.ts`

### Planner (`src/planning/`)
- **Key Dates**: CMRL categories (G/A/B/C/D/E/F); dual-track progress: `siteProgress × (1 − designWeightage/100) + docProgress × (designWeightage/100)`
- **Project progress**: `Σ(kd.weightage × kdProgress) / Σ(kd.weightage)` — displayed with `toFixed(1)` (not `Math.round`)
- **Gantt Chart** (`src/planning/GanttChartScreen.tsx`):
  - Sub-tabs: Tasks | Key Dates (via `SegmentedButtons`)
  - Scroll sync: `GanttHeader` master → `TaskRow`/`KeyDateMilestoneRow` slaves via `rowScrollRefs`
  - `useGanttTimeline(items, zoomLevel, externalBounds?)` — Key Dates tab passes `externalBounds` from `targetDate` timestamps
  - `GanttLegend` variant: `'tasks'` | `'key_dates'`
  - `GanttHeader` `leftColumnLabel` prop: default `'Task'`, Key Dates passes `'Key Date'`
- **Dashboard widgets**: `ProjectProgressWidget` shows KD-weighted breakdown; uses `KDBreakdownItem[]` from `hooks`

### Design Engineer (`src/design_engineer/`)
- **Design Documents**: 4 types; approval states: `draft | submitted | approved | approved_with_comment | rejected`
- **Action matrix**: `draft` → Edit+Delete+Submit; `submitted` → Approve+ApproveWithComment+Reject; `approved` → Edit (weightage enabled); `approved_with_comment | rejected` → Revise (latest revision only)
- **Site rule**: `SITE_REQUIRED_TYPES = ['installation', 'as_built']` controls whether site is mandatory; ALL types save `rec.siteId = siteId || null`
- **Weightage**: `weightageNum ?? null` (not `|| null`) — preserves explicit `0`
- **6 templates**: `mre_{tss|ocs}_{studies|installation|product}` in `src/design_engineer/data/documentTemplates.ts`
- **Doc-DOORS link** (v48): purple chip on `DesignDocumentCard`; DOORS picker in `CreateDesignDocumentDialog`
- **Dashboard → tab navigation**: `navigation.navigate('DesignDocuments', { statusFilter: 'rejected' })` → reads `route.params?.statusFilter` → clears via `navigation.setParams`; active filter shown as dismissible chip

### Supervisor (`src/supervisor/`)
- **SiteContext**: persistent site selection across tabs — `updateContext={false}` in Gantt to prevent double re-render
- **Activity Templates**: `TemplateMaterial { name, quantityRequired, unit, supplier? }` in `TemplateModuleModel.ts`; `applyTemplateToSite()` auto-creates materials
- **Material Suggestions**: `MaterialSuggestionsService.getSuggestionsForItem(name, category?)` pattern-match; `MaterialSuggestionsDialog` multi-select checklist; chips in MaterialTrackingScreen Add dialog
- **WBS-DesignDoc link** (v50): `ItemModel.designDocumentId` FK; if linked doc is approved and `completedQuantity === 0`, `loadItems()` auto-sets to `plannedQuantity`; "Link Design Doc" in 3-dot menu opens Portal+Dialog picker
- **Tutorial**: `useFocusEffect` checks `TutorialService.shouldShowTutorial` on every focus; drawer "Restart Tutorial" calls `navigation.closeDrawer()` only

### Manager (`src/manager/`)
- **ManagerContext** exported as both `useManagerContext` and `useManager`
- **ChangeOrders** (v49): reactive via `withChangesForTables(['change_orders'])`; silent refresh on changes, pull-to-refresh calls `loadOrders(false)`
- **Pending Approvals KPI**: `fetchCount()` on submitted design docs; highlighted `kpiCardActionable` border when count > 0; `onPress` → `navigation.navigate('DesignDocApprovals')`
- **BOM Import auth path**: `useAuth` imported from `'../../../auth/AuthContext'` (3 levels up from `src/manager/bom-import-wizard/hooks/`)

### Logistics (`src/logistics/`)
- **Discipline routing** in demo data:
  ```typescript
  const tssSiteIds = new Set(sites.filter(s => s.name.includes('TSS')).map(s => s.id));
  const oheSiteIds = new Set(sites.filter(s => s.name.includes('OHE')).map(s => s.id));
  ```
  Materials carry `discipline: 'tss' | 'ohe' | 'general'` → routed to matching site IDs
- **DOORS categories**: OHE, TSS, SCADA, Cables, Hardware, Consumables — in `types/DoorsPackageTypes.ts`

### Commercial (`src/commercial/`)
- **CommercialRiskWidget**: auto-detects up to 6 risks sorted by severity; top 3 displayed
  - Risk 1: LD exposure (delayed KDs); Risk 2: Cost overrun; Risk 3: Low retention
  - Risk 4: Low advance balance; Risk 5: Pending IPCs (`invoiceType === 'ipc' && paymentStatus === 'pending'`)
  - Risk 6: Slow-paying vendors
- **IPC Readiness** (`MilestoneReadinessScreen`):
  - `billedKdIds` Set from invoices where `invoiceType === 'ipc'`
  - Already-billed KDs: compact card with "IPC-XXX Raised ✓" badge (no checklist)
  - VO fallback: `linkedVOs.length > 0 ? linkedVOs : allVOs` (project-level unapproved VOs when KD has no `linkedKdId`)
- **Vendor Payments**: `isPending = inv.paymentStatus !== 'paid'` (catches `'overdue'` status); vendor matched by `vendorName` (not array index)
- **Advance Recovery**: IPC impact displayed as 3-column stacked grid (Gross Bill / Advance Recovery / Net Payable)

---

## Shared Components & Hooks

### `src/components/common/`
| Component | Purpose |
|-----------|---------|
| `ErrorBoundary.tsx` | Crash protection with "Try Again" recovery |
| `EmptyState.tsx` | Empty state with icon, message, optional action |
| `LoadingOverlay.tsx` | Full-screen blocking loading |
| `SyncStatusChip.tsx` | Color-coded sync status indicator |
| `OfflineBanner.tsx` | Auto-shown banner; subscribes to NetworkMonitor |

### `src/components/dialogs/`
| Dialog | Purpose |
|--------|---------|
| `FormDialog.tsx` | Reusable scrollable form wrapper |
| `PhotoPickerDialog.tsx` | Camera / gallery picker (Portal-based) |
| `ConfirmDialog.tsx` | Async-capable confirmation |
| `CopyItemsDialog.tsx` | Site selector + copy preview |
| `MaterialSuggestionsDialog.tsx` | Multi-select material suggestions checklist |

### `src/hooks/`
| Hook | Purpose |
|------|---------|
| `usePhotoUpload` | Camera/gallery capture, base64 handling |
| `useChecklist` | Checklist state with summary counts |
| `useFormValidation` | 9 validation rules, type-safe |
| `useOfflineSync` | Network monitoring + auto-sync trigger |

### `src/utils/statusConfig.ts`
Shared `STATUS_CONFIG` map `{ color, icon, label }` for RFQ + DOORS status chips — replaces per-component `getStatusColor` functions.

### Snackbar pattern
DOORS/RFQ screens use `useState` for snackbar (not reducer). All other screens use reducer-managed snackbar state.

---

## TypeScript Quality Gate

- **0 errors** in `src/` (enforced, checked in CI)
- ~238 errors in `__tests__/` and `models/UserModel.ts` — excluded from gate
- `src/types/globals.d.ts` declares `btoa`, `unescape`

### Common fix patterns
| Problem | Fix |
|---------|-----|
| `NodeJS.Timeout` not found | `ReturnType<typeof setInterval\|setTimeout>` |
| `logger` with unknown error | `error as Error` |
| `logger` with primitive context | `{ value: primitive }` |
| `Menu.Item` extra props | Remove `accessibilityRole`/`description` |
| `LogisticsContext` missing method | `selectProject` (not `setSelectedProjectId`) |

---

## Demo Data

### 3-site MRE Taxonomy (all 6 role generators aligned)
| # | Site | Location |
|---|------|---------|
| 1 | Simulation Studies | Project-Level — All Systems (design-level, not physical) |
| 2 | Traction Substation (TSS-01) | Zone 1 — North Block, Plot 14 |
| 3 | OHE Zone 1 — North Corridor | Zone 2 — North Corridor, Ch. 0+000 to 15+500 |

Supervisor uses only sites 2 & 3 (no Simulation Studies).

### Shared vendor taxonomy
| ID | Name | Supplies |
|----|------|---------|
| VND-PT-001 | PowerTech Industries | Transformers, HV equipment |
| VND-SG-002 | SwitchGear Solutions | Circuit breakers, control panels |
| VND-CC-003 | CableCo International | HT cables, rail bonds |
| VND-SS-004 | Structural Systems India | OHE masts, portal frames |

> Note: `RfqSeeder.ts` seeds additional vendors (Siemens Ltd., Schneider Electric) into the vendors table. Commercial invoice seeding must match vendors by `vendorName`, not by array index.

---

## Tutorial System

- Per-role step files: `src/tutorial/<role>TutorialSteps.ts` — import `TutorialStep` from `plannerTutorialSteps.ts`
- Integration: `TutorialModal` + `TutorialService` + `useFocusEffect` (NOT `useRoute`) in dashboard
- `useFocusEffect` re-checks `TutorialService.shouldShowTutorial` on every focus event
- Drawer "Restart Tutorial" calls `navigation.closeDrawer()` only — `useFocusEffect` handles the rest
- Auth user accessed via `useAuth` — uses `user.userId` (not `user.id`)
