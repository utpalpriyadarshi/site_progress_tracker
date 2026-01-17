# Manager Phase 3: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 3 - Nice-to-Have Improvements
**Role:** Manager
**Total Estimated Time:** 50-66 hours
**Created:** 2026-01-16
**Status:** 🎯 Ready to Start
**Branch:** `manager/phase3-implementation`

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 3.1: Dashboard Redesign](#task-31-dashboard-redesign)
4. [Task 3.2: Accessibility Features](#task-32-accessibility-features)
5. [Task 3.3: Enhanced Empty States](#task-33-enhanced-empty-states)
6. [Task 3.4: Search & Filter Performance](#task-34-search--filter-performance)
7. [Task 3.5: Advanced Features](#task-35-advanced-features)
8. [Implementation Timeline](#implementation-timeline)
9. [Testing Strategy](#testing-strategy)
10. [Quality Checklist](#quality-checklist)

---

## Overview

Manager Phase 3 focuses on transforming the dashboard into a modular widget system, adding WCAG 2.1 AA accessibility compliance, implementing context-aware empty states, and optimizing search/filter performance.

### Why Manager Next?

**Advantages:**
- ✅ HIGH priority role - central to project oversight
- ✅ Dashboard already has 7 defined sections to convert to widgets
- ✅ Can reuse widget patterns from Planning & Design Engineer
- ✅ Large impact (10 screens, 2,411 line dashboard)

**Phase 3 Goals:**
1. Convert 7 dashboard sections into modular, refreshable widgets
2. Connect widgets to real database data via hooks
3. Achieve WCAG 2.1 AA accessibility compliance
4. Implement context-aware empty states
5. Optimize BOM and team search performance
6. Add export and batch approval features

---

## Current State Analysis

### Manager Screens (10 total)

After Phase 1 & 2 completion:

| Screen | Current LOC | State Management | Components | Status |
|--------|-------------|------------------|------------|--------|
| ManagerDashboardScreen | 2,411 | ✅ useReducer | ✅ 7 Sections | Phase 2 Complete |
| FinancialReportsScreen | 957 | Local state | Basic | Phase 2 Complete |
| MilestoneManagementScreen | 981 | Local state | Basic | Phase 2 Complete |
| TeamPerformanceScreen | 595 | Local state | Basic | Phase 2 Complete |
| BomManagementScreen | 201 | ✅ useReducer | ✅ Shared | Phase 2 Complete |
| BomImportWizardScreen | 170 | Hook-based | ✅ Wizard | Phase 2 Complete |
| ProjectOverviewScreen | ~400 | Local state | Basic | Phase 2 Complete |
| ResourceAllocationScreen | ~350 | Local state | Basic | Phase 2 Complete |
| ResourceRequestsScreen | ~300 | Local state | Basic | Phase 2 Complete |
| TeamManagementScreen | ~350 | Local state | Basic | Phase 2 Complete |

**Completed in Phase 1 & 2:**
- ✅ Console logs removed (55 → 0)
- ✅ Error boundaries added (10/10)
- ✅ Large files refactored (51% reduction)
- ✅ BOM state management with useReducer
- ✅ Dashboard state management with useReducer
- ✅ Shared components: KPICard, ApprovalWorkflowCard, etc.
- ✅ Loading skeletons: Dashboard, BOM list, Team performance
- ✅ ManagerContext & BomContext providers

**Phase 3 Focus:**
- 🎯 Convert 7 dashboard sections to modular widgets
- 🎯 Widget hooks with real database queries
- 🎯 Full accessibility compliance (WCAG 2.1 AA)
- 🎯 Enhanced empty states with illustrations
- 🎯 Optimized search/filter with debouncing
- 🎯 Export BOM to Excel, batch approvals

---

## Task 3.1: Dashboard Redesign

**Estimated Time:** 20-26 hours
**Priority:** High
**Complexity:** High

### Objective

Transform ManagerDashboardScreen into a modular widget-based dashboard following the proven pattern from Planning and Design Engineer roles.

### Current Dashboard Sections (7 total)

| Section | Content | Widget Type |
|---------|---------|-------------|
| KPIs | Overall completion, budget, sites on schedule | MetricWidget |
| Engineering | PM200 progress, DOORS, RFQ status | ProgressWidget |
| Site Progress | All sites comparison | ChartWidget |
| Equipment & Materials | PM300/PM400, PO status | ProgressWidget |
| Financial | Budget, P&L, BOM costs | MetricWidget |
| Testing & Commissioning | PM500/PM600, inspections | ProgressWidget |
| Handover | PM700, documentation, punch list | ProgressWidget |

### Target Architecture

#### Files to Create

```
src/manager/dashboard/
├── ManagerDashboard.tsx              (~200 LOC) - Main dashboard with widget layout
├── widgets/
│   ├── BaseWidget.tsx                (~230 LOC) - Reuse from Planning (copy)
│   ├── KPIOverviewWidget.tsx         (~150 LOC) - Overall completion, budget, sites
│   ├── EngineeringProgressWidget.tsx (~180 LOC) - PM200, DOORS, RFQ
│   ├── SiteProgressWidget.tsx        (~200 LOC) - Sites comparison chart
│   ├── EquipmentMaterialsWidget.tsx  (~180 LOC) - PM300/PM400, PO status
│   ├── FinancialSummaryWidget.tsx    (~180 LOC) - Budget, costs, P&L
│   ├── TestingCommissioningWidget.tsx(~180 LOC) - PM500/PM600, inspections
│   ├── HandoverStatusWidget.tsx      (~150 LOC) - PM700, documentation
│   └── index.ts                      (~20 LOC)  - Exports
├── hooks/
│   ├── useKPIData.ts                 (~120 LOC) - KPI metrics from DB
│   ├── useEngineeringData.ts         (~150 LOC) - Engineering progress
│   ├── useSiteProgressData.ts        (~150 LOC) - Sites comparison
│   ├── useEquipmentMaterialsData.ts  (~150 LOC) - Equipment/materials
│   ├── useFinancialData.ts           (~150 LOC) - Financial summary
│   ├── useTestingData.ts             (~150 LOC) - Testing/commissioning
│   ├── useHandoverData.ts            (~120 LOC) - Handover status
│   └── index.ts                      (~20 LOC)  - Exports
└── index.ts                          (~10 LOC)  - Main export
```

**Total New Code:** ~2,060 LOC

### Widget Implementation Pattern

Following Planning Phase 3 pattern with accessibility and StatusBadge fix:

```typescript
/**
 * KPIOverviewWidget
 *
 * Displays overall project KPIs: completion %, budget utilization,
 * sites on schedule/delayed.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { useKPIData } from '../hooks';
import { StatusBadge } from '../../shared/components';

export const KPIOverviewWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useKPIData();

  return (
    <BaseWidget
      title="Project Overview"
      icon="chart-box"
      loading={loading}
      error={error}
      onRefresh={refresh}
      accessibilityLabel={`Project overview: ${data?.overallCompletion}% complete`}
    >
      <View style={styles.container}>
        {/* Overall Completion */}
        <View style={styles.metricRow}>
          <Text variant="labelMedium">Overall Completion</Text>
          <Text variant="headlineMedium" style={styles.value}>
            {data?.overallCompletion}%
          </Text>
        </View>

        {/* Budget Utilization */}
        <View style={styles.metricRow}>
          <Text variant="labelMedium">Budget Utilization</Text>
          <Text variant="titleMedium">{data?.budgetUtilization}%</Text>
        </View>

        {/* Site Status - Using custom StatusBadge (NOT Chip) */}
        <View style={styles.statusRow}>
          <StatusBadge
            status="success"
            label={`${data?.sitesOnSchedule} On Schedule`}
          />
          <StatusBadge
            status="warning"
            label={`${data?.sitesDelayed} Delayed`}
          />
        </View>
      </View>
    </BaseWidget>
  );
};
```

### Hook Implementation Pattern

```typescript
/**
 * useKPIData Hook
 *
 * Fetches KPI metrics for the manager's assigned project.
 * Uses ManagerContext for project filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useManagerContext } from '../../context';

interface KPIData {
  overallCompletion: number;
  budgetUtilization: number;
  sitesOnSchedule: number;
  sitesDelayed: number;
  openHindrances: number;
  pendingApprovals: number;
}

interface UseKPIDataResult {
  data: KPIData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKPIData(): UseKPIDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query sites for project
      const sitesCollection = database.collections.get('sites');
      const sites = await sitesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Query items for all sites
      const siteIds = sites.map(s => s.id);
      const itemsCollection = database.collections.get('items');
      const items = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Calculate metrics
      const totalItems = items.length;
      const completedItems = items.filter(i => i.status === 'completed').length;
      const overallCompletion = totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;

      // ... more calculations

      setData({
        overallCompletion,
        budgetUtilization: 0, // Calculate from project budget
        sitesOnSchedule: sites.filter(s => !s.isDelayed).length,
        sitesDelayed: sites.filter(s => s.isDelayed).length,
        openHindrances: 0, // Query hindrances table
        pendingApprovals: 0, // Query approvals
      });
    } catch (err) {
      setError('Failed to load KPI data');
      console.error('Error loading KPI data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
```

### StatusBadge Component (IMPORTANT)

**Use custom View+Text instead of react-native-paper Chip to avoid text clipping:**

```typescript
// src/manager/shared/components/StatusBadge.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'default';
  label: string;
}

const STATUS_COLORS = {
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  warning: { bg: '#FFF3E0', text: '#E65100' },
  error: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
  default: { bg: '#F5F5F5', text: '#616161' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.default;

  return (
    <View
      style={[styles.badge, { backgroundColor: colors.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.text, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minHeight: 24,
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

### Deliverables

**Files Created:**
- 1 main dashboard component
- 7 widget components
- 7 data hooks
- 3 index files

**Total:** ~19 new files, ~2,060 LOC

---

## Task 3.2: Accessibility Features

**Estimated Time:** 12-16 hours
**Priority:** High
**Complexity:** Medium

### Objective

Achieve WCAG 2.1 AA compliance across all Manager screens with focus on:
- Screen reader support for dashboards and charts
- Keyboard navigation for BOM management
- Proper accessibility roles and labels

### Implementation

#### 3.2.1 Create useAccessibility Hook

Copy from Planning: `src/utils/accessibility.ts`

```typescript
export const useAccessibility = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      // Android uses TalkBack announcements
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  return { announce };
};
```

#### 3.2.2 Screens to Update

| Screen | Accessibility Features |
|--------|----------------------|
| ManagerDashboard | Widget announcements, chart descriptions |
| BomManagement | List announcements, form labels |
| BomImportWizard | Step progress, validation feedback |
| FinancialReports | Chart descriptions, data tables |
| MilestoneManagement | Progress announcements |
| TeamPerformance | Metrics announcements |

#### 3.2.3 Accessibility Props Pattern

```typescript
// Widget with accessibility
<BaseWidget
  accessibilityLabel={`Engineering progress widget showing ${data.pm200Progress}% completion`}
  accessibilityHint="Double tap to view engineering details"
>

// List item with accessibility
<Pressable
  accessible
  accessibilityRole="button"
  accessibilityLabel={`BOM item ${item.name}, quantity ${item.quantity}, cost ${item.cost}`}
  accessibilityHint="Double tap to edit"
>

// Form field with accessibility
<TextInput
  accessibilityLabel="BOM name"
  accessibilityHint="Enter a name for this bill of materials"
/>
```

### Deliverables

- Update 10 screens with accessibility props
- Add useAccessibility hook usage
- Add screen reader announcements for data changes
- Estimated: ~400 LOC changes

---

## Task 3.3: Enhanced Empty States

**Estimated Time:** 8-10 hours
**Priority:** Medium
**Complexity:** Low

### Objective

Implement context-aware empty states with helpful messaging and action buttons.

### Empty State Scenarios

| Screen | Empty Condition | Message | Action |
|--------|----------------|---------|--------|
| Dashboard | No project assigned | "No project assigned" | Contact Admin |
| Dashboard | No sites | "No sites in project" | Add Site |
| BomManagement | No BOMs | "No bills of materials yet" | Create BOM |
| BomManagement | No items in BOM | "BOM has no items" | Add Items |
| FinancialReports | No financial data | "No financial data available" | - |
| MilestoneManagement | No milestones | "No milestones defined" | Create Milestone |
| TeamPerformance | No team members | "No team members assigned" | Manage Team |

### Implementation

Use shared EmptyState component from `src/components/common/EmptyState.tsx`:

```typescript
import { EmptyState } from '../../components/common/EmptyState';

// In BomManagement when no BOMs
{boms.length === 0 && !loading && (
  <EmptyState
    icon="file-document-outline"
    title="No Bills of Materials"
    message="Create your first BOM to track project costs and materials."
    actionLabel="Create BOM"
    onAction={() => dispatch({ type: 'OPEN_CREATE_DIALOG' })}
  />
)}
```

### Deliverables

- Add empty states to 7 screens
- Context-aware messaging
- Action buttons where applicable
- Estimated: ~200 LOC

---

## Task 3.4: Search & Filter Performance

**Estimated Time:** 6-8 hours
**Priority:** Medium
**Complexity:** Low

### Objective

Optimize search and filter performance using debouncing and memoization.

### Implementation

#### 3.4.1 Add useDebounce Hook

Copy from Planning: `src/utils/performance.ts`

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

#### 3.4.2 Screens to Optimize

| Screen | Optimization |
|--------|-------------|
| BomManagement | Debounce BOM search (300ms) |
| BomManagement | Memoize filtered BOM list |
| TeamPerformance | Debounce team member search |
| MilestoneManagement | Debounce milestone search |
| FinancialReports | Memoize chart data calculations |

#### 3.4.3 Implementation Pattern

```typescript
// In BomManagement
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

const filteredBoms = useMemo(() => {
  if (!debouncedSearch.trim()) return boms;

  const query = debouncedSearch.toLowerCase();
  return boms.filter(bom =>
    bom.name.toLowerCase().includes(query) ||
    bom.description?.toLowerCase().includes(query)
  );
}, [boms, debouncedSearch]);

// Announce results for accessibility
useEffect(() => {
  if (debouncedSearch) {
    announce(`Found ${filteredBoms.length} BOMs matching "${debouncedSearch}"`);
  }
}, [filteredBoms.length, debouncedSearch]);
```

### Deliverables

- Add useDebounce to 4 screens
- Add useMemo for filtered lists
- Add accessibility announcements
- Estimated: ~150 LOC

---

## Task 3.5: Advanced Features

**Estimated Time:** 4-6 hours
**Priority:** Low
**Complexity:** Medium

### Objective

Add export functionality and batch approval workflows.

### 3.5.1 Export BOM to Excel

```typescript
// In useBomData hook
const exportToExcel = useCallback(async (bomId: string) => {
  try {
    const bom = await getBomById(bomId);
    const items = await getBomItems(bomId);

    // Use existing BomImportExportService
    await BomImportExportService.exportBomToExcel(bom, items);

    showSnackbar('BOM exported successfully', 'success');
  } catch (error) {
    showSnackbar('Failed to export BOM', 'error');
  }
}, []);
```

### 3.5.2 Batch Approval UI

Add ability to select multiple items for batch approval:

```typescript
// Multi-select state
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [selectionMode, setSelectionMode] = useState(false);

// Batch approve action
const handleBatchApprove = async () => {
  for (const itemId of selectedItems) {
    await approveItem(itemId);
  }
  setSelectedItems(new Set());
  setSelectionMode(false);
  announce(`${selectedItems.size} items approved`);
};
```

### Deliverables

- Export BOM button and functionality
- Multi-select mode for batch operations
- Estimated: ~200 LOC

---

## Implementation Timeline

### Recommended Order

| Order | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | 3.1 Dashboard Redesign | 20-26h | None |
| 2 | 3.2 Accessibility | 12-16h | Task 3.1 (widgets) |
| 3 | 3.3 Empty States | 8-10h | None |
| 4 | 3.4 Search Performance | 6-8h | None |
| 5 | 3.5 Advanced Features | 4-6h | Task 3.1 (BOM hooks) |

**Total:** 50-66 hours

### Suggested Breakdown

**Day 1-3:** Task 3.1 (Dashboard widgets + hooks)
**Day 4:** Task 3.2 (Accessibility)
**Day 5:** Tasks 3.3 + 3.4 (Empty states + Performance)
**Day 6:** Task 3.5 (Advanced features) + Testing

---

## Testing Strategy

### Manual Testing Checklist

#### Dashboard Testing
- [ ] All 7 widgets display correctly
- [ ] Widgets show loading states
- [ ] Widgets handle errors gracefully
- [ ] Refresh functionality works
- [ ] Data updates reflect changes

#### Accessibility Testing
- [ ] Screen reader announces widget content
- [ ] All interactive elements have labels
- [ ] Focus order is logical
- [ ] Color contrast meets WCAG AA

#### Empty State Testing
- [ ] Empty states show for each scenario
- [ ] Action buttons work correctly
- [ ] Messages are contextually appropriate

#### Performance Testing
- [ ] Search debounce works (no lag)
- [ ] Large lists render smoothly
- [ ] No unnecessary re-renders

---

## Quality Checklist

### Code Quality
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] All hooks have proper dependencies
- [ ] Memoization applied where needed

### Architecture
- [ ] Widgets follow BaseWidget pattern
- [ ] Hooks follow data fetching pattern
- [ ] Context integration correct
- [ ] Error handling in all async operations

### User Experience
- [ ] Loading indicators shown during fetch
- [ ] Error messages are user-friendly
- [ ] Empty states shown when appropriate
- [ ] Animations smooth (60fps)

### Accessibility
- [ ] All widgets have accessibilityLabel
- [ ] Interactive elements have accessibilityRole
- [ ] Screen reader announcements work
- [ ] Keyboard navigation functional

---

## Key Implementation Notes

### StatusBadge: Use Custom View+Text

**IMPORTANT:** Do NOT use react-native-paper Chip for status badges. The Chip component clips text. Use custom `View+Text` implementation as shown in Task 3.1.

### Reuse from Planning/Design Engineer

The following can be copied/adapted:
- `BaseWidget.tsx` - Widget wrapper component
- `useAccessibility.ts` - Accessibility hook
- `useDebounce.ts` - Performance hook
- `EmptyState.tsx` - Already exists in shared components

### Context Integration

Manager already has `ManagerContext` with `projectId`. Use this in all hooks:

```typescript
const { projectId } = useManagerContext();
```

---

**End of Manager Phase 3 Implementation Plan**

*Ready for implementation. This plan follows proven patterns from Planning and Design Engineer Phase 3.*
