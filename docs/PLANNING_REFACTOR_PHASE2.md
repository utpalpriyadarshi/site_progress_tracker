# Planning Module Refactor - Phase 2: Architectural Improvements

**Status**: 📋 Planning
**Branch**: TBD (will create when starting)
**Estimated Time**: 8-10 hours total
**Priority**: High Impact Improvements

---

## 📋 Overview

Phase 2 focuses on major architectural improvements identified in the comprehensive code review. These changes require more time but deliver significant performance and maintainability benefits.

**Phase 1 (Quick Wins)**: ✅ **COMPLETED**
- Removed debug logs
- Created shared utilities
- Eliminated code duplication
- Added memoization
- Fixed TODOs

**Phase 2 (Architectural)**: 📋 **PLANNED** (This Document)

---

## 🎯 Objectives

1. **Improve Code Organization**: Break monolithic files into manageable pieces
2. **Optimize Performance**: Reduce database queries by 90%+
3. **Enhance Maintainability**: Better separation of concerns
4. **Improve Developer Experience**: Easier to locate and modify code

---

## 📊 Improvements Roadmap

### Priority 1: Critical (Performance Impact)
1. ✅ Quick Wins (Completed - Phase 1)
2. 🔲 Split useWidgetData.ts into 9 separate files
3. 🔲 Implement batch loading for KD progress calculations

### Priority 2: High (Code Quality)
4. 🔲 Consolidate form state with useReducer
5. 🔲 Add progressive widget loading

### Priority 3: Medium (Future Enhancements)
6. 🔲 Standardize widget patterns
7. 🔲 Add comprehensive error boundaries
8. 🔲 Implement query result caching

---

## 🔧 Improvement #1: Split useWidgetData.ts

**Status**: ✅ Completed
**Priority**: P1 - Critical
**Time Taken**: ~1 hour
**Branch**: `refactor/planning-split-widget-hooks`
**Commit**: `92e3a6f`

### Problem
- **Current**: Single 1,025-line file with 9 different hooks
- **Impact**: Hard to test, maintain, and navigate
- **Risk**: High - changes affect multiple hooks unintentionally

### Solution
Split into 9 separate hook files, one per widget data hook.

### Implementation Plan

#### Files to Create
```
src/planning/dashboard/hooks/
├── index.ts (barrel export)
├── useUpcomingMilestonesData.ts
├── useCriticalPathData.ts
├── useScheduleOverviewData.ts
├── useRecentActivitiesData.ts
├── useResourceUtilizationData.ts
├── useWBSProgressData.ts
├── useProjectProgressData.ts
├── useKDProgressChartData.ts
└── useKDTimelineProgressData.ts
```

#### Task Breakdown
- [ ] Create directory structure
- [ ] Extract useUpcomingMilestonesData (lines 27-101) → new file
- [ ] Extract useCriticalPathData (lines 103-186) → new file
- [ ] Extract useScheduleOverviewData (lines 188-282) → new file
- [ ] Extract useRecentActivitiesData (lines 284-368) → new file
- [ ] Extract useResourceUtilizationData (lines 370-493) → new file
- [ ] Extract useWBSProgressData (lines 495-623) → new file
- [ ] Extract useProjectProgressData (lines 625-754) → new file
- [ ] Extract useKDProgressChartData (lines 756-855) → new file
- [ ] Extract useKDTimelineProgressData (lines 857-1025) → new file
- [ ] Update index.ts with barrel exports
- [ ] Update PlanningDashboard.tsx imports
- [ ] Run TypeScript checks
- [ ] Test all 9 widgets load correctly
- [ ] Commit and create PR

#### Success Criteria
- ✅ Each hook in its own file (~100-200 lines each)
- ✅ All exports working through index.ts
- ✅ No breaking changes to PlanningDashboard
- ✅ TypeScript compiles without new errors
- ✅ All widgets load and display correctly

#### Risks & Mitigation
- **Risk**: Shared imports might cause circular dependencies
- **Mitigation**: Use shared utilities, avoid cross-hook imports
- **Risk**: TypeScript import paths might break
- **Mitigation**: Use barrel export pattern, test thoroughly

---

## 🔧 Improvement #2: Batch Loading for KD Progress

**Status**: 🔲 Not Started
**Priority**: P1 - Critical
**Estimated Time**: 2 hours
**Branch**: `refactor/planning-batch-loading`

### Problem
- **Current**: Nested loops fetching items for each KD → each site
- **Impact**: 10 KDs × 3 sites × 50 items = 1,500+ database queries per dashboard load
- **Performance**: Dashboard takes 2-5 seconds to load

### Solution
Batch load all items once, then group in-memory by site.

### Implementation Plan

#### Current Flow (Inefficient)
```typescript
for (const kd of keyDates) {
  for (const site of kdSites) {
    const items = await itemsCollection.query(...).fetch(); // N queries!
    const progress = calculateProgress(items);
  }
}
```

#### New Flow (Efficient)
```typescript
// 1. Get all site IDs upfront
const allSiteIds = [...new Set(kdSites.map(s => s.siteId))];

// 2. Batch load ALL items once
const allItems = await itemsCollection
  .query(Q.where('site_id', Q.oneOf(allSiteIds)))
  .fetch();

// 3. Group items by site in-memory
const itemsBySite = groupBy(allItems, 'siteId');

// 4. Calculate progress using grouped data
for (const kd of keyDates) {
  for (const site of kdSites) {
    const siteItems = itemsBySite[site.siteId] || [];
    const progress = calculateProgress(siteItems);
  }
}
```

#### Task Breakdown
- [ ] Create `src/planning/utils/dataLoading.ts` utility
- [ ] Implement `batchLoadItemsBySites` function
- [ ] Implement `groupBy` helper
- [ ] Update useProjectProgressData to use batch loading
- [ ] Update useKDProgressChartData to use batch loading
- [ ] Update useKDTimelineProgressData to use batch loading
- [ ] Measure performance improvement (before/after)
- [ ] Run load tests (10, 20, 50 KDs)
- [ ] Commit and create PR

#### Success Criteria
- ✅ Reduce queries from 1,500+ to ~10-20 per dashboard load
- ✅ Dashboard loads in <1 second (vs 2-5 seconds)
- ✅ Correct data displayed (no calculation errors)
- ✅ Memory usage acceptable (<100MB additional)
- ✅ Works with 1-100+ KDs

#### Performance Target
- **Current**: 2-5 seconds dashboard load, 1,500+ queries
- **Target**: <1 second dashboard load, <20 queries
- **Improvement**: 10-100x faster, 90%+ fewer queries

---

## 🔧 Improvement #3: Consolidate Form State with useReducer

**Status**: 🔲 Not Started
**Priority**: P2 - High
**Estimated Time**: 1 hour
**Branch**: `refactor/planning-form-state`

### Problem
- **Current**: 16 separate useState calls in useEditProgress.ts
- **Impact**: Hard to manage, easy to miss cleanup, verbose code
- **Lines**: 28-43 (16 useState declarations)

### Solution
Consolidate into a single form state object managed by useReducer.

### Implementation Plan

#### Current Code (16 useState)
```typescript
const [progressPercentage, setProgressPercentage] = useState('0');
const [status, setStatus] = useState(MILESTONE_STATUS.NOT_STARTED);
const [notes, setNotes] = useState('');
const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>();
// ... 12 more useState calls
```

#### New Code (useReducer)
```typescript
const [formState, dispatch] = useReducer(formReducer, initialFormState);

// Actions
dispatch({ type: 'SET_PROGRESS', payload: '50' });
dispatch({ type: 'SET_STATUS', payload: MILESTONE_STATUS.IN_PROGRESS });
dispatch({ type: 'RESET_FORM' });
```

#### Task Breakdown
- [ ] Define FormState interface
- [ ] Define FormAction types
- [ ] Implement formReducer
- [ ] Replace useState calls with useReducer
- [ ] Update all setter calls to dispatch
- [ ] Update component props to use formState
- [ ] Test form interactions (open, edit, save, cancel)
- [ ] Verify reset functionality works
- [ ] Commit and create PR

#### Success Criteria
- ✅ Single useReducer replaces 16 useState
- ✅ Form opens/closes correctly
- ✅ All fields update properly
- ✅ Reset clears all fields
- ✅ Save persists changes
- ✅ No functional regressions

---

## 🔧 Improvement #4: Progressive Widget Loading

**Status**: 🔲 Not Started
**Priority**: P2 - High
**Estimated Time**: 3 hours
**Branch**: `refactor/planning-progressive-loading`

### Problem
- **Current**: All 9 widgets load simultaneously on mount
- **Impact**: UI freezes during initial load, poor perceived performance
- **User Experience**: Blank screen for 2-5 seconds

### Solution
Load critical widgets first, then load others progressively.

### Implementation Plan

#### Loading Strategy
```
Priority 1 (Critical - Load First):
- ScheduleOverviewWidget
- ProjectProgressWidget

Priority 2 (High - Load After 500ms):
- KeyDateProgressChartWidget
- KDTimelineProgressWidget
- UpcomingMilestonesWidget

Priority 3 (Normal - Load After 1000ms):
- CriticalPathWidget
- WBSProgressWidget
- ResourceUtilizationWidget
- RecentActivitiesWidget
```

#### Implementation Approach
```typescript
const [loadPriority2, setLoadPriority2] = useState(false);
const [loadPriority3, setLoadPriority3] = useState(false);

useEffect(() => {
  const timer1 = setTimeout(() => setLoadPriority2(true), 500);
  const timer2 = setTimeout(() => setLoadPriority3(true), 1000);
  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
  };
}, []);
```

#### Task Breakdown
- [ ] Define widget priority groups
- [ ] Add loading state management
- [ ] Implement staggered loading with timeouts
- [ ] Add loading skeletons for delayed widgets
- [ ] Update widget rendering logic
- [ ] Test loading sequence
- [ ] Measure perceived performance improvement
- [ ] Commit and create PR

#### Success Criteria
- ✅ Critical widgets visible within 500ms
- ✅ All widgets loaded within 2 seconds
- ✅ Smooth progressive rendering (no jank)
- ✅ Loading skeletons show for delayed widgets
- ✅ User can interact with loaded widgets immediately

#### Performance Target
- **Current**: 2-5 second blank screen
- **Target**: <500ms to first widget, <2s to all widgets
- **Improvement**: 4-10x better perceived performance

---

## 📅 Implementation Schedule

### Recommended Order
1. **Week 1**: Split useWidgetData.ts (Improvement #1)
   - Day 1-2: Extract hooks
   - Day 3: Testing and PR

2. **Week 2**: Batch Loading (Improvement #2)
   - Day 1: Implement batch loading utility
   - Day 2: Update hooks, test performance
   - Day 3: PR and merge

3. **Week 3**: Form State + Progressive Loading (Improvements #3-4)
   - Day 1: Consolidate form state
   - Day 2-3: Progressive loading
   - Day 4: Testing and PR

### Alternative: All at Once
- Create single large branch with all improvements
- Estimated time: 8-10 hours continuous work
- Risk: Larger PR, harder to review
- Benefit: All improvements delivered together

---

## 🎯 Success Metrics

### Code Quality
- ✅ useWidgetData.ts split into 9 files (~100-200 lines each)
- ✅ Single form state reducer (vs 16 useState)
- ✅ Proper separation of concerns
- ✅ Improved testability

### Performance
- ✅ Dashboard load time: 2-5s → <1s (5-10x faster)
- ✅ Database queries: 1,500+ → <20 (99% reduction)
- ✅ Time to first widget: 2-5s → <500ms (4-10x faster)
- ✅ Memory usage: Acceptable (<100MB increase)

### Developer Experience
- ✅ Easier to locate specific hook logic
- ✅ Faster development iteration
- ✅ Better code navigation
- ✅ Improved maintainability

### User Experience
- ✅ Faster dashboard loads
- ✅ No UI freezing
- ✅ Progressive content display
- ✅ Better perceived performance

---

## 🚧 Risks & Dependencies

### Technical Risks
1. **Import Path Changes**: Splitting files might break imports
   - **Mitigation**: Use barrel exports, test thoroughly

2. **Circular Dependencies**: Shared utilities might cause cycles
   - **Mitigation**: Clear dependency hierarchy, no cross-hook imports

3. **Performance Regression**: Batch loading might increase memory
   - **Mitigation**: Load tests, memory profiling, optimize grouping

4. **Race Conditions**: Progressive loading might cause timing issues
   - **Mitigation**: Proper loading state management, test edge cases

### Dependencies
- Phase 1 (Quick Wins): ✅ **COMPLETED** (Required)
- No external library changes needed
- No breaking API changes
- Compatible with current WatermelonDB version

---

## 📋 Checklist Template (Per Improvement)

Use this checklist for each improvement:

### Planning Phase
- [ ] Review implementation plan
- [ ] Identify potential issues
- [ ] Create new branch
- [ ] Update this document with progress

### Implementation Phase
- [ ] Write code following plan
- [ ] Add comments and documentation
- [ ] Follow existing patterns
- [ ] Keep commits focused and clear

### Quality Assurance
- [ ] TypeScript compiles (no new errors)
- [ ] ESLint passes
- [ ] Manual testing complete
- [ ] Performance measured (if applicable)
- [ ] No console errors

### Git Workflow
- [ ] All changes committed
- [ ] Quality check report created
- [ ] Push to remote
- [ ] Create PR with detailed description
- [ ] Review and merge
- [ ] Update this document with ✅

---

## 📊 Progress Tracking

### Phase 2 Overall Progress: 25% Complete (1/4)

| Improvement | Status | Branch | PR | Merged |
|-------------|--------|--------|----|----|
| 1. Split useWidgetData.ts | ✅ Completed | refactor/planning-split-widget-hooks | TBD | - |
| 2. Batch Loading | 🔲 Not Started | - | - | - |
| 3. Form State Consolidation | 🔲 Not Started | - | - | - |
| 4. Progressive Loading | 🔲 Not Started | - | - | - |

**Legend:**
- 🔲 Not Started
- 🟡 In Progress
- ✅ Completed

---

## 🔄 Next Steps

1. **Review this document** - Understand the plan
2. **Choose starting point** - Which improvement to tackle first?
3. **Create branch** - Follow naming convention
4. **Follow checklist** - Use checklist for each improvement
5. **Track progress** - Update this document as you go

---

## 📝 Notes

- All improvements are **backward compatible**
- No breaking changes to public APIs
- Can be implemented **independently** (any order)
- Each improvement has its own **branch and PR**
- Follow same quality standards as Phase 1

---

**Document Created**: February 9, 2026
**Last Updated**: February 9, 2026 (Improvement #1 Completed)
**Next Review**: After each improvement completion

---

## 🎯 Ready to Start?

Choose an improvement and let's create the branch!

**Recommended**: Start with #1 (Split useWidgetData.ts) as it provides foundation for others.
