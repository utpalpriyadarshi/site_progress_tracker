# Construction Site Progress Tracker

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli). It's designed specifically for tracking progress on construction sites with offline-first capabilities using WatermelonDB.

## Project Overview

The Construction Site Progress Tracker is a mobile application that helps construction teams manage projects, track progress, monitor materials, and document issues across multiple construction sites. The app features offline-first architecture with robust data synchronization capabilities.

### Key Features
- **Offline-First**: Works seamlessly without internet connectivity
- **Construction-Specific**: Tailored for construction site management workflows
- **Role-Based Access**: Different interfaces for supervisors, managers, planners, logistics, and admin
- **Admin Role** (v1.2): Complete administration panel with:
  - User management (CRUD operations)
  - Role assignment
  - Project management with cascade deletion
  - Role switching to test different user experiences
  - Active/inactive user account management
- **Planning Module** (v1.3 - NEW): Advanced project planning capabilities with:
  - Critical path calculation using Kahn's algorithm
  - Dependency management with circular dependency detection
  - Baseline planning and locking
  - Visual critical path indicators
  - Progress metrics and forecasting
  - Schedule variance tracking
- **Progress Tracking**: Detailed logging of work progress with photo documentation
- **Daily Reports**: Submit daily progress reports with automatic aggregation and history viewing
- **Hindrance Management**: Report and track construction issues/obstacles with photo capture (camera/gallery)
- **Reports History**: View, filter, and search submitted daily reports with detailed breakdowns
- **Material Management**: Monitor materials required, available, and used
- **Site Context**: Persistent site selection across all supervisor screens
- **Photo Documentation**: Camera and gallery integration for progress logs and hindrance reports
- **Site Inspection**: Comprehensive safety and quality checklists with photo documentation
- **Automated Testing** (v1.3 - NEW): 35 tests with Jest covering critical functionality

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Prerequisites
- Node.js >= 20
- Ruby (for iOS CocoaPods) - Ruby >= 2.6.10 as specified in Gemfile
- For iOS development: Xcode and CocoaPods
- For Android development: Android Studio and Android SDK

## Step 1: Install Dependencies

**IMPORTANT**: Always use `--legacy-peer-deps` flag when installing dependencies.

```sh
# Using npm (REQUIRED: use --legacy-peer-deps)
npm install --legacy-peer-deps

# OR using Yarn
yarn install
```

For iOS-specific setup (first time only):
```sh
bundle install
bundle exec pod install
```

### Installing New Packages

When adding new packages, always use the `--legacy-peer-deps` flag:

```sh
npm install --save <package-name> --legacy-peer-deps
```

## Step 2: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 3: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Database Architecture

The app uses WatermelonDB (Schema v11, updated October 2025) for robust offline-first data management with the following entities:

### Core Entities
- **Projects**: Top-level project containers with client, dates, and budgets
- **Sites**: Construction sites associated with projects
- **Categories**: Categorization for construction items
- **Items**: Specific construction tasks and deliverables
- **ProgressLogs**: Detailed progress records linked to items with photos (JSON array)
- **Hindrances**: Issues and obstacles affecting work with photo documentation and timestamps
- **Materials**: Construction materials with procurement tracking
- **DailyReports**: Aggregated daily progress reports with sync status
- **SiteInspections**: Site inspection records with checklists and photos
- **ScheduleRevisions** (v1.3 - NEW): Track schedule changes and their impact

### Admin & User Management (v1.2)
- **Users**: User accounts with authentication credentials
- **Roles**: System roles (Admin, Supervisor, Manager, Planner, Logistics)

### Planning Fields (v1.3 - NEW)
Items now include advanced planning capabilities:
- **baseline_start_date / baseline_end_date**: Locked baseline dates
- **dependencies**: JSON array of dependent item IDs
- **is_baseline_locked**: Boolean flag for baseline lock status
- **actual_start_date / actual_end_date**: Track actual work dates
- **critical_path_flag**: Boolean flag indicating critical path items

### Key Database Features
- **Schema Version 11**: Latest schema with planning module features (v1.3)
- **Offline-First**: All operations work without internet
- **Sync Status**: Track pending/synced/failed states for all records
- **Photo Storage**: JSON arrays for multiple photos per record
- **Relationships**: Full foreign key relationships between all entities
- **Cascade Deletion**: Deleting projects removes all associated sites, items, and related data

### WatermelonDB Important Notes

**Field Naming Convention** (CRITICAL):
- **Schema** uses `snake_case` column names (e.g., `supervisor_id`, `start_date`)
- **Models** use `@field('snake_case')` decorator with camelCase property names
- **Creating/Updating Records** MUST use camelCase property names

```typescript
// ✅ CORRECT - Use camelCase property names when creating records
await database.write(async () => {
  await database.collections.get('sites').create((site) => {
    site.name = 'My Site';
    site.supervisorId = 'supervisor-1';  // ✅ camelCase
    site.projectId = 'project-123';      // ✅ camelCase
  });
});

// ❌ WRONG - Do NOT use snake_case
site.supervisor_id = 'supervisor-1';  // ❌ Will save as empty string!
```

**Querying Records** - Use snake_case column names:
```typescript
// ✅ CORRECT - Use snake_case in queries
database.collections.get('sites')
  .query(Q.where('supervisor_id', 'supervisor-1'))
```

**Timestamp Fields**:
- Schema defines timestamps as `type: 'number'`
- Models use `@field('field_name')` with `number` type (NOT `@date`)
- Always pass timestamps as `new Date().getTime()` or a number

**Auto-managed Fields**:
- `created_at` and `updated_at` are automatically managed by WatermelonDB
- Do NOT declare them in your models with decorators
- They are accessible but should not be set manually

**Sync Status Field** (CRITICAL):
- WatermelonDB's Model class has a built-in `syncStatus` property
- To avoid conflicts, use `syncStatusField` as the property name
- Decorator maps to schema: `@field('sync_status') syncStatusField!: string`
- This applies to: ProgressLogModel, HindranceModel, DailyReportModel, SiteInspectionModel

## Development Commands

- **Testing**: `npm test` or `yarn test` - Run tests with Jest (35 tests passing)
- **Testing with Coverage**: `npm test -- --coverage` - Generate coverage report
- **Linting**: `npm run lint` or `yarn lint` - Check code style with ESLint
- **Fast Refresh**: When Metro is running, save changes to files to automatically reload them (powered by Fast Refresh)

### Testing (v1.3 - NEW)

The project now includes comprehensive automated testing:

**Test Coverage:**
- 35 tests passing (100% pass rate)
- Test execution time: ~7 seconds
- Coverage: ItemModel 100%, PlanningService 13.47%

**Test Suites:**
- **PlanningService Tests** (9 tests): Circular dependency detection, linear dependencies, branching dependencies, self-dependencies, missing dependencies handling
- **ItemModel Tests** (26 tests): Dependency JSON parsing, duration calculations, variance calculations, progress percentage calculations

**Quick Commands:**
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test PlanningService.test.ts

# Run in watch mode
npm test -- --watch
```

**Documentation:**
- See [TESTING_QUICKSTART.md](./TESTING_QUICKSTART.md) for a 10-minute testing guide
- See [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) for comprehensive testing strategy

## Architecture

The application implements a role-based navigation system with offline-first architecture:

```
MainNavigator
├── AuthNavigator
│   └── LoginScreen (Database-based authentication)
└── Role-specific Navigators
    ├── AdminNavigator (Bottom Tabs - 3 screens) [v1.2 NEW]
    │   ├── AdminDashboardScreen (🏠 Dashboard)
    │   │   ├── Statistics (projects, sites, users, items)
    │   │   ├── Role Switcher (test different role views)
    │   │   └── Quick access to management screens
    │   ├── ProjectManagementScreen (📁 Projects)
    │   │   ├── CRUD operations for projects
    │   │   ├── Searchable project list
    │   │   ├── Status management (Active/Completed/On Hold/Cancelled)
    │   │   └── CASCADE DELETE (removes all sites, items, and related data)
    │   └── RoleManagementScreen (👥 Users)
    │       ├── CRUD operations for users
    │       ├── Role assignment
    │       ├── Activate/Deactivate accounts
    │       └── Searchable user list
    ├── SupervisorNavigator (Bottom Tabs - 7 screens)
    │   ├── DailyReportsScreen (📝 Reports) - Submit progress
    │   ├── ReportsHistoryScreen (📊 History) - View submitted reports
    │   ├── ItemsManagementScreen (📋 Items) - Manage work items
    │   ├── MaterialTrackingScreen (🚚 Materials) - Track materials
    │   ├── SiteManagementScreen (🏗️ Sites) - Manage sites
    │   ├── HindranceReportScreen (⚠️ Issues) - Report hindrances with photos
    │   └── SiteInspectionScreen (🔍 Inspection) - Site inspections
    ├── ManagerNavigator (Bottom Tabs)
    │   ├── ProjectOverviewScreen
    │   ├── TeamManagementScreen
    │   ├── FinancialReportsScreen
    │   └── ResourceAllocationScreen
    ├── PlanningNavigator (Bottom Tabs)
    │   ├── BaselineScreen (v1.3 - NEW) - Project planning with dependencies
    │   ├── GanttChartScreen
    │   ├── ScheduleManagementScreen
    │   ├── ResourcePlanningScreen
    │   └── MilestoneTrackingScreen
    └── LogisticsNavigator (Bottom Tabs)
        ├── MaterialTrackingScreen
        ├── EquipmentManagementScreen
        ├── DeliverySchedulingScreen
        └── InventoryManagementScreen
```

### Admin Role Features (v1.2 - NEW)
The admin role provides complete system administration:

**Dashboard**:
- Real-time statistics (total projects, sites, users, items)
- Role switcher to view app as different roles
- Quick navigation to management screens

**Project Management**:
- Create, edit, and delete projects
- Search projects by name, client, or status
- Status management with color-coded chips
- **CASCADE DELETE**: Deleting a project removes all associated:
  - Sites
  - Items
  - Progress logs
  - Hindrances
  - Materials
  - Daily reports
  - Site inspections

**User & Role Management**:
- Create, edit, and delete users
- Assign roles (Admin, Supervisor, Manager, Planner, Logistics)
- Activate/Deactivate user accounts
- Search users by username, name, or email
- Password management
- Role-based color coding

### Supervisor Features
The supervisor role has the most complete implementation with 7 screens:
1. **Daily Reports**: Update item progress and submit daily reports
2. **Reports History**: View, filter, and search submitted reports with date/site filters
3. **Items Management**: Create and manage construction work items
4. **Materials**: Track material quantities (required/available/used)
5. **Sites**: Create and manage construction sites
6. **Hindrance Reports**: Report issues with photos (camera/gallery), priority, and status tracking
7. **Site Inspection**: Conduct site inspections with comprehensive checklists

## Test Credentials

The app comes with 5 pre-configured test accounts (seeded on first launch):

```
Admin:      admin      / admin123
Supervisor: supervisor / supervisor123
Manager:    manager    / manager123
Planner:    planner    / planner123
Logistics:  logistics  / logistics123
```

### Quick Login
Use the **Demo Users** buttons on the login screen to quickly fill credentials and test different roles.

### Testing Admin Features
1. Click the red "Admin" button on login screen
2. Explore the 3 admin tabs: Dashboard, Projects, Users
3. Try creating/editing/deleting projects and users
4. Test the role switcher to view other role interfaces
5. See the complete test plan in [ADMIN_TEST_PLAN.md](./ADMIN_TEST_PLAN.md)

## Step 4: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Documentation

### Architecture & Database
- [Unified Architecture](./ARCHITECTURE_UNIFIED.md) - Complete unified architecture documentation
- [Architecture Documentation](./ARCHITECTURE.md) - Detailed technical architecture overview
- [Database Schema](./DATABASE.md) - Complete database schema documentation

### Testing Documentation (v1.3 - NEW)
- [Testing Quick Start](./TESTING_QUICKSTART.md) - 10-minute testing guide
- [Testing Strategy](./TESTING_STRATEGY.md) - Comprehensive testing strategy
- [Testing Session Checklist](./TESTING_SESSION_CHECKLIST.md) - Manual testing checklist
- [Admin Test Plan](./ADMIN_TEST_PLAN.md) - Admin features testing guide (v1.2)

### Planning Module Documentation (v1.3 - NEW)
- [Planning Module Status](./PLANNING_MODULE_IMPLEMENTATION_STATUS.md) - Implementation status and progress
- [Planning Module Quick Start](./PLANNING_MODULE_QUICK_START.md) - User guide for planning features
- [Planning Module Fixes](./PLANNING_MODULE_FIXES_v1.3.md) - UX fixes and improvements
- [Planning Testing Plan](./PLANNING_MODULE_TESTING_PLAN.md) - Comprehensive testing plan

## Version History

### v1.3 - Planning Module & Testing Infrastructure (Current)
- ✅ Database schema upgraded to v11 (7 new planning fields in items table)
- ✅ Planning Service with critical path calculation (Kahn's algorithm)
- ✅ Baseline Planning Screen with visual indicators
- ✅ Dependency management with circular detection
- ✅ Progress metrics and forecasting
- ✅ Schedule variance tracking
- ✅ ScheduleRevisionModel for tracking changes
- ✅ ItemModel helper methods (7 new methods)
- ✅ Automated testing infrastructure (Jest + 35 tests)
- ✅ UX fixes for critical path visualization
- **Components Added**: BaselineScreen (295 lines), ItemPlanningCard (250 lines), DependencyModal (184 lines), ProjectSelector (71 lines), PlanningService (479 lines)

### v1.2 - Admin Role Implementation
- ✅ Database schema upgraded to v10
- ✅ User and role management tables
- ✅ Admin Navigator with 3 screens
- ✅ Project Management with CASCADE DELETE
- ✅ User & Role Management (CRUD)
- ✅ Role assignment and account activation
- ✅ Database-based authentication
- ✅ Role switcher for testing different views
- ✅ Offline-first admin operations

### v1.1 - Navigation UX Improvements
- Enhanced supervisor navigation with 7 screens
- Site context persistence
- Role switching capabilities

### v1.0 - Site Inspection Feature
- Comprehensive safety and quality checklists
- Photo documentation
- Follow-up management

### v0.9 - Hindrance Reporting
- Photo capture (camera/gallery)
- Priority and status tracking

### v0.8 - Daily Reports History
- View submitted reports
- Date and site filtering
- Search functionality

## Troubleshooting

### Database Issues

**Clear App Data** (if you need to reset the database):
```sh
# Android
adb shell pm clear com.site_progress_tracker

# iOS
# Uninstall and reinstall the app
```

**Common Issues**:

1. **"Cannot read property 'type' of undefined"**: This means there's a mismatch between model field decorators and schema. Ensure:
   - All timestamp fields use `@field()` decorator, NOT `@date()`
   - Field types in models match schema types
   - No `@readonly @date` decorators for `created_at`/`updated_at`

2. **Empty field values after insert**: You're using snake_case instead of camelCase when creating records. Always use camelCase property names.

3. **Query returns no results**: Make sure to use snake_case column names in `Q.where()` queries.

For general React Native issues, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

### Admin Feature Limitations (v1.2)

**Current State**:
- ✅ Fully functional CRUD operations
- ✅ Offline-first with WatermelonDB
- ✅ Cascade deletion implemented
- ✅ Role-based authentication

**Known Limitations**:
1. **Passwords**: Currently stored as plaintext. Production implementation should use bcrypt or similar hashing.
2. **Permissions**: Role permissions defined but not enforced. All admin users have full access.
3. **Audit Trail**: Admin actions not logged. No history of who changed what.
4. **Undo**: No undo functionality for deletions (except database restore).
5. **Advanced Search**: Basic search only. No filters by date, status combinations, etc.

**Future Enhancements** (Roadmap):
- [ ] Password hashing with bcrypt
- [ ] Role-based permission enforcement
- [ ] Audit logging for admin actions
- [ ] Bulk user import/export (CSV)
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Advanced filtering and sorting
- [ ] Soft delete with restore capability
- [ ] Admin dashboard analytics charts
- [ ] Email notifications for account changes

## Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
