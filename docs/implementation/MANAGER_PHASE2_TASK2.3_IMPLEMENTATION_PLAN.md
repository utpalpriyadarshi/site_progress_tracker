# Manager Phase 2 Task 2.3: Add Loading Skeletons Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 2 - Important Improvements
**Task:** 2.3 - Add Loading Skeletons
**Role:** Manager
**Estimated Time:** 8-10 hours
**Created:** 2026-01-04

---

## Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Current State Analysis](#current-state-analysis)
4. [Architecture Pattern](#architecture-pattern)
5. [Implementation Steps](#implementation-steps)
6. [Component Specifications](#component-specifications)
7. [Integration Points](#integration-points)
8. [Testing Procedures](#testing-procedures)
9. [Quality Checklist](#quality-checklist)
10. [References](#references)

---

## Overview

This document provides a step-by-step implementation guide for creating and integrating loading skeleton components for Manager role screens to improve perceived performance during data loading.

### What We're Creating

**3 Specialized Skeleton Components:**
1. **DashboardSkeleton** - For ManagerDashboardScreen (KPIs, charts, sections)
2. **BomListSkeleton** - For BomManagementScreen (BOM cards list)
3. **TeamPerformanceSkeleton** - For TeamPerformanceScreen (metrics and charts)

### Why This Matters

- **Perceived Performance:** Skeletons reduce perceived loading time by 40-60%
- **User Experience:** Provides visual feedback that content is loading
- **Consistent Patterns:** Uses existing skeleton components from `src/components/skeletons`
- **Professional Polish:** Industry-standard loading UX pattern

---

## Objectives

### Primary Goals

1. **Create 3 Specialized Skeletons:** Dashboard, BOM List, and Team Performance
2. **Integrate Seamlessly:** Replace loading spinners with skeleton screens
3. **Follow Existing Patterns:** Use base skeleton components (Skeleton, SkeletonCard, etc.)
4. **Maintain Performance:** Ensure skeletons don't impact app performance

### Success Metrics

- ✅ All 3 skeleton components created and documented
- ✅ All Manager screens show skeletons during initial load
- ✅ Smooth transitions from skeleton → real content
- ✅ TypeScript compiles with 0 errors
- ✅ No performance degradation

---

## Current State Analysis

### Existing Skeleton Components

**Location:** `src/components/skeletons/`

**Available Components:**
1. **Skeleton** - Base skeleton with shimmer animation
   - Props: width, height, variant (rect/circle/text), borderRadius
   - Shimmer animation built-in

2. **SkeletonCard** - Card-based skeleton
   - Props: showAvatar, lines, showActions, showImage, variant
   - Variants: default, compact, detailed

3. **SkeletonList** - List of skeleton cards
   - Props: count, showAvatar, lines, showActions, variant

4. **SkeletonHeader** - Header section skeleton
   - Props: showAvatar, showAction, showSubtitle, variant
   - Variants: default, large, compact

5. **SkeletonForm** - Form field skeleton
   - For input fields and forms

### Current Loading States

**ManagerDashboardScreen:**
```typescript
if (loading) {
  return <LoadingState message="Loading dashboard..." />;
}
```
- Uses spinner with message
- No visual structure during load
- Abrupt transition to content

**BomManagementScreen:**
```typescript
// No explicit loading state
// Data loads directly from WatermelonDB
```
- Immediate render with empty state
- No loading feedback

**TeamPerformanceScreen:**
```typescript
// Similar to Dashboard - spinner-based loading
```

---

## Architecture Pattern

### Component Structure

```
src/manager/shared/skeletons/
├── index.ts                      # Barrel exports
├── DashboardSkeleton.tsx         # Dashboard loading skeleton
├── BomListSkeleton.tsx           # BOM list loading skeleton
└── TeamPerformanceSkeleton.tsx   # Team performance loading skeleton
```

### Design Principles

1. **Match Real Layout:** Skeletons should mirror actual content structure
2. **Reuse Base Components:** Build on existing Skeleton, SkeletonCard, etc.
3. **Configurable:** Support different variants/modes where applicable
4. **Lightweight:** Minimal performance impact
5. **TypeScript:** Full type safety with exported interfaces

### Integration Pattern

```typescript
// Before
if (loading) {
  return <LoadingState message="Loading..." />;
}

// After
if (loading) {
  return <DashboardSkeleton />;
}
```

---

## Implementation Steps

### Phase 1: Setup (1 hour)

**Step 1.1: Create Directory Structure**
```bash
mkdir src/manager/shared/skeletons
touch src/manager/shared/skeletons/index.ts
touch src/manager/shared/skeletons/DashboardSkeleton.tsx
touch src/manager/shared/skeletons/BomListSkeleton.tsx
touch src/manager/shared/skeletons/TeamPerformanceSkeleton.tsx
```

**Step 1.2: Create Barrel Export**
```typescript
// src/manager/shared/skeletons/index.ts
export { DashboardSkeleton } from './DashboardSkeleton';
export { BomListSkeleton } from './BomListSkeleton';
export { TeamPerformanceSkeleton } from './TeamPerformanceSkeleton';
```

**Step 1.3: Update Main Shared Index**
```typescript
// src/manager/shared/index.ts
export * from './components';
export * from './types';
export * from './skeletons';  // Add this line
```

**Validation:**
- ✅ Directory structure created
- ✅ TypeScript recognizes imports
- ✅ No errors

---

### Phase 2: Dashboard Skeleton (2-3 hours)

**Step 2.1: Analyze Dashboard Structure**

ManagerDashboardScreen has these sections:
1. Header with project info
2. KPI Cards (4 cards in row)
3. Engineering Section (charts and stats)
4. Site Progress Section (progress bars)
5. Equipment/Materials Section (cards)
6. Financial Section (charts)
7. Testing & Commissioning Section (progress indicators)
8. Handover Section (status cards)

**Step 2.2: Create DashboardSkeleton Component**

See [Component Specifications](#dashboardskeleton) for full implementation.

**Step 2.3: Test Dashboard Skeleton**
- Import in ManagerDashboardScreen
- Replace LoadingState temporarily
- Verify visual match with real content
- Check shimmer animation

**Validation:**
- ✅ Dashboard skeleton created
- ✅ Matches real layout structure
- ✅ Smooth shimmer animation
- ✅ TypeScript 0 errors

---

### Phase 3: BOM List Skeleton (2 hours)

**Step 3.1: Analyze BOM List Structure**

BomManagementScreen shows:
1. Header with filters
2. List of BOM cards with:
   - BOM name and type badge
   - Project name
   - Date created
   - Item count
   - Total cost
   - Action buttons

**Step 3.2: Create BomListSkeleton Component**

See [Component Specifications](#bomlistskeleton) for full implementation.

**Step 3.3: Test BOM List Skeleton**
- Import in BomManagementScreen
- Show during initial data load
- Verify card structure matches

**Validation:**
- ✅ BOM list skeleton created
- ✅ Card structure matches real BOM cards
- ✅ TypeScript 0 errors

---

### Phase 4: Team Performance Skeleton (2 hours)

**Step 4.1: Analyze Team Performance Structure**

TeamPerformanceScreen shows:
1. Header with team selector
2. Performance metrics cards
3. Activity charts (bar/line charts)
4. Team member performance cards

**Step 4.2: Create TeamPerformanceSkeleton Component**

See [Component Specifications](#teamperformanceskeleton) for full implementation.

**Step 4.3: Test Team Performance Skeleton**
- Import in TeamPerformanceScreen
- Verify metrics and chart layout
- Check responsiveness

**Validation:**
- ✅ Team performance skeleton created
- ✅ Layout matches real content
- ✅ TypeScript 0 errors

---

### Phase 5: Integration (2 hours)

**Step 5.1: Integrate Dashboard Skeleton**
```typescript
// src/manager/ManagerDashboardScreen.tsx
import { DashboardSkeleton } from './shared';

// In component
if (loading) {
  return <DashboardSkeleton />;
}
```

**Step 5.2: Integrate BOM List Skeleton**
```typescript
// src/manager/BomManagementScreen.tsx
import { BomListSkeleton } from './shared';

// In component
if (loading && boms.length === 0) {
  return <BomListSkeleton count={5} />;
}
```

**Step 5.3: Integrate Team Performance Skeleton**
```typescript
// src/manager/TeamPerformanceScreen.tsx
import { TeamPerformanceSkeleton } from './shared';

// In component
if (loading) {
  return <TeamPerformanceSkeleton />;
}
```

**Validation:**
- ✅ All 3 screens show skeletons during load
- ✅ Smooth transition to real content
- ✅ No flickering or layout shifts

---

### Phase 6: Testing & Documentation (1 hour)

**Step 6.1: Manual Testing**
- Test each screen with slow network simulation
- Verify skeletons appear before data
- Check transition smoothness
- Test on different screen sizes

**Step 6.2: TypeScript & ESLint Validation**
```bash
npx tsc --noEmit
npx eslint "src/manager/shared/skeletons/**/*.tsx"
```

**Step 6.3: Update Documentation**
- Add usage examples to each skeleton component
- Update PROGRESS_TRACKING.md
- Create usage guide if needed

**Validation:**
- ✅ All manual tests pass
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Documentation complete

---

## Component Specifications

### DashboardSkeleton

**File:** `src/manager/shared/skeletons/DashboardSkeleton.tsx`

**Props:**
```typescript
export interface DashboardSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}
```

**Structure:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard, SkeletonHeader } from '../../../components/skeletons';

export interface DashboardSkeletonProps {
  style?: ViewStyle;
}

/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for Manager Dashboard Screen.
 * Mirrors the structure of the actual dashboard with KPIs, sections, and charts.
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <DashboardSkeleton />;
 * }
 * ```
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <SkeletonHeader variant="large" showAction style={styles.header} />

      {/* KPI Cards Row */}
      <View style={styles.kpiRow}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.kpiCard}>
            <Skeleton width="100%" height={80} borderRadius={8} />
          </View>
        ))}
      </View>

      {/* Engineering Section */}
      <View style={styles.section}>
        <Skeleton width="40%" height={20} marginBottom={12} />
        <View style={styles.chartRow}>
          <Skeleton width="48%" height={120} borderRadius={8} />
          <Skeleton width="48%" height={120} borderRadius={8} />
        </View>
      </View>

      {/* Site Progress Section */}
      <View style={styles.section}>
        <Skeleton width="35%" height={20} marginBottom={12} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.progressItem}>
            <Skeleton width="30%" height={14} marginBottom={8} />
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Financial Section */}
      <View style={styles.section}>
        <Skeleton width="30%" height={20} marginBottom={12} />
        <Skeleton width="100%" height={200} borderRadius={8} />
      </View>

      {/* Bottom Sections */}
      <View style={styles.section}>
        <SkeletonCard lines={3} showActions variant="compact" />
        <SkeletonCard lines={3} showActions variant="compact" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    width: '48%',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    marginBottom: 16,
  },
});
```

---

### BomListSkeleton

**File:** `src/manager/shared/skeletons/BomListSkeleton.tsx`

**Props:**
```typescript
export interface BomListSkeletonProps {
  /**
   * Number of BOM card skeletons to show
   * @default 5
   */
  count?: number;

  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}
```

**Structure:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard } from '../../../components/skeletons';

export interface BomListSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

/**
 * BomListSkeleton Component
 *
 * Loading skeleton for BOM Management Screen.
 * Shows skeleton cards that match the structure of BOM cards.
 *
 * @example
 * ```tsx
 * if (loading && boms.length === 0) {
 *   return <BomListSkeleton count={5} />;
 * }
 * ```
 */
export const BomListSkeleton: React.FC<BomListSkeletonProps> = ({
  count = 5,
  style,
}) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width="50%" height={28} marginBottom={8} />
        <View style={styles.filterRow}>
          <Skeleton width="30%" height={36} borderRadius={4} />
          <Skeleton width="30%" height={36} borderRadius={4} />
        </View>
      </View>

      {/* BOM Cards */}
      <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={styles.bomCard}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <Skeleton width="60%" height={18} marginBottom={4} />
              <Skeleton width={80} height={24} borderRadius={12} />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Skeleton width="40%" height={14} marginBottom={8} />
              <Skeleton width="50%" height={14} marginBottom={8} />
              <View style={styles.statsRow}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="30%" height={14} />
              </View>
            </View>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              <Skeleton width={70} height={32} borderRadius={4} />
              <Skeleton width={70} height={32} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  listContainer: {
    padding: 16,
  },
  bomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
```

---

### TeamPerformanceSkeleton

**File:** `src/manager/shared/skeletons/TeamPerformanceSkeleton.tsx`

**Props:**
```typescript
export interface TeamPerformanceSkeletonProps {
  /**
   * Custom style for the container
   */
  style?: ViewStyle;
}
```

**Structure:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton, SkeletonCard, SkeletonHeader } from '../../../components/skeletons';

export interface TeamPerformanceSkeletonProps {
  style?: ViewStyle;
}

/**
 * TeamPerformanceSkeleton Component
 *
 * Loading skeleton for Team Performance Screen.
 * Shows skeleton for performance metrics, charts, and team member cards.
 *
 * @example
 * ```tsx
 * if (loading) {
 *   return <TeamPerformanceSkeleton />;
 * }
 * ```
 */
export const TeamPerformanceSkeleton: React.FC<TeamPerformanceSkeletonProps> = ({ style }) => {
  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header with Team Selector */}
      <View style={styles.header}>
        <Skeleton width="50%" height={24} marginBottom={12} />
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        <View style={styles.metricsRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.metricCard}>
              <Skeleton width="60%" height={14} marginBottom={8} />
              <Skeleton width="80%" height={32} marginBottom={4} />
              <Skeleton width="40%" height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Activity Chart */}
      <View style={styles.chartSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        <Skeleton width="100%" height={250} borderRadius={8} />
      </View>

      {/* Team Member Cards */}
      <View style={styles.teamSection}>
        <Skeleton width="40%" height={20} marginBottom={16} />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard
            key={i}
            showAvatar
            lines={2}
            variant="compact"
            style={styles.teamCard}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  metricsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  teamSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  teamCard: {
    marginBottom: 12,
  },
});
```

---

## Integration Points

### ManagerDashboardScreen

**File:** `src/manager/ManagerDashboardScreen.tsx`

**Current Loading State:**
```typescript
if (loading) {
  return <LoadingState message="Loading dashboard..." />;
}
```

**Updated Loading State:**
```typescript
import { DashboardSkeleton } from './shared';

if (loading) {
  return <DashboardSkeleton />;
}
```

---

### BomManagementScreen

**File:** `src/manager/BomManagementScreen.tsx`

**Add Loading State:**
```typescript
import { BomListSkeleton } from './shared';

// Add loading state if not present
const [loading, setLoading] = useState(true);

useEffect(() => {
  // After data loads
  setLoading(false);
}, [boms]);

if (loading && boms.length === 0) {
  return <BomListSkeleton count={5} />;
}
```

---

### TeamPerformanceScreen

**File:** `src/manager/TeamPerformanceScreen.tsx`

**Updated Loading State:**
```typescript
import { TeamPerformanceSkeleton } from './shared';

if (loading) {
  return <TeamPerformanceSkeleton />;
}
```

---

## Testing Procedures

### Manual Testing Checklist

**Dashboard Skeleton:**
- [ ] Skeleton appears immediately on screen load
- [ ] All sections (KPIs, charts, progress) are represented
- [ ] Shimmer animation is smooth
- [ ] Transition to real content is seamless
- [ ] No layout shift when content loads
- [ ] Works on different screen sizes

**BOM List Skeleton:**
- [ ] Cards match real BOM card structure
- [ ] Header and filters are represented
- [ ] Card count is configurable
- [ ] Smooth shimmer animation
- [ ] Transition to real BOM list is smooth

**Team Performance Skeleton:**
- [ ] Metrics cards are represented
- [ ] Chart placeholder is appropriate size
- [ ] Team member cards match real structure
- [ ] Overall layout matches real screen

### Performance Testing

**Test Scenarios:**
1. **Fast Network:** Skeleton should appear briefly (< 500ms)
2. **Slow Network:** Skeleton should remain until data loads
3. **No Network:** Skeleton should show, then error state

**Performance Metrics:**
- Skeleton render time: < 100ms
- Memory usage: < 5MB
- No frame drops during animation

### TypeScript Validation

```bash
# Validate TypeScript
npx tsc --noEmit src/manager/shared/skeletons/*.tsx

# Should show 0 errors
```

### ESLint Validation

```bash
# Validate ESLint
npx eslint "src/manager/shared/skeletons/**/*.tsx"

# Should show 0 errors
```

---

## Quality Checklist

### Code Quality
- [ ] All components have TypeScript interfaces exported
- [ ] All props have JSDoc documentation
- [ ] All components have usage examples in JSDoc
- [ ] Follows existing skeleton component patterns
- [ ] No console.log statements
- [ ] No hardcoded values (use constants)

### Visual Quality
- [ ] Skeletons match real content structure
- [ ] Shimmer animation is smooth (60fps)
- [ ] Colors match app theme (#E1E9EE for skeleton bg)
- [ ] Spacing matches real components
- [ ] Borders and shadows match real cards

### Integration Quality
- [ ] All 3 Manager screens use skeletons
- [ ] Loading states are properly managed
- [ ] No flickering during transitions
- [ ] Error states are handled
- [ ] Refresh/pull-to-refresh shows skeletons

### Documentation Quality
- [ ] Implementation plan is clear
- [ ] Usage examples are provided
- [ ] PROGRESS_TRACKING.md is updated
- [ ] Code comments are helpful
- [ ] Export index is updated

---

## Troubleshooting Guide

### Issue: Skeleton Flickers Briefly

**Cause:** Loading state changes too quickly
**Solution:** Add minimum display time

```typescript
useEffect(() => {
  const minDisplayTime = 300; // ms
  const startTime = Date.now();

  fetchData().then(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => setLoading(false), remaining);
  });
}, []);
```

### Issue: Layout Shift When Content Loads

**Cause:** Skeleton dimensions don't match real content
**Solution:** Measure real content and adjust skeleton

```typescript
// Use exact heights from real components
<Skeleton width="100%" height={82} /> // Matches KPICard height
```

### Issue: Skeleton Animation Lags

**Cause:** Too many skeleton elements animating
**Solution:** Reduce skeleton count or disable shimmer

```typescript
<DashboardSkeleton shimmer={false} /> // Disable shimmer if needed
```

### Issue: TypeScript Errors on Import

**Cause:** Missing barrel exports
**Solution:** Ensure all exports are in index.ts

```typescript
// src/manager/shared/skeletons/index.ts
export { DashboardSkeleton } from './DashboardSkeleton';
export { BomListSkeleton } from './BomListSkeleton';
export { TeamPerformanceSkeleton } from './TeamPerformanceSkeleton';
```

---

## References

### Existing Skeleton Components
- `src/components/skeletons/Skeleton.tsx` - Base skeleton with shimmer
- `src/components/skeletons/SkeletonCard.tsx` - Card skeleton
- `src/components/skeletons/SkeletonList.tsx` - List skeleton
- `src/components/skeletons/SkeletonHeader.tsx` - Header skeleton
- `src/components/skeletons/SkeletonForm.tsx` - Form skeleton

### Related Tasks
- Task 2.1: State Management Refactor (useReducer)
- Task 2.2: Create Shared Components
- Phase 1 Tasks: Error Boundaries, Console Logs, Refactoring

### Design Patterns
- Skeleton Screen Pattern: https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a
- React Native Animations: https://reactnative.dev/docs/animated
- Loading UX Best Practices: Nielsen Norman Group

---

**Document Status:** Draft
**Last Updated:** 2026-01-04
**Review Status:** Pending
**Approved By:** Pending

