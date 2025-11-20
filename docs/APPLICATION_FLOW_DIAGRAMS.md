# Construction Site Progress Tracker - Application Flow Diagrams

**Document Version**: 1.1
**Date**: November 20, 2025
**Current App Version**: v2.8

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Role-Based Navigation Flow](#role-based-navigation-flow)
3. [Supervisor Workflow](#supervisor-workflow)
4. [Manager Workflow](#manager-workflow)
5. [Planner Workflow](#planner-workflow)
6. [Logistics Workflow](#logistics-workflow)
7. [Admin Workflow](#admin-workflow)
8. [Data Sync Flow](#data-sync-flow)
9. [Offline Operation Flow](#offline-operation-flow)
10. [BOM-DOORS-RFQ Integration Flow](#bom-doors-rfq-integration-flow)

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     APP LAUNCH                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Check Token in AsyncStorage                       │
└────────┬──────────────────────────────────────────┬─────────┘
         │ Token Found                              │ No Token
         │                                          │
         ▼                                          ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Validate Token      │              │   Login Screen       │
│  (TokenService)      │              │                      │
└───┬──────────────┬───┘              └──────────┬───────────┘
    │ Valid        │ Invalid                     │
    │              │                             │
    │              └────────┐                    │
    │                       │                    │
    │                       ▼                    ▼
    │              ┌─────────────────────────────────────────┐
    │              │  User enters username/password          │
    │              │  AuthService.login()                    │
    │              └──────┬──────────────────────┬───────────┘
    │                     │ Success              │ Failure
    │                     │                      │
    │                     ▼                      ▼
    │              ┌──────────────────┐    ┌──────────────────┐
    │              │ Generate Tokens  │    │  Show Error      │
    │              │ - Access (15min) │    │  "Invalid        │
    │              │ - Refresh (7day) │    │   credentials"   │
    │              │                  │    └──────────────────┘
    │              │ Create Session   │
    │              │ Save to Storage  │
    │              └────────┬─────────┘
    │                       │
    └───────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Role Selection Screen                       │
│  Display all roles assigned to user                         │
│  - Admin, Supervisor, Manager, Planner, Logistics           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              User Selects Role                               │
│              Navigate to Role-Specific Navigator             │
└─────────────────────────────────────────────────────────────┘
```

**Key Components**:
- **TokenService**: JWT generation & validation
- **AuthService**: User authentication logic
- **SessionService**: Session tracking with device info
- **TokenStorage**: Secure AsyncStorage wrapper

---

## Role-Based Navigation Flow

```
                        Role Selection
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   Admin     │  │ Supervisor  │  │   Manager   │
     │ Navigator   │  │ Navigator   │  │ Navigator   │
     └─────────────┘  └─────────────┘  └─────────────┘
             │                │                │
             ▼                ▼                ▼
     4 Screens        7 Screens        6 Screens
     - Dashboard      - Site Mgmt      - BOM Mgmt
     - Projects       - Items          - Overview
     - Roles          - Reports        - Team
     - Sync Mon       - History        - Resources
                      - Hindrances     - Allocation
                      - Materials      - Financial
                      - Inspection

             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
┌─────────────┐  ┌─────────────┐
│   Planner   │  │  Logistics  │
│  Navigator  │  │  Navigator  │
└─────────────┘  └─────────────┘
       │                │
       ▼                ▼
 9 Screens        13 Screens
 - WBS Mgmt       - Dashboard
 - Baseline       - Materials
 - Item Create    - DOORS Reg
 - Item Edit      - DOORS Detail
 - Site Mgmt      - DOORS Edit (2)
 - Gantt          - RFQ List
 - Schedule       - RFQ Detail
 - Resources      - RFQ Create
 - Milestones     - Equipment
                  - Delivery
                  - Inventory
                  - Analytics
```

**Navigation Pattern**:
- Stack Navigator for each role
- Bottom tab navigation within roles
- Persistent state across tabs
- Role switcher in header

---

## Supervisor Workflow

### Comprehensive Daily Reporting Flow (v2.8)

```
Start Day
    │
    ▼
┌─────────────────────────────────────┐
│  Site Selection                     │
│  (Persistent across session)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Items Management Screen            │
│  - View work items for site         │
│  - Filter by phase/status           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Update Progress                    │
│  - Enter completed quantity         │
│  - Take photos (camera)             │
│  - Add notes                        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Progress Log Created               │
│  - Saved to database                │
│  - Synced when online               │
│  - Photos embedded                  │
└──────┬──────────────────────────────┘
       │
       ├───► Report Hindrances (if any)
       │     - Priority (H/M/L)
       │     - Description & photos
       │     - Assign responsibility
       │
       ├───► Site Inspection (if scheduled)
       │     - Overall rating
       │     - Checklist items
       │     - Safety flags
       │     - Inspection photos
       │
       ▼
┌─────────────────────────────────────┐
│  Daily Report Screen                │
│  - Auto-aggregates all logs         │
│  - Review summary                   │
│  - Submit report                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Comprehensive Report Generation    │
│  Section 1: Progress Updates        │
│  - All work items with photos       │
│  - Completed quantities             │
│  - Notes from supervisor            │
│                                     │
│  Section 2: Hindrances & Issues     │
│  - Title, description, priority     │
│  - Status (open/in_progress/etc)    │
│  - Photos of issues                 │
│                                     │
│  Section 3: Site Inspection         │
│  - Overall rating & checklist       │
│  - Safety flags & compliance        │
│  - Inspection photos                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Single PDF Report Generated        │
│  - Comprehensive daily summary      │
│  - All sections included            │
│  - Visible in Reports History       │
│  - Manager notified (future)        │
└─────────────────────────────────────┘
```

### Hindrance Reporting Flow

```
Issue Discovered
    │
    ▼
┌─────────────────────────────────────┐
│  Hindrance Report Screen            │
│  - Select priority (H/M/L)          │
│  - Enter title & description        │
│  - Choose item (optional)           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Take Photos                        │
│  - Camera (primary)                 │
│  - Gallery (secondary)              │
│  - Multiple photos supported        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Assign Responsibility              │
│  - Select user from list            │
│  - Auto-assign to manager (default) │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Submit Hindrance                   │
│  - Saved with status: "open"        │
│  - Assignee notified (future)       │
└─────────────────────────────────────┘
```

---

## Manager Workflow

### BOM Management Flow

```
Project Created
    │
    ▼
┌─────────────────────────────────────┐
│  BOM Management Screen              │
│  - Create New BOM                   │
│  - Select Type: Estimating/Execution│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  BOM Configuration                  │
│  - Project, Name, Version           │
│  - Site Category                    │
│  - Quantity & Unit                  │
│  - Contingency & Profit             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Add BOM Items                      │
│  - Item Code, Description           │
│  - Material/Labor/Equipment         │
│  - Quantity, Unit, Rate             │
│  - Sub-contractors                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auto-Calculate                     │
│  - Material Total                   │
│  - Labor Total                      │
│  - Equipment Total                  │
│  - Overhead, Contingency            │
│  - Profit Margin                    │
│  - Grand Total                      │
└──────┬──────────────────────────────┘
       │
       ├─── View ──────────────┐
       │                       │
       ├─── Edit ──────────────┤
       │                       │
       ├─── Export Excel ──────┤
       │                       │
       └─── Submit/Baseline ───┤
                               │
                               ▼
                        BOM Finalized
```

### Resource Request Approval Flow

```
Resource Request Submitted (by Supervisor/Planner)
    │
    ▼
┌─────────────────────────────────────┐
│  Resource Requests Screen           │
│  - View pending requests            │
│  - Filter by status/type            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Review Request Details             │
│  - Resource type & quantity         │
│  - Justification                    │
│  - Required date                    │
│  - Requesting user                  │
└──────┬──────────────────────────────┘
       │
       ├─── Approve ───┐
       │               │
       ├─── Reject ────┤
       │               │
       └─── Defer ─────┤
                       │
                       ▼
              Update Request Status
                       │
                       ▼
           Notify Requester (future)
```

---

## Planner Workflow

### WBS Management Flow

```
Project Planning Starts
    │
    ▼
┌─────────────────────────────────────┐
│  WBS Management Screen              │
│  - Select Site                      │
│  - View hierarchical items          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Create Root Item (Level 1)        │
│  - Auto WBS Code: 1.0.0.0           │
│  - Phase, Category, Dates           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Long-Press Context Menu            │
│  - Add Child (creates 1.1.0.0)      │
│  - Edit Item                        │
│  - Delete Item                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Add Child Items (up to Level 4)   │
│  1.0.0.0 → 1.1.0.0 → 1.1.1.0 → 1.1.1.1 │
│  Automatic code generation          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Set Dependencies                   │
│  - Predecessor IDs (JSON array)     │
│  - Cycle detection                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Baseline Planning Screen           │
│  - Calculate Critical Path          │
│  - View float days                  │
│  - Lock Baseline                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Schedule Monitoring                │
│  - Track Progress                   │
│  - Calculate SPI                    │
│  - Forecast completion              │
└─────────────────────────────────────┘
```

### Critical Path Calculation

```
WBS Items with Dependencies
    │
    ▼
┌─────────────────────────────────────┐
│  Kahn's Algorithm (Topological Sort)│
│  1. Calculate in-degree for all     │
│  2. Queue items with in-degree = 0  │
│  3. Process queue (BFS)             │
│  4. Detect cycles                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Calculate Early Start/Finish       │
│  ES = max(predecessor EF)           │
│  EF = ES + duration                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Calculate Late Start/Finish        │
│  LF = min(successor LS)             │
│  LS = LF - duration                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Calculate Float                    │
│  Total Float = LS - ES              │
│  Free Float = ES(successor) - EF    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Identify Critical Path             │
│  Items with Total Float = 0         │
│  Mark with is_critical_path = true  │
└─────────────────────────────────────┘
```

---

## Logistics Workflow

### DOORS Requirements Management Flow

```
Equipment Specification Required
    │
    ▼
┌─────────────────────────────────────┐
│  DOORS Register Screen              │
│  - View existing packages           │
│  - Create New Package               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Package Configuration              │
│  - DOORS ID (auto)                  │
│  - Equipment Name & Type            │
│  - Category (TSS/OHE/SCADA/etc)     │
│  - Quantity & Unit                  │
│  - Specification Ref                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Add Requirements (50-100+)         │
│  For Each Requirement:              │
│  - Code (auto)                      │
│  - Description                      │
│  - Category (Technical/Data/Test)   │
│  - Mandatory flag                   │
│  - Verification method              │
│  - Acceptance criteria              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auto-Calculate Compliance          │
│  - Total requirements               │
│  - Compliant count                  │
│  - Compliance % by category         │
│  - Overall compliance %             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  BOM-DOORS Linking                  │
│  - Automated keyword matching       │
│  - Manual linking override          │
│  - Display on BOM cards             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  DOORS Package Ready                │
│  - Used for RFQ creation            │
│  - Compliance tracking              │
│  - Vendor evaluation                │
└─────────────────────────────────────┘
```

### RFQ Management Flow

```
DOORS Package Ready
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ List Screen                    │
│  - Load Demo Data (workaround)      │
│  OR                                 │
│  - Create RFQ (has bug)             │
└──────┬──────────────────────────────┘
       │
       ▼ (Using Demo Data)
┌─────────────────────────────────────┐
│  RFQ Created (Draft status)         │
│  - RFQ Number (auto)                │
│  - Links to DOORS package           │
│  - Technical specs (auto)           │
│  - Vendor list                      │
│  - Closing date                     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Issue RFQ                          │
│  - Status: draft → issued           │
│  - Issue date recorded              │
│  - Vendors notified (future)        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Vendor Quotes Submitted            │
│  (Manual entry - demo data)         │
│  - Quoted price                     │
│  - Lead time                        │
│  - Technical compliance %           │
│  - Deviations                       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Quote Evaluation                   │
│  - Technical score (0-100)          │
│  - Commercial score (0-100)         │
│  - Weighted overall score           │
│  - Auto-ranking (L1, L2, L3)        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  RFQ Award                          │
│  - Select winning vendor (L1)       │
│  - Record awarded value             │
│  - Status: evaluated → awarded      │
│  - Create PO (future)               │
└─────────────────────────────────────┘
```

### Material Tracking Flow

```
BOM Created (Manager Role)
    │
    ▼
┌─────────────────────────────────────┐
│  BOM-Logistics Integration          │
│  - BomLogisticsService processes    │
│  - Extracts material requirements   │
│  - Calculates priorities            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Material Tracking Screen           │
│  - View all materials needed        │
│  - Required vs Available            │
│  - BOM linkage shown                │
│  - DOORS compliance (if linked)     │
└──────┬──────────────────────────────┘
       │
       ├─── High Priority Materials
       │
       ├─── Medium Priority Materials
       │
       └─── Low Priority Materials
                │
                ▼
       Procurement Planning
```

---

## Admin Workflow

### User Management Flow

```
New User Needs Access
    │
    ▼
┌─────────────────────────────────────┐
│  Role Management Screen             │
│  - Create User                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User Form                          │
│  - Username (unique)                │
│  - Password (hashed with bcrypt)    │
│  - Full Name                        │
│  - Assign Roles (multi-select)      │
│  - Active/Inactive status           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Password Validation                │
│  - 8+ characters                    │
│  - Uppercase, lowercase             │
│  - Number, special character        │
│  - Not in password history          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User Created                       │
│  - Password hashed (bcrypt)         │
│  - Salt rounds: 12                  │
│  - Stored in users table            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User Can Login                     │
│  - Select from assigned roles       │
│  - Access role-specific screens     │
└─────────────────────────────────────┘
```

### Sync Monitoring Flow

```
Data Changes Made Offline
    │
    ▼
┌─────────────────────────────────────┐
│  Sync Queue (sync_queue table)     │
│  - Record added with status: pending│
│  - Retry count: 0                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auto-Sync Triggered                │
│  Triggers:                          │
│  - App launch                       │
│  - Network reconnect                │
│  - Periodic (every 15 min)          │
│  - App foreground                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Attempt Sync                       │
│  - Send to server                   │
│  - Exponential backoff on failure   │
│  - Max retries: 10                  │
└──────┬──────────────┬────────────────┘
       │ Success      │ Failure
       │              │
       ▼              ▼
┌──────────────┐  ┌───────────────────┐
│ Mark Synced  │  │ Increment Retry   │
│ Remove Queue │  │ 1s → 2s → 4s →    │
└──────────────┘  │ ... → 60s max     │
                  └─────┬─────────────┘
                        │
                        ├─ Retry < 10 → Queue again
                        │
                        └─ Retry >= 10 → Dead Letter Queue
                                         │
                                         ▼
                              ┌────────────────────────┐
                              │ Admin Review Required  │
                              │ Sync Monitoring Screen │
                              └────────────────────────┘
```

---

## Data Sync Flow

### Bidirectional Sync Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Device                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           WatermelonDB (SQLite)                        │ │
│  │  - 28 tables with offline data                        │ │
│  │  - Local changes tracked with _status                 │ │
│  └───────────────────┬────────────────────────────────────┘ │
│                      │                                       │
│                      │ SyncService                           │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Sync Queue                                │ │
│  │  - Pending changes awaiting upload                     │ │
│  │  - Retry logic with exponential backoff                │ │
│  └───────────────────┬────────────────────────────────────┘ │
└────────────────────────┼───────────────────────────────────┘
                         │
                         │ HTTPS
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server (Future)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            REST API                                    │ │
│  │  - Receive changes from devices                        │ │
│  │  - Send changes to devices                            │ │
│  │  - Conflict resolution                                │ │
│  └───────────────────┬────────────────────────────────────┘ │
│                      │                                       │
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Master Database (PostgreSQL)                   │ │
│  │  - Central repository                                  │ │
│  │  - Version tracking                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Sync Conflict Resolution

```
Local Change + Server Change (Same Record)
    │
    ▼
┌─────────────────────────────────────┐
│  Compare Versions                   │
│  - Local _version                   │
│  - Server _version                  │
└──────┬──────────────────────────────┘
       │
       ├─── Local newer → Use Local
       │
       ├─── Server newer → Use Server
       │
       └─── Same version → Use Latest Timestamp
                           │
                           ▼
                  ┌─────────────────────┐
                  │  Update Both Sides  │
                  │  - Increment version│
                  │  - Sync status      │
                  └─────────────────────┘
```

---

## Offline Operation Flow

```
User Working (Online)
    │
    │ Network Lost
    ▼
┌─────────────────────────────────────┐
│  NetworkMonitor Detects Offline    │
│  - Update UI indicator (red)        │
│  - Disable sync operations          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  User Continues Working             │
│  - All operations save locally      │
│  - WatermelonDB handles storage     │
│  - No disruption to workflow        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Changes Queued                     │
│  - Added to sync_queue              │
│  - Status: pending                  │
│  - Will sync when online            │
└──────┬──────────────────────────────┘
       │
       │ Network Restored
       ▼
┌─────────────────────────────────────┐
│  NetworkMonitor Detects Online      │
│  - Update UI indicator (green)      │
│  - Trigger auto-sync                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AutoSyncManager Initiated          │
│  - Process sync queue               │
│  - Upload pending changes           │
│  - Download server changes          │
│  - Resolve conflicts                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Sync Complete                      │
│  - Local & server synchronized      │
│  - Queue cleared                    │
│  - User continues working           │
└─────────────────────────────────────┘
```

---

## BOM-DOORS-RFQ Integration Flow

### End-to-End Procurement Flow

```
1. Manager Creates BOM
    │
    ▼
┌─────────────────────────────────────┐
│  BOM Management                     │
│  - Create BOM for project           │
│  - Add materials with specs         │
│  - Calculate costs                  │
│  - Export to Excel                  │
└──────┬──────────────────────────────┘
       │
       ▼
2. BOM-Logistics Integration
    │
    ▼
┌─────────────────────────────────────┐
│  Material Tracking (Logistics)      │
│  - View BOM-derived materials       │
│  - See requirements & priorities    │
│  - BOM card shows DOORS section     │
└──────┬──────────────────────────────┘
       │
       ▼
3. Engineer Creates DOORS Package
    │
    ▼
┌─────────────────────────────────────┐
│  DOORS Register                     │
│  - Create equipment specification   │
│  - Add 50-100+ requirements         │
│  - Set compliance criteria          │
└──────┬──────────────────────────────┘
       │
       ▼
4. Automated BOM-DOORS Linking
    │
    ▼
┌─────────────────────────────────────┐
│  BomDoorsLinkingService             │
│  - Keyword matching algorithm       │
│  - "Transformer" → DOORS-TSS-TRF-001│
│  - "Circuit Breaker" → DOORS-CB-001 │
│  - "Cable" → DOORS-CABLE-001        │
└──────┬──────────────────────────────┘
       │
       ▼
5. Manual Override (Optional)
    │
    ▼
┌─────────────────────────────────────┐
│  DoorsLinkingModal                  │
│  - User selects correct DOORS pkg   │
│  - Override automated link          │
│  - Update BOM item's doors_id       │
└──────┬──────────────────────────────┘
       │
       ▼
6. BOM Card Enhanced
    │
    ▼
┌─────────────────────────────────────┐
│  Material Tracking Display          │
│  ┌───────────────────────────────┐  │
│  │ Material Card                 │  │
│  │ - Name, Qty, Rate             │  │
│  │ ┌──────────────────────────┐  │  │
│  │ │ DOORS Section            │  │  │
│  │ │ - DOORS ID               │  │  │
│  │ │ - Compliance: 94%        │  │  │
│  │ │ - [View Details →]       │  │  │
│  │ └──────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       ▼
7. Navigate to DOORS Detail
    │
    ▼
┌─────────────────────────────────────┐
│  DOORS Detail Screen                │
│  - Full equipment specification     │
│  - All 100 requirements             │
│  - Compliance by category           │
│  - Edit capabilities                │
└──────┬──────────────────────────────┘
       │
       ▼
8. Create RFQ from DOORS
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ Create Screen                  │
│  (Currently has bug - use demo data)│
│  - Select DOORS package             │
│  - Auto-populate tech specs         │
│  - Select vendors                   │
│  - Set closing date                 │
└──────┬──────────────────────────────┘
       │
       ▼
9. Issue RFQ to Vendors
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ Management                     │
│  - Status: Draft → Issued           │
│  - Vendors receive RFQ (future)     │
│  - Closing date countdown           │
└──────┬──────────────────────────────┘
       │
       ▼
10. Vendor Quote Submission
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ Vendor Quotes                  │
│  - Price quotation                  │
│  - Technical compliance %           │
│  - Lead time                        │
│  - Payment terms                    │
│  - Deviations noted                 │
└──────┬──────────────────────────────┘
       │
       ▼
11. Quote Evaluation
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ Detail - Evaluation Tab        │
│  - Technical scoring (60% weight)   │
│  - Commercial scoring (40% weight)  │
│  - Overall score calculation        │
│  - Auto-ranking (L1, L2, L3)        │
└──────┬──────────────────────────────┘
       │
       ▼
12. Award Contract
    │
    ▼
┌─────────────────────────────────────┐
│  RFQ Award                          │
│  - Select L1 vendor                 │
│  - Record awarded value             │
│  - Status: Evaluated → Awarded      │
│  - Create PO (future feature)       │
└──────┬──────────────────────────────┘
       │
       ▼
13. Update DOORS Package
    │
    ▼
┌─────────────────────────────────────┐
│  DOORS Package                      │
│  - Link RFQ number                  │
│  - Record selected vendor           │
│  - Track PO status                  │
│  - Monitor delivery                 │
└──────┬──────────────────────────────┘
       │
       ▼
14. Material Receipt (Future)
    │
    ▼
┌─────────────────────────────────────┐
│  Inventory Management               │
│  - GRN processing                   │
│  - Quality inspection               │
│  - Stock update                     │
│  - Invoice matching                 │
└─────────────────────────────────────┘
```

---

## Summary

This document provides comprehensive flow diagrams for all major workflows in the Construction Site Progress Tracker. These flows demonstrate:

1. **Robust Authentication** - Multi-layer security with JWT
2. **Role-Based Segregation** - Clear separation of duties
3. **Offline-First Architecture** - Seamless offline/online transitions
4. **End-to-End Integration** - BOM → DOORS → RFQ → PO workflow
5. **Intelligent Automation** - Critical path calculation, auto-linking
6. **Reliable Sync** - Retry logic, conflict resolution, DLQ
7. **Comprehensive Reporting (v2.8)** - Single PDF with progress, hindrances, and inspections

**Recent Updates**:
- **v2.8 (Nov 2025)**: Enhanced daily reports to include progress updates, hindrances, and site inspections in a single comprehensive PDF with photos
- **v2.7 (Nov 2025)**: Added photo capture capability to progress updates
- **v2.6 (Nov 2025)**: PDF viewer and share functionality for reports

**Key Takeaway**: The application has a well-designed architecture with strong foundations. The primary need is to complete placeholder features and fix the RFQ creation bug to achieve full production readiness.

---

**Related Documents**:
- COMPREHENSIVE_GAP_ANALYSIS_V2.5.md
- ARCHITECTURE_UNIFIED.md
- README.md
