/**
 * DOORS Package Form State Reducer
 *
 * Manages complex state for DOORS Package Edit Screen
 * Replaces 13 useState hooks with a single useReducer
 *
 * State managed:
 * - UI state (loading, saving)
 * - Data state (doorsPackage)
 * - Form inputs (9 fields)
 * - Validation state (errors)
 */

import DoorsPackageModel from '../../../models/DoorsPackageModel';

// ==================== State Interface ====================

export interface DoorsPackageFormState {
  // UI state
  ui: {
    loading: boolean;
    saving: boolean;
  };

  // Data state
  data: {
    doorsPackage: DoorsPackageModel | null;
  };

  // Form inputs
  form: {
    equipmentName: string;
    category: string;
    equipmentType: string;
    status: string;
    priority: string;
    quantity: string;
    unit: string;
    specificationRef: string;
    drawingRef: string;
  };

  // Validation state
  validation: {
    errors: Record<string, string>;
  };
}

// ==================== Action Types ====================

export type DoorsPackageFormAction =
  // UI actions
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'START_SAVING' }
  | { type: 'STOP_SAVING' }

  // Data actions
  | { type: 'SET_DOORS_PACKAGE'; payload: DoorsPackageModel | null }
  | {
      type: 'LOAD_PACKAGE_DATA';
      payload: {
        doorsPackage: DoorsPackageModel;
        formData: {
          equipmentName: string;
          category: string;
          equipmentType: string;
          status: string;
          priority: string;
          quantity: string;
          unit: string;
          specificationRef: string;
          drawingRef: string;
        };
      };
    }

  // Form field actions
  | { type: 'SET_EQUIPMENT_NAME'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_EQUIPMENT_TYPE'; payload: string }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_PRIORITY'; payload: string }
  | { type: 'SET_QUANTITY'; payload: string }
  | { type: 'SET_UNIT'; payload: string }
  | { type: 'SET_SPECIFICATION_REF'; payload: string }
  | { type: 'SET_DRAWING_REF'; payload: string }
  | {
      type: 'UPDATE_FORM_FIELDS';
      payload: Partial<DoorsPackageFormState['form']>;
    }

  // Validation actions
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_FIELD_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_FIELD_ERROR'; payload: string }

  // Reset action
  | { type: 'RESET_FORM' };

// ==================== Initial State ====================

export const initialDoorsPackageFormState: DoorsPackageFormState = {
  ui: {
    loading: true,
    saving: false,
  },
  data: {
    doorsPackage: null,
  },
  form: {
    equipmentName: '',
    category: '',
    equipmentType: '',
    status: '',
    priority: '',
    quantity: '',
    unit: '',
    specificationRef: '',
    drawingRef: '',
  },
  validation: {
    errors: {},
  },
};

// ==================== Reducer Function ====================

export const doorsPackageFormReducer = (
  state: DoorsPackageFormState,
  action: DoorsPackageFormAction
): DoorsPackageFormState => {
  switch (action.type) {
    // ==================== UI Actions ====================

    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'STOP_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
      };

    case 'START_SAVING':
      return {
        ...state,
        ui: {
          ...state.ui,
          saving: true,
        },
      };

    case 'STOP_SAVING':
      return {
        ...state,
        ui: {
          ...state.ui,
          saving: false,
        },
      };

    // ==================== Data Actions ====================

    case 'SET_DOORS_PACKAGE':
      return {
        ...state,
        data: {
          doorsPackage: action.payload,
        },
      };

    case 'LOAD_PACKAGE_DATA':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
        data: {
          doorsPackage: action.payload.doorsPackage,
        },
        form: action.payload.formData,
      };

    // ==================== Form Field Actions ====================

    case 'SET_EQUIPMENT_NAME':
      return {
        ...state,
        form: {
          ...state.form,
          equipmentName: action.payload,
        },
      };

    case 'SET_CATEGORY':
      return {
        ...state,
        form: {
          ...state.form,
          category: action.payload,
        },
      };

    case 'SET_EQUIPMENT_TYPE':
      return {
        ...state,
        form: {
          ...state.form,
          equipmentType: action.payload,
        },
      };

    case 'SET_STATUS':
      return {
        ...state,
        form: {
          ...state.form,
          status: action.payload,
        },
      };

    case 'SET_PRIORITY':
      return {
        ...state,
        form: {
          ...state.form,
          priority: action.payload,
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

    case 'SET_SPECIFICATION_REF':
      return {
        ...state,
        form: {
          ...state.form,
          specificationRef: action.payload,
        },
      };

    case 'SET_DRAWING_REF':
      return {
        ...state,
        form: {
          ...state.form,
          drawingRef: action.payload,
        },
      };

    case 'UPDATE_FORM_FIELDS':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
      };

    // ==================== Validation Actions ====================

    case 'SET_ERRORS':
      return {
        ...state,
        validation: {
          errors: action.payload,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        validation: {
          errors: {},
        },
      };

    case 'SET_FIELD_ERROR':
      return {
        ...state,
        validation: {
          errors: {
            ...state.validation.errors,
            [action.payload.field]: action.payload.error,
          },
        },
      };

    case 'CLEAR_FIELD_ERROR':
      return {
        ...state,
        validation: {
          errors: Object.fromEntries(
            Object.entries(state.validation.errors).filter(([key]) => key !== action.payload)
          ),
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_FORM':
      return initialDoorsPackageFormState;

    // ==================== Default ====================

    default:
      return state;
  }
};
