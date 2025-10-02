# Construction Management App - Folder Structure Documentation

## Overview
This document outlines the folder structure for a React Native construction management application. The app is designed specifically for the construction industry with role-based access, offline capabilities, and construction-specific workflows.

## Root Directory Structure

```
site_progress_tracker/
├── src/
│   ├── auth/              # Authentication screens and components
│   ├── supervisor/        # Supervisor-specific screens
│   ├── manager/           # Manager-specific screens
│   ├── planning/          # Planning/Gantt chart screens
│   └── screens/           # General screens
├── components/
│   ├── construction/      # Construction-specific UI components
│   ├── ui/                # General UI components
│   ├── forms/             # Form components
│   ├── gantt/             # Gantt chart components
│   └── tracking/          # Progress tracking components
├── services/
│   ├── api/               # API service calls
│   ├── sync/              # Offline sync services
│   ├── offline/           # Offline status and management
│   └── cache/             # Caching services
├── models/                # WatermelonDB models and schema
│   ├── schema/            # Database schema definitions
│   ├── migrations/        # Database migration files
│   └── database.ts        # Database initialization
├── utils/
│   ├── storage/           # Local storage utilities
│   ├── validation/        # Validation utilities
│   ├── formatters/        # Data formatting utilities
│   └── helpers/           # General helper functions
└── ...
```

## Detailed Structure Breakdown

### 1. Screen Organization (Role-Based)

#### `src/auth/` - Authentication screens
- `LoginScreen.tsx` - User login screen
- `RegisterScreen.tsx` - User registration screen
- `ForgotPasswordScreen.tsx` - Password recovery
- `OnboardingScreen.tsx` - App onboarding flow

#### `src/supervisor/` - Supervisor role screens
- `DashboardScreen.tsx` - Supervisor dashboard
- `DailyReportsScreen.tsx` - Daily progress reports
- `MaterialTrackingScreen.tsx` - Track material usage
- `TaskManagementScreen.tsx` - Manage assigned tasks
- `PhotoDocumentationScreen.tsx` - Capture progress photos
- `WeatherLogScreen.tsx` - Log weather conditions affecting work

#### `src/manager/` - Manager role screens
- `ProjectOverviewScreen.tsx` - High-level project overview
- `TeamManagementScreen.tsx` - Manage team members
- `BudgetTrackingScreen.tsx` - Budget monitoring
- `ProjectTimelineScreen.tsx` - Gantt chart view
- `ResourceAllocationScreen.tsx` - Allocate resources
- `PerformanceMetricsScreen.tsx` - KPIs and metrics

#### `src/planning/` - Planning and scheduling screens
- `GanttChartScreen.tsx` - Interactive Gantt charts
- `MilestoneTrackerScreen.tsx` - Track project milestones
- `ResourcePlanningScreen.tsx` - Plan resource allocation
- `RiskAssessmentScreen.tsx` - Risk evaluation
- `ScheduleOptimizerScreen.tsx` - Optimize project schedules

### 2. Construction-Specific Components

#### `components/construction/`
- `ProjectCard.tsx` - Display project information
- `TaskCard.tsx` - Show task details
- `MaterialCard.tsx` - Material tracking component
- `ProgressTracker.tsx` - Visual progress indicator
- `SafetyChecklist.tsx` - Construction safety items
- `DefectTracker.tsx` - Track construction defects
- `QualityCheck.tsx` - Quality assurance components

#### `components/gantt/`
- `GanttChart.tsx` - Main Gantt chart component
- `TimelineView.tsx` - Horizontal timeline
- `TaskBar.tsx` - Visual representation of tasks
- `DependencyLine.tsx` - Show task dependencies
- `MilestoneMarker.tsx` - Mark project milestones

#### `components/tracking/`
- `ProgressReportForm.tsx` - Form for progress reports
- `DailyLog.tsx` - Daily activity logging
- `MaterialUsage.tsx` - Track material consumption
- `LaborTracking.tsx` - Track labor hours
- `EquipmentLog.tsx` - Equipment usage tracking
- `WeatherImpact.tsx` - Track weather effects

### 3. Offline-First Services

#### `services/sync/`
- `SyncService.ts` - Data synchronization logic
- `UploadQueue.ts` - Queue for pending uploads
- `ConflictResolver.ts` - Handle data conflicts
- `BatchSync.ts` - Batch operations for efficiency
- `SyncLogger.ts` - Log sync operations

#### `services/offline/`
- `OfflineService.ts` - Network status management
- `OfflineQueue.ts` - Queue operations for offline mode
- `StorageManager.ts` - Manage local storage
- `OfflineValidation.ts` - Validate data when offline

### 4. WatermelonDB Database Models

#### `models/`
- `database.ts` - Database initialization and configuration
- `ProjectModel.ts` - Project data model
- `TaskModel.ts` - Task data model
- `MaterialModel.ts` - Material data model
- `ProgressReportModel.ts` - Progress report data model
- `schema/index.ts` - Database schema definition
- `migrations/` - Database migration scripts

### 5. Babel Configuration for Decorators and Static Properties

#### `babel.config.js`
- Configuration for handling TypeScript decorators used by WatermelonDB
- Includes `@babel/plugin-proposal-decorators` with legacy mode for compatibility
- Includes `@babel/plugin-transform-class-properties` for static field support
- Includes `@babel/plugin-transform-class-static-block` for any static block syntax
- Properly handles the static `table` and `associations` properties in WatermelonDB models

## Construction Industry Features

### Gantt Charts and Scheduling
- Interactive timeline visualization
- Task dependencies and critical path analysis
- Resource allocation visualization
- Milestone tracking

### Progress Tracking
- Daily progress reports with photo documentation
- Percentage completion tracking
- Task status updates
- Quality metrics collection

### Material Management
- Inventory tracking
- Delivery scheduling
- Shortage alerts
- Cost tracking
- Supplier management

### Offline Capabilities
- Works in remote construction sites with limited connectivity
- Queues operations for later sync
- Sync when connectivity is restored
- Conflict resolution for concurrent edits

### Role-Based Workflows
- **Site Supervisors**: Daily reporting, task management, photo documentation
- **Project Managers**: Overview dashboards, budget tracking, resource allocation
- **Planners**: Schedule optimization, Gantt charts, milestone tracking

## Technical Implementation Notes

1. **Database**: WatermelonDB for reactive, offline-first database operations
2. **State Management**: React hooks combined with WatermelonDB's reactive queries
3. **Offline Support**: Custom sync service with conflict resolution
4. **UI Components**: Construction-industry specific components for common use cases
5. **Network Handling**: Comprehensive offline/online state management