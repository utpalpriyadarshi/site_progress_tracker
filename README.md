# Construction Site Progress Tracker

A React Native mobile application for managing construction site progress across multiple disciplines, with offline-first architecture, role-based access, and comprehensive commercial & planning modules.

## Overview

Built for infrastructure construction projects (rail, OHE, TSS systems), the app manages the full lifecycle from planning and design to construction execution, commercial billing, and handover. It operates fully offline using WatermelonDB with optional sync.

**Current schema version:** v54 (commercial advanced billing migrations: v52–v54)

---

## Roles & Modules

### 🔑 Admin
- User management (CRUD, role assignment, active/inactive)
- Project management with cascade deletion
- Role switching to test different user experiences
- Database reset & re-seed with default users
- Password migration (bcrypt hashing)
- Category name migration utilities

### 📋 Planner
- **Dashboard**: 9 widgets — milestones, critical path, unified WBS Progress (Summary / By Phase tabs), project KD-weighted progress, KD progress chart, KD timeline, site progress, resource utilization, recent activities
- **Key Dates**: Contract-level key dates (CMRL categories G/A/B/C/D/E/F), delay damages, weightage, per-site assignments, dual-track progress (site progress + design doc progress)
- **Schedule**: Timeline / Calendar / List views with site & critical-path filtering
- **Gantt Chart**: Interactive timeline with zoom (day/week/month); Tasks sub-tab (critical path, baseline overlay) + Key Dates sub-tab (diamond milestones, target-date bounds); scroll-synced header
- **WBS Management**: 4-level WBS codes; collapsible filter panel (phase / status / critical-path chips hidden by default behind a "Filters (N)" toggle); parent progress auto-rolls up from children on save; parent date changes propagate down to descendants (clamped); child creation pre-fills dates from parent
- **Drawer screens**: Site Management, WBS Management, Item Creation/Edit, Milestone Tracking, Baseline Planning (Kahn's algorithm, irreversible lock)
- Tutorials for new users

### 🏗️ Design Engineer
- **Dashboard**: Site doc progress widgets (approved/submitted/rejected counts), reactive updates; tap → filtered Design Documents tab
- **Design Documents**: 4 types (Simulation/Study, Installation, Product/Equipment, As-Built); approval workflow (Draft → Submitted → Approved / Approved with Comment / Rejected / Revise); revision history; DOORS package link (purple chip); site filtering
- **DOORS Packages**: Equipment specification tracking with compliance monitoring; 6 categories (OHE, TSS, SCADA, Cables, Hardware, Consumables); linked doc count badge
- **RFQ Management**: Procurement workflow with vendor management, status chips
- **6 Document Templates**: `mre_tss_studies`, `mre_tss_installation`, `mre_tss_product`, `mre_ocs_studies`, `mre_ocs_installation`, `mre_ocs_product`
- Tutorials for new users

### 👷 Supervisor
- **Dashboard**: Progress overview, quick actions (Report History, Site Inspection, Materials)
- **Daily Reports**: Progress logging with photo documentation, PDF generation & share, offline sync
- **Site Inspection**: Safety & quality checklists with photo documentation
- **Hindrance Reports**: Issue tracking with priority, photo attachments, item linking
- **WBS Items Management**: 4-level WBS with phases, categories (Handing Over, Punch List, etc.), baseline lock enforcement
- **Material Tracking**: BOM-integrated tracking, real-time inventory
- **Activity Templates**: 2 predefined templates (TSS Substation 18 items, OHE Zone 1 15 items) with bundled materials per activity; apply to sites with material auto-creation
- **Material Suggestions**: Pattern-match suggestions when adding items; bulk-create from checklist dialog
- Tutorials for new users

### 👔 Manager
- **Dashboard**: KPI cards (total items, pending approvals, BOM stats); Pending Approvals KPI with direct navigation; reactive updates
- **BOM Management**: Bill of Materials with version control (v1.0 → v2.0 → v3.0 on every edit); status workflow (pre-contract: draft → submitted → won/lost; post-contract: baseline → active → closed); item locking on locked statuses; Export to Excel with share sheet
- **BOM Import Wizard**: 5-step wizard (upload → map → validate → preview → import); RNFS-based CSV file picker from device Downloads folder; no native document-picker module required
- **Change Orders** (v49): Change order management with reactive list, status tracking, cost impact
- **Design Doc Approvals**: Review submitted design documents (Approve / Approve with Comment / Reject via prompt); reactive list
- **Financial Reports**: Budget overview, profitability analysis, cost breakdown by category; Export to Excel with share sheet
- Tutorials for new users

### 🚚 Logistics
- **Material Tracking**: BOM-integrated with real-time inventory, shipment tracking, analytics
- **Inventory Management**: 4-view system (Overview, Locations, Transfers, Analytics)
- **Delivery Scheduling**: Route optimization, delivery tracking, status management
- **DOORS Requirements**: Equipment specification tracking aligned with Design Engineer DOORS packages
- **RFQ Management**: Vendor management, procurement workflow
- Tutorials for new users

### 💰 Commercial Manager
- **Dashboard**: Contract KPI card (contract value, invoiced, retention, advance); Commercial Risk Widget (auto-detects up to 6 risks: LD exposure, cost overrun, low retention, low advance, pending IPCs, slow-paying vendors — top 3 by severity shown)
- **KD Billing** (`KDBillingScreen`): Raise IPC invoices against Key Dates; view billing history per KD
- **LD Risk** (`LDRiskScreen`): Liquidated damages exposure — delayed KDs with LD per day, at-risk KDs, total exposure
- **Advance Recovery** (`AdvanceRecoveryScreen`): Advance payment tracking with 3-column IPC impact (Gross Bill / Advance Recovery / Net Payable); recovery schedule
- **Retention Monitor** (`RetentionMonitorScreen`): Retention tracking per IPC, release schedule
- **Variation Orders** (`VariationOrdersScreen`): VO management with approval status, KD linking, cost impact
- **Vendor Payments** (`VendorPaymentScreen`): Vendor invoice list with overdue detection (`paymentStatus !== 'paid'`), aging analysis
- **Cash Flow Forecast** (`CashFlowForecastScreen`): Monthly inflow/outflow projection
- **IPC Readiness** (`MilestoneReadinessScreen`): KD readiness checklist (already-billed KDs show compact badge; new KDs show full 8-point checklist with VO approval fallback to project-level)
- **Final Bill** (`FinalBillScreen`): Final account summary
- Tutorials for new users

---

## Architecture

### Data Layer
- **WatermelonDB** (offline-first SQLite): all reads/writes go through models in `models/`
- **Schema v52** with migrations `v36` → `v54` in `models/migrations/`
- **Key models**: Project, Domain, Site, Item (WBS), KeyDate, DesignDocument, DoorsPackage, Rfq, BomItem, PurchaseOrder, ChangeOrder, Invoice, Advance, Retention, VariationOrder, SyncQueue
- **Domain hierarchy** (v44): Project → Domains → Sites. Default domains: Simulation Studies, OHE, PSY, SCADA, Civil

### Sync & Network
- **AutoSyncManager** (`services/sync/AutoSyncManager.ts`): manages sync state, manual trigger, listener pattern
- **SyncHeaderButton** (`src/nav/SyncHeaderButton.tsx`): sync/loading icon + red badge for pending items; shown in Design Engineer, Planning, Logistics navigators
- **OfflineBanner** (`src/components/common/OfflineBanner.tsx`): subscribes to `NetworkMonitor`, auto-shown when offline; mounted in App.tsx
- **SyncQueue** (`models/SyncQueueModel.ts`): `sync_queue` table; pending = `synced_at IS NULL`

### Navigation
- Each role has a dedicated Drawer+Tab navigator in `src/nav/`
- Admin → `AdminNavigator`; Planner → `PlanningDrawerNavigator`; Design Engineer → `DesignEngineerDrawerNavigator`; Supervisor → `SupervisorDrawerNavigator`; Manager → `ManagerDrawerNavigator`; Logistics → `LogisticsDrawerNavigator`; Commercial → `CommercialDrawerNavigator`
- Auth flow → `AuthNavigator` (Login, ForgotPassword, ResetPassword)

### State Management
- Per-screen `useReducer` pattern; hooks in `hooks/` folder per feature
- Dashboard data hooks use `database.withChangesForTables([...]).subscribe()` for reactive updates with `silentUpdate` flag to avoid loading-skeleton flicker

### TypeScript
- **0 errors** in `src/` (enforced gate); ~238 errors in `__tests__/` and `models/UserModel.ts` excluded from gate
- `src/types/globals.d.ts` declares `btoa`, `unescape`

---

## Database Migrations

| Version | Description |
|---------|-------------|
| v36 | Design documents & categories |
| v44 | Domains (Project → Domain → Site hierarchy) |
| v48 | Doc-DOORS link (`design_documents.doors_package_id`) |
| v49 | Change orders |
| v50 | WBS-DesignDoc link (`items.design_document_id`) |
| v52 | Invoices extended; projects commercial fields |
| v53 | Advances & retentions |
| v54 | Variation orders |

---

## Demo Data

Seeded via **Admin → Demo Data** card (role-specific generators in `src/services/DemoDataService.ts`).

**3-site MRE taxonomy** (consistent across all roles):
1. **Simulation Studies** — project-level, all systems
2. **Traction Substation (TSS-01)** — Zone 1, North Block
3. **OHE Zone 1 — North Corridor** — Zone 2, Ch. 0+000 to 15+500

**Shared vendors**: VND-PT-001 PowerTech, VND-SG-002 SwitchGear Solutions, VND-CC-003 CableCo International, VND-SS-004 Structural Systems India

**Commercial demo** (`generateCommercialManagerDemoData`): admin-only trigger. Commercial config (contract value etc.) is also set in `SimpleDatabaseService._doInitialize()` so the dashboard works without running demo data first.

---

## Default Users (after DB reset)

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@2025 | Admin |
| planner | Planner@2025 | Planner |
| designer | Designer@2025 | Design Engineer |
| supervisor | Supervisor@2025 | Supervisor |
| manager | Manager@2025 | Manager |
| logistics | Logistics@2025 | Logistics |
| commercial | Commercial@2025 | Commercial Manager |

> **DB Reset**: Uses `database.write(() => database.unsafeResetDatabase())` — must be inside a Writer context. Followed by `AsyncStorage.clear()` then `SimpleDatabaseService.initializeDefaultData()`.

---

## Getting Started

### Prerequisites
- Node.js 18+, Java 17, Android SDK
- React Native CLI (`@react-native-community/cli`)

### Install & Run

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android
```

### Key Scripts
```bash
npm start          # Metro bundler
npm run android    # Android build & launch
npm run ios        # iOS build & launch (macOS only)
npm test           # Jest tests
npm run lint       # ESLint
```

---

## Recent Changes (2026)

| Merge | Description |
|-------|-------------|
| #227 | WBS filter panel collapse; parent↔child progress rollup & date propagation; FAB style consistency; dashboard widget consolidation (10→9) |
| Mar 2026 | BOM import wizard wired end-to-end; RNFS CSV picker from Downloads; Finance export share sheet |
| Mar 2026 | BOM version control (v1.0→v2.0), status workflow, item locking; Manager header titles fixed; chip height clipping fixed |
| #223 | Admin tutorial, consolidated PDF report, header UI fix |
| #216 | Planner dashboard: KD progress uses `toFixed(1)` (11.65% → 11.7%) |
| #215 | DB reset: wrap `unsafeResetDatabase()` in `database.write()` Writer context |
| #214 | Commercial Phase 6A: KD progress parity, IPC-001 billing, Mark Complete |
| #213 | Commercial Phase 6A: advance impact layout (3-col) & IPC payment risk widget |
| #212 | Commercial Phase 6A: LD risk screen, LDRiskScreen key prop fix |
| #210 | Commercial Phase 6B: IPC Readiness (billed KD badge, VO check), Vendor Payments (overdue filter, vendor name match) |
| #196 | WBS-DesignDoc link (v50): FK, status chip, picker dialog |
| #189–190 | Gantt Key Dates tab: diamond milestones, target-date bounds |
| #167–171 | 3-site MRE taxonomy aligned across all 6 roles |

---

## Project Structure

```
src/
├── admin/              # Admin role screens & hooks
├── auth/               # Login, ForgotPassword, ResetPassword
├── commercial/         # Commercial Manager role (billing, risk, IPC, etc.)
│   ├── advance-recovery/
│   ├── cash-flow/
│   ├── dashboard/
│   ├── final-bill/
│   ├── ipc-readiness/
│   ├── kd-billing/
│   ├── ld-risk/
│   ├── retention-monitor/
│   ├── variation-orders/
│   └── vendor-payment/
├── components/         # Shared components (EmptyState, OfflineBanner, dialogs)
├── design_engineer/    # Design Engineer role
├── logistics/          # Logistics role
├── manager/            # Manager role (BOM, ChangeOrders, DocApprovals)
├── nav/                # Navigator files per role
├── planning/           # Planner role (Gantt, KDs, WBS, schedule)
├── services/           # DemoDataService, TemplateService, etc.
├── supervisor/         # Supervisor role (items, reports, templates)
├── theme/              # Colors, typography
├── tutorial/           # Per-role tutorial steps
├── types/              # Shared TypeScript types
└── utils/              # statusConfig, formatters, etc.

models/                 # WatermelonDB models & migrations
services/               # AutoSyncManager, NetworkMonitor (root-level)
```

---

## Documentation

- `docs/architecture/ARCHITECTURE_UNIFIED.md` — Unified architecture reference
- `docs/implementation/planning-module/PLANNING_WORKFLOW.md` — Planning module action flow
- `COMMERCIAL_ADVANCED_IMPLEMENTATION_PLAN.md` — Commercial Advanced Billing sprint plan
- `PLAN_DOORS_RFQ_IMPROVEMENTS.md` — DOORS/RFQ improvement roadmap (Sprints 2–5)
- `4_WEEK_IMPLEMENTATION_PLAN.md` — Current 4-week implementation plan
