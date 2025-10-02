# Construction Site Progress Tracker

A React Native application specifically designed for construction industry professionals to track project progress, manage resources, and maintain documentation at construction sites.

## App Structure Overview

This app follows a construction-industry-focused architecture with:

- **Role-based screens** for different user types (supervisors, managers, planners)
- **Construction-specific components** for industry workflows
- **Offline-first architecture** for remote site locations
- **WatermelonDB integration** for local data storage and sync

## Key Features

- Project and task management with Gantt chart visualization
- Daily progress reporting with photo documentation
- Material tracking and shortage alerts
- Offline functionality for remote construction sites
- Role-based access for different construction personnel
- Weather impact logging and reporting

## Folder Structure

```
site_progress_tracker/
├── src/
│   ├── auth/              # Authentication screens
│   ├── supervisor/        # Supervisor-specific workflows
│   ├── manager/           # Manager-specific dashboards
│   ├── planning/          # Project planning and Gantt charts
├── components/
│   ├── construction/      # Industry-specific components
│   ├── gantt/             # Timeline and scheduling components
│   ├── tracking/          # Progress tracking components
├── services/
│   ├── sync/              # Data synchronization service
│   ├── offline/           # Offline status management
├── models/
│   ├── ProjectModel.ts    # Project data model
│   ├── TaskModel.ts       # Task data model
│   ├── MaterialModel.ts   # Material tracking model
│   ├── ProgressReportModel.ts  # Progress reporting model
│   └── database.ts        # WatermelonDB configuration
└── ...
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. For iOS setup:
   ```bash
   cd ios && pod install
   ```

3. Start the Metro bundler:
   ```bash
   npm start
   ```

4. Run on iOS or Android:
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```