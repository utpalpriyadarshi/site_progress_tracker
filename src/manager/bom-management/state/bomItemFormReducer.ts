/**
 * BOM Item Form State Reducer
 *
 * Manages complex state for BOM item form interactions
 * Replaces 10 useState hooks with a single useReducer
 *
 * State managed:
 * - Dialog visibility and editing state
 * - Form inputs (description, category, quantity, etc.)
 * - Delete confirmation dialog
 */

import BomItemModel from '../../../../models/BomItemModel';

// ==================== State Interface ====================

export interface BomItemFormState {
  // Dialog state
  dialog: {
    visible: boolean;
    editingItem: BomItemModel | null;
  };

  // Form inputs
  form: {
    selectedBomId: string;
    itemDescription: string;
    itemCategory: 'material' | 'labor' | 'equipment' | 'subcontractor';
    itemQuantity: string;
    itemUnit: string;
    itemUnitCost: string;
    itemPhase: string;
  };

  // Delete confirmation
  deleteConfirmation: {
    visible: boolean;
    itemToDelete: BomItemModel | null;
  };
}

// ==================== Action Types ====================

export type BomItemFormAction =
  // Dialog actions
  | { type: 'OPEN_ADD_DIALOG'; payload: { bomId: string } }
  | { type: 'OPEN_EDIT_DIALOG'; payload: { item: BomItemModel } }
  | { type: 'CLOSE_DIALOG' }

  // Form field actions
  | { type: 'SET_ITEM_DESCRIPTION'; payload: string }
  | { type: 'SET_ITEM_CATEGORY'; payload: 'material' | 'labor' | 'equipment' | 'subcontractor' }
  | { type: 'SET_ITEM_QUANTITY'; payload: string }
  | { type: 'SET_ITEM_UNIT'; payload: string }
  | { type: 'SET_ITEM_UNIT_COST'; payload: string }
  | { type: 'SET_ITEM_PHASE'; payload: string }

  // Delete confirmation actions
  | { type: 'OPEN_DELETE_DIALOG'; payload: { item: BomItemModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }

  // Reset action
  | { type: 'RESET_FORM'; payload?: { bomId?: string } };

// ==================== Initial State ====================

export const initialBomItemFormState: BomItemFormState = {
  dialog: {
    visible: false,
    editingItem: null,
  },
  form: {
    selectedBomId: '',
    itemDescription: '',
    itemCategory: 'material',
    itemQuantity: '',
    itemUnit: '',
    itemUnitCost: '',
    itemPhase: '',
  },
  deleteConfirmation: {
    visible: false,
    itemToDelete: null,
  },
};

// ==================== Reducer Function ====================

export const bomItemFormReducer = (
  state: BomItemFormState,
  action: BomItemFormAction
): BomItemFormState => {
  switch (action.type) {
    // ==================== Dialog Actions ====================

    case 'OPEN_ADD_DIALOG':
      return {
        ...state,
        dialog: {
          visible: true,
          editingItem: null,
        },
        form: {
          selectedBomId: action.payload.bomId,
          itemDescription: '',
          itemCategory: 'material',
          itemQuantity: '',
          itemUnit: '',
          itemUnitCost: '',
          itemPhase: '',
        },
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        dialog: {
          visible: true,
          editingItem: action.payload.item,
        },
        form: {
          selectedBomId: action.payload.item.bomId,
          itemDescription: action.payload.item.description,
          itemCategory: (action.payload.item.category || 'material') as 'material' | 'labor' | 'equipment' | 'subcontractor',
          itemQuantity: action.payload.item.quantity.toString(),
          itemUnit: action.payload.item.unit,
          itemUnitCost: action.payload.item.unitCost.toString(),
          itemPhase: action.payload.item.phase || '',
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        dialog: {
          visible: false,
          editingItem: null,
        },
        form: initialBomItemFormState.form,
      };

    // ==================== Form Field Actions ====================

    case 'SET_ITEM_DESCRIPTION':
      return {
        ...state,
        form: {
          ...state.form,
          itemDescription: action.payload,
        },
      };

    case 'SET_ITEM_CATEGORY':
      return {
        ...state,
        form: {
          ...state.form,
          itemCategory: action.payload,
        },
      };

    case 'SET_ITEM_QUANTITY':
      return {
        ...state,
        form: {
          ...state.form,
          itemQuantity: action.payload,
        },
      };

    case 'SET_ITEM_UNIT':
      return {
        ...state,
        form: {
          ...state.form,
          itemUnit: action.payload,
        },
      };

    case 'SET_ITEM_UNIT_COST':
      return {
        ...state,
        form: {
          ...state.form,
          itemUnitCost: action.payload,
        },
      };

    case 'SET_ITEM_PHASE':
      return {
        ...state,
        form: {
          ...state.form,
          itemPhase: action.payload,
        },
      };

    // ==================== Delete Confirmation Actions ====================

    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        deleteConfirmation: {
          visible: true,
          itemToDelete: action.payload.item,
        },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        deleteConfirmation: {
          visible: false,
          itemToDelete: null,
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_FORM':
      return {
        ...initialBomItemFormState,
        form: {
          ...initialBomItemFormState.form,
          selectedBomId: action.payload?.bomId || '',
        },
      };

    // ==================== Default ====================

    default:
      return state;
  }
};
