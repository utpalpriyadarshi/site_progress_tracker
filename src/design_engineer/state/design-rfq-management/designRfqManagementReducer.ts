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

import { DesignRfq, DoorsPackage, Domain } from '../../types/DesignRfqTypes';

/**
 * Form data for creating new RFQ
 */
export interface RfqFormData {
  title: string;
  description: string;
  domainId: string;
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
    quotesSheetVisible: boolean;
    selectedRfqIdForQuotes: string | null;
    bulkSelectMode: boolean;
    selectedRfqIds: string[];
    filterMenuVisible: boolean;
    award: { visible: boolean; rfqId: string | null; value: string };
    cancel: { visible: boolean; rfqId: string | null; reason: string };
  };
  data: {
    rfqs: DesignRfq[];
    doorsPackages: DoorsPackage[];
    domains: Domain[];
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
  | { type: 'SET_DOMAINS'; payload: { domains: Domain[] } }
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

  // Quotes sheet
  | { type: 'OPEN_QUOTES_SHEET'; payload: { rfqId: string } }
  | { type: 'CLOSE_QUOTES_SHEET' }

  // Bulk operations
  | { type: 'TOGGLE_BULK_MODE' }
  | { type: 'TOGGLE_RFQ_SELECTION'; payload: { rfqId: string } }
  | { type: 'SELECT_ALL_RFQS' }
  | { type: 'CLEAR_SELECTION' }

  // Filter management
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_FILTER_STATUS'; payload: { status: string | null } }
  | { type: 'APPLY_FILTERS' }

  // Filter menu
  | { type: 'OPEN_FILTER_MENU' }
  | { type: 'CLOSE_FILTER_MENU' }

  // Award dialog
  | { type: 'OPEN_AWARD_DIALOG'; payload: { rfqId: string } }
  | { type: 'SET_AWARD_VALUE'; payload: { value: string } }
  | { type: 'CLOSE_AWARD_DIALOG' }

  // Cancel dialog
  | { type: 'OPEN_CANCEL_DIALOG'; payload: { rfqId: string } }
  | { type: 'SET_CANCEL_REASON'; payload: { reason: string } }
  | { type: 'CLOSE_CANCEL_DIALOG' };

/**
 * Create initial state
 */
export const createInitialState = (): DesignRfqManagementState => ({
  ui: {
    loading: true,
    dialogVisible: false,
    editingRfqId: null,
    quotesSheetVisible: false,
    selectedRfqIdForQuotes: null,
    bulkSelectMode: false,
    selectedRfqIds: [],
    filterMenuVisible: false,
    award: { visible: false, rfqId: null, value: '' },
    cancel: { visible: false, rfqId: null, reason: '' },
  },
  data: {
    rfqs: [],
    doorsPackages: [],
    domains: [],
    filteredRfqs: [],
  },
  filters: {
    searchQuery: '',
    status: null,
  },
  form: {
    title: '',
    description: '',
    domainId: '',
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

    case 'SET_DOMAINS':
      return {
        ...state,
        data: {
          ...state.data,
          domains: action.payload.domains,
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

    // Quotes sheet
    case 'OPEN_QUOTES_SHEET':
      return {
        ...state,
        ui: {
          ...state.ui,
          quotesSheetVisible: true,
          selectedRfqIdForQuotes: action.payload.rfqId,
        },
      };

    case 'CLOSE_QUOTES_SHEET':
      return {
        ...state,
        ui: {
          ...state.ui,
          quotesSheetVisible: false,
          selectedRfqIdForQuotes: null,
        },
      };

    // Bulk operations
    case 'TOGGLE_BULK_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          bulkSelectMode: !state.ui.bulkSelectMode,
          selectedRfqIds: [],
        },
      };

    case 'TOGGLE_RFQ_SELECTION': {
      const rfqId = action.payload.rfqId;
      const selectedRfqIds = state.ui.selectedRfqIds.includes(rfqId)
        ? state.ui.selectedRfqIds.filter((id) => id !== rfqId)
        : [...state.ui.selectedRfqIds, rfqId];
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedRfqIds,
        },
      };
    }

    case 'SELECT_ALL_RFQS':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedRfqIds: state.data.filteredRfqs.map((rfq) => rfq.id),
        },
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        ui: {
          ...state.ui,
          bulkSelectMode: false,
          selectedRfqIds: [],
        },
      };

    // Filter menu
    case 'OPEN_FILTER_MENU':
      return { ...state, ui: { ...state.ui, filterMenuVisible: true } };

    case 'CLOSE_FILTER_MENU':
      return { ...state, ui: { ...state.ui, filterMenuVisible: false } };

    // Award dialog
    case 'OPEN_AWARD_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, award: { visible: true, rfqId: action.payload.rfqId, value: '' } },
      };

    case 'SET_AWARD_VALUE':
      return {
        ...state,
        ui: { ...state.ui, award: { ...state.ui.award, value: action.payload.value } },
      };

    case 'CLOSE_AWARD_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, award: { visible: false, rfqId: null, value: '' } },
      };

    // Cancel dialog
    case 'OPEN_CANCEL_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, cancel: { visible: true, rfqId: action.payload.rfqId, reason: '' } },
      };

    case 'SET_CANCEL_REASON':
      return {
        ...state,
        ui: { ...state.ui, cancel: { ...state.ui.cancel, reason: action.payload.reason } },
      };

    case 'CLOSE_CANCEL_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, cancel: { visible: false, rfqId: null, reason: '' } },
      };

    default:
      return state;
  }
};
