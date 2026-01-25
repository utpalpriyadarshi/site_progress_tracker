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
**Status:** Pending

| Task | File | Line | Effort |
|------|------|------|--------|
| Fix console.error → logger | PlanningContext.tsx | 201 | 5 min |
| Fix missing useEffect dependency | PlanningContext.tsx | 206 | 10 min |
| Fix silent JSON parsing failure | DependencyModal.tsx | 54-60 | 10 min |
| Fix missing null check for dates | DependencyModal.tsx | 145-158 | 10 min |

**Deliverables:**
- [ ] All error logging uses logger service
- [ ] useEffect dependencies are complete
- [ ] JSON parsing errors are logged
- [ ] Date null checks prevent runtime errors

---

### Phase 2: SiteManagementScreen Refactoring (2-3 hours)
**Status:** Pending
**Depends on:** Phase 1

**Current State:**
- 19+ separate useState calls (lines 32-80)
- Only screen NOT refactored to useReducer pattern

**Target State:**
- Single useReducer with structured state
- Consistent with ItemCreationScreen, MilestoneTrackingScreen patterns

**Tasks:**
- [ ] Create `src/planning/state/siteManagementReducer.ts`
- [ ] Define state interface (ui, form, dialog states)
- [ ] Define action types (discriminated unions)
- [ ] Refactor SiteManagementScreen to use reducer
- [ ] Test all CRUD operations

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
**Status:** Pending
**Depends on:** Phase 2

**Problem:**
~500+ lines of duplicated code between:
- `src/planning/item-creation/components/`
- `src/planning/item-edit/components/`

**Duplicated Components:**
1. CategorySection.tsx
2. PhaseSection.tsx
3. ScheduleSection.tsx
4. QuantitySection.tsx
5. RiskSection.tsx
6. CriticalPathSection.tsx
7. ItemDetailsSection.tsx

**Tasks:**
- [ ] Create `src/planning/shared/components/ItemFormSections/`
- [ ] Extract CategorySection with variant prop
- [ ] Extract PhaseSection with variant prop
- [ ] Extract ScheduleSection with variant prop
- [ ] Extract QuantitySection with variant prop
- [ ] Extract RiskSection with variant prop
- [ ] Extract CriticalPathSection with variant prop
- [ ] Update ItemCreationScreen to use shared components
- [ ] Update ItemEditScreen to use shared components
- [ ] Delete duplicate files from item-creation/components and item-edit/components

**Component Interface:**
```typescript
interface SharedSectionProps {
  variant: 'create' | 'edit';
  // ... existing props
}
```

---

### Phase 4: TypeScript Improvements (2-3 hours)
**Status:** Pending
**Depends on:** Phase 3

**Problem:**
8+ occurrences of `as any` casts compromising type safety

**Files to fix:**
| File | Line | Issue |
|------|------|-------|
| PlanningContext.tsx | 127 | `(userRecord as any).projectId` |
| PlanningContext.tsx | 132 | `(project as any).name` |
| MilestoneTrackingScreen.tsx | 352 | `enhance(...) as any` |
| SiteManagementScreen.tsx | 561 | `enhance(...) as any` |
| UnifiedSchedule.tsx | ~340 | `enhance(...) as any` |
| ScheduleManagementScreen.tsx | ~280 | `enhance(...) as any` |
| ItemDetailsSection.tsx | various | `value={phase as any}` |

**Tasks:**
- [ ] Create proper interfaces for WatermelonDB models
- [ ] Create typed HOC wrapper for withObservables
- [ ] Replace `as any` with proper type assertions
- [ ] Add type guards where needed

**Example Fix:**
```typescript
// Before:
const projectId = (userRecord as any).projectId;

// After:
interface UserRecordWithProject extends UserModel {
  projectId: string;
}
const userRecord = await database.collections
  .get('users')
  .find(user.userId) as UserRecordWithProject;
const projectId = userRecord.projectId;
```

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
| Phase 1 | Pending | - | - |
| Phase 2 | Pending | - | - |
| Phase 3 | Pending | - | - |
| Phase 4 | Pending | - | - |
| Phase 5 | Planning | - | - |
| Phase 6 | Pending | - | - |

---

## Testing Checklist

### Phase 1 Testing
- [ ] Error scenarios trigger logger (not console.error)
- [ ] PlanningContext loads state correctly on user change
- [ ] DependencyModal shows warning on corrupted JSON
- [ ] Date displays handle null values gracefully

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
- [ ] No TypeScript errors
- [ ] Runtime behavior unchanged
- [ ] Type inference works in IDE

---

## Notes

- Each phase should be a separate branch and PR
- Follow existing commit message convention: `fix(planner):` or `refactor(planner):`
- Run TypeScript checks before committing
- Test on both Android and iOS if possible
