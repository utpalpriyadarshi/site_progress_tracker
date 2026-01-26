/**
 * Key Date Management State Reducer
 *
 * Manages state for the Key Date Management screen.
 * Follows the pattern established in milestoneTrackingReducer.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import KeyDateModel, { KeyDateCategory, KeyDateStatus } from '../../../../models/KeyDateModel';

// ==================== State Interface ====================

export interface KeyDateManagementState {
  ui: {
    editDialogVisible: boolean;
    progressDialogVisible: boolean;
    deleteDialogVisible: boolean;
    filterMenuVisible: boolean;
    snackbarVisible: boolean;
    snackbarMessage: string;
    snackbarType: 'success' | 'error';
  };
  filters: {
    searchQuery: string;
    categoryFilter: KeyDateCategory | 'all';
    statusFilter: KeyDateStatus | 'all';
  };
  dialog: {
    editingKeyDate: KeyDateModel | null;
    keyDateToDelete: KeyDateModel | null;
  };
  form: {
    code: string;
    category: KeyDateCategory;
    categoryName: string;
    description: string;
    targetDays: string;
    targetDate: Date | undefined;
    status: KeyDateStatus;
    progressPercentage: string;
    delayDamagesInitial: string;
    delayDamagesExtended: string;
    delayDamagesSpecial: string;
    sequenceOrder: string;
    dependencies: string;
  };
  progressForm: {
    progressPercentage: string;
    status: KeyDateStatus;
    actualDate: Date | undefined;
    notes: string;
  };
}

// ==================== Action Types ====================

export type KeyDateManagementAction =
  // UI Actions
  | { type: 'OPEN_ADD_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: { keyDate: KeyDateModel } }
  | { type: 'CLOSE_EDIT_DIALOG' }
  | { type: 'OPEN_PROGRESS_DIALOG'; payload: { keyDate: KeyDateModel } }
  | { type: 'CLOSE_PROGRESS_DIALOG' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: { keyDate: KeyDateModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'TOGGLE_FILTER_MENU' }

  // Filter Actions
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CATEGORY_FILTER'; payload: KeyDateCategory | 'all' }
  | { type: 'SET_STATUS_FILTER'; payload: KeyDateStatus | 'all' }
  | { type: 'CLEAR_FILTERS' }

  // Form Field Actions
  | { type: 'SET_FORM_CODE'; payload: string }
  | { type: 'SET_FORM_CATEGORY'; payload: KeyDateCategory }
  | { type: 'SET_FORM_CATEGORY_NAME'; payload: string }
  | { type: 'SET_FORM_DESCRIPTION'; payload: string }
  | { type: 'SET_FORM_TARGET_DAYS'; payload: string }
  | { type: 'SET_FORM_TARGET_DATE'; payload: Date | undefined }
  | { type: 'SET_FORM_STATUS'; payload: KeyDateStatus }
  | { type: 'SET_FORM_PROGRESS'; payload: string }
  | { type: 'SET_FORM_DAMAGES_INITIAL'; payload: string }
  | { type: 'SET_FORM_DAMAGES_EXTENDED'; payload: string }
  | { type: 'SET_FORM_DAMAGES_SPECIAL'; payload: string }
  | { type: 'SET_FORM_SEQUENCE'; payload: string }
  | { type: 'SET_FORM_DEPENDENCIES'; payload: string }

  // Progress Form Actions
  | { type: 'SET_PROGRESS_PERCENTAGE'; payload: string }
  | { type: 'SET_PROGRESS_STATUS'; payload: KeyDateStatus }
  | { type: 'SET_PROGRESS_ACTUAL_DATE'; payload: Date | undefined }
  | { type: 'SET_PROGRESS_NOTES'; payload: string }

  // Snackbar Actions
  | { type: 'SHOW_SNACKBAR'; payload: { message: string; type?: 'success' | 'error' } }
  | { type: 'HIDE_SNACKBAR' };

// ==================== Initial State ====================

const getDefaultFormState = (): KeyDateManagementState['form'] => ({
  code: '',
  category: 'G',
  categoryName: 'General',
  description: '',
  targetDays: '',
  targetDate: undefined,
  status: 'not_started',
  progressPercentage: '0',
  delayDamagesInitial: '1',
  delayDamagesExtended: '10',
  delayDamagesSpecial: '',
  sequenceOrder: '1',
  dependencies: '',
});

const getDefaultProgressFormState = (): KeyDateManagementState['progressForm'] => ({
  progressPercentage: '0',
  status: 'not_started',
  actualDate: undefined,
  notes: '',
});

export const createKeyDateInitialState = (): KeyDateManagementState => ({
  ui: {
    editDialogVisible: false,
    progressDialogVisible: false,
    deleteDialogVisible: false,
    filterMenuVisible: false,
    snackbarVisible: false,
    snackbarMessage: '',
    snackbarType: 'success',
  },
  filters: {
    searchQuery: '',
    categoryFilter: 'all',
    statusFilter: 'all',
  },
  dialog: {
    editingKeyDate: null,
    keyDateToDelete: null,
  },
  form: getDefaultFormState(),
  progressForm: getDefaultProgressFormState(),
});

// ==================== Helper Functions ====================

const populateFormFromKeyDate = (keyDate: KeyDateModel): KeyDateManagementState['form'] => ({
  code: keyDate.code,
  category: keyDate.category,
  categoryName: keyDate.categoryName,
  description: keyDate.description,
  targetDays: keyDate.targetDays.toString(),
  targetDate: keyDate.targetDate ? new Date(keyDate.targetDate) : undefined,
  status: keyDate.status,
  progressPercentage: keyDate.progressPercentage.toString(),
  delayDamagesInitial: keyDate.delayDamagesInitial.toString(),
  delayDamagesExtended: keyDate.delayDamagesExtended.toString(),
  delayDamagesSpecial: keyDate.delayDamagesSpecial || '',
  sequenceOrder: keyDate.sequenceOrder.toString(),
  dependencies: keyDate.dependencies || '',
});

const populateProgressFormFromKeyDate = (
  keyDate: KeyDateModel
): KeyDateManagementState['progressForm'] => ({
  progressPercentage: keyDate.progressPercentage.toString(),
  status: keyDate.status,
  actualDate: keyDate.actualDate ? new Date(keyDate.actualDate) : undefined,
  notes: '',
});

// ==================== Reducer ====================

export const keyDateReducer = (
  state: KeyDateManagementState,
  action: KeyDateManagementAction
): KeyDateManagementState => {
  switch (action.type) {
    // UI Actions
    case 'OPEN_ADD_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, editDialogVisible: true },
        dialog: { ...state.dialog, editingKeyDate: null },
        form: getDefaultFormState(),
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, editDialogVisible: true },
        dialog: { ...state.dialog, editingKeyDate: action.payload.keyDate },
        form: populateFormFromKeyDate(action.payload.keyDate),
      };

    case 'CLOSE_EDIT_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, editDialogVisible: false },
        dialog: { ...state.dialog, editingKeyDate: null },
      };

    case 'OPEN_PROGRESS_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, progressDialogVisible: true },
        dialog: { ...state.dialog, editingKeyDate: action.payload.keyDate },
        progressForm: populateProgressFormFromKeyDate(action.payload.keyDate),
      };

    case 'CLOSE_PROGRESS_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, progressDialogVisible: false },
      };

    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, deleteDialogVisible: true },
        dialog: { ...state.dialog, keyDateToDelete: action.payload.keyDate },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, deleteDialogVisible: false },
        dialog: { ...state.dialog, keyDateToDelete: null },
      };

    case 'TOGGLE_FILTER_MENU':
      return {
        ...state,
        ui: { ...state.ui, filterMenuVisible: !state.ui.filterMenuVisible },
      };

    // Filter Actions
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: { ...state.filters, searchQuery: action.payload },
      };

    case 'SET_CATEGORY_FILTER':
      return {
        ...state,
        filters: { ...state.filters, categoryFilter: action.payload },
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        filters: { ...state.filters, statusFilter: action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          searchQuery: '',
          categoryFilter: 'all',
          statusFilter: 'all',
        },
      };

    // Form Field Actions
    case 'SET_FORM_CODE':
      return { ...state, form: { ...state.form, code: action.payload } };

    case 'SET_FORM_CATEGORY':
      return { ...state, form: { ...state.form, category: action.payload } };

    case 'SET_FORM_CATEGORY_NAME':
      return { ...state, form: { ...state.form, categoryName: action.payload } };

    case 'SET_FORM_DESCRIPTION':
      return { ...state, form: { ...state.form, description: action.payload } };

    case 'SET_FORM_TARGET_DAYS':
      return { ...state, form: { ...state.form, targetDays: action.payload } };

    case 'SET_FORM_TARGET_DATE':
      return { ...state, form: { ...state.form, targetDate: action.payload } };

    case 'SET_FORM_STATUS':
      return { ...state, form: { ...state.form, status: action.payload } };

    case 'SET_FORM_PROGRESS':
      return { ...state, form: { ...state.form, progressPercentage: action.payload } };

    case 'SET_FORM_DAMAGES_INITIAL':
      return { ...state, form: { ...state.form, delayDamagesInitial: action.payload } };

    case 'SET_FORM_DAMAGES_EXTENDED':
      return { ...state, form: { ...state.form, delayDamagesExtended: action.payload } };

    case 'SET_FORM_DAMAGES_SPECIAL':
      return { ...state, form: { ...state.form, delayDamagesSpecial: action.payload } };

    case 'SET_FORM_SEQUENCE':
      return { ...state, form: { ...state.form, sequenceOrder: action.payload } };

    case 'SET_FORM_DEPENDENCIES':
      return { ...state, form: { ...state.form, dependencies: action.payload } };

    // Progress Form Actions
    case 'SET_PROGRESS_PERCENTAGE':
      return { ...state, progressForm: { ...state.progressForm, progressPercentage: action.payload } };

    case 'SET_PROGRESS_STATUS':
      return { ...state, progressForm: { ...state.progressForm, status: action.payload } };

    case 'SET_PROGRESS_ACTUAL_DATE':
      return { ...state, progressForm: { ...state.progressForm, actualDate: action.payload } };

    case 'SET_PROGRESS_NOTES':
      return { ...state, progressForm: { ...state.progressForm, notes: action.payload } };

    // Snackbar Actions
    case 'SHOW_SNACKBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          snackbarVisible: true,
          snackbarMessage: action.payload.message,
          snackbarType: action.payload.type || 'success',
        },
      };

    case 'HIDE_SNACKBAR':
      return {
        ...state,
        ui: { ...state.ui, snackbarVisible: false },
      };

    default:
      return state;
  }
};

// ==================== Selectors ====================

export const selectIsEditing = (state: KeyDateManagementState): boolean =>
  state.dialog.editingKeyDate !== null;

export const selectHasActiveFilters = (state: KeyDateManagementState): boolean =>
  state.filters.searchQuery !== '' ||
  state.filters.categoryFilter !== 'all' ||
  state.filters.statusFilter !== 'all';

// ==================== Validators ====================

export const validateKeyDateForm = (form: KeyDateManagementState['form']): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!form.code.trim()) {
    errors.code = 'Code is required';
  }

  if (!form.description.trim()) {
    errors.description = 'Description is required';
  }

  const targetDays = parseInt(form.targetDays, 10);
  if (isNaN(targetDays) || targetDays < 0) {
    errors.targetDays = 'Target days must be a positive number';
  }

  const progress = parseFloat(form.progressPercentage);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    errors.progressPercentage = 'Progress must be between 0 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateProgressForm = (form: KeyDateManagementState['progressForm']): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  const progress = parseFloat(form.progressPercentage);
  if (isNaN(progress) || progress < 0 || progress > 100) {
    errors.progressPercentage = 'Progress must be between 0 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
