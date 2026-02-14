/**
 * Design RFQ Management State Management
 *
 * Consolidates state from multiple hooks and local state:
 * - useDesignRfqs (rfqs, doorsPackages, loading)
 * - useRfqFilters (searchQuery, filterStatus, filteredRfqs)
 * - Local state (dialog visibility, form fields)
 *
 * Reduction: 11 useState → 1 useReducer (91% reduction)
 */

import { DesignRfq, DoorsPackage } from '../../types/DesignRfqTypes';

/**
 * Form data for creating new RFQ
 */
export interface RfqFormData {
  title: string;
  description: string;
  doorsPackageId: string;
  expectedDeliveryDays: string;
}

/**
 * Main state interface
 */
export interface DesignRfqManagementState {
  ui: {
    loading: boolean;
    dialogVisible: boolean;
    editingRfqId: string | null;
  };
  data: {
    rfqs: DesignRfq[];
    doorsPackages: DoorsPackage[];
    filteredRfqs: DesignRfq[];
  };
  filters: {
    searchQuery: string;
    status: string | null;
  };
  form: RfqFormData;
}

/**
 * Action types
 */
export type DesignRfqManagementAction =
  // Loading
  | { type: 'START_LOADING' }
  | { type: 'COMPLETE_LOADING' }

  // Data operations
  | { type: 'SET_RFQS'; payload: { rfqs: DesignRfq[] } }
  | { type: 'SET_DOORS_PACKAGES'; payload: { packages: DoorsPackage[] } }
  | { type: 'ADD_RFQ'; payload: { rfq: DesignRfq } }
  | { type: 'UPDATE_RFQ'; payload: { rfq: DesignRfq } }
  | { type: 'DELETE_RFQ'; payload: { rfqId: string } }

  // Dialog management
  | { type: 'OPEN_DIALOG'; payload?: { editingRfqId?: string } }
  | { type: 'CLOSE_DIALOG' }

  // Form management
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof RfqFormData; value: string } }
  | { type: 'SET_FORM'; payload: Partial<RfqFormData> }
  | { type: 'RESET_FORM' }

  // Filter management
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_FILTER_STATUS'; payload: { status: string | null } }
  | { type: 'APPLY_FILTERS' };

/**
 * Create initial state
 */
export const createInitialState = (): DesignRfqManagementState => ({
  ui: {
    loading: true,
    dialogVisible: false,
    editingRfqId: null,
  },
  data: {
    rfqs: [],
    doorsPackages: [],
    filteredRfqs: [],
  },
  filters: {
    searchQuery: '',
    status: null,
  },
  form: {
    title: '',
    description: '',
    doorsPackageId: '',
    expectedDeliveryDays: '30',
  },
});

/**
 * Apply filters to RFQs
 */
const applyFiltersToRfqs = (
  rfqs: DesignRfq[],
  searchQuery: string,
  status: string | null
): DesignRfq[] => {
  let filtered = [...rfqs];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (rfq) =>
        rfq.rfqNumber.toLowerCase().includes(query) ||
        rfq.title.toLowerCase().includes(query) ||
        rfq.doorsId.toLowerCase().includes(query)
    );
  }

  // Apply status filter
  if (status) {
    filtered = filtered.filter((rfq) => rfq.status === status);
  }

  return filtered;
};

/**
 * Design RFQ Management Reducer
 */
export const designRfqManagementReducer = (
  state: DesignRfqManagementState,
  action: DesignRfqManagementAction
): DesignRfqManagementState => {
  switch (action.type) {
    // Loading
    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'COMPLETE_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
      };

    // Data operations
    case 'SET_RFQS': {
      const filteredRfqs = applyFiltersToRfqs(
        action.payload.rfqs,
        state.filters.searchQuery,
        state.filters.status
      );
      return {
        ...state,
        data: {
          ...state.data,
          rfqs: action.payload.rfqs,
          filteredRfqs,
        },
      };
    }

    case 'SET_DOORS_PACKAGES':
      return {
        ...state,
        data: {
          ...state.data,
          doorsPackages: action.payload.packages,
        },
      };

    case 'ADD_RFQ': {
      const newRfqs = [...state.data.rfqs, action.payload.rfq];
      const filteredRfqs = applyFiltersToRfqs(
        newRfqs,
        state.filters.searchQuery,
        state.filters.status
      );
      return {
        ...state,
        data: {
          ...state.data,
          rfqs: newRfqs,
          filteredRfqs,
        },
      };
    }

    case 'UPDATE_RFQ': {
      const updatedRfqs = state.data.rfqs.map((rfq) =>
        rfq.id === action.payload.rfq.id ? action.payload.rfq : rfq
      );
      const filteredRfqs = applyFiltersToRfqs(
        updatedRfqs,
        state.filters.searchQuery,
        state.filters.status
      );
      return {
        ...state,
        data: {
          ...state.data,
          rfqs: updatedRfqs,
          filteredRfqs,
        },
      };
    }

    case 'DELETE_RFQ': {
      const filteredRfqsAfterDelete = state.data.rfqs.filter(
        (rfq) => rfq.id !== action.payload.rfqId
      );
      const filteredRfqs = applyFiltersToRfqs(
        filteredRfqsAfterDelete,
        state.filters.searchQuery,
        state.filters.status
      );
      return {
        ...state,
        data: {
          ...state.data,
          rfqs: filteredRfqsAfterDelete,
          filteredRfqs,
        },
      };
    }

    // Dialog management
    case 'OPEN_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: true,
          editingRfqId: action.payload?.editingRfqId || null,
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: false,
          editingRfqId: null,
        },
        form: createInitialState().form,
      };

    // Form management
    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'SET_FORM':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: createInitialState().form,
      };

    // Filter management
    case 'SET_SEARCH_QUERY': {
      const filteredRfqs = applyFiltersToRfqs(
        state.data.rfqs,
        action.payload.query,
        state.filters.status
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload.query,
        },
        data: {
          ...state.data,
          filteredRfqs,
        },
      };
    }

    case 'SET_FILTER_STATUS': {
      const filteredRfqs = applyFiltersToRfqs(
        state.data.rfqs,
        state.filters.searchQuery,
        action.payload.status
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          status: action.payload.status,
        },
        data: {
          ...state.data,
          filteredRfqs,
        },
      };
    }

    case 'APPLY_FILTERS': {
      const filteredRfqs = applyFiltersToRfqs(
        state.data.rfqs,
        state.filters.searchQuery,
        state.filters.status
      );
      return {
        ...state,
        data: {
          ...state.data,
          filteredRfqs,
        },
      };
    }

    default:
      return state;
  }
};
