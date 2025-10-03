# Construction Site Progress Tracker - Architecture

## Project Overview

This is a React Native mobile application designed to help track progress on construction sites. The application follows modern React Native patterns with role-based navigation and offline-first data management using WatermelonDB.

## Folder Structure

```
site_progress_tracker/
├── android/                    # Android native code
├── ios/                        # iOS native code
├── models/                     # WatermelonDB models and schema
│   ├── migrations/             # Database migration files
│   ├── schema/                 # Database schema definitions
│   ├── SiteModel.ts            # Construction site model
│   ├── CategoryModel.ts        # Item/material category model
│   ├── ItemModel.ts            # Construction work items model
│   ├── ProjectModel.ts         # Project model
│   ├── MaterialModel.ts        # Material model
│   ├── ProgressLogModel.ts     # Progress log model
│   ├── HindranceModel.ts       # Hindrance/obstacle model
│   └── database.ts             # Database initialization
├── services/                   # Application services
│   ├── db/                     # Database services
│   │   ├── SimpleDatabaseService.ts  # Basic database service
│   │   └── DatabaseService.ts        # Enhanced database service
│   ├── offline/                # Offline functionality
│   │   └── OfflineService.ts
│   └── sync/                   # Sync functionality
│       └── SyncService.ts
├── src/                        # Application source code
│   ├── auth/                   # Authentication screens
│   │   └── LoginScreen.tsx
│   ├── manager/                # Manager-specific screens
│   │   ├── ProjectOverviewScreen.tsx
│   │   ├── TeamManagementScreen.tsx
│   │   ├── FinancialReportsScreen.tsx
│   │   └── ResourceAllocationScreen.tsx
│   ├── planning/               # Planning-specific screens
│   │   ├── GanttChartScreen.tsx
│   │   ├── ScheduleManagementScreen.tsx
│   │   ├── ResourcePlanningScreen.tsx
│   │   └── MilestoneTrackingScreen.tsx
│   ├── supervisor/             # Supervisor-specific screens
│   │   ├── DailyReportsScreen.tsx
│   │   ├── MaterialTrackingScreen.tsx
│   │   └── SiteInspectionScreen.tsx
│   ├── logistics/              # Logistics-specific screens
│   │   ├── MaterialTrackingScreen.tsx
│   │   ├── EquipmentManagementScreen.tsx
│   │   ├── DeliverySchedulingScreen.tsx
│   │   └── InventoryManagementScreen.tsx
│   └── nav/                    # Navigation components
│       ├── MainNavigator.tsx
│       ├── AuthNavigator.tsx
│       ├── RoleSelectionScreen.tsx
│       ├── SupervisorNavigator.tsx
│       ├── ManagerNavigator.tsx
│       ├── PlanningNavigator.tsx
│       └── LogisticsNavigator.tsx
├── __tests__/                  # Test files
├── prompts/                    # Project prompts
├── node_modules/               # NPM dependencies
├── .vscode/                    # VS Code settings
├── .eslintrc.js                # ESLint configuration
├── .gitignore                  # Git ignore patterns
├── .prettierrc.js              # Prettier configuration
├── .watchmanconfig             # Watchman configuration
├── app.json                    # App configuration
├── App.tsx                     # Main application component
├── babel.config.js             # Babel configuration
├── CONSTRUCTION_APP_README.md  # Construction app documentation
├── CONSTRUCTION_APP_STRUCTURE.md # Construction app structure
├── DATABASE.md                 # Database schema documentation
├── Gemfile                     # Ruby dependencies (for iOS)
├── GEMINI.md                   # Qwen documentation
├── index.js                    # App entry point
├── jest.config.js              # Jest configuration
├── metro.config.js             # Metro bundler configuration
├── package.json                # Project dependencies and scripts
├── QWEN.md                     # Qwen project context
├── README.md                   # Project README
├── ARCHITECTURE.md             # This file
└── tsconfig.json               # TypeScript configuration
```

## Architecture Layers

### 1. Presentation Layer (src/)
- **Navigation**: Role-based navigators in `src/nav/` handle routing based on user roles (Supervisor, Manager, Planning, Logistics)
- **Authentication**: Login and role selection flow
- **Screens**: Role-specific UI components organized by responsibility

### 2. Data Layer (models/)
- **Database Models**: WatermelonDB models define the data structure and relationships
- **Schema**: Defines database structure with versioning for migrations
- **Migrations**: Database migration files for schema evolution
- **Database Service**: Provides CRUD operations with offline support

### 3. Service Layer (services/)
- **Database Services**: Handle database operations and business logic
- **Offline Services**: Manage offline data synchronization
- **Sync Services**: Handle data synchronization when online

### 4. Platform Layer (android/, ios/)
- Native code for each platform
- React Native bridge implementations

## Navigation Architecture

The application implements a role-based navigation system:

```
MainNavigator
├── AuthNavigator
│   ├── LoginScreen
│   └── RoleSelectionScreen
└── Role-specific Navigators
    ├── SupervisorNavigator (Bottom Tabs)
    │   ├── DailyReportsScreen
    │   ├── MaterialTrackingScreen
    │   └── SiteInspectionScreen
    ├── ManagerNavigator (Bottom Tabs)
    │   ├── ProjectOverviewScreen
    │   ├── TeamManagementScreen
    │   ├── FinancialReportsScreen
    │   └── ResourceAllocationScreen
    ├── PlanningNavigator (Bottom Tabs)
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

## Database Architecture

The application now uses WatermelonDB with the following entities and relationships:

### Core Entities

- **Project** → has many → Sites
  - Fields: name, client, start_date, end_date, status, budget
- **Site** → has many → Items, belongs to → Project
  - Fields: name, location, project_id, supervisor_id
- **Category** → has many → Items
  - Fields: name, description
- **Item** → has many → ProgressLogs, belongs to → Site and Category
  - Fields: name, category_id, site_id, planned_quantity, completed_quantity, unit_of_measurement, planned_start_date, planned_end_date, status, weightage
- **ProgressLog** → belongs to → Item, recorded by → User
  - Fields: item_id, date, completed_quantity, reported_by, photos[], notes, sync_status_field
- **Hindrance** → belongs to → Item/Site, assigned to → User
  - Fields: title, description, item_id, priority, status, assigned_to, reported_by
- **Material** → belongs to → Item, managed by → Procurement
  - Fields: name, item_id, quantity_required, quantity_available, quantity_used, unit, status, supplier, procurement_manager_id

### Model Relationships

The relationships between models are implemented as follows:

- ProjectModel:
  - Has many: SiteModel (via sites relationship)
  
- SiteModel:
  - Belongs to: ProjectModel (via project relationship)
  - Has many: ItemModel (via items relationship), HindranceModel (via hindrances relationship)
  
- CategoryModel:
  - Has many: ItemModel (via items relationship)
  
- ItemModel:
  - Belongs to: CategoryModel (via category relationship), SiteModel (via site relationship)
  - Has many: ProgressLogModel (via progress_logs relationship), MaterialModel (via materials relationship), HindranceModel (via hindrances relationship)
  
- ProgressLogModel:
  - Belongs to: ItemModel (via item relationship), UserModel (via user relationship)
  
- HindranceModel:
  - Belongs to: ItemModel (via item relationship), SiteModel (via site relationship), UserModel (via assigned_user relationship)
  
- MaterialModel:
  - Belongs to: ItemModel (via item relationship), UserModel (via procurement_manager relationship)

## Key Features

1. **Role-based Access**: Different UI and functionality based on user role
2. **Offline-first**: Works without internet connectivity with sync capabilities
3. **Construction-Specific**: Designed specifically for construction site progress tracking
4. **Data Synchronization**: Syncs data when connectivity is restored with conflict resolution
5. **Modular Design**: Organized by feature and responsibility
6. **Type Safety**: Full TypeScript support

## Development Practices

- Modern React Native with TypeScript
- Component-based architecture
- Separation of concerns between presentation, data, and business logic
- Comprehensive type definitions
- Linting and formatting with ESLint and Prettier
- WatermelonDB for offline-first data management
- Proper relationship modeling with foreign keys
- Migration support for database schema evolution