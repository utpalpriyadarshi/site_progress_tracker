# Manager Phase 2 Task 2.1: State Management Refactor Implementation Plan

**Project:** Site Progress Tracker
**Phase:** Phase 2 - Important Improvements
**Task:** 2.1 - Refactor State Management (useReducer)
**Role:** Manager
**Estimated Time:** 18-24 hours
**Created:** 2026-01-02

---

## Table of Contents

1. [Overview](#overview)
2. [Objectives](#objectives)
3. [Current State Analysis](#current-state-analysis)
4. [Architecture Pattern](#architecture-pattern)
5. [Implementation Steps](#implementation-steps)
6. [Code Examples](#code-examples)
7. [Testing Procedures](#testing-procedures)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Quality Checklist](#quality-checklist)
10. [References](#references)

---

## Overview

This document provides a step-by-step implementation guide for converting Manager role screens from multiple `useState` hooks to the `useReducer` pattern, following the established Supervisor role architecture.

### What We're Converting

**From:** 34 independent `useState` hooks scattered across 3 files
**To:** 3 centralized `useReducer` implementations with clean action patterns

### Why This Matters

- **Maintainability:** Centralized state logic is easier to understand and modify
- **Debugging:** State transitions are explicit and trackable
- **Scalability:** Adding new form fields becomes trivial
- **Consistency:** Following established patterns across the codebase

---

## Objectives

### Primary Goals

1. **Reduce State Complexity:** Convert 34 `useState` hooks → 3 `useReducer` hooks (91% reduction)
2. **Maintain Compatibility:** Zero breaking changes to component interfaces
3. **Follow Patterns:** Match Supervisor role architecture exactly
4. **Quality Standards:** Maintain 0 TypeScript errors throughout

### Success Metrics

- ✅ All BOM management useState hooks → 2 useReducer hooks
- ✅ All dashboard useState hooks → 1 useReducer hook
- ✅ All existing functionality works identically
- ✅ TypeScript compiles with 0 errors
- ✅ All manual tests pass

---

## Current State Analysis

### ManagerDashboardScreen State

**Location:** `src/manager/ManagerDashboardScreen.tsx`

**Current Implementation:**
```typescript
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [menuVisible, setMenuVisible] = useState(false);
const [stats, setStats] = useState<ProjectStats>({...});           // 12 fields
const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null); // 6 fields
const [engineeringData, setEngineeringData] = useState<EngineeringData>({...}); // 12 fields
const [sitesProgress, setSitesProgress] = useState<SiteProgressData[]>([]);
const [equipmentData, setEquipmentData] = useState<EquipmentMaterialsData>({...}); // 13 fields
const [financialData, setFinancialData] = useState<FinancialData>({...}); // 16 fields
const [testingCommissioningData, setTestingCommissioningData] = useState<TestingCommissioningData>({...}); // 13 fields
const [handoverData, setHandoverData] = useState<HandoverData>({...}); // 15 fields
```

**Total:** 11 useState hooks, 96+ fields

### BOM Management State

**Location:** `src/manager/bom-management/hooks/useBomData.ts`

**Current Implementation:**
```typescript
const [bomDialogVisible, setBomDialogVisible] = useState(false);
const [editingBom, setEditingBom] = useState<BomModel | null>(null);
const [showDeleteBomDialog, setShowDeleteBomDialog] = useState(false);
const [bomToDelete, setBomToDelete] = useState<BomModel | null>(null);
const [bomName, setBomName] = useState('');
const [selectedProjectId, setSelectedProjectId] = useState('');
const [bomType, setBomType] = useState<'estimating' | 'execution'>('estimating');
const [siteCategory, setSiteCategory] = useState<string>('');
const [quantity, setQuantity] = useState('1');
const [unit, setUnit] = useState('nos');
const [description, setDescription] = useState('');
const [projectMenuVisible, setProjectMenuVisible] = useState(false);
const [siteMenuVisible, setSiteMenuVisible] = useState(false);
```

**Total:** 13 useState hooks

**Location:** `src/manager/bom-management/hooks/useBomItemData.ts`

**Total:** 10 useState hooks (similar pattern for BOM items)

---

## Architecture Pattern

### Reference Implementation

We follow the pattern established in:
- **Reducer Pattern:** `src/supervisor/daily_reports/state/reportReducer.ts`
- **Action Creators:** `src/supervisor/daily_reports/state/reportActions.ts`
- **Documentation:** `docs/architecture/ARCHITECTURE_UNIFIED.md`

### File Structure

```
src/manager/
├── bom-management/
│   ├── state/                          ← NEW FOLDER
│   │   ├── index.ts                    ← Barrel export
│   │   ├── bomFormReducer.ts           ← State + Actions + Reducer
│   │   ├── bomFormActions.ts           ← Action creators
│   │   ├── bomItemFormReducer.ts       ← State + Actions + Reducer
│   │   └── bomItemFormActions.ts       ← Action creators
│   └── hooks/
│       ├── useBomData.ts               ← REFACTOR (replace useState)
│       └── useBomItemData.ts           ← REFACTOR (replace useState)
│
└── dashboard/
    ├── state/                          ← NEW FOLDER
    │   ├── index.ts                    ← Barrel export
    │   ├── dashboardReducer.ts         ← State + Actions + Reducer
    │   └── dashboardActions.ts         ← Action creators
    └── hooks/
        └── useDashboardData.ts         ← REFACTOR (replace useState)
```

### State Organization Pattern

**Nested Objects for Logical Grouping:**

```typescript
interface FormState {
  dialog: {          // Dialog visibility and editing state
    visible: boolean;
    editingItem: Model | null;
  };
  form: {            // Form input fields
    field1: string;
    field2: string;
  };
  ui: {              // UI-only state (dropdowns, etc.)
    menuVisible: boolean;
  };
  deleteConfirmation: {  // Delete dialog state
    visible: boolean;
    itemToDelete: Model | null;
  };
}
```

---

## Implementation Steps

### Phase 1: BOM Management State (Days 1-4)

#### Step 1.1: Create BOM Form Reducer (4 hours)

**File:** `src/manager/bom-management/state/bomFormReducer.ts`

<details>
<summary>📄 Click to expand full code template</summary>

```typescript
/**
 * BOM Form State Reducer
 *
 * Manages complex state for BOM form interactions
 * Replaces 13 useState hooks with a single useReducer
 *
 * State managed:
 * - Dialog visibility and editing state
 * - Form inputs (name, project, type, category, etc.)
 * - UI state (dropdown menus)
 * - Delete confirmation dialog
 */

import BomModel from '../../../models/BomModel';

// ==================== State Interface ====================

export interface BomFormState {
  // Dialog state
  dialog: {
    visible: boolean;
    editingBom: BomModel | null;
  };

  // Form inputs
  form: {
    bomName: string;
    selectedProjectId: string;
    bomType: 'estimating' | 'execution';
    siteCategory: string;
    quantity: string;
    unit: string;
    description: string;
  };

  // UI state
  ui: {
    projectMenuVisible: boolean;
    siteMenuVisible: boolean;
  };

  // Delete confirmation
  deleteConfirmation: {
    visible: boolean;
    bomToDelete: BomModel | null;
  };
}

// ==================== Action Types ====================

export type BomFormAction =
  // Dialog actions
  | { type: 'OPEN_ADD_DIALOG'; payload: { bomType: 'estimating' | 'execution'; defaultProjectId: string; defaultCategory: string } }
  | { type: 'OPEN_EDIT_DIALOG'; payload: { bom: BomModel } }
  | { type: 'CLOSE_DIALOG' }

  // Form field actions
  | { type: 'SET_BOM_NAME'; payload: string }
  | { type: 'SET_PROJECT_ID'; payload: string }
  | { type: 'SET_BOM_TYPE'; payload: 'estimating' | 'execution' }
  | { type: 'SET_SITE_CATEGORY'; payload: string }
  | { type: 'SET_QUANTITY'; payload: string }
  | { type: 'SET_UNIT'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }

  // UI actions
  | { type: 'TOGGLE_PROJECT_MENU' }
  | { type: 'TOGGLE_SITE_MENU' }
  | { type: 'SET_PROJECT_MENU_VISIBLE'; payload: boolean }
  | { type: 'SET_SITE_MENU_VISIBLE'; payload: boolean }

  // Delete confirmation actions
  | { type: 'OPEN_DELETE_DIALOG'; payload: { bom: BomModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }

  // Reset action
  | { type: 'RESET_FORM'; payload?: { defaultProjectId?: string; defaultCategory?: string } };

// ==================== Initial State ====================

export const initialBomFormState: BomFormState = {
  dialog: {
    visible: false,
    editingBom: null,
  },
  form: {
    bomName: '',
    selectedProjectId: '',
    bomType: 'estimating',
    siteCategory: '',
    quantity: '1',
    unit: 'nos',
    description: '',
  },
  ui: {
    projectMenuVisible: false,
    siteMenuVisible: false,
  },
  deleteConfirmation: {
    visible: false,
    bomToDelete: null,
  },
};

// ==================== Reducer Function ====================

export const bomFormReducer = (
  state: BomFormState,
  action: BomFormAction
): BomFormState => {
  switch (action.type) {
    // ==================== Dialog Actions ====================

    case 'OPEN_ADD_DIALOG':
      return {
        ...state,
        dialog: {
          visible: true,
          editingBom: null,
        },
        form: {
          bomName: '',
          selectedProjectId: action.payload.defaultProjectId,
          bomType: action.payload.bomType,
          siteCategory: action.payload.defaultCategory,
          quantity: '1',
          unit: 'nos',
          description: '',
        },
        ui: {
          projectMenuVisible: false,
          siteMenuVisible: false,
        },
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        dialog: {
          visible: true,
          editingBom: action.payload.bom,
        },
        form: {
          bomName: action.payload.bom.name,
          selectedProjectId: action.payload.bom.projectId,
          bomType: action.payload.bom.type as 'estimating' | 'execution',
          siteCategory: action.payload.bom.siteCategory || '',
          quantity: action.payload.bom.quantity.toString(),
          unit: action.payload.bom.unit,
          description: action.payload.bom.description || '',
        },
        ui: {
          projectMenuVisible: false,
          siteMenuVisible: false,
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialog: {
          visible: false,
          editingBom: null,
        },
        form: initialBomFormState.form,
        ui: initialBomFormState.ui,
      };

    // ==================== Form Field Actions ====================

    case 'SET_BOM_NAME':
      return {
        ...state,
        form: {
          ...state.form,
          bomName: action.payload,
        },
      };

    case 'SET_PROJECT_ID':
      return {
        ...state,
        form: {
          ...state.form,
          selectedProjectId: action.payload,
        },
      };

    case 'SET_BOM_TYPE':
      return {
        ...state,
        form: {
          ...state.form,
          bomType: action.payload,
        },
      };

    case 'SET_SITE_CATEGORY':
      return {
        ...state,
        form: {
          ...state.form,
          siteCategory: action.payload,
        },
      };

    case 'SET_QUANTITY':
      return {
        ...state,
        form: {
          ...state.form,
          quantity: action.payload,
        },
      };

    case 'SET_UNIT':
      return {
        ...state,
        form: {
          ...state.form,
          unit: action.payload,
        },
      };

    case 'SET_DESCRIPTION':
      return {
        ...state,
        form: {
          ...state.form,
          description: action.payload,
        },
      };

    // ==================== UI Actions ====================

    case 'TOGGLE_PROJECT_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          projectMenuVisible: !state.ui.projectMenuVisible,
        },
      };

    case 'TOGGLE_SITE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          siteMenuVisible: !state.ui.siteMenuVisible,
        },
      };

    case 'SET_PROJECT_MENU_VISIBLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          projectMenuVisible: action.payload,
        },
      };

    case 'SET_SITE_MENU_VISIBLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          siteMenuVisible: action.payload,
        },
      };

    // ==================== Delete Confirmation Actions ====================

    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        deleteConfirmation: {
          visible: true,
          bomToDelete: action.payload.bom,
        },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        deleteConfirmation: {
          visible: false,
          bomToDelete: null,
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_FORM':
      return {
        ...initialBomFormState,
        form: {
          ...initialBomFormState.form,
          selectedProjectId: action.payload?.defaultProjectId || '',
          siteCategory: action.payload?.defaultCategory || '',
        },
      };

    // ==================== Default ====================

    default:
      return state;
  }
};
```

</details>

**Key Points:**
- Copy exact structure from `src/supervisor/daily_reports/state/reportReducer.ts`
- Use section comment headers
- Nest related state (dialog, form, ui, deleteConfirmation)
- All updates are immutable (spread operators)

#### Step 1.2: Create BOM Form Actions (2 hours)

**File:** `src/manager/bom-management/state/bomFormActions.ts`

<details>
<summary>📄 Click to expand action creators template</summary>

```typescript
/**
 * BOM Form Action Creators
 *
 * Type-safe action creators for BOM form reducer
 * Provides better DX with autocomplete and type checking
 */

import BomModel from '../../../models/BomModel';
import { BomFormAction } from './bomFormReducer';

// ==================== Dialog Actions ====================

/**
 * Open the add BOM dialog
 * Pre-populates form with defaults for the selected BOM type
 */
export const openAddBomDialog = (
  bomType: 'estimating' | 'execution',
  defaultProjectId: string,
  defaultCategory: string
): BomFormAction => ({
  type: 'OPEN_ADD_DIALOG',
  payload: { bomType, defaultProjectId, defaultCategory },
});

/**
 * Open the edit BOM dialog
 * Pre-populates form with existing BOM data
 */
export const openEditBomDialog = (bom: BomModel): BomFormAction => ({
  type: 'OPEN_EDIT_DIALOG',
  payload: { bom },
});

/**
 * Close the dialog and reset form state
 */
export const closeBomDialog = (): BomFormAction => ({
  type: 'CLOSE_DIALOG',
});

// ==================== Form Field Actions ====================

/**
 * Update BOM name input value
 */
export const setBomName = (value: string): BomFormAction => ({
  type: 'SET_BOM_NAME',
  payload: value,
});

/**
 * Update selected project ID
 */
export const setProjectId = (value: string): BomFormAction => ({
  type: 'SET_PROJECT_ID',
  payload: value,
});

/**
 * Update BOM type (estimating or execution)
 */
export const setBomType = (value: 'estimating' | 'execution'): BomFormAction => ({
  type: 'SET_BOM_TYPE',
  payload: value,
});

/**
 * Update site category
 */
export const setSiteCategory = (value: string): BomFormAction => ({
  type: 'SET_SITE_CATEGORY',
  payload: value,
});

/**
 * Update quantity input value
 */
export const setQuantity = (value: string): BomFormAction => ({
  type: 'SET_QUANTITY',
  payload: value,
});

/**
 * Update unit input value
 */
export const setUnit = (value: string): BomFormAction => ({
  type: 'SET_UNIT',
  payload: value,
});

/**
 * Update description input value
 */
export const setDescription = (value: string): BomFormAction => ({
  type: 'SET_DESCRIPTION',
  payload: value,
});

// ==================== UI Actions ====================

/**
 * Toggle project dropdown menu visibility
 */
export const toggleProjectMenu = (): BomFormAction => ({
  type: 'TOGGLE_PROJECT_MENU',
});

/**
 * Toggle site category dropdown menu visibility
 */
export const toggleSiteMenu = (): BomFormAction => ({
  type: 'TOGGLE_SITE_MENU',
});

/**
 * Set project menu visibility directly
 */
export const setProjectMenuVisible = (visible: boolean): BomFormAction => ({
  type: 'SET_PROJECT_MENU_VISIBLE',
  payload: visible,
});

/**
 * Set site menu visibility directly
 */
export const setSiteMenuVisible = (visible: boolean): BomFormAction => ({
  type: 'SET_SITE_MENU_VISIBLE',
  payload: visible,
});

// ==================== Delete Confirmation Actions ====================

/**
 * Open delete confirmation dialog
 * @param bom - The BOM to delete
 */
export const openDeleteBomDialog = (bom: BomModel): BomFormAction => ({
  type: 'OPEN_DELETE_DIALOG',
  payload: { bom },
});

/**
 * Close delete confirmation dialog
 */
export const closeDeleteBomDialog = (): BomFormAction => ({
  type: 'CLOSE_DELETE_DIALOG',
});

// ==================== Reset Action ====================

/**
 * Reset entire form state to initial values
 * @param defaultProjectId - Optional default project ID
 * @param defaultCategory - Optional default category
 */
export const resetBomForm = (defaultProjectId?: string, defaultCategory?: string): BomFormAction => ({
  type: 'RESET_FORM',
  payload: { defaultProjectId, defaultCategory },
});
```

</details>

#### Step 1.3: Create BOM Item Form Reducer (3 hours)

**File:** `src/manager/bom-management/state/bomItemFormReducer.ts`

Follow the same pattern as `bomFormReducer.ts` but for BOM items:

**State Interface:**
```typescript
export interface BomItemFormState {
  dialog: {
    visible: boolean;
    editingItem: BomItemModel | null;
  };
  form: {
    selectedBomId: string;
    itemDescription: string;
    itemCategory: 'material' | 'labor' | 'equipment' | 'subcontractor';
    itemQuantity: string;
    itemUnit: string;
    itemUnitCost: string;
    itemPhase: string;
  };
  deleteConfirmation: {
    visible: boolean;
    itemToDelete: BomItemModel | null;
  };
}
```

**Actions:** 11 total (similar to BOM form but for items)

#### Step 1.4: Create BOM Item Form Actions (2 hours)

**File:** `src/manager/bom-management/state/bomItemFormActions.ts`

Follow same pattern as `bomFormActions.ts`

#### Step 1.5: Create State Barrel Export (15 minutes)

**File:** `src/manager/bom-management/state/index.ts`

```typescript
/**
 * BOM Management State
 *
 * Barrel export for reducers and actions
 */

export * from './bomFormReducer';
export * from './bomFormActions';
export * from './bomItemFormReducer';
export * from './bomItemFormActions';
```

#### Step 1.6: Refactor useBomData Hook (4 hours)

**File:** `src/manager/bom-management/hooks/useBomData.ts`

**Before:**
```typescript
const [bomDialogVisible, setBomDialogVisible] = useState(false);
const [editingBom, setEditingBom] = useState<BomModel | null>(null);
const [bomName, setBomName] = useState('');
// ... 10 more useState
```

**After:**
```typescript
import { useReducer, useCallback } from 'react';
import {
  bomFormReducer,
  initialBomFormState,
  openAddBomDialog as openAddAction,
  openEditBomDialog as openEditAction,
  closeBomDialog as closeAction,
  setBomName as setBomNameAction,
  setProjectId as setProjectIdAction,
  setBomType as setBomTypeAction,
  setSiteCategory as setSiteCategoryAction,
  setQuantity as setQuantityAction,
  setUnit as setUnitAction,
  setDescription as setDescriptionAction,
  setProjectMenuVisible as setProjectMenuAction,
  setSiteMenuVisible as setSiteMenuAction,
  openDeleteBomDialog as openDeleteAction,
  closeDeleteBomDialog as closeDeleteAction,
} from '../state';

export const useBomData = (
  projects: ProjectModel[],
  allBomItems: BomItemModel[],
  boms: BomModel[]
) => {
  const { showSnackbar } = useSnackbar();

  // Replace all useState with single useReducer
  const [state, dispatch] = useReducer(bomFormReducer, initialBomFormState);

  // Wrap dispatch calls in useCallback
  const openAddBomDialog = useCallback((activeTab: 'estimating' | 'execution') => {
    if (projects.length === 0) {
      showSnackbar('Please create a project first', 'warning');
      return;
    }
    const defaultProjectId = projects[0]?.id || '';
    const defaultCategory = SITE_CATEGORIES[0];
    dispatch(openAddAction(activeTab, defaultProjectId, defaultCategory));
  }, [projects, showSnackbar]);

  const openEditBomDialog = useCallback((bom: BomModel) => {
    dispatch(openEditAction(bom));
  }, []);

  const closeBomDialog = useCallback(() => {
    dispatch(closeAction());
  }, []);

  const setBomName = useCallback((value: string) => {
    dispatch(setBomNameAction(value));
  }, []);

  const setSelectedProjectId = useCallback((value: string) => {
    dispatch(setProjectIdAction(value));
  }, []);

  const setBomType = useCallback((value: 'estimating' | 'execution') => {
    dispatch(setBomTypeAction(value));
  }, []);

  const setSiteCategory = useCallback((value: string) => {
    dispatch(setSiteCategoryAction(value));
  }, []);

  const setQuantity = useCallback((value: string) => {
    dispatch(setQuantityAction(value));
  }, []);

  const setUnit = useCallback((value: string) => {
    dispatch(setUnitAction(value));
  }, []);

  const setDescription = useCallback((value: string) => {
    dispatch(setDescriptionAction(value));
  }, []);

  const setProjectMenuVisible = useCallback((visible: boolean) => {
    dispatch(setProjectMenuAction(visible));
  }, []);

  const setSiteMenuVisible = useCallback((visible: boolean) => {
    dispatch(setSiteMenuAction(visible));
  }, []);

  const handleDeleteBom = useCallback((bom: BomModel) => {
    dispatch(openDeleteAction(bom));
  }, []);

  const setShowDeleteBomDialog = useCallback((visible: boolean) => {
    if (!visible) {
      dispatch(closeDeleteAction());
    }
  }, []);

  // Keep all business logic unchanged
  const handleSaveBom = async () => {
    // ... existing logic (no changes)
  };

  const confirmDeleteBom = async () => {
    // ... existing logic (no changes)
  };

  // ... other handlers unchanged

  // Return interface MUST match the original (no breaking changes!)
  return {
    // Dialog state (mapped from state.dialog)
    bomDialogVisible: state.dialog.visible,
    setBomDialogVisible: (visible: boolean) => {
      if (!visible) closeBomDialog();
    },
    editingBom: state.dialog.editingBom,
    showDeleteBomDialog: state.deleteConfirmation.visible,
    setShowDeleteBomDialog,
    bomToDelete: state.deleteConfirmation.bomToDelete,
    setBomToDelete: (bom: BomModel | null) => {
      if (bom) dispatch(openDeleteAction(bom));
      else dispatch(closeDeleteAction());
    },

    // Form state (mapped from state.form)
    bomName: state.form.bomName,
    setBomName,
    selectedProjectId: state.form.selectedProjectId,
    setSelectedProjectId,
    bomType: state.form.bomType,
    setBomType,
    siteCategory: state.form.siteCategory,
    setSiteCategory,
    quantity: state.form.quantity,
    setQuantity,
    unit: state.form.unit,
    setUnit,
    description: state.form.description,
    setDescription,

    // UI state (mapped from state.ui)
    projectMenuVisible: state.ui.projectMenuVisible,
    setProjectMenuVisible,
    siteMenuVisible: state.ui.siteMenuVisible,
    setSiteMenuVisible,

    // Handlers (unchanged)
    openAddBomDialog,
    openEditBomDialog,
    closeBomDialog,
    handleSaveBom,
    handleDeleteBom,
    confirmDeleteBom,
    handleCopyToExecution,
    handleExportBom,
    handleImportBom,
    createBomFromImport,
  };
};
```

**Critical:** The return interface MUST match the original exactly to avoid breaking changes!

#### Step 1.7: Refactor useBomItemData Hook (3 hours)

Follow the same pattern as useBomData.ts

#### Step 1.8: Test BOM Management (4 hours)

**Manual Test Checklist:**
- [ ] Create new Estimating BOM
- [ ] Edit existing BOM
- [ ] Delete BOM (with confirmation)
- [ ] Add BOM item
- [ ] Edit BOM item
- [ ] Delete BOM item
- [ ] Copy BOM to Execution
- [ ] Export BOM to Excel
- [ ] Toggle between Estimating/Execution tabs
- [ ] Open/close all dialogs
- [ ] Dropdown menus work (project, site category)
- [ ] Form validation works
- [ ] TypeScript compiles: `npx tsc --noEmit`

---

### Phase 2: Dashboard State (Days 5-6)

#### Step 2.1: Create Dashboard Reducer (3 hours)

**File:** `src/manager/dashboard/state/dashboardReducer.ts`

**State Interface:**
```typescript
export interface DashboardState {
  loading: {
    initial: boolean;
    refreshing: boolean;
  };
  data: {
    stats: ProjectStats;
    projectInfo: ProjectInfo | null;
  };
}
```

**Actions:** 8 total
- `START_LOAD`, `START_REFRESH`, `FINISH_LOAD`
- `SET_STATS`, `SET_PROJECT_INFO`
- `UPDATE_STAT` (for single metric updates)
- `SET_DASHBOARD_DATA` (batch update)

#### Step 2.2: Create Dashboard Actions (2 hours)

**File:** `src/manager/dashboard/state/dashboardActions.ts`

#### Step 2.3: Create State Barrel Export (15 minutes)

**File:** `src/manager/dashboard/state/index.ts`

#### Step 2.4: Refactor useDashboardData Hook (2 hours)

**File:** `src/manager/dashboard/hooks/useDashboardData.ts`

**Key Change:**
```typescript
const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);

const loadDashboardData = useCallback(async () => {
  try {
    dispatch({ type: 'START_LOAD' });

    // Load data in parallel (existing logic unchanged)
    const [statsData, projectData] = await Promise.all([
      calculateStats(),
      loadProjectInfo()
    ]);

    // Batch update with single dispatch
    dispatch({
      type: 'SET_DASHBOARD_DATA',
      payload: { stats: statsData, projectInfo: projectData }
    });
  } catch (error) {
    logger.error('[useDashboardData] Error loading data', error as Error);
  } finally {
    dispatch({ type: 'FINISH_LOAD' });
  }
}, [projectId]);
```

#### Step 2.5: Test Dashboard (2 hours)

**Manual Test Checklist:**
- [ ] Dashboard loads with correct data
- [ ] Pull-to-refresh works
- [ ] All 8 KPI cards display correctly
- [ ] Engineering section shows PM200 data
- [ ] Site progress table shows all sites
- [ ] Equipment section shows PM300/400 data
- [ ] Financial section shows budget/cost data
- [ ] Testing/Commissioning shows PM500/600
- [ ] Handover section shows PM700 data
- [ ] Loading states display properly
- [ ] Refreshing spinner works
- [ ] TypeScript compiles: `npx tsc --noEmit`

---

## Code Examples

### Example 1: Opening a Dialog with Pre-population

**Before (useState):**
```typescript
const openEditBomDialog = (bom: BomModel) => {
  setEditingBom(bom);
  setBomName(bom.name);
  setSelectedProjectId(bom.projectId);
  setBomType(bom.type as 'estimating' | 'execution');
  setSiteCategory(bom.siteCategory || SITE_CATEGORIES[0]);
  setQuantity(bom.quantity.toString());
  setUnit(bom.unit);
  setDescription(bom.description || '');
  setBomDialogVisible(true);
};
```

**After (useReducer):**
```typescript
const openEditBomDialog = useCallback((bom: BomModel) => {
  dispatch(openEditBomDialogAction(bom));
}, []);
```

**In the reducer:**
```typescript
case 'OPEN_EDIT_DIALOG':
  return {
    ...state,
    dialog: { visible: true, editingBom: action.payload.bom },
    form: {
      bomName: action.payload.bom.name,
      selectedProjectId: action.payload.bom.projectId,
      // ... other fields
    },
  };
```

### Example 2: Form Reset

**Before (useState):**
```typescript
const resetBomForm = () => {
  setBomName('');
  setSelectedProjectId(projects[0]?.id || '');
  setBomType('estimating');
  setSiteCategory(SITE_CATEGORIES[0]);
  setQuantity('1');
  setUnit('nos');
  setDescription('');
  setEditingBom(null);
};
```

**After (useReducer):**
```typescript
const resetBomForm = useCallback(() => {
  dispatch(resetBomFormAction(projects[0]?.id, SITE_CATEGORIES[0]));
}, [projects]);
```

---

## Testing Procedures

### Pre-Implementation Testing

1. **Baseline Testing:**
   - Test all BOM management functionality BEFORE changes
   - Document current behavior
   - Take screenshots of UI states
   - Note any existing bugs

### During Implementation Testing

2. **Incremental Testing:**
   - After creating each reducer, write a simple test:
     ```typescript
     const initialState = bomFormReducer(undefined, { type: 'RESET_FORM' });
     console.log('Initial state:', initialState);
     ```
   - After refactoring each hook, test that component still works
   - Run `npx tsc --noEmit` frequently

### Post-Implementation Testing

3. **Full Regression Testing:**
   - Complete all manual test checklists
   - Compare behavior against baseline
   - Verify no visual changes
   - Test edge cases (empty states, validation errors)

4. **TypeScript Validation:**
   ```bash
   npx tsc --noEmit
   ```
   **Expected output:** 0 errors

5. **ESLint Check:**
   ```bash
   npm run lint
   ```
   **Expected output:** 0 errors

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: TypeScript Error - "Property does not exist on type"

**Symptom:**
```
Property 'bomName' does not exist on type 'BomFormState'
```

**Solution:**
- Check that you're accessing nested state correctly:
  ```typescript
  ❌ return state.bomName;
  ✅ return state.form.bomName;
  ```

#### Issue 2: Infinite Re-render Loop

**Symptom:**
```
Maximum update depth exceeded
```

**Solution:**
- Ensure dispatch wrappers use `useCallback`:
  ```typescript
  ❌ const setBomName = (value) => dispatch(action(value));
  ✅ const setBomName = useCallback((value) => dispatch(action(value)), []);
  ```

#### Issue 3: Form Not Resetting on Close

**Symptom:**
Dialog opens with old data still present

**Solution:**
- Ensure `CLOSE_DIALOG` action resets form:
  ```typescript
  case 'CLOSE_DIALOG':
    return {
      ...state,
      dialog: { visible: false, editingBom: null },
      form: initialBomFormState.form,  // ← Reset form
    };
  ```

#### Issue 4: Dropdown Menus Not Opening

**Symptom:**
Clicking dropdown doesn't show menu

**Solution:**
- Check UI state mapping in return interface:
  ```typescript
  return {
    projectMenuVisible: state.ui.projectMenuVisible,  // ← Map correctly
    setProjectMenuVisible,
  };
  ```

#### Issue 5: Breaking Changes After Refactor

**Symptom:**
Component crashes with "undefined is not a function"

**Solution:**
- Verify return interface matches original:
  ```typescript
  // Original hook exported these:
  const original = useBomData();
  console.log(Object.keys(original));

  // New hook must export exactly the same keys
  ```

---

## Quality Checklist

### Before Creating Pull Request

**Code Quality:**
- [ ] All useState hooks converted to useReducer
- [ ] Action types use TypeScript discriminated unions
- [ ] All action creators have JSDoc comments
- [ ] Section comments added to reducers (// ========)
- [ ] State uses nested objects for logical grouping
- [ ] Barrel exports created (state/index.ts)
- [ ] All dispatch calls wrapped in useCallback
- [ ] Return interfaces match original hooks exactly

**TypeScript:**
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No `@ts-ignore` comments added
- [ ] All action payloads properly typed
- [ ] State interfaces exported for reuse

**Testing:**
- [ ] All manual test checklists completed
- [ ] BOM creation works
- [ ] BOM editing works
- [ ] BOM deletion with confirmation works
- [ ] Item creation/editing/deletion works
- [ ] Dashboard loads correctly
- [ ] Pull-to-refresh works
- [ ] All dropdowns work
- [ ] No visual regressions

**Documentation:**
- [ ] PROGRESS_TRACKING.md updated
- [ ] Commit message follows template
- [ ] Code comments added for complex logic
- [ ] ARCHITECTURE_UNIFIED.md reference updated (optional)

---

## References

### Codebase References

**Pattern to Follow:**
- **Reducer:** `src/supervisor/daily_reports/state/reportReducer.ts`
- **Actions:** `src/supervisor/daily_reports/state/reportActions.ts`
- **Hook Usage:** `src/supervisor/daily_reports/hooks/useReportForm.ts`

**Files to Modify:**
- `src/manager/bom-management/hooks/useBomData.ts`
- `src/manager/bom-management/hooks/useBomItemData.ts`
- `src/manager/dashboard/hooks/useDashboardData.ts`

**Architecture Documentation:**
- `docs/architecture/ARCHITECTURE_UNIFIED.md`

### External References

- [React useReducer Hook](https://react.dev/reference/react/useReducer)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [React useCallback Hook](https://react.dev/reference/react/useCallback)

---

## Timeline

**Total Estimated Time:** 18-24 hours

| Phase | Task | Time | Days |
|-------|------|------|------|
| **Phase 1** | **BOM Management State** | **14-16h** | **3-4** |
| 1.1 | Create bomFormReducer.ts | 4h | Day 1 |
| 1.2 | Create bomFormActions.ts | 2h | Day 1 |
| 1.3 | Create bomItemFormReducer.ts | 3h | Day 2 |
| 1.4 | Create bomItemFormActions.ts | 2h | Day 2 |
| 1.5 | Create state/index.ts | 0.25h | Day 2 |
| 1.6 | Refactor useBomData.ts | 4h | Day 3 |
| 1.7 | Refactor useBomItemData.ts | 3h | Day 3 |
| 1.8 | Testing BOM Management | 4h | Day 4 |
| **Phase 2** | **Dashboard State** | **7-8h** | **2** |
| 2.1 | Create dashboardReducer.ts | 3h | Day 5 |
| 2.2 | Create dashboardActions.ts | 2h | Day 5 |
| 2.3 | Create state/index.ts | 0.25h | Day 5 |
| 2.4 | Refactor useDashboardData.ts | 2h | Day 6 |
| 2.5 | Testing Dashboard | 2h | Day 6 |
| **Wrap-up** | **Documentation & Commit** | **2h** | **1** |
| 3.1 | Update PROGRESS_TRACKING.md | 0.5h | Day 7 |
| 3.2 | Final testing & validation | 1h | Day 7 |
| 3.3 | Create commit with message | 0.5h | Day 7 |

---

## Success Criteria Summary

✅ **Quantitative Metrics:**
- useState hooks: 34 → 3 (91% reduction)
- TypeScript errors: 0
- ESLint errors: 0
- Breaking changes: 0
- Lines of code added: ~815 (state files)
- Lines of code modified: ~350 (hooks)

✅ **Qualitative Metrics:**
- Code follows Supervisor pattern exactly
- State management is centralized and predictable
- Debugging is easier with explicit state transitions
- Future changes (adding fields) are simpler
- Pattern is consistent across Manager role

---

**Document Version:** 1.0
**Last Updated:** 2026-01-02
**Status:** Ready for Implementation
