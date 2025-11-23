# Construction Site Progress Tracker - Unified Architecture Documentation

## Project Overview

A React Native mobile application designed for construction site management with offline-first capabilities using WatermelonDB. The application features role-based navigation for different construction team members (Supervisors, Managers, Planners, Logistics) with comprehensive progress tracking, reporting, material management, and advanced planning capabilities.

**Current Version**: v2.10 (Manager Role Implementation - Phase 2 Complete)
**Database Schema Version**: 29 (Manager Milestones & Progress Tracking)
**Platform**: React Native (Android & iOS)
**Last Updated**: November 23, 2025

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Architecture Layers](#architecture-layers)
3. [Navigation Architecture](#navigation-architecture)
4. [Database Architecture](#database-architecture)
5. [Service Layer](#service-layer)
6. [Key Features](#key-features)
7. [Development Practices](#development-practices)
8. [Technical Stack](#technical-stack)

---

## Project Structure

### Current Implementation

The project follows a **hybrid structure** where actual implementation resides in `/src/`, `/models/`, and `/services/` directories, with placeholder directories at root level for future expansion.

```
site_progress_tracker/
├── android/                      # Android native code
├── ios/                          # iOS native code
├── models/                       # WatermelonDB models and schema (Schema v12)
│   ├── migrations/               # Database migration files
│   │   ├── 001-initial.js        # Initial schema
│   │   ├── 002-daily-reports.js  # Added daily_reports table
│   │   ├── 003-hindrances-photos.js # Added photos to hindrances
│   │   ├── 004-admin-users-roles.js # Added users and roles tables (v9→v10)
│   │   ├── 005-planning-fields.js # Added planning fields to items (v10→v11)
│   │   └── 006-wbs-fields.js     # Added WBS fields to items (v11→v12)
│   ├── schema/                   # Database schema definitions
│   │   └── index.ts              # Schema v12 definition
│   ├── CategoryModel.ts          # Item/material category model
│   ├── InterfacePointModel.ts    # Interface coordination points (v1.4 - NEW)
│   ├── TemplateModuleModel.ts    # Reusable work templates (v1.4 - NEW)
│   ├── BomModel.ts               # Bill of Materials model (v2.3 - Activity 4)
│   ├── BomItemModel.ts           # BOM line items model (v2.3 - Activity 4)
│   ├── DoorsPackageModel.ts      # DOORS equipment specifications (v2.4 - Activity 4 Phase 2)
│   ├── DoorsRequirementModel.ts  # DOORS compliance requirements (v2.4 - Activity 4 Phase 2)
│   ├── VendorModel.ts            # Vendor master data (v2.4 - Activity 4 Phase 3)
│   ├── RfqModel.ts               # Request for Quotation records (v2.4 - Activity 4 Phase 3)
│   ├── RfqVendorQuoteModel.ts    # Vendor quote submissions (v2.4 - Activity 4 Phase 3)
│   ├── MilestoneModel.ts         # Project milestone definitions (v2.10 - Phase 1)
│   ├── MilestoneProgressModel.ts # Site-level milestone progress tracking (v2.10 - Phase 1)
│   ├── DailyReportModel.ts       # Daily reports model
│   ├── HindranceModel.ts         # Hindrance/obstacle model (with photos)
│   ├── ItemModel.ts              # Construction work items model
│   ├── MaterialModel.ts          # Material model
│   ├── ProgressLogModel.ts       # Progress log model
│   ├── ProgressReportModel.ts    # Progress report model (legacy)
│   ├── ProjectModel.ts           # Project model
│   ├── RoleModel.ts              # User roles model (v1.2)
│   ├── SiteInspectionModel.ts    # Site inspection model (v1.0)
│   ├── SiteModel.ts              # Construction site model
│   ├── ScheduleRevisionModel.ts  # Schedule revision model (v1.3 - NEW)
│   ├── TaskModel.ts              # Task model (legacy)
│   ├── UserModel.ts              # User accounts model (v1.2)
│   └── database.ts               # Database initialization
├── services/                     # Application services
│   ├── BomImportExportService.ts # BOM Excel export service (v2.3 - Activity 4)
│   ├── BomLogisticsService.ts    # BOM-Logistics integration (v2.4 - Activity 4.5)
│   ├── BomDoorsLinkingService.ts # BOM-DOORS automated linking (v2.4 - Phase 2)
│   ├── DoorsEditService.ts       # DOORS edit operations (v2.4 - Phase 3)
│   ├── DoorsStatisticsService.ts # DOORS KPI calculations (v2.4 - Phase 2)
│   ├── RfqService.ts             # RFQ operations & workflows (v2.4 - Phase 3)
│   ├── UnlinkBomItemsService.ts  # BOM-DOORS unlinking (v2.4 - Phase 3)
│   ├── planning/                 # Planning services (v1.3 - NEW)
│   │   ├── PlanningService.ts    # Critical path, metrics, forecasting
│   │   └── WBSCodeGenerator.ts   # WBS code generation (v1.4 - NEW)
│   ├── db/                       # Database services
│   │   ├── SimpleDatabaseService.ts  # Basic database service & initialization
│   │   └── DatabaseService.ts        # Enhanced database service with queries
│   ├── network/                  # Network monitoring (Week 8 - NEW)
│   │   └── NetworkMonitor.ts     # Real-time network state monitoring (240 lines)
│   ├── offline/                  # Offline functionality
│   │   └── OfflineService.ts     # Network status & offline management
│   ├── pdf/                      # PDF generation services
│   │   └── ReportPdfService.ts   # Report PDF generation (disabled)
│   ├── storage/                  # Secure storage services
│   │   └── TokenStorage.ts       # JWT token management (AsyncStorage)
│   └── sync/                     # Sync functionality (Activity 2 - Complete)
│       ├── SyncService.ts        # Core sync engine with retry & DLQ (1,132 lines)
│       └── AutoSyncManager.ts    # Auto-sync triggers & state management (398 lines)
├── src/                          # Application source code (ACTIVE)
│   ├── auth/                     # Authentication screens
│   │   └── LoginScreen.tsx       # User login screen
│   ├── logistics/                # Logistics-specific screens (10 screens - v2.4)
│   │   ├── LogisticsDashboardScreen.tsx   # KPI dashboard with DOORS metrics
│   │   ├── MaterialTrackingScreen.tsx     # BOM-integrated material tracking
│   │   ├── DoorsRegisterScreen.tsx        # DOORS packages list & management (v2.4)
│   │   ├── DoorsDetailScreen.tsx          # DOORS package details & requirements (v2.4)
│   │   ├── DoorsPackageEditScreen.tsx     # Edit DOORS packages (v2.4 Phase 3)
│   │   ├── DoorsRequirementEditScreen.tsx # Edit individual requirements (v2.4 Phase 3)
│   │   ├── RfqListScreen.tsx              # RFQ list with filtering (v2.4 Phase 3)
│   │   ├── RfqDetailScreen.tsx            # RFQ details with 3 tabs (v2.4 Phase 3)
│   │   ├── RfqCreateScreen.tsx            # 4-step RFQ creation wizard (v2.4 Phase 3)
│   │   ├── EquipmentManagementScreen.tsx  # Legacy equipment management
│   │   ├── DeliverySchedulingScreen.tsx   # Delivery scheduling
│   │   ├── InventoryManagementScreen.tsx  # Inventory management
│   │   └── components/                    # Logistics components
│   │       ├── BomRequirementCard.tsx     # BOM card with DOORS section
│   │       └── DoorsLinkingModal.tsx      # Manual BOM-DOORS linking modal
│   ├── manager/                  # Manager-specific screens (6 screens - v2.10)
│   │   ├── ManagerDashboardScreen.tsx   # Project overview with 8 KPIs (v2.10 Phase 2, 550+ lines)
│   │   ├── TeamManagementScreen.tsx     # Team management (stub)
│   │   ├── FinancialReportsScreen.tsx   # Financial reports (stub)
│   │   ├── ResourceRequestsScreen.tsx   # Resource requests (stub)
│   │   ├── BomManagementScreen.tsx      # BOM Management (v2.3 - Activity 4, 1,450+ lines)
│   │   └── context/
│   │       ├── ManagerContext.tsx       # Manager state management (v2.10 Phase 1)
│   │       └── BomContext.tsx           # BOM state management (v2.3)
│   ├── planning/                 # Planning-specific screens (7 screens - v1.7 workflow order)
│   │   ├── SiteManagementScreen.tsx    # Site creation & supervisor assignment (v1.7 - NEW)
│   │   ├── WBSManagementScreen.tsx     # WBS management (v1.4)
│   │   ├── ResourcePlanningScreen.tsx  # Resource planning (stub)
│   │   ├── ScheduleManagementScreen.tsx # Schedule management (stub)
│   │   ├── GanttChartScreen.tsx        # Timeline visualization (placeholder)
│   │   ├── BaselineScreen.tsx          # Baseline planning (v1.3)
│   │   ├── MilestoneTrackingScreen.tsx # Milestone tracking (stub)
│   │   ├── ItemCreationScreen.tsx      # Create/Edit WBS items (v1.4)
│   │   └── components/                 # Planning components
│   │       ├── SiteSelector/SimpleSiteSelector.tsx # Site selector with observables (v1.7)
│   │       ├── SupervisorAssignmentPicker.tsx # Supervisor picker (v1.7 - NEW)
│   │       ├── ProjectSelector.tsx     # Project dropdown selector (v1.3)
│   │       ├── ItemPlanningCard.tsx    # Item card with date pickers (v1.3)
│   │       ├── DependencyModal.tsx     # Dependency management modal (v1.3)
│   │       ├── WBSItemCard.tsx         # WBS item display card (v1.4)
│   │       ├── CategorySelector.tsx    # Category dropdown (v1.4)
│   │       └── PhaseSelector.tsx       # Phase dropdown (v1.4)
│   ├── admin/                    # Admin-specific screens (4 screens - v2.2)
│   │   ├── AdminDashboardScreen.tsx      # Admin dashboard with statistics
│   │   ├── ProjectManagementScreen.tsx   # Project CRUD with cascade delete
│   │   ├── RoleManagementScreen.tsx      # User & role management
│   │   ├── SyncMonitoringScreen.tsx      # Sync monitoring & DLQ management (Week 8 - NEW)
│   │   ├── context/
│   │   │   └── AdminContext.tsx          # Admin role switching context
│   │   └── components/
│   │       ├── ProjectCard.tsx           # Project display card
│   │       ├── UserCard.tsx              # User display card
│   │       └── StatisticsCard.tsx        # Dashboard statistics
│   ├── components/               # Shared UI components (Week 8 - NEW)
│   │   └── SyncIndicator.tsx     # Real-time sync status indicator (200 lines)
│   ├── supervisor/               # Supervisor-specific screens (7 screens)
│   │   ├── DailyReportsScreen.tsx        # Submit daily progress reports
│   │   ├── ReportsHistoryScreen.tsx      # View submitted reports history
│   │   ├── HindranceReportScreen.tsx     # Report and track hindrances/issues
│   │   ├── ItemsManagementScreen.tsx     # Manage construction items
│   │   ├── MaterialTrackingScreen.tsx    # Track materials
│   │   ├── SiteManagementScreen.tsx      # Manage sites
│   │   ├── SiteInspectionScreen.tsx      # Site inspections (v1.0)
│   │   ├── context/
│   │   │   └── SiteContext.tsx           # Shared site selection context
│   │   └── components/
│   │       └── SiteSelector.tsx          # Reusable site selector component
│   ├── nav/                      # Navigation components
│   │   ├── MainNavigator.tsx     # Root navigator
│   │   ├── AuthNavigator.tsx     # Authentication flow navigator (database-based)
│   │   ├── RoleSelectionScreen.tsx # Role selection screen (legacy)
│   │   ├── AdminNavigator.tsx    # Admin bottom tabs (6 tabs - v2.10)
│   │   ├── SupervisorNavigator.tsx # Supervisor bottom tabs (7 tabs)
│   │   ├── ManagerNavigator.tsx   # Manager bottom tabs (5 tabs - v2.10)
│   │   ├── PlanningNavigator.tsx  # Planning bottom tabs (7 tabs - v1.7 workflow order)
│   │   ├── LogisticsNavigator.tsx # Logistics bottom tabs (4 tabs)
│   │   └── types.ts              # Navigation type definitions
│   └── utils/                    # Utility screens and helpers (v2.10)
│       ├── Phase1TestUtility.tsx        # Phase 1 milestone testing utility
│       ├── ManagerTestDataUtility.tsx   # Manager dashboard test data generator
│       └── demoData/                    # Demo data seeders
│           ├── DoorsSeeder.ts           # DOORS demo data (v2.4)
│           └── RfqSeeder.ts             # RFQ demo data (v2.4)
├── __tests__/                    # Test files (v1.3+)
│   ├── models/                   # Model tests
│   │   ├── ItemModel.test.ts     # ItemModel tests (26 tests)
│   │   ├── InterfacePointModel.test.ts # InterfacePointModel tests (v1.4 - NEW)
│   │   ├── TemplateModuleModel.test.ts # TemplateModuleModel tests (v1.4 - NEW)
│   │   └── schema-v12.test.ts    # Schema v12 tests (v1.4 - NEW)
│   ├── services/                 # Service tests
│   │   ├── PlanningService.test.ts # PlanningService tests (9 tests)
│   │   └── WBSCodeGenerator.test.ts # WBS code generator tests (v1.4 - NEW)
│   └── planning/                 # Planning screen tests (v1.4 - NEW)
│       ├── ItemCreationScreen.test.tsx
│       └── WBSManagementScreen.test.tsx
├── prompts/                      # Project prompts and documentation
├── node_modules/                 # NPM dependencies
├── .vscode/                      # VS Code settings
├── .eslintrc.js                  # ESLint configuration
├── .gitignore                    # Git ignore patterns
├── .prettierrc.js                # Prettier configuration
├── .watchmanconfig               # Watchman configuration
├── app.json                      # App configuration
├── App.tsx                       # Main application component
├── babel.config.js               # Babel configuration (decorator support)
├── ARCHITECTURE.md               # Architecture documentation
├── ARCHITECTURE_UNIFIED.md       # This file - unified architecture
├── CLAUDE.md                     # Claude Code instructions
├── CONSTRUCTION_APP_README.md    # Construction app documentation
├── CONSTRUCTION_APP_STRUCTURE.md # Construction app structure (reference)
├── DATABASE.md                   # Database schema documentation
├── Gemfile                       # Ruby dependencies (for iOS)
├── index.js                      # App entry point
├── jest.config.js                # Jest configuration (v1.3 - configured)
├── jest.setup.js                 # Jest setup with mocks (v1.3 - NEW)
├── metro.config.js               # Metro bundler configuration
├── package.json                  # Project dependencies and scripts
├── README.md                     # Project README
├── tsconfig.json                 # TypeScript configuration
└── [Empty placeholder directories for future expansion:]
    ├── auth/                     # (Empty - actual code in src/auth/)
    ├── components/               # (Empty subdirs - for future shared components)
    │   ├── construction/
    │   ├── forms/
    │   ├── gantt/
    │   ├── tracking/
    │   └── ui/
    ├── manager/                  # (Empty - actual code in src/manager/)
    ├── planning/                 # (Empty - actual code in src/planning/)
    ├── screens/                  # (Empty - for future general screens)
    ├── supervisor/               # (Empty - actual code in src/supervisor/)
    └── utils/                    # (Empty subdirs - for future utilities)
        ├── formatters/
        ├── helpers/
        ├── storage/
        └── validation/
```

### Directory Organization Best Practices

1. **Active Code Location**: All active TypeScript/React code is in `/src/`, `/models/`, and `/services/`
2. **Model Layer**: Database models are in `/models/` (NOT `/src/db/` or `/src/models/`)
3. **Service Layer**: All services are in `/services/` (NOT `/src/services/`)
4. **Role-based Screens**: Each role has dedicated screens in `src/{role}/`
5. **Shared Navigation**: Navigation setup is in `src/nav/`
6. **Future Expansion**: Root-level placeholder directories exist for future shared components and utilities

---

## Architecture Layers

### 1. Presentation Layer (`src/`)

**Purpose**: UI components, screens, and navigation logic

#### Authentication Flow
- **Location**: `src/auth/`
- **Components**: LoginScreen, RoleSelectionScreen
- **Pattern**: Simple credential-based authentication with role selection

#### Role-based Screens
Screens are organized by user role for clear separation of concerns:

- **Admin** (`src/admin/`): 3 screens for system administration (v1.2)
  - Dashboard with statistics and role switcher
  - Project management with CASCADE deletion
  - User and role management (CRUD operations)
  - **Context Management**: AdminContext provides role switching and state management

- **Supervisor** (`src/supervisor/`): 7 screens for field operations
  - Daily report submission, history viewing, hindrance reporting
  - Item management, material tracking, site management
  - Site inspections with safety checklists
  - **Context Management**: SiteContext provides shared site selection across all supervisor screens

- **Manager** (`src/manager/`): 4 screens for project oversight
  - Project overview, team management
  - Financial reports, resource allocation

- **Planning** (`src/planning/`): 7 screens for scheduling (v1.3-v1.5)
  - Baseline planning with critical path calculation (v1.3)
  - Dependency management with circular detection (v1.3)
  - WBS Management with hierarchical item structure (v1.4 - NEW)
  - Item Creation/Editing with auto-generated WBS codes (v1.4 - NEW)
  - Gantt charts, schedule management
  - Resource planning, milestone tracking

- **Logistics** (`src/logistics/`): 4 screens for materials/equipment
  - Material tracking, equipment management
  - Delivery scheduling, inventory management

#### Navigation Architecture
- **Location**: `src/nav/`
- **Pattern**: Hierarchical navigation with role-based bottom tabs
- **Implementation**: React Navigation v6 (Stack + Bottom Tabs)

### 2. Data Layer (`models/`)

**Purpose**: Database models, schema, and relationships

#### WatermelonDB Models
- **Location**: `/models/` (root level, NOT in src/)
- **Schema Version**: 11 (defined in `models/schema/index.ts`)
- **Pattern**: Model classes extend `Model` with decorators for fields
- **Migrations**: Tracked in `models/migrations/` for schema evolution

#### Core Entities
1. **ProjectModel**: Top-level project container
2. **SiteModel**: Construction sites (belongs to projects)
3. **CategoryModel**: Item categorization
4. **ItemModel**: Construction work items (belongs to sites and categories) - **Enhanced v1.3 with 7 planning fields**
5. **ProgressLogModel**: Progress tracking records (with photos)
6. **HindranceModel**: Issues/obstacles (with photos, timestamps)
7. **MaterialModel**: Material tracking
8. **DailyReportModel**: Aggregated daily reports
9. **SiteInspectionModel**: Safety inspection checklists (v1.0)
10. **UserModel**: User accounts with authentication (v1.2)
11. **RoleModel**: User roles and permissions (v1.2)
12. **ScheduleRevisionModel**: Schedule revision tracking (v1.3 - NEW)

#### Field Naming Convention (CRITICAL)
- **Schema columns**: `snake_case` (e.g., `supervisor_id`, `start_date`)
- **Model properties**: camelCase (e.g., `supervisorId`, `startDate`)
- **Decorator usage**: `@field('snake_case_column') camelCaseProperty!: type`
- **When creating records**: Always use camelCase property names
- **In queries**: Use snake_case column names with `Q.where()`

#### Sync Status Field (CRITICAL - RESOLVED v2.2)
- **Issue**: WatermelonDB's Model class has a built-in read-only `syncStatus` property (SyncStatus enum)
- **Solution**: Use `appSyncStatus` as the property name to avoid conflicts with WatermelonDB's internal sync tracking
- **Pattern**: `@field('sync_status') appSyncStatus!: string`
- **Database Column**: Remains `sync_status` in schema (no migration needed)
- **Values**: 'pending', 'synced', 'failed' (our application-level sync status)
- **Applies to**: ALL 10 syncable models (Projects, Sites, Categories, Items, Materials, ProgressLogs, Hindrances, DailyReports, SiteInspections, ScheduleRevisions)
- **Code Updated**: All references in SyncService, UI screens, and tests changed from `.syncStatus` to `.appSyncStatus`

### 3. Service Layer (`services/`)

**Purpose**: Business logic, database operations, offline/sync management, authentication & security

#### Authentication Services (`services/auth/`) - Activity 1 Complete
Complete security implementation with password hashing, JWT tokens, and session management.

**AuthService.ts** - User authentication
- `login()`: Validate credentials with bcrypt comparison
- `logout()`: Clear tokens and revoke session
- `refreshToken()`: Generate new access token from refresh token
- **Integration**: JWT tokens, session management, bcrypt password comparison

**TokenService.ts** - JWT token management
- `generateAccessToken()`: Create access token (15min expiry)
- `generateRefreshToken()`: Create refresh token (7 days expiry)
- `validateToken()`: Verify JWT signature and expiry
- **Token Payload**: userId, username, role, sessionId, iat, exp
- **Secrets**: Strong 256-bit secrets stored in config/jwt.config.ts

**SessionService.ts** - Session tracking
- `createSession()`: Create new session on login
- `validateSession()`: Check if session is active and not expired
- `revokeSession()`: Invalidate session (logout or password reset)
- `cleanupExpiredSessions()`: Automatic cleanup job
- **Tracking**: Device info, IP address, created_at, expires_at, revoked_at

**PasswordResetService.ts** - Password management
- `resetPassword()`: Admin-assisted password reset
- `changePassword()`: User-initiated password change
- `validatePasswordStrength()`: Enforce password policy
- `checkPasswordHistory()`: Prevent reuse of last 5 passwords
- **Policy**: 8+ chars, uppercase, lowercase, number, special char

**PasswordMigrationService.ts** - One-time migration (Activity 1)
- `migrateAllPasswords()`: Hash all plaintext passwords
- `verifyMigration()`: Validate bcrypt comparison works
- **Status**: Migration complete, service no longer needed

**Security Score: 9/10** (up from 1/10)
- ✅ Zero plaintext passwords
- ✅ Bcrypt hashing (salt rounds: 12)
- ✅ JWT authentication with refresh tokens
- ✅ Session tracking and revocation
- ✅ Password strength enforcement
- ✅ Password reuse prevention

#### Database Services (`services/db/`)
- **SimpleDatabaseService.ts**: Basic initialization and default data setup
- **DatabaseService.ts**: Enhanced service with lazy loading via `getDatabase()`
- **Pattern**: Lazy initialization to avoid timing issues

#### Offline Services (`services/offline/`)
- **OfflineService.ts**: Network status monitoring and offline capability management
- **Pattern**: NetInfo integration for connectivity detection

#### Sync Services (`services/sync/`)
- **SyncService.ts**: Complete bidirectional data synchronization (675 lines)
- **Pattern**: Queue-based sync with version-based conflict resolution
- **Implementation**: Activity 2 (Weeks 6-7) - Complete offline-first sync system

**Key Features:**
1. **Bidirectional Sync**
   - `syncDown()`: Pull latest changes from server
   - `syncUp()`: Push local changes to server
   - Atomic database operations with transaction support
   - Network detection with automatic sync trigger

2. **Conflict Resolution (Week 7, Days 2-3)**
   - Last-Write-Wins (LWW) strategy
   - Version comparison using `_version` field
   - Timestamp tie-breaker for same versions
   - Generic `shouldApplyServerData()` helper for all models

3. **Dependency-Aware Sync (Week 7, Day 4)**
   - Kahn's algorithm for topological sorting
   - O(V+E) time complexity
   - Ensures dependencies sync before dependents
   - Circular dependency detection and handling
   - `topologicalSortItems()` method (118 lines)

4. **Queue Management**
   - Local change tracking in `sync_queue` table
   - Retry logic with exponential backoff
   - Error logging with `last_error` field
   - Automatic cleanup of successfully synced items

5. **API Integration**
   - RESTful endpoints for all 10 syncable models
   - JWT authentication with token management
   - Batch operations for efficiency
   - Comprehensive error handling

**Syncable Models (10 total):**
- ProjectModel, SiteModel, CategoryModel
- ItemModel, MaterialModel
- ProgressLogModel, HindranceModel
- DailyReportModel, SiteInspectionModel, ScheduleRevisionModel

**Testing:**
- Kahn's algorithm test suite: `scripts/testKahnsAlgorithm.js`
- 4 test scenarios (simple linear, branching, complex project, circular detection)
- All tests passing with correct dependency order

#### PDF Services (`services/pdf/`)
- **ReportPdfService.ts**: PDF generation for reports
- **Status**: Currently disabled, reserved for future use

### 4. Platform Layer (`android/`, `ios/`)

**Purpose**: Native code for each platform

- React Native bridge implementations
- Platform-specific configurations
- Native module integrations (camera, file system, etc.)

---

## Navigation Architecture

### Hierarchical Structure

```
MainNavigator (Stack)
├── AuthNavigator (Stack)
│   ├── LoginScreen (Database-based authentication)
│   └── RoleSelectionScreen (Legacy - not used in v1.2)
└── Role-specific Navigators (Bottom Tabs)
    ├── AdminNavigator (3 tabs - v1.2)
    │   ├── AdminDashboardScreen (🏠 Dashboard)
    │   ├── ProjectManagementScreen (📁 Projects)
    │   └── RoleManagementScreen (👥 Users)
    ├── SupervisorNavigator (7 tabs)
    │   ├── DailyReportsScreen (📝 Reports)
    │   ├── ReportsHistoryScreen (📊 History)
    │   ├── ItemsManagementScreen (📋 Items)
    │   ├── MaterialTrackingScreen (🚚 Materials)
    │   ├── SiteManagementScreen (🏗️ Sites)
    │   ├── HindranceReportScreen (⚠️ Issues)
    │   └── SiteInspectionScreen (🔍 Inspection)
    ├── ManagerNavigator (4 tabs)
    │   ├── ProjectOverviewScreen (📊 Overview)
    │   ├── TeamManagementScreen (👥 Team)
    │   ├── FinancialReportsScreen (💰 Finance)
    │   └── ResourceAllocationScreen (📦 Resources)
    ├── PlanningNavigator (Stack + Bottom Tabs - v1.7 Workflow Order)
    │   ├── Bottom Tabs (7 tabs - LOGICAL WORKFLOW ORDER)
    │   │   ├── SiteManagementScreen (🏗️ Sites - WHERE work happens) [v1.7 - NEW]
    │   │   ├── WBSManagementScreen (🗂️ WBS - WHAT work to do) [v1.4]
    │   │   ├── ResourcePlanningScreen (👷 Resources - WHO does work) [stub]
    │   │   ├── ScheduleManagementScreen (📅 Schedule - WHEN work happens) [stub]
    │   │   ├── GanttChartScreen (📊 Gantt - VISUALIZE timeline) [placeholder]
    │   │   ├── BaselineScreen (📋 Baseline - LOCK the plan) [v1.3]
    │   │   └── MilestoneTrackingScreen (🏁 Milestones - TRACK progress) [stub]
    │   └── Stack Screens (Modal/Detail screens)
    │       ├── ItemCreation (Create new WBS items) [v1.4]
    │       └── ItemEdit (Edit existing WBS items) [v1.5]
    └── LogisticsNavigator (4 tabs)
        ├── MaterialTrackingScreen (📦 Materials)
        ├── EquipmentManagementScreen (🚜 Equipment)
        ├── DeliverySchedulingScreen (🚚 Delivery)
        └── InventoryManagementScreen (📋 Inventory)
```

### Navigation Patterns

1. **Role-based Access**: Different navigators and screens per role (Admin, Supervisor, Manager, Planner, Logistics)
2. **Database-based Authentication**: Login validates against users table with role-based routing (v1.2)
3. **Bottom Tab Navigation**: Primary navigation within each role
4. **Shared Context**:
   - AdminContext for role switching and admin state management
   - SiteContext for supervisor site selection
5. **Type Safety**: Full TypeScript navigation types in `src/nav/types.ts`

---

## Database Architecture

### Schema Version History

- **v1-v7**: Progressive schema evolution with basic entities
- **v8**: Added Site Inspection support with comprehensive checklists
- **v9**: Preparation for user management features
- **v10**: Added `users` and `roles` tables for Admin role implementation (v1.2)
- **v11**: Added 7 planning fields to `items` table and `schedule_revisions` table (v1.3)
- **v12**: Added WBS fields to `items`, new `interface_points` and `template_modules` tables (v1.4)
- **v13**: Added `password_hash` field to users table (Activity 1, Week 1, Day 2)
- **v14**: Removed plaintext `password` field from users table (Activity 1, Week 1, Day 5)
- **v15**: Added `sessions` table for session management (Activity 1, Week 3, Day 11)
- **v16**: Added `password_history` table for password reuse prevention (Activity 1, Week 3, Day 13)
- **v17**: Added timestamps to sessions and password_history tables (Activity 1, Week 3, Day 15)
- **v18**: Added `sync_status` field to 5 core models for sync tracking (Activity 2, Week 6, Day 1)
- **v19**: Added `sync_queue` table for local change tracking (Activity 2, Week 6, Day 3)
- **v20**: Added `_version` field to 10 syncable models for conflict resolution (Activity 2, Week 7, Day 1)
- **v21**: Added `boms` table for Bill of Materials management (Activity 4, Phase 1, Day 1)
- **v22**: Added `bom_items` table for BOM line items (Activity 4, Phase 1, Day 1)
- **v23**: Added `quantity` and `unit` fields to boms table (Activity 4, Phase 1, Day 2)
- **v24**: Added `site_category` field to boms table (Activity 4, Phase 1, Day 3)
- **v25**: Current version - Added `baseline_bom_id` to boms table for execution tracking (Activity 4, Phase 2)

### Core Collections

#### projects
- Top-level project containers
- Fields: name, client, start_date, end_date, status, budget

#### sites
- Construction sites belonging to projects
- Fields: name, location, project_id, supervisor_id (optional - v1.7)
- **Relationships**: belongs_to project, has_many items/hindrances/daily_reports
- **v1.7 Update**: supervisor_id is now optional to support planner-created sites

#### categories
- Item categorization (Structural, Electrical, Plumbing, etc.)
- Fields: name, description

#### items (Enhanced in v1.3 & v1.4)
- Construction work items with planning and WBS capabilities
- **Core Fields**: name, category_id, site_id, planned_quantity, completed_quantity, unit_of_measurement, planned_start_date, planned_end_date, status, weightage
- **Planning Fields (v1.3)**:
  - `baseline_start_date / baseline_end_date`: Locked baseline dates
  - `dependencies`: JSON array of dependent item IDs
  - `is_baseline_locked`: Boolean flag for baseline lock status
  - `actual_start_date / actual_end_date`: Track actual work dates
  - `critical_path_flag`: Boolean indicating critical path items
- **WBS Fields (v1.4 - NEW)**:
  - `wbs_code`: Auto-generated hierarchical code (e.g., 1.2.3.0)
  - `wbs_level`: Hierarchy level (1-4)
  - `parent_wbs_code`: Parent item's WBS code
  - `project_phase`: Design, Construction, Testing, etc.
  - `is_milestone`: Boolean flag for milestone items
  - `created_by_role`: planner, supervisor, manager
  - `is_critical_path`: Critical path indicator (v1.4 field, separate from v1.3 critical_path_flag)
  - `float_days`: Schedule float/slack
  - `dependency_risk`: low, medium, high
  - `risk_notes`: Risk description and mitigation
- **Relationships**: belongs_to site/category, has_many progress_logs/materials/hindrances

#### progress_logs
- Progress tracking records
- Fields: item_id, date, completed_quantity, reported_by, photos (JSON), notes, sync_status
- **Relationships**: belongs_to item

#### hindrances
- Issues and obstacles
- Fields: title, description, item_id, site_id, priority, status, assigned_to, reported_by, reported_at, photos (JSON), sync_status
- **Relationships**: belongs_to item (optional), belongs_to site

#### materials
- Material tracking and management
- Fields: name, item_id, quantity_required, quantity_available, quantity_used, unit, status, supplier, procurement_manager_id
- **Relationships**: belongs_to item

#### daily_reports
- Aggregated daily progress reports
- Fields: site_id, supervisor_id, report_date, submitted_at, total_items, total_progress, pdf_path, notes, sync_status
- **Relationships**: belongs_to site

#### site_inspections (v1.0)
- Safety inspection checklists
- Fields: site_id, inspector_id, inspection_date, safety_items (JSON), overall_status, notes
- **Relationships**: belongs_to site

#### schedule_revisions (v1.3 - NEW)
- Track schedule changes and their impact
- Fields: item_id, revision_number, old_start_date, old_end_date, new_start_date, new_end_date, reason, impact_description, impacted_items (JSON), created_at
- **Relationships**: belongs_to item
- **Purpose**: Track schedule changes, analyze impact, maintain revision history

#### users (v1.2, updated v2.2 Activity 1)
- User accounts with authentication
- Fields: username, password_hash, full_name, email, phone, is_active, role_id
- **Relationships**: belongs_to role, has_many sessions, has_many password_history
- **Security (v2.2)**: Passwords hashed with bcrypt (salt rounds: 12), JWT token authentication
- **Note**: Plaintext password field removed in Activity 1 (schema v14)

#### sessions (v2.2 - Activity 1, Week 3, Day 11)
- Active session tracking for JWT authentication
- Fields: user_id, access_token, refresh_token, device_info (JSON), ip_address, created_at, expires_at, revoked_at, is_active
- **Relationships**: belongs_to user
- **Purpose**: Track active user sessions with JWT tokens
- **Features**: Session expiry (7 days), device tracking, IP tracking, revocation support
- **Cleanup**: Automatic cleanup of expired sessions

#### password_history (v2.2 - Activity 1, Week 3, Day 13)
- Password reuse prevention
- Fields: user_id, password_hash, created_at
- **Relationships**: belongs_to user
- **Purpose**: Prevent password reuse (stores last 5 password hashes)
- **Security**: Enforces password rotation policy

#### roles (v1.2)
- User roles and permissions
- Fields: name, description, permissions (JSON)
- **Relationships**: has_many users
- **System Roles**: Admin, Supervisor, Manager, Planner, Logistics

#### boms (v2.3 - Activity 4, November 2025)
- Bill of Materials for Pre-Contract (Estimating) and Post-Contract (Execution)
- **Core Fields**:
  - project_id, name, type (estimating/execution), status, version
  - site_category (ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct) - indexed (v24)
  - baseline_bom_id (links execution BOMs to original estimating BOMs) (v25)
  - quantity, unit (v23)
- **Cost Fields**: total_estimated_cost, total_actual_cost, contingency, profit_margin
- **Tender Fields**: tender_date, client, contract_value
- **Status Workflow**:
  - Estimating: draft → submitted → won/lost
  - Execution: baseline → active → closed
- **Relationships**:
  - belongs_to project
  - has_many bom_items
  - belongs_to baseline_bom (self-referential for execution BOMs)
- **Purpose**: Manage project costs from estimation through execution with variance tracking

#### bom_items (v2.3 - Activity 4)
- Individual line items within BOMs
- **Identification**: item_code (auto-generated: MAT-001, LAB-002, EQP-003, SUB-004), description
- **Categories**: material, labor, equipment, subcontractor
- **Quantities**: quantity, unit, unit_cost, total_cost (auto-calculated: quantity × unit_cost)
- **Organization**: phase, wbs_code (optional)
- **Execution Tracking**: actual_quantity, actual_cost (for variance analysis)
- **Relationships**: belongs_to bom
- **Purpose**: Detailed cost breakdown for BOMs with automatic cost calculations

#### interface_points (v1.4 - NEW)
- Interface coordination points between contractors/phases
- Fields: site_id, name, description, responsible_party_1, responsible_party_2, target_date, status, coordination_notes
- **Relationships**: belongs_to site
- **Purpose**: Track handoffs between teams, coordination requirements, and interface dependencies

#### template_modules (v1.4 - NEW)
- Reusable work breakdown templates
- Fields: name, description, category_id, typical_duration, typical_quantity, unit_of_measurement, items_json
- **Relationships**: belongs_to category
- **Purpose**: Quick-start WBS creation from predefined templates (e.g., "Substation Installation" template)

#### sync_queue (v2.2 - Activity 2, Week 6, Day 3)
- Track local changes requiring server synchronization
- Fields: table_name, record_id, action, data (JSON), synced_at, retry_count, last_error, created_at, updated_at
- **Purpose**: Queue-based sync system for reliable data synchronization
- **Actions**: create, update, delete
- **Retry Logic**: Exponential backoff for failed sync attempts
- **Cleanup**: Successfully synced items are marked with synced_at timestamp

### Entity Relationship Diagram

```
┌─────────────┐
│   Project   │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│    Site     │◄────────┐
└──────┬──────┘         │
       │ 1:N            │
       ├────────────────┤
       │                │
┌──────▼──────┐  ┌──────┴──────────┐
│    Item     │  │   Hindrance     │
└──────┬──────┘  └─────────────────┘
       │ 1:N            ▲
       │                │ N:1
       ├────────────────┤
       │                │
┌──────▼──────┐  ┌──────┴──────────┐
│ProgressLog │  │    Material     │
└─────────────┘  └─────────────────┘

┌──────────────┐
│ DailyReport  │──► Site (N:1)
└──────────────┘

┌──────────────┐
│Site          │
│Inspection    │──► Site (N:1)
└──────────────┘

┌──────────────┐
│  Category    │──► Item (1:N)
└──────────────┘

┌──────────────┐        ┌──────────────┐
│    Role      │◄───────│    User      │
│  (v1.2)      │ 1:N    │  (v1.2)      │
└──────────────┘        └──────────────┘
     │                        │
     │                        │ Authentication
     │                        └─► LoginScreen
     └─► Permissions (JSON)
```

### Relationships Summary

- **Project → Sites** (1:N): One project can have multiple construction sites
- **Site → Items** (1:N): One site can have multiple work items
- **Site → Hindrances** (1:N): One site can have multiple issues
- **Site → DailyReports** (1:N): One site can have multiple daily reports
- **Site → SiteInspections** (1:N): One site can have multiple inspections
- **Category → Items** (1:N): Items are categorized
- **Item → ProgressLogs** (1:N): Each item tracks daily progress updates
- **Item → Materials** (1:N): Each item tracks required materials
- **Item → Hindrances** (1:N, optional): Issues can be linked to specific items
- **Role → Users** (1:N): One role can be assigned to multiple users (v1.2)
- **User → Authentication**: Users authenticate via LoginScreen with database validation (v1.2)

### Database Best Practices

1. **Offline-first**: All operations work offline, sync when online
2. **Reactive Queries**: Use WatermelonDB's reactive queries for UI updates
3. **Lazy Loading**: Database initialized via lazy loading pattern
4. **Migration Support**: Schema changes tracked via migrations
5. **Type Safety**: Full TypeScript support for models
6. **Sync Status**: Track sync state with `sync_status` field
7. **Photo Storage**: Photos stored as JSON string arrays
8. **Timestamp Fields**: Use `number` type (milliseconds since epoch)

---

## Service Layer

### Database Services

#### SimpleDatabaseService (`services/db/SimpleDatabaseService.ts`)
- **Purpose**: Database initialization and default data setup
- **Key Methods**:
  - `initializeDefaultData()`: Creates default projects, sites, categories, items
  - Called from `App.tsx` on startup
- **Pattern**: One-time initialization service

#### DatabaseService (`services/db/DatabaseService.ts`)
- **Purpose**: Enhanced database operations with query methods
- **Key Methods**:
  - `getDatabase()`: Lazy database initialization
  - Query methods for各 collections
- **Pattern**: Lazy loading to avoid timing issues

### Offline Service (`services/offline/OfflineService.ts`)
- **Purpose**: Network status monitoring and offline capability management
- **Dependencies**: `@react-native-community/netinfo`
- **Features**:
  - Real-time connectivity detection
  - Offline mode management
  - User notifications for connectivity changes

### Sync Service (`services/sync/SyncService.ts`)
- **Purpose**: Bidirectional data synchronization
- **Process**:
  1. Sync Down: Pull latest data from server when online
  2. Local Changes: All modifications saved locally in WatermelonDB
  3. Sync Up: Push changes to server when connectivity restored
  4. Conflict Resolution: Timestamp-based conflict handling
- **Pattern**: Queue-based sync with retry logic

### PDF Service (`services/pdf/ReportPdfService.ts`)
- **Purpose**: Generate PDF reports for daily progress
- **Status**: Currently disabled, reserved for future implementation
- **Dependency**: `react-native-html-to-pdf`

---

## Key Features

### 1. Role-based Access Control (Enhanced in v1.2)
- Different UI and functionality based on user role
- 5 distinct role types: Admin, Supervisor, Manager, Planner, Logistics
- Database-based authentication with role assignment
- Admin role for system administration and user management
- Role switcher for admins to test different role views

### 2. Offline-first Architecture with Bidirectional Sync (v2.2 - Activity 2)

The application implements a complete offline-first architecture with intelligent bidirectional synchronization:

#### Core Principles
- **Offline by Default**: All operations work without internet connectivity
- **Local-First Storage**: WatermelonDB as the source of truth
- **Automatic Sync**: Seamless sync when connectivity restored
- **Conflict Resolution**: Smart handling of concurrent edits

#### Sync Architecture Components

**A. Sync Down (Pull from Server)**
```
Server → API → Mobile
1. Fetch latest changes from backend API
2. Apply changes in dependency order (Kahn's algorithm)
3. Resolve conflicts using Last-Write-Wins strategy
4. Update local database atomically
```

**Process:**
- Fetches changes for all 10 syncable models
- Sorts items by dependencies before applying
- Compares versions to detect conflicts
- Applies non-conflicting changes immediately
- Resolves conflicts with LWW strategy
- Updates local `_version` and `updated_at` timestamps

**B. Sync Up (Push to Server)**
```
Mobile → sync_queue → API → Server
1. Track local changes in sync_queue table
2. Push pending changes to server
3. Retry failed operations with exponential backoff
4. Mark successfully synced items
```

**Process:**
- Monitors all create/update/delete operations
- Queues changes with action type and payload
- Batches pending items for efficient upload
- Implements retry logic for failed syncs
- Cleans up successfully synced queue items
- Updates `sync_status` field ('pending' → 'synced')

**C. Conflict Resolution (Week 7, Days 2-3)**
```
Conflict Detection → Version Comparison → Resolution → Apply Winner
```

**Strategy: Last-Write-Wins (LWW)**
1. **Version Comparison**: Compare `_version` field
   - Server version > Local version → Apply server data
   - Local version > Server version → Keep local data
2. **Timestamp Tie-breaker**: If versions are equal
   - Compare `updated_at` timestamps
   - Most recent timestamp wins
3. **Automatic Merge**: Non-conflicting fields merged automatically

**Example:**
```typescript
// Local: Item A (version=5, updated_at=1000)
// Server: Item A (version=6, updated_at=1100)
// Result: Apply server data (higher version)

// Local: Item B (version=3, updated_at=2000)
// Server: Item B (version=3, updated_at=1500)
// Result: Keep local data (same version, newer timestamp)
```

**D. Dependency-Aware Sync (Week 7, Day 4)**
```
Kahn's Algorithm → Topological Sort → Dependency Order → Sync
```

**Algorithm: Kahn's Topological Sort**
- **Purpose**: Ensure dependencies sync before dependents
- **Complexity**: O(V+E) where V = vertices (items), E = edges (dependencies)
- **Implementation**: 118 lines in `topologicalSortItems()`

**Steps:**
1. Build adjacency list and in-degree map
2. Find items with zero dependencies (in-degree = 0)
3. Process items in dependency order
4. Detect circular dependencies (remaining items after sort)
5. Append circular items at end (will fail dependency checks)

**Example: Construction Project**
```
Input: [Foundation, Structure, Electrical, Plumbing, Finishing, Site-Prep]
Dependencies:
  - Foundation depends on Site-Prep
  - Structure depends on Foundation
  - Electrical depends on Structure
  - Plumbing depends on Structure
  - Finishing depends on Electrical, Plumbing

Output (sorted): Site-Prep → Foundation → Structure → [Electrical, Plumbing] → Finishing
```

#### Schema Support for Sync (v18-v20)

**v18 Fields: sync_status**
- Added to: projects, sites, categories, items, materials
- Values: 'pending', 'synced', 'failed'
- Purpose: Track sync state for each record

**v19 Table: sync_queue**
- Columns: table_name, record_id, action, data, synced_at, retry_count, last_error
- Purpose: Queue local changes for server push
- Actions: create, update, delete

**v20 Fields: _version**
- Added to: All 10 syncable models
- Type: number (incremented on each update)
- Purpose: Conflict detection and resolution

#### Network Detection
- **Library**: @react-native-community/netinfo
- **Monitoring**: Real-time connectivity status
- **Auto-Sync**: Triggers sync when online
- **User Feedback**: Connectivity status indicators

#### API Integration
- **Backend**: Node.js/Express RESTful API
- **Authentication**: JWT tokens with refresh
- **Endpoints**: CRUD for all 10 syncable models
- **Documentation**: See docs/api/API_DOCUMENTATION.md

#### Queue Management & Retry Logic (Week 8, Days 1-3)

**E. Exponential Backoff Retry**
```
Retry Delay = min(1000ms × 2^retry_count, 60000ms) ± jitter
```

**Features:**
- **Max Retries**: 5 attempts before failure
- **Jitter**: ±25% randomization to prevent thundering herd
- **Backoff Schedule**: 1s → 2s → 4s → 8s → 16s → 60s (capped)
- **Auto-Recovery**: Retry automatically on network errors

**Implementation:**
```typescript
// In SyncService.ts (Week 8, Day 2)
private static async retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T>
```

**F. Dead Letter Queue (DLQ)**

**Purpose:** Capture items that fail repeatedly (10+ attempts) for manual intervention

**Storage:** Persistent in AsyncStorage (`@sync/dead_letter/`)

**Features:**
- View failed items with error messages
- Manual retry with reset counter
- Bulk clear operation
- Admin UI for monitoring

**Operations:**
```typescript
moveToDeadLetterQueue(queueItem)  // Auto after 10 failures
getDeadLetterQueue()               // View all failed items
retryDeadLetterItem(itemId)        // Manual retry
clearDeadLetterQueue()             // Clear all
```

#### Network Monitoring & Auto-Sync (Week 8, Days 3-5)

**G. NetworkMonitor Service** (240 lines)

**Features:**
- Real-time network state monitoring via @react-native-community/netinfo
- Connection type detection (WiFi, Cellular, None)
- Internet reachability testing
- Network change listeners with callback system
- Auto-sync trigger on network restore (offline → online)
- 2-second stabilization delay before sync

**Key Methods:**
```typescript
NetworkMonitor.initialize()
NetworkMonitor.isConnected()
NetworkMonitor.getConnectionType()
NetworkMonitor.addListener(callback)
```

**H. AutoSyncManager Service** (398 lines)

**4 Automatic Sync Triggers:**

1. **App Launch Sync** (2-second delay after login)
   - Runs after user authentication
   - Allows app initialization to complete
   - Ensures database is ready

2. **Network Change Sync** (via NetworkMonitor)
   - Triggers when offline → online
   - 2-second stabilization delay
   - Prevents sync on initial app load

3. **Periodic Sync** (every 5 minutes)
   - Background interval while app is active
   - Skips if already syncing
   - Configurable interval

4. **App Foreground Sync** (background → foreground)
   - 1-minute cooldown to prevent rapid syncs
   - Ensures data freshness when app resumes

**Sync State Management:**
```typescript
interface SyncState {
  isSyncing: boolean;           // Currently syncing
  lastSyncAt: number;           // Last sync timestamp
  lastSyncSuccess: boolean;     // Last sync succeeded
  lastSyncError: string | null; // Last error message
  syncCount: number;            // Total syncs performed
}
```

**Key Methods:**
```typescript
AutoSyncManager.initialize()              // Start auto-sync
AutoSyncManager.startAfterLogin()         // Initial sync after login
AutoSyncManager.triggerManualSync()       // User-initiated sync
AutoSyncManager.addListener(callback)     // Subscribe to state changes
```

#### Sync UI Components (Week 8, Day 5)

**I. SyncIndicator Component** (200 lines)

**Features:**
- Real-time sync status display
- Network connection indicator (WiFi/Cellular/Offline)
- Last sync timestamp with relative time ("just now", "5m ago")
- Sync error display with messages
- Manual sync button
- Compact mode for header bars

**Visual States:**
- 🟢 Green cloud: All synced
- 🟡 Yellow cloud: Currently syncing
- 🔴 Red cloud with X: Sync failed

**J. SyncMonitoringScreen** (300 lines)

**Admin UI for sync monitoring:**
- Sync status dashboard
- Pending records count by model
- Dead letter queue viewer
- Manual retry controls
- Sync statistics (success/failure rates)
- Network status display
- Force sync button
- Clear queue operations

**Location:** `src/admin/SyncMonitoringScreen.tsx`

#### Production Readiness Features

**✅ Complete Sync System (Weeks 4-8):**
- Bidirectional sync (push/pull) with JWT authentication
- Conflict resolution (Last-Write-Wins with version tracking)
- Dependency-aware sync (Kahn's algorithm)
- Queue management with retry logic (exponential backoff)
- Dead letter queue for failed items
- Network monitoring with auto-sync triggers
- User feedback UI (SyncIndicator)
- Admin monitoring (SyncMonitoringScreen)

**Documentation:**
- Architecture: `docs/sync/SYNC_ARCHITECTURE.md`
- API Reference: `docs/api/API_DOCUMENTATION.md`
- Troubleshooting: `docs/sync/SYNC_TROUBLESHOOTING.md`

### 3. Planning Module Features (v1.3-v1.5)

#### Baseline Planning Screen
- Project selection with dropdown
- Item planning cards with visual indicators
- Date pickers for planned start/end dates
- Critical path calculation and visualization
- Baseline locking workflow

#### Critical Path Calculation
- **Algorithm**: Kahn's topological sort with forward/backward pass
- **Features**:
  - Identifies critical path items (zero slack)
  - Calculates project duration
  - Updates database flags automatically
  - Visual indicators (red borders) for critical items

#### Dependency Management
- **Modal Interface**: Search and multi-select dependencies
- **Validation**: Circular dependency detection
- **Visual Feedback**: Dependency count display
- **Safety**: Prevents invalid dependency graphs

#### Progress Metrics & Forecasting
- **Metrics**: Overall progress, schedule variance, on-track/delayed counts
- **Forecasting**: Linear regression for completion estimation
- **Confidence Levels**: High/medium/low based on data quality

#### Baseline Locking
- **Purpose**: Lock project schedule for baseline comparison
- **Effects**:
  - Copies planned dates to baseline fields
  - Disables date editing
  - Enables variance tracking
- **Visual Indicators**: Lock chips, warning cards, disabled inputs

#### ItemModel Helper Methods
**v1.3 Methods (7 methods)**:
- `getDependencies()`: Parse JSON dependencies
- `setDependencies()`: Set dependencies as JSON
- `getScheduleVariance()`: Calculate variance in days
- `getPlannedDuration()`: Calculate planned duration
- `getActualDuration()`: Calculate actual duration
- `getBaselineVariance()`: Calculate baseline variance
- `getProgressPercentage()`: Calculate completion percentage

**v1.4 Methods (8 NEW methods)**:
- `getFormattedWbsCode()`: Format WBS code for display
- `getIndentLevel()`: Calculate indent level from WBS hierarchy
- `getPhaseLabel()`: Get human-readable phase name
- `getPhaseColor()`: Get color code for phase
- `getRiskBadgeColor()`: Get color for risk level
- `isOnCriticalPath()`: Check if item is on critical path
- `hasChildren()`: Check if item has child items
- `getChildItems()`: Fetch child items by parent WBS code

#### WBS Management Screen (v1.4 - NEW)
- **Site Selection**: SimpleSiteSelector component with dropdown
- **Phase Filtering**: 11 project phases with chip filters
- **WBS Item List**: Hierarchical display with WBSItemCard components
- **Item Actions**: Create root items, add child items (up to 4 levels)
- **Context Menu** (v1.5): Long-press menu with Edit/Delete/Add Child options
- **Auto-refresh**: Navigation focus listener for automatic list refresh
- **Visual Indicators**: Badges for critical path, risk level, baseline locked status
- **Max Level Enforcement**: Prevents creation beyond level 4

#### Item Creation Screen (v1.4 - NEW)
- **WBS Code Auto-generation**: Root codes (1.0.0.0, 2.0.0.0) and child codes (1.1.0.0, 1.1.1.0)
- **Form Sections**:
  - Item Details: Name, description
  - Category Selection: Database-driven dropdown
  - Phase Selection: 11 phases with emojis and colors
  - Schedule & Quantity: Duration, quantity, unit of measurement
  - Critical Path & Risk: Milestone, critical path, float days
  - Dependency Risk: Low/medium/high with risk notes
- **Validation**: Required fields, numeric validation
- **Snackbar Notifications**: Success/error feedback
- **Database Save**: Full WatermelonDB persistence
- **Navigation**: Auto-navigate back after save

#### Category & Phase Selectors (v1.4 - NEW)
- **CategorySelector**: Live database integration, description display
- **PhaseSelector**: 11 phases with visual indicators
  - Design & Engineering (Blue)
  - Statutory Approvals (Purple)
  - Mobilization (Deep Orange)
  - Procurement (Orange)
  - Interface Coordination (Cyan)
  - Site Preparation (Brown)
  - Construction (Green)
  - Testing & Pre-commissioning (Red)
  - Commissioning (Indigo)
  - Site Acceptance Test (Teal)
  - Handover & Documentation (Blue Grey)

#### WBS Code Generation Service (v1.4 - NEW)
- **Algorithm**: Hierarchical code generation with database queries
- **Static Methods**:
  - `generateRootCode(siteId)`: Generates next root code (1.0.0.0, 2.0.0.0, etc.)
  - `generateChildCode(siteId, parentWbsCode)`: Generates child code (1.1.0.0, 1.2.0.0, etc.)
  - `calculateLevel(wbsCode)`: Extracts hierarchy level from code
- **Constraints**: Maximum 4 levels, numeric sorting
- **Database Queries**: Finds existing codes to prevent duplicates

### 4. Admin Role Features (v1.2)

#### Dashboard
- Real-time statistics (projects, sites, users, items)
- Role switcher to view app as different roles
- Quick navigation to management screens

#### Project Management
- Create, edit, and delete projects
- Search projects by name, client, or status
- Status management with color-coded chips
- **CASCADE DELETE**: Deleting a project removes all associated sites, items, progress logs, hindrances, materials, daily reports, and site inspections

#### User & Role Management
- Create, edit, and delete users
- Assign roles (Admin, Supervisor, Manager, Planner, Logistics)
- Activate/Deactivate user accounts
- Search users by username, name, or email
- Password management (currently plaintext - TODO: bcrypt)

### 4. Construction-Specific Workflows

#### Daily Reporting (Supervisor)
- Submit daily progress reports
- Track item completion with photos
- View report history with filtering
- Aggregate progress tracking

#### Hindrance Tracking (Supervisor)
- Report issues and obstacles
- Attach photos from camera/gallery
- Priority and status management
- Link to specific items or sites

#### Site Inspection (Supervisor v1.0)
- Comprehensive safety checklists
- Multiple category inspection (Safety Equipment, Site Conditions, etc.)
- Pass/Fail/NA status for each item
- Overall site safety status

#### Material Management
- Track material requirements and usage
- Monitor material availability
- Supplier management
- Shortage alerts

#### Progress Tracking
- Photo documentation support
- Percentage completion tracking
- Task status updates (not_started, in_progress, completed)
- Weightage-based progress calculation

### 5. Photo Documentation
- Camera integration via `react-native-image-picker`
- Gallery access for existing photos
- Photo storage as JSON arrays in database
- Permission handling for camera access

### 6. Site Context Management (Supervisor)
- Shared site selection across supervisor screens
- Context provider: `src/supervisor/context/SiteContext.tsx`
- Reusable component: `src/supervisor/components/SiteSelector.tsx`
- Persistent site selection during session

### 7. Data Synchronization
- Automatic sync when online
- Manual sync trigger option
- Sync status indicators
- Conflict resolution for concurrent edits

### 8. Modular Design
- Organized by feature and responsibility
- Separation of concerns (UI, data, business logic)
- Reusable components and contexts
- Type-safe navigation

### 9. Type Safety
- Full TypeScript support
- Type definitions for navigation
- Model type definitions
- Service type definitions

---

## Development Practices

### Code Organization

1. **Role-based Structure**: Screens organized by user role in `src/{role}/`
2. **Model Layer Separation**: Database models in `/models/` (root level)
3. **Service Layer Separation**: Business logic in `/services/` (root level)
4. **Shared Contexts**: Contexts in relevant feature directories
5. **Reusable Components**: Components co-located with features

### TypeScript Configuration

#### Decorator Support (CRITICAL for WatermelonDB)
```javascript
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}

// babel.config.js
module.exports = {
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    '@babel/plugin-transform-class-static-block',
  ]
}
```

### WatermelonDB Model Creation Pattern

```typescript
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class ItemModel extends Model {
  static table = 'items';

  static associations = {
    sites: { type: 'belongs_to', key: 'site_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
  };

  // ✅ CORRECT: decorator uses snake_case, property is camelCase
  @field('name') name!: string;
  @field('site_id') siteId!: string;
  @field('category_id') categoryId!: string;
  @field('planned_quantity') plannedQuantity!: number;
  @field('completed_quantity') completedQuantity!: number;
  @field('planned_start_date') plannedStartDate!: number; // Use @field for timestamps

  @relation('sites', 'site_id') site!: Relation<SiteModel>;
}
```

### Database Query Pattern

```typescript
import { Q } from '@nozbe/watermelondb';

// ✅ CORRECT: Use snake_case in queries, access with camelCase
const items = await database.collections.get('items')
  .query(Q.where('site_id', siteId))  // snake_case in query
  .fetch();

// Access results using camelCase properties
items.forEach(item => {
  console.log(item.siteId);         // camelCase property
  console.log(item.plannedQuantity);
});
```

### Creating Database Records

```typescript
// ✅ CORRECT: Use camelCase when setting values
await database.write(async () => {
  await database.collections.get('items').create((item) => {
    item.name = 'Foundation Work';
    item.siteId = 'site-123';           // camelCase
    item.categoryId = 'category-456';   // camelCase
    item.plannedQuantity = 100;
    item.completedQuantity = 0;
    item.plannedStartDate = Date.now(); // timestamp
  });
});

// ❌ WRONG: Never use snake_case when setting values
item.site_id = 'site-123';  // Will save empty value!
```

### Code Style

- **Linting**: ESLint with `@react-native` config
- **Formatting**: Prettier (single quotes, trailing commas, arrow parens avoid)
- **TypeScript**: Strict mode enabled
- **Comments**: Document complex logic and business rules

### Testing (v1.3 - Enhanced)

- **Framework**: Jest with comprehensive mocks
- **Test Location**: `__tests__/`
- **Configuration**: `jest.config.js` with React Native module mocks
- **Setup**: `jest.setup.js` with WatermelonDB, gesture-handler, and navigation mocks

#### Test Coverage (v1.3)
- **Total Tests**: 35 tests (100% pass rate)
- **Test Execution**: ~7 seconds
- **Coverage**: Overall 5.32%, ItemModel 100%, PlanningService 13.47%

#### Test Suites
1. **PlanningService.test.ts** (9 tests):
   - Circular dependency detection (all edge cases)
   - Linear dependencies validation
   - Branching dependencies (Y-shape)
   - Self-dependencies handling
   - Missing dependencies handling

2. **ItemModel.test.ts** (26 tests):
   - Dependency JSON parsing (all edge cases)
   - Duration calculations (planned, actual)
   - Variance calculations (schedule, baseline)
   - Progress percentage (including edge cases: zero division, over 100%)

#### Test Users
- **Test Users**: Stored in database (seeded on first launch)
  - Admin: `admin` / `admin123`
  - Supervisor: `supervisor` / `supervisor123`
  - Manager: `manager` / `manager123`
  - Planner: `planner` / `planner123`
  - Logistics: `logistics` / `logistics123`

#### Testing Documentation
- **TESTING_QUICKSTART.md**: 10-minute testing guide
- **TESTING_STRATEGY.md**: Comprehensive testing strategy
- **TESTING_SESSION_CHECKLIST.md**: Manual testing checklist (all tests passed)
- **ADMIN_TEST_PLAN.md**: v1.2 admin testing (54 tests)

### Git Workflow

- **Branch Strategy**: Feature branches (`feature/v0.x`, `feature/xxx`)
- **Main Branch**: `main`
- **Merge Strategy**: Merge commits (preserve history)
- **Branch Preservation**: NEVER delete branches after merging

---

## Technical Stack

### Core Dependencies

- **React Native**: Mobile framework
- **TypeScript**: Type safety and developer experience
- **WatermelonDB**: Offline-first reactive database (Schema v10)
- **SQLite**: Database backend

### Navigation

- **@react-navigation/native**: Navigation framework
- **@react-navigation/stack**: Stack navigator for auth flow
- **@react-navigation/bottom-tabs**: Bottom tab navigation for roles

### UI Components

- **react-native-paper**: Material Design components (Cards, Dialogs, Chips, TextInput)
- **react-native-vector-icons**: Icon system (MaterialCommunityIcons)
- **Custom Snackbar System** (v2.0): Non-blocking notification system
  - Location: `src/components/Snackbar.tsx`
  - Features: Color-coded feedback, auto-dismiss, swipe-to-dismiss
  - Types: success (green), error (red), warning (orange), info (blue)
  - Context-based: `SnackbarProvider` wraps app root
  - Hook: `useSnackbar()` provides `showSnackbar(message, type)` function
- **Custom ConfirmDialog** (v2.0): Confirmation dialog component
  - Location: `src/components/Dialog.tsx`
  - Features: Destructive/non-destructive modes, customizable buttons
  - Props: `visible`, `title`, `message`, `confirmText`, `cancelText`, `onConfirm`, `onCancel`, `destructive`
  - Used for: Delete confirmations, lock operations, important decisions

### Device Features

- **react-native-image-picker**: Camera and gallery integration
- **@react-native-community/netinfo**: Network status monitoring
- **react-native-html-to-pdf**: PDF generation (currently disabled)

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Babel**: Transpilation with decorator support
- **Metro**: React Native bundler

### Platform Support

- **Android**: Full support
- **iOS**: Full support
- **Minimum SDK**: Android API 21+, iOS 12+

---

## Common Patterns

### Screen Template Pattern

```typescript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { database } from '../../models/database';

const ExampleScreen = ({ navigation }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const items = await database.collections.get('items').query().fetch();
      setData(items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {data.map(item => (
          <Card key={item.id} style={styles.card}>
            <Card.Content>
              <Text>{item.name}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { margin: 10 },
});

export default ExampleScreen;
```

### Photo Capture Pattern

```typescript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';

const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

const takePhoto = async () => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return;

  launchCamera({ mediaType: 'photo', quality: 0.8 }, response => {
    if (response.assets && response.assets[0]) {
      const uri = response.assets[0].uri;
      // Store URI in database as JSON array
      const photos = [uri];
    }
  });
};
```

### Snackbar/Dialog Pattern (v2.0)

**Usage Pattern for Snackbar Notifications:**

```typescript
import { useSnackbar } from '../components/Snackbar';

const MyScreen = () => {
  const { showSnackbar } = useSnackbar();

  const handleSuccess = () => {
    showSnackbar('Item saved successfully', 'success'); // Green
  };

  const handleError = () => {
    showSnackbar('Failed to save item', 'error'); // Red
  };

  const handleWarning = () => {
    showSnackbar('Please fill all required fields', 'warning'); // Orange
  };

  const handleInfo = () => {
    showSnackbar('PDF sharing coming soon', 'info'); // Blue
  };

  return (
    // Your component JSX
  );
};
```

**Usage Pattern for Confirmation Dialogs:**

```typescript
import { useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { useSnackbar } from '../components/Snackbar';

const MyScreen = () => {
  const { showSnackbar } = useSnackbar();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await itemToDelete.destroyPermanently();
      });
      showSnackbar('Item deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
    }
  };

  return (
    <View>
      {/* Your component JSX */}

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete ${itemToDelete?.name}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        destructive={true}
      />
    </View>
  );
};
```

**Important Pattern: Dialog-Close-Before-Snackbar (for validation in modals)**

```typescript
const handleSave = async () => {
  if (!fieldValue.trim()) {
    setModalVisible(false); // Close modal FIRST!
    showSnackbar('Field is required', 'warning'); // Then show snackbar
    return;
  }
  // Save logic...
};
```

**Migration Note:** As of v2.0, all `Alert.alert()` calls have been migrated to this system. **Never use Alert.alert** - always use `showSnackbar()` for notifications and `ConfirmDialog` for confirmations.

### Context Provider Pattern

```typescript
import React, { createContext, useState, useContext } from 'react';

interface ContextType {
  selectedSite: string | null;
  setSelectedSite: (id: string | null) => void;
}

const ExampleContext = createContext<ContextType | undefined>(undefined);

export const ExampleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  return (
    <ExampleContext.Provider value={{ selectedSite, setSelectedSite }}>
      {children}
    </ExampleContext.Provider>
  );
};

export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) throw new Error('useExample must be used within ExampleProvider');
  return context;
};
```

---

## Import Path Conventions

```typescript
// Models (from any file in src/)
import { database } from '../../models/database';
import SiteModel from '../../models/SiteModel';

// Services (from any file in src/)
import { DatabaseService } from '../../services/db/DatabaseService';
import { OfflineService } from '../../services/offline/OfflineService';

// Navigation types
import { RootStackParamList } from './types';

// WatermelonDB utilities
import { Q } from '@nozbe/watermelondb';

// React Navigation
import { useNavigation } from '@react-navigation/native';

// React Native Paper
import { Card, Button, TextInput } from 'react-native-paper';
```

---

## Future Expansion Areas

Based on the current structure, these areas are prepared for future development:

### Shared Components (`/components/`)
- Construction-specific UI components
- Form components
- Gantt chart components
- Progress tracking components
- General UI components

### Utilities (`/utils/`)
- Storage utilities
- Validation utilities
- Data formatting utilities
- General helper functions

### Additional Services
- Cache services (`services/cache/`)
- API service calls (`services/api/`)
- Enhanced sync services

### Advanced Features
- PDF generation for reports (currently disabled)
- Real-time collaboration
- Advanced analytics and reporting
- Equipment tracking
- Weather logging
- Quality check workflows

---

## Version History

- **v0.7**: Added Reports History screen for supervisors
- **v0.8**: Added Hindrance Report screen with photo capture
- **v0.9**: Enhanced database schema and sync capabilities
- **v1.0**: Added Site Inspection screen with comprehensive safety checklists (Schema v8)
- **v1.1**: Navigation UX improvements with enhanced supervisor workflow
- **v1.2**: Admin Role Implementation (Schema v10)
  - Database-based authentication
  - User and role management (CRUD)
  - Project management with CASCADE deletion
  - Role switcher for testing
  - AdminNavigator with 3 screens
  - AdminContext for state management
  - 54 comprehensive tests (all passing)
- **v1.3**: Planning Module & Testing Infrastructure (Schema v11)
  - **Database**: 7 new planning fields in items table, schedule_revisions table
  - **Service Layer**: PlanningService.ts (479 lines) with critical path calculation
  - **UI Components**: BaselineScreen, ItemPlanningCard, DependencyModal, ProjectSelector
  - **Testing**: Jest infrastructure with 35 automated tests (100% pass rate)
  - **Features**: Critical path calculation (Kahn's algorithm), dependency management, baseline locking, progress metrics, forecasting
  - **Lines of Code Added**: ~1,600 lines
  - **UX Fixes**: Critical path visualization improvements
  - **Test Documentation**: TESTING_QUICKSTART.md, TESTING_STRATEGY.md, TESTING_SESSION_CHECKLIST.md
- **v1.4**: WBS Management & Item Creation (Schema v12)
  - **Database**: 10 WBS fields in items table, interface_points table, template_modules table
  - **Service Layer**: WBSCodeGenerator.ts (147 lines) with hierarchical code generation
  - **UI Components**: WBSManagementScreen, ItemCreationScreen, WBSItemCard, CategorySelector, PhaseSelector, SimpleSiteSelector
  - **Navigation**: Stack navigator within PlanningNavigator for ItemCreation/ItemEdit screens
  - **Features**: Auto-generated WBS codes (4-level hierarchy), 11 project phases, critical path tracking, risk management
  - **Lines of Code Added**: ~1,200 lines
  - **Testing**: 4 new test suites (InterfacePointModel, TemplateModuleModel, WBSCodeGenerator, schema-v12)
- **v1.5**: Database Save & Selector Components (Schema v12)
  - **Database Integration**: Full WatermelonDB persistence for WBS items
  - **UI Components**: CategorySelector, PhaseSelector with database integration
  - **Features**: Snackbar notifications, auto-navigation after save
  - **Lines of Code Added**: ~350 lines
  - **Testing**: Sprint 4 test plan created
- **v1.6**: Sprint 4 & 5 Complete - Context Menus & Item Management (Schema v12)
  - **Sprint 4**: WBS Management Screen with site selection and phase filtering
  - **Sprint 5**: Context menu implementation (long-press) with Edit/Delete/Add Child options
  - **UI Updates**: WBSItemCard with context menu, improved badge display
  - **Navigation**: ItemEdit screen support with handleEditItem navigation
  - **Features**: Auto-refresh on screen focus, baseline lock enforcement, delete with confirmation
  - **UX Fixes**: Badge layout improvements, risk notes border visibility (all sides)
  - **Lines of Code Added**: ~500 lines
  - **Testing**: 41 manual test cases executed (SPRINT_4_5_MANUAL_TEST_PLAN.md)
  - **User Experience**: Enhanced touch interactions for mobile, non-blocking snackbars
- **v1.7**: Site Management Workflow & Planning Tab Reordering (Schema v12)
  - **Site Management**: Planners can create sites and assign supervisors
  - **Tab Reordering**: Planning tabs reordered to logical workflow (Sites → WBS → Resources → Schedule → Gantt → Baseline → Milestones)
  - **Supervisor Assignment**: Added SupervisorAssignmentPicker component
  - **Database**: Made supervisor_id optional in sites table
  - **Lines of Code Added**: ~200 lines
- **v1.8**: Reserved for future use
- **v1.9**: Sprint 6 - WBS Item Edit Functionality (Schema v12)
  - **Item Editing**: ItemEditScreen with full edit capabilities
  - **Navigation**: Edit flow from WBS Management screen
  - **Features**: Pre-populated forms, validation, error handling
  - **Lines of Code Added**: ~400 lines
- **v1.9.1**: Sprint 6.1 - WBS Date Pickers & Progress Tracking (Schema v12)
  - **Date Pickers**: Added DatePickerField component with iOS/Android support
  - **Duration Auto-calculation**: Bidirectional sync between dates and duration
  - **Progress Tracking**: Completed quantity input with real-time percentage display
  - **Auto-status Updates**: Status automatically updates based on progress (not_started → in_progress → completed)
  - **Auto-fix**: Existing items with wrong status corrected on WBS screen load
  - **Gantt Fixes**: Phase colors (light background + green progress overlay), accurate progress rendering
  - **Status Display**: Color-coded status chips with proper sizing (no text clipping)
  - **Invalid Dates Fixed**: Replaced with WBS code, level, and progress information
  - **Files Created**: DatePickerField.tsx, FIXES_SUMMARY_v1.9.1.md, 3 Gantt testing docs, GanttChartScreen.test.tsx
  - **Files Modified**: ItemCreationScreen, ItemEditScreen, GanttChartScreen, WBSItemCard, WBSManagementScreen
  - **Dependencies**: Added @react-native-community/datetimepicker
  - **Lines of Code Added**: ~3,676 lines (including tests and documentation)
  - **Testing**: All 9 reported issues verified fixed per GANTT_TESTING_QUICK_START.md
  - **Module Status**: Planning Module 100% complete (WBS, Gantt, Baseline all functional)
- **v2.0**: UX Improvements Sprint 1 Complete (Schema v12)
  - **Alert.alert Migration**: All 113 Alert.alert calls replaced with custom Snackbar/ConfirmDialog system
  - **Files Migrated**: 13 files across Admin, Supervisor, Planning, Navigation, and Auth modules
  - **Non-Blocking Notifications**: Snackbars allow users to continue working
  - **Color-Coded Feedback**: Green (success), Red (error), Orange (warning), Blue (info)
  - **Confirmation Dialogs**: Destructive actions with clear cancel/confirm buttons
  - **Testing**: 100% test pass rate, 24+ test cases, zero issues found
  - **UX Score**: 5.5/10 → 7.0/10 (+27% improvement)
  - **Production Ready**: Approved for production release
- **v2.2 - Activity 1**: Security Implementation Complete (Schema v13-v17)
  - **Password Hashing**: Migrated all passwords from plaintext to bcrypt (salt rounds: 12)
  - **Schema Evolution**: v13 (password_hash), v14 (remove plaintext), v15 (sessions), v16 (password_history), v17 (timestamps)
  - **JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
  - **Session Management**: Active session tracking with device info, IP address, expiry, revocation
  - **Password Reset**: Admin-assisted reset with password strength validation
  - **Password History**: Prevent reuse of last 5 passwords
  - **Services Added**: AuthService, TokenService, SessionService, PasswordResetService, PasswordMigrationService
  - **Models Added**: SessionModel, PasswordHistoryModel
  - **Config Added**: config/jwt.config.ts (JWT secrets and expiry)
  - **Security Score**: 1/10 → 9/10 (production-ready)
  - **Lines of Code Added**: ~600 lines (services + models + migrations)
  - **Implementation**: 3 weeks (Week 1: Password Hashing, Week 2: JWT Tokens, Week 3: Sessions & Reset)
  - **Documentation**: docs/implementation/ACTIVITY_1_SECURITY_IMPLEMENTATION.md
- **v2.2 - Activity 2**: Offline-First Sync System (Schema v18-v20 - IN PROGRESS)
  - **Schema Evolution**: v18 (sync_status), v19 (sync_queue table), v20 (_version field)
  - **Backend API**: Node.js/Express RESTful API with JWT authentication (Weeks 4-5)
  - **Mobile Sync**: Complete bidirectional sync with SyncService.ts (675 lines) (Week 6)
  - **Conflict Resolution**: Last-Write-Wins strategy with version tracking (Week 7, Days 2-3)
  - **Dependency-Aware Sync**: Kahn's algorithm for topological sorting (Week 7, Day 4)
  - **10 Syncable Models**: Projects, Sites, Categories, Items, Materials, Progress Logs, Hindrances, Daily Reports, Site Inspections, Schedule Revisions
  - **Queue Management**: Local change tracking with retry capability
  - **Network Detection**: Automatic sync when connectivity restored
  - **Testing**: Kahn's algorithm test suite with 4 scenarios (all passing)
  - **Files Added**: SyncService.ts, SyncQueueModel.ts, migrations (v19, v20), testKahnsAlgorithm.js
  - **Lines of Code Added**: ~800 lines (SyncService + model + migrations + tests)
  - **Progress**: 70% complete (4 of 6 weeks done)
  - **Documentation**: 5 comprehensive implementation documents
  - **Known Limitation**: 186 TypeScript errors (syncStatus type incompatibility - non-blocking)

---

## References

- **DATABASE.md**: Complete database schema and relationships
- **CLAUDE.md**: Development guidelines and AI assistant instructions
- **README.md**: Setup instructions and project overview
- **Testing Documentation** (v1.3 - NEW):
  - TESTING_QUICKSTART.md - 10-minute testing guide
  - TESTING_STRATEGY.md - Comprehensive testing strategy
  - TESTING_SESSION_CHECKLIST.md - Manual testing checklist
  - ADMIN_TEST_PLAN.md - v1.2 admin role testing (54 comprehensive tests)
  - TESTING_GUIDE.md
  - HINDRANCE_REPORT_TESTING.md
  - REPORTS_HISTORY_TESTING.md
  - SITE_INSPECTION_TESTING.md
- **Planning Module Documentation**:
  - PLANNING_MASTER_STATUS.md - Planning module master status (v1.9.1 - CURRENT)
  - FIXES_SUMMARY_v1.9.1.md - Detailed fix documentation for v1.9.1
  - GANTT_TESTING_QUICK_START.md - Quick start testing guide for Gantt
  - GANTT_MANUAL_TEST_PLAN.md - Comprehensive Gantt test plan
  - GANTT_TEST_DATA.md - Test data reference for Gantt testing
  - PLANNING_MODULE_QUICK_START.md - User guide for planning features
  - PLANNING_MODULE_IMPLEMENTATION_STATUS.md - Implementation status (v1.3 baseline)
- **Archived Documentation** (Historical reference):
  - PLANNING_MODULE_FIXES_v1.3.md - v1.3 UX fixes
  - CURRENT_STATUS_AND_NEXT_STEPS.md - Superseded by PLANNING_MASTER_STATUS.md

---

## Summary of Best Choices

This unified document combines the strengths of both original architecture documents:

### From ARCHITECTURE.md (Role-based focus)
✅ Clear role-based navigation structure
✅ Comprehensive database relationship documentation
✅ Detailed supervisor screen breakdown (7 screens)
✅ SiteContext pattern for shared state
✅ Migration history and versioning
✅ Actual implementation structure

### From CONSTRUCTION_APP_STRUCTURE.md (Component organization focus)
✅ Future-ready directory structure for shared components
✅ Utility organization patterns
✅ Construction industry-specific features documentation
✅ Service layer organization with offline/sync separation
✅ Babel configuration details for decorators

### Additional Improvements
✅ Clear distinction between active code (`src/`, `models/`, `services/`) and placeholder directories
✅ Comprehensive import path conventions
✅ WatermelonDB best practices with field naming conventions
✅ Common pattern examples for quick reference
✅ Version history tracking
✅ Photo capture and context provider patterns

---

**This document serves as the single source of truth for the Construction Site Progress Tracker architecture, combining actual implementation details with forward-looking structural guidance.**
