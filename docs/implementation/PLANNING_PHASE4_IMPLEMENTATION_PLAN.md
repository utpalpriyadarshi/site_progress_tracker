# Planning Phase 4: Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 4 - Database Integration & Project Context
**Role:** Planning
**Created:** 2026-01-16
**Status:** Ready for Implementation
**Branch:** `planning/phase4-implementation`

---

## Table of Contents

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Task 4.1: Planning Context Provider](#task-41-planning-context-provider)
4. [Task 4.2: Dashboard Database Integration](#task-42-dashboard-database-integration)
5. [Task 4.3: Navigation Performance](#task-43-navigation-performance)
6. [Task 4.4: WBS Site Selection Fix](#task-44-wbs-site-selection-fix)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing Strategy](#testing-strategy)
9. [Quality Checklist](#quality-checklist)

---

## Overview

Planning Phase 4 focuses on connecting the Phase 3 dashboard to real database data, implementing global project context, and fixing remaining issues identified during testing.

### Why Phase 4?

**Context:**
- ✅ Phase 1 Complete: Console logs removed, error boundaries added, large files refactored
- ✅ Phase 2 Complete: useReducer state management, shared components, skeleton screens
- ✅ Phase 3 Complete: Dashboard with 6 widgets, UnifiedSchedule, accessibility, empty states, performance
- ⚠️ Dashboard uses mock data (TODO comments in useWidgetData.ts)
- ⚠️ Project selection doesn't propagate to Dashboard
- ⚠️ Drawer animation performance issues reported

**Phase 4 Goals:**
1. Create PlanningContext for global project selection
2. Connect all dashboard widget hooks to WatermelonDB
3. Improve drawer/navigation performance
4. Fix WBS site selection issue

---

## Current State Analysis

### Issues from Phase 3 Testing

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Mock Data | High | `useWidgetData.ts` | Dashboard hooks use simulated data, not real DB |
| Project Context | High | Multiple screens | No global project selection propagation |
| Drawer Performance | Medium | PlanningNavigator | Delay in opening/closing drawer |
| Logout Smoothness | Medium | PlanningNavigator | Logout transition not smooth |
| WBS Site Selection | Medium | WBSManagementScreen | Site cannot be selected in WBS Breakdown |

### Files Requiring Changes

**New Files to Create:**
```
src/planning/context/
├── PlanningContext.tsx        (~150 LOC) - Global project/site state
├── PlanningProvider.tsx       (~100 LOC) - Provider wrapper
└── index.ts                   (~10 LOC)  - Exports
```

**Files to Modify:**
- `src/planning/dashboard/hooks/useWidgetData.ts` - Replace mock with DB queries
- `src/nav/PlanningNavigator.tsx` - Wrap with PlanningProvider, optimize drawer
- `src/planning/schedule/UnifiedSchedule.tsx` - Update context on project change
- `src/planning/dashboard/PlanningDashboard.tsx` - Read from context
- `src/planning/WBSManagementScreen.tsx` - Fix site selection

---

## Task 4.1: Planning Context Provider

**Priority:** High
**Complexity:** Medium

### Objective

Create a global context to share selected project and site across all Planning screens.

### Implementation

#### 4.1.1 Create PlanningContext

**File:** `src/planning/context/PlanningContext.tsx`

```typescript
/**
 * PlanningContext
 *
 * Global context for Planning role screens.
 * Stores selected project and site to share across all screens.
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import SiteModel from '../../models/SiteModel';

// Types
interface PlanningState {
  selectedProjectId: string | null;
  selectedProject: ProjectModel | null;
  selectedSiteId: string | null;
  selectedSite: SiteModel | null;
  projects: ProjectModel[];
  sites: SiteModel[];
  loading: boolean;
  error: string | null;
}

type PlanningAction =
  | { type: 'SET_PROJECT'; payload: string | null }
  | { type: 'SET_SITE'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: ProjectModel[] }
  | { type: 'SET_SITES'; payload: SiteModel[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

interface PlanningContextValue extends PlanningState {
  selectProject: (projectId: string | null) => void;
  selectSite: (siteId: string | null) => void;
  refreshProjects: () => Promise<void>;
  refreshSites: () => Promise<void>;
}

// Initial state
const initialState: PlanningState = {
  selectedProjectId: null,
  selectedProject: null,
  selectedSiteId: null,
  selectedSite: null,
  projects: [],
  sites: [],
  loading: true,
  error: null,
};

// Reducer
function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        selectedProjectId: action.payload,
        selectedProject: state.projects.find(p => p.id === action.payload) || null,
        // Reset site when project changes
        selectedSiteId: null,
        selectedSite: null,
      };
    case 'SET_SITE':
      return {
        ...state,
        selectedSiteId: action.payload,
        selectedSite: state.sites.find(s => s.id === action.payload) || null,
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_SITES':
      return { ...state, sites: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context
const PlanningContext = createContext<PlanningContextValue | undefined>(undefined);

// Provider
export const PlanningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(planningReducer, initialState);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load sites when project changes
  useEffect(() => {
    if (state.selectedProjectId) {
      loadSites(state.selectedProjectId);
    } else {
      dispatch({ type: 'SET_SITES', payload: [] });
    }
  }, [state.selectedProjectId]);

  const loadProjects = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const projectsCollection = database.collections.get<ProjectModel>('projects');
      const allProjects = await projectsCollection.query().fetch();
      dispatch({ type: 'SET_PROJECTS', payload: allProjects });

      // Auto-select first project if none selected
      if (allProjects.length > 0 && !state.selectedProjectId) {
        dispatch({ type: 'SET_PROJECT', payload: allProjects[0].id });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadSites = async (projectId: string) => {
    try {
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const projectSites = await sitesCollection
        .query(Q.where('project_id', projectId))
        .fetch();
      dispatch({ type: 'SET_SITES', payload: projectSites });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load sites' });
    }
  };

  const selectProject = (projectId: string | null) => {
    dispatch({ type: 'SET_PROJECT', payload: projectId });
  };

  const selectSite = (siteId: string | null) => {
    dispatch({ type: 'SET_SITE', payload: siteId });
  };

  const refreshProjects = async () => {
    await loadProjects();
  };

  const refreshSites = async () => {
    if (state.selectedProjectId) {
      await loadSites(state.selectedProjectId);
    }
  };

  const value: PlanningContextValue = {
    ...state,
    selectProject,
    selectSite,
    refreshProjects,
    refreshSites,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};

// Hook
export const usePlanningContext = (): PlanningContextValue => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanningContext must be used within PlanningProvider');
  }
  return context;
};

export default PlanningContext;
```

#### 4.1.2 Wrap PlanningNavigator

**File:** `src/nav/PlanningNavigator.tsx` (modification)

```typescript
// At the top of the navigator export
import { PlanningProvider } from '../planning/context';

// Wrap the entire navigator
export const PlanningNavigator = () => (
  <PlanningProvider>
    <PlanningDrawerNavigator />
  </PlanningProvider>
);
```

#### 4.1.3 Update UnifiedSchedule to Set Context

**File:** `src/planning/schedule/UnifiedSchedule.tsx` (modification)

```typescript
import { usePlanningContext } from '../context';

// Inside component
const { selectProject, selectedProjectId } = usePlanningContext();

// When project filter changes
const handleProjectChange = (projectId: string) => {
  setFilters(prev => ({ ...prev, projectId }));
  selectProject(projectId); // Update global context
};
```

### Deliverables

**Files Created:**
- `src/planning/context/PlanningContext.tsx` (~150 LOC)
- `src/planning/context/index.ts` (~10 LOC)

**Files Modified:**
- `src/nav/PlanningNavigator.tsx`
- `src/planning/schedule/UnifiedSchedule.tsx`

---

## Task 4.2: Dashboard Database Integration

**Priority:** High
**Complexity:** High

### Objective

Replace mock data in dashboard widget hooks with real WatermelonDB queries filtered by selected project.

### Implementation

#### 4.2.1 Update useUpcomingMilestonesData

**File:** `src/planning/dashboard/hooks/useWidgetData.ts`

```typescript
import { usePlanningContext } from '../../context';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';

export function useUpcomingMilestonesData(): UseMilestonesResult {
  const { selectedProjectId, sites } = usePlanningContext();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get site IDs for selected project
      const siteIds = sites.map(s => s.id);

      if (siteIds.length === 0) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // Query items marked as milestones
      const itemsCollection = database.collections.get('items');
      const milestoneItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_milestone', true),
          Q.sortBy('planned_end_date', Q.asc),
          Q.take(5)
        )
        .fetch();

      // Transform to Milestone type
      const transformedMilestones: Milestone[] = milestoneItems.map(item => ({
        id: item.id,
        name: item.name,
        dueDate: new Date(item.plannedEndDate),
        status: item.status,
        daysRemaining: Math.ceil((item.plannedEndDate - Date.now()) / 86400000),
      }));

      setMilestones(transformedMilestones);
    } catch (err) {
      setError('Failed to load milestones');
      console.error('Error loading milestones:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { milestones, loading, error, refresh: fetchData };
}
```

#### 4.2.2 Update useCriticalPathData

```typescript
export function useCriticalPathData(): UseCriticalPathResult {
  const { selectedProjectId, sites } = usePlanningContext();
  const [items, setItems] = useState<CriticalPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map(s => s.id);

      if (siteIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Query critical path items
      const itemsCollection = database.collections.get('items');
      const criticalItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_critical_path', true),
          Q.sortBy('planned_end_date', Q.asc)
        )
        .fetch();

      // Transform to CriticalPathItem type
      const transformedItems: CriticalPathItem[] = criticalItems.map(item => {
        const daysUntilDue = Math.ceil((item.plannedEndDate - Date.now()) / 86400000);
        const isDelayed = item.status === 'delayed' || daysUntilDue < 0;

        return {
          id: item.id,
          name: item.name,
          riskLevel: isDelayed ? 'high' : daysUntilDue < 7 ? 'medium' : 'low',
          delayImpact: isDelayed ? Math.abs(daysUntilDue) : 0,
          progress: item.progress || 0,
          dueDate: new Date(item.plannedEndDate),
        };
      });

      setItems(transformedItems);
    } catch (err) {
      setError('Failed to load critical path data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refresh: fetchData };
}
```

#### 4.2.3 Update useScheduleOverviewData

```typescript
export function useScheduleOverviewData(): UseScheduleOverviewResult {
  const { selectedProjectId, selectedProject, sites } = usePlanningContext();
  const [overview, setOverview] = useState<ScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map(s => s.id);

      if (siteIds.length === 0) {
        setOverview(null);
        setLoading(false);
        return;
      }

      // Query all items for the project
      const itemsCollection = database.collections.get('items');
      const allItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Calculate metrics
      const totalItems = allItems.length;
      const completedItems = allItems.filter(i => i.status === 'completed').length;
      const delayedItems = allItems.filter(i => i.status === 'delayed').length;
      const onTrackItems = totalItems - completedItems - delayedItems;
      const overallProgress = totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;

      // Get project dates
      const projectStartDate = selectedProject?.startDate
        ? new Date(selectedProject.startDate)
        : new Date();
      const projectEndDate = selectedProject?.endDate
        ? new Date(selectedProject.endDate)
        : new Date(Date.now() + 180 * 86400000);
      const daysRemaining = Math.ceil((projectEndDate.getTime() - Date.now()) / 86400000);

      setOverview({
        totalItems,
        completedItems,
        onTrackItems,
        delayedItems,
        overallProgress,
        projectStartDate,
        projectEndDate,
        daysRemaining,
      });
    } catch (err) {
      setError('Failed to load schedule overview');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedProject, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, loading, error, refresh: fetchData };
}
```

#### 4.2.4 Update Remaining Hooks

Apply similar patterns to:
- `useRecentActivitiesData` - Query progress_logs table
- `useResourceUtilizationData` - Query items with resource data
- `useWBSProgressData` - Query items grouped by category/phase

### Deliverables

**Files Modified:**
- `src/planning/dashboard/hooks/useWidgetData.ts` (complete rewrite ~400 LOC)
- `src/planning/dashboard/PlanningDashboard.tsx` (add context consumption)

---

## Task 4.3: Navigation Performance

**Priority:** Medium
**Complexity:** Low-Medium

### Objective

Improve drawer animation smoothness and logout transition.

### Implementation

#### 4.3.1 Optimize Drawer Configuration

**File:** `src/nav/PlanningNavigator.tsx`

```typescript
// Optimize drawer configuration
<Drawer.Navigator
  screenOptions={{
    // Reduce drawer animation duration
    swipeEdgeWidth: 50,
    drawerType: 'front', // Use 'front' instead of 'slide' for better performance
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    // Lazy load drawer content
    lazy: true,
    // Disable gesture when drawer is closed for better scroll performance
    swipeEnabled: true,
  }}
  drawerContent={(props) => (
    <DrawerContentScrollView {...props}>
      {/* Memoized drawer content */}
      <MemoizedDrawerContent {...props} />
    </DrawerContentScrollView>
  )}
>
```

#### 4.3.2 Memoize Drawer Content

```typescript
import React, { memo, useCallback } from 'react';

const DrawerContent = memo(({ navigation, state }) => {
  const handleNavigation = useCallback((routeName: string) => {
    navigation.navigate(routeName);
    navigation.closeDrawer();
  }, [navigation]);

  return (
    <View>
      <DrawerItem
        label="Sites"
        icon={({ color, size }) => <Icon name="map-marker" color={color} size={size} />}
        onPress={() => handleNavigation('Sites')}
      />
      {/* Other items */}
    </View>
  );
});

const MemoizedDrawerContent = memo(DrawerContent);
```

#### 4.3.3 Optimize Logout

```typescript
const handleLogout = useCallback(async () => {
  // Show loading indicator immediately
  setLoggingOut(true);

  // Use InteractionManager to defer logout until animations complete
  InteractionManager.runAfterInteractions(async () => {
    try {
      // Clear any cached data
      await AsyncStorage.multiRemove(['userToken', 'selectedProject']);

      // Navigate to auth
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  });
}, [navigation]);
```

### Deliverables

**Files Modified:**
- `src/nav/PlanningNavigator.tsx` - Drawer optimizations
- Drawer content memoization

---

## Task 4.4: WBS Site Selection Fix

**Priority:** Medium
**Complexity:** Low

### Objective

Fix the site selection functionality in WBSManagementScreen.

### Implementation

#### 4.4.1 Investigate Current Issue

The WBS screen should allow site selection from a dropdown. Check if:
1. Site dropdown is visible
2. Sites are being loaded correctly
3. Selection updates the filter

#### 4.4.2 Connect to PlanningContext

**File:** `src/planning/WBSManagementScreen.tsx`

```typescript
import { usePlanningContext } from './context';

const WBSManagementScreen = () => {
  const {
    selectedProjectId,
    sites,
    selectedSiteId,
    selectSite
  } = usePlanningContext();

  // Use context sites instead of local state
  const projectSites = sites;

  // Update site selection
  const handleSiteChange = (siteId: string) => {
    selectSite(siteId);
    // Filter WBS items by selected site
    dispatch({ type: 'SET_FILTER', payload: { siteId } });
  };

  return (
    // Render site dropdown with projectSites
  );
};
```

### Deliverables

**Files Modified:**
- `src/planning/WBSManagementScreen.tsx` - Connect to context, fix site selection

---

## Implementation Timeline

### Task Breakdown

| Task | Complexity | Estimated Hours | Dependencies |
|------|------------|-----------------|--------------|
| 4.1 Planning Context | Medium | 4-6h | None |
| 4.2 Dashboard DB Integration | High | 8-12h | Task 4.1 |
| 4.3 Navigation Performance | Low-Medium | 2-4h | None |
| 4.4 WBS Site Selection | Low | 1-2h | Task 4.1 |
| Testing & Bug Fixes | Medium | 3-4h | All tasks |
| **Total** | | **18-28h** | |

### Recommended Order

1. **Task 4.1** - PlanningContext (foundation for other tasks)
2. **Task 4.3** - Navigation Performance (independent, quick win)
3. **Task 4.4** - WBS Site Selection (uses context from 4.1)
4. **Task 4.2** - Dashboard DB Integration (largest task, requires context)
5. **Testing** - End-to-end testing of all features

---

## Testing Strategy

### Manual Testing Checklist

#### Context Testing
- [ ] Project selector shows all projects
- [ ] Selecting a project loads its sites
- [ ] Site selector shows only sites for selected project
- [ ] Selection persists when navigating between screens
- [ ] Dashboard reflects selected project data

#### Dashboard Testing
- [ ] Milestones widget shows real milestone items
- [ ] Critical Path widget shows critical items from database
- [ ] Schedule Overview shows correct counts
- [ ] Recent Activities shows actual progress logs
- [ ] Resource Utilization reflects real data
- [ ] WBS Progress shows actual phase completion
- [ ] Changing project updates all widgets

#### Navigation Testing
- [ ] Drawer opens smoothly (no lag)
- [ ] Drawer closes smoothly
- [ ] Logout transition is smooth
- [ ] No visual jank during navigation

#### WBS Testing
- [ ] Site dropdown is visible
- [ ] Sites load for selected project
- [ ] Selecting site filters WBS items
- [ ] Can create items for selected site

### Performance Testing

| Metric | Target | Measurement |
|--------|--------|-------------|
| Drawer open time | <300ms | Stopwatch/profiler |
| Widget load time | <500ms each | Performance monitor |
| Project switch time | <1s | User perception |
| Context propagation | Immediate | Visual inspection |

---

## Quality Checklist

### Code Quality
- [ ] TypeScript errors: 0
- [ ] ESLint warnings: 0
- [ ] All hooks have proper dependencies
- [ ] Memoization applied where needed
- [ ] Error handling in all async operations

### Architecture
- [ ] Context follows React patterns
- [ ] Database queries are efficient (indexed fields used)
- [ ] No memory leaks (subscriptions cleaned up)
- [ ] Loading and error states handled

### User Experience
- [ ] Loading indicators shown during data fetch
- [ ] Error messages are user-friendly
- [ ] Empty states shown when no data
- [ ] Smooth animations and transitions

### Documentation
- [ ] Context API documented
- [ ] Hook usage examples provided
- [ ] PROGRESS_TRACKING.md updated

---

## Risk Assessment

### Technical Risks

1. **Database Query Performance**
   - **Risk:** Large datasets may slow queries
   - **Mitigation:** Add proper indexes, limit query results, use pagination

2. **Context Re-renders**
   - **Risk:** Context changes causing excessive re-renders
   - **Mitigation:** Split context if needed, use useMemo/useCallback

3. **Backward Compatibility**
   - **Risk:** Screens depending on local state may break
   - **Mitigation:** Gradual migration, keep local state as fallback

### Dependencies

- No new npm packages required
- Uses existing WatermelonDB infrastructure
- Follows patterns from Supervisor SiteContext

---

## References

- **Phase 3 Implementation:** `docs/implementation/PLANNING_PHASE3_IMPLEMENTATION_PLAN.md`
- **Supervisor SiteContext:** `src/supervisor/context/SiteContext.tsx` (pattern reference)
- **WatermelonDB Docs:** https://watermelondb.dev/docs
- **React Context:** https://react.dev/learn/passing-data-deeply-with-context

---

**End of Planning Phase 4 Implementation Plan**

*Ready for implementation. This plan addresses issues identified during Phase 3 testing and follows established patterns from other roles.*
