# Design Engineer Phase 3: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Design Engineer
**Total Estimated Time:** 32-40 hours
**Created:** 2026-01-09
**Status:** 🎯 Ready to Start

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 3.1: Dashboard Redesign](#task-31-dashboard-redesign)
4. [Task 3.2: Accessibility Features](#task-32-accessibility-features)
5. [Task 3.3: Enhanced Empty States](#task-33-enhanced-empty-states)
6. [Task 3.4: Search & Filter Performance](#task-34-search--filter-performance)
7. [Implementation Timeline](#implementation-timeline)
8. [Success Metrics](#success-metrics)
9. [Testing Strategy](#testing-strategy)
10. [Quality Checklist](#quality-checklist)

---

## Overview

Design Engineer Phase 3 focuses on UX enhancements, accessibility compliance, and performance optimizations for the smallest role (3 screens). This role is ideal for establishing patterns that will be reused across all other roles.

### Why Design Engineer First?

**Advantages:**
- ✅ Smallest scope (3 screens) - lowest risk
- ✅ Clear patterns emerge quickly
- ✅ Fast iteration and learning
- ✅ Foundation for other roles

**Phase 3 Goals:**
1. Create modular, reusable dashboard widgets
2. Achieve WCAG 2.1 AA accessibility compliance
3. Implement context-aware empty states
4. Optimize search and filter performance

---

## Current State Analysis

### Design Engineer Screens (3 total)

After Phase 1 & 2 completion:

| Screen | Current LOC | State Management | Components | Status |
|--------|-------------|------------------|------------|--------|
| DesignRfqManagementScreen | 221 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| DoorsPackageManagementScreen | 237 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| DesignEngineerDashboardScreen | 284 | ✅ useReducer | ✅ Shared | Phase 2 Complete |

**Completed in Phase 1 & 2:**
- ✅ Console logs removed (37 → 0)
- ✅ Error boundaries added (3/3)
- ✅ Large files refactored (55% reduction)
- ✅ State management (88% useState reduction)
- ✅ Shared components created (3 components)
- ✅ Loading skeletons added (3 skeletons)

**Phase 3 Focus:**
- 🎯 Dashboard widgets and customization
- 🎯 Full accessibility compliance
- 🎯 Enhanced empty states with illustrations
- 🎯 Optimized search/filter performance

---

## Task 3.1: Dashboard Redesign

**Estimated Time:** 14-18 hours
**Priority:** High
**Complexity:** Medium-High

### Objective

Transform the DesignEngineerDashboardScreen into a modular, widget-based dashboard with customizable layout and interactive visualizations.

### Current Dashboard Analysis

**Existing Metrics (10 total):**
1. Total DOORS Packages
2. Pending Packages
3. Received Packages
4. Reviewed Packages
5. Total Design RFQs
6. Draft RFQs
7. Issued RFQs
8. Awarded RFQs
9. Compliance Rate
10. Avg Processing Days

**Current Layout:**
- Static 2x2 grid layout
- Basic MetricCard components
- No interactivity
- No customization

### Target Dashboard Architecture

#### Widget System Design

**Widget Types:**

1. **MetricWidget** - Single KPI display
2. **ChartWidget** - Visual data representation
3. **ListWidget** - Item lists (recent activity)
4. **StatusWidget** - System status displays

**Widget Structure:**

```typescript
interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'status';
  title: string;
  size: 'small' | 'medium' | 'large'; // 1x1, 2x1, 2x2
  position: { x: number; y: number };
  refreshable: boolean;
  configurable: boolean;
  data: any;
}
```

### Implementation Plan

#### Phase 1: Widget Components (6-8 hours)

**1.1 Create Base Widget System** (2-3 hours)

File: `src/design_engineer/dashboard/widgets/BaseWidget.tsx`

```typescript
interface BaseWidgetProps {
  id: string;
  title: string;
  subtitle?: string;
  refreshable?: boolean;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  error?: Error | null;
  children: React.ReactNode;
}
```

**Features:**
- Loading state
- Error state
- Refresh functionality
- Consistent styling
- Accessibility props

**1.2 Create Specific Widgets** (4-5 hours)

**DoorsPackageStatusWidget** (~120 LOC)
- Stacked bar chart showing pending/received/reviewed
- Total count with trend indicator
- Tap to drill down to package list

**RfqStatusWidget** (~120 LOC)
- Donut chart showing draft/issued/awarded distribution
- Interactive legend
- Tap to navigate to RFQ list

**ComplianceMetricWidget** (~100 LOC)
- Progress circle visualization
- Target vs actual comparison
- Color-coded (green >80%, yellow >50%, red <50%)

**ProcessingTimeWidget** (~100 LOC)
- Line chart showing average processing days over time
- Benchmark indicator
- Trend analysis

**RecentActivityWidget** (~140 LOC)
- List of recent DOORS packages received/reviewed
- List of recent RFQs issued/awarded
- Timestamp and status indicators

#### Phase 2: Dashboard Layout System (4-5 hours)

**2.1 Create Layout Manager** (2-3 hours)

File: `src/design_engineer/dashboard/DashboardLayout.tsx`

```typescript
interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number; // Grid columns (default: 2)
  spacing: number; // Gap between widgets
}
```

**Features:**
- Responsive grid layout
- Widget positioning
- Size variants (1x1, 2x1, 2x2)
- Scroll container

**2.2 Integrate with Dashboard Screen** (2-2 hours)

Update DesignEngineerDashboardScreen to use widget system:
- Replace static MetricCards with widgets
- Implement default layout
- Add widget refresh capability

#### Phase 3: Widget Configuration (4-5 hours)

**3.1 Widget Registry** (2-3 hours)

File: `src/design_engineer/dashboard/widgetRegistry.ts`

```typescript
export const widgetRegistry = {
  'doors-status': DoorsPackageStatusWidget,
  'rfq-status': RfqStatusWidget,
  'compliance': ComplianceMetricWidget,
  'processing-time': ProcessingTimeWidget,
  'recent-activity': RecentActivityWidget,
};

export const defaultLayout: DashboardLayout = {
  widgets: [
    { id: 'doors-status', type: 'chart', size: 'medium', position: { x: 0, y: 0 } },
    { id: 'rfq-status', type: 'chart', size: 'medium', position: { x: 1, y: 0 } },
    { id: 'compliance', type: 'metric', size: 'small', position: { x: 0, y: 1 } },
    { id: 'processing-time', type: 'chart', size: 'medium', position: { x: 0, y: 2 } },
    { id: 'recent-activity', type: 'list', size: 'large', position: { x: 0, y: 3 } },
  ],
};
```

**3.2 Widget Data Providers** (2-2 hours)

Create hooks for fetching widget data:
- `useDoorsStatusData`
- `useRfqStatusData`
- `useComplianceData`
- `useProcessingTimeData`
- `useRecentActivityData`

### Deliverables

**Files Created (~680 LOC):**
```
src/design_engineer/dashboard/
├── widgets/
│   ├── BaseWidget.tsx               (~80 LOC)
│   ├── DoorsPackageStatusWidget.tsx (~120 LOC)
│   ├── RfqStatusWidget.tsx          (~120 LOC)
│   ├── ComplianceMetricWidget.tsx   (~100 LOC)
│   ├── ProcessingTimeWidget.tsx     (~100 LOC)
│   ├── RecentActivityWidget.tsx     (~140 LOC)
│   └── index.ts                     (~7 LOC)
├── DashboardLayout.tsx              (~60 LOC)
├── widgetRegistry.ts                (~30 LOC)
├── hooks/
│   ├── useWidgetData.ts             (~80 LOC)
│   └── index.ts                     (~5 LOC)
└── types/
    └── dashboard.ts                 (~40 LOC)
```

**Files Modified:**
- DesignEngineerDashboardScreen.tsx (integrate widgets)

### Chart Library

**Recommended:** Victory Native or React Native Chart Kit

```bash
npm install victory-native
# or
npm install react-native-chart-kit
```

---


## Task 3.2: Accessibility Features

**Estimated Time:** 8-10 hours
**Priority:** High
**Complexity:** Medium

### Objective

Achieve WCAG 2.1 AA compliance across all 3 Design Engineer screens with proper screen reader support, keyboard navigation, and semantic markup.

### WCAG 2.1 AA Requirements

**Perceivable:**
- Text alternatives for non-text content
- Color contrast ratio ≥4.5:1
- Resize text up to 200%

**Operable:**
- Keyboard accessible
- Touch target size ≥44x44 points
- Focus indicators visible

**Understandable:**
- Readable and predictable
- Input assistance for errors

**Robust:**
- Compatible with assistive technologies

### Implementation Plan

#### Phase 1: Accessibility Utilities (2-3 hours)

**1.1 Create Accessibility Hook** (1-1.5 hours)

File: `src/utils/accessibility/useAccessibility.ts`

```typescript
export const useAccessibility = () => {
  const announce = useCallback((message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const setFocus = useCallback((ref: RefObject<any>) => {
    if (ref.current) {
      ref.current.focus();
      // Announce focus change
      const label = ref.current.props?.accessibilityLabel;
      if (label) announce(`Focused on ${label}`);
    }
  }, [announce]);

  return { announce, setFocus };
};
```

**1.2 Create Keyboard Navigation Utilities** (1-1.5 hours)

File: `src/utils/accessibility/keyboardNavigation.ts`

```typescript
export const handleKeyPress = (
  event: KeyboardEvent,
  onActivate: () => void
) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
};

export const useKeyboardNavigation = (items: any[]) => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleArrowKeys = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      setFocusedIndex(prev => Math.max(prev - 1, 0));
    }
  };

  return { focusedIndex, handleArrowKeys };
};
```

#### Phase 2: Screen-Specific Accessibility (4-5 hours)

**2.1 DesignRfqManagementScreen** (1.5-2 hours)

**Enhancements:**
```typescript
// Searchbar accessibility
<Searchbar
  placeholder="Search Design RFQs..."
  accessibilityLabel="Search Design RFQs by number, title, or DOORS ID"
  accessibilityRole="search"
  accessibilityHint="Enter text to filter RFQs"
  onChangeText={handleSearch}
/>

// Filter chips accessibility
<Chip
  accessibilityLabel={`Filter by ${status} status. ${
    isSelected ? 'Currently selected' : 'Not selected'
  }`}
  accessibilityRole="button"
  accessibilityState={{ selected: isSelected }}
  onPress={handleFilter}
>
  {status}
</Chip>

// RFQ card list accessibility
<FlatList
  data={filteredRfqs}
  accessible
  accessibilityRole="list"
  accessibilityLabel={`${filteredRfqs.length} Design RFQs`}
  renderItem={({ item, index }) => (
    <View
      accessible
      accessibilityRole="listitem"
      accessibilityLabel={`RFQ ${item.rfqNumber}, ${item.title}, Status: ${item.status}`}
    >
      <DesignRfqCard rfq={item} />
    </View>
  )}
/>

// FAB accessibility
<FAB
  icon="plus"
  label="New Design RFQ"
  accessibilityLabel="Create new Design RFQ"
  accessibilityRole="button"
  accessibilityHint="Opens dialog to create a new Design RFQ"
  onPress={handleCreate}
/>
```

**Screen Reader Announcements:**
- "Loaded 5 Design RFQs" on data load
- "Filtered to 3 RFQs" on filter change
- "Created RFQ successfully" on creation

**2.2 DoorsPackageManagementScreen** (1.5-2 hours)

**Enhancements:**
```typescript
// Package list accessibility
<FlatList
  data={filteredPackages}
  accessible
  accessibilityRole="list"
  accessibilityLabel={`${filteredPackages.length} DOORS Packages`}
  renderItem={({ item }) => (
    <View
      accessible
      accessibilityRole="listitem"
      accessibilityLabel={`
        DOORS Package ${item.doorsId},
        Site: ${item.siteName},
        Status: ${item.status},
        Equipment: ${item.equipmentType},
        ${item.totalRequirements} requirements
      `}
    >
      <DoorsPackageCard package={item} />
    </View>
  )}
/>

// Filter menu accessibility
<Menu
  visible={menuVisible}
  accessibilityLabel="Status filter menu"
  accessibilityRole="menu"
>
  <Menu.Item
    accessibilityLabel="Filter by pending status"
    accessibilityRole="menuitem"
    onPress={() => handleFilter('pending')}
    title="Pending"
  />
</Menu>
```

**2.3 DesignEngineerDashboardScreen** (1-1 hours)

**Widget Accessibility:**
```typescript
// Metric widgets
<MetricCard
  accessible
  accessibilityRole="text"
  accessibilityLabel={`${title}: ${value}. ${subtitle}`}
  title={title}
  value={value}
  subtitle={subtitle}
/>

// Chart widgets (complex!)
<DoorsPackageStatusWidget
  accessible
  accessibilityLabel={`
    DOORS Packages status distribution.
    ${pendingCount} pending packages,
    ${receivedCount} received packages,
    ${reviewedCount} reviewed packages.
    Total: ${totalCount} packages.
  `}
  accessibilityRole="image"
  accessibilityHint="Displays package status distribution in a stacked bar chart"
/>
```

#### Phase 3: Keyboard Navigation (2-2 hours)

**3.1 Card Navigation**

Enable keyboard navigation in lists:
- Arrow keys to move between cards
- Enter/Space to activate card actions
- Tab to move between action buttons

**3.2 Form Navigation**

Dialog forms:
- Auto-focus first input on open
- Tab order follows visual order
- Enter to submit, Escape to cancel

### Deliverables

**Files Created:**
```
src/utils/accessibility/
├── useAccessibility.ts         (~60 LOC)
├── keyboardNavigation.ts       (~80 LOC)
└── index.ts                    (~3 LOC)
```

**Files Modified:**
- DesignRfqManagementScreen.tsx (accessibility props)
- DoorsPackageManagementScreen.tsx (accessibility props)
- DesignEngineerDashboardScreen.tsx (accessibility props)
- All widget components (accessibility props)

**Accessibility Audit Checklist:**
- [ ] All interactive elements have accessibilityLabel
- [ ] All interactive elements have accessibilityRole
- [ ] Lists have proper list/listitem roles
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44x44 points
- [ ] Screen reader tested (VoiceOver/TalkBack)
- [ ] Keyboard navigation works
- [ ] ARIA live regions for dynamic content

---


## Task 3.3: Enhanced Empty States

**Estimated Time:** 5-6 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Create context-aware, visually appealing empty states with illustrations for all list views and data displays.

### Empty State Scenarios

**Design Engineer Screens:**

1. **DesignRfqManagementScreen**
   - No RFQs at all (new user)
   - No search results
   - No RFQs matching filter

2. **DoorsPackageManagementScreen**
   - No packages at all (new user)
   - No search results
   - No packages matching filter

3. **DesignEngineerDashboardScreen**
   - No data (new project)
   - Loading state (already covered by skeletons)

### Implementation Plan

#### Phase 1: Base EmptyState Component (2-3 hours)

**1.1 Create EmptyState Component** (1.5-2 hours)

File: `src/design_engineer/shared/components/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'no-permission' | 'error';
  title: string;
  message: string;
  illustration?: 'rfq' | 'package' | 'dashboard' | 'search';
  action?: {
    label: string;
    icon?: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  message,
  illustration,
  action,
  secondaryAction,
}) => {
  return (
    <View style={styles.container}>
      {illustration && (
        <View style={styles.illustrationContainer}>
          <Illustration type={illustration} />
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {action && (
        <Button
          mode="contained"
          icon={action.icon}
          onPress={action.onPress}
          style={styles.primaryAction}
        >
          {action.label}
        </Button>
      )}

      {secondaryAction && (
        <Button
          mode="text"
          onPress={secondaryAction.onPress}
          style={styles.secondaryAction}
        >
          {secondaryAction.label}
        </Button>
      )}
    </View>
  );
};
```

**1.2 Create Illustration Component** (0.5-1 hour)

Use SVG illustrations from Undraw or create simple custom SVGs:

```typescript
const illustrations = {
  rfq: require('./assets/empty-rfq.svg'),
  package: require('./assets/empty-package.svg'),
  dashboard: require('./assets/empty-dashboard.svg'),
  search: require('./assets/empty-search.svg'),
};
```

**Alternative:** Use Lottie animations for more engaging experience.

#### Phase 2: Screen Integration (3-3 hours)

**2.1 DesignRfqManagementScreen Empty States** (1-1 hour)

```typescript
// No RFQs at all
{rfqs.length === 0 && !loading && !searchQuery && !filterStatus && (
  <EmptyState
    type="no-data"
    title="No Design RFQs Yet"
    message="Create your first Design RFQ to start managing engineering requests for DOORS packages."
    illustration="rfq"
    action={{
      label: "Create Design RFQ",
      icon: "plus",
      onPress: () => dispatch({ type: 'OPEN_DIALOG' })
    }}
  />
)}

// No search results
{filteredRfqs.length === 0 && !loading && searchQuery && (
  <EmptyState
    type="no-results"
    title="No RFQs Found"
    message={`No Design RFQs match "${searchQuery}". Try adjusting your search.`}
    illustration="search"
    action={{
      label: "Clear Search",
      onPress: () => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: '' } })
    }}
    secondaryAction={{
      label: "Create New RFQ",
      onPress: () => dispatch({ type: 'OPEN_DIALOG' })
    }}
  />
)}

// No filter results
{filteredRfqs.length === 0 && !loading && filterStatus && (
  <EmptyState
    type="no-results"
    title={`No ${filterStatus} RFQs`}
    message={`There are no Design RFQs with ${filterStatus} status.`}
    illustration="search"
    action={{
      label: "Clear Filter",
      onPress: () => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })
    }}
  />
)}
```

**2.2 DoorsPackageManagementScreen Empty States** (1-1 hour)

Similar pattern for packages:
- No packages at all
- No search results
- No filter results

**2.3 DesignEngineerDashboardScreen Empty State** (1-1 hour)

```typescript
{metrics.totalDoorsPackages === 0 && metrics.totalDesignRfqs === 0 && !loading && (
  <EmptyState
    type="no-data"
    title="Welcome to Design Engineer Dashboard"
    message="Start by creating DOORS packages and Design RFQs to track your engineering work."
    illustration="dashboard"
    action={{
      label: "Go to DOORS Packages",
      onPress: () => navigation.navigate('DoorsPackages')
    }}
    secondaryAction={{
      label: "Go to Design RFQs",
      onPress: () => navigation.navigate('DesignRfqs')
    }}
  />
)}
```

### Deliverables

**Files Created (~220 LOC):**
```
src/design_engineer/shared/components/
├── EmptyState.tsx              (~140 LOC)
└── Illustration.tsx            (~40 LOC)

src/design_engineer/shared/assets/
├── empty-rfq.svg
├── empty-package.svg
├── empty-dashboard.svg
└── empty-search.svg
```

**Files Modified:**
- DesignRfqManagementScreen.tsx (empty state integration)
- DoorsPackageManagementScreen.tsx (empty state integration)
- DesignEngineerDashboardScreen.tsx (empty state integration)

---

## Task 3.4: Search & Filter Performance

**Estimated Time:** 5-6 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Optimize search and filter operations with debouncing, memoization, and efficient data handling to ensure smooth UX even with large datasets.

### Performance Targets

| Operation | Current | Target | Improvement |
|-----------|---------|--------|-------------|
| Search keystroke lag | ~50ms | <20ms | 60% faster |
| Filter switch | ~30ms | <10ms | 66% faster |
| List render | ~100ms | <50ms | 50% faster |

### Implementation Plan

#### Phase 1: Debounced Search (2-3 hours)

**1.1 Create Debounce Hook** (1-1.5 hours)

File: `src/utils/performance/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

**1.2 Integrate with Screens** (1-1.5 hours)

**DesignRfqManagementScreen:**

```typescript
const DesignRfqManagementScreen = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  useEffect(() => {
    // Apply filters with debounced search
    dispatch({ type: 'APPLY_FILTERS' });
  }, [debouncedSearchQuery, state.filters.status]);

  return (
    <Searchbar
      placeholder="Search Design RFQs..."
      onChangeText={(query) =>
        dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })
      }
      value={state.filters.searchQuery}
    />
  );
};
```

**DoorsPackageManagementScreen:**
- Same pattern for package search

#### Phase 2: Optimized Filtering (1-1.5 hours)

**2.1 Memoized Filter Function**

Update reducers to use memoized filtering:

```typescript
import { useMemo } from 'react';

// In reducer
const applyFiltersToRfqs = useMemo(
  () => (
    rfqs: DesignRfq[],
    searchQuery: string,
    status: string | null
  ): DesignRfq[] => {
    let filtered = rfqs;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(query) ||
          rfq.title.toLowerCase().includes(query) ||
          rfq.doorsId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (status) {
      filtered = filtered.filter((rfq) => rfq.status === status);
    }

    return filtered;
  },
  []
);
```

#### Phase 3: List Optimization (1.5-2 hours)

**3.1 FlatList Optimization**

```typescript
<FlatList
  data={filteredRfqs}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  // Memoized callbacks
  renderItem={useCallback(renderItem, [dispatch])}
  keyExtractor={useCallback(keyExtractor, [])}
/>
```

**3.2 Component Memoization**

Wrap card components in React.memo:

```typescript
export const DesignRfqCard = React.memo<DesignRfqCardProps>(
  ({ rfq, onIssue, onMarkQuotesReceived }) => {
    // Component code
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.rfq.id === nextProps.rfq.id &&
           prevProps.rfq.status === nextProps.rfq.status;
  }
);
```

#### Phase 4: Performance Monitoring (0.5-1 hour)

**4.1 Add Performance Logging**

```typescript
const measurePerformance = (operation: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  logger.debug(`[Performance] ${operation}: ${end - start}ms`);
};

// Usage
measurePerformance('Filter RFQs', () => {
  dispatch({ type: 'APPLY_FILTERS' });
});
```

### Deliverables

**Files Created:**
```
src/utils/performance/
├── useDebounce.ts              (~25 LOC)
├── useMemoizedSearch.ts        (~40 LOC)
├── performanceUtils.ts         (~30 LOC)
└── index.ts                    (~4 LOC)
```

**Files Modified:**
- DesignRfqManagementScreen.tsx (debounce + optimization)
- DoorsPackageManagementScreen.tsx (debounce + optimization)
- designRfqManagementReducer.ts (memoized filters)
- doorsPackageManagementReducer.ts (memoized filters)
- DesignRfqCard.tsx (React.memo)
- DoorsPackageCard.tsx (React.memo)

---

## Implementation Timeline

### 4-Week Breakdown (32-40 hours total)

**Week 1: Dashboard Redesign (14-18h)**

```
Day 1-2 (6-8h): Widget Components
- Create BaseWidget
- Create DoorsPackageStatusWidget
- Create RfqStatusWidget

Day 3 (4-5h): More Widgets + Layout
- Create ComplianceMetricWidget
- Create ProcessingTimeWidget
- Create RecentActivityWidget
- Create DashboardLayout

Day 4-5 (4-5h): Integration + Polish
- Widget registry
- Data providers
- Integrate with dashboard screen
- Testing and refinement
```

**Week 2: Accessibility (8-10h)**

```
Day 1 (2-3h): Accessibility Utilities
- Create useAccessibility hook
- Create keyboard navigation utilities
- Set up testing environment

Day 2 (2-2.5h): DesignRfqManagementScreen
- Add accessibility props
- Screen reader support
- Keyboard navigation
- Testing

Day 3 (2-2.5h): DoorsPackageManagementScreen
- Add accessibility props
- Screen reader support
- Keyboard navigation
- Testing

Day 4 (2-2h): DesignEngineerDashboardScreen + Audit
- Add accessibility props
- Widget accessibility
- Full accessibility audit
- Fix issues
```

**Week 3: Empty States (5-6h)**

```
Day 1-2 (2-3h): EmptyState Component
- Create EmptyState component
- Create/source illustrations
- Testing different states

Day 2-3 (3-3h): Screen Integration
- Integrate with DesignRfqManagementScreen
- Integrate with DoorsPackageManagementScreen
- Integrate with DesignEngineerDashboardScreen
- Testing all scenarios
```

**Week 4: Performance Optimization (5-6h)**

```
Day 1 (2-3h): Debounced Search
- Create useDebounce hook
- Integrate with both management screens
- Performance testing

Day 2 (1.5-2h): Optimized Filtering
- Memoize filter functions
- Update reducers
- Performance testing

Day 3 (1.5-2h): List Optimization + Monitoring
- FlatList optimizations
- Component memoization
- Performance monitoring
- Final testing
```

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Dashboard Load Time** | ~800ms | <500ms | Performance profiler |
| **Search Lag** | ~50ms | <20ms | Input latency test |
| **Filter Switch Time** | ~30ms | <10ms | Performance profiler |
| **Accessibility Score** | 60% | 100% (WCAG AA) | Accessibility audit |
| **Empty State Coverage** | 0% | 100% | Manual verification |
| **Widget Refresh Time** | N/A | <300ms | Performance profiler |

### Qualitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Experience** | Excellent | User feedback |
| **Visual Appeal** | Professional | Design review |
| **Code Quality** | High | Code review |
| **Documentation** | Complete | Documentation audit |
| **Pattern Reusability** | High | Other roles adoption |

---

## Testing Strategy

### Automated Testing

**Performance Tests:**
```typescript
describe('Performance', () => {
  it('should debounce search input', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    // Assert debounce behavior
  });

  it('should render list within performance budget', () => {
    const startTime = performance.now();
    render(<DesignRfqManagementScreen />);
    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100);
  });
});
```

**Accessibility Tests:**
```typescript
describe('Accessibility', () => {
  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(<DesignRfqCard rfq={mockRfq} />);
    expect(getByLabelText(/RFQ/)).toBeTruthy();
  });

  it('should support keyboard navigation', () => {
    // Test keyboard events
  });
});
```

### Manual Testing

**Dashboard Testing:**
- [ ] All widgets load correctly
- [ ] Widgets refresh independently
- [ ] Charts display accurate data
- [ ] Interactive elements work
- [ ] Layout responsive to different screen sizes

**Accessibility Testing:**
- [ ] Screen reader announces all content
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible
- [ ] Touch targets adequate size
- [ ] Color contrast meets standards

**Empty State Testing:**
- [ ] No data state displays
- [ ] No search results state displays
- [ ] No filter results state displays
- [ ] Actions work from empty states
- [ ] Illustrations display correctly

**Performance Testing:**
- [ ] Search responds smoothly
- [ ] Filter changes are instant
- [ ] Lists scroll smoothly with 100+ items
- [ ] No frame drops during interaction
- [ ] Memory usage stable

---

## Quality Checklist

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] ESLint passes with no warnings
- [ ] All components have JSDoc documentation
- [ ] All functions have clear names
- [ ] No duplicate code
- [ ] Proper error handling
- [ ] Console logs removed (use LoggingService)

### Accessibility

- [ ] All interactive elements have accessibilityLabel
- [ ] All interactive elements have accessibilityRole
- [ ] All lists have list/listitem roles
- [ ] All images have descriptions
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44x44 points
- [ ] Focus indicators visible
- [ ] Keyboard navigation complete
- [ ] Screen reader tested (VoiceOver/TalkBack)
- [ ] WCAG 2.1 AA compliance verified

### User Experience

- [ ] All empty states implemented
- [ ] All loading states work
- [ ] All error states handled
- [ ] Consistent visual design
- [ ] Smooth animations
- [ ] Proper feedback for actions
- [ ] Intuitive navigation

### Performance

- [ ] Search debounced (300ms)
- [ ] Filters optimized
- [ ] Lists optimized (FlatList props)
- [ ] Components memoized where appropriate
- [ ] No unnecessary re-renders
- [ ] Performance targets met

### Documentation

- [ ] Implementation plan complete
- [ ] Component documentation complete
- [ ] JSDoc for all public APIs
- [ ] README updated if needed
- [ ] PROGRESS_TRACKING.md updated

---

## Dependencies

### Required Libraries

**Chart Library (Choose one):**

```bash
# Option 1: Victory Native (Recommended)
npm install victory-native react-native-svg

# Option 2: React Native Chart Kit
npm install react-native-chart-kit react-native-svg
```

**Animation Library (Optional for Lottie):**

```bash
npm install lottie-react-native
```

### Illustration Assets

**Sources:**
- [Undraw](https://undraw.co/) - Free SVG illustrations
- [Storyset](https://storyset.com/) - Free animated illustrations
- [LottieFiles](https://lottiefiles.com/) - Free Lottie animations

**Needed Illustrations:**
1. Empty RFQ list (engineering/document theme)
2. Empty DOORS package list (package/box theme)
3. Empty dashboard (analytics/chart theme)
4. No search results (search/magnifying glass theme)

---

## Risk Assessment

### High Risk Items

**None** - Design Engineer is the smallest, lowest-risk role

### Medium Risk Items

1. **Chart Library Integration**
   - **Risk:** Learning curve, compatibility issues
   - **Mitigation:** Start simple, use Victory Native (well-documented)

2. **Accessibility Compliance**
   - **Risk:** Time-consuming testing
   - **Mitigation:** Test incrementally, use automated tools

### Low Risk Items

1. **Empty States**
   - **Risk:** Finding/creating good illustrations
   - **Mitigation:** Use free resources (Undraw)

2. **Performance Optimization**
   - **Risk:** May not see dramatic improvements (small datasets)
   - **Mitigation:** Still worth doing for patterns

---

## Next Steps After Completion

1. **Update PROGRESS_TRACKING.md**
   - Mark Design Engineer Phase 3 complete
   - Update overall progress

2. **Create Pull Request**
   - Comprehensive PR description
   - Testing checklist
   - Screenshots/GIFs

3. **Merge to Main**

4. **Apply Patterns to Next Role**
   - Use established patterns for Admin Phase 3
   - Refine based on learnings

---

## Appendix

### Useful Resources

**Accessibility:**
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)

**Performance:**
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Optimizing FlatList](https://reactnative.dev/docs/optimizing-flatlist-configuration)

**Charts:**
- [Victory Native Docs](https://formidable.com/open-source/victory/docs/native/)
- [Chart Kit Docs](https://github.com/indiespirit/react-native-chart-kit)

**Empty States:**
- [Undraw](https://undraw.co/)
- [Storyset](https://storyset.com/)
- [Empty State Design](https://emptystat.es/)

---

**End of Design Engineer Phase 3 Implementation Plan**

*Ready to start implementation! This plan establishes patterns for all other roles.*
