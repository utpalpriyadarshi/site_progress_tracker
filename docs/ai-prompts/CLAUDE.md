# CLAUDE.md

Guidance for Claude Code when working with this repository. Maintain uniformity across all user roles.

## Project Overview

Construction Site Progress Tracker - React Native mobile app for construction site management with offline-first WatermelonDB. Role-based navigation for Supervisors, Managers, Planners, Logistics, Design Engineers, Commercial Managers.

**Current Version**: v2.12 (Design Documents feature complete)
**Last Updated**: February 2, 2026

## Development Commands

```bash
npm start                          # Metro bundler
npm run android                    # Run Android
npm run ios                        # Run iOS (macOS only)
npm install --legacy-peer-deps     # ALWAYS use --legacy-peer-deps
npx tsc --noEmit                   # ALWAYS run before committing
npm run lint                       # Lint
npm test                           # Tests
```

### Git Rules

- **NEVER delete branches** when merging PRs. Use `gh pr merge --merge` (no `--delete-branch`).
- **ALWAYS run `npx tsc --noEmit`** before every commit. Fix all errors or document why.
- Commit messages: descriptive title, bullet points for changes, note schema changes and known issues.

## Navigation Structure

`src/nav/MainNavigator.tsx` → AuthNavigator → Role-based bottom tab navigators:

| Role | Folder | Screens | Context |
|------|--------|---------|---------|
| Supervisor | `src/supervisor/` | 7 screens (Daily, Reports, Hindrance, Items, Materials, Sites, Inspection) | `SiteContext.tsx` |
| Manager | `src/manager/` | 5 screens (Overview, BOM, Team, Financial, Resources) | - |
| Planning | `src/planning/` | 7 tabs: Sites → WBS → Resources → Schedule → Gantt → Baseline → Milestones | - |
| Logistics | `src/logistics/` | 4 screens | - |
| Design Engineer | `src/design_engineer/` | 4 tabs (Dashboard, Design Docs, DOORS, Design RFQs) | `DesignEngineerContext.tsx` |
| Commercial | `src/commercial/` | 5 screens | - |

### Design Engineer Details

- **Dashboard**: 6 widgets (Design Doc status, DOORS status, RFQ status, Compliance, Processing Time, Recent Activity). Tap navigates to detail tabs.
- **Design Documents**: Full CRUD with approval workflow (Draft → Submitted → Approved/Rejected). Categories with sub-categories (document types). Manage Categories dialog with expandable CRUD.
- **DOORS Packages**: 100 requirements per package, status: pending/received/reviewed
- **Design RFQs**: Pre-PM200 engineering phase vendor quotes

### Planning Details (Workflow Order)

Planners create sites and assign supervisors. `supervisor_id` is optional in Sites table.

## Database (WatermelonDB)

**Schema**: `models/schema/index.ts` (version 25). Models in `/models/`, NOT `/src/db/`.
**Init**: `App.tsx` → `SimpleDatabaseService.initializeDefaultData()`

### Core Collections

`projects`, `sites`, `categories`, `items`, `progress_logs`, `hindrances`, `materials`, `daily_reports`, `boms`, `bom_items`, `doors_packages`, `rfqs`, `design_documents`, `design_document_categories`, `sync_queue`

### Key Relationships

Project → Sites, BOMs | Site → Items, Hindrances, DailyReports | Item → ProgressLogs, Materials | BOM → BOM Items

### Field Naming (CRITICAL)

- Schema columns: `snake_case` | Model properties: `camelCase` | Queries: `snake_case`
- Decorator: `@field('snake_case_column') camelCaseProperty!: type`
- `created_at/updated_at` are auto-managed — DO NOT declare in models
- Timestamps: use `@field` (NOT `@date`), set with `Date.now()`

```typescript
// Model
@field('supervisor_id') supervisorId!: string;

// Create record — use camelCase
site.supervisorId = 'supervisor-1';  // CORRECT
site.supervisor_id = 'supervisor-1'; // WRONG — saves empty

// Query — use snake_case
Q.where('site_id', siteId)
```

### Sync (appSyncStatus)

WatermelonDB has built-in `syncStatus` (read-only). Our custom field is `appSyncStatus`:
- Pattern: `@field('sync_status') appSyncStatus!: string`
- Values: `'pending'` | `'synced'` | `'failed'`
- Applies to all 10 syncable models. NEVER use `record.syncStatus`.

### TypeScript/Babel Config

Requires decorator support: `experimentalDecorators: true`, `emitDecoratorMetadata: true` in tsconfig. Babel plugins: `@babel/plugin-proposal-decorators` (legacy), `@babel/plugin-transform-class-properties` (loose).

## UI Patterns (CRITICAL — Apply to ALL Roles)

### Status Badge

```typescript
import { Chip } from 'react-native-paper';
<Chip mode="flat" style={{ backgroundColor: getStatusColor(status) }}
  textStyle={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
  {status.toUpperCase()}
</Chip>
```

DO NOT use custom View+Text badges. Let Paper handle padding/sizing.

### Screen Header

Blue header (`#007AFF`), paddingTop: 50, project name + screen label + logout button. No navigator headers — only internal screen headers.

### Empty States

Use `EmptyState` component with context-aware variants: no data (icon + action), no search results (variant="search"), no filter results (clear filters action).

### Widget System (Design Engineer Dashboard)

All widgets extend `BaseWidget` (loading/error/refresh/onPress). Data fetched via `use*Data` hooks in `dashboard/hooks/useWidgetData.ts`.

### Forms with Dropdowns

Use `react-native-paper` `Menu` with `useState` for visibility. Wrap anchor in `TouchableOpacity`.

## Service Layer

| Location | Purpose |
|----------|---------|
| `/services/db/DatabaseService.ts` | Database operations (lazy loading via `getDatabase()`) |
| `/services/db/SimpleDatabaseService.ts` | Initialization |
| `/services/sync/SyncService.ts` | Bidirectional sync with conflict resolution |
| `/src/services/LoggingService.ts` | Centralized logging |
| `/src/services/BomDataService.ts` | BOM CRUD |
| `/src/services/BomImportExportService.ts` | Excel export (2-sheet workbook) |

## Logging

Use `logger` from `src/services/LoggingService.ts`. NEVER use `console.log`.

```typescript
import { logger } from '../services/LoggingService';
logger.debug('msg', { component: 'Name', action: 'method' });
logger.info('Created', { component, action, id });
logger.warn('Validation failed', { component, action });
logger.error('Failed', error as Error, { component, action });
```

Wrap screens in `ErrorBoundary` (`src/components/common/ErrorBoundary.tsx`) for crash isolation.

## Modular Architecture Pattern

Large screens (800+ lines) should be broken into modules. Target: 200-300 line main files.

```
src/{role}/{screen_name}/
├── {Screen}Screen.tsx        # Main coordinator
├── components/               # Form, List, Card, Dialog components
│   └── index.ts              # Barrel exports
├── hooks/                    # use{Feature}Data, use{Feature}Form
│   └── index.ts
├── utils/                    # Validation, formatters (pure functions)
│   └── index.ts
└── types.ts
```

Shared hooks in `src/hooks/` (e.g., `usePhotoUpload`, `useChecklist`). Naming: `use{Feature}{Purpose}`.

## BOM Management (Manager)

- Dual types: `'estimating'` (Draft→Submitted→Won/Lost) and `'execution'` (Baseline→Active→Closed)
- Site categories: ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct
- Auto codes: MAT-001, LAB-001, EQP-001, SUB-001
- Execution BOMs link to baseline via `baseline_bom_id`
- Excel export: `BomImportExportService.exportBomToExcel()`

## Key Dependencies

`@nozbe/watermelondb`, `@react-navigation`, `react-native-paper`, `react-native-vector-icons`, `react-native-image-picker`, `@react-native-community/netinfo`, `xlsx`, `react-native-fs`

## Import Paths

```typescript
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
```

## Test Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `Admin@2025` |
| Manager | `manager` | `Manager@2025` |
| Supervisor | `supervisor` | `Supervisor@2025` |
| Planner | `planner` | `Planner@2025` |
| Logistics | `logistics` | `Logistics@2025` |
| Design Engineer | `designer1` | `Password@2025` |
| Commercial | `commercial1` | `Password@2025` |

## References

- `ARCHITECTURE_UNIFIED.md` — Architecture (single source of truth)
- `DATABASE.md` — Schema and relationships
- `README.md` — Setup instructions

## Instructions

- Always produce clean output without errors
- Use similar formats for all features across roles
- Do not create files unless specified
- Run `npx tsc --noEmit` before commits
- Always update README.md & ARCHITECTURE_UNIFIED.md when adding features
