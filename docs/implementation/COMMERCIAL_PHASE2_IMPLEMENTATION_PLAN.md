# Commercial Phase 2: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 2 - Important Improvements
**Role:** Commercial
**Total Estimated Time:** 28-36 hours
**Created:** 2026-01-05

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 2.1: Refactor State Management](#task-21-refactor-state-management)
4. [Task 2.2: Create Shared Components](#task-22-create-shared-components)
5. [Task 2.3: Add Loading Skeletons](#task-23-add-loading-skeletons)
6. [Implementation Timeline](#implementation-timeline)
7. [Success Metrics](#success-metrics)
8. [Testing Strategy](#testing-strategy)
9. [Quality Checklist](#quality-checklist)
10. [References](#references)

---

## Overview

This document provides a comprehensive implementation plan for Commercial Phase 2, covering all 3 tasks: State Management Refactor, Shared Components, and Loading Skeletons.

### Why Commercial Phase 2 Matters

**Commercial Role** manages 5 screens with financial and budget data:
- Invoice management and tracking
- Budget allocation and variance
- Cost tracking across categories
- Financial reports and analytics
- Dashboard with KPIs

**Current Pain Points:**
- BudgetManagementScreen has 11 useState hooks (complex form state)
- Custom hooks in multiple screens have distributed state
- No shared components for financial UI patterns
- Loading states use generic spinners
- Repeated code for invoice cards, budget displays, cost forms

**Phase 2 Goals:**
1. Consolidate state management with useReducer pattern
2. Create 4 reusable financial components
3. Add professional loading skeletons to 3 key screens
4. Improve code maintainability and consistency

---

## Current State Analysis

### Commercial Screens Overview (5 total)

| Screen | useState Count | Complexity | Phase 1 Status | Phase 2 Priority |
|--------|---------------|------------|----------------|------------------|
| BudgetManagementScreen | 11 | Very High | ✅ Refactored | 🎯 **#1 for Task 2.1** |
| InvoiceManagementScreen | 3+hooks | High | ✅ Refactored | 🎯 **#2 for Task 2.1** |
| CostTrackingScreen | 1+hooks | High | ✅ Refactored | 🎯 **#3 for Task 2.1** |
| FinancialReportsScreen | hooks only | Medium | ✅ Refactored | 🎯 **#4 for Task 2.1** |
| CommercialDashboardScreen | hooks only | Medium | ✅ Refactored | 🎯 **#5 for Task 2.1** |

**Note:** Commercial screens were heavily refactored in Phase 1, with most state moved to custom hooks. Phase 2 will consolidate these hooks into useReducer patterns.

**Total useState across screens + hooks:** ~40-50 (estimated with hooks)

**Phase 1 Achievements:**
- All 5 screens refactored with custom hooks
- 74.3% average code reduction
- Zero console logs
- All screens protected with error boundaries

**Phase 2 Target:** Consolidate hook-based state into useReducer for all 5 screens

---

## Task 2.1: Refactor State Management

**Estimated Time:** 14-18 hours
**Priority:** High
**Complexity:** High

### Objective

Convert all 5 Commercial screens from hook-based useState patterns to centralized `useReducer` pattern, following the established Manager and Logistics role patterns.

### Target Screens

#### 1. BudgetManagementScreen (11 useState → 1 useReducer)

**Current State (11 useState):**
```typescript
const [budgets, setBudgets] = useState<Budget[]>([]);
const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
const [loading, setLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [showFilterMenu, setShowFilterMenu] = useState(false);
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [showEditDialog, setShowEditDialog] = useState(false);
const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
const [formCategory, setFormCategory] = useState('labor');
const [formAmount, setFormAmount] = useState('');
const [formDescription, setFormDescription] = useState('');
```

**Target State (1 useReducer):**
```typescript
interface BudgetManagementState {
  ui: {
    loading: boolean;
    showFilterMenu: boolean;
    showCreateDialog: boolean;
    showEditDialog: boolean;
  };
  data: {
    budgets: Budget[];
    filteredBudgets: Budget[];
    editingBudget: Budget | null;
  };
  filters: {
    searchQuery: string;
    category: string;
  };
  form: {
    category: string;
    amount: string;
    description: string;
  };
}

const [state, dispatch] = useReducer(budgetManagementReducer, initialState);
```

**Reduction:** 11 useState → 1 useReducer (**91% reduction!**)

---

#### 2. InvoiceManagementScreen (3 useState + hooks → 1 useReducer)

**Current State (3 useState + custom hooks):**
```typescript
// Main screen
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [showEditDialog, setShowEditDialog] = useState(false);
const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

// useInvoiceData hook
const [invoices, setInvoices] = useState<Invoice[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

// useInvoiceFilters hook
const [searchQuery, setSearchQuery] = useState('');
const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
```

**Target State (1 useReducer):**
```typescript
interface InvoiceManagementState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    showCreateDialog: boolean;
    showEditDialog: boolean;
  };
  data: {
    invoices: Invoice[];
    filteredInvoices: Invoice[];
    editingInvoice: Invoice | null;
  };
  filters: {
    searchQuery: string;
    statusFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue';
  };
}

const [state, dispatch] = useReducer(invoiceManagementReducer, initialState);
```

**Reduction:** 8 useState → 1 useReducer (**88% reduction!**)

---

#### 3. CostTrackingScreen (1 useState + hooks → 1 useReducer)

**Current State (1 useState + custom hooks):**
```typescript
// Main screen
const [showFilterMenu, setShowFilterMenu] = useState(false);

// useCostData hook
const [costs, setCosts] = useState<Cost[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [summary, setSummary] = useState({...});

// useCostFilters hook
const [searchQuery, setSearchQuery] = useState('');
const [categoryFilter, setCategoryFilter] = useState('all');
const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'quarter'>('month');

// useCostForm hook (in dialog)
const [category, setCategory] = useState('');
const [amount, setAmount] = useState('');
const [description, setDescription] = useState('');
const [date, setDate] = useState(new Date());
const [vendor, setVendor] = useState('');
// ... more form state
```

**Target State (1 useReducer):**
```typescript
interface CostTrackingState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    showFilterMenu: boolean;
    showFormDialog: boolean;
  };
  data: {
    costs: Cost[];
    filteredCosts: Cost[];
    summary: CostSummary;
    editingCost: Cost | null;
  };
  filters: {
    searchQuery: string;
    category: string;
    dateRange: 'week' | 'month' | 'quarter';
  };
  form: {
    category: string;
    amount: string;
    description: string;
    date: Date;
    vendor: string;
    invoiceNumber: string;
    paymentStatus: string;
  };
}

const [state, dispatch] = useReducer(costTrackingReducer, initialState);
```

**Reduction:** ~15 useState → 1 useReducer (**93% reduction!**)

---

#### 4. FinancialReportsScreen (hooks only → 1 useReducer)

**Current State (custom hooks):**
```typescript
// useReportData hook
const [loading, setLoading] = useState(true);
const [profitability, setProfitability] = useState({...});
const [variance, setVariance] = useState({...});

// useDateFilter hook
const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
```

**Target State (1 useReducer):**
```typescript
interface FinancialReportsState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    exportDialogVisible: boolean;
  };
  data: {
    profitability: ProfitabilityData;
    budgetVariance: VarianceData;
    costDistribution: DistributionData;
    cashFlow: CashFlowData;
    invoicesSummary: InvoiceSummaryData;
  };
  filters: {
    selectedPeriod: 'month' | 'quarter' | 'year';
    startDate: Date | null;
    endDate: Date | null;
  };
}

const [state, dispatch] = useReducer(financialReportsReducer, initialState);
```

**Reduction:** 6 useState → 1 useReducer (**83% reduction!**)

---

#### 5. CommercialDashboardScreen (hooks only → 1 useReducer)

**Current State (custom hooks):**
```typescript
// useDashboardData hook
const [loading, setLoading] = useState(true);
const [kpis, setKpis] = useState({...});
const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
```

**Target State (1 useReducer):**
```typescript
interface DashboardState {
  ui: {
    loading: boolean;
    refreshing: boolean;
    selectedPeriod: 'week' | 'month' | 'quarter';
  };
  data: {
    kpis: DashboardKPIs;
    recentInvoices: Invoice[];
    budgetOverview: BudgetOverview;
    costTrends: CostTrend[];
    alerts: Alert[];
  };
}

const [state, dispatch] = useReducer(dashboardReducer, initialState);
```

**Reduction:** 3 useState → 1 useReducer (**67% reduction!**)

---

### Implementation Structure

```
src/commercial/state/
├── budget/
│   ├── budgetManagementReducer.ts     # BudgetManagementScreen reducer
│   └── budgetManagementActions.ts     # Action creators
├── invoice/
│   ├── invoiceManagementReducer.ts    # InvoiceManagementScreen reducer
│   └── invoiceManagementActions.ts    # Action creators
├── cost/
│   ├── costTrackingReducer.ts         # CostTrackingScreen reducer
│   └── costTrackingActions.ts         # Action creators
├── reports/
│   ├── financialReportsReducer.ts     # FinancialReportsScreen reducer
│   └── financialReportsActions.ts     # Action creators
├── dashboard/
│   ├── dashboardReducer.ts            # CommercialDashboardScreen reducer
│   └── dashboardActions.ts            # Action creators
└── index.ts                            # Barrel exports
```

### Implementation Steps (Task 2.1)

**Phase 1:** BudgetManagementScreen (4-5 hours)
1. Create budgetManagementReducer and actions
2. Refactor screen to use useReducer
3. Test budget CRUD operations and filtering
4. Validate TypeScript 0 errors

**Phase 2:** InvoiceManagementScreen (3-4 hours)
1. Create invoiceManagementReducer and actions
2. Replace hooks with useReducer
3. Test invoice operations and status filtering
4. Validate TypeScript 0 errors

**Phase 3:** CostTrackingScreen (3-4 hours)
1. Create costTrackingReducer and actions
2. Consolidate form and filter state
3. Test cost tracking and category filtering
4. Validate TypeScript 0 errors

**Phase 4:** FinancialReportsScreen (2-3 hours)
1. Create financialReportsReducer and actions
2. Refactor report data and date filters
3. Test report generation and date ranges
4. Validate TypeScript 0 errors

**Phase 5:** CommercialDashboardScreen (2-2 hours)
1. Create dashboardReducer and actions
2. Refactor dashboard data state
3. Test KPI display and data loading
4. Validate TypeScript 0 errors

**Total Task 2.1 Time:** 14-18 hours

---

## Task 2.2: Create Shared Components

**Estimated Time:** 8-12 hours
**Priority:** High
**Complexity:** Medium

### Objective

Create 4 reusable shared components to reduce code duplication and establish consistent UI patterns across Commercial screens.

### Component Specifications

#### 1. InvoiceCard (140-170 LOC)

**Purpose:** Display invoice items with status, amounts, and actions

**Props:**
```typescript
interface InvoiceCardProps {
  invoice: Invoice;
  onPress?: (id: string) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  amount: number;
  paidAmount: number;
  dueDate: number;
  issueDate: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  notes?: string;
}
```

**Features:**
- Status badge with color coding (draft=gray, sent=blue, paid=green, overdue=red)
- Amount display with currency formatting
- Payment progress indicator
- Due date with overdue warning
- Action buttons (Edit, Delete, Send, Mark Paid)
- Compact/detailed variants
- Client and project info

**Usage:**
```typescript
<InvoiceCard
  invoice={item}
  onPress={handleViewDetails}
  onEdit={handleEdit}
  onSend={handleSend}
  onMarkPaid={handleMarkPaid}
  showActions
  variant="detailed"
/>
```

---

#### 2. BudgetSummaryChart (150-180 LOC)

**Purpose:** Visual budget allocation and variance display

**Props:**
```typescript
interface BudgetSummaryChartProps {
  budgets: BudgetCategory[];
  showVariance?: boolean;
  showLegend?: boolean;
  chartType?: 'bar' | 'pie' | 'donut';
  onCategoryPress?: (category: string) => void;
  height?: number;
}

interface BudgetCategory {
  category: string;
  allocated: number;
  actual: number;
  variance: number;
  variancePercent: number;
}
```

**Features:**
- Multiple chart types (bar, pie, donut)
- Color-coded categories
- Variance indicators (green=under, red=over, yellow=at-risk)
- Interactive legend
- Tap to drill down
- Percentage labels
- Currency formatting

**Usage:**
```typescript
<BudgetSummaryChart
  budgets={budgetData}
  showVariance
  showLegend
  chartType="donut"
  onCategoryPress={handleCategoryDrilldown}
  height={250}
/>
```

---

#### 3. CostBreakdownTable (130-160 LOC)

**Purpose:** Tabular cost data with sorting and totals

**Props:**
```typescript
interface CostBreakdownTableProps {
  costs: Cost[];
  groupBy?: 'category' | 'vendor' | 'date' | 'project';
  showTotals?: boolean;
  sortable?: boolean;
  onRowPress?: (cost: Cost) => void;
  emptyMessage?: string;
}

interface Cost {
  id: string;
  category: string;
  vendor: string;
  amount: number;
  date: number;
  description: string;
  invoiceNumber?: string;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  projectId: string;
}
```

**Features:**
- Grouping by category/vendor/date/project
- Sortable columns
- Subtotals for groups
- Grand total row
- Status indicators
- Currency formatting
- Date formatting
- Row press for details
- Empty state message

**Usage:**
```typescript
<CostBreakdownTable
  costs={costsData}
  groupBy="category"
  showTotals
  sortable
  onRowPress={handleCostDetails}
/>
```

---

#### 4. FinancialReportExporter (120-150 LOC)

**Purpose:** Export financial reports to various formats

**Props:**
```typescript
interface FinancialReportExporterProps {
  reportData: ReportData;
  reportType: 'profitability' | 'variance' | 'cashflow' | 'full';
  projectName: string;
  dateRange: { start: Date; end: Date };
  formats?: ('pdf' | 'excel' | 'csv')[];
  onExportComplete?: (format: string, success: boolean) => void;
}

interface ReportData {
  profitability: ProfitabilityData;
  budgetVariance: VarianceData;
  costDistribution: DistributionData;
  cashFlow: CashFlowData;
  invoices: Invoice[];
}
```

**Features:**
- Multiple export formats (PDF, Excel, CSV)
- Format selection dialog
- Progress indicator during export
- Success/error feedback
- Customizable report sections
- Date range in header
- Project branding
- Auto-generated filename

**Usage:**
```typescript
<FinancialReportExporter
  reportData={reportData}
  reportType="full"
  projectName={projectName}
  dateRange={{ start: startDate, end: endDate }}
  formats={['pdf', 'excel', 'csv']}
  onExportComplete={handleExportComplete}
/>
```

---

### Component Directory Structure

```
src/commercial/shared/
├── components/
│   ├── InvoiceCard.tsx
│   ├── BudgetSummaryChart.tsx
│   ├── CostBreakdownTable.tsx
│   ├── FinancialReportExporter.tsx
│   └── index.ts
├── types/
│   ├── invoice.ts
│   ├── budget.ts
│   ├── cost.ts
│   ├── report.ts
│   └── index.ts
└── index.ts
```

### Implementation Steps (Task 2.2)

**Phase 1:** InvoiceCard (2-3 hours)
1. Create component file with TypeScript interfaces
2. Implement card layout with variants
3. Add status indicators and payment progress
4. Add action buttons
5. Write JSDoc with examples
6. Export via barrel

**Phase 2:** BudgetSummaryChart (3-4 hours)
1. Create chart component
2. Implement multiple chart types
3. Add variance indicators
4. Implement interactive legend
5. Add drill-down functionality

**Phase 3:** CostBreakdownTable (2-3 hours)
1. Create table component
2. Implement grouping logic
3. Add sorting functionality
4. Calculate totals and subtotals
5. Add empty state

**Phase 4:** FinancialReportExporter (1-2 hours)
1. Create exporter component
2. Implement format selection dialog
3. Add export logic (stub for now)
4. Add progress and feedback
5. Final exports and documentation

**Total Task 2.2 Time:** 8-12 hours

---

## Task 2.3: Add Loading Skeletons

**Estimated Time:** 6-6 hours
**Priority:** Medium
**Complexity:** Medium

### Objective

Create 3 specialized loading skeletons for key Commercial screens to improve perceived performance during data loading.

### Skeleton Specifications

#### 1. DashboardSkeleton (100-130 LOC)

**Purpose:** Loading skeleton for CommercialDashboardScreen

**Structure:**
```typescript
interface DashboardSkeletonProps {
  style?: ViewStyle;
}

/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for Commercial Dashboard Screen.
 * Shows placeholders for KPIs, charts, and invoice list.
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
        <Skeleton width="30%" height={36} borderRadius={4} />
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="60%" height={14} marginBottom={8} />
            <Skeleton width="80%" height={32} marginBottom={4} />
            <Skeleton width="40%" height={12} />
          </View>
        ))}
      </View>

      {/* Chart Section */}
      <View style={styles.chartSection}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={200} borderRadius={8} />
      </View>

      {/* Recent Invoices */}
      <View style={styles.invoiceSection}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        {[1, 2, 3].map(i => (
          <SkeletonCard key={i} lines={2} variant="compact" />
        ))}
      </View>
    </ScrollView>
  );
};
```

---

#### 2. InvoiceListSkeleton (90-120 LOC)

**Purpose:** Loading skeleton for InvoiceManagementScreen

**Structure:**
```typescript
interface InvoiceListSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

/**
 * InvoiceListSkeleton Component
 *
 * Loading skeleton for Invoice Management Screen.
 * Shows list of invoice card placeholders.
 */
export const InvoiceListSkeleton: React.FC<InvoiceListSkeletonProps> = ({
  count = 5,
  style
}) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Search and Filters */}
      <View style={styles.header}>
        <Skeleton width="100%" height={48} borderRadius={8} marginBottom={12} />
        <View style={styles.filterRow}>
          <Skeleton width="23%" height={32} borderRadius={16} />
          <Skeleton width="23%" height={32} borderRadius={16} />
          <Skeleton width="23%" height={32} borderRadius={16} />
          <Skeleton width="23%" height={32} borderRadius={16} />
        </View>
      </View>

      {/* Invoice Cards */}
      <View style={styles.invoiceList}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.invoiceCard}>
            <View style={styles.cardHeader}>
              <Skeleton width="40%" height={16} marginBottom={4} />
              <Skeleton width={80} height={24} borderRadius={12} />
            </View>
            <Skeleton width="60%" height={14} marginBottom={8} />
            <Skeleton width="70%" height={14} marginBottom={12} />
            <View style={styles.cardFooter}>
              <Skeleton width="45%" height={20} />
              <Skeleton width="45%" height={20} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
```

---

#### 3. FinancialChartsSkeleton (110-140 LOC)

**Purpose:** Loading skeleton for FinancialReportsScreen

**Structure:**
```typescript
interface FinancialChartsSkeletonProps {
  style?: ViewStyle;
}

/**
 * FinancialChartsSkeleton Component
 *
 * Loading skeleton for Financial Reports Screen.
 * Shows placeholders for date filters, charts, and tables.
 */
export const FinancialChartsSkeleton: React.FC<FinancialChartsSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]}>
      {/* Date Range Filter */}
      <View style={styles.dateFilter}>
        <Skeleton width="45%" height={48} borderRadius={8} />
        <Skeleton width="45%" height={48} borderRadius={8} />
      </View>

      {/* Profitability Chart */}
      <View style={styles.chartSection}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={220} borderRadius={8} />
      </View>

      {/* Budget Variance Chart */}
      <View style={styles.chartSection}>
        <Skeleton width="50%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={220} borderRadius={8} />
      </View>

      {/* Cost Distribution */}
      <View style={styles.section}>
        <Skeleton width="45%" height={20} marginBottom={12} />
        <View style={styles.distributionRow}>
          <Skeleton width="48%" height={180} borderRadius={8} />
          <Skeleton width="48%" height={180} borderRadius={8} />
        </View>
      </View>

      {/* Summary Table */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} lines={1} variant="compact" />
        ))}
      </View>
    </ScrollView>
  );
};
```

---

### Skeleton Directory Structure

```
src/commercial/shared/skeletons/
├── DashboardSkeleton.tsx
├── InvoiceListSkeleton.tsx
├── FinancialChartsSkeleton.tsx
└── index.ts
```

### Implementation Steps (Task 2.3)

**Phase 1:** Setup & DashboardSkeleton (2 hours)
1. Create skeletons directory structure
2. Create barrel exports
3. Implement DashboardSkeleton
4. Match CommercialDashboardScreen layout
5. Test shimmer animation

**Phase 2:** InvoiceListSkeleton (2 hours)
1. Implement invoice list layout
2. Add search/filter placeholders
3. Create invoice card skeleton
4. Test responsiveness

**Phase 3:** FinancialChartsSkeleton (2 hours)
1. Implement chart placeholders
2. Add date filter skeleton
3. Match FinancialReportsScreen layout
4. Final integration and validation

**Total Task 2.3 Time:** 6 hours

---

## Implementation Timeline

### Task 2.1: State Management (14-18 hours)

**Days 1-2:** BudgetManagementScreen + InvoiceManagementScreen (7-9h)
- Create reducers and actions for both screens
- Refactor screens to use useReducer
- Test CRUD operations and filtering
- Validate TypeScript 0 errors

**Days 3-4:** CostTrackingScreen + FinancialReportsScreen (5-7h)
- Create reducers and actions
- Consolidate hook state into useReducer
- Test tracking and reporting features
- Validate TypeScript 0 errors

**Day 5:** CommercialDashboardScreen (2-2h)
- Create dashboardReducer and actions
- Refactor dashboard state
- Final validation across all screens

### Task 2.2: Shared Components (8-12 hours)

**Days 1-2:** InvoiceCard + BudgetSummaryChart (5-7h)
- Create component files with TypeScript interfaces
- Implement layouts and features
- Add status indicators and charts
- Documentation

**Day 3:** CostBreakdownTable (2-3h)
- Create table component
- Implement grouping and sorting
- Add totals calculation

**Day 4:** FinancialReportExporter (1-2h)
- Create exporter component
- Implement format selection
- Final exports and documentation

### Task 2.3: Loading Skeletons (6 hours)

**Days 1-2:** All 3 Skeletons (6h)
- DashboardSkeleton (2h)
- InvoiceListSkeleton (2h)
- FinancialChartsSkeleton (2h)
- Integration and final validation

---

## Success Metrics

### Task 2.1 Success Criteria

- ✅ 5 screens refactored (Budget, Invoice, Cost, Reports, Dashboard)
- ✅ useState reduction: ~40-50 → 5 useReducer (**90% reduction**)
- ✅ TypeScript: 0 errors across all refactored files
- ✅ ESLint: 0 errors, 0 warnings
- ✅ All existing functionality works identically
- ✅ Improved maintainability (centralized state logic)

### Task 2.2 Success Criteria

- ✅ 4 shared components created
- ✅ Total component LOC: ~540-660
- ✅ All components have TypeScript interfaces
- ✅ JSDoc documentation with examples
- ✅ Reusable across multiple screens
- ✅ Clean barrel exports
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

### Task 2.3 Success Criteria

- ✅ 3 loading skeletons created
- ✅ Total skeleton LOC: ~300-390
- ✅ All skeletons integrated into screens
- ✅ Smooth shimmer animation
- ✅ Perceived performance improvement: 40-60%
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

---

## Testing Strategy

### Manual Testing Checklist

**Task 2.1: State Management**
- [ ] BudgetManagement: Budget CRUD, filtering, variance calculation
- [ ] InvoiceManagement: Invoice CRUD, status filtering, search
- [ ] CostTracking: Cost CRUD, category filtering, summary calculations
- [ ] FinancialReports: Report generation, date filtering, data display
- [ ] Dashboard: KPI display, data loading, period switching

**Task 2.2: Shared Components**
- [ ] InvoiceCard: All variants, status display, actions
- [ ] BudgetSummaryChart: All chart types, variance indicators, drill-down
- [ ] CostBreakdownTable: Grouping, sorting, totals
- [ ] FinancialReportExporter: Format selection, export process

**Task 2.3: Loading Skeletons**
- [ ] DashboardSkeleton: Matches real layout, smooth animation
- [ ] InvoiceListSkeleton: List layout, responsive design
- [ ] FinancialChartsSkeleton: Chart and table placeholders

### Automated Testing

**TypeScript Validation:**
```bash
npx tsc --noEmit src/commercial/**/*.{ts,tsx}
```

**ESLint Validation:**
```bash
npx eslint "src/commercial/**/*.{ts,tsx}" --max-warnings 0
```

---

## Quality Checklist

### Code Quality
- [ ] All new files have proper file headers
- [ ] All components have TypeScript interfaces
- [ ] All functions have JSDoc documentation
- [ ] No console.log statements
- [ ] No hardcoded values (use constants)
- [ ] Follows existing code style

### Component Quality
- [ ] All props have default values where appropriate
- [ ] All components handle edge cases
- [ ] All components are accessible
- [ ] All components are performant
- [ ] All components have usage examples

### Testing Quality
- [ ] All manual tests pass
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] No regression issues
- [ ] Performance is improved

### Documentation Quality
- [ ] Implementation plan is complete
- [ ] Usage examples are provided
- [ ] PROGRESS_TRACKING.md is updated
- [ ] Code comments are helpful
- [ ] All exports are documented

---

## References

### Related Documents
- `docs/implementation/MANAGER_PHASE2_TASK2.1_IMPLEMENTATION_PLAN.md` - useReducer pattern reference
- `docs/implementation/LOGISTICS_PHASE2_IMPLEMENTATION_PLAN.md` - Phase 2 pattern reference
- `docs/implementation/SHARED_COMPONENTS_USAGE.md` - Shared components guide
- `ALL_ROLES_IMPROVEMENTS_ROADMAP.md` - Overall project roadmap

### Existing Patterns to Follow
- Manager state management (useReducer with nested state)
- Logistics shared components (barrel exports, TypeScript interfaces)
- Manager/Logistics loading skeletons (base skeleton components, shimmer animation)
- Existing Commercial Phase 1 refactors (hooks patterns)

### Key Files to Reference
- `src/manager/state/` - State management patterns
- `src/logistics/state/` - State management patterns
- `src/manager/shared/components/` - Shared component patterns
- `src/logistics/shared/components/` - Shared component patterns
- `src/components/skeletons/` - Base skeleton components

---

**Document Status:** Complete
**Last Updated:** 2026-01-05
**Review Status:** Ready for Implementation
**Approved By:** Pending
