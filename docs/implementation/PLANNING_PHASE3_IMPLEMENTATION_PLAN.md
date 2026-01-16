# Planning Phase 3: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Planning
**Total Estimated Time:** 42-54 hours
**Created:** 2026-01-11
**Updated:** 2026-01-15
**Status:** ✅ Implementation Complete
**Branch:** `planning/phase3-implementation`

---

## Implementation Summary (2026-01-15)

### Tasks Completed

| Task | Status | Details |
|------|--------|---------|
| **3.1: Navigation Restructure** | ✅ Complete | Dashboard with 6 widgets, UnifiedSchedule with 3 views, hybrid tab+drawer navigation |
| **3.2: Accessibility Features** | ✅ Complete | All 11 screens have accessibility props, screen reader announcements |
| **3.3: Enhanced Empty States** | ✅ Complete | EmptyState component used across all screens with contextual messaging |
| **3.4: Search & Filter Performance** | ✅ Complete | Debounced search in WBSManagementScreen, FlatList optimizations |
| **Uniformity Pass** | ✅ Complete | StatusBadge component created, accessibility patterns applied |

### Files Created

**Dashboard Module (src/planning/dashboard/):**
- `PlanningDashboard.tsx` - Main dashboard with 6 widgets
- `dashboardReducer.ts` - State management
- `widgets/BaseWidget.tsx` - Reusable widget wrapper
- `widgets/UpcomingMilestonesWidget.tsx`
- `widgets/CriticalPathWidget.tsx`
- `widgets/ScheduleOverviewWidget.tsx`
- `widgets/RecentActivitiesWidget.tsx`
- `widgets/ResourceUtilizationWidget.tsx`
- `widgets/WBSProgressWidget.tsx`
- `widgets/index.ts`
- `hooks/useWidgetData.ts` - Data hooks for all widgets
- `hooks/index.ts`
- `index.ts`

**Schedule Module (src/planning/schedule/):**
- `UnifiedSchedule.tsx` - Top tab navigator with 3 views
- `views/TimelineView.tsx` - Refactored schedule view
- `views/CalendarView.tsx` - Monthly calendar view
- `views/ListView.tsx` - Flat list with sorting/filtering
- `index.ts`

### Files Modified

- `src/nav/PlanningNavigator.tsx` - Complete rewrite with hybrid tab+drawer navigation
- `src/planning/WBSManagementScreen.tsx` - Debounced search, accessibility, EmptyState
- `src/planning/GanttChartScreen.tsx` - Accessibility props, EmptyState
- `src/planning/MilestoneTrackingScreen.tsx` - Accessibility, FlatList, EmptyState
- `src/planning/SiteManagementScreen.tsx` - EmptyState
- `src/planning/BaselineScreen.tsx` - Accessibility, EmptyState
- `src/planning/ResourcePlanningScreen.tsx` - EmptyState
- `src/planning/ItemCreationScreen.tsx` - Accessibility props
- `src/planning/ItemEditScreen.tsx` - Accessibility, EmptyState

### Key Patterns Applied

1. **Accessibility:** `useAccessibility` hook with `announce()` for screen reader feedback
2. **Performance:** `useDebounce` for search (300ms delay)
3. **Empty States:** `EmptyState` component with icon, title, message, helpText, variant
4. **Navigation:** Hybrid bottom tabs (4) + drawer (5 items) architecture

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 3.1: Navigation Restructure](#task-31-navigation-restructure)
4. [Task 3.2: Accessibility Features](#task-32-accessibility-features)
5. [Task 3.3: Enhanced Empty States](#task-33-enhanced-empty-states)
6. [Task 3.4: Search & Filter Performance](#task-34-search--filter-performance)
7. [Uniformity Pass](#uniformity-pass)
8. [Implementation Timeline](#implementation-timeline)
9. [Success Metrics](#success-metrics)
10. [Testing Strategy](#testing-strategy)
11. [Quality Checklist](#quality-checklist)

---

## Overview

Planning Phase 3 focuses on navigation restructure, accessibility compliance, enhanced empty states, and performance optimizations for the Planning role (9 screens). This implementation follows patterns established in Design Engineer Phase 3 and applies uniformity requirements from CLAUDE.md.

### Why Planning Phase 3 Now?

**Context:**
- ✅ Phase 1 Complete: Console logs removed, error boundaries added, large files refactored
- ✅ Phase 2 Complete: useReducer state management, shared components, skeleton screens
- ✅ Design Engineer Phase 3 Complete: Patterns and utilities established
- ✅ Utilities available: `src/utils/accessibility/`, `src/utils/performance/`

**Phase 3 Goals:**
1. Transform 6-tab navigation into hybrid dashboard + drawer system
2. Achieve WCAG 2.1 AA accessibility compliance
3. Implement context-aware empty states
4. Optimize search and filter performance
5. Apply supervisor-style uniformity patterns
a6. StatusBadge Component - Usage Guide @Status_Badge_Usage.md 

---

## Current State Analysis

### Planning Screens (9 total)

After Phase 1 & 2 completion:

| Screen | Current LOC | State Management | Components | Status |
|--------|-------------|------------------|------------|--------|
| SiteManagement | ~400 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| WBSManagement | ~450 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| ScheduleManagement | ~500 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| GanttChart | 164 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| ItemCreation | 217 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| ItemEdit | 297 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| MilestoneTracking | 181 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| Baseline | ~350 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| ResourcePlanning | ~400 | ✅ useReducer | ✅ Shared | Phase 2 Complete |

**Completed in Phase 1 & 2:**
- ✅ Console logs removed (27 → 0)
- ✅ Error boundaries added (9/9)
- ✅ Large files refactored (68.8% reduction)
- ✅ State management with useReducer (all screens)
- ✅ Shared components created
- ✅ Loading skeletons added

**Phase 3 Focus:**
- 🎯 Navigation restructure with dashboard + drawer
- 🎯 Full accessibility compliance (WCAG 2.1 AA)
- 🎯 Enhanced empty states with context-aware messaging
- 🎯 Optimized search/filter performance (debouncing, memoization)
- 🎯 Supervisor-style uniformity (badges, headers)

**Current Navigation:**
- 6 bottom tabs: Sites, WBS, Schedule, Gantt, Milestones, Resources
- **Problem:** Crowded bottom navigation, limited scalability

**Target Navigation:**
- 4 bottom tabs: Dashboard (new), Schedule (unified), Gantt, Resources
- 5 drawer items: Sites, WBS, Item Creation, Milestones, Baseline

---

## Task 3.1: Navigation Restructure

**Estimated Time:** 18-22 hours
**Priority:** High
**Complexity:** Medium-High

### Objective

Transform the 6-tab bottom navigation into a modular, widget-based dashboard with hybrid tab + drawer navigation for better information hierarchy and user experience.

### Implementation Plan

#### Phase 1: PlanningDashboard Screen (6-8 hours)

**1.1 Create Dashboard Structure** (1-2 hours)

**File:** `src/planning/dashboard/PlanningDashboard.tsx`

```typescript
import React, { useReducer, useEffect } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { dashboardReducer, initialState } from './dashboardReducer';
import { BaseWidget } from './widgets/BaseWidget';

export const PlanningDashboard = ({ navigation }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={state.loading} onRefresh={handleRefresh} />
      }
    >
      {/* 2-column grid on tablets, single column on phones */}
    </ScrollView>
  );
};
```

**1.2 Create Dashboard Widgets** (5-6 hours)

**Widget 1: UpcomingMilestonesWidget** (~120 LOC)
- File: `src/planning/dashboard/widgets/UpcomingMilestonesWidget.tsx`
- Shows next 5 milestones with dates
- Visual timeline indicator
- Tap to navigate to milestone details

**Widget 2: CriticalPathWidget** (~130 LOC)
- File: `src/planning/dashboard/widgets/CriticalPathWidget.tsx`
- Lists critical path items with red indicator
- Shows delay impact
- Sortable by risk level

**Widget 3: ScheduleOverviewWidget** (~120 LOC)
- File: `src/planning/dashboard/widgets/ScheduleOverviewWidget.tsx`
- Timeline summary with % complete
- Progress bar visualization
- On-track vs delayed items

**Widget 4: RecentActivitiesWidget** (~140 LOC)
- File: `src/planning/dashboard/widgets/RecentActivitiesWidget.tsx`
- Last 10 planning actions (created, updated items)
- Timestamp and action type
- Quick navigation to items

**Widget 5: ResourceUtilizationWidget** (~130 LOC)
- File: `src/planning/dashboard/widgets/ResourceUtilizationWidget.tsx`
- Resource allocation chart
- Over/under allocated resources
- Click to view resource details

**Widget 6: WBSProgressWidget** (~120 LOC)
- File: `src/planning/dashboard/widgets/WBSProgressWidget.tsx`
- WBS completion by phase
- Stacked bar chart
- Phase-wise breakdown

**Base Widget Component** (~80 LOC)
- File: `src/planning/dashboard/widgets/BaseWidget.tsx`
- Consistent styling for all widgets
- Loading, error, and refresh states
- Accessibility props

#### Phase 2: UnifiedSchedule Screen (4-5 hours)

**2.1 Create UnifiedSchedule** (2-3 hours)

**File:** `src/planning/schedule/UnifiedSchedule.tsx`

```typescript
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export const UnifiedSchedule = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Timeline" component={TimelineView} />
      <Tab.Screen name="Calendar" component={CalendarView} />
      <Tab.Screen name="List" component={ListView} />
    </Tab.Navigator>
  );
};
```

**2.2 Create Schedule Views** (2-2 hours)

- **TimelineView**: Refactor existing ScheduleManagement content
- **CalendarView**: Monthly/weekly grid view (optional: use react-native-calendars)
- **ListView**: Flat list of all schedule items with filters

#### Phase 3: Update Navigator (5-6 hours)

**3.1 Create Hybrid Navigation** (3-4 hours)

**File:** `src/nav/PlanningNavigator.tsx`

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Bottom tabs (4 main workflows)
const PlanningTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Dashboard" component={PlanningDashboard} />
    <Tab.Screen name="Schedule" component={UnifiedSchedule} />
    <Tab.Screen name="Gantt" component={GanttChart} />
    <Tab.Screen name="Resources" component={ResourcePlanning} />
  </Tab.Navigator>
);

// Drawer wrapper (5 detailed screens)
export const PlanningNavigator = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="MainTabs" component={PlanningTabs} options={{ drawerLabel: 'Dashboard' }} />
    <Drawer.Screen name="Sites" component={SiteManagement} />
    <Drawer.Screen name="WBS" component={WBSManagement} />
    <Drawer.Screen name="CreateItem" component={ItemCreation} />
    <Drawer.Screen name="Milestones" component={MilestoneTracking} />
    <Drawer.Screen name="Baseline" component={Baseline} />
  </Drawer.Navigator>
);
```

**3.2 Navigation Integration** (2-2 hours)

- Update all navigation references
- Test deep linking between screens
- Verify back button behavior
- Test drawer open/close gestures

#### Phase 4: Widget Data Providers (3-4 hours)

**4.1 Create Widget Hooks** (3-4 hours)

- `useUpcomingMilestonesData`: Query milestones from database
- `useCriticalPathData`: Calculate critical path items
- `useScheduleOverviewData`: Aggregate schedule metrics
- `useRecentActivitiesData`: Query recent planning actions
- `useResourceUtilizationData`: Calculate resource allocation
- `useWBSProgressData`: Aggregate WBS completion

### Deliverables

**Files Created (~1,020 LOC):**
```
src/planning/dashboard/
├── PlanningDashboard.tsx                    (~150 LOC)
├── dashboardReducer.ts                      (~80 LOC)
├── widgets/
│   ├── BaseWidget.tsx                       (~80 LOC)
│   ├── UpcomingMilestonesWidget.tsx         (~120 LOC)
│   ├── CriticalPathWidget.tsx               (~130 LOC)
│   ├── ScheduleOverviewWidget.tsx           (~120 LOC)
│   ├── RecentActivitiesWidget.tsx           (~140 LOC)
│   ├── ResourceUtilizationWidget.tsx        (~130 LOC)
│   ├── WBSProgressWidget.tsx                (~120 LOC)
│   └── index.ts                             (~10 LOC)
└── hooks/
    ├── useWidgetData.ts                     (~100 LOC)
    └── index.ts                             (~5 LOC)

src/planning/schedule/
├── UnifiedSchedule.tsx                      (~100 LOC)
└── views/
    ├── TimelineView.tsx                     (~150 LOC - refactored)
    ├── CalendarView.tsx                     (~120 LOC)
    └── ListView.tsx                         (~100 LOC)
```

**Files Modified:**
- `src/nav/PlanningNavigator.tsx` (complete restructure)

---

## Task 3.2: Accessibility Features

**Estimated Time:** 10-14 hours
**Priority:** High
**Complexity:** Medium

### Objective

Achieve WCAG 2.1 AA compliance across all 11 Planning screens (9 existing + 2 new) using existing accessibility utilities.

### Utilities Available

- ✅ `src/utils/accessibility/useAccessibility.ts` - Screen reader announcements
- ✅ `src/utils/accessibility/keyboardNavigation.ts` - Keyboard navigation hooks
- ✅ Patterns from Design Engineer Phase 3

### Implementation Plan

#### Phase 1: Critical Screens (6-8 hours)

**1.1 PlanningDashboard** (1.5 hours)

```typescript
import { useAccessibility } from '../../utils/accessibility';

const { announce } = useAccessibility();

useEffect(() => {
  if (!loading) {
    announce(`Dashboard loaded with ${widgetCount} widgets`);
  }
}, [loading, widgetCount]);

// Widget accessibility
<BaseWidget
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`${widget.title}, tap to view details`}
  accessibilityHint="Double tap to open full view"
>
  {/* Widget content */}
</BaseWidget>
```

**1.2 UnifiedSchedule** (1.5 hours)

```typescript
// Tab announcements
onTabChange={(tab) => announce(`Switched to ${tab} view`)}

// List item accessibility
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Schedule item: ${item.name}, ${item.duration} days, Status: ${item.status}`}
  accessibilityHint="Double tap to edit"
>
  <ScheduleItemCard item={item} />
</Pressable>
```

**1.3 GanttChart** (2 hours)

```typescript
// Chart accessibility (complex visualization)
<View
  accessible={true}
  accessibilityRole="image"
  accessibilityLabel={`Gantt chart showing ${taskCount} tasks across ${duration} days`}
  accessibilityHint="Visual timeline of project tasks and dependencies"
>
  <GanttChartCanvas />
</View>

// Zoom controls
<IconButton
  icon="magnify-plus"
  accessibilityLabel="Zoom in"
  accessibilityHint="Increase chart scale"
  onPress={handleZoomIn}
/>
```

**1.4 ItemCreation & ItemEdit** (1.5 hours)

```typescript
// Form field labels
<TextInput
  label="Item Name"
  accessibilityLabel="Item name"
  accessibilityHint="Enter the name for this planning item"
  error={errors.name}
/>

// Error announcements
useEffect(() => {
  if (validationError) {
    announce(`Error: ${validationError}`, 'assertive');
  }
}, [validationError]);

// Success feedback
onSubmit={() => {
  announce('Item created successfully');
  navigation.goBack();
}}
```

#### Phase 2: Secondary Screens (4-6 hours)

**2.1 SiteManagement** (1 hour)

- List accessibility roles
- Search bar labels
- FAB accessibility
- Screen reader announcements

**2.2 WBSManagement** (1 hour)

- WBS tree navigation with keyboard
- Expand/collapse announcements
- Filter accessibility

**2.3 MilestoneTracking** (1 hour)

- Milestone list accessibility
- Date picker accessibility
- Status change announcements

**2.4 Baseline** (1 hour)

- Baseline comparison accessibility
- Chart alternative text
- Action button labels

**2.5 ResourcePlanning** (1-2 hours)

- Resource allocation grid accessibility
- Drag-drop alternatives (if applicable)
- Filter and search labels

### Common Accessibility Patterns

```typescript
// List accessibility
<FlatList
  accessible={true}
  accessibilityRole="list"
  accessibilityLabel={`${items.length} planning items`}
  renderItem={({ item }) => (
    <View
      accessible={true}
      accessibilityRole="listitem"
      accessibilityLabel={`${item.name}, ${item.type}, Status: ${item.status}`}
    >
      <ItemCard item={item} />
    </View>
  )}
/>

// Action buttons
<FAB
  icon="plus"
  label="Create Item"
  accessibilityLabel="Create new planning item"
  accessibilityRole="button"
  accessibilityHint="Opens dialog to create a new item"
  onPress={handleCreate}
/>

// Status indicators
<StatusBadge
  status={status}
  accessibilityLabel={`Status: ${status}`}
/>
```

### Deliverables

**Files Modified:**
- All 11 Planning screens (accessibility props added)
- All widget components (accessibility support)
- All card components (accessibility labels)

**Accessibility Checklist:**
- [ ] All interactive elements have accessibilityLabel
- [ ] All interactive elements have accessibilityRole
- [ ] Lists have proper list/listitem roles
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Touch targets ≥44x44 points
- [ ] Screen reader tested
- [ ] Keyboard navigation works

---

## Task 3.3: Enhanced Empty States

**Estimated Time:** 6-8 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Create context-aware, actionable empty states using the existing EmptyState component (v2.1) for all list views.

### Empty State Component Available

- ✅ `src/components/common/EmptyState.tsx` (v2.1)
- Supports icon, title, message, and action button

### Implementation Plan

#### Phase 1: Dashboard Empty States (1 hour)

**Widgets with no data:**

```typescript
// UpcomingMilestonesWidget
{milestones.length === 0 && (
  <EmptyState
    icon="flag-checkered"
    title="No Upcoming Milestones"
    message="Create milestones to track important project dates"
    action={{
      label: "Add Milestone",
      onPress: () => navigation.navigate('Milestones')
    }}
  />
)}

// ScheduleOverviewWidget
{scheduleItems.length === 0 && (
  <EmptyState
    icon="calendar-blank"
    title="No Schedule Items"
    message="Start planning by creating your first schedule item"
    action={{
      label: "Create Schedule Item",
      onPress: () => navigation.navigate('CreateItem')
    }}
  />
)}
```

#### Phase 2: Schedule Views (1.5 hours)

**Empty schedule states:**

```typescript
// No schedule items at all
{schedules.length === 0 && !loading && !searchQuery && (
  <EmptyState
    icon="calendar-blank"
    title="No Schedule Items"
    message="Start planning by creating your first schedule item"
    action={{
      label: "Create Schedule Item",
      onPress: navigateToCreate
    }}
  />
)}

// No search results
{filteredSchedules.length === 0 && searchQuery && (
  <EmptyState
    icon="magnify"
    title="No Items Found"
    message={`No schedule items match "${searchQuery}"`}
    action={{
      label: "Clear Search",
      onPress: clearSearch
    }}
  />
)}
```

#### Phase 3: Other Screens (3.5-5.5 hours)

**3.1 Gantt Chart** (1 hour)

```typescript
{tasks.length === 0 && (
  <EmptyState
    icon="chart-gantt"
    title="No Tasks for Gantt View"
    message="Add schedule items with dependencies to see Gantt visualization"
    action={{
      label: "Go to Schedule",
      onPress: () => navigation.navigate('Schedule')
    }}
  />
)}
```

**3.2 Milestones** (1 hour)

```typescript
{milestones.length === 0 && (
  <EmptyState
    icon="flag-checkered"
    title="No Milestones Set"
    message="Track important project dates by creating milestones"
    action={{
      label: "Create Milestone",
      onPress: showMilestoneDialog
    }}
  />
)}
```

**3.3 Sites, WBS, Resources** (1.5-3.5 hours)

- Sites: "No sites configured" + "Add Site" action
- WBS: "No work breakdown structure" + "Create WBS" action
- Resources: "No resources assigned" + "Add Resource" action
- Baseline: "No baseline saved" + "Create Baseline" action

### Deliverables

**Files Modified:**
- PlanningDashboard.tsx (6 widget empty states)
- UnifiedSchedule.tsx (3 empty states: no data, no search, no filter)
- GanttChart.tsx (empty state)
- MilestoneTracking.tsx (empty state)
- SiteManagement.tsx (empty state)
- WBSManagement.tsx (empty state)
- ResourcePlanning.tsx (empty state)
- Baseline.tsx (empty state)

**Total Empty States:** ~15-20 contextual empty states

---

## Task 3.4: Search & Filter Performance

**Estimated Time:** 8-10 hours
**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Optimize search and filter operations using debouncing, throttling, and memoization from existing performance utilities.

### Utilities Available

- ✅ `src/utils/performance/useDebounce.ts`
- ✅ `src/utils/performance/useThrottle.ts`
- ✅ `src/utils/performance/memoHelpers.ts`

### Performance Targets

| Operation | Target | Technique |
|-----------|--------|-----------|
| Search keystroke lag | <20ms | Debouncing (300ms) |
| Filter switch | <10ms | Memoization |
| List render | <50ms | FlatList optimization |
| Gantt scroll | <16ms (60fps) | Throttling (100ms) |

### Implementation Plan

#### Phase 1: Debounced Search (2-3 hours)

**1.1 Schedule Search** (1-1.5 hours)

```typescript
import { useDebounce } from '../../utils/performance';
import { useAccessibility } from '../../utils/accessibility';

const [searchQuery, setSearchQuery] = useState('');
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Filter only when debounced value changes
const filteredSchedules = useMemo(() => {
  if (!debouncedSearchQuery) return schedules;
  return schedules.filter(s =>
    s.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );
}, [schedules, debouncedSearchQuery]);

// Announce results
const { announce } = useAccessibility();
useEffect(() => {
  if (debouncedSearchQuery) {
    announce(`Found ${filteredSchedules.length} items`);
  }
}, [filteredSchedules.length, debouncedSearchQuery]);
```

**1.2 WBS Search** (1-1.5 hours)

- Same pattern for WBS management
- Debounce search across code and description fields

#### Phase 2: WBS Filtering Performance (2 hours)

```typescript
import { useDebounce, useMemoArray } from '../../utils/performance';

const [filters, setFilters] = useState({
  phase: null,
  status: null,
  searchTerm: ''
});

const debouncedFilters = {
  ...filters,
  searchTerm: useDebounce(filters.searchTerm, 300)
};

// Memoized filter function
const filteredWBS = useMemo(() => {
  let result = wbsItems;

  if (debouncedFilters.phase) {
    result = result.filter(item => item.phase === debouncedFilters.phase);
  }

  if (debouncedFilters.status) {
    result = result.filter(item => item.status === debouncedFilters.status);
  }

  if (debouncedFilters.searchTerm) {
    result = result.filter(item =>
      item.code.includes(debouncedFilters.searchTerm) ||
      item.description.toLowerCase().includes(debouncedFilters.searchTerm.toLowerCase())
    );
  }

  return result;
}, [wbsItems, debouncedFilters]);
```

#### Phase 3: FlatList Optimizations (2-3 hours)

**Apply to:** Schedule, Sites, WBS, Milestones, Resources lists

```typescript
import {
  createKeyExtractor,
  createGetItemLayout,
  useStableCallback
} from '../../utils/performance';

// Stable key extractor
const keyExtractor = useMemo(
  () => createKeyExtractor((item) => item.id),
  []
);

// Fixed height optimization (if items are uniform height)
const getItemLayout = useMemo(
  () => createGetItemLayout(80, 1), // item height, separator height
  []
);

// Stable render callback
const renderItem = useStableCallback(({ item }) => (
  <ScheduleItemCard item={item} onPress={handlePress} />
), [handlePress]);

// Optimized FlatList
<FlatList
  data={filteredData}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout}
  renderItem={renderItem}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

#### Phase 4: Gantt Chart Performance (2 hours)

```typescript
import { useThrottle } from '../../utils/performance';

// Throttle scroll updates
const [scrollPosition, setScrollPosition] = useState(0);
const throttledScroll = useThrottle(scrollPosition, 100);

// Memoize visible tasks calculation
const visibleTasks = useMemo(() => {
  const viewportStart = throttledScroll;
  const viewportEnd = throttledScroll + viewportWidth;

  return tasks.filter(task => {
    const taskStart = task.startDate.getTime();
    const taskEnd = task.endDate.getTime();
    return taskEnd >= viewportStart && taskStart <= viewportEnd;
  });
}, [tasks, throttledScroll, viewportWidth]);

// Only render visible tasks
<GanttCanvas tasks={visibleTasks} />
```

### Deliverables

**Files Modified:**
- UnifiedSchedule.tsx (debounced search)
- WBSManagement.tsx (debounced search + memoized filters)
- SiteManagement.tsx (FlatList optimization)
- MilestoneTracking.tsx (FlatList optimization)
- ResourcePlanning.tsx (FlatList optimization)
- GanttChart.tsx (throttled scroll + memoized visible tasks)

---

## Uniformity Pass

**Estimated Time:** 5-6 hours
**Priority:** High
**Complexity:** Low

### Objective

Apply consistent UI patterns from CLAUDE.md and Supervisor improvements across all Planning screens.

### Critical Pattern: Status Badges

**From CLAUDE.md - MUST follow exactly:**

```typescript
<Chip
  mode="flat"
  style={{
    backgroundColor: getStatusColor(status),
  }}
  textStyle={styles.statusChipText}>
  {status.toUpperCase()}
</Chip>

// Required styles
statusChipText: {
  color: 'white',        // Always 'white' (not '#FFF' or '#FFFFFF')
  fontSize: 12,          // Consistent font size across all roles
  fontWeight: 'bold',    // Always bold for visibility
}
```

### Implementation Plan

#### Phase 1: Create StatusBadge Component (1 hour)

**File:** `src/planning/components/StatusBadge.tsx`

```typescript
import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium'
}) => {
  return (
    <Chip
      mode="flat"
      style={{
        backgroundColor: getStatusColor(status),
      }}
      textStyle={styles.statusChipText}>
      {status.toUpperCase()}
    </Chip>
  );
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed': return '#4CAF50';
    case 'in_progress': return '#2196F3';
    case 'planned': return '#9E9E9E';
    case 'delayed': return '#F44336';
    case 'critical': return '#FF5722';
    case 'on_hold': return '#FFC107';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  statusChipText: {
    color: 'white',        // CRITICAL: Always 'white'
    fontSize: 12,          // CRITICAL: Consistent size
    fontWeight: 'bold',    // CRITICAL: Always bold
  },
});
```

#### Phase 2: Replace Status Indicators (2-3 hours)

**Screens to update (9 screens):**

- Search and replace old status displays with `<StatusBadge status={item.status} />`
- Verify proper import in each file
- Test visual consistency

**Pattern:**

```typescript
// OLD (inconsistent):
<Text style={{ color: getColor(status) }}>{status}</Text>

// NEW (uniform):
<StatusBadge status={status} />
```

#### Phase 3: Blue Header Pattern (1-2 hours)

**Apply to all Planning screens:**

```typescript
// In navigation options
{
  headerStyle: {
    backgroundColor: '#007AFF',  // Standard blue
  },
  headerTintColor: '#FFF',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerRight: () => (
    <View style={{ flexDirection: 'row', marginRight: 16 }}>
      <Text style={{ color: '#FFF', marginRight: 8 }}>
        {projectName}
      </Text>
      <IconButton
        icon="logout"
        iconColor="#FFF"
        onPress={handleLogout}
      />
    </View>
  ),
}
```

#### Phase 4: Verification (1 hour)

- Visual inspection of all 11 screens
- Screenshot comparison with Design Engineer screens
- Badge text visibility check (white on all status colors)
- Header consistency across all screens

### Deliverables

**Files Created:**
- `src/planning/components/StatusBadge.tsx` (~60 LOC)

**Files Modified:**
- All 11 Planning screens (status badge replacement + header updates)
- Navigation configuration (blue headers)

---

## Implementation Timeline

### 6-Week Breakdown (42-54 hours total)

**Week 1: Navigation - Dashboard (8-10h)**

```
Day 1-2 (4-5h): Dashboard Structure + Base Widget
- Create PlanningDashboard screen
- Create BaseWidget component
- Set up dashboard layout system

Day 3-5 (4-5h): Dashboard Widgets
- Create 6 dashboard widgets
- Implement widget data providers
- Testing and refinement
```

**Week 2: Navigation - Schedule & Navigator (8-10h)**

```
Day 1-2 (4-5h): UnifiedSchedule
- Create UnifiedSchedule with 3 tab views
- Refactor existing ScheduleManagement
- Implement Calendar and List views

Day 3-5 (4-5h): Navigator Update
- Restructure PlanningNavigator (tabs + drawer)
- Update navigation references
- Test deep linking and gestures
```

**Week 3: Accessibility (10-14h)**

```
Day 1-2 (6-8h): Critical Screens
- PlanningDashboard accessibility
- UnifiedSchedule accessibility
- GanttChart accessibility
- ItemCreation/Edit accessibility

Day 3-4 (4-6h): Secondary Screens
- SiteManagement, WBSManagement, MilestoneTracking
- Baseline, ResourcePlanning
- Full accessibility audit
```

**Week 4: Empty States & Performance (11-18h)**

```
Day 1-2 (6-8h): Enhanced Empty States
- Dashboard widget empty states
- Schedule empty states
- All other screen empty states

Day 2-4 (5-10h): Performance Optimization
- Debounced search (Schedule, WBS)
- Memoized filters (WBS)
- FlatList optimizations (all lists)
- Gantt chart throttling
```

**Week 5: Uniformity & Polish (5-6h)**

```
Day 1 (1h): StatusBadge Component
- Create StatusBadge component
- Define status colors

Day 2-3 (3-4h): Status Badge Replacement
- Replace status indicators across all screens
- Apply blue header pattern

Day 4 (1h): Final Verification
- Visual consistency check
- Badge visibility verification
```

**Week 6: Testing & Documentation (Buffer)**

```
Day 1-5: Final Testing
- Test all Phase 3 features
- Regression testing (Phase 1 & 2)
- Bug fixes
- Documentation updates
- PR preparation
```

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Navigation Efficiency** | 6 tabs | 4 tabs + 5 drawer | Navigation audit |
| **Search Lag** | ~50ms | <20ms | Input latency test |
| **Filter Switch Time** | ~30ms | <10ms | Performance profiler |
| **Accessibility Score** | 50% | 100% (WCAG AA) | Accessibility audit |
| **Empty State Coverage** | 0% | 100% | Manual verification |
| **List Scroll Performance** | ~30fps | 60fps | Performance profiler |

### Qualitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Navigation UX** | Excellent | User feedback |
| **Visual Consistency** | 100% | Design review |
| **Code Quality** | High | Code review |
| **Pattern Reusability** | High | Other roles adoption |

---

## Testing Strategy

### Automated Testing

**Performance Tests:**

```typescript
describe('Performance', () => {
  it('should debounce search input', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('');
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('test');
  });

  it('should throttle scroll events', () => {
    const { result } = renderHook(() => useThrottle(100, 100));
    // Assert throttle behavior
  });
});
```

**Accessibility Tests:**

```typescript
describe('Accessibility', () => {
  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(<ScheduleItemCard item={mockItem} />);
    expect(getByLabelText(/Schedule item/)).toBeTruthy();
  });

  it('should announce screen loads', () => {
    const { announce } = useAccessibility();
    render(<PlanningDashboard />);
    expect(announce).toHaveBeenCalledWith(/Dashboard loaded/);
  });
});
```

### Manual Testing

**Navigation Testing:**
- [ ] Dashboard loads with all 6 widgets
- [ ] Bottom tabs navigate correctly (4 tabs)
- [ ] Drawer opens/closes smoothly
- [ ] Drawer items navigate correctly (5 items)
- [ ] Deep linking works from widgets to detail screens
- [ ] Back button behavior is correct throughout

**Accessibility Testing:**
- [ ] Screen reader announces screen loads
- [ ] All interactive elements have accessibilityLabel
- [ ] Form fields announce errors
- [ ] Success actions announce completion
- [ ] Keyboard navigation works (if applicable)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)

**Empty State Testing:**
- [ ] Empty states show on all screens with no data
- [ ] Action buttons navigate correctly
- [ ] Icons display properly
- [ ] Messages are contextually relevant

**Performance Testing:**
- [ ] Search input doesn't lag (300ms debounce)
- [ ] Filters apply smoothly (no blocking)
- [ ] FlatLists scroll at 60fps
- [ ] Gantt chart panning is smooth (100ms throttle)
- [ ] Large lists (1000+ items) remain responsive

**Uniformity Testing:**
- [ ] Status badges use white text, fontSize 12, bold
- [ ] All status colors have sufficient contrast (white text visible)
- [ ] Headers are consistent blue (#007AFF)
- [ ] Project name + logout in all headers
- [ ] Badge text not cut off on any screen

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

- [ ] Implementation plan complete ✅
- [ ] Testing document created
- [ ] Component documentation complete
- [ ] JSDoc for all public APIs
- [ ] README updated if needed
- [ ] PROGRESS_TRACKING.md updated

---

## Dependencies & Risks

### External Dependencies

**Calendar Library (Optional):**

```bash
# For Calendar view in UnifiedSchedule
npm install react-native-calendars
# Alternative: Custom calendar component
```

**Decision needed:** User preference for calendar implementation

### Technical Risks

1. **Gantt Chart Accessibility**
   - **Risk:** Complex visualization may need alternative text-based view
   - **Mitigation:** Provide table view for screen readers

2. **Dashboard Widget Performance**
   - **Risk:** 6 widgets loading simultaneously
   - **Mitigation:** Stagger loads with skeleton screens, use React.memo

3. **Navigation Restructure**
   - **Risk:** Breaking change to existing navigation patterns
   - **Mitigation:** Thorough testing of all navigation paths, update deep links

### Integration Points

- ✅ All Planning screens already use `useReducer` (Phase 2)
- ✅ Existing state management can be reused without changes
- ✅ No new backend APIs required
- ✅ Utilities already exist and tested (Design Engineer Phase 3)

---

## Next Steps After Completion

1. **Testing**
   - Complete manual testing using PLANNING_PHASE3_TESTING.md
   - Fix any issues found

2. **Update PROGRESS_TRACKING.md**
   - Mark Planning Phase 3 complete (4/4 tasks)
   - Update overall progress metrics

3. **Create Pull Request**
   - Comprehensive PR description
   - Testing checklist
   - Screenshots/GIFs of new features
   - Reference issue/roadmap

4. **Merge to Main**
   - Code review approval
   - All tests passing
   - Documentation updated

5. **Apply Patterns to Next Role**
   - Use established patterns for next role's Phase 3
   - Refine based on learnings from Planning

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

**Navigation:**
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Bottom Tabs Navigator](https://reactnavigation.org/docs/bottom-tab-navigator)
- [Drawer Navigator](https://reactnavigation.org/docs/drawer-navigator)

**Empty States:**
- [Undraw](https://undraw.co/)
- [Storyset](https://storyset.com/)
- [Empty State Design](https://emptystat.es/)

---

**End of Planning Phase 3 Implementation Plan**

*Ready to start implementation! This plan follows established patterns from Design Engineer Phase 3 and applies uniformity requirements from CLAUDE.md.*
