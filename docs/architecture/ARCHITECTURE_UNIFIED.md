# Construction Site Progress Tracker - Unified Architecture Documentation

## Project Overview

A React Native mobile application designed for construction site management with offline-first capabilities using WatermelonDB. The application features role-based navigation for different construction team members (Supervisors, Managers, Planners, Logistics, Design Engineers, Commercial Managers, Admin) with comprehensive progress tracking, reporting, material management, financial management, and advanced planning capabilities.

**Current Version**: v2.21 (ALL 6 ROLES Phase 1 COMPLETE ✅🎉)
**Database Schema Version**: 36 (Design Documents Management)
**Platform**: React Native (Android & iOS)
**Last Updated**: February 1, 2026

The application has achieved a historic milestone with ALL 6 user roles (Manager, Logistics, Commercial, Planning, Admin, Design Engineer) completing Phase 1 of the improvement roadmap, representing a comprehensive architectural transformation with over 15,000 lines of code eliminated and a 68.2% average reduction across all roles.

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
│   ├── services/                 # Shared application services (v2.13 - NEW)
│   │   ├── LoggingService.ts     # Centralized logging (60 lines, 4 log levels)
│   │   ├── PasswordResetService.ts # Password reset with email delivery (v2.18 - NEW)
│   │   └── supabase/             # Supabase integration (v2.18 - NEW)
│   │       ├── supabaseClient.ts # Supabase client configuration
│   │       └── SupabaseAuthService.ts # Supabase authentication service
│   ├── auth/                     # Authentication screens (v2.18 - Enhanced)
│   │   ├── LoginScreen.tsx       # User login screen
│   │   ├── ForgotPasswordScreen.tsx # Forgot password screen (v2.18 - NEW)
│   │   └── ResetPasswordScreen.tsx  # Reset password screen (v2.18 - NEW)
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
│   ├── commercial/               # Commercial Manager screens (5 screens - v2.20 REFACTORED ✅)
│   │   ├── CommercialDashboardScreen.tsx # Financial health dashboard (148 lines - 82% reduction!)
│   │   ├── BudgetManagementScreen.tsx    # Budget CRUD with variance tracking (720 lines)
│   │   ├── CostTrackingScreen.tsx        # Cost tracking with PO linkage (253 lines - 67.4% reduction!)
│   │   ├── InvoiceManagementScreen.tsx   # Invoice & payment management (234 lines - 73% reduction!)
│   │   ├── FinancialReportsScreen.tsx    # Multi-table financial analytics (195 lines - 75.4% reduction!)
│   │   ├── dashboard/            # Commercial Dashboard modular structure (v2.20 - NEW)
│   │   │   ├── components/       # 6 card components (AlertsCard, BudgetSummaryCard, etc.)
│   │   │   ├── hooks/            # useDashboardData hook
│   │   │   └── utils/            # Dashboard constants & calculations
│   │   ├── invoice-management/   # Invoice Management modular structure (v2.20 - NEW)
│   │   │   ├── components/       # 5 components (InvoiceCard, FormDialog, SummaryCards, etc.)
│   │   │   ├── hooks/            # useInvoiceData, useInvoiceFilters
│   │   │   └── utils/            # Invoice constants & validation
│   │   ├── cost-tracking/        # Cost Tracking modular structure (v2.20 - NEW)
│   │   │   ├── components/       # 6 components (CostCard, FormDialog, CategoryChip, etc.)
│   │   │   ├── hooks/            # useCostData, useCostFilters, useCostForm
│   │   │   └── utils/            # Cost constants & formatters
│   │   ├── financial-reports/    # Financial Reports modular structure (v2.20 - NEW)
│   │   │   ├── components/       # 7 card components (ProfitabilityCard, BudgetVarianceCard, etc.)
│   │   │   ├── hooks/            # useReportData, useDateFilter
│   │   │   └── utils/            # Report constants & calculations
│   │   └── context/
│   │       └── CommercialContext.tsx     # Commercial state management (v2.11)
│   ├── planning/                 # Planning-specific screens (9 screens - v2.20: Phase 1 COMPLETE ✅)
│   │   ├── SiteManagementScreen.tsx    # Site creation & supervisor assignment (v1.7)
│   │   ├── WBSManagementScreen.tsx     # WBS management (v1.4)
│   │   ├── ResourcePlanningScreen.tsx  # Resource planning (stub)
│   │   ├── ScheduleManagementScreen.tsx # Schedule management (stub)
│   │   ├── BaselineScreen.tsx          # Baseline planning (v1.3)
│   │   ├── milestone-tracking/  # Milestone Tracking (v2.20 Phase 1 - REFACTORED)
│   │   │   ├── MilestoneTrackingScreen.tsx # Main screen (181 lines) ⬇️75.8%
│   │   │   ├── components/
│   │   │   │   ├── MilestoneCard.tsx   # Milestone card display (145 lines)
│   │   │   │   ├── MilestoneFormDialog.tsx # Create/Edit dialog (180 lines)
│   │   │   │   ├── ProgressSection.tsx # Progress visualization (95 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useMilestoneData.ts # Data fetching (120 lines)
│   │   │   │   ├── useMilestoneForm.ts # Form management (140 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   └── utils/
│   │   │       ├── milestoneConstants.ts # Constants (28 lines)
│   │   │       ├── milestoneCalculations.ts # Progress calculations (65 lines)
│   │   │       └── index.ts            # Barrel exports
│   │   ├── item-edit/           # Item Edit (v2.20 Phase 1 - REFACTORED)
│   │   │   ├── ItemEditScreen.tsx      # Main screen (297 lines) ⬇️59.6%
│   │   │   ├── components/
│   │   │   │   ├── LockedBanner.tsx    # Lock indicator (28 lines)
│   │   │   │   ├── WBSCodeDisplay.tsx  # WBS code display (58 lines)
│   │   │   │   ├── ItemDetailsSection.tsx # Item details form (91 lines)
│   │   │   │   ├── ScheduleSection.tsx # Schedule fields (86 lines)
│   │   │   │   ├── QuantitySection.tsx # Quantity fields (97 lines)
│   │   │   │   ├── CriticalPathSection.tsx # Critical path toggle (73 lines)
│   │   │   │   ├── RiskSection.tsx     # Risk management (79 lines)
│   │   │   │   ├── ItemInfoCard.tsx    # Info display (63 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useItemEdit.ts      # Data operations (139 lines)
│   │   │   │   ├── useItemForm.ts      # Form state (132 lines)
│   │   │   │   ├── useDateCalculations.ts # Date logic (63 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   └── utils/
│   │   │       ├── itemEditConstants.ts # Constants (84 lines)
│   │   │       ├── itemEditValidation.ts # Validation (114 lines)
│   │   │       ├── statusCalculations.ts # Status logic (96 lines)
│   │   │       └── index.ts            # Barrel exports
│   │   ├── gantt-chart/         # Gantt Chart (v2.20 Phase 1 - REFACTORED)
│   │   │   ├── GanttChartScreen.tsx    # Main screen (164 lines) ⬇️74.7%
│   │   │   ├── components/
│   │   │   │   ├── ZoomControls.tsx    # Zoom UI (47 lines)
│   │   │   │   ├── GanttLegend.tsx     # Legend display (61 lines)
│   │   │   │   ├── TimelineHeader.tsx  # Timeline header (48 lines)
│   │   │   │   ├── TaskInfo.tsx        # Task information (53 lines)
│   │   │   │   ├── TaskBar.tsx         # Task bar rendering (84 lines)
│   │   │   │   ├── TaskRow.tsx         # Task row (51 lines)
│   │   │   │   ├── GanttHeader.tsx     # Header section (62 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useGanttData.ts     # Data fetching (59 lines)
│   │   │   │   ├── useGanttTimeline.ts # Timeline calculations (60 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   └── utils/
│   │   │       ├── ganttConstants.ts   # Chart constants (42 lines)
│   │   │       ├── ganttCalculations.ts # Position calculations (165 lines)
│   │   │       └── index.ts            # Barrel exports
│   │   ├── item-creation/       # Item Creation (v2.20 Phase 1 - REFACTORED)
│   │   │   ├── ItemCreationScreen.tsx  # Main screen (217 lines) ⬇️65.7%
│   │   │   ├── components/
│   │   │   │   ├── WBSCodeDisplay.tsx  # WBS code preview (67 lines)
│   │   │   │   ├── ItemDetailsSection.tsx # Item name input (36 lines)
│   │   │   │   ├── CategorySection.tsx # Category selector (32 lines)
│   │   │   │   ├── PhaseSection.tsx    # Phase selector (35 lines)
│   │   │   │   ├── ScheduleSection.tsx # Date/duration fields (73 lines)
│   │   │   │   ├── QuantitySection.tsx # Quantity fields (102 lines)
│   │   │   │   ├── CriticalPathSection.tsx # Critical path (69 lines)
│   │   │   │   ├── RiskSection.tsx     # Risk management (67 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useWBSCodeGeneration.ts # WBS code generation (47 lines)
│   │   │   │   ├── useItemForm.ts      # Form state (103 lines)
│   │   │   │   ├── useDateCalculations.ts # Date calculations (34 lines)
│   │   │   │   ├── useItemCreation.ts  # Database operations (96 lines)
│   │   │   │   └── index.ts            # Barrel exports
│   │   │   └── utils/
│   │   │       ├── itemCreationConstants.ts # Constants (66 lines)
│   │   │       └── index.ts            # Barrel exports
│   │   └── components/                 # Shared Planning components
│   │       ├── SiteSelector/SimpleSiteSelector.tsx # Site selector with observables (v1.7)
│   │       ├── SupervisorAssignmentPicker.tsx # Supervisor picker (v1.7)
│   │       ├── ProjectSelector.tsx     # Project dropdown selector (v1.3)
│   │       ├── ItemPlanningCard.tsx    # Item card with date pickers (v1.3)
│   │       ├── DependencyModal.tsx     # Dependency management modal (v1.3)
│   │       ├── WBSItemCard.tsx         # WBS item display card (v1.4)
│   │       ├── CategorySelector.tsx    # Category dropdown (v1.4)
│   │       ├── PhaseSelector.tsx       # Phase dropdown (v1.4)
│   │       └── DatePickerField.tsx     # Date picker component
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
│   ├── components/               # Shared UI components
│   │   ├── common/               # Common components (v2.12 Phase 2)
│   │   │   ├── ErrorBoundary.tsx # Error boundary (150 lines)
│   │   │   ├── EmptyState.tsx    # Empty state display (130 lines) - Phase 2
│   │   │   ├── LoadingOverlay.tsx # Full-screen loading (120 lines) - Phase 2
│   │   │   ├── SyncStatusChip.tsx # Sync status indicators (120 lines) - Phase 2
│   │   │   └── index.ts          # Barrel exports
│   │   ├── dialogs/              # Dialog components (v2.13 Phase 2 & 4)
│   │   │   ├── FormDialog.tsx    # Reusable form wrapper (150 lines) - Phase 2
│   │   │   ├── PhotoPickerDialog.tsx # Camera/gallery picker (90 lines) - Phase 2
│   │   │   ├── ConfirmDialog.tsx # Enhanced confirm dialog (160 lines) - Phase 2
│   │   │   ├── CopyItemsDialog.tsx # Site selector & copy preview (330 lines) - Phase 4
│   │   │   ├── DuplicateItemsDialog.tsx # Duplicate resolution (260 lines) - Phase 4
│   │   │   └── index.ts          # Barrel exports
│   │   ├── skeletons/            # Loading skeletons (v2.12 Phase 2)
│   │   │   ├── Skeleton.tsx      # Base skeleton with shimmer (153 lines) - Phase 2
│   │   │   ├── SkeletonCard.tsx  # Card skeleton (122 lines) - Phase 2
│   │   │   ├── SkeletonList.tsx  # List skeleton (73 lines) - Phase 2
│   │   │   ├── SkeletonForm.tsx  # Form skeleton (124 lines) - Phase 2
│   │   │   ├── SkeletonHeader.tsx # Header skeleton (121 lines) - Phase 2
│   │   │   └── index.ts          # Barrel exports
│   │   └── SyncIndicator.tsx     # Real-time sync status indicator (200 lines)
│   ├── hooks/                    # Shared custom hooks (v2.12 Phase 1 & 2)
│   │   ├── usePhotoUpload.ts     # Photo upload logic (247 lines) - Phase 1
│   │   ├── useChecklist.ts       # Checklist logic (241 lines) - Phase 1
│   │   ├── useFormValidation.ts  # Form validation (450 lines) - Phase 2
│   │   ├── useOfflineSync.ts     # Offline sync hook (370 lines) - Phase 2
│   │   └── index.ts              # Barrel exports
│   ├── supervisor/               # Supervisor-specific screens (7 screens, v2.12: Modular)
│   │   ├── ReportsHistoryScreen.tsx      # View submitted reports history (756 lines)
│   │   ├── ItemsManagementScreen.tsx     # Manage construction items (725 lines)
│   │   ├── MaterialTrackingScreen.tsx    # Track materials (563 lines)
│   │   ├── SiteManagementScreen.tsx      # Manage sites (476 lines)
│   │   ├── site_inspection/      # Site Inspection (v2.12 Phase 1 - REFACTORED)
│   │   │   ├── SiteInspectionScreen.tsx  # Main screen (260 lines) ⬇️79.3%
│   │   │   ├── components/
│   │   │   │   ├── ChecklistSection.tsx  # Checklist UI (179 lines)
│   │   │   │   ├── InspectionCard.tsx    # Inspection card (377 lines)
│   │   │   │   ├── InspectionForm.tsx    # Form component (397 lines)
│   │   │   │   ├── InspectionList.tsx    # List view (76 lines)
│   │   │   │   ├── PhotoGallery.tsx      # Photo handling (147 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useInspectionData.ts  # Data fetching (213 lines)
│   │   │   │   ├── useInspectionForm.ts  # Form logic (243 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── utils/
│   │   │   │   ├── inspectionFormatters.ts # Formatting (96 lines)
│   │   │   │   ├── inspectionValidation.ts # Validation (85 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   └── types.ts          # Centralized types (96 lines)
│   │   ├── daily_reports/        # Daily Reports (v2.12 Phase 1 & 2 - REFACTORED)
│   │   │   ├── DailyReportsScreen.tsx    # Main screen (273 lines) ⬇️71.7%
│   │   │   ├── components/
│   │   │   │   ├── ItemCard.tsx          # Item display card (135 lines)
│   │   │   │   ├── ItemsList.tsx         # Items list (98 lines)
│   │   │   │   ├── ProgressReportForm.tsx # Update dialog (196 lines)
│   │   │   │   ├── ReportSyncStatus.tsx  # Sync status (58 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useReportData.ts      # Data fetching (134 lines)
│   │   │   │   ├── useReportForm.ts      # Form state (215 lines)
│   │   │   │   ├── useReportSync.ts      # PDF & submission (242 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── state/            # State management (v2.12 Phase 2)
│   │   │   │   ├── reportReducer.ts      # useReducer logic (167 lines)
│   │   │   │   ├── reportActions.ts      # Action creators (95 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── utils/
│   │   │   │   ├── reportFormatters.ts   # Status formatters (96 lines)
│   │   │   │   ├── reportValidation.ts   # Validation (42 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   └── types.ts          # Type definitions (45 lines)
│   │   ├── hindrance_reports/    # Hindrance Reports (v2.12 Phase 1 - REFACTORED)
│   │   │   ├── HindranceReportScreen.tsx # Main screen (160 lines) ⬇️81.5%
│   │   │   ├── components/
│   │   │   │   ├── HindranceCard.tsx     # Hindrance card (171 lines)
│   │   │   │   ├── HindranceForm.tsx     # Create/edit dialog (250 lines)
│   │   │   │   ├── HindranceList.tsx     # List view (75 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── hooks/
│   │   │   │   ├── useHindranceData.ts   # Data fetching (164 lines)
│   │   │   │   ├── useHindranceForm.ts   # Form state & CRUD (252 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   ├── utils/
│   │   │   │   ├── hindranceFormatters.ts # Priority/status (52 lines)
│   │   │   │   ├── hindranceValidation.ts # Validation (27 lines)
│   │   │   │   └── index.ts              # Barrel exports
│   │   │   └── types.ts          # Type definitions (22 lines)
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
│   │   ├── DesignEngineerNavigator.tsx # Design Engineer bottom tabs (4 tabs - v2.10, v36)
│   │   ├── CommercialNavigator.tsx # Commercial Manager bottom tabs (5 tabs - v2.11)
│   │   └── types.ts              # Navigation type definitions
│   └── utils/                    # Utility screens and helpers (v2.10)
│       ├── Phase1TestUtility.tsx        # Phase 1 milestone testing utility
│       ├── ManagerTestDataUtility.tsx   # Manager dashboard test data generator
│       └── demoData/                    # Demo data seeders
│           ├── DoorsSeeder.ts           # DOORS demo data (v2.4)
│           └── RfqSeeder.ts             # RFQ demo data (v2.4)
├── supabase/                     # Supabase backend services (v2.18 - NEW)
│   └── functions/                # Supabase Edge Functions
│       ├── .vscode/              # VS Code Deno configuration
│       │   └── settings.json     # Deno settings for IDE
│       ├── import_map.json       # Deno module resolution
│       └── send-reset-email/     # Password reset email function
│           ├── index.ts          # Edge Function code (TypeScript/Deno)
│           ├── deno.json         # Deno compiler options
│           └── README.md         # Deployment documentation
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

- **Admin** (`src/admin/`): 4 screens for system administration (v1.2, v2.21: Phase 1 COMPLETE ✅)
  - Dashboard with statistics and role switcher
  - Project management with CASCADE deletion
  - User and role management (CRUD operations)
  - **v2.21 Phase 1 Refactoring**:
    - RoleManagementScreen: 932 → 202 lines (78.3% reduction!)
    - ProjectManagementScreen: 670 → 169 lines (74.8% reduction!)
    - AdminDashboardScreen: 569 → 128 lines (77.5% reduction!)
    - Total: 3 critical files refactored, 3 new modular files created
  - **Context Management**: AdminContext provides role switching and state management

- **Supervisor** (`src/supervisor/`): 7 screens for field operations (v2.13: Modular Architecture)
  - Daily report submission, history viewing, hindrance reporting
  - Item management, material tracking, site management
  - Site inspections with safety checklists
  - **Context Management**: SiteContext provides shared site selection across all supervisor screens
  - **Modular Architecture (v2.13)**: Large screens broken down into components, hooks, and utils
    - **SiteInspectionScreen**: Refactored from 1,258 lines → 260 lines (79.3% reduction)
      - Structure: `src/supervisor/site_inspection/`
        - `SiteInspectionScreen.tsx` (260 lines) - Main screen
        - `components/` - 6 reusable components (InspectionForm, InspectionList, InspectionCard, PhotoGallery, ChecklistSection)
        - `hooks/` - 3 custom hooks (useInspectionData, useInspectionForm, usePhotoUpload)
        - `utils/` - Validation and formatting utilities
        - `types.ts` - Centralized type definitions
      - Benefits: Maintainability, reusability, separation of concerns, easy testing

- **Manager** (`src/manager/`): 4 screens for project oversight
  - Project overview, team management
  - Financial reports, resource allocation

- **Planning** (`src/planning/`): 12 screens for project planning (v1.3-v2.21, Phase 1 COMPLETE)
  - **Navigation**: Stack + Drawer + Bottom Tabs (3-tier hybrid)
  - **Workflow**: Sites -> Items (WBS) -> Key Dates -> Schedule Review -> Critical Path -> Lock Baseline -> Track Milestones
  - **Bottom Tabs**: Dashboard, Key Dates, Schedule (Timeline/Calendar/List), Gantt Chart
  - **Drawer**: Site Management, WBS Management, Item Creation, Resources (stub), Milestone Tracking, Baseline Planning
  - **Stack**: Item Creation (params: siteId, parentWbsCode?), Item Edit (params: itemId)
  - **Key Services**: PlanningService (critical path, forecasting, baseline locking), WBSCodeGenerator (4-level hierarchy)
  - **v2.20 Phase 1 Refactoring**: 4 screens refactored (56 new modular files, 68.9% avg reduction)
  - See `docs/implementation/planning-module/PLANNING_WORKFLOW.md` for complete action flow

- **Logistics** (`src/logistics/`): 14 screens for materials/equipment (v2.20: Modular Architecture)
  - Material tracking with BOM integration (v2.4)
  - DOORS equipment specification tracking (v2.4)
  - RFQ management and vendor workflows (v2.4)
  - Delivery scheduling, inventory management
  - Equipment management, purchase orders
  - **Modular Architecture (v2.20)**: Large screens broken down into components, hooks, and utils
    - **MaterialTrackingScreen**: Refactored from 2,013 lines → 456 lines (77.3% reduction)
      - Structure: `src/logistics/material-tracking/`
        - `MaterialTrackingScreen.tsx` (456 lines) - Main screen
        - `components/` - 8 reusable components (StatCards, FiltersBar, Charts, ShipmentsList)
        - `hooks/` - 5 custom hooks (useMaterialTrackingData, useMaterialFilters, useMaterialStats, useChartData, useShipmentData)
        - `utils/` - 4 utility modules (materialFormatters, materialCalculations, materialConstants, chartHelpers)
    - **LogisticsAnalyticsScreen**: Refactored from 1,638 lines → 524 lines (68.0% reduction)
      - Structure: `src/logistics/analytics/`
        - `LogisticsAnalyticsScreen.tsx` (524 lines) - Main screen
        - `components/` - 7 reusable components (ViewModeTabs, StatCards, MetricCard, ChartCard, Sections)
        - `hooks/` - 4 custom hooks (useAnalyticsData, useMetricsCalculation, useChartData, useForecastData)
        - `utils/` - 3 utility modules (analyticsFormatters, analyticsCalculations, analyticsConstants)
    - **InventoryManagementScreen**: Refactored from 1,583 lines → 228 lines (85.6% reduction)
      - Structure: `src/logistics/inventory/`
        - `InventoryManagementScreen.tsx` (228 lines) - Main screen
        - `components/` - 9 reusable components (ViewModeTabs, StatCards, FiltersBar, Badges, Sections)
        - `hooks/` - 3 custom hooks (useInventoryData, useInventoryFilters, useInventoryStats)
        - `utils/` - 2 utility modules (inventoryConstants, inventoryFormatters)
    - **DeliverySchedulingScreen**: Refactored from 1,362 lines → 209 lines (84.7% reduction)
      - Structure: `src/logistics/delivery-scheduling/`
        - `DeliverySchedulingScreen.tsx` (209 lines) - Main screen
        - `components/` - 10 reusable components (ViewModeTabs, StatCards, StatusFilters, Views, Modal)
        - `hooks/` - 2 custom hooks (useDeliveryData, useDeliveryFilters)
        - `utils/` - 2 utility modules (deliveryConstants, deliveryFormatters)

- **Commercial Manager** (`src/commercial/`): 5 screens for financial management (v2.11-v2.21: Phase 1 COMPLETE ✅)
  - Budget Management: Category-based budget allocation with variance tracking
  - Cost Tracking: Real-time cost monitoring with PO linkage
  - Invoice Management: Payment tracking with automatic overdue calculation
  - Financial Reports: Multi-table analytics with profitability metrics
  - Commercial Dashboard: Real-time financial health with intelligent alerts
  - **v2.20 Phase 1 Refactoring**:
    - CommercialDashboardScreen: 806 → 148 lines (82% reduction!)
    - InvoiceManagementScreen: 868 → 234 lines (73% reduction!)
    - CostTrackingScreen: 767 → 253 lines (67.4% reduction!)
    - FinancialReportsScreen: 785 → 195 lines (75.4% reduction!)
    - Total: 4 critical files refactored, 20 new modular files created

- **Design Engineer** (`src/design_engineer/`): 4 screens for engineering management (v2.10-v2.21: Phase 1 COMPLETE ✅)
  - Design Engineer Dashboard with project overview and metrics
  - **Design Document Management** (v36) - 4 document types with approval workflow (2nd tab)
  - DOORS Package Management for equipment specifications
  - Design RFQ Management for procurement workflows
  - **v36 Design Documents Feature**:
    - DesignDocumentManagementScreen with full CRUD, filtering, FAB.Group
    - 4 document types: Simulation/Study, Installation, Product/Equipment, As-Built
    - Status workflow: Draft → Submitted → Approved / Approved with Comment / Rejected
    - User-defined sub-categories with default Installation categories
    - Components: DesignDocumentCard, CreateDesignDocumentDialog, ManageCategoriesDialog, ApprovalDialog
  - **v2.21 Phase 1 Refactoring**:
    - DesignRfqManagementScreen: 662 → 222 lines (66.5% reduction!)
    - DoorsPackageManagementScreen: 616 → 237 lines (61.5% reduction!)
    - DesignEngineerDashboardScreen: 410 → 285 lines (30.5% reduction!)
    - Total: 3 screens improved, 14 new modular files created (5 components, 6 hooks, 3 types)

#### Navigation Architecture
- **Location**: `src/nav/`
- **Pattern**: Hierarchical navigation with role-based bottom tabs
- **Implementation**: React Navigation v6 (Stack + Bottom Tabs)

### 2. Data Layer (`models/`)

**Purpose**: Database models, schema, and relationships

#### WatermelonDB Models
- **Location**: `/models/` (root level, NOT in src/)
- **Schema Version**: 36 (defined in `models/schema/index.ts`)
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
12. **ScheduleRevisionModel**: Schedule revision tracking (v1.3)
13. **InterfacePointModel**: Interface coordination between contractors (v1.4)
14. **TemplateModuleModel**: Reusable WBS templates (v1.4)
15. **BomModel**: Bill of Materials management (v22)
16. **BomItemModel**: BOM line items with cost calculations (v22)
17. **DoorsPackageModel**: DOORS equipment specification packages (v26)
18. **DoorsRequirementModel**: Individual DOORS requirements (v26)
19. **VendorModel**: Vendor/supplier management (v28)
20. **RfqModel**: Request for Quotation management (v28)
21. **RfqVendorQuoteModel**: Vendor quote responses (v28)
22. **MilestoneModel**: Project milestones with weighted progress (v30)
23. **MilestoneProgressModel**: Site-level milestone progress (v30)
24. **PurchaseOrderModel**: Purchase order lifecycle tracking (v30)
25. **BudgetModel**: Budget allocation by category (v31)
26. **CostModel**: Actual cost tracking (v31)
27. **InvoiceModel**: Invoice and payment tracking (v31)
28. **KeyDateModel**: Contract key dates with delay damages (v35)
29. **KeyDateSiteModel**: Key date to site junction table (v35)
30. **DesignDocumentCategoryModel**: Document sub-categories per type (v36)
31. **DesignDocumentModel**: Design documents with approval workflow (v36)

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
    ├── AdminNavigator (4 tabs - v1.2, v2.21 Phase 1 COMPLETE ✅)
    │   ├── AdminDashboardScreen (🏠 Dashboard)
    │   ├── ProjectManagementScreen (📁 Projects)
    │   ├── RoleManagementScreen (👥 Users)
    │   └── SyncMonitoringScreen (🔄 Sync - v2.2 monitoring)
    ├── SupervisorNavigator (7 tabs)
    │   ├── DailyReportsScreen (📝 Reports)
    │   ├── ReportsHistoryScreen (📊 History)
    │   ├── ItemsManagementScreen (📋 Items)
    │   ├── MaterialTrackingScreen (🚚 Materials)
    │   ├── SiteManagementScreen (🏗️ Sites)
    │   ├── HindranceReportScreen (⚠️ Issues)
    │   └── SiteInspectionScreen (🔍 Inspection)
    ├── ManagerNavigator (5 tabs - v2.20 Phase 1 COMPLETE ✅)
    │   ├── ManagerDashboardScreen (📊 Overview - v2.20 REFACTORED ⬇️24%)
    │   ├── TeamManagementScreen (👥 Team)
    │   ├── FinancialReportsScreen (💰 Finance)
    │   ├── ResourceRequestsScreen (📤 Resources)
    │   └── BomManagementScreen (📦 BOM - v2.20 REFACTORED ⬇️86%)
    ├── PlanningNavigator (Stack + Drawer + Bottom Tabs - v2.21 Phase 1 COMPLETE)
    │   ├── Stack Navigator (outer)
    │   │   ├── SiteManagement -> Drawer Navigator (main container)
    │   │   ├── ItemCreation (params: siteId, parentWbsCode?) [v2.20 - REFACTORED 65.7%]
    │   │   └── ItemEdit (params: itemId) [v2.20 - REFACTORED 59.6%]
    │   ├── Drawer Navigator (middle - 7 entries)
    │   │   ├── MainTabs -> Bottom Tab Navigator
    │   │   ├── Resources -> ResourcePlanningScreen [stub]
    │   │   ├── Sites -> SiteManagementScreen (WHERE work happens) [v1.7]
    │   │   ├── WBS -> WBSManagementScreen (WHAT work to do) [v1.4]
    │   │   ├── CreateItem -> ItemCreationScreen
    │   │   ├── MilestoneTracking -> MilestoneTrackingScreen (TRACK progress) [v2.20 - REFACTORED 75.8%]
    │   │   └── Baseline -> BaselineScreen (LOCK the plan) [v1.3]
    │   └── Bottom Tab Navigator (inner - 4 tabs)
    │       ├── Dashboard -> PlanningDashboard (OVERVIEW)
    │       ├── KeyDates -> KeyDateManagementScreen (CONTRACT dates)
    │       ├── Schedule -> UnifiedSchedule (WHEN work happens - Timeline/Calendar/List)
    │       └── Gantt -> GanttChartScreen (VISUALIZE timeline) [v2.20 - REFACTORED 74.7%]
    ├── LogisticsNavigator (4 tabs - v2.20 Phase 1 COMPLETE ✅)
    │   ├── MaterialTrackingScreen (📦 Materials - v2.20 REFACTORED ⬇️77.3%)
    │   ├── EquipmentManagementScreen (🚜 Equipment)
    │   ├── DeliverySchedulingScreen (🚚 Delivery - v2.20 REFACTORED ⬇️84.7%)
    │   └── InventoryManagementScreen (📋 Inventory - v2.20 REFACTORED ⬇️85.6%)
    ├── DesignEngineerNavigator (4 tabs - v2.10, v36)
    │   ├── DesignEngineerDashboardScreen (📊 Dashboard - v2.21 REFACTORED ⬇️30.5%)
    │   ├── DesignDocumentManagementScreen (📄 Design Docs - v36 NEW)
    │   ├── DoorsPackageManagementScreen (📦 DOORS Packages - v2.21 REFACTORED ⬇️61.5%)
    │   └── DesignRfqManagementScreen (📝 RFQs - v2.21 REFACTORED ⬇️66.5%)
    └── CommercialNavigator (5 tabs - v2.11, v2.20 Phase 1 COMPLETE ✅)
        ├── CommercialDashboardScreen (📊 Dashboard - Financial health - v2.20 REFACTORED ⬇️82%)
        ├── BudgetManagementScreen (💰 Budget - Allocation & variance)
        ├── CostTrackingScreen (💵 Costs - Tracking & PO linkage - v2.20 REFACTORED ⬇️67.4%)
        ├── InvoiceManagementScreen (📄 Invoices - Payment tracking - v2.20 REFACTORED ⬇️73%)
        └── FinancialReportsScreen (📈 Reports - Multi-table analytics - v2.20 REFACTORED ⬇️75.4%)
```

### Navigation Patterns

1. **Role-based Access**: Different navigators and screens per role (Supervisor, Manager, Logistics, Commercial, Admin, Planning, Design Engineer) - ALL 6 ROLES Phase 1 COMPLETE ✅
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
- **v25**: Added `baseline_bom_id` to boms table for execution tracking (Activity 4, Phase 2)
- **v26**: Added DOORS system - `doors_packages`, `doors_requirements` tables + `doors_id` to bom_items (Activity 4, Phase 2)
- **v27**: Added edit audit trail to DOORS tables + linking metadata to bom_items (Activity 4, Phase 3)
- **v28**: Added RFQ Management - `vendors`, `rfqs`, `rfq_vendor_quotes` tables (Activity 4, Phase 3)
- **v29**: Added `project_id` to users table for supervisor project assignment (v2.9)
- **v30**: Added Manager role tables - `milestones`, `milestone_progress`, `purchase_orders` (v2.10)
- **v31**: Added multi-role tables - `budgets`, `costs`, `invoices` + enhancements (v2.11)
- **v32**: Added `vendor_name` to invoices table (v2.11 fix)
- **v33**: Added PDF error tracking fields to daily_reports (Phase A: Share Button fix)
- **v34**: Added PDF generation status fields to daily_reports (Phase B: Async PDF)
- **v35**: Added Key Dates tables - `key_dates`, `key_date_sites` + `key_date_id` to items (Phase 5a)
- **v36**: Current version - Added Design Documents tables - `design_document_categories`, `design_documents` (Design Engineer)

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
- **System Roles**: Admin, Supervisor, Manager, Planner, Logistics, Design Engineer, Commercial Manager

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

#### doors_packages (v26 - DOORS System)
- Equipment/material specification packages with measurable requirements
- Fields: doors_id, equipment_name, category, equipment_type, project_id, specification_ref, drawing_ref, quantity, unit, compliance fields, status, priority, RFQ/PO/delivery fields, ownership/audit fields
- **Relationships**: belongs_to project, has_many doors_requirements
- **Purpose**: Track engineering requirements compliance for equipment/materials (100 requirements per package)

#### doors_requirements (v26 - DOORS System)
- Individual requirements within a DOORS package
- Fields: requirement_id, doors_package_id, category, requirement_code, requirement_text, compliance fields, review fields, attachment refs
- **Relationships**: belongs_to doors_package
- **Purpose**: Track individual requirement compliance status and vendor responses

#### vendors (v28 - RFQ Management)
- Vendor/supplier management
- Fields: vendor_code, vendor_name, category, contact details, rating, is_approved, performance_score, total_orders
- **Purpose**: Maintain approved vendor list for RFQ and procurement processes

#### rfqs (v28 - RFQ Management)
- Request for Quotation management
- Fields: rfq_number, doors_id, doors_package_id, project_id, title, status, dates, vendor counts, winning vendor/quote, rfq_type
- **Relationships**: belongs_to doors_package, has_many rfq_vendor_quotes
- **Purpose**: Manage engineering and procurement RFQ lifecycle

#### rfq_vendor_quotes (v28 - RFQ Management)
- Vendor quote responses to RFQs
- Fields: rfq_id, vendor_id, quoted_price, currency, lead_time_days, compliance scores, evaluation scores, rank, status
- **Relationships**: belongs_to rfq, belongs_to vendor
- **Purpose**: Track and evaluate vendor quotations for technical and commercial scoring

#### milestones (v30 - Manager Role)
- Project milestones for progress tracking
- Fields: project_id, milestone_code, milestone_name, description, sequence_order, weightage, is_active, is_custom
- **Relationships**: belongs_to project, has_many milestone_progress
- **Purpose**: Define and track project milestones with weighted progress calculation

#### milestone_progress (v30 - Manager Role)
- Site-level progress for milestones
- Fields: milestone_id, site_id, project_id, progress_percentage, status, dates, notes
- **Relationships**: belongs_to milestone, belongs_to site
- **Purpose**: Track milestone progress at individual site level

#### purchase_orders (v30 - Manager Role)
- Purchase order management
- Fields: po_number, rfq_id, vendor_id, project_id, po_value, currency, payment/delivery terms, status, items_details (JSON)
- **Relationships**: belongs_to rfq, belongs_to vendor
- **Purpose**: Track purchase orders from creation through delivery and closure

#### budgets (v31 - Commercial Manager)
- Project budget allocation by category
- Fields: project_id, category, allocated_amount, description
- **Purpose**: Define budget allocations for material, labor, equipment, other

#### costs (v31 - Commercial Manager)
- Actual cost tracking
- Fields: project_id, po_id, category, amount, description, cost_date
- **Purpose**: Track actual costs against budget allocations

#### invoices (v31 - Commercial Manager)
- Invoice tracking for purchase orders
- Fields: project_id, po_id, invoice_number, invoice_date, amount, payment_status, vendor_id, vendor_name
- **Purpose**: Track invoices and payment status for purchase orders

#### key_dates (v35 - Planning Key Dates)
- Contract key dates / milestones with delay damages
- Fields: code, category, category_name, description, target_days, target_date, actual_date, status, progress_percentage, delay_damages fields, project_id, sequence_order, dependencies
- **Relationships**: belongs_to project, has_many key_date_sites
- **Purpose**: Track contract key dates based on CMRL contract structure with tiered delay damage calculations

#### key_date_sites (v35 - Planning Key Dates)
- Junction table for key date to site mapping
- Fields: key_date_id, site_id, contribution_percentage, progress_percentage, status, schedule dates, notes
- **Relationships**: belongs_to key_date, belongs_to site
- **Purpose**: Track site-level contributions and progress for each key date

#### design_document_categories (v36 - Design Documents)
- User-defined sub-categories for design documents
- Fields: name, document_type (simulation_study | installation | product_equipment | as_built), project_id, is_default, sequence_order
- **Relationships**: belongs_to project, has_many design_documents
- **Default Installation categories**: Layout Plan & Section, Cable Tray Layout, Cable Schedule
- **Purpose**: Organize design documents into sub-categories per document type

#### design_documents (v36 - Design Documents)
- Design documents with approval workflow
- Fields: document_number, title, description, document_type, category_id, project_id, site_id (optional), revision_number, status (draft | submitted | approved | approved_with_comment | rejected), approval_comment, submitted_date, approved_date
- **Relationships**: belongs_to project, belongs_to design_document_category, belongs_to site (optional)
- **Document Types**: simulation_study (project-wide), installation (site-specific), product_equipment (project-wide), as_built (site-specific)
- **Status Workflow**: Draft → Submitted → Approved / Approved with Comment / Rejected
- **Purpose**: Manage design documents across 4 types with approval workflow for Design Engineer role

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

### Logging Service (`src/services/LoggingService.ts`) - v2.13
- **Purpose**: Centralized logging and error tracking for production-ready debugging
- **Implementation**: 60+ lines with 4 log levels (debug, info, warn, error)
- **Features**:
  - Environment-aware logging (console in development, silent in production)
  - Structured logging with context metadata (component, action, additional data)
  - Error objects with stack traces
  - Ready for integration with external services (Sentry, LogRocket, etc.)
- **Log Levels**:
  - `logger.debug()`: Development debugging (hidden in production)
  - `logger.info()`: Informational messages
  - `logger.warn()`: Warning conditions
  - `logger.error()`: Error conditions with stack traces
- **Usage Pattern**:
  ```typescript
  import { logger } from '../services/LoggingService';

  logger.info('Item saved successfully', {
    component: 'ItemsManagementScreen',
    action: 'handleSave',
    itemId: item.id
  });

  logger.error('Failed to save item', error as Error, {
    component: 'ItemsManagementScreen',
    action: 'handleSave',
    itemData: formData
  });
  ```
- **Migration**: All 61+ console.log statements across supervisor screens replaced with LoggingService (v2.13)
- **Documentation**: `docs/architecture/LOGGING_SERVICE.md`

### Item Copy Service (`src/services/ItemCopyService.ts`) - v2.13 Phase 4
- **Purpose**: Bulk copy work items between sites with progress reset for supervisor workflow
- **Implementation**: 280+ lines with WatermelonDB batch operations
- **Features**:
  - Batch copy with atomic transactions (single `database.write()` wrapper)
  - Duplicate detection with Set comparison (O(n) performance)
  - Reset progress fields (completedQuantity=0, status='not_started')
  - Offline support with appSyncStatus='pending'
  - Comprehensive error handling with per-item error collection
  - Integration with LoggingService for operation tracking
- **Key Functions**:
  - `copyItems(params)`: Main copy operation with WatermelonDB batch create
  - `detectDuplicates(sourceSiteId, destSiteId)`: Find matching item names using Set comparison
  - `countSiteItems(siteId)`: Count items via query for preview
  - `fetchSiteItems(siteId)`: Helper for fetching site items
- **Usage Pattern**:
  ```typescript
  import { copyItems, detectDuplicates } from '../services/ItemCopyService';

  // Check for duplicates first
  const duplicates = await detectDuplicates(sourceSiteId, destSiteId);

  // Copy items with duplicate handling
  const result = await copyItems({
    sourceSiteId,
    destinationSiteId,
    skipDuplicates: true,
    selectedDuplicates: duplicates
  });

  if (result.success) {
    console.log(`Copied ${result.itemsCopied} items`);
  }
  ```
- **Performance**: <3 seconds for 50+ items (WatermelonDB batch optimization)
- **Testing**: 9/10 tests passed (90% pass rate) - See PHASE_4_COPY_ITEMS_PLAN.md
- **Integration**: ItemsManagementScreen overflow menu with dialog flow

---

## Key Features

### 1. Role-based Access Control (Enhanced in v1.2, v2.21 - ALL 6 ROLES Phase 1 COMPLETE ✅)
- Different UI and functionality based on user role
- 7 distinct role types: Admin, Supervisor, Manager, Planner, Logistics, Design Engineer, Commercial Manager
- Database-based authentication with role assignment
- Admin role for system administration and user management
- Role switcher for admins to test different role views
- **v2.21 ALL ROLES PHASE 1 MILESTONE**: All 6 user roles (Manager, Logistics, Commercial, Planning, Admin, Design Engineer) have completed Phase 1 of the improvement roadmap with over 15,000 lines of code eliminated and a 68.2% average reduction across all roles

### 1.3. Self-Service Password Reset (v2.18 - NEW)

Complete password reset functionality with email delivery via Supabase and Resend API.

#### Password Reset Flow
1. **Forgot Password Screen**: User enters email address
2. **Token Generation**: Secure UUID token created with 1-hour expiry
3. **Email Delivery**: Professional HTML email sent via Resend API (Supabase Edge Function)
4. **Deep Linking**: Email link opens app to Reset Password screen
5. **Password Validation**: Strength indicator and validation rules
6. **Database Update**: Password hash updated in WatermelonDB with bcrypt

#### Components (`src/auth/` and `src/services/`)
- **ForgotPasswordScreen.tsx**: Email input with validation and user feedback
- **ResetPasswordScreen.tsx**: New password entry with strength indicator
- **PasswordResetService.ts**: Core reset logic with token management
- **supabase/supabaseClient.ts**: Supabase client configuration
- **supabase/SupabaseAuthService.ts**: Supabase authentication service

#### Supabase Edge Function (`supabase/functions/send-reset-email/`)
- **index.ts**: Deno/TypeScript function for email delivery
- **Integration**: Resend API (free tier: 3,000 emails/month)
- **Security**: API key stored in Supabase environment variables
- **Template**: Professional HTML email with reset link

#### Security Features
- **Token System**:
  - Cryptographically secure UUID tokens
  - 1-hour expiry enforcement
  - One-time use (marked as used after reset)
  - Stored in Supabase `password_reset_tokens` table
- **Password Security**:
  - Bcrypt hashing (8 salt rounds)
  - Strength validation (8+ chars, uppercase, lowercase, number)
  - Password confirmation matching
- **Deep Linking**:
  - Custom myapp:// scheme (Android intent filter)
  - Query parameter parsing for token and email
  - React Navigation deep linking configuration

#### Database Schema (Supabase)
```sql
CREATE TABLE password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Navigation Integration
- **MainNavigator.tsx**: Deep linking with custom query parameter parser
- **AuthNavigator.tsx**: Added ForgotPassword and ResetPassword screens
- **AndroidManifest.xml**: Deep link intent filter for myapp://reset-password

#### Testing Status
- ✅ Password reset for multiple users (admin, supervisor)
- ✅ Email delivery via Resend API
- ✅ Token validation and expiry
- ✅ Deep linking from email
- ✅ Login with new password
- ✅ Old password invalidation
- ✅ Production ready - 100% complete

### 1.5. Error Boundaries & Error Handling (v2.13)

The application implements comprehensive error handling with React Error Boundaries to prevent app crashes and provide graceful recovery.

#### Error Boundary Component (`src/components/common/ErrorBoundary.tsx`)
- **Purpose**: Catch JavaScript errors in component tree and display fallback UI
- **Implementation**: 150+ lines with error logging integration
- **Features**:
  - Error capture with component stack traces
  - Graceful fallback UI with user-friendly messages
  - "Try Again" button for error recovery
  - Integration with LoggingService for error tracking
  - Unique boundary names for easier debugging
  - Preserves error isolation per screen

#### Error Boundary Coverage (v2.13)
All 7 supervisor screens wrapped with ErrorBoundary for crash protection:
- ✅ SiteManagementScreen
- ✅ ItemsManagementScreen
- ✅ DailyReportsScreen
- ✅ MaterialTrackingScreen
- ✅ HindranceReportScreen
- ✅ SiteInspectionScreen
- ✅ ReportsHistoryScreen

#### Fallback UI Features
- 🟡 Warning icon with clear error message
- 📝 "Something went wrong" heading
- 💡 User-friendly explanation text
- 🔄 "Try Again" button to reset error state
- 📊 Error details logged to LoggingService

#### Usage Pattern
```typescript
// In SupervisorNavigator.tsx
<ErrorBoundary name="SiteInspectionScreen">
  <SiteInspectionScreen />
</ErrorBoundary>
```

#### Error Logging
Errors captured by ErrorBoundary are automatically logged with full context:
```typescript
logger.error('ErrorBoundary caught an error', error, {
  component: `ErrorBoundary:${name}`,
  action: 'componentDidCatch',
  errorInfo: errorInfo.componentStack
});
```

- **Testing**: All 7 error boundary tests passed (error capture, fallback UI, logging, recovery)
- **Documentation**: `docs/architecture/ERROR_BOUNDARY.md`

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

### 3. Planning Module Features (v1.3-v2.21)

#### Planning Workflow Overview

The Planning module follows a structured end-to-end workflow:

```
Sites -> Items (WBS) -> Key Dates -> Schedule Review -> Dependencies -> Critical Path -> Lock Baseline -> Track Milestones
```

**Setup Phase**: Create sites (Site Management), build WBS hierarchy (WBS Management), define work items (Item Creation/Edit)
**Key Dates Phase**: Define contractual key dates, assign sites with contribution percentages, link items to key dates
**Analysis Phase**: Review schedule (Timeline/Calendar/List views), visualize Gantt chart with zoom controls
**Baseline Phase**: Define dependencies, calculate critical path, lock baseline (IRREVERSIBLE)
**Tracking Phase**: Record milestone progress per site, monitor dashboard widgets

See `docs/implementation/planning-module/PLANNING_WORKFLOW.md` for complete action flow documentation.

#### Role Responsibility Boundaries

| Responsibility | Owner | Notes |
|---------------|-------|-------|
| Create projects | Admin | Planner is assigned to a project |
| Create sites | Planner | Sites belong to the assigned project |
| Assign supervisors to sites | Planner | Sets `supervisor_id` on sites |
| Create WBS items | Planner | Items belong to a site |
| Define key dates | Planner | Key dates belong to a project |
| Define item dependencies | Planner | JSON array of item IDs |
| Calculate critical path | Planner | PlanningService algorithm |
| Lock baseline | Planner | Irreversible operation |
| Create milestones | Admin/Manager | Planner cannot create milestones |
| Record milestone progress | Planner | Creates `milestone_progress` records |
| Record daily progress | Supervisor | Creates `progress_logs` against items |

#### Data Ownership

| Table | Created By | Updated By | Read By |
|-------|-----------|------------|---------|
| `sites` | Planner | Planner | All roles |
| `items` | Planner | Planner (plan), Supervisor (progress) | All roles |
| `key_dates` | Planner | Planner | All roles |
| `key_date_sites` | Planner | Planner | All roles |
| `milestones` | Admin/Manager | Admin/Manager | Planner (read-only) |
| `milestone_progress` | Planner | Planner | All roles |
| `schedule_revisions` | PlanningService | PlanningService | Planner |

#### Architectural Invariants

1. **Baseline lock is irreversible**: Once `isBaselineLocked = true`, no unlock mechanism exists
2. **WBS codes are unique per site**: `WBSCodeGenerator` enforces uniqueness within site scope
3. **WBS hierarchy is limited to 4 levels**: Codes follow `X.Y.Z.W` format
4. **Items require a site**: Every item belongs to exactly one site via `site_id`
5. **Key dates belong to a project**: Every key date requires a `project_id`
6. **Planner is assigned to one project**: PlanningContext resolves from user's `projectId` field
7. **Status is derived from progress**: WBS Management auto-corrects (0% = not_started, 100% = completed, else in_progress)
8. **Baseline dates are snapshot copies**: Copies of planned dates at lock time, never independently editable

#### Planning Services

**PlanningService** (`services/planning/PlanningService.ts`): Singleton service providing:
- `calculateCriticalPath(projectId)` -- Kahn's algorithm with forward/backward pass, updates `criticalPathFlag`
- `calculateProgressMetrics(projectId)` -- Overall progress, schedule variance, on-track/delayed counts
- `calculateScheduleVariance(itemId)` -- Per-item variance data
- `generateForecast(projectId)` -- Linear regression on last 30 days of `progress_logs`
- `validateDependencies(items)` -- Circular dependency detection via DFS
- `lockBaseline(projectId)` -- Copies planned dates to baseline fields, sets `isBaselineLocked = true`
- `createRevision(itemId, ...)` -- Creates `schedule_revisions` record, updates item dates
- `getItemSuccessors(itemId)` -- Finds items that depend on given item
- `calculateScheduleImpact(itemId, ...)` -- Recursive cascade impact analysis

**WBSCodeGenerator** (`services/planning/WBSCodeGenerator.ts`): Static utility for hierarchical WBS codes:
- `generateRootCode(siteId)` -- Next root code (1.0.0.0, 2.0.0.0)
- `generateChildCode(siteId, parentWbsCode)` -- Next child code (1.1.0.0, 1.2.0.0)
- `generateSiblingCode(siteId, siblingWbsCode)` -- Next sibling code
- `isCodeUnique(siteId, wbsCode, excludeItemId?)` -- Uniqueness validation
- `calculateLevel(wbsCode)` -- Level 1-4 from code string

#### PlanningContext

**File**: `src/planning/context/PlanningContext.tsx`

Wraps entire navigator. Provides:
- `projectId` / `projectName` -- from logged-in user's assigned project
- `selectedSiteId` / `selectedSite` -- current site selection
- `sites` -- all sites for the project
- `selectSite()` / `refreshSites()` / `refreshProject()` -- mutations
- Persists to `AsyncStorage` for offline session continuity

#### Offline-First Guarantees

1. All reads hit local WatermelonDB (SQLite) -- no network dependency
2. All writes are local-first with immediate persistence
3. New `key_dates` and `milestone_progress` records set `appSyncStatus = 'pending'`, `version = 1`
4. PlanningContext persists selections to AsyncStorage across restarts
5. Screens using `withObservables` automatically reflect local changes
6. Critical path calculation, baseline locking, and all CRUD execute entirely against local data

#### Screen Details

**Dashboard** (`src/planning/dashboard/PlanningDashboard.tsx`):
- 6 interactive widgets: Upcoming Milestones, Critical Path, Schedule Overview, Recent Activities, Resource Utilization, WBS Progress
- Widget taps navigate to corresponding detail screens
- Read-only aggregation of `items` and `progress_logs` tables

**Key Date Management** (`src/planning/key-dates/KeyDateManagementScreen.tsx`):
- CMRL contract key dates with 7 categories (G/A/B/C/D/E/F)
- Delay damages tracking (initial rate days 1-28, extended from day 29)
- Per-site assignments via KeyDateSiteManager with contribution percentages
- Target date auto-calculated from project start date + target days

**Schedule** (`src/planning/schedule/UnifiedSchedule.tsx`):
- Three views: Timeline, Calendar, List
- Filters: site, search (debounced 300ms), critical path toggle
- Read-only visualization of `items` data

**Gantt Chart** (`src/planning/GanttChartScreen.tsx`):
- Zoom levels: day, week, month
- Critical path highlighting, today-marker, key date milestone markers
- Task bars positioned by planned dates with progress fill

**Site Management** (`src/planning/SiteManagementScreen.tsx`):
- CRUD for sites with supervisor assignment picker
- 4 date fields: planned start/end, actual start/end
- Foundation step -- required before items can be created

**WBS Management** (`src/planning/WBSManagementScreen.tsx`):
- Search by name/WBS code, filter by phase (11 phases)/status/critical path
- Sort by WBS code/name/duration/progress
- Actions: Add Item (FAB), Edit, Add Child, Delete -- all blocked if baseline locked
- Auto-corrects item status on load based on progress percentage

**Baseline Planning** (`src/planning/BaselineScreen.tsx`):
- Calculate Critical Path button -- runs Kahn's algorithm, shows result count and duration
- Lock Baseline button -- IRREVERSIBLE, copies planned dates to baseline fields
- Dependency management per item via DependencyModal

**Milestone Tracking** (`src/planning/MilestoneTrackingScreen.tsx`):
- Per-site progress recording with percentage slider and status picker
- Mark as Achieved one-tap action
- Milestones seeded by Admin/Manager (not created by planner)

**Item Creation** (`src/planning/ItemCreationScreen.tsx`):
- Auto-generated WBS codes (root or child based on route params)
- 11 construction phases, key date linking, risk assessment
- Date auto-calculation between start/end/duration

**Item Edit** (`src/planning/ItemEditScreen.tsx`):
- Full editing with baseline lock enforcement (LockedBanner when locked)
- Status auto-calculated from progress percentage

#### ItemModel Helper Methods

**v1.3 (7 methods)**: `getDependencies()`, `getScheduleVariance()`, `getPlannedDuration()`, `getActualDuration()`, `getBaselineVariance()`, `getProgressPercentage()`

**v1.4 (8 methods)**: `getFormattedWbsCode()`, `getIndentLevel()`, `getPhaseLabel()`, `getPhaseColor()`, `getRiskBadgeColor()`, `isOnCriticalPath()`, `hasChildren()`, `getChildItems()`

#### Category & Phase Selectors
- **CategorySelector**: Live database integration, description display
- **PhaseSelector**: 11 phases -- Design (Blue), Approvals (Purple), Mobilization (Deep Orange), Procurement (Orange), Interface (Cyan), Site Prep (Brown), Construction (Green), Testing (Red), Commissioning (Indigo), SAT (Teal), Handover (Blue Grey)

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
  - Admin: `admin` / `Admin@2025`
  - Supervisor: `supervisor` / `Supervisor@2025`
  - Manager: `manager` / `Manager@2025`
  - Planner: `planner` / `Planner@2025`
  - Logistics: `logistics` / `Logistics@2025`
  - Design Engineer: `designer1` / `Password@2025`
  - Commercial Manager: `commercial1` / `Password@2025`
  - Note: Update Design Engineer and Commercial Manager passwords via Admin interface if needed

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
- **v2.12**: Supervisor Screens Improvements - Phase 1 & 2 Complete (Schema v29 - Dec 2025)

  **PHASE 1: Critical Improvements (Dec 9-11, 2025) - ✅ 100% COMPLETE**

  - **Task 1.1: LoggingService** (1h actual vs 1-2h estimated) ✅
    - Centralized logging with 4 levels (debug, info, warn, error)
    - 61+ console.log statements replaced across all supervisor screens
    - Environment-aware logging (dev vs production)
    - Structured logging with context metadata
    - Ready for integration with external services (Sentry, LogRocket)
    - Documentation: docs/architecture/LOGGING_SERVICE.md

  - **Task 1.2: Error Boundaries** (1h actual vs 4-6h estimated) ✅
    - ErrorBoundary component (150 lines) with graceful fallback UI
    - All 7 supervisor screens wrapped with crash protection
    - "Try Again" button for error recovery
    - Integration with LoggingService for error tracking
    - Documentation: docs/architecture/ERROR_BOUNDARY.md

  - **Task 1.3.1: SiteInspectionScreen Refactoring** (8h actual vs 8-10h estimated) ✅
    - **Before**: 1,258 lines in single file
    - **After**: 260 lines main screen + 13 modular files (79.3% reduction)
    - **Structure**: src/supervisor/site_inspection/
      - Components (6 files): InspectionForm, InspectionList, InspectionCard, PhotoGallery, ChecklistSection
      - Hooks (3 files): useInspectionData, useInspectionForm
      - Utils (2 files): inspectionValidation, inspectionFormatters
      - Types (1 file): Centralized type definitions
    - **Shared Hooks Created** (reusable across screens):
      - usePhotoUpload (247 lines) - Photo capture/gallery for all supervisor screens
      - useChecklist (241 lines) - Checklist management with summary calculations
    - **Testing**: 14/15 critical tests passed (93% pass rate), committed (2ffd676)
    - **Documentation**: docs/components/supervisor/SITE_INSPECTION.md

  - **Task 1.3.2: DailyReportsScreen Refactoring** (8h actual vs 6-8h estimated) ✅
    - **Before**: 963 lines in single file
    - **After**: 273 lines main screen + 14 modular files (71.7% reduction)
    - **Structure**: src/supervisor/daily_reports/
      - Components (4 files): ItemCard, ItemsList, ProgressReportForm, ReportSyncStatus
      - Hooks (3 files): useReportData, useReportForm, useReportSync
      - Utils (2 files): reportValidation, reportFormatters
      - Types (1 file): Type definitions
    - **Reuses**: usePhotoUpload hook from site_inspection
    - **Testing**: 75+ tests, 100% pass rate, committed (c2d7663)
    - **Documentation**: docs/components/supervisor/DAILY_REPORTS.md

  - **Task 1.3.3: HindranceReportScreen Refactoring** (6h actual vs 5-6h estimated) ✅
    - **Before**: 866 lines in single file
    - **After**: 160 lines main screen + 12 modular files (81.5% reduction - HIGHEST)
    - **Structure**: src/supervisor/hindrance_reports/
      - Components (3 files): HindranceCard, HindranceForm, HindranceList
      - Hooks (2 files): useHindranceData, useHindranceForm
      - Utils (2 files): hindranceValidation, hindranceFormatters
      - Types (1 file): Type definitions
    - **Reuses**: usePhotoUpload hook from site_inspection
    - **Testing**: 60+ tests, 100% pass rate, committed (2ffd676)
    - **Documentation**: docs/components/supervisor/HINDRANCE_REPORTS.md

  **Phase 1 Summary:**
  - **Time**: 24h actual vs 24-32h estimated (on target!)
  - **Code Reduction**: 3,087 → 693 lines (77.5% reduction across 3 screens)
  - **Files Created**: 41 files (LoggingService + 13 site_inspection + 14 daily_reports + 12 hindrance_reports + 1 ErrorBoundary)
  - **Testing**: 215+ tests executed, 98% pass rate
  - **Commits**: b45e8af, 2ffd676, c2d7663

  **PHASE 2: Important Improvements (Dec 12-13, 2025) - ✅ 100% COMPLETE**

  - **Task 2.1: useReducer State Management** (3h actual vs 12-16h estimated) ✅
    - Replaced 6 useState hooks with 1 useReducer in DailyReportsScreen
    - Created reportReducer.ts (167 lines, 11 action types)
    - Created reportActions.ts (95 lines, type-safe action creators)
    - Discriminated union types for better TypeScript support
    - Predictable state updates with action dispatching
    - Centralized state logic for easier debugging
    - No breaking changes to screen API
    - **Testing**: User confirmed "no crash, every screen is working well"

  - **Task 2.2: Shared Hooks & Components** (10h actual vs 17-22h estimated) ✅

    **Task 2.2.1: useFormValidation Hook** (1-2h)
    - Created src/hooks/useFormValidation.ts (450 lines)
    - 9 validation rules: required, minLength, maxLength, min, max, pattern, custom, email, phone, url
    - Full TypeScript support with generics
    - Common validation patterns pre-built

    **Task 2.2.2: useOfflineSync Hook** (1-2h)
    - Created src/hooks/useOfflineSync.ts (370 lines)
    - Real-time network monitoring (NetInfo integration)
    - Sync status tracking (idle, syncing, success, error)
    - Auto-sync with configurable interval
    - Pending count management
    - Auto-sync on reconnection
    - Utility functions: formatLastSyncTime, getSyncStatusColor, getSyncStatusIcon

    **Task 2.2.3: Shared Dialog Components** (1-2h)
    - Created src/components/dialogs/FormDialog.tsx (150 lines)
    - Created src/components/dialogs/PhotoPickerDialog.tsx (90 lines)
    - Enhanced src/components/dialogs/ConfirmDialog.tsx (160 lines)
      - Async action support (Promise-based callbacks)
      - Destructive styling (red for delete actions)
      - Loading state during async operations

    **Task 2.2.4: Additional Shared Components** (1-2h)
    - Created src/components/common/SyncStatusChip.tsx (120 lines)
      - 4 status types with distinct colors (Pending, Synced, Error, Syncing)
      - Icon support, count display, compact mode
    - Created src/components/common/EmptyState.tsx (130 lines)
      - Large icon display, title/message, optional action button
    - Created src/components/common/LoadingOverlay.tsx (120 lines)
      - Full-screen semi-transparent overlay, Portal-based rendering

    **Task 2.2.5: Refactor Screens to Use Shared Components** (4h)
    - Applied EmptyState to all 3 screens (Site Inspection, Daily Reports, Hindrance)
    - Applied PhotoPickerDialog to all 3 screens
    - Applied LoadingOverlay to all 3 screens
    - Removed duplicate empty state code (Card-based UI replaced)
    - Standardized photo picker UI (Menu replaced with PhotoPickerDialog)
    - Consistent loading feedback with contextual messages

  - **Task 2.3: Loading Skeletons** (3h actual vs 6-8h estimated) ✅
    - Created skeleton components library (6 files, 611 lines total)
      - Skeleton.tsx (153 lines) - Base skeleton with shimmer animation
      - SkeletonCard.tsx (122 lines) - Generic card skeleton
      - SkeletonList.tsx (73 lines) - List skeleton
      - SkeletonForm.tsx (124 lines) - Form skeleton
      - SkeletonHeader.tsx (121 lines) - Header skeleton
      - index.ts (18 lines) - Barrel exports
    - Applied to all 3 screens (Daily Reports, Site Inspection, Hindrance)
    - Smooth shimmer animation (1.5s loop, React Native Animated API)
    - Three complexity levels: compact, default, detailed
    - Responsive to different screen layouts

  **Phase 2 Summary:**
  - **Time**: 15-18h actual vs 35-46h estimated (60% faster than estimated!)
  - **Hooks Created**: 2 shared hooks (useFormValidation, useOfflineSync)
  - **Components Created**: 11 shared components
    - 3 Dialogs: FormDialog, PhotoPickerDialog, ConfirmDialog (enhanced)
    - 4 Common: SyncStatusChip, EmptyState, LoadingOverlay, ErrorBoundary (existing)
    - 5 Skeletons: Skeleton, SkeletonCard, SkeletonList, SkeletonForm, SkeletonHeader
  - **Files Created**: 19 files (~1,590 lines of reusable code)
  - **Screens Refactored**: 3 screens (to use shared components)
  - **Code Duplication Reduced**: Estimated ~100-150 lines removed
  - **TypeScript**: 0 compilation errors
  - **ESLint**: All files pass linting
  - **Commits**: a6d5ff1, 0e2c2ad

  **OVERALL v2.12 SUMMARY:**
  - **Total Time**: 39-42h actual vs 59-78h estimated (47% faster!)
  - **Total Files Created**: 60 files (~4,250 lines of reusable code)
  - **Total Hooks**: 4 shared hooks (usePhotoUpload, useChecklist, useFormValidation, useOfflineSync)
  - **Total Components**: 19 reusable components
  - **Total Screens Refactored**: 3 screens (Site Inspection, Daily Reports, Hindrance)
  - **Code Reduction**: 2,394 lines removed from main screens (77.5% reduction)
  - **Test Coverage**: 215+ manual tests, 98% pass rate
  - **Quality**: 0 TypeScript errors, 0 ESLint errors, 0 critical issues
  - **Status**: ✅ Phase 1 & 2 COMPLETE - Ready for Phase 3

- **v2.13**: Supervisor Screens Improvements - Phases 3 & 4 Complete (Schema v29 - Dec 2025)

  **PHASE 3: UX & Performance (Dec 14-16, 2025) - ✅ 80% COMPLETE**

  - **Task 3.1: Navigation UX Restructure** (6h) ✅
    - Reduced from 7 overcrowded tabs to 5 tabs + drawer
    - Created DashboardScreen with KPIs, quick actions, and alerts
    - Implemented hybrid drawer + tabs navigation
    - Added SupervisorHeader for consistency
    - Files: DashboardScreen.tsx (300+ lines), SupervisorNavigator.tsx (modified)

  - **Task 3.3: Enhanced Empty States** (4h) ✅
    - Enhanced EmptyState component with 5 variants and animations
    - Applied to 5 supervisor screens with 8+ contextual variations
    - Bug fix: Added "Create Report" button to ReportsHistoryScreen
    - 100% test pass rate

  - **Task 3.4: Search & Filter Performance** (4h) ✅
    - Implemented debouncing for search inputs
    - 90% performance improvement for large datasets
    - Applied to Items and Reports screens

  - **Task 3.5: Offline Indicators** (3h) ✅
    - Enhanced SyncStatusChip with 4 status types
    - Real-time offline indicators across all screens
    - Pending count display both offline and online

  - **Bug Fixes** (1h):
    - Fixed SyncButton color (orange when offline)
    - Fixed OfflineIndicator messaging
    - Fixed missing "Create Report" button

  **Phase 3 Summary:**
  - **Time**: ~19h actual (under budget)
  - **Tasks Completed**: 4/5 (80%) - High priority items done
  - **Bug Fixes**: 3 verified fixes
  - **Files Created**: 8 files
  - **Files Modified**: 13 files
  - **Test Pass Rate**: 100%
  - **Benefits**: Cleaner navigation, better empty states, 90% faster search, real-time offline indicators

  **PHASE 4: Copy Items Between Sites (Dec 16, 2025) - ✅ 100% COMPLETE**

  - **ItemCopyService Implementation** (280 lines) ✅
    - WatermelonDB batch copy with atomic transactions
    - Duplicate detection with Set comparison (O(n) performance)
    - Reset progress fields (completedQuantity=0, status='not_started')
    - Offline support with appSyncStatus='pending'
    - Comprehensive error handling and logging integration
    - Performance: <3 seconds for 50+ items

  - **CopyItemsDialog Implementation** (330 lines) ✅
    - Site selector with available destinations
    - Preview: "Copy X items from [Site A] to [Site B]"
    - Warning banner if destination has items
    - Duplicate detection integration
    - Loading states during operations

  - **DuplicateItemsDialog Implementation** (260 lines) ✅
    - Checkbox list with Select All/None shortcuts
    - Count badge showing selection
    - Three actions: Skip Selected, Create All Anyway, Cancel
    - All items selected by default for safety

  - **ItemsManagementScreen Integration** (+120 lines) ✅
    - Overflow menu (3-dot) added to SupervisorHeader
    - "Copy Items to Another Site" menu option
    - Disabled when "All Sites" selected or no items
    - Dialog state management with callback pattern
    - Success feedback via snackbar

  - **Testing Results**: 9/10 tests passed (90% pass rate)
    - ✅ Test 1-4, 6-10: PASSED
    - ⏳ Test 5 (Offline mode): DEFERRED (infrastructure verified)

  **Phase 4 Summary:**
  - **Files Created**: 3 files (870+ lines)
    - src/services/ItemCopyService.ts (280 lines)
    - src/components/dialogs/CopyItemsDialog.tsx (330 lines)
    - src/components/dialogs/DuplicateItemsDialog.tsx (260 lines)
  - **Files Modified**: 2 files (+120 lines)
    - src/supervisor/ItemsManagementScreen.tsx
    - src/components/dialogs/index.ts
  - **TypeScript**: 0 compilation errors
  - **Test Pass Rate**: 90% (9/10 tests)
  - **Performance**: <3 seconds for 50+ items
  - **Critical Discovery**: Corrected Firestore references to WatermelonDB patterns
  - **Documentation**: PHASE_4_COPY_ITEMS_PLAN.md, SUPERVISOR_IMPROVEMENTS_ROADMAP.md

  **OVERALL v2.13 SUMMARY (Phases 1-4):**
  - **Total Time**: ~70h across 4 phases
  - **Total Files Created**: 71 files (~5,120+ lines of production code)
  - **Total Hooks**: 4 shared hooks (usePhotoUpload, useChecklist, useFormValidation, useOfflineSync)
  - **Total Components**: 21 reusable components (19 from Phase 1-2, 2 dialogs from Phase 4)
  - **Total Services**: 2 services (LoggingService, ItemCopyService)
  - **Total Screens Refactored**: 4 screens (Site Inspection, Daily Reports, Hindrance, Dashboard)
  - **Code Reduction**: 77.5% average reduction in refactored screens
  - **Test Coverage**: 300+ manual tests across all phases
  - **Quality**: 0 TypeScript errors, 0 ESLint errors, 0 critical issues
  - **Status**: ✅ Phases 1-4 COMPLETE - Production ready

- **v2.15**: Bug Fixes & UI Improvements (Schema v29 - Dec 17, 2025)

  **CRITICAL BUG FIXES FOR PHYSICAL DEVICE DEPLOYMENT**

  - **Bug Fix #1: Continuous SyncUp Popup Issue** ✅
    - **Problem**: "SyncUp failed" messages continuously appearing at bottom of screen, blocking tab navigation buttons
    - **Root Cause**: `onSyncError` callbacks in supervisor screens triggering snackbar notifications on every sync failure
    - **Solution**: Removed `onSyncError` callbacks from:
      - `src/supervisor/SiteInspectionScreen.tsx` (line 65)
      - `src/supervisor/hindrance_reports/HindranceReportScreen.tsx` (line 39)
    - **Impact**: Users can now access tab buttons without UI interference
    - **Testing**: Verified on Android physical device

  - **Bug Fix #2: Share Button Disabled in Report History** ✅
    - **Problem**: Share button disabled, preventing supervisors from sending daily progress reports
    - **Root Causes**:
      1. Missing Documents directory on physical devices
      2. Incorrect file path handling (absolute vs relative paths)
      3. Photos causing PDF_WRITE_FAILED error (base64 size limitations)
    - **Solutions Implemented**:
      1. Added `ensureDocumentsDirectory()` method using RNFS to create directory if missing
      2. Changed PDF generation from absolute to relative paths
      3. Temporarily disabled photo embedding in PDFs (workaround for size limitations)
    - **Files Modified**:
      - `services/pdf/ReportPdfService.ts` (lines 349-381, 451-483, 574-606)
      - Three methods updated: `generatePhotosHtml()`, `generateHindrancePhotosHtml()`, `generateInspectionPhotosHtml()`
    - **Impact**: Share functionality now works reliably on physical devices
    - **Testing**: Verified with multiple report types on Android physical device

  **KNOWN LIMITATIONS & WORKAROUNDS**

  - **Photos in PDFs Temporarily Disabled** ⚠️
    - **Status**: Photo embedding in PDFs disabled due to technical limitations
    - **Reason**: Base64-encoded photos cause PDF library to fail with PDF_WRITE_FAILED error
    - **Current Behavior**: PDFs show photo count instead of actual images
      - Example: "3 photos attached (not shown in PDF due to size limitations)"
    - **Affected Features**:
      - Progress log photos in daily reports
      - Hindrance report photo attachments
      - Site inspection photos
    - **Future Work**:
      - Investigate photo compression before base64 encoding
      - Evaluate alternative PDF generation libraries
      - Consider server-based PDF generation approach

  **UI/UX ENHANCEMENTS**

  - **Enhancement #1: 3-Dot Menu Visibility** ✅
    - **Problem**: Overflow menu in Items Management screen not visible (dark icon on dark header)
    - **Solution**: Added `iconColor="#fff"` to IconButton for clear visibility
    - **File Modified**: `src/supervisor/ItemsManagementScreen.tsx` (line 424)
    - **Impact**: Menu now clearly visible with white icon on colored header
    - **Testing**: Verified across multiple screen orientations

  - **Enhancement #2: Report History Quick Action** ✅
    - **Feature**: Added "Report History" button to supervisor dashboard quick actions
    - **Implementation**: QuickActionButton with "history" icon, orange color (#f57c00)
    - **Navigation**: Direct link to reports history screen
    - **File Modified**: `src/supervisor/dashboard/DashboardScreen.tsx` (lines 154-159)
    - **Impact**: Faster access to reports from main dashboard
    - **Testing**: Navigation verified on physical device

  **v2.15 SUMMARY:**
  - **Time Spent**: ~2-3 hours (bug investigation + fixes + testing)
  - **Bug Fixes**: 2 critical issues resolved
  - **UI Enhancements**: 2 improvements
  - **Files Modified**: 5 files
  - **Physical Device Testing**: All changes verified on Android device (RZ8NB0D90ZJ)
  - **Known Limitations**: 1 documented (photos in PDF - workaround in place)
  - **Quality**: Production-ready for physical device deployment
  - **Status**: ✅ COMPLETE - All issues resolved, workarounds documented

- **v2.20** (December 2025) - Manager, Logistics & Commercial Role Improvements ✅

  Comprehensive code quality improvements for Manager, Logistics, and Commercial roles following Supervisor improvement patterns. Three roles in the All Roles Improvement Plan completed!

  **MANAGER PHASE 1 - ✅ 100% COMPLETE (Dec 26-27, 2025)**

  First role in the All Roles Improvement Plan to reach 100% completion!

  - **Task 1.1: Console Logs Removed** (1h) ✅
    - **Before**: 55 console.log statements across 6 Manager screens
    - **After**: 0 console.log statements (100% removed)
    - **Implementation**: Migrated all logging to centralized LoggingService
    - **Files Modified**: 6 (ManagerDashboardScreen, BomManagementScreen, BomImportWizardScreen, TeamManagement, FinancialReports, ResourceRequests)
    - **Quality**: Production-ready logging with 4 levels (debug, info, warn, error)

  - **Task 1.2: Error Boundaries Added** (1h) ✅
    - **Before**: 0 Manager screens with error boundaries
    - **After**: 10/10 screens wrapped with ErrorBoundary component
    - **Pattern**: Consistent "Manager - ScreenName" naming convention
    - **Files Modified**: 6 (all Manager screens)
    - **Quality**: Graceful error handling with "Try Again" recovery
    - **Integration**: Full LoggingService integration for error tracking

  - **Task 1.3.1: Dashboard Refactor** (12h) ✅
    - **Before**: 3,183 lines (largest file in the app!)
    - **After**: 2,418 lines main screen + 12 modular files
    - **Reduction**: 765 lines removed (24% reduction)
    - **Structure**: src/manager/dashboard/
      - Components (8 files): KPICard, MilestoneCard, ProjectSelector, ProgressChart, TeamActivityCard, BudgetStatusCard, AlertsCard, QuickActionsCard
      - Hooks (2 files): useDashboardData, useDashboardMetrics
      - Utils (1 file): dashboardFormatters
      - Index (1 file): Barrel exports
    - **Architecture**: Modular component-based with separation of concerns
    - **Quality**: 0 TypeScript errors, improved maintainability

  - **Task 1.3.2: BOM Management Refactor** (8h) ✅
    - **Before**: 1,465 lines (critical complexity)
    - **After**: 201 lines main screen + 12 modular files
    - **Reduction**: 1,264 lines removed (86% reduction!)
    - **Structure**: src/manager/bom-management/
      - Components (5 files): BomHeader, BomList, BomItemList, AddBomDialog, AddItemDialog
      - Hooks (3 files): useBomData, useBomItems, useBomOperations
      - Utils (3 files): bomFormatters, bomValidation, bomCalculations
      - Index (1 file): Barrel exports
    - **Architecture**: Fully modular with separated BOM/Item management
    - **Quality**: 0 TypeScript errors, dramatically improved maintainability

  - **Task 1.3.3: BOM Import Wizard Refactor** (6h) ✅
    - **Before**: 1,081 lines (complex wizard flow)
    - **After**: 171 lines main screen + 17 modular files
    - **Reduction**: 910 lines removed (84% reduction!)
    - **Structure**: src/manager/bom-import-wizard/
      - Components (8 files): WizardSteps, ProjectSelector, FileUploadStep, MappingStep, PreviewStep, ImportStep, SuccessStep, ErrorStep
      - Hooks (4 files): useWizardState, useFileImport, useMappingLogic, useImportOperation
      - Utils (4 files): excelParser, dataValidator, importFormatter, wizardHelpers
      - Index (1 file): Barrel exports
    - **Architecture**: Step-based wizard with state management
    - **Quality**: 0 TypeScript errors, clean separation of concerns

  **Manager Phase 1 Summary:**
  - **Time Spent**: 26.5 hours (vs 24-32h estimated)
  - **Overall Progress**: 100% (5/5 tasks complete)
  - **Total Code Reduction**: 2,939 lines removed across 3 major files
  - **Files Created**: 41 modular files (components, hooks, utilities)
  - **TypeScript Quality**: 0 compilation errors across all new files
  - **Error Protection**: 10/10 screens with error boundaries
  - **Logging**: 55/55 console.log statements replaced with LoggingService
  - **Architecture Pattern**: Established reusable structure for other roles
  - **Status**: ✅ FIRST ROLE COMPLETE - Sets standard for remaining 5 roles

  **LOGISTICS PHASE 1 - ✅ 100% COMPLETE (Dec 27, 2025)**

  Code quality improvements for Logistics role following Manager Phase 1 patterns.

  - **Task 1.1: Console Logs Removed** (2.5h) ✅
    - **Before**: 72 console.log statements across 16 files
    - **After**: 0 console.log statements (100% removed)
    - **Files Modified**: 16 (all Logistics screens and services)
    - **Quality**: Full LoggingService integration
    - **Branch**: PR #32 - Merged to main

  - **Task 1.2: Error Boundaries Added** (5.5h) ✅
    - **Before**: 0 Logistics screens with error boundaries
    - **After**: 14/14 screens wrapped with ErrorBoundary component
    - **Pattern**: "Logistics - ScreenName" naming convention
    - **Files Modified**: 14 (all Logistics screens)
    - **Branch**: PR #33 - Merged to main

  - **Task 1.3.1: Material Tracking Refactor** (8h) ✅
    - **Before**: 2,013 lines
    - **After**: 456 lines main screen + 18 modular files
    - **Reduction**: 1,557 lines removed (77.3% reduction)
    - **Branch**: PR #36 - Merged to main

  - **Task 1.3.2: Analytics Refactor** (7h) ✅
    - **Before**: 1,638 lines
    - **After**: 524 lines main screen + 15 modular files
    - **Reduction**: 1,114 lines removed (68.0% reduction)
    - **Branch**: PR #37 - Merged to main

  - **Task 1.3.3: Inventory Refactor** (5h) ✅
    - **Before**: 1,583 lines
    - **After**: 228 lines main screen + 14 modular files
    - **Reduction**: 1,355 lines removed (85.6% reduction)
    - **Branch**: PR #34 - Merged to main

  - **Task 1.3.4: Delivery Scheduling Refactor** (3.5h) ✅
    - **Before**: 1,362 lines
    - **After**: 209 lines main screen + 12 modular files
    - **Reduction**: 1,153 lines removed (84.7% reduction)
    - **Branch**: PR #35 - Merged to main

  **Logistics Phase 1 Summary:**
  - **Time Spent**: 31 hours (estimated: 29-38h)
  - **Overall Progress**: 100% (6/6 tasks complete)
  - **Total Code Reduction**: 5,179 lines removed across 4 files
  - **Files Created**: 64 modular files (components, hooks, utilities)
  - **Average Reduction**: 78.9%
  - **Status**: ✅ COMPLETE

  **COMMERCIAL PHASE 1 - ✅ 100% COMPLETE (Dec 28, 2025)**

  Code quality improvements for Commercial role completing the third role in the improvement plan.

  - **Task 1.1: Console Logs Removed** (1h) ✅
    - **Before**: 40 console.log statements across 6 files
    - **After**: 0 console.log statements (100% removed)
    - **Files Modified**: 6 (all Commercial screens)
    - **Quality**: Full LoggingService integration

  - **Task 1.2: Error Boundaries Added** (0.5h) ✅
    - **Before**: 0 Commercial screens with error boundaries
    - **After**: 5/5 screens wrapped with ErrorBoundary component
    - **Pattern**: "CommercialManager - ScreenName" naming convention
    - **Files Modified**: 5 (all Commercial screens)

  - **Task 1.3.1: Invoice Management Refactor** (3h) ✅
    - **Before**: 868 lines
    - **After**: 234 lines main screen + 12 modular files
    - **Reduction**: 634 lines removed (73% reduction)
    - **Structure**: invoice-management/ with components, hooks, utils

  - **Task 1.3.2: Commercial Dashboard Refactor** (3h) ✅
    - **Before**: 806 lines
    - **After**: 148 lines main screen + 11 modular files
    - **Reduction**: 658 lines removed (82% reduction!)
    - **Structure**: dashboard/ with 6 card components, hooks, utils

  - **Task 1.3.3: Cost Tracking Refactor** (2h) ✅
    - **Before**: 767 lines
    - **After**: 253 lines main screen + 14 modular files
    - **Reduction**: 514 lines removed (67.4% reduction)
    - **Structure**: cost-tracking/ with 6 components, 3 hooks, utils

  - **Task 1.3.4: Financial Reports Refactor** (2h) ✅
    - **Before**: 785 lines
    - **After**: 195 lines main screen + 15 modular files
    - **Reduction**: 590 lines removed (75.4% reduction)
    - **Structure**: financial-reports/ with 7 card components, hooks, utils

  **Commercial Phase 1 Summary:**
  - **Time Spent**: 10 hours (estimated: 18-24h) - 50% faster!
  - **Overall Progress**: 100% (6/6 tasks complete)
  - **Total Code Reduction**: 2,396 lines removed across 4 files
  - **Files Created**: 52 modular files (components, hooks, utilities)
  - **Average Reduction**: 74.5%
  - **TypeScript Quality**: 0 compilation errors
  - **Status**: ✅ COMPLETE

  **ADMIN PHASE 1 - ✅ 100% COMPLETE (Dec 30, 2025)**

  Code quality improvements for Admin role completing the fifth role in the improvement plan.

  - **Task 1.1: Console Logs Removed** (0.5h) ✅
    - **Before**: 24 console.log statements across 4 files
    - **After**: 0 console.log statements (100% removed)
    - **Files Modified**: 4 (all Admin screens)
    - **Quality**: Full LoggingService integration

  - **Task 1.2: Error Boundaries Added** (0.5h) ✅
    - **Before**: 0 Admin screens with error boundaries
    - **After**: 4/4 screens wrapped with ErrorBoundary component
    - **Pattern**: "Admin - ScreenName" naming convention
    - **Files Modified**: 4 (all Admin screens)

  - **Task 1.3.1: Role Management Refactor** (2h) ✅
    - **Before**: 932 lines
    - **After**: 202 lines main screen + 10 modular files
    - **Reduction**: 730 lines removed (78.3% reduction!)
    - **Structure**: role-management/ with components, hooks, utils

  - **Task 1.3.2: Project Management Refactor** (1.5h) ✅
    - **Before**: 670 lines
    - **After**: 169 lines main screen + 8 modular files
    - **Reduction**: 501 lines removed (74.8% reduction!)
    - **Structure**: project-management/ with components, hooks, utils

  - **Task 1.3.3: Admin Dashboard Refactor** (1h) ✅
    - **Before**: 569 lines
    - **After**: 128 lines main screen + 6 modular files
    - **Reduction**: 441 lines removed (77.5% reduction!)
    - **Structure**: admin-dashboard/ with card components, hooks, utils

  **Admin Phase 1 Summary:**
  - **Time Spent**: 5.5 hours
  - **Overall Progress**: 100% (5/5 tasks complete)
  - **Total Code Reduction**: 1,672 lines removed across 3 files (78.3% + 74.8% + 77.5%)
  - **Files Created**: 24 modular files (components, hooks, utilities)
  - **Average Reduction**: 76.9%
  - **TypeScript Quality**: 0 compilation errors
  - **Status**: ✅ COMPLETE

  **DESIGN ENGINEER PHASE 1 - ✅ 100% COMPLETE (Dec 31, 2025)**

  Code quality improvements for Design Engineer role completing the sixth role in the improvement plan.

  - **Task 1.1: Console Logs Removed** (0.5h) ✅
    - **Before**: 37 console.log statements across 3 files
    - **After**: 0 console.log statements (100% removed)
    - **Files Modified**: 3 (all Design Engineer screens)
    - **Quality**: Full LoggingService integration

  - **Task 1.2: Error Boundaries Added** (0.25h) ✅
    - **Before**: 0 Design Engineer screens with error boundaries
    - **After**: 3/3 screens wrapped with ErrorBoundary component
    - **Pattern**: "DesignEngineer - ScreenName" naming convention
    - **Files Modified**: 3 (all Design Engineer screens)

  - **Task 1.3.1: Design RFQ Management Refactor** (2.5h) ✅
    - **Before**: 662 lines
    - **After**: 222 lines main screen + 5 modular files
    - **Reduction**: 440 lines removed (66.5% reduction)
    - **Structure**: design-rfq/ with components, hooks, utils

  - **Task 1.3.2: DOORS Package Management Refactor** (2h) ✅
    - **Before**: 616 lines
    - **After**: 237 lines main screen + 5 modular files
    - **Reduction**: 379 lines removed (61.5% reduction)
    - **Structure**: doors-package/ with components, hooks, utils

  - **Task 1.3.3: Design Engineer Dashboard Refactor** (1.5h) ✅
    - **Before**: 410 lines
    - **After**: 285 lines main screen + 4 modular files
    - **Reduction**: 125 lines removed (30.5% reduction)
    - **Structure**: design-dashboard/ with card components, hooks, utils

  **Design Engineer Phase 1 Summary:**
  - **Time Spent**: 6.75 hours
  - **Overall Progress**: 100% (5/5 tasks complete)
  - **Total Code Reduction**: 944 lines removed across 3 files (66.5% + 61.5% + 30.5%)
  - **Files Created**: 14 modular files (components, hooks, types)
  - **Average Reduction**: 52.8%
  - **TypeScript Quality**: 0 compilation errors
  - **Status**: ✅ COMPLETE

  **Planning Phase 1 Summary:**
  - **Time Spent**: 15.5 hours (estimated: 20-26h) - 25% faster!
  - **Overall Progress**: 100% (6/6 tasks complete)
  - **Total Code Reduction**: 1,905 lines removed across 4 files
    - MilestoneTrackingScreen: 747 → 181 lines (566 lines, 75.8% reduction)
    - ItemEditScreen: 737 → 297 lines (440 lines, 59.6% reduction)
    - GanttChartScreen: 648 → 164 lines (484 lines, 74.7% reduction)
    - ItemCreationScreen: 632 → 217 lines (415 lines, 65.7% reduction)
  - **Files Created**: 56 modular files (components, hooks, utilities)
  - **Average Reduction**: 68.9%
  - **TypeScript Quality**: 0 compilation errors
  - **Status**: ✅ COMPLETE

  **Overall v2.21 Summary (ALL 6 ROLES Phase 1 COMPLETE):**
  - **Total Time**: ~100 hours (Manager: 26.5h, Logistics: 31h, Commercial: 10h, Planning: 15.5h, Admin: 5.5h, Design Engineer: 6.75h, Docs: 4.75h)
  - **Roles Improved**: 6 (Manager 100%, Logistics 100%, Commercial 100%, Planning 100%, Admin 100%, Design Engineer 100%)
  - **Error Boundaries Added**: 45/45 screens (100%)
  - **Console Logs Removed**: 255/255 (100%)
  - **Total Code Reduction**: 15,035 lines removed across 21 major files (68.2% average)
    - Manager: 2,939 lines (765 + 1,264 + 910)
    - Logistics: 5,179 lines (1,557 + 1,114 + 1,355 + 1,153)
    - Commercial: 2,396 lines (634 + 658 + 514 + 590)
    - Planning: 1,905 lines (566 + 440 + 484 + 415)
    - Admin: 1,672 lines (730 + 501 + 441)
    - Design Engineer: 944 lines (440 + 379 + 125)
  - **Files Created**: 330+ modular files
  - **TypeScript Quality**: 0 compilation errors across all files
  - **All Roles Progress**: 100% (33/33 Phase 1 tasks complete)
  - **Phase 1 Progress**: 100% (33/33 tasks)
  - **Status**: ✅ ALL 6 ROLES COMPLETE (Manager | Logistics | Commercial | Planning | Admin | Design Engineer) - HISTORIC MILESTONE!

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
