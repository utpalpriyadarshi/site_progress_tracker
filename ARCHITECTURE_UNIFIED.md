# Construction Site Progress Tracker - Unified Architecture Documentation

## Project Overview

A React Native mobile application designed for construction site management with offline-first capabilities using WatermelonDB. The application features role-based navigation for different construction team members (Supervisors, Managers, Planners, Logistics) with comprehensive progress tracking, reporting, material management, and advanced planning capabilities.

**Current Version**: v1.5 (WBS Management & Item Creation)
**Database Schema Version**: 12
**Platform**: React Native (Android & iOS)
**Last Updated**: October 2025

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
│   ├── planning/                 # Planning services (v1.3 - NEW)
│   │   ├── PlanningService.ts    # Critical path, metrics, forecasting
│   │   └── WBSCodeGenerator.ts   # WBS code generation (v1.4 - NEW)
│   ├── db/                       # Database services
│   │   ├── SimpleDatabaseService.ts  # Basic database service & initialization
│   │   └── DatabaseService.ts        # Enhanced database service with queries
│   ├── offline/                  # Offline functionality
│   │   └── OfflineService.ts     # Network status & offline management
│   ├── pdf/                      # PDF generation services
│   │   └── ReportPdfService.ts   # Report PDF generation (disabled)
│   └── sync/                     # Sync functionality
│       └── SyncService.ts        # Data synchronization & conflict resolution
├── src/                          # Application source code (ACTIVE)
│   ├── auth/                     # Authentication screens
│   │   └── LoginScreen.tsx       # User login screen
│   ├── logistics/                # Logistics-specific screens (4 screens)
│   │   ├── MaterialTrackingScreen.tsx
│   │   ├── EquipmentManagementScreen.tsx
│   │   ├── DeliverySchedulingScreen.tsx
│   │   └── InventoryManagementScreen.tsx
│   ├── manager/                  # Manager-specific screens (4 screens)
│   │   ├── ProjectOverviewScreen.tsx
│   │   ├── TeamManagementScreen.tsx
│   │   ├── FinancialReportsScreen.tsx
│   │   └── ResourceAllocationScreen.tsx
│   ├── planning/                 # Planning-specific screens (7 screens)
│   │   ├── BaselineScreen.tsx         # Baseline planning (v1.3)
│   │   ├── GanttChartScreen.tsx
│   │   ├── ScheduleManagementScreen.tsx
│   │   ├── ResourcePlanningScreen.tsx
│   │   ├── MilestoneTrackingScreen.tsx
│   │   ├── WBSManagementScreen.tsx    # WBS management (v1.4 - NEW)
│   │   ├── ItemCreationScreen.tsx     # Create/Edit WBS items (v1.4 - NEW)
│   │   └── components/                # Planning components
│   │       ├── ProjectSelector.tsx    # Project dropdown selector (v1.3)
│   │       ├── ItemPlanningCard.tsx   # Item card with date pickers (v1.3)
│   │       ├── DependencyModal.tsx    # Dependency management modal (v1.3)
│   │       ├── SimpleSiteSelector.tsx # Site selector (v1.4 - NEW)
│   │       ├── WBSItemCard.tsx        # WBS item display card (v1.4 - NEW)
│   │       ├── CategorySelector.tsx   # Category dropdown (v1.4 - NEW)
│   │       └── PhaseSelector.tsx      # Phase dropdown (v1.4 - NEW)
│   ├── admin/                    # Admin-specific screens (3 screens - v1.2)
│   │   ├── AdminDashboardScreen.tsx      # Admin dashboard with statistics
│   │   ├── ProjectManagementScreen.tsx   # Project CRUD with cascade delete
│   │   ├── RoleManagementScreen.tsx      # User & role management
│   │   ├── context/
│   │   │   └── AdminContext.tsx          # Admin role switching context
│   │   └── components/
│   │       ├── ProjectCard.tsx           # Project display card
│   │       ├── UserCard.tsx              # User display card
│   │       └── StatisticsCard.tsx        # Dashboard statistics
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
│   └── nav/                      # Navigation components
│       ├── MainNavigator.tsx     # Root navigator
│       ├── AuthNavigator.tsx     # Authentication flow navigator (database-based)
│       ├── RoleSelectionScreen.tsx # Role selection screen (legacy)
│       ├── AdminNavigator.tsx    # Admin bottom tabs (3 tabs - v1.2)
│       ├── SupervisorNavigator.tsx # Supervisor bottom tabs (7 tabs)
│       ├── ManagerNavigator.tsx   # Manager bottom tabs (4 tabs)
│       ├── PlanningNavigator.tsx  # Planning bottom tabs (4 tabs)
│       ├── LogisticsNavigator.tsx # Logistics bottom tabs (4 tabs)
│       └── types.ts              # Navigation type definitions
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

#### Sync Status Field (CRITICAL)
- **Issue**: WatermelonDB's Model class has a built-in `syncStatus` property
- **Solution**: Use `syncStatusField` as the property name to avoid conflicts
- **Pattern**: `@field('sync_status') syncStatusField!: string`
- **Applies to**: ProgressLogModel, HindranceModel, DailyReportModel, SiteInspectionModel

### 3. Service Layer (`services/`)

**Purpose**: Business logic, database operations, offline/sync management

#### Database Services (`services/db/`)
- **SimpleDatabaseService.ts**: Basic initialization and default data setup
- **DatabaseService.ts**: Enhanced service with lazy loading via `getDatabase()`
- **Pattern**: Lazy initialization to avoid timing issues

#### Offline Services (`services/offline/`)
- **OfflineService.ts**: Network status monitoring and offline capability management
- **Pattern**: NetInfo integration for connectivity detection

#### Sync Services (`services/sync/`)
- **SyncService.ts**: Bidirectional data synchronization
- **Pattern**: Queue-based sync with conflict resolution
- **Features**: Timestamp-based conflict handling

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
    ├── PlanningNavigator (Stack + Bottom Tabs - v1.4 Updated)
    │   ├── Bottom Tabs (4 tabs)
    │   │   ├── WBSManagementScreen (📋 WBS) [v1.4 - NEW]
    │   │   ├── GanttChartScreen (📅 Gantt)
    │   │   ├── ScheduleManagementScreen (🗓️ Schedule)
    │   │   └── MilestoneTrackingScreen (🎯 Milestones)
    │   └── Stack Screens (Modal/Detail screens)
    │       ├── ItemCreation (Create new WBS items) [v1.4 - NEW]
    │       └── ItemEdit (Edit existing WBS items) [v1.5 - NEW]
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
- **v12**: Current version - Added WBS fields to `items`, new `interface_points` and `template_modules` tables (v1.4)

### Core Collections

#### projects
- Top-level project containers
- Fields: name, client, start_date, end_date, status, budget

#### sites
- Construction sites belonging to projects
- Fields: name, location, project_id, supervisor_id
- **Relationships**: belongs_to project, has_many items/hindrances/daily_reports

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

#### users (v1.2)
- User accounts with authentication
- Fields: username, password, full_name, email, phone, is_active, role_id
- **Relationships**: belongs_to role
- **Note**: Passwords currently stored as plaintext (TODO: implement bcrypt hashing)

#### roles (v1.2)
- User roles and permissions
- Fields: name, description, permissions (JSON)
- **Relationships**: has_many users
- **System Roles**: Admin, Supervisor, Manager, Planner, Logistics

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

### 2. Offline-first Architecture
- Works without internet connectivity
- Local database with WatermelonDB
- Automatic sync when connectivity restored
- Queue-based sync with conflict resolution

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
- **v1.5**: Context Menu & Item Editing (Current - Schema v12)
  - **UI Updates**: Long-press context menu on WBSItemCard with Edit/Delete/Add Child options
  - **Navigation**: ItemEdit screen support with handleEditItem navigation
  - **Features**: Auto-refresh on screen focus, baseline lock enforcement
  - **Lines of Code Modified**: ~100 lines
  - **User Experience**: Enhanced touch interactions for mobile

---

## References

- **ARCHITECTURE.md**: Original architecture documentation (role-based focus)
- **CONSTRUCTION_APP_STRUCTURE.md**: Construction app structure reference (component organization focus)
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
- **Planning Module Documentation** (v1.3 - NEW):
  - PLANNING_MODULE_IMPLEMENTATION_STATUS.md - Implementation status and progress
  - PLANNING_MODULE_QUICK_START.md - User guide for planning features
  - PLANNING_MODULE_FIXES_v1.3.md - UX fixes and improvements
  - PLANNING_MODULE_TESTING_PLAN.md - Comprehensive testing plan
- **Next Steps**:
  - NEXT_STEPS.md - Future roadmap and enhancements
  - CURRENT_STATUS_AND_NEXT_STEPS.md - Current status and immediate next steps

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
