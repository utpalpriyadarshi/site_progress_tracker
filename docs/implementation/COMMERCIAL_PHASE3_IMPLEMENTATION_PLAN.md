# Commercial Phase 3: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Commercial
**Total Estimated Time:** 38-48 hours
**Created:** 2026-01-21
**Status:** Ready for Implementation
**Branch:** `commercial/phase3-implementation`

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 3.1: Dashboard Redesign with Financial KPI Widgets](#task-31-dashboard-redesign-with-financial-kpi-widgets)
4. [Task 3.2: Accessibility Features](#task-32-accessibility-features)
5. [Task 3.3: Enhanced Empty States](#task-33-enhanced-empty-states)
6. [Task 3.4: Search & Filter Performance](#task-34-search--filter-performance)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing Strategy](#testing-strategy)
9. [Quality Checklist](#quality-checklist)

---

## Overview

Commercial Phase 3 focuses on creating an enhanced dashboard with interactive financial KPI widgets, adding WCAG 2.1 AA accessibility compliance for financial data tables and charts, implementing context-aware empty states, and optimizing search/filter performance for invoices and cost tracking.

### Why Commercial Phase 3 Now?

**Context:**
- ✅ Phase 1 Complete: Console logs removed (40), error boundaries added (5 screens), large files refactored
- ✅ Phase 2 Complete: useReducer state management, shared components, skeleton screens
- ✅ Manager Phase 3 Complete: Widget patterns and accessibility utilities established
- ✅ Logistics Phase 3 Complete: Dashboard widget system proven, accessibility patterns refined
- ✅ Utilities available: `src/utils/accessibility/`, `src/utils/performance/`

**Phase 3 Goals:**
1. Create enhanced dashboard with interactive financial KPI widgets
2. Add chart interactivity (tap for details, drill-down)
3. Achieve WCAG 2.1 AA accessibility compliance for financial data
4. Implement context-aware empty states for all screens
5. Optimize invoice search and cost tracking filters (debouncing, memoization)

---

## Current State Analysis

### Commercial Screens (5 total)

After Phase 1 & 2 completion:

| Screen | Current LOC | State Management | Components | Hooks | Status |
|--------|-------------|------------------|------------|-------|--------|
| CommercialDashboardScreen | ~148 | ✅ useReducer | 6 cards | 1 | Phase 2 Complete |
| BudgetManagementScreen | ~710 | ✅ useReducer | - | - | Phase 2 Complete |
| CostTrackingScreen | ~253 | ✅ useReducer | 7 components | 3 | Phase 2 Complete |
| InvoiceManagementScreen | ~234 | ✅ useReducer | 5 components | 2 | Phase 2 Complete |
| FinancialReportsScreen | ~195 | ✅ useReducer | 7 components | 2 | Phase 2 Complete |

### Existing Component Structure

```
src/commercial/
├── context/
│   └── CommercialContext.tsx
├── dashboard/
│   ├── components/
│   │   ├── AlertsCard.tsx
│   │   ├── BudgetSummaryCard.tsx
│   │   ├── CashFlowCard.tsx
│   │   ├── CategoryBreakdownCard.tsx
│   │   ├── InvoicesSummaryCard.tsx
│   │   └── RecentCostsCard.tsx
│   ├── hooks/
│   │   └── useDashboardData.ts
│   └── utils/
│       ├── dashboardCalculations.ts
│       └── dashboardConstants.ts
├── cost-tracking/
│   ├── components/ (7 components)
│   ├── hooks/ (3 hooks)
│   └── utils/ (formatters, constants)
├── invoice-management/
│   ├── components/ (5 components)
│   ├── hooks/ (2 hooks)
│   └── utils/ (constants, validation)
├── financial-reports/
│   ├── components/ (7 components)
│   ├── hooks/ (2 hooks)
│   └── utils/ (calculations, constants)
├── shared/
│   ├── components/ (4 components)
│   ├── skeletons/ (3 skeletons)
│   └── types/ (budget, cost, invoice, report)
└── state/
    ├── budget/
    ├── cost/
    ├── dashboard/
    ├── invoice/
    └── reports/
```

**Completed in Phase 1 & 2:**
- ✅ Console logs removed (40 → 0)
- ✅ Error boundaries added (5/5)
- ✅ Large files refactored (67-82% reduction)
- ✅ State management with useReducer (all screens)
- ✅ Shared components created
- ✅ Loading skeletons added
- ✅ CommercialContext provider exists

**Phase 3 Focus:**
- 🎯 Enhanced dashboard with interactive KPI widgets
- 🎯 Chart interactivity and drill-down functionality
- 🎯 Full accessibility compliance (WCAG 2.1 AA)
- 🎯 Screen reader descriptions for charts
- 🎯 Enhanced empty states with context-aware messaging
- 🎯 Optimized search/filter performance

---

## Task 3.1: Dashboard Redesign with Financial KPI Widgets

**Estimated Time:** 16-20 hours
**Priority:** High
**Complexity:** High

### Objective

1. Transform existing dashboard cards into interactive KPI widgets
2. Add chart interactivity (tap for details, drill-down to related screens)
3. Create new trend indicator components
4. Add period comparison functionality (MTD, QTD, YTD)

### Implementation Plan

#### Phase 1: Widget Infrastructure (4-5 hours)

**1.1 Create BaseWidget Component**

**File:** `src/commercial/dashboard/widgets/BaseWidget.tsx` (new)

```typescript
/**
 * BaseWidget Component
 *
 * Base component for all dashboard widgets with:
 * - Consistent styling and layout
 * - Loading, error, and empty states
 * - Accessibility support
 * - Interactive tap handlers
 */

interface BaseWidgetProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onPress?: () => void;
  onRefresh?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  children: React.ReactNode;
}
```

**1.2 Create TrendIndicator Component**

**File:** `src/commercial/dashboard/widgets/TrendIndicator.tsx` (new)

```typescript
/**
 * TrendIndicator Component
 *
 * Shows trend direction with percentage change:
 * - Up arrow (green) for positive trends
 * - Down arrow (red) for negative trends
 * - Neutral indicator for no change
 * - Accessibility announcements for screen readers
 */

interface TrendIndicatorProps {
  value: number;        // Current value
  previousValue: number; // Previous period value
  format?: 'percentage' | 'currency' | 'number';
  invertColors?: boolean; // For costs where down is good
}
```

**1.3 Create PeriodSelector Component**

**File:** `src/commercial/dashboard/widgets/PeriodSelector.tsx` (new)

```typescript
/**
 * PeriodSelector Component
 *
 * Allows switching between time periods:
 * - MTD (Month to Date)
 * - QTD (Quarter to Date)
 * - YTD (Year to Date)
 * - Custom date range
 */

type Period = 'mtd' | 'qtd' | 'ytd' | 'custom';
```

#### Phase 2: Financial KPI Widgets (6-8 hours)

**2.1 Enhance BudgetHealthWidget**

**File:** `src/commercial/dashboard/widgets/BudgetHealthWidget.tsx` (new)

Features:
- Circular progress indicator for budget utilization
- Color-coded status (green/yellow/red based on thresholds)
- Tap to navigate to BudgetManagement screen
- Trend indicator showing change from last period
- Accessible value announcements

```typescript
interface BudgetHealthWidgetProps {
  totalBudget: number;
  totalSpent: number;
  percentageUsed: number;
  previousPeriodPercentage?: number;
  onPress?: () => void;
}
```

**2.2 Enhance CashFlowWidget**

**File:** `src/commercial/dashboard/widgets/CashFlowWidget.tsx` (new)

Features:
- Mini sparkline chart for cash flow trend
- Current balance with inflow/outflow breakdown
- Period selector (weekly/monthly view)
- Tap to navigate to FinancialReports screen
- Screen reader chart description

**2.3 Enhance InvoiceStatusWidget**

**File:** `src/commercial/dashboard/widgets/InvoiceStatusWidget.tsx` (new)

Features:
- Stacked bar showing pending/paid/overdue
- Count badges for each status
- Overdue alert indicator
- Tap to navigate to InvoiceManagement screen
- Accessibility label with status breakdown

**2.4 Create CategorySpendingWidget**

**File:** `src/commercial/dashboard/widgets/CategorySpendingWidget.tsx` (new)

Features:
- Horizontal bar chart by category
- Top 5 categories with "Others" aggregation
- Budget vs actual comparison
- Tap on category to filter CostTracking
- Accessible chart description

**2.5 Create RecentTransactionsWidget**

**File:** `src/commercial/dashboard/widgets/RecentTransactionsWidget.tsx` (new)

Features:
- List of last 5 transactions (costs + invoices)
- Type indicator (cost/invoice)
- Quick action buttons
- "View All" link to CostTracking

#### Phase 3: Chart Interactivity (4-5 hours)

**3.1 Create InteractiveChart Component**

**File:** `src/commercial/dashboard/widgets/InteractiveChart.tsx` (new)

Features:
- Tap to show tooltip with details
- Long press for options menu
- Pinch to zoom (for detailed views)
- Accessibility mode (screen reader friendly)

**3.2 Add Drill-Down Navigation**

Wire up all widgets to navigate to relevant detail screens:
- BudgetHealthWidget → BudgetManagementScreen
- CashFlowWidget → FinancialReportsScreen
- InvoiceStatusWidget → InvoiceManagementScreen (with status filter)
- CategorySpendingWidget → CostTrackingScreen (with category filter)

#### Phase 4: Dashboard Integration (2-3 hours)

**4.1 Update CommercialDashboardScreen**

Integrate all new widgets with:
- Grid layout (2 columns on tablet, 1 column on phone)
- Pull-to-refresh functionality
- Period selector at top
- Skeleton loading states
- Error recovery

### New Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `widgets/BaseWidget.tsx` | Base widget component | ~150 |
| `widgets/TrendIndicator.tsx` | Trend direction indicator | ~80 |
| `widgets/PeriodSelector.tsx` | Time period selector | ~100 |
| `widgets/BudgetHealthWidget.tsx` | Budget utilization widget | ~180 |
| `widgets/CashFlowWidget.tsx` | Cash flow widget | ~200 |
| `widgets/InvoiceStatusWidget.tsx` | Invoice status widget | ~180 |
| `widgets/CategorySpendingWidget.tsx` | Category spending widget | ~200 |
| `widgets/RecentTransactionsWidget.tsx` | Recent transactions list | ~150 |
| `widgets/InteractiveChart.tsx` | Interactive chart wrapper | ~180 |
| `widgets/index.ts` | Exports | ~20 |
| `hooks/usePeriodData.ts` | Period-based data hook | ~120 |
| `hooks/useTrendCalculation.ts` | Trend calculation hook | ~80 |

**Total New Lines:** ~1,640

---

## Task 3.2: Accessibility Features

**Estimated Time:** 10-12 hours
**Priority:** High
**Complexity:** Medium

### Objective

1. Achieve WCAG 2.1 AA compliance for financial data tables
2. Add screen reader descriptions for all charts
3. Implement keyboard navigation for financial forms
4. Add high contrast mode support

### Implementation Plan

#### Phase 1: Financial Data Table Accessibility (4-5 hours)

**1.1 Create AccessibleDataTable Component**

**File:** `src/commercial/shared/components/AccessibleDataTable.tsx` (new)

```typescript
/**
 * AccessibleDataTable Component
 *
 * WCAG 2.1 AA compliant data table with:
 * - Proper table semantics (role="table")
 * - Column headers with scope
 * - Row headers for financial data
 * - Sortable columns with aria-sort
 * - Focus management
 * - Screen reader announcements for updates
 */

interface AccessibleDataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  caption?: string;
  summary?: string;
  emptyMessage?: string;
}
```

**1.2 Update CostBreakdownTable**

Enhance existing `CostBreakdownTable` with:
- Proper table role and structure
- Sortable columns with accessibility
- Currency values with proper formatting for screen readers
- Row selection announcements

**1.3 Update Invoice List**

Enhance invoice list with:
- List role with proper item semantics
- Status announcements ("Invoice #123, Overdue by 5 days")
- Action button accessibility
- Focus management for modals

#### Phase 2: Chart Accessibility (4-5 hours)

**2.1 Create ChartAccessibilityProvider**

**File:** `src/commercial/shared/components/ChartAccessibilityProvider.tsx` (new)

```typescript
/**
 * ChartAccessibilityProvider Component
 *
 * Provides accessible alternatives for charts:
 * - Hidden data table for screen readers
 * - Summary text description
 * - Key insights announcements
 * - Alternative text for chart images
 */

interface ChartAccessibilityProviderProps {
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  data: ChartData[];
  title: string;
  description?: string;
  children: React.ReactNode;
}
```

**2.2 Add Chart Descriptions**

For each chart type, generate accessible descriptions:

```typescript
// Example: Budget Health Chart
"Budget utilization is at 75%. Total budget is 50 lakhs,
37.5 lakhs spent, 12.5 lakhs remaining.
This is within the acceptable range."

// Example: Category Breakdown
"Spending by category: Materials 45%, Labor 30%,
Equipment 15%, Other 10%. Materials has the highest
spending at 22.5 lakhs."
```

**2.3 Implement Screen Reader Mode**

Create alternative views for charts when screen reader is detected:
- Show data in accessible table format
- Provide key insights as text
- Allow navigation through data points

#### Phase 3: Form Accessibility (2-3 hours)

**3.1 Enhance InvoiceFormDialog**

- Add proper label associations
- Implement error announcements
- Add field descriptions
- Keyboard navigation support

**3.2 Enhance CostFormDialog**

- Currency input accessibility
- Category picker accessibility
- Date picker accessibility
- Validation error announcements

### New Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `shared/components/AccessibleDataTable.tsx` | Accessible data table | ~250 |
| `shared/components/ChartAccessibilityProvider.tsx` | Chart accessibility wrapper | ~180 |
| `shared/hooks/useChartDescription.ts` | Generate chart descriptions | ~150 |
| `shared/hooks/useTableAccessibility.ts` | Table accessibility utilities | ~100 |

**Total New Lines:** ~680

---

## Task 3.3: Enhanced Empty States

**Estimated Time:** 6-8 hours
**Priority:** Medium
**Complexity:** Low

### Objective

1. Create context-aware empty states for all screens
2. Add actionable suggestions
3. Include relevant illustrations/icons
4. Provide quick action buttons

### Implementation Plan

#### Phase 1: Empty State Components (3-4 hours)

**1.1 Create EmptyState Component**

**File:** `src/commercial/shared/components/EmptyState.tsx` (new)

```typescript
/**
 * EmptyState Component
 *
 * Context-aware empty state with:
 * - Icon or illustration
 * - Title and description
 * - Actionable suggestions
 * - Primary action button
 * - Secondary action (optional)
 */

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  suggestions?: string[];
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}
```

**1.2 Create Screen-Specific Empty States**

| Screen | Empty State Context |
|--------|---------------------|
| Dashboard | "No financial data yet" + Setup guide |
| BudgetManagement | "No budgets created" + Create first budget CTA |
| CostTracking | "No costs recorded" + Add first cost CTA |
| InvoiceManagement | "No invoices" + Create invoice CTA |
| FinancialReports | "Not enough data for reports" + Data requirements |

#### Phase 2: Search Empty States (2-3 hours)

**2.1 Create NoSearchResults Component**

**File:** `src/commercial/shared/components/NoSearchResults.tsx` (new)

```typescript
/**
 * NoSearchResults Component
 *
 * Shows when search/filter returns no results:
 * - Search query display
 * - Suggestions to modify search
 * - Clear filters button
 * - Recent searches (if available)
 */

interface NoSearchResultsProps {
  searchQuery?: string;
  appliedFilters?: string[];
  onClearFilters?: () => void;
  suggestions?: string[];
}
```

**2.2 Implement Empty States in Screens**

Update each screen to show appropriate empty state:
- Check for data loaded but empty
- Check for filtered results empty
- Check for search results empty

### New Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `shared/components/EmptyState.tsx` | Base empty state | ~120 |
| `shared/components/NoSearchResults.tsx` | Search empty state | ~100 |
| `shared/components/EmptyStateIcons.tsx` | SVG icons for empty states | ~80 |
| `dashboard/components/DashboardEmptyState.tsx` | Dashboard-specific | ~80 |
| `invoice-management/components/InvoiceEmptyState.tsx` | Invoice-specific | ~70 |
| `cost-tracking/components/CostEmptyState.tsx` | Cost-specific | ~70 |

**Total New Lines:** ~520

---

## Task 3.4: Search & Filter Performance

**Estimated Time:** 6-8 hours
**Priority:** Medium
**Complexity:** Medium

### Objective

1. Optimize invoice search with debouncing
2. Optimize cost tracking filters with memoization
3. Add search result caching
4. Implement virtual scrolling for large lists

### Implementation Plan

#### Phase 1: Search Optimization (3-4 hours)

**1.1 Create useDebounceSearch Hook**

**File:** `src/commercial/shared/hooks/useDebounceSearch.ts` (new)

```typescript
/**
 * useDebounceSearch Hook
 *
 * Optimized search with:
 * - 300ms debounce delay
 * - Search result caching
 * - Loading state management
 * - Cancel pending searches
 */

interface UseDebounceSearchOptions<T> {
  items: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
  cacheResults?: boolean;
}

interface UseDebounceSearchResult<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredItems: T[];
  isSearching: boolean;
  clearSearch: () => void;
}
```

**1.2 Optimize Invoice Search**

Update `useInvoiceFilters.ts`:
- Add debounced search
- Cache recent search results
- Optimize filter combination logic

**1.3 Optimize Cost Search**

Update `useCostFilters.ts`:
- Add debounced search
- Memoize category filtering
- Optimize date range filtering

#### Phase 2: Filter Performance (2-3 hours)

**2.1 Create useMemoizedFilters Hook**

**File:** `src/commercial/shared/hooks/useMemoizedFilters.ts` (new)

```typescript
/**
 * useMemoizedFilters Hook
 *
 * Memoized filter operations with:
 * - Stable filter references
 * - Efficient re-computation
 * - Filter combination optimization
 */

interface FilterDefinition<T> {
  key: string;
  predicate: (item: T, value: any) => boolean;
}

interface UseMemoizedFiltersResult<T> {
  filteredItems: T[];
  activeFilters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
}
```

**2.2 Implement Virtual Scrolling**

For large invoice/cost lists (>100 items):
- Use FlatList with optimizations
- Implement windowSize and maxToRenderPerBatch
- Add getItemLayout for fixed-height items

#### Phase 3: Integration (1-2 hours)

**3.1 Update InvoiceManagementScreen**

- Replace direct filter with useDebounceSearch
- Add loading indicator during search
- Show search result count

**3.2 Update CostTrackingScreen**

- Use useMemoizedFilters for category/date filters
- Optimize re-renders with React.memo
- Add filter performance metrics (dev mode)

### New Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `shared/hooks/useDebounceSearch.ts` | Debounced search | ~100 |
| `shared/hooks/useMemoizedFilters.ts` | Memoized filters | ~120 |
| `shared/hooks/useVirtualList.ts` | Virtual scrolling helper | ~80 |
| `shared/utils/searchOptimization.ts` | Search utilities | ~60 |

**Total New Lines:** ~360

---

## Implementation Timeline

### Week 1: Dashboard Redesign (16-20 hours)

| Day | Task | Hours | Deliverable |
|-----|------|-------|-------------|
| Day 1 | Widget infrastructure | 4-5h | BaseWidget, TrendIndicator, PeriodSelector |
| Day 2 | Financial KPI widgets (part 1) | 4-5h | BudgetHealthWidget, CashFlowWidget |
| Day 3 | Financial KPI widgets (part 2) | 4-5h | InvoiceStatusWidget, CategorySpendingWidget |
| Day 4 | Chart interactivity + integration | 4-5h | InteractiveChart, Dashboard integration |

### Week 2: Accessibility & Polish (22-28 hours)

| Day | Task | Hours | Deliverable |
|-----|------|-------|-------------|
| Day 5 | Table accessibility | 4-5h | AccessibleDataTable, table updates |
| Day 6 | Chart accessibility | 4-5h | ChartAccessibilityProvider, descriptions |
| Day 7 | Form accessibility | 2-3h | Form updates, keyboard navigation |
| Day 8 | Empty states | 4-5h | All empty state components |
| Day 9 | Search optimization | 4-5h | useDebounceSearch, filter optimization |
| Day 10 | Testing & bug fixes | 3-5h | Integration testing, accessibility audit |

**Total: 38-48 hours over 10 working days**

---

## Testing Strategy

### Unit Tests

| Component | Test Coverage |
|-----------|---------------|
| TrendIndicator | Value calculations, color logic, accessibility |
| PeriodSelector | Period switching, date calculations |
| BaseWidget | Loading/error/empty states, tap handlers |
| AccessibleDataTable | Sorting, screen reader output |
| useDebounceSearch | Debounce timing, cache behavior |

### Integration Tests

1. **Dashboard Widget Tests**
   - Widget data loading
   - Navigation on tap
   - Period switching updates

2. **Accessibility Tests**
   - Screen reader navigation
   - Focus management
   - Keyboard navigation

3. **Performance Tests**
   - Search response time (<300ms)
   - Filter re-render count
   - Large list scrolling (60fps)

### Manual Testing Checklist

- [ ] Dashboard widgets load correctly
- [ ] Tap navigation works on all widgets
- [ ] Period selector updates all widgets
- [ ] Charts have screen reader descriptions
- [ ] Tables are keyboard navigable
- [ ] Empty states show for all scenarios
- [ ] Search debouncing works smoothly
- [ ] Filters apply without lag

---

## Quality Checklist

### Code Quality

- [ ] TypeScript strict mode compliance
- [ ] No console.log statements
- [ ] All components have error boundaries
- [ ] Consistent naming conventions
- [ ] Proper file organization

### Accessibility (WCAG 2.1 AA)

- [ ] All interactive elements have labels
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Charts have text alternatives
- [ ] Tables have proper structure
- [ ] Forms have error announcements

### Performance

- [ ] Search debounce: 300ms
- [ ] Filter memoization working
- [ ] No unnecessary re-renders
- [ ] FlatList optimizations applied
- [ ] Memory usage stable

### UX

- [ ] Empty states are helpful
- [ ] Loading states are smooth
- [ ] Error recovery is clear
- [ ] Navigation is intuitive
- [ ] Feedback is immediate

---

## Dependencies

### Existing Utilities to Use

```typescript
// From src/utils/accessibility/
import { useAccessibility, announce } from '../utils/accessibility';

// From src/utils/performance/
import { useDebounce, useThrottle } from '../utils/performance';

// From src/commercial/shared/
import { DashboardSkeleton, InvoiceListSkeleton } from './shared/skeletons';
```

### New Dependencies (if needed)

None required - all functionality can be built with existing React Native and project utilities.

### Design Patterns to Follow

- **Status Badges:** Use custom `View+Text` components instead of `react-native-paper Chip`
- **Icons:** Use emoji or custom SVG, not external icon libraries
- **Styling:** Use `StyleSheet.create()` for all styles
- **Colors:** Follow existing color constants from project theme

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Widget load time | <500ms | Performance profiling |
| Search response | <300ms | User interaction timing |
| Accessibility score | 100% | Automated a11y audit |
| Code coverage | 70%+ | Jest coverage report |
| Bundle size increase | <50KB | Metro bundler stats |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chart library limitations | Medium | Use custom SVG if needed |
| Performance on old devices | Medium | Test on low-end Android |
| Screen reader compatibility | High | Test with TalkBack + VoiceOver |
| Complex state management | Low | Leverage existing reducers |

---

## Post-Implementation

After Commercial Phase 3, proceed to:
- **Admin Phase 3** (32-40 hours) - System health monitoring, user activity logs
