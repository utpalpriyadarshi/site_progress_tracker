# Planning Module Refactor - Quick Wins

**Branch**: `refactor/planning-quick-wins`
**Date**: February 9, 2026
**Estimated Time**: 1.5-2 hours
**Impact**: Performance improvements, code quality, maintainability

---

## Objective

Implement high-impact, low-effort improvements to the Planning module based on comprehensive code review findings.

---

## Quick Wins Implementation Plan

### 1. Remove console.log from useKDTimelineProgressData ✓
**File**: `src/planning/dashboard/hooks/useWidgetData.ts`
**Lines**: 919, 920, 949, 953, 956, 960, 968, 970, 1025, 1026, 1028-1034, 1036-1038, 1048, 1081, 1089-1091
**Time**: 15 minutes
**Impact**: Performance improvement, cleaner production code

**Tasks**:
- [ ] Remove all console.log statements from useKDTimelineProgressData hook
- [ ] Remove console.warn statements used for debugging
- [ ] Keep only critical error logging (console.error for actual errors)
- [ ] Test that widget still loads correctly

---

### 2. Create phaseConstants.ts Utility ✓
**New File**: `src/planning/utils/phaseConstants.ts`
**Time**: 30 minutes
**Impact**: Single source of truth, eliminates duplication

**Tasks**:
- [ ] Create `src/planning/utils/` directory
- [ ] Create `phaseConstants.ts` with:
  - `PHASE_ORDER` array
  - `PHASE_LABELS` object
  - `PHASE_COLORS` object (if needed)
- [ ] Update files using duplicated phase configs:
  - `src/planning/dashboard/hooks/useWidgetData.ts` (lines 425-438, 550-568)
  - Any other files with phase definitions
- [ ] Test all widgets using phase data

---

### 3. Extract calculateSiteProgressFromItems to Shared Utility ✓
**New File**: `src/planning/utils/progressCalculations.ts`
**Time**: 20 minutes
**Impact**: Eliminates duplication, easier to test and maintain

**Duplicated in**:
- `src/planning/dashboard/hooks/useWidgetData.ts` (line 649)
- `src/planning/key-dates/components/KeyDateCard.tsx` (line ~52)
- `src/planning/key-dates/components/KeyDateSiteManager.tsx` (line ~100+)

**Tasks**:
- [ ] Create `progressCalculations.ts` utility
- [ ] Export `calculateSiteProgressFromItems` function
- [ ] Add JSDoc comments
- [ ] Update all 3 files to import from utility
- [ ] Remove duplicated implementations
- [ ] Test Key Dates and Dashboard widgets

---

### 4. Memoize Sort in CriticalPathWidget ✓
**File**: `src/planning/dashboard/widgets/CriticalPathWidget.tsx`
**Lines**: 75-78
**Time**: 5 minutes
**Impact**: Prevents unnecessary re-sorting on every render

**Tasks**:
- [ ] Wrap sort logic in useMemo
- [ ] Add items array as dependency
- [ ] Extract RISK_ORDER constant to top of file
- [ ] Test widget still displays correctly

---

### 5. Fix TODO in useEditProgress.ts ✓
**File**: `src/planning/milestones/hooks/useEditProgress.ts`
**Line**: 100
**Time**: 10 minutes
**Impact**: Uses proper auth context instead of hardcoded value

**Tasks**:
- [ ] Import useAuth hook
- [ ] Replace hardcoded 'planner' with user.userId or user.username
- [ ] Test progress updates still work
- [ ] Verify updatedBy field is properly set

---

### 6. Add ErrorBoundary to PlanningDashboard ✓
**File**: `src/planning/dashboard/PlanningDashboard.tsx`
**Lines**: Bottom of file
**Time**: 10 minutes
**Impact**: Better error handling, prevents dashboard crashes

**Tasks**:
- [ ] Wrap PlanningDashboardScreen in ErrorBoundary (already imported)
- [ ] Follow pattern from other screens (GanttChartScreen has good example)
- [ ] Test error boundary catches errors correctly
- [ ] Ensure user sees friendly error message

---

## Testing Checklist

After each change:
- [ ] TypeScript compiles without errors
- [ ] No new ESLint warnings
- [ ] Affected screens/widgets load correctly
- [ ] No console errors in app
- [ ] Data displays correctly

**Full Integration Test**:
- [ ] Dashboard loads all 9 widgets
- [ ] Key Dates screen shows progress correctly
- [ ] Critical Path widget displays and sorts properly
- [ ] Milestone progress updates save correctly
- [ ] Error handling works (simulate error to test)

---

## Quality Checks

Before committing:
- [ ] All console.log removed except intentional logging
- [ ] No code duplication in changed files
- [ ] TypeScript types are correct
- [ ] JSDoc comments added where appropriate
- [ ] Imports are organized (React, RN, 3rd party, local)
- [ ] No unused imports or variables

---

## Git Workflow

1. **Branch created**: `refactor/planning-quick-wins`
2. **Commits**: One commit per quick win (6 total)
3. **Commit message format**:
   ```
   refactor(planning): [Quick Win Name]

   - Bullet point of changes
   - Testing performed

   Impact: [Performance/Code Quality/Maintainability]
   ```

4. **PR Title**: `refactor(planning): Implement quick wins - performance and code quality improvements`
5. **PR Description**: Include this plan + summary of changes
6. **Merge**: Squash and merge to main

---

## Success Metrics

- ✅ 0 console.log statements in production code (except errors)
- ✅ 0 duplicate phase configurations
- ✅ 1 shared progress calculation utility (used in 3 places)
- ✅ Improved render performance (memoization)
- ✅ 1 TODO resolved
- ✅ 1 ErrorBoundary added for better reliability

---

## Next Steps (Future PRs)

After quick wins are merged:
1. Split useWidgetData.ts into 9 separate files (2-3 hours)
2. Batch loading for KD progress calculations (2 hours)
3. Consolidate form state with useReducer (1 hour)
4. Progressive widget loading (3 hours)

---

## Notes

- All changes are backward compatible
- No API changes or breaking changes
- Focus on code quality and performance
- Low risk, high reward improvements
