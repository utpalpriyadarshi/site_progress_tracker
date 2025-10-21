# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Construction Site Progress Tracker - A React Native mobile application for construction site management with offline-first capabilities using WatermelonDB. The app features role-based navigation for different construction team members (Supervisors, Managers, Planners, Logistics).

## Development Commands

### Git & Branch Management

**CRITICAL: Branch Deletion Policy**
- **NEVER delete branches** when merging pull requests (local or remote)
- Always preserve feature branches for historical reference and potential rollbacks
- When creating PRs: Use `gh pr merge --merge` (without `--delete-branch` flag)
- Keep all feature branches: `feature/v0.x`, `feature/xxx`, etc.

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
# Lint code
npm run lint

# Run tests
npm test
```

## Code Architecture

### Navigation Structure
The app uses a hierarchical navigation system:
- **MainNavigator** (`src/nav/MainNavigator.tsx`) - Root navigator
  - **AuthNavigator** - Login and role selection
  - **Role-based Navigators** - Bottom tab navigators for each role:
    - **SupervisorNavigator** - 7 screens with shared SiteContext
    - ManagerNavigator - 4 screens
    - PlanningNavigator - 4 screens
    - LogisticsNavigator - 4 screens

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

### Database Architecture (WatermelonDB)

**Critical**: The database uses WatermelonDB for offline-first functionality. Database initialization happens in `App.tsx` via `SimpleDatabaseService.initializeDefaultData()`.

**Database Location**: Database models are in `/models/`, NOT `/src/db/`. This is important for imports.

**Schema**: Defined in `models/schema/index.ts` (current version: 8)

**Core Collections**:
- `projects` - Top-level project containers
- `sites` - Construction sites (belongs to projects)
- `categories` - Item categorization
- `items` - Construction work items (belongs to sites and categories)
- `progress_logs` - Progress tracking records (belongs to items, includes photos as JSON)
- `hindrances` - Issues/obstacles (belongs to items/sites, includes photos and reported_at)
- `materials` - Material tracking (belongs to items)
- `daily_reports` - Aggregated daily reports (belongs to sites, includes sync_status)

**Key Relationships**:
- Project → has many → Sites
- Site → belongs to → Project, has many → Items, Hindrances, DailyReports
- Category → has many → Items
- Item → belongs to → Site and Category, has many → ProgressLogs, Materials, Hindrances

**Schema v8 Changes**:
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
- `/services/offline/` - Offline capability management

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

### Offline-First Pattern
- All database operations work offline by default
- Use `sync_status` field in progress_logs for tracking sync state
- SyncService handles bidirectional sync when online
- Always save to local database first, sync later

### Code Style
- Prettier config: single quotes, trailing commas, arrow parens avoid
- ESLint: Extends `@react-native` config
- TypeScript strict mode enabled

## Key Dependencies

- **@nozbe/watermelondb** - Offline-first database (Schema v8)
- **@react-navigation** - Navigation (stack + bottom tabs)
- **react-native-paper** - Material Design components (Cards, Dialogs, Chips)
- **react-native-vector-icons** - Icon system (MaterialCommunityIcons)
- **react-native-image-picker** - Camera and gallery integration for photos
- **@react-native-community/netinfo** - Network status monitoring
- **react-native-html-to-pdf** - PDF generation (currently disabled, reserved for future)
- **sqlite3** - Database backend

## Common Patterns

### Screen Organization
Screens are organized by role in `src/{role}/`:
- `auth/` - Authentication flows
- `supervisor/` - Field supervisor screens (7 screens + shared context)
  - Includes `context/SiteContext.tsx` for shared site selection
  - Includes `components/SiteSelector.tsx` reusable component
- `manager/` - Project manager screens (4 screens)
- `planning/` - Planning specialist screens (4 screens)
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
- Manager: `manager` / `manager123`
- Supervisor: `supervisor` / `supervisor123`
- Planner: `planner` / `planner123`
- Admin: `admin` / `admin123`

## References

- `ARCHITECTURE_UNIFIED.md` - Complete architecture documentation (single source of truth)
- `DATABASE.md` - Complete database schema and relationships
- `README.md` - Setup instructions and project overview
- `PLANNING_MASTER_STATUS.md` - Planning module status and roadmap
