/**
 * Report Form State Reducer
 *
 * Manages complex state for daily report form interactions
 * Replaces 6 useState hooks with a single useReducer
 *
 * State managed:
 * - Dialog visibility
 * - Selected item
 * - Form inputs (quantity, notes)
 * - Warning dialogs
 * - Pending data
 */

import ItemModel from '../../../../models/ItemModel';

// ==================== State Interface ====================

export interface ReportFormState {
  // Dialog state
  dialogVisible: boolean;

  // Selected item
  selectedItem: ItemModel | null;

  // Form inputs
  form: {
    quantityInput: string;
    notesInput: string;
  };

  // Warning dialogs
  showExceedsWarning: boolean;
  pendingQuantity: number;
}

// ==================== Action Types ====================

export type ReportFormAction =
  // Dialog actions
  | { type: 'OPEN_DIALOG'; payload: { item: ItemModel } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_DIALOG_VISIBLE'; payload: boolean }

  // Form field actions
  | { type: 'SET_QUANTITY_INPUT'; payload: string }
  | { type: 'SET_NOTES_INPUT'; payload: string }
  | { type: 'INCREMENT_QUANTITY'; payload: number }

  // Warning dialog actions
  | { type: 'SHOW_EXCEEDS_WARNING'; payload: number }
  | { type: 'HIDE_EXCEEDS_WARNING' }
  | { type: 'SET_SHOW_EXCEEDS_WARNING'; payload: boolean }

  // Reset action
  | { type: 'RESET_FORM' };

// ==================== Initial State ====================

export const initialReportFormState: ReportFormState = {
  dialogVisible: false,
  selectedItem: null,
  form: {
    quantityInput: '',
    notesInput: '',
  },
  showExceedsWarning: false,
  pendingQuantity: 0,
};

// ==================== Reducer Function ====================

export const reportFormReducer = (
  state: ReportFormState,
  action: ReportFormAction
): ReportFormState => {
  switch (action.type) {
    // ==================== Dialog Actions ====================

    case 'OPEN_DIALOG':
      return {
        ...state,
        selectedItem: action.payload.item,
        dialogVisible: true,
        form: {
          quantityInput: action.payload.item.completedQuantity.toString(),
          notesInput: '',
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialogVisible: false,
        selectedItem: null,
        form: {
          quantityInput: '',
          notesInput: '',
        },
        showExceedsWarning: false,
        pendingQuantity: 0,
      };

    case 'SET_DIALOG_VISIBLE':
      return {
        ...state,
        dialogVisible: action.payload,
      };

    // ==================== Form Field Actions ====================

    case 'SET_QUANTITY_INPUT':
      return {
        ...state,
        form: {
          ...state.form,
          quantityInput: action.payload,
        },
      };

    case 'SET_NOTES_INPUT':
      return {
        ...state,
        form: {
          ...state.form,
          notesInput: action.payload,
        },
      };

    case 'INCREMENT_QUANTITY': {
      const currentValue = parseFloat(state.form.quantityInput) || 0;
      const newValue = Math.max(0, currentValue + action.payload);
      return {
        ...state,
        form: {
          ...state.form,
          quantityInput: newValue.toString(),
        },
      };
    }

    // ==================== Warning Dialog Actions ====================

    case 'SHOW_EXCEEDS_WARNING':
      return {
        ...state,
        showExceedsWarning: true,
        pendingQuantity: action.payload,
      };

    case 'HIDE_EXCEEDS_WARNING':
      return {
        ...state,
        showExceedsWarning: false,
      };

    case 'SET_SHOW_EXCEEDS_WARNING':
      return {
        ...state,
        showExceedsWarning: action.payload,
      };

    // ==================== Reset Action ====================

    case 'RESET_FORM':
      return initialReportFormState;

    // ==================== Default ====================

    default:
      return state;
  }
};
