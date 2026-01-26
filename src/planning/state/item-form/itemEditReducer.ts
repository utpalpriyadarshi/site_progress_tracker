/**
 * Item Edit State Management
 *
 * Consolidates state from multiple hooks:
 * - useItemEdit (item, loading, isLocked, saving)
 * - useItemForm (formData, errors)
 * - UI state (menus, date pickers)
 *
 * Reduction: 8 useState → 1 useReducer (88% reduction)
 */

import ItemModel, { ProjectPhase } from '../../../../models/ItemModel';

export interface ItemEditFormData {
  name: string;
  categoryId: string;
  phase: ProjectPhase;
  duration: string;
  startDate: Date;
  endDate: Date;
  unit: string;
  quantity: string;
  completedQuantity: string;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
  keyDateId: string | null; // Link to Key Date (Phase 5c)
}

export interface ItemEditState {
  ui: {
    loading: boolean;
    saving: boolean;
    isLocked: boolean;
    categoryMenuVisible: boolean;
    phaseMenuVisible: boolean;
    showDatePicker: boolean;
    datePickerMode: 'start' | 'end' | null;
  };
  data: {
    originalItem: ItemModel | null;
  };
  form: ItemEditFormData;
  validation: {
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    hasChanges: boolean;
  };
}

export type ItemEditAction =
  // Item loading
  | { type: 'START_LOADING' }
  | { type: 'SET_ITEM_DATA'; payload: { item: ItemModel } }
  | { type: 'LOADING_ERROR' }

  // Form field updates
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof ItemEditFormData; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<ItemEditFormData> }
  | { type: 'UPDATE_NUMERIC_FIELD'; payload: { field: keyof ItemEditFormData; value: string } }

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

  // Save operations
  | { type: 'START_SAVING' }
  | { type: 'COMPLETE_SAVING' }

  // Reset operations
  | { type: 'RESET_TO_ORIGINAL' };

/**
 * Create initial state for item editing
 */
export const createInitialState = (): ItemEditState => ({
  ui: {
    loading: true,
    saving: false,
    isLocked: false,
    categoryMenuVisible: false,
    phaseMenuVisible: false,
    showDatePicker: false,
    datePickerMode: null,
  },
  data: {
    originalItem: null,
  },
  form: {
    name: '',
    categoryId: '',
    phase: 'design',
    duration: '',
    startDate: new Date(),
    endDate: new Date(),
    unit: 'Set',
    quantity: '1',
    completedQuantity: '0',
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
    hasChanges: false,
  },
});

/**
 * Helper: Convert ItemModel to form data
 */
const itemToFormData = (item: ItemModel): ItemEditFormData => {
  const durationDays = Math.ceil(
    (item.plannedEndDate - item.plannedStartDate) / (1000 * 60 * 60 * 24)
  );

  return {
    name: item.name,
    categoryId: item.categoryId,
    phase: item.projectPhase,
    duration: durationDays.toString(),
    startDate: new Date(item.plannedStartDate),
    endDate: new Date(item.plannedEndDate),
    unit: item.unitOfMeasurement || 'Set',
    quantity: item.plannedQuantity.toString(),
    completedQuantity: item.completedQuantity.toString(),
    isMilestone: item.isMilestone,
    isCriticalPath: item.isCriticalPath,
    floatDays: (item.floatDays || 0).toString(),
    dependencyRisk: item.dependencyRisk || 'low',
    riskNotes: item.riskNotes || '',
    keyDateId: item.keyDateId || null,
  };
};

/**
 * Helper: Check if form has changes from original
 */
const hasFormChanges = (formData: ItemEditFormData, originalItem: ItemModel | null): boolean => {
  if (!originalItem) return false;

  const originalFormData = itemToFormData(originalItem);

  // Compare each field
  return (
    formData.name !== originalFormData.name ||
    formData.categoryId !== originalFormData.categoryId ||
    formData.phase !== originalFormData.phase ||
    formData.duration !== originalFormData.duration ||
    formData.unit !== originalFormData.unit ||
    formData.quantity !== originalFormData.quantity ||
    formData.completedQuantity !== originalFormData.completedQuantity ||
    formData.isMilestone !== originalFormData.isMilestone ||
    formData.isCriticalPath !== originalFormData.isCriticalPath ||
    formData.floatDays !== originalFormData.floatDays ||
    formData.dependencyRisk !== originalFormData.dependencyRisk ||
    formData.riskNotes !== originalFormData.riskNotes ||
    formData.keyDateId !== originalFormData.keyDateId ||
    formData.startDate.getTime() !== originalFormData.startDate.getTime() ||
    formData.endDate.getTime() !== originalFormData.endDate.getTime()
  );
};

/**
 * Item Edit Reducer
 */
export const itemEditReducer = (
  state: ItemEditState,
  action: ItemEditAction
): ItemEditState => {
  switch (action.type) {
    // Item loading
    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'SET_ITEM_DATA': {
      const { item } = action.payload;
      const formData = itemToFormData(item);

      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
          isLocked: item.isBaselineLocked,
        },
        data: {
          originalItem: item,
        },
        form: formData,
        validation: {
          ...state.validation,
          hasChanges: false,
        },
      };
    }

    case 'LOADING_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
      };

    // Form field updates
    case 'UPDATE_FORM_FIELD': {
      const { field, value } = action.payload;
      const newFormData = {
        ...state.form,
        [field]: value,
      };

      const newErrors = { ...state.validation.errors };
      delete newErrors[field]; // Clear error when field is updated

      return {
        ...state,
        form: newFormData,
        validation: {
          ...state.validation,
          errors: newErrors,
          hasChanges: hasFormChanges(newFormData, state.data.originalItem),
        },
      };
    }

    case 'UPDATE_FORM_DATA': {
      const newFormData = {
        ...state.form,
        ...action.payload,
      };

      return {
        ...state,
        form: newFormData,
        validation: {
          ...state.validation,
          hasChanges: hasFormChanges(newFormData, state.data.originalItem),
        },
      };
    }

    case 'UPDATE_NUMERIC_FIELD': {
      const { field, value } = action.payload;
      // Only allow positive numbers and empty string
      if (value === '' || /^\d+$/.test(value)) {
        const newFormData = {
          ...state.form,
          [field]: value,
        };

        const newErrors = { ...state.validation.errors };
        delete newErrors[field];

        return {
          ...state,
          form: newFormData,
          validation: {
            ...state.validation,
            errors: newErrors,
            hasChanges: hasFormChanges(newFormData, state.data.originalItem),
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
          ...state.validation,
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
      const durationDays = parseInt(state.form.duration) || 1;
      const endDate = new Date(date.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const newFormData = {
        ...state.form,
        startDate: date,
        endDate: endDate,
      };

      return {
        ...state,
        form: newFormData,
        validation: {
          ...state.validation,
          hasChanges: hasFormChanges(newFormData, state.data.originalItem),
        },
      };
    }

    case 'SET_END_DATE': {
      const { date } = action.payload;
      const durationMs = date.getTime() - state.form.startDate.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));
      const newFormData = {
        ...state.form,
        endDate: date,
        duration: durationDays.toString(),
      };

      return {
        ...state,
        form: newFormData,
        validation: {
          ...state.validation,
          hasChanges: hasFormChanges(newFormData, state.data.originalItem),
        },
      };
    }

    case 'SET_DURATION': {
      const { duration } = action.payload;
      if (duration === '' || /^\d+$/.test(duration)) {
        const durationDays = parseInt(duration) || 1;
        const endDate = new Date(state.form.startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const newFormData = {
          ...state.form,
          duration: duration,
          endDate: endDate,
        };

        return {
          ...state,
          form: newFormData,
          validation: {
            ...state.validation,
            hasChanges: hasFormChanges(newFormData, state.data.originalItem),
          },
        };
      }
      return state;
    }

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
        validation: {
          ...state.validation,
          hasChanges: false,
        },
      };

    // Reset operations
    case 'RESET_TO_ORIGINAL': {
      if (!state.data.originalItem) return state;

      return {
        ...state,
        form: itemToFormData(state.data.originalItem),
        validation: {
          errors: {},
          touched: {},
          hasChanges: false,
        },
      };
    }

    default:
      return state;
  }
};

/**
 * Validation helper function
 * Returns errors object and boolean indicating if valid
 */
export const validateItemEditForm = (formData: ItemEditFormData): {
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

/**
 * Progress calculation helper
 */
export const calculateProgress = (formData: ItemEditFormData): number => {
  const qty = parseFloat(formData.quantity);
  const completedQty = parseFloat(formData.completedQuantity);

  if (qty > 0) {
    return Math.min(100, Math.round((completedQty / qty) * 100));
  }

  return 0;
};
