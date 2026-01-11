# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Claude code is coding Assistant for me. You are required to manintain uniformity across the various user roles.

## Project Overview

Construction Site Progress Tracker - A React Native mobile application for construction site management with offline-first capabilities using WatermelonDB. The app features role-based navigation for different construction team members (Supervisors, Managers, Planners, Logistics, Design Engineers, Commercial Managers).

**Current Version**: v2.11 (Commercial Manager Role Implementation - Phase 5 Complete)
**Last Updated**: December 5, 2025

## Development Commands

### Git & Branch Management

**CRITICAL: Branch Deletion Policy**
- **NEVER delete branches** when merging pull requests (local or remote)
- Always preserve feature branches for historical reference and potential rollbacks
- When creating PRs: Use `gh pr merge --merge` (without `--delete-branch` flag)
- Keep all feature branches: `feature/v0.x`, `feature/xxx`, etc.

**CRITICAL: Commit Workflow**
1. **Complete your work** - Implement features, fix bugs, etc.
2. **Run TypeScript check** - `npx tsc --noEmit` (REQUIRED before every commit)
3. **Fix all TypeScript errors** - Or document why they can't be fixed
4. **Run tests** - `npm test` (if applicable)
5. **Stage changes** - `git add -A` or `git add <specific files>`
6. **Commit with descriptive message** - Include context, changes, and any known issues
7. **Repeat** - Follow this workflow for every logical unit of work

**Commit Message Guidelines:**
- Use descriptive titles (e.g., "v2.2: Add conflict resolution to SyncService")
- Include detailed body with bullet points for major changes
- Document schema changes, migrations, and new files
- Note any known limitations or future work
- Include test status and file counts
- Add co-author attribution for AI assistance

### Running the App
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# iOS setup (first time only)
bundle install
bundle exec pod install
```

### Installing Dependencies
```bash
# IMPORTANT: Always use --legacy-peer-deps flag
npm install --legacy-peer-deps

# Installing new packages
npm install --save <package-name> --legacy-peer-deps
```

### Code Quality
```bash
# TypeScript type checking (ALWAYS run before committing)
npx tsc --noEmit

# Lint code
npm run lint

# Run tests
npm test
```

**CRITICAL: TypeScript Check Before Commit**
- **ALWAYS run `npx tsc --noEmit` before committing code**
- Fix all TypeScript errors before creating commits
- If errors are unavoidable (e.g., type system limitations), document them in commit message
- This ensures type safety and catches errors early

## Code Architecture

### Navigation Structure
The app uses a hierarchical navigation system:
- **MainNavigator** (`src/nav/MainNavigator.tsx`) - Root navigator
  - **AuthNavigator** - Login and role selection
  - **Role-based Navigators** - Bottom tab navigators for each role:
    - **SupervisorNavigator** - 7 screens with shared SiteContext
    - **ManagerNavigator** - 5 screens with Manager Dashboard
    - **PlanningNavigator** - 6 screens with WBS Management
    - **LogisticsNavigator** - 4 screens with Material Tracking
    - **DesignEngineerNavigator** - 3 screens with DOORS Management
    - **CommercialNavigator** - 5 screens with Financial Management (v2.11)

### Supervisor Navigation (Most Complete)
The supervisor role has 7 dedicated screens in `src/supervisor/`:
1. **DailyReportsScreen** - Submit daily progress reports
2. **ReportsHistoryScreen** - View submitted reports with filtering
3. **HindranceReportScreen** - Report issues with photo capture
4. **ItemsManagementScreen** - Manage construction items
5. **MaterialTrackingScreen** - Track materials
6. **SiteManagementScreen** - Manage assigned sites
7. **SiteInspectionScreen** - Conduct inspections

**SiteContext**: All supervisor screens share site selection via `src/supervisor/context/SiteContext.tsx`

### Manager Navigation (5 Screens - Activity 4 Complete)
The manager role has 5 dedicated screens in `src/manager/`:

1. **OverviewScreen** - Project overview dashboard
2. **BomManagementScreen** 💰 - Bill of Materials Management (Activity 4 - v2.3, 1,450+ lines)
   - Pre-Contract BOMs (Estimating): Draft → Submitted → Won/Lost
   - Post-Contract BOMs (Execution): Baseline → Active → Closed
   - Site categorization (7 types: ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct)
   - Auto-generated item codes (MAT-001, LAB-002, EQP-003, SUB-004)
   - Variance tracking (Baseline vs Actual with color-coded indicators)
   - Excel export functionality (2 sheets: Summary + Items)
3. **TeamManagementScreen** - Team management
4. **FinancialReportsScreen** - Financial reports
5. **ResourceAllocationScreen** - Resource allocation

**BOM Management Features (Activity 4)**:
- Complete BOM lifecycle management from estimation to execution
- Copy to Execution: One-click copy from estimating to execution BOM with baseline linking
- Real-time cost calculations (quantity × unit cost)
- Professional Excel reporting ready for client presentations
- Offline-first with sync support

### Planning Navigation (7 Tabs - Logical Workflow Order)
The planning role has 7 dedicated tabs in `src/planning/` organized in workflow sequence:

**Workflow:** Sites → WBS → Resources → Schedule → Gantt → Baseline → Milestones

1. **SiteManagementScreen** 🏗️ - Create sites and assign supervisors (WHERE work happens)
2. **WBSManagementScreen** 🗂️ - Work Breakdown Structure management (WHAT work to do)
3. **ResourcePlanningScreen** 👷 - Resource allocation (WHO does the work)
4. **ScheduleManagementScreen** 📅 - Schedule management (WHEN work happens)
5. **GanttChartScreen** 📊 - Project timeline visualization (VISUALIZE timeline)
6. **BaselineScreen** 📋 - Baseline planning and critical path (LOCK the plan)
7. **MilestoneTrackingScreen** 🏁 - Milestone tracking (TRACK deliverables)

**Site Management Workflow**:
- **Planners** create sites during project planning phase and assign supervisors
- **Supervisors** can view and manage their assigned sites
- `supervisor_id` field is optional in the Sites table to support this workflow

### Design Engineer Navigation (4 Screens - Phase 3 Complete)
The Design Engineer role has 4 dedicated screens in `src/design_engineer/` focused on DOORS package and Design RFQ management:

1. **DesignEngineerDashboardScreen** 📊 - Dashboard with 5 interactive widgets
2. **DoorsPackageManagementScreen** 📦 - DOORS Package management (100 requirements per package)
3. **DesignRfqManagementScreen** 📝 - Design RFQ management (pre-PM200 engineering phase)
4. **DesignEngineerSettingsScreen** ⚙️ - Settings and test data seeding

**Design Engineer Responsibilities:**
- Manage DOORS packages containing 100 requirements each for equipment/materials
- Create and manage Design RFQs for vendor quotes during engineering phase (before PM200)
- Track design compliance rate (target: 80% packages reviewed)
- Monitor processing time (target: 7 days from received to reviewed)
- One design engineer per project

**Key Features (Phase 3):**
- **Widget-Based Dashboard**: 5 interactive widgets showing DOORS package status, RFQ status, compliance metrics, processing time, and recent activity
- **Widget Navigation**: Tap widgets to navigate to corresponding detail screens
- **Enhanced Empty States**: Context-aware empty states for no data, no search results, and no filter results
- **Accessibility**: Full screen reader support with ARIA labels, keyboard navigation, focus indicators
- **Performance Optimizations**: 300ms debounced search, smooth scrolling with 50+ items
- **Offline-First**: WatermelonDB ensures all data available offline, syncs when online

**Uniformity Patterns (Aligned with Supervisor Screens):**
- **Consistent Headers**: All screens have blue header (#007AFF) with project name, screen label, and logout button
- **No Navigator Headers**: Headers removed from navigator, only internal screen headers shown
- **Error Boundaries**: All screens wrapped in ErrorBoundary for crash protection
- **Empty States**: Use EmptyState component with icon, title, message, helpText, and action buttons
- **Status Badges**: CRITICAL - Use supervisor-style badges for ALL user roles (see Status Badge Pattern below)
- **Forms with Dropdowns**: Site selection menus use state management (useState) for visibility control
- **Card-Based Layout**: Material Design cards for data display with consistent spacing

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
- ⏳ Commercial Manager: Apply to all card components (future)
- ⏳ All future role implementations

**Widget System Pattern:**
```typescript
// All widgets extend BaseWidget which provides:
// - Loading states with spinner
// - Error states with retry
// - Optional refresh functionality
// - Optional onPress for navigation
// - Consistent accessibility props

// Usage:
<DoorsPackageStatusWidget
  data={doorsStatus.data}
  loading={doorsStatus.loading}
  error={doorsStatus.error}
  onRefresh={doorsStatus.refetch}
  onPress={() => navigation.navigate('DoorsPackages')}
/>
```

**Empty State Pattern:**
```typescript
// Context-aware empty states for different scenarios
const renderEmptyState = () => {
  const hasNoData = state.data.packages.length === 0;
  const hasSearchQuery = state.filters.searchQuery.length > 0;
  const hasFilter = state.filters.status !== null;

  if (hasNoData) {
    return <EmptyState icon="package-variant" title="No DOORS Packages Yet" ... />;
  } else if (hasSearchQuery) {
    return <EmptyState icon="magnify" title="No Packages Found" ... variant="search" />;
  } else if (hasFilter) {
    return <EmptyState icon="filter-off" title="No {status} Packages" ... />;
  }
};
```

**Header Pattern (Consistent Across All Design Engineer Screens):**
```typescript
<View style={styles.header}>
  <View style={styles.headerContent}>
    <View>
      <Text style={styles.projectName}>{projectName}</Text>
      <Text style={styles.screenLabel}>Screen Title</Text>
    </View>
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  </View>
</View>

// Styles (consistent blue header)
header: {
  backgroundColor: '#007AFF',
  paddingTop: 50,
  paddingBottom: 16,
  paddingHorizontal: 20,
}
```

**Database Tables:**
- `doors_packages` - DOORS package tracking (doorsId, siteId, category, equipmentType, materialType, totalRequirements: 100, status, receivedDate, reviewedDate)
- `rfqs` - Request for Quotations (rfqNumber, doorsPackageId, projectId, title, description, status, rfqType: 'design', issueDate, closingDate, evaluationDate, awardDate)

### Database Architecture (WatermelonDB)

**Critical**: The database uses WatermelonDB for offline-first functionality. Database initialization happens in `App.tsx` via `SimpleDatabaseService.initializeDefaultData()`.

**Database Location**: Database models are in `/models/`, NOT `/src/db/`. This is important for imports.

**Schema**: Defined in `models/schema/index.ts` (current version: 25)

**Recent Schema Updates:**
- **v18:** Added sync_status to core models (projects, sites, categories, items, materials)
- **v19:** Added sync_queue table for tracking local changes
- **v20:** Added _version field to 10 syncable models for conflict resolution
- **v21:** Added boms table for Bill of Materials management (Activity 4, Phase 1)
- **v22:** Added bom_items table for BOM line items (Activity 4, Phase 1)
- **v23:** Added quantity and unit fields to boms table (Activity 4, Phase 1)
- **v24:** Added site_category field to boms table with indexing (Activity 4, Phase 1)
- **v25:** Added baseline_bom_id to boms table for execution tracking (Activity 4, Phase 2) - CURRENT

**Core Collections**:
- `projects` - Top-level project containers
- `sites` - Construction sites (belongs to projects)
- `categories` - Item categorization
- `items` - Construction work items (belongs to sites and categories)
- `progress_logs` - Progress tracking records (belongs to items, includes photos as JSON)
- `hindrances` - Issues/obstacles (belongs to items/sites, includes photos and reported_at)
- `materials` - Material tracking (belongs to items)
- `daily_reports` - Aggregated daily reports (belongs to sites, includes sync_status)
- `boms` - Bill of Materials (belongs to projects, Activity 4 - v2.3)
  - Dual types: 'estimating' (Pre-Contract) and 'execution' (Post-Contract)
  - Site categories: ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct (indexed in v24)
  - Statuses: Draft/Submitted/Won/Lost (estimating) or Baseline/Active/Closed (execution)
  - Links to baseline via baseline_bom_id (v25)
- `bom_items` - BOM line items (belongs to boms, Activity 4 - v2.3)
  - Categories: Material, Labor, Equipment, Subcontractor
  - Auto-generated codes: MAT-001, LAB-002, EQP-003, SUB-004
  - Fields: description, category, quantity, unit, unit_cost, total_cost

**Key Relationships**:
- Project → has many → Sites, BOMs
- Site → belongs to → Project, has many → Items, Hindrances, DailyReports
- Category → has many → Items
- Item → belongs to → Site and Category, has many → ProgressLogs, Materials, Hindrances
- BOM → belongs to → Project, has many → BOM Items, optionally links to baseline BOM
- BOM Item → belongs to → BOM

**Schema v18-v20 Changes (Activity 2 - Sync Implementation)**:
- **v18:** Added `sync_status` field to 5 core models (projects, sites, categories, items, materials)
- **v19:** Added `sync_queue` table for tracking local changes (table_name, record_id, action, data, synced_at, retry_count, last_error)
- **v20:** Added `_version` field to 10 syncable models for conflict resolution (projects, sites, categories, items, materials, progress_logs, hindrances, daily_reports, site_inspections, schedule_revisions)

**Schema v8 Changes (Earlier)**:
- Added `daily_reports` table for report history
- Added `reported_at` timestamp to `hindrances`
- Added `photos` JSON field to `hindrances` for photo storage
- Added `sync_status` to `hindrances` and `daily_reports`

**Database Service Pattern**: Use `DatabaseService.ts` in `/services/db/` for database operations. It implements lazy loading via `getDatabase()` to avoid initialization issues.

### Service Layer Organization

**Location**: `/services/` (NOT in `/src/`)

**Structure**:
- `/services/db/` - Database operations
  - `DatabaseService.ts` - Enhanced database service with query methods
  - `SimpleDatabaseService.ts` - Basic initialization service
- `/services/sync/` - Sync functionality for offline data
  - `SyncService.ts` - Complete bidirectional sync with conflict resolution (Activity 2)
- `/services/offline/` - Offline capability management
- `/src/services/` - Application services
  - `BomDataService.ts` - BOM CRUD operations (Activity 4 - v2.3)
  - `BomImportExportService.ts` - Excel export functionality (Activity 4 - v2.3, 320 lines)
  - `ClearBomsService.ts` - BOM data management utilities (Activity 4 - v2.3)

### TypeScript Configuration

**Decorators**: The project requires decorator support for WatermelonDB models:
```javascript
// tsconfig.json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}

// babel.config.js
plugins: [
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  ['@babel/plugin-transform-class-properties', { loose: true }],
  '@babel/plugin-transform-class-static-block',
]
```

Always include these decorator configurations when creating WatermelonDB models.

## Important Development Notes

### WatermelonDB Model Creation
When creating new models:
1. Define schema in `models/schema/index.ts` using snake_case column names
2. Create model class in `models/` extending `Model`
3. Use `@field('snake_case')` decorators with camelCase property names
4. Register model in `models/database.ts` modelClasses array
5. Increment schema version number
6. Create migration file in `models/migrations/` if modifying existing schema

**CRITICAL: Field Naming Convention**
- Schema columns: `snake_case` (e.g., `supervisor_id`, `start_date`)
- Model properties: camelCase (e.g., `supervisorId`, `startDate`)
- Decorator: `@field('snake_case_column') camelCaseProperty!: type`

**Example Model**:
```typescript
export default class SiteModel extends Model {
  static table = 'sites';

  @field('name') name!: string;
  @field('supervisor_id') supervisorId!: string;  // Note: decorator uses snake_case, property is camelCase
  @field('project_id') projectId!: string;
}
```

**Creating Records - Use camelCase**:
```typescript
// ✅ CORRECT
await database.write(async () => {
  await database.collections.get('sites').create((site) => {
    site.name = 'Main Site';
    site.supervisorId = 'supervisor-1';  // camelCase property
    site.projectId = 'project-123';
  });
});

// ❌ WRONG - Will save empty values!
site.supervisor_id = 'supervisor-1';  // Never use snake_case when setting values
```

**Timestamp Fields**:
- Schema: `{ name: 'start_date', type: 'number' }`
- Model: `@field('start_date') startDate!: number;`  // Use @field, NOT @date
- When setting: `item.startDate = new Date().getTime();`  // Always use timestamps

**DO NOT declare created_at/updated_at**:
- These are auto-managed by WatermelonDB
- Don't add `@readonly @date` decorators for them
- They exist but shouldn't be in your model class

### Database Queries
Always use WatermelonDB's reactive queries for UI components:
```typescript
import { Q } from '@nozbe/watermelondb';

// ✅ CORRECT - Use snake_case column names in queries
const items = await database.collections.get('items')
  .query(Q.where('site_id', siteId))  // snake_case in queries
  .fetch();

// Access results using camelCase properties
items.forEach(item => {
  console.log(item.siteId);  // camelCase property
  console.log(item.categoryId);
});
```

### Offline-First Pattern (Activity 2 Complete)
- All database operations work offline by default
- Use `sync_status` field in models for tracking sync state ('pending', 'synced', 'failed')
- Use `_version` field for conflict resolution (Last-Write-Wins strategy)
- **SyncService** handles bidirectional sync when online:
  - `syncDown()` - Pull changes from server
  - `syncUp()` - Push local changes to server
  - Conflict resolution with version comparison
  - Network detection and queue management
- Always save to local database first, sync later
- Changes tracked in `sync_queue` table for reliable synchronization

**Sync Status Values:**
- `'pending'` - Local change not yet synced to server
- `'synced'` - Successfully synchronized with server
- `'failed'` - Sync operation failed (will retry)

**Sync Status Field Resolution (v2.2 - FIXED):**
- **Issue**: WatermelonDB's Model has built-in read-only `syncStatus` property (SyncStatus enum: 'synced' | 'created' | 'updated' | 'deleted' | 'disposable')
- **Solution**: Renamed our custom field from `syncStatus` to `appSyncStatus` to avoid property name collision
- **Pattern**: `@field('sync_status') appSyncStatus!: string`
- **Database**: Column name remains `sync_status` (no migration needed)
- **Values**: 'pending', 'synced', 'failed' (our application-level sync tracking)
- **Usage**: Always use `record.appSyncStatus` in code, never `record.syncStatus`
- **Applies to**: ALL 10 syncable models (Projects, Sites, Categories, Items, Materials, ProgressLogs, Hindrances, DailyReports, SiteInspections, ScheduleRevisions)
- **Status**: TypeScript errors resolved, all code updated

### Code Style
- Prettier config: single quotes, trailing commas, arrow parens avoid
- ESLint: Extends `@react-native` config
- TypeScript strict mode enabled

## Key Dependencies

- **@nozbe/watermelondb** - Offline-first database (Schema v25)
- **@react-navigation** - Navigation (stack + bottom tabs)
- **react-native-paper** - Material Design components (Cards, Dialogs, Chips)
- **react-native-vector-icons** - Icon system (MaterialCommunityIcons)
- **react-native-image-picker** - Camera and gallery integration for photos
- **@react-native-community/netinfo** - Network status monitoring
- **react-native-html-to-pdf** - PDF generation (currently disabled, reserved for future)
- **sqlite3** - Database backend
- **xlsx** - Excel file generation for BOM exports (Activity 4 - v2.3)
- **react-native-fs** - File system operations for BOM exports (Activity 4 - v2.3)
- **react-native-base64** - Base64 encoding for BOM exports (Activity 4 - v2.3)

## Common Patterns

### Screen Organization
Screens are organized by role in `src/{role}/`:
- `auth/` - Authentication flows
- `supervisor/` - Field supervisor screens (7 screens + shared context)
  - Includes `context/SiteContext.tsx` for shared site selection
  - Includes `components/SiteSelector.tsx` reusable component
- `manager/` - Project manager screens (5 screens, Activity 4 complete)
  - `BomManagementScreen.tsx` (1,450+ lines) - Complete BOM management system
- `planning/` - Planning specialist screens (7 screens)
- `logistics/` - Logistics coordinator screens (4 screens)

### Photo Capture Pattern
For screens that need photo capture (e.g., HindranceReportScreen):
- Use `react-native-image-picker` for camera and gallery access
- Store photos as JSON string arrays in database
- Request camera permissions on Android with `PermissionsAndroid`
- Support both `launchCamera()` and `launchImageLibrary()`
- Parse JSON arrays safely with try-catch when reading photos

### Import Paths
- Models: `import { database } from '../../models/database'`
- Services: `import { DatabaseService } from '../../services/db/DatabaseService'`
- Navigation types: `import { RootStackParamList } from './types'`

### Testing Credentials
Default test users (defined in DATABASE.md):
- Admin: `admin` / `Admin@2025`
- Manager: `manager` / `Manager@2025`
- Supervisor: `supervisor` / `Supervisor@2025`
- Planner: `planner` / `Planner@2025`
- Logistics: `logistics` / `Logistics@2025`
- Design Engineer: `designer1` / `Password@2025`
- Commercial Manager: `commercial1` / `Password@2025`

## References

### Architecture & Documentation
- `ARCHITECTURE_UNIFIED.md` - Complete architecture documentation (single source of truth) - v2.3
- `DATABASE.md` - Complete database schema and relationships
- `README.md` - Setup instructions and project overview
- `PLANNING_MASTER_STATUS.md` - Planning module status and roadmap

### Activity 2 Implementation (Sync System)
- `docs/implementation/ACTIVITY_2_KICKOFF.md` - Complete Activity 2 planning document
- `docs/implementation/WEEK_6_SYNCSERVICE_COMPLETE.md` - Mobile sync implementation details
- `docs/implementation/WEEK_7_CONFLICT_RESOLUTION.md` - Conflict resolution with version tracking
- `docs/testing/WEEK_5_API_TEST_REPORT.md` - Backend API testing results
- `construction-tracker-api/WEEK_4_5_PROGRESS_SUMMARY.md` - Backend API implementation

### Activity 4 Implementation (BOM Management - v2.3)
- `docs/implementation/activity-4-bom/BOM_MANAGEMENT_FEATURE_SUMMARY.md` - Complete feature documentation (400+ lines)
- `docs/testing/BOM_Management_Test_Procedure.md` - Comprehensive testing guide (15+ scenarios)
- `docs/PROJECT_STATUS_REPORT_2025_11_07.md` - Activity 4 completion status report
- `docs/testing/Sample_BOM_Import.csv` - Sample BOM data for testing (15 items)

## BOM Management Patterns (Activity 4 - v2.3)

### BOM Creation and Management
When working with BOMs:
- **Dual BOM Types**: Always use `type` field ('estimating' or 'execution')
- **Site Categorization**: Use one of 7 categories (ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct)
- **Auto-Generated Codes**: Item codes are auto-generated based on category:
  - Material: MAT-001, MAT-002, ...
  - Labor: LAB-001, LAB-002, ...
  - Equipment: EQP-001, EQP-002, ...
  - Subcontractor: SUB-001, SUB-002, ...
- **Cost Calculations**: Total cost is automatically calculated as quantity × unit_cost
- **Baseline Linking**: Execution BOMs link to estimating BOMs via `baseline_bom_id`

### BOM Status Workflow
**Pre-Contract (Estimating)**:
1. Draft → Initial creation state
2. Submitted → Sent for approval/bidding
3. Won → Tender won, ready to copy to execution
4. Lost → Tender lost, archived

**Post-Contract (Execution)**:
1. Baseline → Initial execution BOM (copied from won estimating BOM)
2. Active → Currently being tracked
3. Closed → Project completed

### Variance Tracking Pattern
When copying to execution:
```typescript
// Execution BOM references the baseline
executionBom.baselineBomId = estimatingBom.id;

// Display variance
const variance = executionItem.totalCost - baselineItem.totalCost;
const variancePercent = ((variance / baselineItem.totalCost) * 100).toFixed(1);
```

### Excel Export Pattern
Use `BomImportExportService.exportBomToExcel()`:
- Creates 2-sheet workbook (Summary + Items)
- Auto-sizes columns for readability
- Saves to Downloads folder
- Returns file path for user feedback

### BOM Database Queries
```typescript
import { Q } from '@nozbe/watermelondb';

// Get BOMs by type and project
const estimatingBoms = await database.collections
  .get('boms')
  .query(
    Q.where('project_id', projectId),
    Q.where('type', 'estimating')
  )
  .fetch();

// Get BOM items with category filter
const materialItems = await database.collections
  .get('bom_items')
  .query(
    Q.where('bom_id', bomId),
    Q.where('category', 'Material')
  )
  .fetch();
```

## Logging & Error Handling (v2.13)

### LoggingService Pattern

**Location**: `src/services/LoggingService.ts`

**Purpose**: Centralized logging for production-ready debugging and error tracking.

**When to Use**:
- **NEVER use `console.log`** in production code
- **ALWAYS use `logger.debug()`** for development debugging
- **ALWAYS use `logger.error()`** with Error objects for error tracking
- **Use `logger.info()`** for important events (saves, updates, deletes)
- **Use `logger.warn()`** for warning conditions (validation failures, deprecated usage)

**Usage Pattern**:
```typescript
import { logger } from '../services/LoggingService';

// Debug (only shows in development)
logger.debug('Component mounted', {
  component: 'SiteInspectionScreen',
  action: 'componentDidMount'
});

// Info - Important events
logger.info('Inspection created successfully', {
  component: 'SiteInspectionScreen',
  action: 'handleSave',
  inspectionId: inspection.id,
  siteId: inspection.siteId
});

// Warning - Validation failures
logger.warn('Site not selected', {
  component: 'SiteInspectionScreen',
  action: 'handleAdd'
});

// Error - With Error object and context
try {
  await database.write(async () => {
    await inspection.create();
  });
} catch (error) {
  logger.error('Failed to create inspection', error as Error, {
    component: 'SiteInspectionScreen',
    action: 'handleSave',
    formData: { type, rating, notes }
  });
  showSnackbar('Failed to create inspection', 'error');
}
```

**Context Metadata**:
Always include:
- `component`: Component/screen name
- `action`: Function/method name
- Additional relevant data (IDs, form data, etc.)

**Benefits**:
- Environment-aware (console in dev, silent in production)
- Ready for integration with external services (Sentry, LogRocket)
- Structured logging for better debugging
- Error stack traces preserved

### ErrorBoundary Pattern

**Location**: `src/components/common/ErrorBoundary.tsx`

**Purpose**: Catch JavaScript errors in component tree and prevent app crashes.

**When to Use**:
- Wrap each major screen/tab in SupervisorNavigator, ManagerNavigator, etc.
- Wrap complex components that may throw errors
- Provide unique names for each boundary for debugging

**Usage Pattern**:
```typescript
// In SupervisorNavigator.tsx
import ErrorBoundary from '../components/common/ErrorBoundary';

<Tab.Screen
  name="SiteInspection"
  children={() => (
    <ErrorBoundary name="SiteInspectionScreen">
      <SiteInspectionScreen />
    </ErrorBoundary>
  )}
/>
```

**Features**:
- Graceful fallback UI with "Try Again" button
- Automatic error logging to LoggingService
- Error isolation per screen (one screen crashes, others continue)
- Component stack traces for debugging
- User-friendly error messages

**Testing**:
```typescript
// Simulate error for testing
const Component = () => {
  throw new Error('Test error');
  return <View />;
};

// ErrorBoundary will catch and display fallback UI
```

## Supervisor Screens Refactoring Guidelines (v2.13)

### Modular Architecture Pattern

**Goal**: Break down large screens (800+ lines) into maintainable, reusable, testable modules.

**Target**: Main screen files should be 200-300 lines maximum.

### Folder Structure

When refactoring a large screen, create the following structure:

```
src/supervisor/{screen_name}/
├── {ScreenName}Screen.tsx       (200-300 lines) - Main coordinator
├── components/                   - UI components
│   ├── {Feature}Form.tsx         - Form dialogs
│   ├── {Feature}List.tsx         - List views
│   ├── {Feature}Card.tsx         - Item cards
│   ├── PhotoGallery.tsx          - Photo handling
│   └── index.ts                  - Barrel exports
├── hooks/                        - Custom hooks
│   ├── use{Feature}Data.ts       - Data fetching/CRUD
│   ├── use{Feature}Form.ts       - Form state management
│   └── index.ts                  - Barrel exports
├── utils/                        - Utilities
│   ├── {feature}Validation.ts    - Form validation
│   ├── {feature}Formatters.ts    - Data formatting
│   └── index.ts                  - Barrel exports
└── types.ts                      - Centralized types
```

### Example: SiteInspectionScreen Refactoring (v2.13 - Task 1.3.1 ✅)

**Before**: 1,258 lines in single file
**After**: 260 lines main screen + 13 modular files (79.3% reduction)

**Structure Created**:
```
src/supervisor/site_inspection/
├── SiteInspectionScreen.tsx  (260 lines)
├── components/
│   ├── InspectionForm.tsx    (397 lines)
│   ├── InspectionList.tsx    (76 lines)
│   ├── InspectionCard.tsx    (377 lines)
│   ├── PhotoGallery.tsx      (147 lines)
│   ├── ChecklistSection.tsx  (179 lines)
│   └── index.ts
├── hooks/
│   ├── useInspectionData.ts  (213 lines)
│   ├── useInspectionForm.ts  (243 lines)
│   └── index.ts
├── utils/
│   ├── inspectionValidation.ts (85 lines)
│   ├── inspectionFormatters.ts (96 lines)
│   └── index.ts
└── types.ts (96 lines)
```

### Shared Hooks Pattern (src/hooks/)

**Purpose**: Extract reusable logic that multiple screens can share.

**Created in v2.13**:
1. **usePhotoUpload** (247 lines) - Photo capture/gallery for all supervisor screens
2. **useChecklist** (241 lines) - Checklist management with summary calculations

**When to Create Shared Hooks**:
- Logic is used by 2+ screens
- Logic is self-contained and reusable
- Logic can be tested independently

**Example: usePhotoUpload**
```typescript
// src/hooks/usePhotoUpload.ts
export const usePhotoUpload = (maxPhotos: number = 10) => {
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhoto = async () => {
    // Handle camera/gallery logic
    // Handle permissions
    // Enforce photo limits
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canAddMorePhotos = photos.length < maxPhotos;

  return {
    photos,
    setPhotos,
    addPhoto,
    removePhoto,
    canAddMorePhotos
  };
};

// Usage in multiple screens
import { usePhotoUpload } from '../../hooks';

const { photos, addPhoto, removePhoto } = usePhotoUpload(10);
```

### Component Extraction Guidelines

**When to Extract a Component**:
- UI section is 50+ lines
- Logic is complex or self-contained
- Component will be reused
- Component has its own state/props

**Component Responsibilities** (Single Responsibility Principle):
- **Form Components**: Handle input, validation, save/cancel
- **List Components**: Display items, handle refresh
- **Card Components**: Display single item, provide actions
- **Dialog Components**: Modal dialogs for create/edit/delete

### Custom Hook Guidelines

**When to Create a Custom Hook**:
- Logic manages state (useState, useEffect)
- Logic is reusable across components
- Logic is complex enough to benefit from isolation
- Logic interacts with database or services

**Hook Responsibilities**:
- **Data Hooks**: Fetch, cache, refresh data from database
- **Form Hooks**: Manage form state, validation, submission
- **Feature Hooks**: Manage feature-specific logic (photo upload, checklist)

**Hook Naming Convention**: `use{Feature}{Purpose}`
- `useInspectionData` - Data fetching for inspections
- `useInspectionForm` - Form state for inspections
- `usePhotoUpload` - Photo upload logic

### Validation & Formatting Utils

**When to Create Utils**:
- Pure functions (no state, no side effects)
- Reusable across components/hooks
- Formatting, validation, calculations

**Utils Naming Convention**: `{feature}{Purpose}.ts`
- `inspectionValidation.ts` - Validation functions
- `inspectionFormatters.ts` - Formatting functions

**Example**:
```typescript
// utils/inspectionValidation.ts
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateSiteSelection = (
  siteId: string | null
): ValidationResult => {
  if (!siteId) {
    return {
      isValid: false,
      errorMessage: 'Please select a site'
    };
  }
  return { isValid: true };
};

// utils/inspectionFormatters.ts
export const formatInspectionDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
```

### Barrel Exports Pattern

**Purpose**: Simplify imports with index.ts files.

**Pattern**:
```typescript
// components/index.ts
export { default as InspectionForm } from './InspectionForm';
export { default as InspectionList } from './InspectionList';
export { default as InspectionCard } from './InspectionCard';
export { default as PhotoGallery } from './PhotoGallery';
export { default as ChecklistSection } from './ChecklistSection';

// hooks/index.ts
export { useInspectionData } from './useInspectionData';
export { useInspectionForm } from './useInspectionForm';

// utils/index.ts
export * from './inspectionValidation';
export * from './inspectionFormatters';

// Usage in main screen
import {
  InspectionForm,
  InspectionList,
  InspectionCard
} from './components';

import {
  useInspectionData,
  useInspectionForm
} from './hooks';

import {
  validateSiteSelection,
  formatInspectionDate
} from './utils';
```

### Integration with LoggingService

**Pattern**: Add logging throughout refactored modules.

```typescript
// In hooks/useInspectionData.ts
import { logger } from '../../../services/LoggingService';

export const useInspectionData = (selectedSiteId: string | null) => {
  const loadInspections = async () => {
    try {
      logger.debug('Loading inspections', {
        component: 'useInspectionData',
        action: 'loadInspections',
        siteId: selectedSiteId
      });

      const inspections = await database.collections
        .get('site_inspections')
        .query(Q.where('site_id', selectedSiteId))
        .fetch();

      logger.info('Inspections loaded successfully', {
        component: 'useInspectionData',
        action: 'loadInspections',
        count: inspections.length
      });

      return inspections;
    } catch (error) {
      logger.error('Failed to load inspections', error as Error, {
        component: 'useInspectionData',
        action: 'loadInspections',
        siteId: selectedSiteId
      });
      throw error;
    }
  };

  return { loadInspections };
};
```

### Refactoring Checklist

When refactoring a large screen:

1. **Analysis** (30 min)
   - [ ] Read entire file, understand structure
   - [ ] Identify components (UI sections)
   - [ ] Identify hooks (state management)
   - [ ] Identify utils (pure functions)
   - [ ] Identify types (interfaces, types)

2. **Planning** (30 min)
   - [ ] Design folder structure
   - [ ] List components to create
   - [ ] List hooks to create
   - [ ] List utils to create
   - [ ] Identify shared logic (src/hooks/)

3. **Extraction** (4-6 hours)
   - [ ] Create types.ts first
   - [ ] Extract utils (no dependencies)
   - [ ] Extract hooks (use types, utils)
   - [ ] Extract components (use hooks, types, utils)
   - [ ] Update main screen (import from modules)
   - [ ] Create barrel exports (index.ts)

4. **Integration** (1-2 hours)
   - [ ] Replace console.log with logger
   - [ ] Fix import paths (../../../../ → relative)
   - [ ] Fix TypeScript errors
   - [ ] Test all functionality

5. **Testing** (2-3 hours)
   - [ ] Test create flow
   - [ ] Test edit flow
   - [ ] Test delete flow
   - [ ] Test validation
   - [ ] Test error handling
   - [ ] Test sync integration

6. **Documentation** (1-2 hours)
   - [ ] Create component documentation (docs/components/)
   - [ ] Update ARCHITECTURE_UNIFIED.md
   - [ ] Update README.md
   - [ ] Update SUPERVISOR_IMPROVEMENTS_ROADMAP.md
   - [ ] Write commit message

**Total Time**: 8-14 hours per screen

### Benefits of Modular Architecture

- ✅ **Maintainability**: Easier to find and fix bugs (small files)
- ✅ **Reusability**: Shared hooks reduce code duplication (40%+)
- ✅ **Testability**: Components/hooks tested independently
- ✅ **Separation of Concerns**: Clear boundaries (UI, logic, data)
- ✅ **Type Safety**: Centralized type definitions
- ✅ **Clean Imports**: Barrel exports simplify imports
- ✅ **Scalability**: Easy to add new features
- ✅ **Team Collaboration**: Multiple developers can work on same screen

## Development Best Practices

### Before Every Commit Checklist
1. ✅ Run `npx tsc --noEmit` - Verify no TypeScript errors
2. ✅ Run `npm test` - Ensure tests pass (if applicable)
3. ✅ Review `git diff` - Verify only intended changes
4. ✅ Write descriptive commit message - Include context and changes
5. ✅ Document known issues - Note any limitations or future work

### When Adding New Features
1. ✅ Update schema version if modifying database
2. ✅ Create migration file for schema changes
3. ✅ Update affected models with new fields
4. ✅ Add sync_status and _version to new syncable models
5. ✅ Update CLAUDE.md with new patterns or conventions
6. ✅ Run TypeScript check before committing
7. ✅ Document changes in commit message

### TypeScript Error Resolution
- Fix all errors before committing when possible
- Document unavoidable errors (e.g., type system limitations) in commit message
- Use type assertions sparingly and only when necessary
- Prefer fixing root cause over suppressing errors

### instructions to follow:
- Always produce clean output without any error
-Use similar formats for all features
-Do not create unless specified
-check for typescript errors
-Always update README.md & ARCHITECTURE_UNIFIED.md
