# Planner Module Code Improvements

## Document Info
- **Created:** 25-01-2026
- **Based on:** Comprehensive code review of src/planning/ (124 files)
- **Related:** Prompt2_25_01_2026.md (Point 12 - code review)

---

## Executive Summary

The planner module demonstrates strong architectural patterns with useReducer state management (75-94% reduction achieved in most screens), comprehensive accessibility, and good error boundaries. However, several improvements are needed for consistency, type safety, and code deduplication.

**Total estimated effort:** 12-15 hours across all phases

---

## Implementation Phases

### Phase 1: High-Priority Quick Wins (30-45 min)
**Status:** ✅ Completed (PR #74)

| Task | File | Line | Effort | Status |
|------|------|------|--------|--------|
| Fix console.error → logger | PlanningContext.tsx | 153, 169, 201 | 5 min | ✅ Done |
| Fix silent JSON parsing failure | DependencyModal.tsx | 54-60 | 10 min | ✅ Done |
| Fix missing null check for dates | DependencyModal.tsx | 145-158 | 10 min | ✅ Done |

**Deliverables:**
- [x] All error logging uses logger service
- [x] JSON parsing errors are logged with warning
- [x] Date null checks prevent runtime errors (displays "Not set")

---

### Phase 2: SiteManagementScreen Refactoring (2-3 hours)
**Status:** ✅ Completed (PR #75)
**Depends on:** Phase 1

**Current State:**
- ~~19+ separate useState calls (lines 32-80)~~
- ~~Only screen NOT refactored to useReducer pattern~~

**Completed:**
- Single useReducer with structured state (95% reduction: 21 → 1)
- Consistent with ItemCreationScreen, MilestoneTrackingScreen patterns

**Tasks:**
- [x] Create `src/planning/state/siteManagementReducer.ts`
- [x] Define state interface (ui, form, dialog states)
- [x] Define action types (discriminated unions)
- [x] Refactor SiteManagementScreen to use reducer
- [x] Export from state/index.ts barrel file

**State Structure:**
```typescript
interface SiteManagementState {
  ui: {
    dialogVisible: boolean;
    supervisorPickerVisible: boolean;
    deleteDialogVisible: boolean;
    snackbarVisible: boolean;
    snackbarMessage: string;
    snackbarType: 'success' | 'error';
  };
  form: {
    siteName: string;
    siteLocation: string;
    selectedProjectId: string;
    selectedSupervisorId: string | undefined;
    supervisorName: string;
    plannedStartDate: Date | undefined;
    plannedEndDate: Date | undefined;
    actualStartDate: Date | undefined;
    actualEndDate: Date | undefined;
  };
  dialog: {
    editingSite: SiteModel | null;
    siteToDelete: SiteModel | null;
  };
  datePickers: {
    showPlannedStartPicker: boolean;
    showPlannedEndPicker: boolean;
    showActualStartPicker: boolean;
    showActualEndPicker: boolean;
  };
}
```

---

### Phase 3: Shared Item Form Sections (4-5 hours)
**Status:** ✅ Completed (PR #76)
**Depends on:** Phase 2

**Problem:**
~~500+ lines of duplicated code between item-creation and item-edit~~

**Completed:**
Created shared components in `src/planning/shared/components/ItemFormSections/`:
- ScheduleSection.tsx (with optional `isLocked` prop)
- QuantitySection.tsx (with optional `isLocked` and `weightage` props)
- RiskSection.tsx (with optional `isLocked` prop)
- CriticalPathSection.tsx (with optional `isLocked` prop)

**Note:** CategorySection, PhaseSection, ItemDetailsSection were NOT extracted because:
- They have significantly different implementations between create/edit
- Edit version has additional fields (category, phase selectors)
- The benefit of merging didn't outweigh the complexity

**Tasks:**
- [x] Create `src/planning/shared/components/ItemFormSections/`
- [x] Extract ScheduleSection with `isLocked` prop
- [x] Extract QuantitySection with `isLocked` prop
- [x] Extract RiskSection with `isLocked` prop
- [x] Extract CriticalPathSection with `isLocked` prop
- [x] Update barrel exports for backward compatibility
- [x] Delete 8 duplicate files

**Results:**
- Lines removed: 384
- Lines added: 120
- Net reduction: 264 lines

---

### Phase 4: TypeScript Improvements (2-3 hours)
**Status:** ✅ Completed (PR #77)
**Depends on:** Phase 3

**Problem:**
~~8+ occurrences of `as any` casts compromising type safety~~

**Completed:**

| File | Fix Applied |
|------|-------------|
| PlanningContext.tsx | Added `UserModel` import, used `get<UserModel>('users')` to eliminate casts |
| MilestoneTrackingScreen.tsx | Added proper prop interfaces, replaced `as any` with `ComponentType<InputProps>` |
| SiteManagementScreen.tsx | Added proper prop interfaces, replaced `as any` with `ComponentType<InputProps>` |
| UnifiedSchedule.tsx | Added model imports (ProjectModel, SiteModel, CategoryModel), replaced `as any` |
| ScheduleManagementScreen.tsx | Added model imports, replaced `as any` with `ComponentType<unknown>` |
| ItemDetailsSection.tsx | Changed `phase: string` → `phase: ProjectPhase`, removed `as any` cast |
| itemEditReducer.ts | Updated `ItemEditFormData.phase` to use `ProjectPhase` type |

**New Files Created:**
- `src/planning/shared/types/database.ts` - Type utilities for WatermelonDB models

**Tasks:**
- [x] Create proper interfaces for WatermelonDB models
- [x] Create typed HOC wrapper utilities
- [x] Replace `as any` with proper type assertions
- [x] Add type guards where needed

**Results:**
- 7 files modified, 1 new type utilities file
- All `as any` casts in Phase 4 target files eliminated
- Better IDE autocomplete and type inference

---

### Phase 5: Key Dates / Schedule Architecture (8-12 hours)
**Status:** Planning
**Depends on:** Phase 4

**Reference:** KeyDatesCMRL.pdf analysis

**New Data Model:**
```typescript
// Key Date (Contract milestone)
interface KeyDate {
  id: string;
  code: string;           // KD-G-01, KD-A-01, etc.
  category: string;       // G, A, B, C, D, E, F
  description: string;
  targetDays: number;     // Days from commencement
  targetDate: Date;       // Calculated from project start
  actualDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  delayDamages: number;   // INR Lakhs per day
  projectId: string;
}

// Key Date to Site mapping
interface KeyDateSite {
  keyDateId: string;
  siteId: string;
  contribution: number;   // Percentage contribution to KD completion
}

// Work Item (under Key Date)
interface WorkItem {
  id: string;
  keyDateId: string;
  siteId?: string;        // Optional - some items span sites
  type: 'design' | 'procurement' | 'installation' | 'testing' | 'commissioning';
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[]; // Other work item IDs
}
```

**Tasks:**
- [ ] Create KeyDate model in WatermelonDB
- [ ] Create KeyDateSite model for many-to-many relationship
- [ ] Update WorkItem/Item model to reference KeyDate
- [ ] Create KeyDateManagement screen
- [ ] Update Schedule tab to show Key Dates timeline
- [ ] Implement dependency tracking between Key Dates
- [ ] Update Gantt chart to visualize Key Dates

---

### Phase 6: Tab Ordering & Navigation (1-2 hours)
**Status:** Pending
**Depends on:** Phase 5

**Proposed Tab Order:**

**Bottom Tabs:**
1. Dashboard
2. Schedule (Key Dates view)
3. Gantt
4. Resources

**Drawer Items:**
1. Dashboard
2. Key Dates (new)
3. Sites
4. WBS
5. Create Item
6. Milestones
7. Baseline

---

## Progress Tracking

| Phase | Status | PR | Merged |
|-------|--------|-----|--------|
| Phase 1 | ✅ Completed | #74 | ✅ Yes |
| Phase 2 | ✅ Completed | #75 | ✅ Yes |
| Phase 3 | ✅ Completed | #76 | ✅ Yes |
| Phase 4 | ✅ Completed | #77 | Pending |
| Phase 5 | Planning | - | - |
| Phase 6 | Pending | - | - |

---

## Testing Checklist

### Phase 1 Testing
- [x] Error scenarios trigger logger (not console.error)
- [x] PlanningContext loads state correctly on user change
- [x] DependencyModal shows warning on corrupted JSON
- [x] Date displays handle null values gracefully (shows "Not set")

### Phase 2 Testing
- [ ] Add Site works correctly
- [ ] Edit Site works correctly
- [ ] Delete Site works correctly
- [ ] Supervisor assignment works
- [ ] Date pickers work
- [ ] Snackbar displays above dialogs
- [ ] Form validation works

### Phase 3 Testing
- [ ] Item creation flow unchanged
- [ ] Item edit flow unchanged
- [ ] All form sections render correctly
- [ ] Form state management works

### Phase 4 Testing
- [x] No TypeScript errors in modified files
- [ ] Runtime behavior unchanged
- [x] Type inference works in IDE
- [ ] Planning context loads user project correctly
- [ ] withObservables components render without errors

---

## Notes

- Each phase should be a separate branch and PR
- Follow existing commit message convention: `fix(planner):` or `refactor(planner):`
- Run TypeScript checks before committing
- Test on both Android and iOS if possible
