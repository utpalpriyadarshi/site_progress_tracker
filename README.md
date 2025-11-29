# Construction Site Progress Tracker

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli). It's designed specifically for tracking progress on construction sites with offline-first capabilities using WatermelonDB.

## Project Overview

The Construction Site Progress Tracker is a mobile application that helps construction teams manage projects, track progress, monitor materials, and document issues across multiple construction sites. The app features offline-first architecture with robust data synchronization capabilities.

### Key Features
- **Offline-First**: Works seamlessly without internet connectivity
- **Construction-Specific**: Tailored for construction site management workflows
- **Role-Based Access**: Different interfaces for supervisors, managers, planners, logistics, and admin
- **Modern UX** (v2.0 - NEW): Custom Snackbar/Dialog system with color-coded, non-blocking notifications
- **Admin Role** (v1.2): Complete administration panel with:
  - User management (CRUD operations)
  - Role assignment
  - Project management with cascade deletion
  - Role switching to test different user experiences
  - Active/inactive user account management
- **Planning Module** (v1.3-v1.6 - COMPLETE): Advanced project planning with 6 specialized tabs:
  - **Tab 1: WBS Management** (v1.4-v1.6): Hierarchical Work Breakdown Structure
    - Auto-generated WBS codes (1.0.0.0, 1.1.0.0, 1.1.1.0, 1.1.1.1)
    - 4-level hierarchy support with visual indentation
    - Context menu (long-press) with Add Child, Edit, Delete options
    - Child item creation with automatic code generation
    - Phase filtering (11 construction phases)
    - Site selection with persistent state
    - Baseline locking to prevent edits after approval
    - Max level enforcement (Level 4 cannot have children)
  - **Tab 2: Gantt Chart**: Project timeline visualization (placeholder - Phase 2.4 planned)
  - **Tab 3: Schedule Management**: Schedule revisions and updates (stub - Phase 2.6 planned)
  - **Tab 4: Resource Planning**: Manpower, equipment, materials (stub - Phase 4 planned)
  - **Tab 5: Milestone Tracking**: Track key deliverables (stub - Phase 5 planned)
  - **Tab 6: Baseline Planning** (v1.3 - COMPLETE): Critical path and dependency management
    - Critical path calculation using Kahn's algorithm
    - Dependency management with circular dependency detection
    - Baseline locking workflow
    - Visual critical path indicators (red borders)
    - Progress metrics and forecasting
    - Schedule variance tracking
  - **Item Creation Screen** (v1.4-v1.5):
    - Category selector with database integration (6 categories)
    - Phase selector with 11 project phases (color-coded with emojis)
    - Complete form validation with real-time error messages
    - Snackbar notifications (non-blocking)
    - Risk management fields (dependency risk, risk notes)
    - Milestone and critical path toggles
    - Database persistence with WatermelonDB
- **Progress Tracking**: Detailed logging of work progress with photo documentation
- **Daily Reports**: Submit daily progress reports with automatic aggregation and history viewing
- **Hindrance Management**: Report and track construction issues/obstacles with photo capture (camera/gallery)
- **Reports History**: View, filter, and search submitted daily reports with detailed breakdowns
- **Material Management**: Monitor materials required, available, and used
- **Logistics Role** (v2.4 - COMPLETE): Comprehensive material and procurement management
  - **Material Tracking**: BOM-integrated material tracking with real-time inventory
  - **DOORS Requirements**: Equipment specification tracking with compliance monitoring
  - **RFQ Management**: Complete procurement workflow with vendor management
  - **BOM-DOORS Integration**: Automated linking with one-tap navigation
- **Site Context**: Persistent site selection across all supervisor screens
- **Photo Documentation**: Camera and gallery integration for progress logs and hindrance reports
- **Site Inspection**: Comprehensive safety and quality checklists with photo documentation
- **Automated Testing** (v1.3 - NEW): 35 tests with Jest covering critical functionality

## Recent Updates

### v2.10 (November 2025) - Manager Role Implementation 🎯

**Phase 1: Database & Context Setup** ✅ (November 22, 2025)
- ✅ **Manager Dashboard Context**: Centralized state management for manager workflows
- ✅ **Milestone Management**: 7 standard project milestones (PM100-PM700)
  - Requirements Management (DOORS)
  - Engineering & Design
  - Procurement
  - Manufacturing
  - Testing & Pre-commissioning
  - Commissioning
  - Handover
- ✅ **Milestone Progress Tracking**: Site-level progress tracking per milestone
- ✅ **Database Schema v29**: Added milestones and milestone_progress tables
- ✅ **Test Utility**: Phase 1 testing utility for milestone operations
- 📚 **Documentation**: Complete specification and testing guides

**Files Created:**
- models/MilestoneModel.ts - Project milestone definitions
- models/MilestoneProgressModel.ts - Site-specific progress tracking
- src/manager/context/ManagerContext.tsx - Manager state management
- src/utils/Phase1TestUtility.tsx - Milestone testing utility

**Schema Evolution:**
- **v29**: Added milestones table (project_id, milestone_code, milestone_name, sequence_order, weightage, is_active, is_custom)
- **v29**: Added milestone_progress table (project_id, site_id, milestone_id, progress_percentage, status, notes)

---

**Phase 2: Manager Dashboard - Section 1 (Overview & KPIs)** ✅ (November 23, 2025)
- ✅ **Manager Dashboard**: Comprehensive project overview with 8 KPI cards
- ✅ **Hybrid Progress Calculation**: 60% items + 40% milestones weighted progress
- ✅ **Project Header**: Timeline, client info, and health status indicators
- ✅ **KPI Cards** (4x2 Grid):
  1. Sites Status (on schedule vs delayed with 5% tolerance)
  2. Budget Utilization (total PO value / project budget)
  3. Open Issues (hindrance count)
  4. Critical Path Items at Risk (high/medium dependency risk)
  5. Deliveries (PO status tracking - placeholder)
  6. Upcoming Milestones (next 30 days - placeholder)
  7-8. Pending Approvals & Team Efficiency (placeholders)
- ✅ **Pull-to-Refresh**: Real-time data updates
- ✅ **Color-Coded Indicators**: Visual status representation
- ✅ **Test Data Utility**: Manager test data generator

**Files Created:**
- src/manager/ManagerDashboardScreen.tsx (550+ lines) - Main dashboard with KPI calculations
- src/utils/ManagerTestDataUtility.tsx (850+ lines) - Test data generator

**Files Modified:**
- src/nav/ManagerNavigator.tsx - Updated to use ManagerDashboardScreen
- src/nav/AdminNavigator.tsx - Added test data utility tab

**Technical Highlights:**
- Hybrid progress formula: `(items_progress × 0.6) + (milestones_progress × 0.4)`
- Site schedule calculation: Compares actual vs expected progress with tolerance
- Database query pattern: Project → Sites → Items/Hindrances (respecting schema hierarchy)
- Real-time calculations with WatermelonDB observables
- Material Design UI with responsive grid layout

**Next Phase:** Dashboard Section 2 - Engineering Progress (Items & Milestones tracking)

---

**Phase 3: Manager Dashboard - Section 2 (Engineering Progress)** ✅ (November 24, 2025)
- ✅ **Engineering Overview (PM200)**: Design completion percentage and status tracking
- ✅ **DOORS Packages Summary**: Total packages with status breakdown
  - Approved packages count
  - Packages under review
  - Open issues count
  - Requirements compliance percentage with visual progress bar
- ✅ **RFQ Status Tracking**: Procurement workflow monitoring
  - Total RFQs issued
  - Quotes received count
  - RFQs under evaluation
  - Awarded RFQs count
- ✅ **Real-time Calculations**: All data pulled from database
- ✅ **Visual Indicators**: Color-coded status chips and progress bars

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+187 lines) - Added Section 2 with 3 subsections

**Technical Implementation:**
- PM200 milestone progress calculation across all sites
- DOORS packages query with status aggregation
- DOORS requirements compliance percentage
- RFQ status tracking from rfqs table
- Color-coded status chips (green/blue/gray)
- Progress bar for compliance visualization

**Next Phase:** Dashboard Section 3 - Site Progress (All Sites Comparison)

---

**Phase 4: Manager Dashboard - Section 3 (Site Progress Comparison)** ✅ (November 24, 2025)
- ✅ **Site Summary Cards**: Individual card for each site with comprehensive metrics
  - Site name and supervisor assignment
  - Overall hybrid progress percentage (60% items + 40% milestones)
  - Status indicator chip (ON TRACK / AT RISK / DELAYED)
  - Critical issues count
  - Progress formula breakdown display
- ✅ **Hybrid Progress Calculation**: Per-site weighted calculation
  - Items progress: Σ(item_completion × item_weightage) / Σ(item_weightage)
  - Milestones progress: Σ(milestone_completion × milestone_weightage) / 100
  - Final: (items_progress × 0.6) + (milestones_progress × 0.4)
- ✅ **Status Determination**: Intelligent schedule-based status
  - ON TRACK: Progress ≥ Expected progress - 5%
  - AT RISK: Progress between Expected - 10% and Expected - 5%
  - DELAYED: Progress < Expected - 10%
- ✅ **Visual Progress Bars**: Color-coded by status (green/yellow/red)
- ✅ **Supervisor Information**: Displays assigned supervisor or "Unassigned"
- ✅ **Critical Issues Tracking**: Count of high/critical priority hindrances per site

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+203 lines, now 1,368 lines total)

**Technical Implementation:**
- Added SiteProgressData interface with 8 fields
- loadSitesProgress() function with comprehensive site analysis:
  * Supervisor lookup from users table
  * Weighted items progress calculation
  * Site-specific milestone progress calculation
  * Schedule-based status determination
  * Critical hindrances filtering
- renderSiteProgress() function with card-based layout
- Added 17 new styles for Section 3 components
- Optimized for-loop for processing multiple sites efficiently

**Next Phase:** Dashboard Section 4 - Equipment/Materials Status (PM300-PM400)

---

**Phase 5: Manager Dashboard - Section 4 (Equipment & Materials Status)** ✅ (November 24, 2025)
- ✅ **Procurement Pipeline**: PM300 & PM400 milestone progress tracking
  - Procurement (PM300) progress percentage and status
  - Manufacturing (PM400) progress percentage and status
  - Color-coded status chips (NOT STARTED/IN PROGRESS/COMPLETED)
- ✅ **Purchase Orders Summary**: Comprehensive PO tracking
  - Total PO value with currency formatting
  - Total count of purchase orders
  - Status breakdown with icons:
    * 📝 Draft
    * 📤 Issued
    * ⏳ In Progress
    * 📦 Delivered
    * ✅ Closed
- ✅ **Delivery Schedule**: Time-based delivery monitoring
  - Upcoming deliveries (next 30 days) count
  - Delayed deliveries count with warning indicator
  - Conditional warning message for delayed items
- ✅ **Real-time Calculations**: All data from database
- ✅ **Visual Indicators**: Color-coded values and warning text

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+274 lines, now 1,762 lines total)

**Technical Implementation:**
- Added EquipmentMaterialsData interface with 13 fields
- loadEquipmentMaterialsData() function (148 lines):
  * PM300 milestone progress calculation across sites
  * PM400 milestone progress calculation across sites
  * Purchase orders query and aggregation by status
  * Total PO value summation
  * Upcoming deliveries calculation (next 30 days window)
  * Delayed deliveries detection (past expected date)
- renderEquipmentMaterials() function (122 lines):
  * 3-card layout: Pipeline, POs, Deliveries
  * Dual-column layouts with dividers
  * Conditional warning display for delays
- Added 15 new styles for Section 4 components

**Next Phase:** Dashboard Section 5 - Financial Summary

---

**Phase 5 - Section 5: Manager Dashboard - Financial Summary** ✅ (November 24, 2025)
- ✅ **Budget Overview**: Comprehensive budget tracking
  - Total project budget display
  - Budget allocated (total BOM cost)
  - Budget spent (delivered/closed POs)
  - Budget remaining calculation
  - Budget utilization percentage with progress bar
  - Color-coded utilization (green ≤90%, yellow ≤100%, red >100%)
- ✅ **Profitability Analysis**: Financial performance metrics
  - Contract value display
  - Estimated cost (total BOM cost)
  - Actual cost to date (delivered/closed POs)
  - Projected profit/loss calculation
  - Profit margin percentage
  - Color-coded profitability (green = profit, red = loss)
- ✅ **BOM Summary**: Bill of Materials tracking
  - Total BOMs count
  - Status breakdown: 📝 Draft | ✅ Approved | 🔒 Locked
  - BOM total cost
  - Actual cost comparison
  - Cost variance display with percentage
- ✅ **Real-time Calculations**: All data from BOMs and POs
- ✅ **Visual Indicators**: Color-coded values and progress bars

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+259 lines, now 2,172 lines total)

**Technical Implementation:**
- Added FinancialData interface with 16 fields
- loadFinancialData() function (79 lines):
  * Reads project budget from projectInfo
  * Queries all BOMs for the project
  * Aggregates BOMs by status (draft/approved/locked)
  * Sums total BOM cost
  * Queries all purchase orders
  * Calculates actual cost from delivered/closed POs
  * Computes budget metrics (allocated, spent, remaining, utilization)
  * Calculates profitability (profit/loss, margin)
  * Computes BOM cost variance
- renderFinancialSummary() function (143 lines):
  * 3 Material Design cards
  * Card 1: Budget overview with utilization progress bar
  * Card 2: Profitability with contract value and costs
  * Card 3: BOM summary with status and variance
  * Conditional color coding for all metrics
- Added 25 new styles for Section 5 components

**Next Phase:** Dashboard Section 7 (Handover - PM700)

---

**Phase 5 - Section 6: Manager Dashboard - Testing & Commissioning** ✅ (November 29, 2025)
- ✅ **Pre-commissioning (PM500)**: Testing phase tracking
  - PM500 milestone progress with status chip
  - Items count in pre-commissioning phase
  - Progress percentage with color-coded status
- ✅ **Commissioning (PM600)**: Live systems tracking
  - PM600 milestone progress with status chip
  - Items count in commissioning phase
  - Progress percentage with color-coded status
- ✅ **Testing & Systems Status**: Operational metrics
  - Tests completed vs pending breakdown
  - Systems energized count (⚡)
  - Systems operational count (✅)
- ✅ **Quality Inspections**: Quality control tracking
  - Total inspections count
  - Inspections passed (✅) vs failed (❌)
  - Pass rate percentage with progress bar
  - Color-coded pass rate (green ≥90%, yellow ≥70%, red <70%)
  - Warning for inspections requiring rework
- ✅ **Real-time Calculations**: All data from milestones and inspections
- ✅ **Visual Indicators**: Color-coded status chips and progress bars

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+272 lines, now 2,444 lines total)

**Technical Implementation:**
- Added TestingCommissioningData interface with 13 fields
- loadTestingCommissioningData() function (148 lines):
  * Queries PM500 milestone progress (average across sites)
  * Queries PM600 milestone progress (average across sites)
  * Counts items in pre-commissioning and commissioning phases
  * Queries site inspections data
  * Calculates tests completed/pending from inspection status
  * Counts systems energized/operational from item status
  * Computes pass rate from inspection results
- renderTestingCommissioning() function (154 lines):
  * 3 Material Design cards
  * Card 1: PM500 & PM600 overview with status chips
  * Card 2: Testing and systems status
  * Card 3: Quality inspections with pass rate
  * Conditional color coding for all metrics
- Added 21 new styles for Section 6 components

**Dashboard Progress Summary:**
✅ Section 1: Project Overview & KPIs (Phase 2)
✅ Section 2: Engineering Progress (Phase 3)
✅ Section 3: Site Progress Comparison (Phase 4)
✅ Section 4: Equipment & Materials Status (Phase 5)
✅ Section 5: Financial Summary (Phase 5)
✅ Section 6: Testing & Commissioning (Phase 5)
⏳ Section 7: Handover (PM700) - Next

---

**Phase 5 - Section 7: Manager Dashboard - Handover Status (PM700)** ✅ (November 29, 2025)
- ✅ **PM700 Milestone Overview**: Final handover tracking
  - PM700 milestone progress with status chip
  - Progress percentage with color-coded status
  - Sites handed over count (✅)
  - Sites ready for handover count (🎯)
  - Total sites breakdown
- ✅ **Documentation Status**: Comprehensive documentation tracking
  - Items documented count
  - Items pending documentation
  - Documentation completion percentage with progress bar
  - Color-coded completion (green ≥90%, yellow ≥70%, red <70%)
  - Documentation note: as-built drawings, O&M manuals, test certificates, warranties
- ✅ **Punch List Summary**: Quality closure tracking
  - Total punch items count
  - Punch items closed (✅) vs open (⏳)
  - Critical punch items count (⚠️)
  - Punch list completion percentage with progress bar
  - Color-coded completion (green ≥90%, yellow ≥70%, red <70%)
  - Warning for critical items requiring resolution
- ✅ **Real-time Calculations**: All data from milestones, items, and hindrances
- ✅ **Visual Indicators**: Color-coded status chips and progress bars

**Files Modified:**
- src/manager/ManagerDashboardScreen.tsx (+280 lines, now 2,790 lines total)

**Technical Implementation:**
- Added HandoverData interface with 13 fields
- loadHandoverData() function (135 lines):
  * Queries PM700 milestone progress (average across sites)
  * Calculates sites ready for handover (≥80% progress) and sites handed over (100%)
  * Counts documented items based on item status (completed/handed/closed)
  * Calculates documentation percentage
  * Uses hindrances as simplified punch list items
  * Counts punch items closed, open, and critical
  * Computes punch list completion percentage
- renderHandover() function (166 lines):
  * 3 Material Design cards
  * Card 1: PM700 overview with site status breakdown
  * Card 2: Documentation status with completion percentage
  * Card 3: Punch list with critical items warning
  * Conditional color coding for all metrics
- Added 27 new styles for Section 7 components

**Dashboard Complete Summary:**
✅ Section 1: Project Overview & KPIs (Phase 2) - 8 KPI cards
✅ Section 2: Engineering Progress (Phase 3) - DOORS + RFQ tracking
✅ Section 3: Site Progress Comparison (Phase 4) - Hybrid progress (60% items + 40% milestones)
✅ Section 4: Equipment & Materials Status (Phase 5) - PM300 + PM400 + Purchase orders
✅ Section 5: Financial Summary (Phase 5) - Budget + Profitability + BOM tracking
✅ Section 6: Testing & Commissioning (Phase 5) - PM500 + PM600 + Quality inspections
✅ Section 7: Handover Status (Phase 5) - PM700 + Documentation + Punch list ← COMPLETE!

**🎉 ALL 7 DASHBOARD SECTIONS COMPLETE! 🎉**
- Total file size: 2,790 lines (from 0 lines baseline)
- Total sections: 7 comprehensive PSR dashboard sections
- Manager v2.10 Dashboard: Fully operational

**Next Phase:** BOM Import Wizard Phase 6B (Column Mapping & Validation)

---

**Phase 6A: BOM Import Wizard - Core Infrastructure** ✅ (November 29, 2025)
- ✅ **BomImportWizardScreen**: Complete 5-step wizard UI with stepper
  - Step 1: Upload File (Excel/CSV) - implemented
  - Step 2: Map Columns - placeholder
  - Step 3: Validate Data - placeholder
  - Step 4: Preview & Confirm - placeholder
  - Step 5: Import - placeholder
- ✅ **Stepper Component**: Visual progress indicator
  - 5 steps with completion status
  - Progress bar showing current position
  - Color-coded status (green = completed, blue = active, gray = pending)
- ✅ **File Upload Interface**: Drag-drop zone with file picker
  - Upload container with dashed border
  - File size and format info display
  - Template download button
- ✅ **BomFileParser Utility**: CSV/Excel parsing foundation
  - CSV parsing implemented
  - Excel parsing placeholder (Phase 6B)
  - File type validation (.csv, .xlsx, .xls)
  - File size validation (max 10MB)
  - Auto-detect column mapping
  - Required fields validation
- ✅ **Navigation**: Ready for integration with BOM Management

**Files Created:**
- src/manager/BomImportWizardScreen.tsx (469 lines)
- src/utils/BomFileParser.ts (213 lines)

**Technical Implementation:**
- 5-step wizard state machine
- WizardStep type (1-5)
- ImportData interface for tracking upload state
- ValidationError interface for error handling
- Auto-column mapping algorithm (10 supported fields)
- File format utilities (size formatting, validation)
- Material Design stepper UI with progress tracking

**Quality Checks:**
- ESLint: 0 errors, 0 warnings ✅
- TypeScript: 0 errors ✅

**Next Steps (Phase 6B):**
- File picker integration (react-native-document-picker)
- Excel parsing with xlsx library
- Column mapping interface
- Data validation logic
- Preview and import execution

---

### v2.7 (November 2025) - Progress Photos & PDF Enhancement 📸✅

**Photo Capture in Progress Updates** (November 19, 2025)
- ✅ **Photo Capture**: Camera and gallery integration for daily progress updates
- ✅ **Photo Thumbnails**: Visual indicators on item cards showing photo count
- ✅ **PDF Integration**: Photos automatically embedded in PDF reports
- ✅ **Photo Management**: Add/remove photos before saving progress
- ✅ **Real-time Updates**: Photo counts refresh immediately after save
- 📏 **File Size**: PDF size increases appropriately (148KB → 269KB with photos)
- 🎯 **Phase 1 Complete**: Task 2.1 from Report Generation Plan

**Files Modified:**
- src/supervisor/DailyReportsScreen.tsx - Photo capture UI and state management
- services/pdf/ReportPdfService.ts - Photo rendering in PDF reports
- docs/COMPREHENSIVE_GAP_ANALYSIS_V2.5.md - Updated to v2.7, 74% complete
- docs/REPORT_GENERATION_PLAN.md - Marked Task 2.1 as complete

**Next Phase**: Comprehensive daily reports combining progress + hindrances + inspections

---

### v2.6 (November 2025) - PDF Report Generation & Sharing 📄

**PDF Generation & Sharing** (November 17-18, 2025)
- ✅ **PDF Reports**: Professional daily progress reports with gradient design
- ✅ **PDF Viewer**: Integration for report preview
- ✅ **PDF Sharing**: Share via WhatsApp, Email, Google Drive, etc.
- ✅ **Report History**: View and manage past reports
- 🎯 **Supervisor Workflow**: Complete end-to-end reporting capability

---

### v2.2 (October 2025) - Production Security & Sync System 🚀

#### Week 8 Latest: Queue Management & Auto-Sync Complete ✅ (October 31, 2025)
**Production-Ready Sync System** (Week 8, Days 21-25)
- ✅ **Exponential Backoff Retry**: Prevents transient failures (1s → 60s with jitter)
- ✅ **Dead Letter Queue**: Captures items failing 10+ times for admin review
- ✅ **NetworkMonitor Service**: Real-time network state detection (WiFi/Cellular/Offline)
- ✅ **AutoSyncManager**: 4 auto-sync triggers (launch, network, periodic, foreground)
- ✅ **SyncIndicator UI**: Real-time sync status with network indicator
- ✅ **SyncMonitoringScreen**: Admin dashboard for queue management
- 🔒 **Auth Guard Fix**: Prevent auto-sync before user login (commit 036c523)
- 📊 **Activity 2 Progress**: 83% complete (5 of 6 weeks done)

**New Files (Week 8):**
- services/network/NetworkMonitor.ts (240 lines)
- services/sync/AutoSyncManager.ts (398 lines)
- src/components/SyncIndicator.tsx (200 lines)
- src/admin/SyncMonitoringScreen.tsx (300 lines)

**Updated Files:**
- services/sync/SyncService.ts (+304 lines → 979 lines total)
- App.tsx (initialize NetworkMonitor & AutoSyncManager)

---

#### Activity 1: Security Implementation Complete ✅ (3 weeks)
**Password Security & JWT Authentication** (Schema v13-v17)
- ✅ **Password Hashing**: Migrated all passwords from plaintext to bcrypt (salt rounds: 12)
- ✅ **JWT Authentication**: Access tokens (15min) + Refresh tokens (7 days)
- ✅ **Session Management**: Active session tracking with device info and IP address
- ✅ **Password Reset**: Admin-assisted reset with password history (last 5)
- ✅ **Password Strength**: Enforced validation (8+ chars, uppercase, lowercase, number, special char)
- ✅ **Security Score**: 1/10 → 9/10 (production-ready)
- 🔒 **Zero plaintext passwords** - All credentials securely hashed

**Schema Evolution (Activity 1):**
- **v13**: Added `password_hash` field to users table
- **v14**: Removed plaintext `password` field
- **v15**: Added `sessions` table for session management
- **v16**: Added `password_history` table for password reuse prevention
- **v17**: Added timestamps to sessions and password_history

**Security Features:**
- Bcrypt password hashing with salt rounds: 12
- JWT token-based authentication (access + refresh)
- Session tracking (user_id, device_info, ip_address, created_at, expires_at)
- Password history prevents reuse of last 5 passwords
- Automatic session expiry and cleanup
- Session revocation on password reset
- Admin-assisted password reset workflow

**Files Added:**
- services/auth/TokenService.ts - JWT token generation and validation
- services/auth/SessionService.ts - Session management (create, validate, revoke)
- services/auth/PasswordResetService.ts - Password reset workflow
- services/auth/PasswordMigrationService.ts - One-time plaintext→bcrypt migration
- models/SessionModel.ts - Session tracking model
- models/PasswordHistoryModel.ts - Password reuse prevention
- config/jwt.config.ts - JWT configuration (secrets, expiry)

**Implementation Documentation:**
- docs/implementation/ACTIVITY_1_SECURITY_IMPLEMENTATION.md - Complete Activity 1 planning

---

#### Activity 2: Offline-First Sync System Complete ✅ (5 weeks - Week 8 Done)
**Bidirectional Sync with Conflict Resolution** (Weeks 4-8)
- ✅ **Backend API Complete** (Week 4-5): RESTful API with JWT authentication
- ✅ **Mobile Sync Implementation** (Week 6): Bidirectional sync with SyncService
- ✅ **Conflict Resolution** (Week 7): Last-Write-Wins strategy with version tracking
- ✅ **Dependency-Aware Sync** (Week 7): Kahn's algorithm for topological sorting
- ✅ **Queue Management & Auto-Sync** (Week 8): Exponential backoff, DLQ, auto-sync triggers
- ✅ **Schema Updates**: v18 (sync_status), v19 (sync_queue), v20 (_version)
- ✅ **10 Syncable Models**: Projects, Sites, Categories, Items, Materials, Progress Logs, Hindrances, Daily Reports, Site Inspections, Schedule Revisions
- ✅ **Retry Logic**: Exponential backoff with max 5 retries (1s → 60s)
- ✅ **Dead Letter Queue**: Persistent storage for items failing 10+ times
- ✅ **Network Monitoring**: Real-time network state detection with auto-sync
- ✅ **Auto-Sync Triggers**: 4 triggers (launch, network, periodic, foreground)
- ✅ **Sync UI**: SyncIndicator component and Admin monitoring dashboard
- 📊 **Progress**: 83% complete (5 of 6 weeks done)
- 📚 **Documentation**: Complete implementation docs and test suites

**Technical Highlights:**
- SyncService.ts (979 lines) with retry logic and DLQ
- Version-based conflict detection and resolution
- Topological sort for dependency order (O(V+E) complexity)
- Exponential backoff: min(1000ms × 2^retry, 60000ms) ± jitter
- NetworkMonitor.ts (240 lines) for real-time network monitoring
- AutoSyncManager.ts (398 lines) with 4 auto-sync triggers
- SyncIndicator.tsx (200 lines) for user feedback
- SyncMonitoringScreen.tsx (300 lines) for admin controls
- Comprehensive error handling and logging
- Test suite with 7 scenarios validating Kahn's algorithm

**Sync Architecture:**
The application now features a complete bidirectional synchronization system:

1. **Sync Down (Pull from Server)**
   - Fetch latest changes from backend API
   - Apply changes in dependency order (Kahn's algorithm)
   - Resolve conflicts using Last-Write-Wins strategy
   - Update local database atomically

2. **Sync Up (Push to Server)**
   - Track local changes in sync_queue table
   - Push pending changes to server
   - Retry failed operations with exponential backoff
   - Mark successfully synced items

3. **Conflict Resolution**
   - Version comparison (_version field)
   - Last-Write-Wins (LWW) strategy
   - Timestamp tie-breaker for same versions
   - Automatic merge of non-conflicting changes

4. **Dependency-Aware Sync** (Week 7, Day 4)
   - Topological sort using Kahn's algorithm
   - Ensures dependencies sync before dependents
   - Circular dependency detection
   - O(V+E) time complexity for optimal performance

5. **Exponential Backoff Retry** (Week 8, Days 1-2)
   - Formula: `delay = min(1000ms × 2^retry_count, 60000ms) ± jitter`
   - Max 5 retries before failing: 1s → 2s → 4s → 8s → 16s → 60s (capped)
   - Jitter (±25%) prevents thundering herd problem
   - Graceful degradation during network issues
   - Implemented in `SyncService.retryWithBackoff()` method

6. **Dead Letter Queue (DLQ)** (Week 8, Days 2-3)
   - Items failing 10+ times moved to DLQ
   - Persistent storage in AsyncStorage (`@sync/dead_letter/`)
   - Admin monitoring with error messages
   - Manual retry with reset counter
   - Bulk clear operation
   - Prevents infinite retry loops

7. **Network Monitoring** (Week 8, Day 3)
   - Real-time NetInfo integration
   - Connection type detection (WiFi, Cellular, None)
   - Network change listeners with callback system
   - Auto-sync trigger on offline → online transition
   - 2-second stabilization delay before sync
   - Prevents wasted sync attempts when offline

8. **Auto-Sync Manager** (Week 8, Day 4)
   - **4 Independent Sync Triggers:**
     1. **App Launch**: 2-second delay after login
     2. **Network Change**: On offline → online (via NetworkMonitor)
     3. **Periodic Sync**: Every 5 minutes while app active
     4. **App Foreground**: When app returns from background (1min cooldown)
   - Sync state management (isSyncing, lastSyncAt, lastSyncSuccess, lastSyncError, syncCount)
   - Listener system for real-time status updates
   - Prevents concurrent syncs with lock mechanism

9. **Sync UI Components** (Week 8, Day 5)
   - **SyncIndicator**: Compact status display with network indicator
     - Color-coded: 🟢 Synced, 🟡 Syncing, 🔴 Error, ⚫ Offline
     - Relative time display (just now, 5m ago, 2h ago)
     - Manual sync button
   - **SyncMonitoringScreen** (Admin): Full dashboard
     - Network status card
     - Sync status with last sync time
     - Pending queue count by model
     - Dead letter queue viewer
     - Manual controls (sync, pause, clear)

**Files Added:**
- services/sync/SyncService.ts - Complete bidirectional sync (979 lines with retry & DLQ)
- services/network/NetworkMonitor.ts - Real-time network monitoring (240 lines)
- services/sync/AutoSyncManager.ts - Auto-sync triggers (398 lines)
- src/components/SyncIndicator.tsx - Sync status UI (200 lines)
- src/admin/SyncMonitoringScreen.tsx - Admin monitoring (300 lines)
- models/SyncQueueModel.ts - Queue management model
- models/migrations/v19_add_sync_queue_table.ts - Sync queue table migration
- models/migrations/v20_add_version_field.ts (in index.js) - Version tracking migration
- scripts/testKahnsAlgorithm.js - Algorithm validation with 4 test scenarios

**Schema Evolution:**
- **v18** (Week 6, Day 1): Added sync_status field to 5 core models (projects, sites, categories, items, materials)
- **v19** (Week 6, Day 3): Added sync_queue table for local change tracking (table_name, record_id, action, data, synced_at, retry_count, last_error)
- **v20** (Week 7, Day 1): Added _version field to 10 syncable models for conflict resolution (projects, sites, categories, items, materials, progress_logs, hindrances, daily_reports, site_inspections, schedule_revisions)

**Implementation Documentation:**
- docs/implementation/ACTIVITY_2_KICKOFF.md - Complete Activity 2 planning document
- docs/implementation/WEEK_6_SYNCSERVICE_COMPLETE.md - Mobile sync implementation details
- docs/implementation/WEEK_7_CONFLICT_RESOLUTION.md - Conflict resolution with version tracking
- docs/testing/WEEK_5_API_TEST_REPORT.md - Backend API testing results
- construction-tracker-api/WEEK_4_5_PROGRESS_SUMMARY.md - Backend API implementation

---

#### Activity 4: BOM Management System Complete ✅ (November 2025)
**Bill of Materials (BOM) for Manager Role** (Schema v23-v25)

The Manager role now has a comprehensive BOM Management system for Pre-Contract (Estimating) and Post-Contract (Execution) BOMs with variance tracking.

**Phase 1: Core BOM Management** ✅
- ✅ **Site Categorization**: 7 site types (ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct)
- ✅ **Dual BOM Types**:
  - Pre-Contract (Estimating): Draft → Submitted → Won/Lost
  - Post-Contract (Execution): Baseline → Active → Closed
- ✅ **BOM CRUD Operations**: Create, Read, Update, Delete with immediate UI updates
- ✅ **Item Management**: Auto-generated item codes (MAT-001, LAB-002, EQP-003, SUB-004)
- ✅ **4 Item Categories**: Material, Labor, Equipment, Subcontractor
- ✅ **Cost Calculations**: Automatic quantity × unit cost = total cost
- ✅ **Validation**: Prevents negative quantities and costs
- ✅ **Status Tracking**: Color-coded status chips (🟣 DRAFT, 🔵 SUBMITTED, 🟢 WON, 🔴 LOST, 🟠 BASELINE, etc.)
- ✅ **Tab-Based Interface**: Separate tabs for Estimating vs Execution BOMs
- ✅ **Project Dropdown**: Improved UX with dropdown selector
- ✅ **Removed Fields**: Client field, WBS Code (simplified)

**Phase 2: Copy BOM & Variance Tracking** ✅
- ✅ **Copy to Execution**: One-click copy from Pre-Contract BOM to Post-Contract
- ✅ **Baseline Linking**: Execution BOMs linked to original estimating BOM (`baselineBomId`)
- ✅ **Variance Calculation**: Automatic baseline vs actual cost comparison
- ✅ **Visual Indicators**:
  - 🔴 Red: Cost overrun (positive variance)
  - 🟢 Green: Cost savings (negative variance)
  - ⚫ Gray: No change
- ✅ **Variance Display**: Shows percentage and absolute amount (e.g., +12.2%, +₹25,000)
- ✅ **Side-by-Side Comparison**: Baseline cost vs Actual cost in execution BOMs
- ✅ **Change Tracking**: Links back to original estimating BOM

**Phase 3: Export Functionality** ✅
- ✅ **Export to Excel (.xlsx)**: Full BOM with professional formatting
- ✅ **Two-Sheet Format**:
  - Summary Sheet: BOM metadata, project info, total costs
  - Items Sheet: All line items with columns for item code, description, category, qty, unit, costs, phase
- ✅ **Column Formatting**: Auto-sized columns for readability
- ✅ **File Storage**: Saves to Downloads folder with timestamp
- ✅ **Success Notification**: Shows file path after export
- 🔄 **Import Feature**: Temporarily disabled (compatibility issue with file picker library)

**Schema Evolution (Activity 4):**
- **v23** (Phase 1): Added `quantity` and `unit` fields to boms table
- **v24** (Phase 1): Added `site_category` field to boms table (indexed)
- **v25** (Phase 2): Added `baseline_bom_id` field to boms table for linking execution BOMs to estimating BOMs

**Files Added:**
- src/manager/BomManagementScreen.tsx (1,450+ lines) - Complete BOM management UI
- src/services/BomImportExportService.ts (320 lines) - Excel export functionality
- models/BomModel.ts - BOM data model with 20+ fields
- models/BomItemModel.ts - BOM item model with cost tracking
- docs/testing/Sample_BOM_Import.csv - Sample data for future import testing

**Key Features:**
- **Offline-First**: Full BOM management works offline with WatermelonDB
- **Real-Time Updates**: Immediate UI refresh after create/edit/delete operations
- **Cost Tracking**: Automatic aggregation of item costs to BOM total
- **Variance Analysis**: Track budget vs actual with visual indicators
- **Professional Export**: Excel files ready for sharing with stakeholders
- **Search & Filter**: Filter BOMs by type (Estimating/Execution)
- **Comprehensive Validation**: Prevents invalid data entry
- **Status Workflow**: Clear progression from Draft → Won → Baseline → Active → Closed

**Testing:**
- ✅ Manual testing completed with BOM_Management_Test_Procedure.md
- ✅ All CRUD operations verified
- ✅ Cost calculations accurate
- ✅ Copy to Execution tested
- ✅ Variance tracking validated
- ✅ Export to Excel working
- ✅ Data persistence verified

**Manager Role Enhancements:**
The Manager role is now fully equipped to handle construction project estimation and execution with:
- Complete BOM lifecycle management
- Pre-contract estimation and tendering
- Post-contract execution and budget tracking
- Variance analysis for cost control
- Professional reporting with Excel export

---

#### Activity 4.5: Logistics Role Development Complete ✅ (November 2025)
**BOM-Integrated Material Tracking & Dual-Mode System** (v2.4)

The Logistics role has been enhanced with TypeScript compliance, BOM integration, and a dual-mode system for testing and production.

**Phase 1: TypeScript Compliance & Assessment** ✅
- ✅ **TypeScript Fixes**: Resolved all type errors in main Logistics screens
- ✅ **Interface Updates**: Added missing fields to MaterialRequirement interface (category, subCategory, bomId, bomName)
- ✅ **Model Alignment**: Fixed MaterialModel field access (removed non-existent unitCost references)
- ✅ **Type Safety**: All Logistics screens now fully TypeScript-compliant
- ✅ **Code Review**: Assessed all 5 Logistics tabs for functionality and structure

**Phase 2: Dual-Mode System (Demo/Production)** ✅
- ✅ **AppMode Configuration** (src/config/AppMode.ts):
  - Singleton configuration for app mode switching
  - Auto-detection: Demo mode in `__DEV__`, Production in builds
  - Persistent mode preference (prepared for AsyncStorage)
  - Behavior flags for conditional UI rendering
- ✅ **MaterialTracking Enhancements**:
  - Demo Mode: Shows "Load Sample BOMs" button with Metro Railway mock data
  - Production Mode: Shows instruction to contact PM for BOM creation
  - Mode indicator badge: 🧪 DEMO / 🏗️ PROD (dev builds only)
  - One-click mode toggle during development
- ✅ **Development Tools**:
  - Clear BOMs utility (src/services/ClearBomsService.ts) for reset testing
  - Dev-only controls visible with `__DEV__` flag
  - Enhanced logging for debugging BOM loading
- ✅ **Better Empty State UX**: Context-aware messaging based on app mode

**Phase 3: Screen Review & Polish** ✅
- ✅ **LogisticsDashboardScreen**: Executive overview with KPIs, alerts, recommendations, cost analysis
- ✅ **MaterialTrackingScreen**: BOM-integrated material tracking with dual-mode system (1,000+ lines)
- ✅ **EquipmentManagementScreen**: Equipment tracking, maintenance, allocation, performance (complete)
- ✅ **DeliverySchedulingScreen**: Delivery optimization, tracking, route planning (complete)
- ✅ **InventoryManagementScreen**: Multi-location inventory, ABC analysis, stock transfers (complete)

**Logistics Architecture:**
The Logistics role features a comprehensive 5-tab interface for construction material and equipment management:

1. **Dashboard Tab**
   - Executive KPIs: Materials tracked, procurement cycle time, equipment availability
   - Critical alerts with severity-based color coding
   - Pending actions tracker
   - AI-powered optimization recommendations
   - Performance metrics and cost analysis

2. **Material Tracking Tab** (BOM-Integrated)
   - Load BOMs from Manager role (Post-Contract execution BOMs)
   - Automatic material requirement calculation from BOM items
   - Real-time shortage detection and alerts
   - Intelligent procurement suggestions
   - Material status tracking (sufficient, shortage, critical, surplus)
   - Project-based filtering

3. **Equipment Management Tab**
   - Equipment tracking with status monitoring (active, maintenance, idle, out of service)
   - Preventive maintenance scheduling
   - Equipment allocation and utilization metrics
   - Operator certification management
   - Performance analytics and downtime tracking

4. **Delivery Scheduling Tab**
   - Just-in-time delivery optimization
   - Real-time delivery tracking
   - Route optimization for efficiency
   - Site readiness validation
   - Exception management
   - Performance analytics (on-time delivery rate)

5. **Inventory Management Tab**
   - Multi-location inventory tracking
   - ABC analysis for prioritization
   - Stock transfers between locations
   - Inventory health monitoring
   - EOQ (Economic Order Quantity) recommendations
   - Safety stock calculations

**Key Technical Features:**
- **Context-Based State Management** (LogisticsContext): Shared state across all tabs for performance
- **BOM Integration** (BomLogisticsService): Calculates requirements, priorities, inventory targets from BOMs
- **Mock Data Services**: Complete test data for all modules (Equipment, Delivery, Inventory)
- **TypeScript Strict Mode**: 100% type-safe with comprehensive interfaces
- **Offline-First Ready**: Built on WatermelonDB foundation for future sync
- **Service Layer Architecture**: Dedicated services for Equipment, Delivery, Inventory, Material Procurement

**Files Updated:**
- src/logistics/MaterialTrackingScreen.tsx (+278 lines) - Dual-mode system
- src/logistics/context/LogisticsContext.tsx (fixed) - Removed invalid MaterialModel.unitCost
- src/services/BomLogisticsService.ts (+4 fields) - Enhanced MaterialRequirement interface
- src/config/AppMode.ts (NEW, 146 lines) - App mode configuration
- src/services/ClearBomsService.ts (already existed) - BOM reset utility

**Testing Status:**
- ✅ TypeScript compliance: All main Logistics files error-free
- ✅ AppMode system: Demo/Production toggle working
- ✅ BOM loading: Sample Metro Railway data loads successfully
- ✅ Clear BOMs: Reset utility functional
- 📝 Manual testing pending: Full user flow testing across all 5 tabs

**Logistics Role Summary:**
The Logistics role is production-ready with:
- BOM-integrated material requirement tracking
- Dual-mode system for testing and production use
- 5 comprehensive tabs for complete logistics management
- TypeScript-compliant codebase
- Scalable service architecture for future enhancements

---

#### Activity 4.6: DOORS Requirements Management System Complete ✅ (November 12, 2025)
**Phase 2: Requirements Tracking & BOM Integration** (v2.4)

The Logistics role now includes a comprehensive DOORS (Dynamic Object Oriented Requirements System) for tracking equipment specifications and compliance requirements, seamlessly integrated with the BOM system.

**DOORS Implementation** ✅
- ✅ **DoorsRegisterScreen**: Package listing with filters, search, and KPIs
- ✅ **DoorsDetailScreen**: Detailed requirement view with 3 tabs (Requirements, Compliance, Documents)
- ✅ **Dashboard Integration**: DOORS KPIs displayed in 2x2 grid layout
- ✅ **Models**: DoorsPackageModel (equipment-level), DoorsRequirementModel (requirement-level)
- ✅ **Services**: DoorsStatisticsService, BomDoorsLinkingService (automated keyword matching)

**Key Features:**
- Track 5 requirement categories: Technical, Datasheet, Type Tests, Routine Tests, Site
- Monitor compliance percentages by category with color-coded indicators
- Filter by status: Draft, Under Review, Approved, Closed
- Search requirements by code, text, or specification clause
- View detailed requirement information with acceptance criteria and vendor responses

**BOM-DOORS Integration** ✅
- ✅ **Automated Linking**: Intelligent keyword-based matching of BOM items to DOORS packages
- ✅ **DOORS Section on BOM Cards**: Shows compliance status and package ID
- ✅ **Seamless Navigation**: One-tap navigation from Material Tracking → DOORS Detail
- ✅ **Real-time Compliance**: Visibility of requirements compliance in materials management

**Testing & Quality** ✅
- ✅ **Comprehensive Testing**: 40 test cases created (95% pass rate: 38/40)
- ✅ **Issues Resolved**: 9/11 issues fixed (3 critical, 3 medium, 3 minor)
- ✅ **UX Polish**: Uniform filter styling, clear search buttons, clean card layouts
- ✅ **Documentation**: 12+ comprehensive documents (implementation, testing, user guides)

**Technical Highlights:**
- Fixed height pills/chips for uniform dimensions (no size changes on tap)
- Map-based lookups for O(1) data access performance
- WatermelonDB observables for reactive UI updates
- Proper navigation parameter handling (packageId vs doorsId)
- Automated keyword matching: transformer, circuit breaker, cables, RTU, OHE mast

**Demo Data:**
- 5 DOORS packages across equipment categories (TSS, OHE, SCADA, Cables)
- 293 total requirements with varied compliance states (13-85 per package)
- Realistic technical specifications and test requirements
- Pre-populated acceptance criteria and vendor responses

**Files Created (7):**
- models/DoorsPackageModel.ts
- models/DoorsRequirementModel.ts
- src/logistics/DoorsRegisterScreen.tsx
- src/logistics/DoorsDetailScreen.tsx
- src/services/DoorsStatisticsService.ts
- src/services/BomDoorsLinkingService.ts (189 lines - intelligent keyword matching)
- src/utils/demoData/DoorsSeeder.ts

**Files Modified (8):**
- models/BomItemModel.ts (added doors_id field)
- src/logistics/LogisticsDashboardScreen.tsx (DOORS KPIs section)
- src/logistics/MaterialTrackingScreen.tsx (DOORS integration)
- src/logistics/components/BomRequirementCard.tsx (verified DOORS section)
- models/schema/index.ts (v26 migration)
- models/migrations/index.js (v26 migration)
- Navigation files (DOORS tab integration)

**Phase 3 Complete** ✅ (November 16-17, 2025)

#### Activity 4.7: RFQ Management System & Procurement Workflow (v2.4)
**Days 4-6: Request for Quotation System with Vendor Management** (Schema v28)

The Logistics role now includes a complete RFQ (Request for Quotation) management system integrated with DOORS packages, enabling end-to-end procurement workflow from specification to vendor award.

**RFQ System Features** ✅
- ✅ **RFQ List Screen**: Browse, filter, and search RFQs with status-based organization
- ✅ **RFQ Detail Screen**: Comprehensive 3-tab view (Overview, Quotes, Evaluation)
- ✅ **Vendor Management**: Master data tracking with performance metrics
- ✅ **Quote Evaluation**: Technical and commercial scoring with weighted ranking
- ✅ **Procurement Workflow**: Draft → Issued → Quotes Received → Evaluated → Awarded
- ✅ **DOORS Integration**: Create RFQs directly from DOORS packages
- ✅ **Demo Data**: 5 sample RFQs with 8 vendors and multiple quotes
- ✅ **Comparative Analysis**: Side-by-side quote comparison with rankings

**Database Schema v28:**
- **vendors** table: Vendor master with performance tracking (rating, delivery, orders)
- **rfqs** table: RFQ master records with lifecycle management
- **rfq_vendor_quotes** table: Quote submissions with technical/commercial evaluation

**RFQ Workflow:**
1. **Draft**: Create RFQ from DOORS package (auto-populates technical specs)
2. **Issued**: Send RFQ to selected vendors with closing date
3. **Quotes Received**: Vendors submit quotes with pricing and compliance data
4. **Evaluated**: Technical + commercial scoring with weighted ranking (L1, L2, L3)
5. **Awarded**: Select winning vendor and finalize procurement

**Demo Data & Testing:**
- 5 RFQs across equipment types (Transformer, Circuit Breaker, Mast, RTU, Cable)
- 8 vendors with varied performance profiles
- Multiple quotes per RFQ demonstrating evaluation scenarios
- Automated tests: 14/20 smoke tests passing
- Manual testing: 7/8 scenarios completed

**New Files (Phase 3):**
- models/RfqModel.ts (36 lines) - RFQ master data model
- models/RfqVendorQuoteModel.ts (44 lines) - Quote submissions model
- models/VendorModel.ts (27 lines) - Vendor master model
- src/services/RfqService.ts (495 lines) - Complete RFQ operations
- src/logistics/RfqListScreen.tsx (622 lines) - RFQ list with filtering
- src/logistics/RfqDetailScreen.tsx (835 lines) - RFQ detail with 3 tabs
- src/logistics/RfqCreateScreen.tsx (747 lines) - 4-step RFQ creation wizard
- src/utils/demoData/RfqSeeder.ts (607 lines) - Demo data generator

**Updated Files:**
- models/schema/index.ts (v28 migration with 3 new tables)
- models/migrations/index.js (v28 migration logic)
- src/nav/LogisticsNavigator.tsx (added RFQ screens)
- models/database.ts (registered new models)

**Documentation:**
- docs/Phase_3_Day_4_Progress.md - Database and service implementation
- docs/Phase_3_Day_5_Progress.md - UI screens and workflows
- docs/Phase_3_Day_6_FINAL.md - Demo data and testing
- docs/Phase_3_Testing_Summary.md - Manual testing scenarios (8 scenarios)
- docs/RFQ_Creation_Issue_Investigation.md - Known issue documentation
- docs/V2.3_FEATURE_SUMMARY.md - Complete feature overview with screenshots
- docs/V2.3_VISUAL_COMPARISON.md - Before/after UI comparisons

**Known Issues:**
- ⚠️ **RFQ Creation UI**: Manual RFQ creation blocked by WatermelonDB association validation error
  - **Workaround**: Use "Load Demo Data" button for testing RFQ workflows
  - **Impact**: Does not affect RFQ List, Detail, or evaluation features
  - **Status**: Documented in RFQ_Creation_Issue_Investigation.md with 8 attempted fixes

**What Works:**
- ✅ RFQ List with status filtering and search
- ✅ RFQ Detail with comprehensive information display
- ✅ Demo data loading (5 RFQs with vendor quotes)
- ✅ DOORS package integration
- ✅ Vendor management and tracking
- ✅ Quote evaluation and ranking (via demo data)
- ✅ Comparative analysis and statistics

**Phase 3 Advanced Features:**
- ✅ **DOORS Package Edit**: Full edit capability with auto-recalculated statistics
- ✅ **DOORS Requirement Edit**: Individual requirement updates with package sync
- ✅ **Manual BOM-DOORS Linking**: Override automated linking with manual selection
- ✅ **RFQ Management**: Complete procurement workflow (with UI creation workaround)

---

**v2.6 Complete** ✅ (November 17, 2025)

#### PDF Report Generation Enabled
**Quick Win: Enable Supervisor Daily Report PDF Export**

The supervisor role can now export daily progress reports as professional PDF documents.

**What's New:**
- ✅ **PDF Generation**: Daily reports automatically generate PDF files (133KB avg)
- ✅ **Professional Template**: Beautiful HTML template with gradient header and color-coded progress
- ✅ **Auto-Save**: PDFs saved to device Documents folder with date-stamped filenames
- ✅ **Success Feedback**: Success message shows "X PDF(s) generated" confirmation
- ✅ **Native Module**: react-native-html-to-pdf v1.3.0 properly linked and working

**PDF Features:**
- Site information (name, location, date, supervisor)
- Overall progress summary with large percentage display
- Item-by-item breakdown with:
  - Quantity tracking (completed/planned)
  - Color-coded progress indicators (green/orange/yellow/red)
  - Status badges (completed/in progress/not started)
  - Progress notes
- Professional styling with gradients and shadows

**Technical Implementation:**
- File location: `/Android/data/com.site_progress_tracker/files/Documents/`
- File naming: `DailyReport_[SiteName]_[YYYY-MM-DD].pdf`
- PDF format: PDF 1.4 (Chromium/Skia renderer)
- Enhanced logging with `[PDF]` prefix for debugging

**Files Modified (2):**
- services/pdf/ReportPdfService.ts - Updated to use `generatePDF` API
- src/supervisor/DailyReportsScreen.tsx - Enabled PDF generation with error handling

#### PDF Viewer and Share Functionality
**Enhanced UX: View and Share PDF Reports** (November 18, 2025)

Supervisors can now preview and share PDF reports directly from the Reports History screen.

**What's New:**
- ✅ **View PDF Button**: Open PDF in device's PDF viewer or alternative apps
- ✅ **Share PDF Button**: Share reports via WhatsApp, Email, Drive, etc.
- ✅ **File Attachment**: PDF properly attached to share intent (not just text)
- ✅ **FileProvider Configuration**: Secure file sharing with proper Android permissions
- ✅ **Cache Strategy**: Copies PDF to cache directory for reliable sharing
- ✅ **Auto-Cleanup**: Temporary cache files automatically deleted after sharing
- ✅ **Error Handling**: Helpful messages if PDF viewer not installed or sharing fails
- ✅ **Consistent UI**: Material Design buttons in Report Details dialog

**User Workflow:**
1. Navigate to Reports History
2. Tap on a report to see details
3. Click **"View PDF"** to open in PDF viewer (or see suggestion to share if no viewer)
4. Click **"Share"** to open Android share sheet
5. Select app (Gmail, WhatsApp, Drive, etc.)
6. PDF is attached and ready to send

**Technical Implementation:**
- **Native Modules**:
  - react-native-file-viewer v2.1.5 (PDF viewing)
  - react-native-share v12.2.1 (file sharing)
  - react-native-fs v2.20.0 (file operations)
- **FileProvider**: Configured in AndroidManifest.xml for secure file access
- **File Paths**: XML configuration defines accessible directories (Documents, Cache, External)
- **Cache Strategy**: Files copied to cache directory before sharing for better compatibility
- **Error Recovery**: Graceful fallback if viewer missing, auto-cleanup on failures

**Files Modified (3):**
- src/supervisor/ReportsHistoryScreen.tsx - Added View/Share buttons and handlers
- android/app/src/main/AndroidManifest.xml - FileProvider configuration
- android/app/src/main/res/xml/file_paths.xml - Shareable path definitions

**Next Phase (v2.7):**
- Add photo attachments to PDFs
- Include weather conditions and next day plan fields
- PDF template customization options

---

### v2.0 (October 2025) - UX Improvements Sprint 1 Complete ⭐
**Alert.alert Migration to Snackbar/Dialog System**
- ✅ **100% Migration Complete**: All 113 Alert.alert calls replaced with custom Snackbar/ConfirmDialog system
- ✅ **13 Files Migrated**: Admin, Supervisor, Planning, Navigation, and Auth modules
- ✅ **Non-Blocking Notifications**: Snackbars allow users to continue working while seeing feedback
- ✅ **Color-Coded Feedback**: Green (success), Red (error), Orange (warning), Blue (info)
- ✅ **Confirmation Dialogs**: Destructive actions have clear cancel/confirm buttons with red warning for dangerous operations
- ✅ **Auto-Dismiss**: Snackbars automatically disappear after 4 seconds
- ✅ **100% Test Pass Rate**: All 24+ test cases passed, zero issues found
- ✅ **UX Score Improvement**: 5.5/10 → 7.0/10 (+27% improvement)
- 📚 **Complete Documentation**: Migration guide, testing guide, final reports
- 🎯 **Production Ready**: Approved for production release

**Files Updated:**
- WBSManagementScreen, SiteInspectionScreen, HindranceReportScreen
- RoleManagementScreen, MaterialTrackingScreen, ItemsManagementScreen
- ProjectManagementScreen, DailyReportsScreen, ReportsHistoryScreen
- SiteManagementScreen (Supervisor), BaselineScreen, DependencyModal
- ItemCreationScreen, RoleSelectionScreen, LoginScreen

### v1.6 (October 2025) - Sprint 4 & 5 Complete
- ✅ WBS Management Screen with context menus (long-press)
- ✅ Child item creation with hierarchical code generation
- ✅ Delete items with confirmation dialog
- ✅ Baseline locking enforcement (prevents edits when locked)
- ✅ Max level enforcement (4 levels maximum)
- ✅ Phase filtering with visual chips
- ✅ Auto-refresh after create/delete operations
- ✅ Badge display improvements (Critical, High Risk, Med Risk, Locked)
- ✅ Risk notes visual enhancements (bordered box)
- 📋 Manual testing completed (41 test cases, all passed)

### v1.5 (October 2025) - Sprint 4 Complete
- ✅ Database save functionality with WatermelonDB
- ✅ Category selector component (dropdown with database)
- ✅ Phase selector component (11 phases with icons)
- ✅ Snackbar notifications (success/error)
- ✅ Auto-navigation after save

### v1.4 (October 2025) - Sprint 3 Complete
- ✅ Item Creation Screen full UI
- ✅ WBS code auto-generation logic
- ✅ Form validation (client-side)
- ✅ 4-level hierarchy support

### v1.3 (October 2025) - Baseline Planning & Testing
- ✅ Baseline Planning Screen (critical path, dependencies)
- ✅ PlanningService with Kahn's algorithm
- ✅ Testing infrastructure (Jest + 35 tests)
- ✅ Database schema v11 with planning fields

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

The app uses WatermelonDB (Schema v29, updated November 2025 - v2.10) for robust offline-first data management with bidirectional sync capabilities.

### Core Entities (with Sync Support - v2.2)
- **Projects**: Top-level project containers with client, dates, and budgets *(syncable)*
- **Sites**: Construction sites associated with projects *(syncable)*
- **Categories**: Categorization for construction items *(syncable)*
- **Items**: Specific construction tasks and deliverables *(syncable)*
- **Materials**: Construction materials with procurement tracking *(syncable)*
- **ProgressLogs**: Detailed progress records linked to items with photos (JSON array) *(syncable)*
- **Hindrances**: Issues and obstacles affecting work with photo documentation and timestamps *(syncable)*
- **DailyReports**: Aggregated daily progress reports with sync status *(syncable)*
- **SiteInspections**: Site inspection records with checklists and photos *(syncable)*
- **ScheduleRevisions**: Track schedule changes and their impact *(syncable)*
- **SyncQueue** (v2.2 - Week 6-8): Track local changes for server synchronization with retry logic
  - **Retry Logic** (Week 8): Exponential backoff with max 5 retries (1s → 2s → 4s → 8s → 16s → 60s)
  - **Dead Letter Queue** (Week 8): Items failing 10+ times moved to DLQ for admin review
  - **Auto-Recovery**: Automatic retry on network restore
  - **Manual Controls**: Admin can manually retry or clear failed items

### Admin & User Management (v1.2, v2.2 Week 8)
- **Users**: User accounts with authentication credentials
- **Roles**: System roles (Admin, Supervisor, Manager, Planner, Logistics)
- **Sessions** (v2.2): JWT session tracking with device info
- **PasswordHistory** (v2.2): Password history for reuse prevention

### Manager Role - Milestones (v2.10 - Phase 1, November 2025)
- **Milestones** (Schema v29): Project milestone definitions
  - **Standard Milestones**: 7 pre-defined milestones (PM100-PM700)
    - PM100: Requirements Management (DOORS) - 10% weight
    - PM200: Engineering & Design - 15% weight
    - PM300: Procurement - 15% weight
    - PM400: Manufacturing - 10% weight
    - PM500: Testing & Pre-commissioning - 15% weight
    - PM600: Commissioning - 20% weight
    - PM700: Handover - 15% weight
  - **Custom Milestones**: Support for project-specific milestones
  - **Fields**: project_id, milestone_code, milestone_name, description, sequence_order, weightage, is_active, is_custom
- **Milestone Progress** (Schema v29): Site-level progress tracking
  - **Progress Tracking**: Track percentage completion per site per milestone
  - **Status Tracking**: not_started, in_progress, completed, delayed
  - **Fields**: project_id, site_id, milestone_id, progress_percentage, status, start_date, target_date, actual_completion_date, notes

### BOM Management (v2.3 - Activity 4, November 2025)
- **BOMs** (Schema v23-v25): Bill of Materials for estimation and execution
  - **Basic Fields**: project_id, name, type (estimating/execution), status, version, site_category
  - **Baseline Linking** (v25): baseline_bom_id links execution BOMs to estimating BOMs
  - **Quantities** (v23): quantity, unit fields for BOM-level quantities
  - **Cost Tracking**: total_estimated_cost, total_actual_cost, contingency, profit_margin
  - **Tender Fields**: tender_date, client, contract_value
  - **Site Category** (v24): ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct (indexed)
  - **Workflow**: Draft → Submitted → Won/Lost (Estimating), Baseline → Active → Closed (Execution)
- **BOM Items**: Individual line items within BOMs
  - **Identification**: item_code (auto-generated: MAT-001, LAB-002), description
  - **Categories**: material, labor, equipment, subcontractor
  - **Quantities**: quantity, unit, unit_cost, total_cost (auto-calculated)
  - **Organization**: phase, wbs_code (optional)
  - **Execution Tracking**: actual_quantity, actual_cost for variance analysis
  - **Foreign Key**: bom_id links to parent BOM

### Planning & WBS Fields (v1.3-v1.5 - ENHANCED)
Items now include advanced planning and WBS management capabilities:
- **Planning Fields (v1.3)**:
  - **baseline_start_date / baseline_end_date**: Locked baseline dates
  - **dependencies**: JSON array of dependent item IDs
  - **is_baseline_locked**: Boolean flag for baseline lock status
  - **actual_start_date / actual_end_date**: Track actual work dates
  - **critical_path_flag**: Boolean flag indicating critical path items
- **WBS Structure Fields (v1.4)**:
  - **wbs_code**: Hierarchical code (e.g., "1.2.3.4")
  - **wbs_level**: Depth level (1-4)
  - **parent_wbs_code**: Parent WBS code reference
  - **project_phase**: Design, Procurement, Construction, etc. (11 phases)
  - **is_milestone**: Milestone indicator
  - **created_by_role**: Planner or Supervisor
- **Risk Management Fields (v1.4)**:
  - **is_critical_path**: Critical path indicator
  - **float_days**: Total float in days
  - **dependency_risk**: Low, Medium, High
  - **risk_notes**: Risk description and mitigation plan

### Key Database Features
- **Schema Version 29**: Latest schema with Manager Milestones (v2.10 - Phase 1, November 2025)
- **Offline-First**: All operations work without internet
- **Bidirectional Sync** (v2.2 - Week 6): Automatic push/pull synchronization with server
- **Conflict Resolution** (v2.2 - Week 7): Version-based Last-Write-Wins strategy
- **Dependency-Aware Sync** (v2.2 - Week 7): Topological sort ensures correct sync order
- **Retry Logic** (v2.2 - Week 8): Exponential backoff prevents transient failures
- **Dead Letter Queue** (v2.2 - Week 8): Persistent storage for failed sync items (10+ retries)
- **Auto-Sync** (v2.2 - Week 8): 4 triggers (launch, network, periodic, foreground)
- **Network Monitoring** (v2.2 - Week 8): Real-time network state detection
- **Sync Status**: Track pending/synced/failed states for all records
- **Version Tracking**: Each record has _version field for conflict detection
- **Photo Storage**: JSON arrays for multiple photos per record
- **Relationships**: Full foreign key relationships between all entities
- **Cascade Deletion**: Deleting projects removes all associated sites, items, and related data
- **Hierarchical Data**: Support for 4-level WBS hierarchy with parent-child relationships

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

**Sync Status Field** (CRITICAL - RESOLVED v2.2):
- WatermelonDB's Model class has a built-in read-only `syncStatus` property
- To avoid conflicts, we use `appSyncStatus` as the property name in all models
- Decorator maps to schema: `@field('sync_status') appSyncStatus!: string`
- This applies to ALL 10 syncable models: Projects, Sites, Categories, Items, Materials, ProgressLogs, Hindrances, DailyReports, SiteInspections, ScheduleRevisions
- Database column name remains `sync_status` (no migration needed)
- All code references updated to use `appSyncStatus` instead of `syncStatus`

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
    ├── AdminNavigator (Bottom Tabs - 4 screens) [v1.2, v2.2 Week 8]
    │   ├── AdminDashboardScreen (🏠 Dashboard)
    │   │   ├── Statistics (projects, sites, users, items)
    │   │   ├── Role Switcher (test different role views)
    │   │   └── Quick access to management screens
    │   ├── ProjectManagementScreen (📁 Projects)
    │   │   ├── CRUD operations for projects
    │   │   ├── Searchable project list
    │   │   ├── Status management (Active/Completed/On Hold/Cancelled)
    │   │   └── CASCADE DELETE (removes all sites, items, and related data)
    │   ├── RoleManagementScreen (👥 Users)
    │   │   ├── CRUD operations for users
    │   │   ├── Role assignment
    │   │   ├── Activate/Deactivate accounts
    │   │   └── Searchable user list
    │   └── SyncMonitoringScreen (🔄 Sync) [v2.2 Week 8 - NEW]
    │       ├── Network status monitoring (WiFi/Cellular/Offline)
    │       ├── Sync status dashboard (last sync, errors)
    │       ├── Pending sync queue viewer
    │       ├── Dead letter queue management
    │       ├── Manual sync controls
    │       └── Auto-sync pause/resume
    ├── SupervisorNavigator (Bottom Tabs - 7 screens)
    │   ├── DailyReportsScreen (📝 Reports) - Submit progress
    │   ├── ReportsHistoryScreen (📊 History) - View submitted reports
    │   ├── ItemsManagementScreen (📋 Items) - Manage work items
    │   ├── MaterialTrackingScreen (🚚 Materials) - Track materials
    │   ├── SiteManagementScreen (🏗️ Sites) - Manage sites
    │   ├── HindranceReportScreen (⚠️ Issues) - Report hindrances with photos
    │   └── SiteInspectionScreen (🔍 Inspection) - Site inspections
    ├── ManagerNavigator (Bottom Tabs - v2.10)
    │   ├── ManagerDashboardScreen (v2.10 Phase 2) - Project overview with 8 KPIs
    │   ├── TeamManagementScreen (stub)
    │   ├── FinancialReportsScreen (stub)
    │   ├── ResourceRequestsScreen (stub)
    │   └── BomManagementScreen (v2.3) - Bill of Materials management
    ├── PlanningNavigator (Bottom Tabs + Stack Screens)
    │   ├── WBSManagementScreen (v1.4) - Hierarchical WBS with auto-generated codes
    │   │   └── ItemCreationScreen (v1.4) - Create/Edit items with selectors
    │   ├── BaselineScreen (v1.3) - Project planning with dependencies
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

### Admin Role Features (v1.2, v2.2 Week 8)
The admin role provides complete system administration with 4 screens:

**Dashboard** (Screen 1):
- Real-time statistics (total projects, sites, users, items)
- Role switcher to view app as different roles
- Quick navigation to management screens

**Project Management** (Screen 2):
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

**User & Role Management** (Screen 3):
- Create, edit, and delete users
- Assign roles (Admin, Supervisor, Manager, Planner, Logistics)
- Activate/Deactivate user accounts
- Search users by username, name, or email
- Password management (bcrypt hashed)
- Role-based color coding

**Sync Monitoring** (Screen 4 - Week 8 NEW):
- Network status monitoring (WiFi/Cellular/Offline)
- Sync status dashboard with last sync time
- Pending sync queue viewer (count by model)
- Dead letter queue management
- Manual sync controls (sync, pause/resume)
- Process queue and clear DLQ buttons
- Pull-to-refresh for real-time updates

### Supervisor Features
The supervisor role has the most complete implementation with 7 screens:
1. **Daily Reports**: Update item progress and submit daily reports
2. **Reports History**: View, filter, and search submitted reports with date/site filters
3. **Items Management**: Create and manage construction work items
4. **Materials**: Track material quantities (required/available/used)
5. **Sites**: Create and manage construction sites
6. **Hindrance Reports**: Report issues with photos (camera/gallery), priority, and status tracking
7. **Site Inspection**: Conduct site inspections with comprehensive checklists

**UX Improvements**:
- Focused workflow without role switching (supervisors stay in their context)
- Streamlined header with logout button only

## Test Credentials

The app comes with 5 pre-configured test accounts (seeded on first launch):

```
Admin:      admin      / Admin@2025
Supervisor: supervisor / Supervisor@2025
Manager:    manager    / Manager@2025
Planner:    planner    / Planner@2025
Logistics:  logistics  / Logistics@2025
```

All passwords are securely hashed with bcrypt (salt rounds: 8) for mobile-optimized performance.

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
- [Architecture Documentation](./ARCHITECTURE_UNIFIED.md) - Complete unified architecture documentation (single source of truth)
- [Database Schema](./DATABASE.md) - Complete database schema documentation

### Testing Documentation (v1.3 - NEW)
- [Testing Quick Start](./TESTING_QUICKSTART.md) - 10-minute testing guide
- [Testing Strategy](./TESTING_STRATEGY.md) - Comprehensive testing strategy
- [Testing Session Checklist](./TESTING_SESSION_CHECKLIST.md) - Manual testing checklist
- [Admin Test Plan](./ADMIN_TEST_PLAN.md) - Admin features testing guide (v1.2)

### Planning Module Documentation
- [Planning Master Status](./PLANNING_MASTER_STATUS.md) - Planning module master status and roadmap (v1.9.1 - CURRENT)
- [v1.9.1 Fixes Summary](./FIXES_SUMMARY_v1.9.1.md) - Detailed fix documentation for v1.9.1
- [Gantt Testing Quick Start](./GANTT_TESTING_QUICK_START.md) - Quick start guide for Gantt chart testing
- [Planning Module Quick Start](./PLANNING_MODULE_QUICK_START.md) - User guide for planning features
- [Planning Module Status](./PLANNING_MODULE_IMPLEMENTATION_STATUS.md) - Implementation status (v1.3 baseline)

## Version History

### v1.5 - Child Items & Context Menu (Current)
- ✅ Context menu on WBS items (long-press or menu icon)
- ✅ Child item creation workflow with parent context
- ✅ Auto-refresh on screen focus after item operations
- ✅ Navigation to edit screen (structure implemented)
- ✅ Delete confirmation with cascade checks
- **Components Modified**: WBSItemCard (Menu component), WBSManagementScreen (3 new handlers)

### v1.4 - WBS Management & Item Creation
- ✅ Database schema upgraded to v12 (14 new WBS/risk fields in items table)
- ✅ WBS Management Screen with hierarchical display
- ✅ Auto-generated WBS codes (WBSCodeGenerator service)
- ✅ Item Creation Screen with complete form workflow
- ✅ Category selector (database-driven dropdown)
- ✅ Phase selector (11 phases with color coding)
- ✅ Risk management fields (critical path, float days, dependency risk)
- ✅ Snackbar notifications for user feedback
- ✅ Form validation with real-time error display
- ✅ Database persistence with WatermelonDB
- **Components Added**: ItemCreationScreen (560 lines), WBSManagementScreen (303 lines), WBSItemCard (279 lines), CategorySelector (173 lines), PhaseSelector (174 lines), WBSCodeGenerator (147 lines)
- **Lines of Code**: ~1,600 new lines across Sprint 4 & 5

### v1.3 - Planning Module & Testing Infrastructure
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
