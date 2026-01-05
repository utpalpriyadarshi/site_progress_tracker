/**
 * Cost Tracking Reducer
 *
 * Centralizes state management for CostTrackingScreen
 * Following Manager and Logistics Phase 2 patterns
 */

export interface Cost {
  id: string;
  projectId: string;
  poId?: string;
  category: string;
  amount: number;
  description: string;
  costDate: number;
  createdBy: string;
  createdAt: number;
}

export interface BudgetInfo {
  category: string;
  allocated: number;
}

export interface CostTrackingState {
  ui: {
    loading: boolean;
    showCreateDialog: boolean;
    showEditDialog: boolean;
    showDatePicker: boolean;
    showFilterMenu: boolean;
  };
  data: {
    costs: Cost[];
    budgets: BudgetInfo[];
    filteredCosts: Cost[];
    editingCost: Cost | null;
    totalBudgets: number;
    totalCosts: number;
    totalVariance: number;
  };
  filters: {
    searchQuery: string;
  };
  form: {
    category: string;
    amount: string;
    description: string;
    poId: string;
    costDate: Date;
  };
}

export type CostTrackingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_COSTS'; payload: Cost[] }
  | { type: 'SET_BUDGETS'; payload: BudgetInfo[] }
  | { type: 'SET_FILTERED_COSTS'; payload: Cost[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_TOTALS'; payload: { totalBudgets: number; totalCosts: number; totalVariance: number } }
  | { type: 'TOGGLE_FILTER_MENU' }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: Cost }
  | { type: 'CLOSE_DIALOGS' }
  | { type: 'SET_SHOW_DATE_PICKER'; payload: boolean }
  | { type: 'SET_FORM_FIELD'; payload: { field: 'category' | 'amount' | 'description' | 'poId'; value: string } }
  | { type: 'SET_FORM_DATE'; payload: Date }
  | { type: 'RESET_FORM' }
  | { type: 'SET_EDITING_COST'; payload: Cost | null };

export const initialCostTrackingState: CostTrackingState = {
  ui: {
    loading: true,
    showCreateDialog: false,
    showEditDialog: false,
    showDatePicker: false,
    showFilterMenu: false,
  },
  data: {
    costs: [],
    budgets: [],
    filteredCosts: [],
    editingCost: null,
    totalBudgets: 0,
    totalCosts: 0,
    totalVariance: 0,
  },
  filters: {
    searchQuery: '',
  },
  form: {
    category: 'labor',
    amount: '',
    description: '',
    poId: '',
    costDate: new Date(),
  },
};

export function costTrackingReducer(
  state: CostTrackingState,
  action: CostTrackingAction
): CostTrackingState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_COSTS':
      return {
        ...state,
        data: {
          ...state.data,
          costs: action.payload,
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

    case 'SET_FILTERED_COSTS':
      return {
        ...state,
        data: {
          ...state.data,
          filteredCosts: action.payload,
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

    case 'SET_TOTALS':
      return {
        ...state,
        data: {
          ...state.data,
          totalBudgets: action.payload.totalBudgets,
          totalCosts: action.payload.totalCosts,
          totalVariance: action.payload.totalVariance,
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
          editingCost: action.payload,
        },
        form: {
          category: action.payload.category,
          amount: action.payload.amount.toString(),
          description: action.payload.description,
          poId: action.payload.poId || '',
          costDate: new Date(action.payload.costDate),
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
          editingCost: null,
        },
      };

    case 'SET_SHOW_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDatePicker: action.payload,
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

    case 'SET_FORM_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          costDate: action.payload,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: {
          category: 'labor',
          amount: '',
          description: '',
          poId: '',
          costDate: new Date(),
        },
      };

    case 'SET_EDITING_COST':
      return {
        ...state,
        data: {
          ...state.data,
          editingCost: action.payload,
        },
      };

    default:
      return state;
  }
}
