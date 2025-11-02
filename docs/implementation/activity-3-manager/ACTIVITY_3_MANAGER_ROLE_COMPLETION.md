# Activity 3: Manager Role Completion

**Phase:** Phase 1 - Critical Path
**Activity Duration:** 8 weeks (40 working days)
**Priority:** 🔴 CRITICAL - Production Blocker
**Prerequisites:** Activity 1 (Security) complete, Activity 2 (Sync) recommended but not required
**Depends On:** Security implementation, Database models
**Blocks:** Manager user adoption (25% of target users)

---

## 📋 Overview

### Current State (Gap Analysis Reference: Lines 84-96, 152-169)

**Critical Problem:**
- ❌ 3 of 4 screens are empty stubs
- ❌ ProjectOverviewScreen shows **hardcoded demo data** (no DB integration)
- ❌ TeamManagementScreen: 0% functional - Complete rewrite needed
- ❌ FinancialReportsScreen: 0% functional - Complete rewrite needed
- ❌ ResourceAllocationScreen: 0% functional - Complete rewrite needed
- ❌ Manager Role Completion: **25%** (0 of 4 screens functional)

**Impact:** 25% of target users (managers) cannot use the app

### Target State

**After Activity 3 Completion:**
- ✅ TeamManagementScreen: 100% functional - Team assignment, approval workflows
- ✅ FinancialReportsScreen: 100% functional - Budget tracking, cost analysis
- ✅ ResourceAllocationScreen: 100% functional - Cross-project resource management
- ✅ ProjectOverviewScreen: 100% functional - Real DB data, metrics, KPIs
- ✅ Manager Role Completion: **100%** (4 of 4 screens functional)

---

## 🎯 Objectives

1. **TeamManagementScreen (2 weeks)**
   - View all project teams
   - Assign team members to sites
   - Manage team roles and permissions
   - Approval workflows for resource requests
   - Team performance metrics

2. **FinancialReportsScreen (2 weeks)**
   - Budget tracking per project/site
   - Cost analysis and variance reports
   - Expense categorization
   - Budget vs actual comparison
   - Financial forecasting

3. **ResourceAllocationScreen (2 weeks)**
   - Cross-project resource visibility
   - Allocate resources to multiple projects
   - Resource utilization metrics
   - Conflict detection (over-allocation)
   - Resource planning calendar

4. **ProjectOverviewScreen DB Integration (1 week)**
   - Replace hardcoded demo data with real DB queries
   - Real-time project metrics (progress, budget, schedule)
   - KPI dashboard (completion %, cost variance, schedule variance)
   - Multi-project summary view
   - Drill-down to site details

---

## 📊 Gap Analysis Alignment

**Reference:** `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` Section "2. Manager Role Incomplete" (Lines 152-169)

**Gap Analysis Estimates:**
- Effort: 6-8 weeks ✅
- Tasks identified: 4 tasks ✅
- Priority: CRITICAL ✅

**This Activity Addresses:**
- TeamManagementScreen (2 weeks) → Week 1-2
- FinancialReportsScreen (2 weeks) → Week 3-4
- ResourceAllocationScreen (2 weeks) → Week 5-6
- ProjectOverviewScreen DB integration (1 week) → Week 7
- Testing & polish (1 week) → Week 8

---

## 🗓️ Week-by-Week Implementation Plan

### **Week 1-2: TeamManagementScreen**

#### Week 1, Days 1-3: Database Models & Schema
**Tasks:**
- [ ] Create `TeamModel.ts` (team metadata)
- [ ] Create `TeamMemberModel.ts` (user-team assignment)
- [ ] Create `ResourceRequestModel.ts` (approval workflow)
- [ ] Update schema to v20
- [ ] Create migrations
- [ ] Seed test data

**Database Schema:**

**teams table:**
```typescript
teams {
  id: string (primary key)
  name: string
  project_id: string (foreign key → projects)
  site_id: string (nullable, foreign key → sites)
  manager_id: string (foreign key → users)
  created_at: number
  updated_at: number
}
```

**team_members table:**
```typescript
team_members {
  id: string (primary key)
  team_id: string (foreign key → teams)
  user_id: string (foreign key → users)
  role: string (supervisor, worker, engineer, etc.)
  assigned_at: number
  is_active: boolean
  created_at: number
  updated_at: number
}
```

**resource_requests table:**
```typescript
resource_requests {
  id: string (primary key)
  site_id: string (foreign key → sites)
  requested_by: string (foreign key → users)
  resource_type: string (labor, equipment, material)
  quantity: number
  justification: string
  status: string (pending, approved, rejected)
  approved_by: string (nullable, foreign key → users)
  approved_at: number (nullable)
  created_at: number
  updated_at: number
}
```

**Deliverables:**
- Models: `models/TeamModel.ts`, `models/TeamMemberModel.ts`, `models/ResourceRequestModel.ts`
- Migrations: `migrations/v20_add_team_management_tables.ts`
- Seed script: `services/db/SeedTeamData.ts`

**Acceptance Criteria:**
- All models created with correct fields
- Migrations run without errors
- Foreign key relationships work
- Test data seeded (3 teams, 10 team members)

---

#### Week 1, Days 4-5: TeamManagementScreen UI (Part 1)
**Tasks:**
- [ ] Create screen: `src/manager/TeamManagementScreen.tsx`
- [ ] Display list of teams (by project)
- [ ] Add team creation dialog
- [ ] Add team editing dialog
- [ ] Add team deletion (with confirmation)
- [ ] Test CRUD operations

**UI Components:**
```
TeamManagementScreen
├── Project Selector (Dropdown)
├── Team List (FlatList)
│   ├── TeamCard
│   │   ├── Team Name
│   │   ├── Manager Badge
│   │   ├── Member Count
│   │   ├── Edit Button
│   │   └── Delete Button
│   └── Add Team FAB
└── TeamFormDialog
    ├── Name Input
    ├── Manager Selector
    ├── Site Selector (optional)
    ├── Save Button
    └── Cancel Button
```

**Deliverables:**
- Screen: `src/manager/TeamManagementScreen.tsx`
- Component: `src/manager/components/TeamCard.tsx`
- Dialog: `src/manager/components/TeamFormDialog.tsx`

**Acceptance Criteria:**
- Team list displays correctly
- Create team works
- Edit team works
- Delete team works (with confirmation)
- Empty state shown when no teams

---

#### Week 2, Days 6-8: Team Member Assignment
**Tasks:**
- [ ] Add team member list to TeamCard (expandable)
- [ ] Create member assignment dialog
- [ ] Implement user search/filter for assignment
- [ ] Add member role selection
- [ ] Add member removal (de-activate)
- [ ] Test member assignment flow

**UI Components:**
```
TeamCard (Expanded)
├── Team Info
├── Member List
│   ├── MemberChip
│   │   ├── User Name
│   │   ├── Role Badge
│   │   └── Remove Icon
│   └── Add Member Button
└── MemberAssignmentDialog
    ├── User Search
    ├── User List (available users)
    ├── Role Selector
    ├── Assign Button
    └── Cancel Button
```

**Deliverables:**
- Component: `src/manager/components/MemberChip.tsx`
- Dialog: `src/manager/components/MemberAssignmentDialog.tsx`
- Service: `services/team/TeamService.ts` (assignment logic)

**Acceptance Criteria:**
- Team members displayed in team card
- Add member works (search + assign)
- Remove member works (de-activate)
- Role assignment works
- No duplicate assignments

---

#### Week 2, Days 9-10: Approval Workflow
**Tasks:**
- [ ] Create ResourceRequestListScreen (optional sub-screen)
- [ ] Display pending resource requests
- [ ] Add approve/reject actions
- [ ] Add request details dialog
- [ ] Add notification badge for pending requests
- [ ] Test approval workflow

**UI Components:**
```
TeamManagementScreen Header
├── Pending Requests Badge (notification)
└── Requests Button

ResourceRequestDialog
├── Request Details
│   ├── Requested By
│   ├── Site Name
│   ├── Resource Type
│   ├── Quantity
│   └── Justification
├── Approve Button
└── Reject Button
```

**Deliverables:**
- Dialog: `src/manager/components/ResourceRequestDialog.tsx`
- Service: `services/team/ResourceRequestService.ts`

**Acceptance Criteria:**
- Pending requests displayed
- Approve request works
- Reject request works
- Badge shows pending count
- Approved/rejected requests removed from list

---

### **Week 3-4: FinancialReportsScreen**

#### Week 3, Days 11-13: Database Models for Budgets
**Tasks:**
- [ ] Create `BudgetModel.ts` (project/site budgets)
- [ ] Create `ExpenseModel.ts` (actual expenses)
- [ ] Create `CostCategoryModel.ts` (expense categories)
- [ ] Update schema to v21
- [ ] Create migrations
- [ ] Seed test data

**Database Schema:**

**budgets table:**
```typescript
budgets {
  id: string (primary key)
  project_id: string (foreign key → projects)
  site_id: string (nullable, foreign key → sites)
  category_id: string (foreign key → cost_categories)
  amount: number
  start_date: number
  end_date: number
  created_at: number
  updated_at: number
}
```

**expenses table:**
```typescript
expenses {
  id: string (primary key)
  project_id: string (foreign key → projects)
  site_id: string (nullable, foreign key → sites)
  category_id: string (foreign key → cost_categories)
  amount: number
  description: string
  expense_date: number
  submitted_by: string (foreign key → users)
  approved_by: string (nullable, foreign key → users)
  created_at: number
  updated_at: number
}
```

**cost_categories table:**
```typescript
cost_categories {
  id: string (primary key)
  name: string (Labor, Materials, Equipment, Overhead, etc.)
  code: string
  created_at: number
  updated_at: number
}
```

**Deliverables:**
- Models: `models/BudgetModel.ts`, `models/ExpenseModel.ts`, `models/CostCategoryModel.ts`
- Migrations: `migrations/v21_add_financial_tables.ts`
- Seed script: `services/db/SeedFinancialData.ts`

**Acceptance Criteria:**
- All models created
- Migrations run without errors
- Foreign keys work
- Test data seeded (budgets + expenses for 3 projects)

---

#### Week 3, Days 14-15: FinancialReportsScreen UI (Part 1)
**Tasks:**
- [ ] Create screen: `src/manager/FinancialReportsScreen.tsx`
- [ ] Add project/site selector
- [ ] Display budget summary cards (Total Budget, Total Spent, Variance)
- [ ] Add date range filter
- [ ] Add category breakdown (pie chart or bar chart)
- [ ] Test budget calculations

**UI Components:**
```
FinancialReportsScreen
├── Project/Site Selector
├── Date Range Filter
├── Budget Summary Cards
│   ├── Total Budget Card
│   ├── Total Spent Card
│   └── Variance Card (Budget - Spent)
├── Category Breakdown Chart
│   └── (Labor, Materials, Equipment, Overhead)
└── Expense List
    └── ExpenseCard
        ├── Category
        ├── Amount
        ├── Description
        └── Date
```

**Budget Calculation Logic:**
```typescript
Total Budget = SUM(budgets.amount) WHERE project_id = X
Total Spent = SUM(expenses.amount) WHERE project_id = X
Variance = Total Budget - Total Spent
Variance % = (Variance / Total Budget) * 100
```

**Deliverables:**
- Screen: `src/manager/FinancialReportsScreen.tsx`
- Component: `src/manager/components/BudgetSummaryCards.tsx`
- Component: `src/manager/components/CategoryBreakdownChart.tsx`
- Service: `services/financial/BudgetService.ts`

**Acceptance Criteria:**
- Budget summary cards display correct calculations
- Date range filter works
- Category breakdown chart displays
- Variance calculated correctly
- Empty state shown when no data

---

#### Week 4, Days 16-18: Expense Management
**Tasks:**
- [ ] Add expense list to FinancialReportsScreen
- [ ] Create expense creation dialog
- [ ] Add expense approval workflow (similar to resource requests)
- [ ] Add expense editing/deletion
- [ ] Add export to CSV (optional)
- [ ] Test expense management

**UI Components:**
```
FinancialReportsScreen (continued)
├── Expense List (FlatList)
│   └── ExpenseCard
│       ├── Category Badge
│       ├── Amount (highlighted)
│       ├── Description
│       ├── Date
│       ├── Submitted By
│       ├── Edit Button
│       └── Delete Button
├── Add Expense FAB
└── ExpenseFormDialog
    ├── Category Selector
    ├── Amount Input
    ├── Description Input
    ├── Date Picker
    ├── Save Button
    └── Cancel Button
```

**Deliverables:**
- Component: `src/manager/components/ExpenseCard.tsx`
- Dialog: `src/manager/components/ExpenseFormDialog.tsx`
- Service: `services/financial/ExpenseService.ts`

**Acceptance Criteria:**
- Expense list displays correctly
- Create expense works
- Edit expense works
- Delete expense works
- Budget summary updates in real-time

---

#### Week 4, Days 19-20: Cost Analysis & Variance Reports
**Tasks:**
- [ ] Add budget vs actual comparison table
- [ ] Add variance analysis (by category)
- [ ] Add trend chart (spending over time)
- [ ] Add forecast calculation (based on burn rate)
- [ ] Test variance reports

**UI Components:**
```
FinancialReportsScreen (continued)
├── Budget vs Actual Table
│   └── For each category:
│       ├── Budget Amount
│       ├── Actual Spent
│       ├── Variance Amount
│       └── Variance %
├── Spending Trend Chart
│   └── Line chart (X: time, Y: cumulative spending)
└── Forecast Card
    ├── Current Burn Rate
    ├── Projected Total Cost
    └── Budget Overrun Warning (if any)
```

**Forecast Calculation:**
```typescript
Burn Rate = Total Spent / Days Elapsed
Days Remaining = Project End Date - Today
Projected Total = Total Spent + (Burn Rate * Days Remaining)
Overrun = Projected Total - Total Budget (if positive)
```

**Deliverables:**
- Component: `src/manager/components/BudgetVsActualTable.tsx`
- Component: `src/manager/components/SpendingTrendChart.tsx`
- Component: `src/manager/components/ForecastCard.tsx`
- Service: `services/financial/ForecastService.ts`

**Acceptance Criteria:**
- Budget vs actual table displays correctly
- Variance calculated correctly (by category)
- Trend chart displays spending over time
- Forecast calculation accurate
- Overrun warning shown when applicable

---

### **Week 5-6: ResourceAllocationScreen**

#### Week 5, Days 21-23: Database Models for Resources
**Tasks:**
- [ ] Create `ResourceModel.ts` (human resources)
- [ ] Create `ResourceAllocationModel.ts` (assignments)
- [ ] Create `ResourceAvailabilityModel.ts` (calendar/capacity)
- [ ] Update schema to v22
- [ ] Create migrations
- [ ] Seed test data

**Database Schema:**

**resources table:**
```typescript
resources {
  id: string (primary key)
  user_id: string (nullable, foreign key → users)
  name: string
  type: string (human, equipment, material)
  skill_set: string (JSON array: ['Concrete', 'Steel', 'Electrical'])
  cost_per_day: number
  is_available: boolean
  created_at: number
  updated_at: number
}
```

**resource_allocations table:**
```typescript
resource_allocations {
  id: string (primary key)
  resource_id: string (foreign key → resources)
  project_id: string (foreign key → projects)
  site_id: string (nullable, foreign key → sites)
  wbs_item_id: string (nullable, foreign key → wbs_items)
  start_date: number
  end_date: number
  allocation_percentage: number (0-100, allows partial allocation)
  created_at: number
  updated_at: number
}
```

**resource_availability table:**
```typescript
resource_availability {
  id: string (primary key)
  resource_id: string (foreign key → resources)
  date: number
  available_hours: number (0-8)
  is_available: boolean
  notes: string (nullable, e.g., "On leave", "Sick")
  created_at: number
  updated_at: number
}
```

**Deliverables:**
- Models: `models/ResourceModel.ts`, `models/ResourceAllocationModel.ts`, `models/ResourceAvailabilityModel.ts`
- Migrations: `migrations/v22_add_resource_tables.ts`
- Seed script: `services/db/SeedResourceData.ts`

**Acceptance Criteria:**
- All models created
- Migrations run without errors
- Foreign keys work
- Test data seeded (10 resources, 5 allocations)

---

#### Week 5, Days 24-25: ResourceAllocationScreen UI (Part 1)
**Tasks:**
- [ ] Create screen: `src/manager/ResourceAllocationScreen.tsx`
- [ ] Display resource list (all resources)
- [ ] Add resource creation dialog
- [ ] Add resource editing dialog
- [ ] Add resource filtering (by type, skill, availability)
- [ ] Test resource CRUD

**UI Components:**
```
ResourceAllocationScreen
├── Filter Bar
│   ├── Type Filter (Human, Equipment, Material)
│   ├── Skill Filter (Multi-select)
│   └── Availability Toggle (Show only available)
├── Resource List (FlatList)
│   └── ResourceCard
│       ├── Resource Name
│       ├── Type Badge
│       ├── Skill Chips
│       ├── Cost per Day
│       ├── Availability Status
│       ├── Edit Button
│       └── Allocate Button
└── Add Resource FAB
```

**Deliverables:**
- Screen: `src/manager/ResourceAllocationScreen.tsx`
- Component: `src/manager/components/ResourceCard.tsx`
- Dialog: `src/manager/components/ResourceFormDialog.tsx`
- Service: `services/resource/ResourceService.ts`

**Acceptance Criteria:**
- Resource list displays correctly
- Create resource works
- Edit resource works
- Delete resource works
- Filters work (type, skill, availability)

---

#### Week 6, Days 26-28: Resource Allocation Logic
**Tasks:**
- [ ] Create allocation assignment dialog
- [ ] Add project/site selector for allocation
- [ ] Add date range picker (start/end date)
- [ ] Add allocation percentage slider (0-100%)
- [ ] Implement over-allocation detection
- [ ] Test allocation assignment

**UI Components:**
```
AllocationDialog
├── Resource Info (read-only)
├── Project Selector
├── Site Selector (optional)
├── WBS Item Selector (optional)
├── Start Date Picker
├── End Date Picker
├── Allocation Percentage Slider (0-100%)
├── Current Allocations Warning (if over-allocated)
├── Assign Button
└── Cancel Button
```

**Over-Allocation Detection:**
```typescript
// For a given resource and date range:
Total Allocation % = SUM(allocation_percentage) for overlapping allocations

If Total Allocation % > 100%:
  Show warning: "This resource is over-allocated (150%)"
  Allow override with confirmation
```

**Deliverables:**
- Dialog: `src/manager/components/AllocationDialog.tsx`
- Service: `services/resource/AllocationService.ts` (over-allocation detection)

**Acceptance Criteria:**
- Allocation dialog displays correctly
- Project/site selection works
- Date range selection works
- Allocation percentage works
- Over-allocation warning shown
- Allocation saved correctly

---

#### Week 6, Days 29-30: Resource Utilization & Calendar View
**Tasks:**
- [ ] Add resource utilization metrics
- [ ] Create resource calendar view (optional - can defer to Phase 2)
- [ ] Add allocation list per resource (expandable card)
- [ ] Add de-allocation action
- [ ] Test resource utilization calculations

**UI Components:**
```
ResourceCard (Expanded)
├── Resource Info
├── Utilization Metrics
│   ├── Total Allocations Count
│   ├── Average Allocation %
│   └── Next Available Date
├── Allocation List
│   └── AllocationChip
│       ├── Project Name
│       ├── Date Range
│       ├── Allocation %
│       └── Remove Button
└── Calendar View (optional)
    └── Grid showing allocations by week
```

**Utilization Calculation:**
```typescript
Total Allocations = COUNT(resource_allocations WHERE resource_id = X)
Average Allocation % = AVG(allocation_percentage) for active allocations
Next Available Date = MIN(end_date) WHERE allocation_percentage < 100%
```

**Deliverables:**
- Component: `src/manager/components/AllocationChip.tsx`
- Component: `src/manager/components/ResourceCalendarView.tsx` (optional)
- Service: `services/resource/UtilizationService.ts`

**Acceptance Criteria:**
- Utilization metrics calculated correctly
- Allocation list displays for each resource
- De-allocation works
- Next available date calculated correctly
- Calendar view displays (if implemented)

---

### **Week 7: ProjectOverviewScreen DB Integration**

#### Days 31-33: Replace Mock Data with Real DB Queries
**Tasks:**
- [ ] Remove hardcoded demo data from ProjectOverviewScreen
- [ ] Query real project data from database
- [ ] Calculate real metrics (progress, budget, schedule)
- [ ] Add multi-project selector
- [ ] Test with real data

**Current State (Mock Data):**
```typescript
// ProjectOverviewScreen.tsx currently has hardcoded:
const mockData = {
  totalProjects: 12,
  activeProjects: 8,
  completionRate: 67,
  budget: 5000000,
  spent: 3200000,
  // ... etc
}
```

**Target State (Real DB Data):**
```typescript
// Query projects from database
const projects = await database.collections.get('projects').query().fetch()
const sites = await database.collections.get('sites').query().fetch()
const items = await database.collections.get('items').query().fetch()
const budgets = await database.collections.get('budgets').query().fetch()
const expenses = await database.collections.get('expenses').query().fetch()

// Calculate real metrics
const totalProjects = projects.length
const activeProjects = projects.filter(p => p.status === 'active').length
const completionRate = calculateAverageCompletion(projects)
const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
```

**Deliverables:**
- Updated: `src/manager/ProjectOverviewScreen.tsx`
- Service: `services/manager/OverviewMetricsService.ts`

**Acceptance Criteria:**
- No hardcoded data remains
- All metrics calculated from DB
- Multi-project selector works
- Metrics update in real-time
- Empty state shown when no projects

---

#### Days 34-35: Add Real-Time KPI Dashboard
**Tasks:**
- [ ] Add KPI cards (Completion %, Cost Variance, Schedule Variance)
- [ ] Add progress charts (per project)
- [ ] Add recent activities feed
- [ ] Add alerts/warnings (budget overrun, schedule delays)
- [ ] Test KPI calculations

**KPI Calculations:**
```typescript
Completion % = (SUM(items.actual_progress) / SUM(items.total_quantity)) * 100

Cost Variance = Total Budget - Total Spent
Cost Variance % = (Cost Variance / Total Budget) * 100

Schedule Variance = Planned Completion Date - Actual Completion Date
Schedule Variance Days = (Schedule Variance / 1000 / 60 / 60 / 24)

Status:
  - On Track: Schedule Variance <= 0, Cost Variance >= 0
  - At Risk: Schedule Variance 1-7 days, Cost Variance -10% to 0%
  - Critical: Schedule Variance > 7 days, Cost Variance < -10%
```

**Deliverables:**
- Component: `src/manager/components/KPIDashboard.tsx`
- Component: `src/manager/components/ProgressChart.tsx`
- Component: `src/manager/components/RecentActivitiesFeed.tsx`
- Component: `src/manager/components/AlertsPanel.tsx`
- Service: `services/manager/KPIService.ts`

**Acceptance Criteria:**
- KPI cards display real calculations
- Progress charts display per project
- Recent activities feed shows latest updates
- Alerts shown for overruns/delays
- Drill-down to site details works

---

### **Week 8: Testing & Polish**

#### Days 36-38: Comprehensive Testing
**Tasks:**
- [ ] Write unit tests for all Manager services
- [ ] Write integration tests for all 4 screens
- [ ] Write E2E tests for critical flows
- [ ] Test with large datasets (100+ projects)
- [ ] Performance testing
- [ ] Test sync integration (if Activity 2 complete)

**Test Suites:**

**1. TeamManagementScreen Tests**
```typescript
✓ Display list of teams
✓ Create new team
✓ Edit existing team
✓ Delete team (with confirmation)
✓ Assign member to team
✓ Remove member from team
✓ Approve resource request
✓ Reject resource request
✓ Filter teams by project
```

**2. FinancialReportsScreen Tests**
```typescript
✓ Display budget summary cards
✓ Calculate total budget correctly
✓ Calculate total spent correctly
✓ Calculate variance correctly
✓ Create new expense
✓ Edit existing expense
✓ Delete expense
✓ Filter expenses by date range
✓ Filter expenses by category
✓ Display budget vs actual table
✓ Display spending trend chart
✓ Calculate forecast correctly
```

**3. ResourceAllocationScreen Tests**
```typescript
✓ Display resource list
✓ Create new resource
✓ Edit existing resource
✓ Delete resource
✓ Filter resources by type
✓ Filter resources by skill
✓ Allocate resource to project
✓ De-allocate resource
✓ Detect over-allocation
✓ Calculate utilization correctly
✓ Calculate next available date
```

**4. ProjectOverviewScreen Tests**
```typescript
✓ Display real project data (not mock)
✓ Calculate completion % correctly
✓ Calculate cost variance correctly
✓ Calculate schedule variance correctly
✓ Display KPI dashboard
✓ Display progress charts
✓ Display recent activities
✓ Display alerts for overruns/delays
✓ Drill down to site details
```

**Deliverables:**
- Test suites in `__tests__/manager/`
- Integration tests
- E2E tests

**Acceptance Criteria:**
- All unit tests passing (coverage > 80%)
- All integration tests passing
- All E2E tests passing
- Performance acceptable (load 100 projects < 3s)

---

#### Days 39-40: Documentation & Final Polish
**Tasks:**
- [ ] Write Manager role user guide
- [ ] Document all new database models
- [ ] Update ARCHITECTURE_UNIFIED.md
- [ ] Create Manager screen demo video/screenshots
- [ ] Final UX polish (animations, loading states)
- [ ] Final bug fixes

**Deliverables:**
- User guide: `docs/user-guides/MANAGER_ROLE_GUIDE.md`
- Model docs: `docs/database/MANAGER_ROLE_MODELS.md`
- Updated: `ARCHITECTURE_UNIFIED.md`
- Demo assets: `docs/screenshots/manager/`

**Acceptance Criteria:**
- User guide complete
- All models documented
- Architecture docs updated
- Demo video/screenshots created
- All animations smooth
- All loading states implemented
- No critical bugs

---

## 🧪 Testing Strategy

### Unit Tests
**Target Coverage: 80%+**

**Files to Test:**
- `services/team/TeamService.ts`
- `services/team/ResourceRequestService.ts`
- `services/financial/BudgetService.ts`
- `services/financial/ExpenseService.ts`
- `services/financial/ForecastService.ts`
- `services/resource/ResourceService.ts`
- `services/resource/AllocationService.ts`
- `services/resource/UtilizationService.ts`
- `services/manager/OverviewMetricsService.ts`
- `services/manager/KPIService.ts`

---

### Integration Tests
**Complete User Flows**

**Test Scenarios:**
1. **Team Management Flow**
   - Create team → Assign members → Approve request → View team
2. **Budget Tracking Flow**
   - Create budget → Add expenses → View variance → Check forecast
3. **Resource Allocation Flow**
   - Create resource → Allocate to project → Check utilization → De-allocate
4. **Project Overview Flow**
   - View dashboard → Check KPIs → Drill down to site → View details

---

## 📦 Deliverables Checklist

### Code Deliverables
- [ ] `src/manager/TeamManagementScreen.tsx`
- [ ] `src/manager/FinancialReportsScreen.tsx`
- [ ] `src/manager/ResourceAllocationScreen.tsx`
- [ ] Updated: `src/manager/ProjectOverviewScreen.tsx`
- [ ] 20+ new components in `src/manager/components/`
- [ ] 10+ new services in `services/`

### Database Deliverables
- [ ] Models: `TeamModel`, `TeamMemberModel`, `ResourceRequestModel`
- [ ] Models: `BudgetModel`, `ExpenseModel`, `CostCategoryModel`
- [ ] Models: `ResourceModel`, `ResourceAllocationModel`, `ResourceAvailabilityModel`
- [ ] Migrations: v20, v21, v22
- [ ] Seed scripts for all new tables

### Documentation Deliverables
- [ ] User guide: `docs/user-guides/MANAGER_ROLE_GUIDE.md`
- [ ] Model docs: `docs/database/MANAGER_ROLE_MODELS.md`
- [ ] Updated: `ARCHITECTURE_UNIFIED.md`
- [ ] Demo assets

### Testing Deliverables
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests

---

## 🚨 Risk Management

### Risk 1: Complex Budget Calculations
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Start with simple calculations (sum, average)
- Add complexity incrementally (variance, forecast)
- Extensive testing with edge cases

**Contingency:**
- Simplify forecast to linear projection
- Defer advanced analytics to Phase 2

---

### Risk 2: Resource Over-Allocation Edge Cases
**Probability:** High
**Impact:** Low
**Mitigation:**
- Clear over-allocation detection logic
- Allow overrides with confirmation
- Extensive testing of overlapping allocations

**Contingency:**
- Show warning but allow over-allocation
- Add manual conflict resolution UI

---

### Risk 3: Performance with Large Datasets
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Use FlatList with virtualization
- Pagination for large lists
- Lazy loading for charts

**Contingency:**
- Add loading skeletons
- Implement pagination if performance issues persist

---

## 🎯 Acceptance Criteria

### Activity 3 is complete when:

#### TeamManagementScreen
- [ ] Team CRUD operations functional
- [ ] Team member assignment works
- [ ] Approval workflow functional
- [ ] Performance metrics displayed

#### FinancialReportsScreen
- [ ] Budget summary calculated correctly
- [ ] Expense management functional
- [ ] Variance reports displayed
- [ ] Forecast calculated correctly

#### ResourceAllocationScreen
- [ ] Resource CRUD operations functional
- [ ] Allocation assignment works
- [ ] Over-allocation detection works
- [ ] Utilization metrics calculated correctly

#### ProjectOverviewScreen
- [ ] All mock data replaced with real DB queries
- [ ] KPI dashboard functional
- [ ] Progress charts displayed
- [ ] Alerts/warnings working

#### Testing
- [ ] Unit test coverage > 80%
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance acceptable

#### Documentation
- [ ] User guide complete
- [ ] Models documented
- [ ] Architecture docs updated

---

## 📞 Stakeholder Sign-Off

**Activity Owner:** [Name]
**Reviewer:** [Name]
**Approved By:** [Name]
**Approval Date:** [Date]

---

## 🔄 Dependencies for Next Activity

**Activity 4: Logistics Role Completion**

Activity 4 can start after Activity 3 or in parallel if you have 2+ developers.

**No hard dependencies** - Logistics role is independent of Manager role.

---

## 📚 Reference Documents

- `PROJECT_GAP_ANALYSIS_AND_ROADMAP.md` - Gap Analysis (Lines 152-169)
- `PHASE_1_MASTER_PLAN.md` - Overall Phase 1 plan
- `ACTIVITY_1_SECURITY_IMPLEMENTATION.md` - Security (prerequisite)
- `ACTIVITY_2_SYNC_SERVICE_IMPLEMENTATION.md` - Sync (optional)
- `ARCHITECTURE_UNIFIED.md` - Current architecture
- `DATABASE.md` - Database schema reference

---

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Created:** October 26, 2025
**Estimated Start:** [Date]
**Estimated Completion:** [Date + 8 weeks]
**Owner:** Development Team

---

**END OF ACTIVITY 3: MANAGER ROLE COMPLETION**
