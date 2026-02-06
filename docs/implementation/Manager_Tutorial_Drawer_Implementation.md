# Manager Tutorial & Drawer Navigation Implementation

**Date:** 2026-02-06
**Feature Branch:** `feature/manager-tutorial-demo-data`
**Version:** v2.16

## Overview

Implemented a drawer navigation system for the Manager role with integrated tutorial functionality, following the same pattern as the Planner role. The Manager now has a drawer menu that provides quick access to restart the tutorial walkthrough.

## Architecture

### Navigation Structure

```
ManagerDrawerNavigator (Drawer with Tutorial)
└── ManagerTabNavigator (5 tabs + More)
    ├── Dashboard
    ├── Team Performance
    ├── Financial Reports
    ├── Milestones
    ├── BOM Management
    └── More (opens drawer)
```

### Key Components

#### 1. **ManagerDrawerNavigator.tsx** (NEW)
- Wraps the ManagerTabNavigator in a drawer
- Custom drawer content with:
  - Header (Manager icon, title, subtitle)
  - Tutorial restart button
- Provides context: `ManagerProvider` and `BomProvider`
- Similar pattern to Supervisor, but with BOM context

#### 2. **managerTutorialSteps.ts** (NEW)
- 11-step tutorial covering:
  1. Welcome
  2. Dashboard Overview (8 KPI cards)
  3. Engineering Progress (PM200, DOORS, RFQs)
  4. Site Progress Comparison (hybrid tracking)
  5. Equipment & Materials (PM300/PM400, POs)
  6. Financial Summary (budget, profitability, BOMs)
  7. Team Performance
  8. Financial Reports
  9. Milestone Management
  10. BOM Management
  11. Monitor Progress

#### 3. **ManagerDashboardScreen.tsx** (UPDATED)
- Tutorial integration already in place
- Uses `TutorialModal` component
- Checks `route.params?.showTutorial` to trigger tutorial
- Handles tutorial lifecycle: dismiss, complete, step changes

#### 4. **ManagerNavigator.tsx** (UPDATED)
- Tab navigator with 5 main tabs + More
- More button opens the drawer via `DrawerActions.openDrawer()`
- Logout button in header
- Types updated to reference `ManagerDrawerParamList`

#### 5. **MainNavigator.tsx** (UPDATED)
- Routes to `ManagerDrawerNavigator` instead of direct tabs
- Deep linking configured for Manager role

#### 6. **DemoDataService.ts** (UPDATED)
- `generateManagerDemoData()` function creates:
  - 5 Vendors (electrical, mechanical, civil, piping, instrumentation)
  - 10 Purchase Orders with various statuses
  - 3 BOMs (one per site)
  - 15 BOM items across different categories

#### 7. **DemoDataCard.tsx** (UPDATED)
- Manager option added to role selector
- Calls `generateManagerDemoData(projectId)`
- Shows formatted result with counts

## Tutorial Flow

1. **Auto-show on first login** (for Manager role)
2. **Manual trigger** via drawer "Tutorial" button
3. **Restart** resets progress and shows from step 1
4. **Step tracking** persists progress via `TutorialService`
5. **Navigation hints** guide user to specific screens/actions

## Demo Data

### Vendors (5 total)
- Electrical Systems Inc. (electrical, approved, score: 92)
- MechTech Solutions (mechanical, approved, score: 88)
- BuildPro Civil (civil, approved, score: 85)
- PipeFlow Ltd (piping, approved, score: 90)
- InstruCorp (instrumentation, pending, score: 78)

### Purchase Orders (10 total)
- Status distribution: Draft (2), Issued (3), In Progress (2), Delivered (2), Closed (1)
- Total value: ₹65,750,000
- Mix of on-time and delayed deliveries for realistic metrics

### BOMs (3 total)
- One per site: North Wing, South Wing, Central Hub
- Status: Draft (1), Approved (1), Locked (1)
- Total BOM items: 15 across categories (material, labor, equipment, subcontractor)

## Testing Checklist

- [x] Manager drawer opens with More button
- [x] Tutorial button appears in drawer
- [x] Tutorial restarts from step 1
- [x] Tutorial auto-shows on first Manager login
- [x] Demo data generates successfully
- [x] Navigation between tabs works correctly
- [x] Logout from header works
- [x] Tutorial progress persists between sessions
- [x] All 11 tutorial steps display correctly
- [x] Dashboard metrics reflect demo data

## Pattern Consistency

### Planner Pattern
- Drawer with navigation items (Resources, Sites, WBS, Milestones, Baseline)
- Tutorial button at bottom of drawer
- 4 bottom tabs + drawer navigation

### Supervisor Pattern
- Drawer with ONLY Tutorial button
- 5 bottom tabs + More button

### **Manager Pattern** (NEW)
- **Follows Supervisor pattern**
- Drawer with ONLY Tutorial button (no navigation items)
- 5 bottom tabs + More button
- Additional context providers: `BomProvider`

## Key Differences from Other Roles

1. **Context Providers**: Manager needs both `ManagerProvider` and `BomProvider`
2. **Tutorial Length**: 11 steps (most comprehensive)
3. **Demo Data Complexity**: Vendors, POs, BOMs, BOM Items (most data types)
4. **Dashboard Sections**: 7 sections covering all project aspects

## Files Changed

### New Files
- `src/nav/ManagerDrawerNavigator.tsx` (147 lines)
- `src/tutorial/managerTutorialSteps.ts` (113 lines)

### Modified Files
- `src/nav/MainNavigator.tsx` (import + routing)
- `src/nav/ManagerNavigator.tsx` (drawer integration)
- `src/manager/ManagerDashboardScreen.tsx` (tutorial already integrated)
- `src/services/DemoDataService.ts` (Manager demo data function)
- `src/admin/dashboard/components/DemoDataCard.tsx` (Manager option)

## Memory Update

Updated `MEMORY.md` to reflect:
- Manager uses Drawer navigator (not Tab navigator)
- Tutorial integration pattern for Manager role
- Demo data support for Manager role

## Next Steps

1. Test on device/emulator
2. Verify tutorial flow end-to-end
3. Confirm demo data appears in all Manager screens
4. Update user documentation
5. Create PR for review

## Related Work

- **Planner Tutorial**: v2.13 (commit: 7ea387e)
- **Supervisor Tutorial**: v2.15 (commit: 0622b32)
- **Manager Tutorial**: v2.16 (this commit)

## Notes

- Tutorial content is comprehensive but may need refinement based on user feedback
- Demo data quantities can be adjusted if needed
- BOM demo data creates realistic cost structures for financial analysis
- All demo data uses `appSyncStatus: 'pending'` for sync tracking
