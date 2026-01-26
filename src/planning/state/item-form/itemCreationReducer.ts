/**
 * Item Creation State Management
 *
 * Consolidates state from multiple hooks:
 * - useItemForm (formData, errors)
 * - useItemCreation (loading/saving)
 * - useWBSCodeGeneration (generatedWbsCode, generatingCode)
 * - UI state (menus, date pickers)
 *
 * Reduction: 8 useState → 1 useReducer (88% reduction)
 */

export interface ItemFormData {
  name: string;
  categoryId: string;
  parentWbsCode: string | null;
  phase: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  unit: string;
  quantity: string;
  completedQuantity: string;
  weightage: string;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
  keyDateId: string | null; // Link to Key Date (Phase 5c)
}

export interface ItemCreationState {
  ui: {
    saving: boolean;
    categoryMenuVisible: boolean;
    phaseMenuVisible: boolean;
    showDatePicker: boolean;
    datePickerMode: 'start' | 'end' | null;
  };
  form: ItemFormData;
  validation: {
    errors: Record<string, string>;
    touched: Record<string, boolean>;
  };
  wbs: {
    generatedCode: string;
    generating: boolean;
  };
}

export type ItemCreationAction =
  // Form field updates
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof ItemFormData; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<ItemFormData> }
  | { type: 'UPDATE_NUMERIC_FIELD'; payload: { field: keyof ItemFormData; value: string } }

  // Validation
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; error: string } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: { errors: Record<string, string> } }
  | { type: 'CLEAR_VALIDATION_ERROR'; payload: { field: string } }
  | { type: 'MARK_FIELD_TOUCHED'; payload: { field: string } }
  | { type: 'CLEAR_VALIDATION' }

  // UI toggles
  | { type: 'TOGGLE_CATEGORY_MENU' }
  | { type: 'TOGGLE_PHASE_MENU' }
  | { type: 'OPEN_DATE_PICKER'; payload: { mode: 'start' | 'end' } }
  | { type: 'CLOSE_DATE_PICKER' }

  // Date calculations
  | { type: 'SET_START_DATE'; payload: { date: Date } }
  | { type: 'SET_END_DATE'; payload: { date: Date } }
  | { type: 'SET_DURATION'; payload: { duration: string } }

  // WBS code generation
  | { type: 'START_WBS_GENERATION' }
  | { type: 'SET_WBS_CODE'; payload: { code: string } }
  | { type: 'WBS_GENERATION_COMPLETE' }

  // Save operations
  | { type: 'START_SAVING' }
  | { type: 'COMPLETE_SAVING' }

  // Form reset
  | { type: 'RESET_FORM'; payload?: { parentWbsCode: string | null } };

/**
 * Create initial state for item creation
 */
export const createInitialState = (parentWbsCode: string | null = null): ItemCreationState => ({
  ui: {
    saving: false,
    categoryMenuVisible: false,
    phaseMenuVisible: false,
    showDatePicker: false,
    datePickerMode: null,
  },
  form: {
    name: '',
    categoryId: '',
    parentWbsCode: parentWbsCode,
    phase: 'design',
    duration: '30',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    unit: 'Set',
    quantity: '1',
    completedQuantity: '0',
    weightage: '0',
    isMilestone: false,
    isCriticalPath: false,
    floatDays: '0',
    dependencyRisk: 'low',
    riskNotes: '',
    keyDateId: null,
  },
  validation: {
    errors: {},
    touched: {},
  },
  wbs: {
    generatedCode: '',
    generating: false,
  },
});

/**
 * Item Creation Reducer
 */
export const itemCreationReducer = (
  state: ItemCreationState,
  action: ItemCreationAction
): ItemCreationState => {
  switch (action.type) {
    // Form field updates
    case 'UPDATE_FORM_FIELD': {
      const { field, value } = action.payload;
      const newErrors = { ...state.validation.errors };
      delete newErrors[field]; // Clear error when field is updated
      return {
        ...state,
        form: {
          ...state.form,
          [field]: value,
        },
        validation: {
          ...state.validation,
          errors: newErrors,
        },
      };
    }

    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
      };

    case 'UPDATE_NUMERIC_FIELD': {
      const { field, value } = action.payload;
      // Only allow positive numbers and empty string
      if (value === '' || /^\d+$/.test(value)) {
        const newErrors = { ...state.validation.errors };
        delete newErrors[field];
        return {
          ...state,
          form: {
            ...state.form,
            [field]: value,
          },
          validation: {
            ...state.validation,
            errors: newErrors,
          },
        };
      }
      return state;
    }

    // Validation
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validation: {
          ...state.validation,
          errors: {
            ...state.validation.errors,
            [action.payload.field]: action.payload.error,
          },
        },
      };

    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validation: {
          ...state.validation,
          errors: action.payload.errors,
        },
      };

    case 'CLEAR_VALIDATION_ERROR': {
      const newErrors = { ...state.validation.errors };
      delete newErrors[action.payload.field];
      return {
        ...state,
        validation: {
          ...state.validation,
          errors: newErrors,
        },
      };
    }

    case 'MARK_FIELD_TOUCHED':
      return {
        ...state,
        validation: {
          ...state.validation,
          touched: {
            ...state.validation.touched,
            [action.payload.field]: true,
          },
        },
      };

    case 'CLEAR_VALIDATION':
      return {
        ...state,
        validation: {
          errors: {},
          touched: {},
        },
      };

    // UI toggles
    case 'TOGGLE_CATEGORY_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          categoryMenuVisible: !state.ui.categoryMenuVisible,
        },
      };

    case 'TOGGLE_PHASE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          phaseMenuVisible: !state.ui.phaseMenuVisible,
        },
      };

    case 'OPEN_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDatePicker: true,
          datePickerMode: action.payload.mode,
        },
      };

    case 'CLOSE_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDatePicker: false,
          datePickerMode: null,
        },
      };

    // Date calculations
    case 'SET_START_DATE': {
      const { date } = action.payload;
      const durationDays = parseInt(state.form.duration) || 30;
      const endDate = new Date(date.getTime() + durationDays * 24 * 60 * 60 * 1000);
      return {
        ...state,
        form: {
          ...state.form,
          startDate: date,
          endDate: endDate,
        },
      };
    }

    case 'SET_END_DATE': {
      const { date } = action.payload;
      const durationMs = date.getTime() - state.form.startDate.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));
      return {
        ...state,
        form: {
          ...state.form,
          endDate: date,
          duration: durationDays.toString(),
        },
      };
    }

    case 'SET_DURATION': {
      const { duration } = action.payload;
      if (duration === '' || /^\d+$/.test(duration)) {
        const durationDays = parseInt(duration) || 1;
        const endDate = new Date(state.form.startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        return {
          ...state,
          form: {
            ...state.form,
            duration: duration,
            endDate: endDate,
          },
        };
      }
      return state;
    }

    // WBS code generation
    case 'START_WBS_GENERATION':
      return {
        ...state,
        wbs: {
          ...state.wbs,
          generating: true,
        },
      };

    case 'SET_WBS_CODE':
      return {
        ...state,
        wbs: {
          generatedCode: action.payload.code,
          generating: false,
        },
      };

    case 'WBS_GENERATION_COMPLETE':
      return {
        ...state,
        wbs: {
          ...state.wbs,
          generating: false,
        },
      };

    // Save operations
    case 'START_SAVING':
      return {
        ...state,
        ui: {
          ...state.ui,
          saving: true,
        },
      };

    case 'COMPLETE_SAVING':
      return {
        ...state,
        ui: {
          ...state.ui,
          saving: false,
        },
      };

    // Form reset
    case 'RESET_FORM':
      return createInitialState(action.payload?.parentWbsCode ?? state.form.parentWbsCode);

    default:
      return state;
  }
};

/**
 * Validation helper function
 * Returns errors object and boolean indicating if valid
 */
export const validateItemForm = (formData: ItemFormData): {
  isValid: boolean;
  errors: Record<string, string>
} => {
  const errors: Record<string, string> = {};

  if (!formData.name.trim()) {
    errors.name = 'Item name is required';
  }

  if (!formData.categoryId) {
    errors.categoryId = 'Category is required';
  }

  if (!formData.duration || parseFloat(formData.duration) <= 0) {
    errors.duration = 'Duration must be greater than 0';
  }

  if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
