/**
 * Budget Management Reducer
 *
 * Centralizes state management for BudgetManagementScreen
 * Following Manager and Logistics Phase 2 patterns
 */

export interface Budget {
  id: string;
  projectId: string;
  category: string;
  allocatedAmount: number;
  description: string;
  createdBy: string;
  createdAt: number;
  actualSpent?: number;
}

export interface BudgetManagementState {
  ui: {
    loading: boolean;
    showFilterMenu: boolean;
    showCreateDialog: boolean;
    showEditDialog: boolean;
  };
  data: {
    budgets: Budget[];
    filteredBudgets: Budget[];
    editingBudget: Budget | null;
  };
  filters: {
    searchQuery: string;
  };
  form: {
    category: string;
    amount: string;
    description: string;
  };
}

export type BudgetManagementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_FILTERED_BUDGETS'; payload: Budget[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_FILTER_MENU' }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: Budget }
  | { type: 'CLOSE_DIALOGS' }
  | { type: 'SET_FORM_FIELD'; payload: { field: 'category' | 'amount' | 'description'; value: string } }
  | { type: 'RESET_FORM' }
  | { type: 'SET_EDITING_BUDGET'; payload: Budget | null };

export const initialBudgetManagementState: BudgetManagementState = {
  ui: {
    loading: true,
    showFilterMenu: false,
    showCreateDialog: false,
    showEditDialog: false,
  },
  data: {
    budgets: [],
    filteredBudgets: [],
    editingBudget: null,
  },
  filters: {
    searchQuery: '',
  },
  form: {
    category: 'labor',
    amount: '',
    description: '',
  },
};

export function budgetManagementReducer(
  state: BudgetManagementState,
  action: BudgetManagementAction
): BudgetManagementState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_BUDGETS':
      return {
        ...state,
        data: {
          ...state.data,
          budgets: action.payload,
        },
      };

    case 'SET_FILTERED_BUDGETS':
      return {
        ...state,
        data: {
          ...state.data,
          filteredBudgets: action.payload,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload,
        },
      };

    case 'TOGGLE_FILTER_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          showFilterMenu: !state.ui.showFilterMenu,
        },
      };

    case 'OPEN_CREATE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: true,
        },
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showEditDialog: true,
        },
        data: {
          ...state.data,
          editingBudget: action.payload,
        },
        form: {
          category: action.payload.category,
          amount: action.payload.allocatedAmount.toString(),
          description: action.payload.description,
        },
      };

    case 'CLOSE_DIALOGS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: false,
          showEditDialog: false,
        },
        data: {
          ...state.data,
          editingBudget: null,
        },
      };

    case 'SET_FORM_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: {
          category: 'labor',
          amount: '',
          description: '',
        },
      };

    case 'SET_EDITING_BUDGET':
      return {
        ...state,
        data: {
          ...state.data,
          editingBudget: action.payload,
        },
      };

    default:
      return state;
  }
}
