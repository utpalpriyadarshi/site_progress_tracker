# Activity 3: Manager Role Completion - Execution Plan

## Executive Summary

**Objective**: Complete Manager role functionality from 25% to 100%

**Current Status**: 1/4 screens with mock data (ProjectOverviewScreen)

**Target Status**: 4 fully functional screens with real database integration

**Duration**: 8 weeks / 40 working days

**Scope**:
- 9 new database models
- 3 schema migrations (v20, v21, v22)
- 4 screens (3 new + 1 integration)
- 20+ new components
- 10+ new services
- Comprehensive test coverage

---

## Table of Contents

1. [Week 1-2: Team Management](#week-1-2-team-management)
2. [Week 3-4: Financial Reports](#week-3-4-financial-reports)
3. [Week 5-6: Resource Allocation](#week-5-6-resource-allocation)
4. [Week 7: Project Overview Integration](#week-7-project-overview-integration)
5. [Week 8: Testing & Polish](#week-8-testing--polish)
6. [Database Schema Design](#database-schema-design)
7. [Service Architecture](#service-architecture)
8. [Component Hierarchy](#component-hierarchy)
9. [Risk Mitigation](#risk-mitigation)
10. [Success Metrics](#success-metrics)

---

## Week 1-2: Team Management

**Duration**: Days 1-10

**Goal**: Enable managers to create teams, assign members, and manage resource requests

### Database Layer (Schema v20)

#### TeamModel
```typescript
static table = 'teams';
static associations = {
  site: { type: 'belongs_to', key: 'site_id' },
  members: { type: 'has_many', foreignKey: 'team_id' },
};

@field('name') name!: string;
@field('site_id') siteId!: string;
@field('team_lead_id') teamLeadId?: string;
@field('created_date') createdDate!: number; // timestamp
@field('status') status!: string; // active, inactive, disbanded
@field('specialization') specialization?: string; // electrical, plumbing, carpentry, etc.
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;
```

#### TeamMemberModel
```typescript
static table = 'team_members';
static associations = {
  team: { type: 'belongs_to', key: 'team_id' },
};

@field('team_id') teamId!: string;
@field('user_id') userId!: string; // reference to user
@field('role') role!: string; // lead, supervisor, worker
@field('assigned_date') assignedDate!: number; // timestamp
@field('end_date') endDate?: number; // timestamp (null if currently active)
@field('status') status!: string; // active, inactive, transferred
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;
```

#### ResourceRequestModel
```typescript
static table = 'resource_requests';

@field('requested_by') requestedBy!: string; // user_id
@field('site_id') siteId!: string;
@field('resource_type') resourceType!: string; // equipment, material, personnel
@field('resource_name') resourceName!: string;
@field('quantity') quantity!: number;
@field('priority') priority!: string; // low, medium, high, urgent
@field('requested_date') requestedDate!: number; // timestamp
@field('needed_by_date') neededByDate!: number; // timestamp
@field('approval_status') approvalStatus!: string; // pending, approved, rejected, fulfilled
@field('approved_by') approvedBy?: string; // user_id
@field('approval_date') approvalDate?: number; // timestamp
@field('rejection_reason') rejectionReason?: string;
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;
```

### Service Layer

#### TeamManagementService.ts
```typescript
Location: services/team/TeamManagementService.ts

Key Methods:
- createTeam(data: TeamData): Promise<TeamModel>
- updateTeam(teamId: string, data: Partial<TeamData>): Promise<TeamModel>
- deleteTeam(teamId: string): Promise<void>
- getTeamsBySite(siteId: string): Promise<TeamModel[]>
- getActiveTeams(): Promise<TeamModel[]>
- assignMember(teamId: string, userId: string, role: string): Promise<TeamMemberModel>
- removeMember(memberId: string): Promise<void>
- transferMember(memberId: string, newTeamId: string): Promise<TeamMemberModel>
- getTeamMembers(teamId: string): Promise<TeamMemberModel[]>
```

#### ResourceRequestService.ts
```typescript
Location: services/resource/ResourceRequestService.ts

Key Methods:
- createRequest(data: RequestData): Promise<ResourceRequestModel>
- getPendingRequests(): Promise<ResourceRequestModel[]>
- getRequestsBySite(siteId: string): Promise<ResourceRequestModel[]>
- approveRequest(requestId: string, approverId: string): Promise<ResourceRequestModel>
- rejectRequest(requestId: string, approverId: string, reason: string): Promise<ResourceRequestModel>
- markFulfilled(requestId: string): Promise<ResourceRequestModel>
- getRequestsByPriority(priority: string): Promise<ResourceRequestModel[]>
```

### UI Components

#### TeamManagementScreen.tsx
```typescript
Location: src/manager/TeamManagementScreen.tsx

Components:
- TeamListView: Display all teams with status indicators
- AddTeamModal: Form to create new team
- EditTeamModal: Form to update team details
- TeamMembersList: Show members assigned to selected team
- AssignMemberButton: Add members to team
- TeamStatsCard: Show team metrics (size, active members, site assignment)

Features:
- Filter teams by status (active/inactive)
- Filter teams by site
- Search teams by name
- View team composition
- Edit team details
- Disband/reactivate teams
```

#### TeamMemberAssignment.tsx
```typescript
Location: src/manager/components/TeamMemberAssignment.tsx

Components:
- AvailableUsersList: Show unassigned users
- RoleSelector: Select role for new member
- AssignmentConfirmation: Confirm assignment details

Features:
- Search available users
- Filter by role/specialization
- Preview team composition after assignment
- Validate team size constraints
```

#### ResourceRequestForm.tsx
```typescript
Location: src/manager/components/ResourceRequestForm.tsx

Fields:
- Resource type selector
- Resource name input
- Quantity input
- Priority selector
- Site selector
- Needed by date picker
- Notes textarea

Features:
- Validation (required fields, valid dates)
- Priority color coding
- Auto-fill based on site context
```

#### ApprovalQueue.tsx
```typescript
Location: src/manager/components/ApprovalQueue.tsx

Components:
- RequestCard: Display request details
- ApproveButton: Approve request
- RejectButton: Reject with reason modal
- FilterBar: Filter by priority/site/date

Features:
- Sort by priority/date
- Bulk approval (select multiple)
- Rejection reason required
- Status history tracking
```

### Migration Script

**File**: `models/schema/migrations/v20-team-management.ts`

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 20,
      steps: [
        {
          type: 'create_table',
          name: 'teams',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'team_lead_id', type: 'string', isOptional: true },
            { name: 'created_date', type: 'number' },
            { name: 'status', type: 'string' },
            { name: 'specialization', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'team_members',
          columns: [
            { name: 'team_id', type: 'string', isIndexed: true },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'role', type: 'string' },
            { name: 'assigned_date', type: 'number' },
            { name: 'end_date', type: 'number', isOptional: true },
            { name: 'status', type: 'string' },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'resource_requests',
          columns: [
            { name: 'requested_by', type: 'string', isIndexed: true },
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'resource_type', type: 'string' },
            { name: 'resource_name', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'priority', type: 'string' },
            { name: 'requested_date', type: 'number' },
            { name: 'needed_by_date', type: 'number' },
            { name: 'approval_status', type: 'string', isIndexed: true },
            { name: 'approved_by', type: 'string', isOptional: true },
            { name: 'approval_date', type: 'number', isOptional: true },
            { name: 'rejection_reason', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
      ],
    },
  ],
});
```

### Testing Requirements

**File**: `__tests__/manager/team-management.test.ts`

```typescript
Test Suites:
1. TeamModel CRUD operations
2. TeamMemberModel assignment/removal
3. ResourceRequestModel lifecycle
4. TeamManagementService methods
5. ResourceRequestService approval workflow
6. TeamManagementScreen rendering
7. ApprovalQueue filtering and actions

Coverage Target: 90%+
```

### Acceptance Criteria

- [ ] Create teams and assign them to sites
- [ ] Add/remove team members with specific roles
- [ ] Transfer members between teams
- [ ] Submit resource requests with priority levels
- [ ] Approve/reject requests with status tracking
- [ ] View approval queue sorted by priority
- [ ] Filter teams by site/status
- [ ] Search functionality works correctly
- [ ] Offline-first sync for all operations
- [ ] All data persists across app restarts

---

## Week 3-4: Financial Reports

**Duration**: Days 11-20

**Goal**: Enable managers to track budgets, expenses, and invoices with analytics

### Database Layer (Schema v21)

#### BudgetModel
```typescript
static table = 'budgets';
static associations = {
  project: { type: 'belongs_to', key: 'project_id' },
};

@field('project_id') projectId!: string;
@field('category') category!: string; // labor, materials, equipment, overhead
@field('allocated_amount') allocatedAmount!: number;
@field('spent_amount') spentAmount!: number;
@field('fiscal_year') fiscalYear!: number;
@field('quarter') quarter?: string; // Q1, Q2, Q3, Q4
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;

// Helper method
getRemainingBudget(): number {
  return this.allocatedAmount - this.spentAmount;
}

getUtilizationPercent(): number {
  return (this.spentAmount / this.allocatedAmount) * 100;
}
```

#### ExpenseModel
```typescript
static table = 'expenses';
static associations = {
  project: { type: 'belongs_to', key: 'project_id' },
};

@field('project_id') projectId!: string;
@field('category') category!: string; // must match budget category
@field('description') description!: string;
@field('amount') amount!: number;
@field('expense_date') expenseDate!: number; // timestamp
@field('submitted_by') submittedBy!: string; // user_id
@field('approved_by') approvedBy?: string; // user_id
@field('approval_status') approvalStatus!: string; // pending, approved, rejected
@field('approval_date') approvalDate?: number;
@field('receipt_uri') receiptUri?: string; // photo of receipt
@field('vendor') vendor?: string;
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;
```

#### InvoiceModel
```typescript
static table = 'invoices';
static associations = {
  project: { type: 'belongs_to', key: 'project_id' },
};

@field('project_id') projectId!: string;
@field('invoice_number') invoiceNumber!: string;
@field('vendor') vendor!: string;
@field('amount') amount!: number;
@field('issue_date') issueDate!: number; // timestamp
@field('due_date') dueDate!: number; // timestamp
@field('payment_date') paymentDate?: number; // timestamp
@field('payment_status') paymentStatus!: string; // pending, paid, overdue, cancelled
@field('payment_method') paymentMethod?: string; // check, wire, credit
@field('description') description?: string;
@field('invoice_uri') invoiceUri?: string; // PDF/image of invoice
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;

// Helper methods
isOverdue(): boolean {
  return this.paymentStatus === 'pending' && Date.now() > this.dueDate;
}

getDaysUntilDue(): number {
  return Math.floor((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
}
```

### Service Layer

#### FinancialService.ts
```typescript
Location: services/financial/FinancialService.ts

Key Methods:
- createBudget(data: BudgetData): Promise<BudgetModel>
- updateBudget(budgetId: string, data: Partial<BudgetData>): Promise<BudgetModel>
- getBudgetsByProject(projectId: string): Promise<BudgetModel[]>
- createExpense(data: ExpenseData): Promise<ExpenseModel>
- approveExpense(expenseId: string, approverId: string): Promise<ExpenseModel>
- rejectExpense(expenseId: string, approverId: string): Promise<ExpenseModel>
- getExpensesByProject(projectId: string): Promise<ExpenseModel[]>
- getPendingExpenses(): Promise<ExpenseModel[]>
- createInvoice(data: InvoiceData): Promise<InvoiceModel>
- markInvoicePaid(invoiceId: string, paymentDate: number, method: string): Promise<InvoiceModel>
- getOverdueInvoices(): Promise<InvoiceModel[]>
- getInvoicesByProject(projectId: string): Promise<InvoiceModel[]>
```

#### AnalyticsService.ts
```typescript
Location: services/financial/AnalyticsService.ts

Key Methods:
- getBudgetUtilization(projectId: string): Promise<BudgetUtilization>
- getVarianceAnalysis(projectId: string, category: string): Promise<VarianceReport>
- getExpenseBreakdown(projectId: string): Promise<ExpenseBreakdown>
- getCashFlowProjection(projectId: string): Promise<CashFlowData>
- getTopExpenseCategories(projectId: string, limit: number): Promise<CategoryTotal[]>
- getBudgetTrends(projectId: string, months: number): Promise<TrendData>

Types:
interface BudgetUtilization {
  totalAllocated: number;
  totalSpent: number;
  utilizationPercent: number;
  byCategory: { category: string; allocated: number; spent: number }[];
}

interface VarianceReport {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}
```

#### ReportExportService.ts
```typescript
Location: services/financial/ReportExportService.ts

Key Methods:
- exportBudgetReportPDF(projectId: string): Promise<string> // returns file URI
- exportExpenseReportExcel(projectId: string, startDate: number, endDate: number): Promise<string>
- exportInvoiceListPDF(projectId: string): Promise<string>
- exportVarianceReportPDF(projectId: string): Promise<string>

Dependencies:
- react-native-pdf (for PDF generation)
- xlsx (for Excel generation)
- react-native-fs (for file system access)
```

### UI Components

#### FinancialReportsScreen.tsx
```typescript
Location: src/manager/FinancialReportsScreen.tsx

Sections:
1. Budget Overview Card
   - Total allocated vs. spent
   - Utilization percentage with color coding
   - Category breakdown

2. Expense Summary
   - Pending approvals count
   - This month's expenses
   - Category-wise spending chart

3. Invoice Tracker
   - Pending invoices count
   - Overdue invoices alert
   - Upcoming due dates

4. Quick Actions
   - Approve pending expenses
   - View budget details
   - Export reports

5. Analytics Dashboard
   - Budget utilization chart (bar/pie)
   - Expense trends (line chart)
   - Variance analysis table

Features:
- Date range filter
- Project filter
- Category filter
- Export to PDF/Excel
- Drill-down to expense details
```

#### BudgetUtilizationChart.tsx
```typescript
Location: src/manager/components/BudgetUtilizationChart.tsx

Chart Type: Horizontal stacked bar chart

Data:
- Allocated amount (total bar)
- Spent amount (filled portion)
- Remaining amount (unfilled portion)
- Color coding: green (<75%), yellow (75-90%), red (>90%)

Features:
- Breakdown by category
- Interactive tooltips
- Legend with totals
```

#### ExpenseBreakdown.tsx
```typescript
Location: src/manager/components/ExpenseBreakdown.tsx

Chart Type: Pie/Donut chart

Data:
- Category-wise expense totals
- Percentage of total budget
- Color-coded by category

Features:
- Click to see expense list for category
- Show/hide categories
- Legend with amounts
```

#### InvoiceTracker.tsx
```typescript
Location: src/manager/components/InvoiceTracker.tsx

Components:
- InvoiceCard: Display invoice details
- StatusBadge: Color-coded status (paid/pending/overdue)
- PaymentButton: Mark as paid
- FilterBar: Filter by status/vendor

Features:
- Sort by due date/amount
- Overdue highlighting
- Payment history
- Vendor grouping
```

#### ExpenseApprovalQueue.tsx
```typescript
Location: src/manager/components/ExpenseApprovalQueue.tsx

Components:
- ExpenseCard: Display expense details with receipt preview
- ApproveButton: Approve expense
- RejectButton: Reject with reason
- BudgetImpactWarning: Show if expense exceeds category budget

Features:
- Receipt image viewer
- Budget impact calculation
- Bulk approval
- Filter by category/date
```

#### ExportReportButton.tsx
```typescript
Location: src/manager/components/ExportReportButton.tsx

Options:
- Budget Report (PDF)
- Expense Report (Excel)
- Invoice List (PDF)
- Variance Analysis (PDF)

Features:
- Date range selection
- Format selection (PDF/Excel)
- Progress indicator
- Share exported file
```

### Migration Script

**File**: `models/schema/migrations/v21-financial-management.ts`

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 21,
      steps: [
        {
          type: 'create_table',
          name: 'budgets',
          columns: [
            { name: 'project_id', type: 'string', isIndexed: true },
            { name: 'category', type: 'string', isIndexed: true },
            { name: 'allocated_amount', type: 'number' },
            { name: 'spent_amount', type: 'number' },
            { name: 'fiscal_year', type: 'number' },
            { name: 'quarter', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'expenses',
          columns: [
            { name: 'project_id', type: 'string', isIndexed: true },
            { name: 'category', type: 'string', isIndexed: true },
            { name: 'description', type: 'string' },
            { name: 'amount', type: 'number' },
            { name: 'expense_date', type: 'number' },
            { name: 'submitted_by', type: 'string', isIndexed: true },
            { name: 'approved_by', type: 'string', isOptional: true },
            { name: 'approval_status', type: 'string', isIndexed: true },
            { name: 'approval_date', type: 'number', isOptional: true },
            { name: 'receipt_uri', type: 'string', isOptional: true },
            { name: 'vendor', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'invoices',
          columns: [
            { name: 'project_id', type: 'string', isIndexed: true },
            { name: 'invoice_number', type: 'string', isIndexed: true },
            { name: 'vendor', type: 'string', isIndexed: true },
            { name: 'amount', type: 'number' },
            { name: 'issue_date', type: 'number' },
            { name: 'due_date', type: 'number', isIndexed: true },
            { name: 'payment_date', type: 'number', isOptional: true },
            { name: 'payment_status', type: 'string', isIndexed: true },
            { name: 'payment_method', type: 'string', isOptional: true },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'invoice_uri', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
      ],
    },
  ],
});
```

### Testing Requirements

**File**: `__tests__/manager/financial-reports.test.ts`

```typescript
Test Suites:
1. BudgetModel calculations (remaining, utilization)
2. ExpenseModel approval workflow
3. InvoiceModel overdue detection
4. FinancialService CRUD operations
5. AnalyticsService calculations (variance, trends)
6. ReportExportService PDF/Excel generation
7. FinancialReportsScreen rendering with mock data
8. Chart components (BudgetUtilizationChart, ExpenseBreakdown)

Coverage Target: 90%+
```

### Acceptance Criteria

- [ ] View real-time budget utilization by project and category
- [ ] Track expenses with approval workflow
- [ ] Monitor invoice payment status with overdue alerts
- [ ] Generate variance reports (planned vs. actual)
- [ ] Export reports to PDF and Excel formats
- [ ] Visual analytics with interactive charts
- [ ] Filter and search functionality works
- [ ] Budget warnings when expenses exceed allocation
- [ ] Offline-first sync for all financial data
- [ ] Receipt and invoice image attachment support

---

## Week 5-6: Resource Allocation

**Duration**: Days 21-30

**Goal**: Enable managers to allocate equipment and materials to sites with conflict detection

### Database Layer (Schema v22)

#### ResourceAllocationModel
```typescript
static table = 'resource_allocations';
static associations = {
  site: { type: 'belongs_to', key: 'site_id' },
  equipment: { type: 'belongs_to', key: 'equipment_id' },
};

@field('site_id') siteId!: string;
@field('equipment_id') equipmentId?: string; // null for material allocations
@field('resource_type') resourceType!: string; // equipment, material
@field('resource_name') resourceName!: string;
@field('quantity') quantity!: number;
@field('start_date') startDate!: number; // timestamp
@field('end_date') endDate!: number; // timestamp
@field('allocated_by') allocatedBy!: string; // user_id
@field('status') status!: string; // allocated, in_use, returned, cancelled
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;

// Helper methods
isActive(): boolean {
  const now = Date.now();
  return this.status === 'allocated' && now >= this.startDate && now <= this.endDate;
}

getDuration(): number {
  return Math.floor((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
}
```

#### EquipmentModel
```typescript
static table = 'equipment';

@field('name') name!: string;
@field('equipment_type') equipmentType!: string; // excavator, crane, mixer, etc.
@field('model') model?: string;
@field('serial_number') serialNumber?: string;
@field('status') status!: string; // available, in_use, maintenance, retired
@field('current_site_id') currentSiteId?: string; // null if not allocated
@field('purchase_date') purchaseDate?: number;
@field('last_maintenance_date') lastMaintenanceDate?: number;
@field('next_maintenance_due') nextMaintenanceDue?: number;
@field('hourly_rate') hourlyRate?: number; // rental/usage cost
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;

// Helper methods
needsMaintenance(): boolean {
  if (!this.nextMaintenanceDue) return false;
  return Date.now() >= this.nextMaintenanceDue;
}

isAvailable(): boolean {
  return this.status === 'available' && !this.currentSiteId;
}
```

#### MaterialRequestModel
```typescript
static table = 'material_requests';
static associations = {
  site: { type: 'belongs_to', key: 'site_id' },
};

@field('site_id') siteId!: string;
@field('material_type') materialType!: string; // concrete, steel, lumber, etc.
@field('material_name') materialName!: string;
@field('quantity') quantity!: number;
@field('unit') unit!: string; // cubic_yards, tons, pieces, etc.
@field('requested_by') requestedBy!: string; // user_id
@field('request_date') requestDate!: number; // timestamp
@field('needed_by_date') neededByDate!: number; // timestamp
@field('delivery_date') deliveryDate?: number; // timestamp
@field('status') status!: string; // requested, approved, ordered, delivered, cancelled
@field('vendor') vendor?: string;
@field('estimated_cost') estimatedCost?: number;
@field('actual_cost') actualCost?: number;
@field('notes') notes?: string;
@field('sync_status') appSyncStatus!: string;
@field('_version') version!: number;
```

### Service Layer

#### ResourceAllocationService.ts
```typescript
Location: services/resource/ResourceAllocationService.ts

Key Methods:
- allocateEquipment(equipmentId: string, siteId: string, startDate: number, endDate: number): Promise<ResourceAllocationModel>
- allocateMaterial(materialName: string, quantity: number, siteId: string, dates: DateRange): Promise<ResourceAllocationModel>
- releaseAllocation(allocationId: string): Promise<void>
- extendAllocation(allocationId: string, newEndDate: number): Promise<ResourceAllocationModel>
- transferAllocation(allocationId: string, newSiteId: string): Promise<ResourceAllocationModel>
- getActiveAllocations(): Promise<ResourceAllocationModel[]>
- getAllocationsBySite(siteId: string): Promise<ResourceAllocationModel[]>
- getAllocationsByEquipment(equipmentId: string): Promise<ResourceAllocationModel[]>
```

#### AvailabilityService.ts
```typescript
Location: services/resource/AvailabilityService.ts

Key Methods:
- checkEquipmentAvailability(equipmentId: string, startDate: number, endDate: number): Promise<boolean>
- getAvailableEquipment(equipmentType: string, dateRange: DateRange): Promise<EquipmentModel[]>
- detectConflicts(equipmentId: string, startDate: number, endDate: number): Promise<ConflictInfo[]>
- getEquipmentSchedule(equipmentId: string, month: number, year: number): Promise<AllocationSchedule>
- getMaterialAvailability(materialType: string): Promise<MaterialStock>
- getResourceUtilization(resourceId: string, period: Period): Promise<UtilizationReport>

Types:
interface ConflictInfo {
  allocationId: string;
  siteId: string;
  siteName: string;
  startDate: number;
  endDate: number;
  overlapDays: number;
}

interface AllocationSchedule {
  equipmentId: string;
  allocations: { date: number; siteId: string; status: string }[];
}
```

#### EquipmentService.ts
```typescript
Location: services/resource/EquipmentService.ts

Key Methods:
- createEquipment(data: EquipmentData): Promise<EquipmentModel>
- updateEquipment(equipmentId: string, data: Partial<EquipmentData>): Promise<EquipmentModel>
- retireEquipment(equipmentId: string): Promise<void>
- scheduleMaintenance(equipmentId: string, maintenanceDate: number): Promise<EquipmentModel>
- completeMaintenance(equipmentId: string): Promise<EquipmentModel>
- getAvailableEquipment(): Promise<EquipmentModel[]>
- getEquipmentNeedingMaintenance(): Promise<EquipmentModel[]>
```

#### MaterialRequestService.ts
```typescript
Location: services/resource/MaterialRequestService.ts

Key Methods:
- createMaterialRequest(data: MaterialRequestData): Promise<MaterialRequestModel>
- approveMaterialRequest(requestId: string): Promise<MaterialRequestModel>
- orderMaterials(requestId: string, vendor: string, cost: number): Promise<MaterialRequestModel>
- markDelivered(requestId: string, deliveryDate: number): Promise<MaterialRequestModel>
- cancelRequest(requestId: string): Promise<void>
- getPendingRequests(): Promise<MaterialRequestModel[]>
- getRequestsBySite(siteId: string): Promise<MaterialRequestModel[]>
```

### UI Components

#### ResourceAllocationScreen.tsx
```typescript
Location: src/manager/ResourceAllocationScreen.tsx

Tabs:
1. Equipment Allocation
2. Material Requests
3. Availability Calendar

Equipment Allocation Tab:
- EquipmentList: Available equipment with status
- AllocationCalendar: Timeline view of allocations
- AllocateEquipmentButton: Create new allocation
- ActiveAllocationsList: Current allocations with site info

Material Requests Tab:
- MaterialRequestList: Pending/approved requests
- CreateRequestButton: New material request form
- DeliveryTracker: Track delivery status

Availability Calendar Tab:
- ResourceCalendar: Month/week view of all allocations
- ConflictIndicators: Highlight scheduling conflicts
- FilterBar: Filter by resource type/site

Features:
- Drag-and-drop allocation rescheduling
- Conflict detection and warnings
- Equipment search and filter
- Quick actions (extend, transfer, release)
```

#### ResourceAvailabilityGrid.tsx
```typescript
Location: src/manager/components/ResourceAvailabilityGrid.tsx

Display:
- Rows: Equipment/materials
- Columns: Dates (day/week view)
- Cells: Allocation status (available/allocated/maintenance)
- Color coding: Green (available), Blue (allocated), Red (conflict), Yellow (maintenance)

Features:
- Click cell to create allocation
- Hover to see allocation details
- Legend with status indicators
- Toggle between day/week/month view
```

#### AllocationConflictAlert.tsx
```typescript
Location: src/manager/components/AllocationConflictAlert.tsx

Display:
- Conflicting allocations list
- Overlap duration
- Affected sites
- Suggested resolution options

Actions:
- Adjust dates
- Select different equipment
- Override with reason
```

#### MaterialRequestTracker.tsx
```typescript
Location: src/manager/components/MaterialRequestTracker.tsx

Components:
- RequestCard: Material details, quantity, status
- StatusTimeline: Visual progress (requested → approved → ordered → delivered)
- DeliveryCountdown: Days until needed/delivery
- CostComparison: Estimated vs. actual cost

Features:
- Filter by status/site
- Sort by delivery date
- Mark as delivered
- Update delivery tracking
```

#### EquipmentMaintenanceAlert.tsx
```typescript
Location: src/manager/components/EquipmentMaintenanceAlert.tsx

Display:
- Equipment needing maintenance
- Overdue maintenance count
- Next maintenance schedule

Actions:
- Schedule maintenance
- Mark maintenance complete
- Update maintenance schedule
```

### Migration Script

**File**: `models/schema/migrations/v22-resource-allocation.ts`

```typescript
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 22,
      steps: [
        {
          type: 'create_table',
          name: 'resource_allocations',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'equipment_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'resource_type', type: 'string' },
            { name: 'resource_name', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'start_date', type: 'number', isIndexed: true },
            { name: 'end_date', type: 'number', isIndexed: true },
            { name: 'allocated_by', type: 'string' },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'equipment',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'equipment_type', type: 'string', isIndexed: true },
            { name: 'model', type: 'string', isOptional: true },
            { name: 'serial_number', type: 'string', isOptional: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'current_site_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'purchase_date', type: 'number', isOptional: true },
            { name: 'last_maintenance_date', type: 'number', isOptional: true },
            { name: 'next_maintenance_due', type: 'number', isOptional: true },
            { name: 'hourly_rate', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
        {
          type: 'create_table',
          name: 'material_requests',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'material_type', type: 'string', isIndexed: true },
            { name: 'material_name', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'unit', type: 'string' },
            { name: 'requested_by', type: 'string', isIndexed: true },
            { name: 'request_date', type: 'number' },
            { name: 'needed_by_date', type: 'number', isIndexed: true },
            { name: 'delivery_date', type: 'number', isOptional: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'vendor', type: 'string', isOptional: true },
            { name: 'estimated_cost', type: 'number', isOptional: true },
            { name: 'actual_cost', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        },
      ],
    },
  ],
});
```

### Testing Requirements

**File**: `__tests__/manager/resource-allocation.test.ts`

```typescript
Test Suites:
1. ResourceAllocationModel lifecycle and helper methods
2. EquipmentModel availability and maintenance checks
3. MaterialRequestModel status transitions
4. ResourceAllocationService allocation/transfer/release
5. AvailabilityService conflict detection
6. EquipmentService maintenance scheduling
7. MaterialRequestService approval workflow
8. ResourceAllocationScreen rendering and interactions
9. Conflict detection scenarios

Coverage Target: 90%+
```

### Acceptance Criteria

- [ ] Allocate equipment to sites with specific date ranges
- [ ] Track material requests and delivery status
- [ ] Prevent resource double-booking with conflict detection
- [ ] View resource utilization across all sites
- [ ] Reassign/transfer resources between sites
- [ ] Schedule and track equipment maintenance
- [ ] Calendar view of all allocations
- [ ] Filter and search by resource type/site
- [ ] Conflict warnings before allocation
- [ ] Offline-first sync for all resource data
- [ ] Equipment maintenance alerts

---

## Week 7: Project Overview Integration

**Duration**: Days 31-35

**Goal**: Replace mock data in ProjectOverviewScreen with real database queries

### Current State Analysis

**File**: `src/manager/ProjectOverviewScreen.tsx`

Current implementation uses hardcoded mock data:
- Mock project list
- Fake statistics (budget, sites, teams)
- Static progress percentages

### Integration Tasks

#### Task 1: Database Query Integration

**Replace Mock Data With**:
```typescript
// Current: const projects = mockProjects;
// New:
const projects = await database.collections
  .get<ProjectModel>('projects')
  .query(Q.where('status', Q.oneOf(['active', 'on_hold'])))
  .fetch();
```

#### Task 2: Statistics Aggregation

**Create**: `services/aggregation/ProjectAggregationService.ts`

```typescript
interface ProjectStatistics {
  totalBudget: number;
  totalSpent: number;
  siteCount: number;
  teamCount: number;
  activeTeamMembers: number;
  overallProgress: number;
  upcomingDeadlines: number;
  pendingApprovals: number;
}

class ProjectAggregationService {
  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    // Aggregate from budgets, sites, teams, progress_logs, etc.
  }

  async getAllProjectsOverview(): Promise<ProjectOverview[]> {
    // Get overview for all active projects
  }

  async getProjectHealth(projectId: string): Promise<HealthMetrics> {
    // Calculate health score based on budget, schedule, quality
  }
}
```

#### Task 3: Real-time KPI Calculations

**Update Components**:

1. **BudgetSummaryCard**:
```typescript
// Query budgets and expenses
const budgets = await database.collections.get<BudgetModel>('budgets')
  .query(Q.where('project_id', projectId)).fetch();
const expenses = await database.collections.get<ExpenseModel>('expenses')
  .query(Q.where('project_id', projectId), Q.where('approval_status', 'approved')).fetch();

const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
```

2. **SiteCountCard**:
```typescript
const sites = await database.collections.get<SiteModel>('sites')
  .query(Q.where('project_id', projectId)).fetch();
const siteCount = sites.length;
```

3. **TeamCountCard**:
```typescript
const teams = await database.collections.get<TeamModel>('teams')
  .query(Q.where('status', 'active')).fetch();
const teamCount = teams.length;

const teamMembers = await database.collections.get<TeamMemberModel>('team_members')
  .query(Q.where('status', 'active')).fetch();
const memberCount = teamMembers.length;
```

4. **ProgressMetricsCard**:
```typescript
const items = await database.collections.get<ItemModel>('items')
  .query(Q.where('project_id', projectId)).fetch();

const totalItems = items.length;
const completedItems = items.filter(i => i.status === 'completed').length;
const overallProgress = (completedItems / totalItems) * 100;
```

#### Task 4: Navigation Integration

**Update Navigation**:
```typescript
// Link to TeamManagementScreen
<TouchableOpacity onPress={() => navigation.navigate('TeamManagement')}>
  <TeamCountCard count={teamCount} />
</TouchableOpacity>

// Link to FinancialReportsScreen
<TouchableOpacity onPress={() => navigation.navigate('FinancialReports', { projectId })}>
  <BudgetSummaryCard budget={totalBudget} spent={totalSpent} />
</TouchableOpacity>

// Link to ResourceAllocationScreen
<TouchableOpacity onPress={() => navigation.navigate('ResourceAllocation')}>
  <ResourceUtilizationCard />
</TouchableOpacity>
```

#### Task 5: Performance Optimization

**Implement**:
1. **Memoization**: Use `useMemo` for expensive calculations
2. **Query Optimization**: Add indexes to frequently queried columns
3. **Lazy Loading**: Load detailed data only when cards are expanded
4. **Caching**: Cache aggregated statistics with TTL

```typescript
const projectStats = useMemo(() => {
  return calculateProjectStatistics(projects, budgets, sites, teams);
}, [projects, budgets, sites, teams]);
```

### Updated Screen Structure

**File**: `src/manager/ProjectOverviewScreen.tsx` (Updated)

```typescript
export default function ProjectOverviewScreen() {
  const database = useDatabase();
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadStatistics(selectedProject.id);
    }
  }, [selectedProject]);

  async function loadProjects() {
    const projects = await database.collections
      .get<ProjectModel>('projects')
      .query(Q.where('status', Q.oneOf(['active', 'on_hold'])))
      .fetch();
    setProjects(projects);
    if (projects.length > 0) {
      setSelectedProject(projects[0]);
    }
    setLoading(false);
  }

  async function loadStatistics(projectId: string) {
    const stats = await ProjectAggregationService.getProjectStatistics(projectId);
    setStatistics(stats);
  }

  return (
    <View>
      <ProjectSelector
        projects={projects}
        selected={selectedProject}
        onSelect={setSelectedProject}
      />

      {statistics && (
        <>
          <BudgetSummaryCard
            budget={statistics.totalBudget}
            spent={statistics.totalSpent}
            onPress={() => navigation.navigate('FinancialReports', { projectId: selectedProject.id })}
          />

          <SiteCountCard
            count={statistics.siteCount}
          />

          <TeamCountCard
            count={statistics.teamCount}
            memberCount={statistics.activeTeamMembers}
            onPress={() => navigation.navigate('TeamManagement')}
          />

          <ProgressMetricsCard
            progress={statistics.overallProgress}
          />

          <UpcomingDeadlinesCard
            count={statistics.upcomingDeadlines}
          />

          <PendingApprovalsCard
            count={statistics.pendingApprovals}
            onPress={() => navigation.navigate('ApprovalQueue')}
          />
        </>
      )}
    </View>
  );
}
```

### Testing Requirements

**File**: `__tests__/manager/project-overview-integration.test.ts`

```typescript
Test Suites:
1. ProjectAggregationService statistics calculation
2. Real data loading and display
3. Navigation to detail screens
4. Statistics updates when data changes
5. Performance benchmarks (<2s load time)
6. Error handling for missing data

Coverage Target: 90%+
```

### Acceptance Criteria

- [ ] Display real project data (no mock data)
- [ ] Show accurate budget/expense summaries from database
- [ ] Display actual site count from database
- [ ] Display actual team count and member count
- [ ] Calculate overall project progress from items
- [ ] Navigate to TeamManagement screen from team card
- [ ] Navigate to FinancialReports screen from budget card
- [ ] Navigate to ResourceAllocation screen from resource card
- [ ] Screen loads in <2 seconds
- [ ] Real-time updates when underlying data changes
- [ ] Proper error handling for missing/incomplete data

---

## Week 8: Testing & Polish

**Duration**: Days 36-40

**Goal**: Comprehensive testing, performance optimization, and documentation

### Integration Testing

#### Test Suite 1: Manager Role End-to-End Workflows

**File**: `__tests__/manager/e2e-workflows.test.ts`

```typescript
Test Scenarios:

1. Complete Team Management Workflow
   - Create team → Assign members → Submit resource request → Approve request
   - Expected: All data persists, sync status updated

2. Complete Financial Workflow
   - Create budget → Submit expense → Approve expense → Track against budget
   - Expected: Budget utilization updates correctly

3. Complete Resource Allocation Workflow
   - Allocate equipment → Check for conflicts → Extend allocation → Release
   - Expected: Availability tracking works, conflicts detected

4. Cross-Screen Data Consistency
   - Create team → View in ProjectOverview → Check team count
   - Create expense → View in FinancialReports → Check budget card
   - Expected: All screens show consistent data

5. Offline Sync Workflow
   - Create data offline → Go online → Verify sync
   - Create conflict → Resolve with last-write-wins
   - Expected: All changes sync correctly
```

#### Test Suite 2: Data Aggregation Tests

**File**: `__tests__/services/project-aggregation.test.ts`

```typescript
Test Scenarios:

1. ProjectAggregationService.getProjectStatistics
   - Multiple budgets, expenses, sites, teams
   - Expected: Correct totals and averages

2. Budget utilization calculation
   - Various expense amounts and budget allocations
   - Expected: Accurate percentage calculation

3. Progress calculation
   - Mixed item statuses (pending, in_progress, completed)
   - Expected: Correct overall progress percentage

4. Edge cases
   - Empty project (no sites, no teams)
   - Over-budget scenario
   - Expected: Graceful handling, no crashes
```

#### Test Suite 3: Performance Tests

**File**: `__tests__/performance/manager-role.test.ts`

```typescript
Test Scenarios:

1. ProjectOverviewScreen load time
   - 10 projects, 50 sites, 100 teams
   - Expected: <2 seconds

2. FinancialReportsScreen chart rendering
   - 1000 expenses across 10 categories
   - Expected: <1 second

3. ResourceAllocationScreen calendar
   - 100 allocations across 30 days
   - Expected: <1.5 seconds

4. Database query performance
   - Complex aggregation queries
   - Expected: <500ms per query
```

### Performance Optimization

#### Task 1: Database Query Optimization

**Add Indexes**:
```typescript
// In schema.ts
{ name: 'approval_status', type: 'string', isIndexed: true }
{ name: 'start_date', type: 'number', isIndexed: true }
{ name: 'end_date', type: 'number', isIndexed: true }
{ name: 'payment_status', type: 'string', isIndexed: true }
```

**Optimize Queries**:
```typescript
// Before: Fetch all then filter in JS
const expenses = await database.collections.get('expenses').query().fetch();
const approved = expenses.filter(e => e.approvalStatus === 'approved');

// After: Filter at database level
const approved = await database.collections.get('expenses')
  .query(Q.where('approval_status', 'approved')).fetch();
```

#### Task 2: React Native Performance

**Implement**:
1. **Memoization**: Wrap expensive calculations with `useMemo`
2. **Callback Memoization**: Use `useCallback` for event handlers
3. **FlatList Optimization**: Add `keyExtractor`, `getItemLayout`, `removeClippedSubviews`
4. **Image Optimization**: Use `react-native-fast-image` for receipt/invoice images
5. **Code Splitting**: Lazy load screens with `React.lazy`

```typescript
// Memoize expensive calculations
const budgetUtilization = useMemo(() => {
  return calculateUtilization(budgets, expenses);
}, [budgets, expenses]);

// Memoize callbacks
const handleApprove = useCallback((expenseId: string) => {
  approveExpense(expenseId);
}, []);

// FlatList optimization
<FlatList
  data={expenses}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

#### Task 3: Reduce Re-renders

**Use React DevTools Profiler**:
1. Identify components with unnecessary re-renders
2. Wrap with `React.memo` where appropriate
3. Split large components into smaller ones
4. Use context selectors to prevent cascade re-renders

```typescript
// Before: Re-renders on every state change
export default function ExpenseCard({ expense }) { ... }

// After: Only re-renders if expense changes
export default React.memo(function ExpenseCard({ expense }) { ... });
```

### Documentation

#### Task 1: Update README.md

**Add Section**: Manager Role Features

```markdown
## Manager Role Features

### Team Management
- Create and manage teams across multiple sites
- Assign supervisors and workers to teams
- Submit and approve resource requests
- Track team performance and assignments

### Financial Reports
- Real-time budget tracking by project and category
- Expense approval workflow with receipt attachment
- Invoice tracking with payment status
- Variance analysis (planned vs. actual)
- Export reports to PDF and Excel

### Resource Allocation
- Allocate equipment to sites with scheduling
- Track material requests and deliveries
- Conflict detection for resource double-booking
- Equipment maintenance scheduling
- Calendar view of all allocations

### Project Overview
- Aggregate dashboard for all projects
- Budget summary with utilization metrics
- Site and team count tracking
- Overall progress calculation
- Quick navigation to detail screens
```

#### Task 2: API Documentation

**Create**: `docs/api/MANAGER_SERVICES.md`

Document all service methods:
- TeamManagementService
- ResourceRequestService
- FinancialService
- AnalyticsService
- ResourceAllocationService
- AvailabilityService
- ProjectAggregationService

Include:
- Method signatures
- Parameters and return types
- Usage examples
- Error handling

#### Task 3: User Guide

**Create**: `docs/user-guide/MANAGER_GUIDE.md`

Sections:
1. Getting Started
2. Managing Teams
3. Tracking Finances
4. Allocating Resources
5. Viewing Project Overview
6. Troubleshooting

### Code Quality

#### Task 1: TypeScript Strict Mode

Enable stricter TypeScript checks:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

Fix all new TypeScript errors.

#### Task 2: ESLint Rules

Add additional rules:
```json
{
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

Fix all linting warnings.

#### Task 3: Code Review Checklist

- [ ] All functions have JSDoc comments
- [ ] All magic numbers replaced with constants
- [ ] Error handling implemented everywhere
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] No hardcoded strings (use i18n)
- [ ] Accessibility labels added
- [ ] Unit tests for all services
- [ ] Integration tests for all screens

### Final Testing

#### Manual Testing Checklist

**Team Management**:
- [ ] Create team with valid data
- [ ] Create team with invalid data (error handling)
- [ ] Assign member to team
- [ ] Remove member from team
- [ ] Submit resource request
- [ ] Approve resource request
- [ ] Reject resource request
- [ ] Filter teams by site
- [ ] Search teams by name

**Financial Reports**:
- [ ] View budget summary
- [ ] Submit expense with receipt
- [ ] Approve expense
- [ ] Reject expense
- [ ] View budget utilization chart
- [ ] View expense breakdown
- [ ] Track invoice payment
- [ ] Mark invoice as paid
- [ ] Export budget report to PDF
- [ ] Export expense report to Excel

**Resource Allocation**:
- [ ] Allocate equipment to site
- [ ] Detect allocation conflict
- [ ] Extend allocation
- [ ] Transfer allocation to different site
- [ ] Release allocation
- [ ] Create material request
- [ ] Track material delivery
- [ ] View resource calendar
- [ ] Schedule equipment maintenance

**Project Overview**:
- [ ] View all projects
- [ ] Select project
- [ ] View budget summary
- [ ] View site count
- [ ] View team count
- [ ] Navigate to TeamManagement
- [ ] Navigate to FinancialReports
- [ ] Navigate to ResourceAllocation

#### Automated Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- manager-role

# Performance tests
npm test -- performance
```

**Target Coverage**: 90%+ for Manager role code

### Acceptance Criteria

- [ ] All integration tests pass
- [ ] 90%+ code coverage for Manager role
- [ ] All screens load in <2 seconds
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation complete
- [ ] User guide reviewed
- [ ] Manual testing checklist complete
- [ ] Performance benchmarks met
- [ ] Offline-first functionality verified

---

## Database Schema Design

### Schema Version 20: Team Management

**Tables**: teams, team_members, resource_requests

**Total Columns**: 29

**Sync Strategy**: All tables have `sync_status` and `_version` columns for offline-first sync

### Schema Version 21: Financial Management

**Tables**: budgets, expenses, invoices

**Total Columns**: 30

**Relationships**:
- Budget → Project (belongs_to)
- Expense → Project (belongs_to)
- Invoice → Project (belongs_to)

### Schema Version 22: Resource Allocation

**Tables**: resource_allocations, equipment, material_requests

**Total Columns**: 34

**Relationships**:
- ResourceAllocation → Site (belongs_to)
- ResourceAllocation → Equipment (belongs_to)
- MaterialRequest → Site (belongs_to)

### Migration Strategy

1. **Incremental Migrations**: One version at a time
2. **Backwards Compatibility**: No breaking changes to existing tables
3. **Data Seeding**: Test data for development
4. **Rollback Plan**: Document rollback steps for each migration

---

## Service Architecture

### Service Layer Structure

```
services/
├── team/
│   ├── TeamManagementService.ts
│   └── ResourceRequestService.ts
├── financial/
│   ├── FinancialService.ts
│   ├── AnalyticsService.ts
│   └── ReportExportService.ts
├── resource/
│   ├── ResourceAllocationService.ts
│   ├── AvailabilityService.ts
│   ├── EquipmentService.ts
│   └── MaterialRequestService.ts
└── aggregation/
    └── ProjectAggregationService.ts
```

### Service Patterns

1. **Single Responsibility**: Each service handles one domain
2. **Dependency Injection**: Services receive database instance
3. **Error Handling**: All methods throw typed errors
4. **Logging**: Comprehensive logging for debugging
5. **Transaction Support**: Use WatermelonDB batch operations

### Example Service Template

```typescript
import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';

export class ServiceName {
  constructor(private database: Database) {}

  async createRecord(data: RecordData): Promise<RecordModel> {
    try {
      const record = await this.database.write(async () => {
        return await this.database.collections
          .get<RecordModel>('table_name')
          .create((record) => {
            record.field1 = data.field1;
            record.field2 = data.field2;
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
      });
      return record;
    } catch (error) {
      console.error('Error creating record:', error);
      throw new Error('Failed to create record');
    }
  }

  async getRecords(filter?: FilterOptions): Promise<RecordModel[]> {
    try {
      const query = this.database.collections
        .get<RecordModel>('table_name')
        .query();

      if (filter) {
        // Add filter conditions
      }

      return await query.fetch();
    } catch (error) {
      console.error('Error fetching records:', error);
      throw new Error('Failed to fetch records');
    }
  }
}
```

---

## Component Hierarchy

### Screen Components

```
src/manager/
├── TeamManagementScreen.tsx (Main screen)
│   ├── components/
│   │   ├── TeamListView.tsx
│   │   ├── AddTeamModal.tsx
│   │   ├── EditTeamModal.tsx
│   │   ├── TeamMembersList.tsx
│   │   ├── TeamMemberAssignment.tsx
│   │   └── ApprovalQueue.tsx
│
├── FinancialReportsScreen.tsx (Main screen)
│   ├── components/
│   │   ├── BudgetUtilizationChart.tsx
│   │   ├── ExpenseBreakdown.tsx
│   │   ├── InvoiceTracker.tsx
│   │   ├── ExpenseApprovalQueue.tsx
│   │   └── ExportReportButton.tsx
│
├── ResourceAllocationScreen.tsx (Main screen)
│   ├── components/
│   │   ├── ResourceAvailabilityGrid.tsx
│   │   ├── AllocationConflictAlert.tsx
│   │   ├── MaterialRequestTracker.tsx
│   │   └── EquipmentMaintenanceAlert.tsx
│
└── ProjectOverviewScreen.tsx (Main screen - updated)
    ├── components/
    │   ├── ProjectSelector.tsx
    │   ├── BudgetSummaryCard.tsx
    │   ├── SiteCountCard.tsx
    │   ├── TeamCountCard.tsx
    │   ├── ProgressMetricsCard.tsx
    │   ├── UpcomingDeadlinesCard.tsx
    │   └── PendingApprovalsCard.tsx
```

### Shared Components

```
src/components/shared/
├── forms/
│   ├── FormInput.tsx
│   ├── FormDatePicker.tsx
│   ├── FormSelect.tsx
│   └── FormTextArea.tsx
├── cards/
│   ├── StatCard.tsx
│   ├── MetricCard.tsx
│   └── ActionCard.tsx
├── lists/
│   ├── DataList.tsx
│   └── FilterableList.tsx
└── modals/
    ├── ConfirmationModal.tsx
    └── FormModal.tsx
```

---

## Risk Mitigation

### Technical Risks

#### Risk 1: Schema Migration Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Incremental migrations (one version at a time)
- Comprehensive migration tests
- Test data seeding for development
- Rollback scripts prepared
- Review existing migration patterns (v12-v19)

#### Risk 2: Performance with Large Datasets
**Impact**: High
**Probability**: Medium
**Mitigation**:
- Database query optimization (indexes on all foreign keys)
- Pagination for large lists
- Virtual scrolling for long lists (FlatList optimization)
- Lazy loading for detail views
- Performance benchmarks established (<2s load time)
- React Native performance profiling

#### Risk 3: Sync Complexity
**Impact**: Medium
**Probability**: Medium
**Mitigation**:
- Use established `appSyncStatus` pattern
- Comprehensive conflict resolution tests
- SyncService handles all 9 new models
- Test offline scenarios extensively
- Monitor sync queue size

#### Risk 4: UI/UX Complexity
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Reuse existing component patterns
- Consistent design system
- User testing for complex workflows
- Simplified flows where possible
- Contextual help text

### Schedule Risks

#### Risk 5: Underestimated Complexity
**Impact**: High
**Probability**: Medium
**Mitigation**:
- 10% buffer built into each week
- Prioritize critical features first
- MVP approach (can add polish later)
- Daily progress tracking
- Weekly milestone reviews

#### Risk 6: Testing Delays
**Impact**: Medium
**Probability**: Low
**Mitigation**:
- Test as you build (TDD approach)
- Parallel testing and development where possible
- Automated test suite
- Dedicated testing week (Week 8)

### Quality Risks

#### Risk 7: Incomplete Test Coverage
**Impact**: High
**Probability**: Low
**Mitigation**:
- 90% coverage target enforced
- Integration tests for all workflows
- Manual testing checklist
- Code review before merge
- Continuous integration checks

#### Risk 8: Documentation Gaps
**Impact**: Low
**Probability**: Medium
**Mitigation**:
- Document as you build
- JSDoc comments required
- API documentation generated automatically
- User guide reviewed by non-technical user
- README updated incrementally

---

## Success Metrics

### Completion Metrics

- [ ] 9/9 database models created
- [ ] 3/3 schema migrations deployed
- [ ] 4/4 screens functional
- [ ] 20+ components implemented
- [ ] 10+ services implemented
- [ ] 90%+ test coverage
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings

### Performance Metrics

- [ ] ProjectOverviewScreen loads in <2s
- [ ] FinancialReportsScreen loads in <2s
- [ ] ResourceAllocationScreen loads in <2s
- [ ] TeamManagementScreen loads in <2s
- [ ] Database queries complete in <500ms
- [ ] Chart rendering in <1s
- [ ] Smooth scrolling (60fps)

### Quality Metrics

- [ ] All acceptance criteria met
- [ ] All manual test cases pass
- [ ] No critical bugs
- [ ] No security vulnerabilities
- [ ] Accessibility standards met
- [ ] Offline-first verified
- [ ] Documentation complete

### Business Metrics

- [ ] Manager role functionality: 25% → 100%
- [ ] 4/4 screens operational
- [ ] All Manager workflows supported
- [ ] Ready for production deployment
- [ ] User guide available
- [ ] Training materials prepared

---

## Timeline Summary

| Week | Focus Area | Deliverables | Status |
|------|------------|-------------|---------|
| 1-2 | Team Management | 3 models, v20 migration, TeamManagementScreen | Pending |
| 3-4 | Financial Reports | 3 models, v21 migration, FinancialReportsScreen | Pending |
| 5-6 | Resource Allocation | 3 models, v22 migration, ResourceAllocationScreen | Pending |
| 7 | Project Overview Integration | Real data integration, navigation | Pending |
| 8 | Testing & Polish | Tests, optimization, documentation | Pending |

---

## Next Steps

### Immediate Actions (Ready to Start)

1. **Week 1: Begin Team Management Implementation**
   - Create TeamModel, TeamMemberModel, ResourceRequestModel
   - Build schema migration v20
   - Create TeamManagementService

2. **Setup Development Environment**
   - Create test data seeds
   - Setup performance monitoring
   - Configure test coverage reporting

3. **Stakeholder Alignment**
   - Review execution plan
   - Confirm priorities
   - Agree on acceptance criteria

---

**Document Version**: 1.0
**Created**: 2025-11-02
**Status**: Ready for Implementation
**Estimated Completion**: 8 weeks from start date
