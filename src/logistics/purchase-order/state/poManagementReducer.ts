/**
 * Purchase Order Management State Reducer
 *
 * Manages complex state for Purchase Order Management Screen
 * Replaces 13 useState hooks with a single useReducer
 *
 * State managed:
 * - UI state (loading, dialog visibility)
 * - Data state (purchase orders, filtered list, vendors, RFQs)
 * - Filter state (search query, status filter)
 * - Form state (create PO dialog fields)
 */

// ==================== Interfaces ====================

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  projectId: string;
  rfqId?: string;
  vendorId: string;
  vendorName?: string;
  orderDate: number;
  expectedDeliveryDate?: number;
  actualDeliveryDate?: number;
  status: string;
  totalAmount: number;
  description?: string;
  createdById: string;
  createdAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
}

// ==================== State Interface ====================

export interface POManagementState {
  // UI state
  ui: {
    loading: boolean;
    showCreateDialog: boolean;
  };

  // Data state
  data: {
    purchaseOrders: PurchaseOrder[];
    filteredPOs: PurchaseOrder[];
    vendors: Vendor[];
    rfqs: RFQ[];
  };

  // Filter state
  filters: {
    searchQuery: string;
    filterStatus: string | null;
  };

  // Form state (create dialog)
  form: {
    newDescription: string;
    newVendorId: string;
    newRfqId: string;
    newTotalAmount: string;
    newExpectedDeliveryDays: string;
  };
}

// ==================== Action Types ====================

export type POManagementAction =
  // UI actions
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SHOW_CREATE_DIALOG' }
  | { type: 'HIDE_CREATE_DIALOG' }

  // Data actions
  | { type: 'SET_PURCHASE_ORDERS'; payload: PurchaseOrder[] }
  | { type: 'SET_FILTERED_POS'; payload: PurchaseOrder[] }
  | { type: 'SET_VENDORS'; payload: Vendor[] }
  | { type: 'SET_RFQS'; payload: RFQ[] }
  | {
      type: 'LOAD_ALL_DATA';
      payload: {
        purchaseOrders: PurchaseOrder[];
        vendors: Vendor[];
        rfqs: RFQ[];
      };
    }

  // Filter actions
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: string | null }
  | { type: 'TOGGLE_FILTER_STATUS'; payload: string }
  | { type: 'CLEAR_FILTERS' }

  // Form field actions
  | { type: 'SET_NEW_DESCRIPTION'; payload: string }
  | { type: 'SET_NEW_VENDOR_ID'; payload: string }
  | { type: 'SET_NEW_RFQ_ID'; payload: string }
  | { type: 'SET_NEW_TOTAL_AMOUNT'; payload: string }
  | { type: 'SET_NEW_EXPECTED_DELIVERY_DAYS'; payload: string }
  | { type: 'RESET_FORM' }

  // Reset action
  | { type: 'RESET_STATE' };

// ==================== Initial State ====================

export const initialPOManagementState: POManagementState = {
  ui: {
    loading: true,
    showCreateDialog: false,
  },
  data: {
    purchaseOrders: [],
    filteredPOs: [],
    vendors: [],
    rfqs: [],
  },
  filters: {
    searchQuery: '',
    filterStatus: null,
  },
  form: {
    newDescription: '',
    newVendorId: '',
    newRfqId: '',
    newTotalAmount: '',
    newExpectedDeliveryDays: '30',
  },
};

// ==================== Reducer Function ====================

export const poManagementReducer = (
  state: POManagementState,
  action: POManagementAction
): POManagementState => {
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

    case 'SHOW_CREATE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: true,
        },
      };

    case 'HIDE_CREATE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: false,
        },
      };

    // ==================== Data Actions ====================

    case 'SET_PURCHASE_ORDERS':
      return {
        ...state,
        data: {
          ...state.data,
          purchaseOrders: action.payload,
        },
      };

    case 'SET_FILTERED_POS':
      return {
        ...state,
        data: {
          ...state.data,
          filteredPOs: action.payload,
        },
      };

    case 'SET_VENDORS':
      return {
        ...state,
        data: {
          ...state.data,
          vendors: action.payload,
        },
      };

    case 'SET_RFQS':
      return {
        ...state,
        data: {
          ...state.data,
          rfqs: action.payload,
        },
      };

    case 'LOAD_ALL_DATA':
      return {
        ...state,
        data: {
          purchaseOrders: action.payload.purchaseOrders,
          filteredPOs: action.payload.purchaseOrders,
          vendors: action.payload.vendors,
          rfqs: action.payload.rfqs,
        },
      };

    // ==================== Filter Actions ====================

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload,
        },
      };

    case 'SET_FILTER_STATUS':
      return {
        ...state,
        filters: {
          ...state.filters,
          filterStatus: action.payload,
        },
      };

    case 'TOGGLE_FILTER_STATUS':
      return {
        ...state,
        filters: {
          ...state.filters,
          filterStatus: state.filters.filterStatus === action.payload ? null : action.payload,
        },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          searchQuery: '',
          filterStatus: null,
        },
      };

    // ==================== Form Actions ====================

    case 'SET_NEW_DESCRIPTION':
      return {
        ...state,
        form: {
          ...state.form,
          newDescription: action.payload,
        },
      };

    case 'SET_NEW_VENDOR_ID':
      return {
        ...state,
        form: {
          ...state.form,
          newVendorId: action.payload,
        },
      };

    case 'SET_NEW_RFQ_ID':
      return {
        ...state,
        form: {
          ...state.form,
          newRfqId: action.payload,
        },
      };

    case 'SET_NEW_TOTAL_AMOUNT':
      return {
        ...state,
        form: {
          ...state.form,
          newTotalAmount: action.payload,
        },
      };

    case 'SET_NEW_EXPECTED_DELIVERY_DAYS':
      return {
        ...state,
        form: {
          ...state.form,
          newExpectedDeliveryDays: action.payload,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: {
          newDescription: '',
          newVendorId: '',
          newRfqId: '',
          newTotalAmount: '',
          newExpectedDeliveryDays: '30',
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_STATE':
      return initialPOManagementState;

    // ==================== Default ====================

    default:
      return state;
  }
};
