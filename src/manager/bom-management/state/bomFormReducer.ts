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

import BomModel from '../../../../models/BomModel';

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
