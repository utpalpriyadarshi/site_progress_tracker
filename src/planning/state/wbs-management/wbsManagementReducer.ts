/**
 * WBS Management State Management
 *
 * Consolidates state from WBSManagementScreen:
 * - Selection state (selectedSite, selectedPhase)
 * - Data state (items, loading)
 * - Delete dialog state (showDeleteDialog, itemToDelete)
 * - Filter/Search/Sort state (searchQuery, selectedStatus, showCriticalPathOnly, sortBy, sortDirection)
 *
 * Reduction: 11 useState → 1 useReducer (91% reduction)
 */

import SiteModel from '../../../../models/SiteModel';
import ItemModel, { ProjectPhase } from '../../../../models/ItemModel';

export type SortBy = 'wbs' | 'name' | 'duration' | 'progress';
export type SortDirection = 'asc' | 'desc';

export interface WBSManagementState {
  ui: {
    loading: boolean;
    showDeleteDialog: boolean;
  };
  selection: {
    selectedSite: SiteModel | null;
    selectedPhase: ProjectPhase | 'all';
  };
  data: {
    items: ItemModel[];
    itemToDelete: ItemModel | null;
  };
  filters: {
    searchQuery: string;
    selectedStatus: string[];
    showCriticalPathOnly: boolean;
  };
  sort: {
    sortBy: SortBy;
    sortDirection: SortDirection;
  };
}

export type WBSManagementAction =
  // Selection actions
  | { type: 'SET_SELECTED_SITE'; payload: { site: SiteModel | null } }
  | { type: 'SET_SELECTED_PHASE'; payload: { phase: ProjectPhase | 'all' } }

  // Data loading actions
  | { type: 'START_LOADING' }
  | { type: 'SET_ITEMS'; payload: { items: ItemModel[] } }
  | { type: 'LOADING_ERROR' }

  // Delete dialog actions
  | { type: 'OPEN_DELETE_DIALOG'; payload: { item: ItemModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'CONFIRM_DELETE' }

  // Filter actions
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_SELECTED_STATUS'; payload: { status: string[] } }
  | { type: 'TOGGLE_CRITICAL_PATH_FILTER' }
  | { type: 'CLEAR_FILTERS' }

  // Sort actions
  | { type: 'SET_SORT_BY'; payload: { sortBy: SortBy } }
  | { type: 'SET_SORT_DIRECTION'; payload: { direction: SortDirection } }
  | { type: 'TOGGLE_SORT_DIRECTION' };

/**
 * Create initial state for WBS management
 */
export const createInitialState = (): WBSManagementState => ({
  ui: {
    loading: false,
    showDeleteDialog: false,
  },
  selection: {
    selectedSite: null,
    selectedPhase: 'all',
  },
  data: {
    items: [],
    itemToDelete: null,
  },
  filters: {
    searchQuery: '',
    selectedStatus: ['all'],
    showCriticalPathOnly: false,
  },
  sort: {
    sortBy: 'wbs',
    sortDirection: 'asc',
  },
});

/**
 * WBS Management Reducer
 */
export const wbsManagementReducer = (
  state: WBSManagementState,
  action: WBSManagementAction
): WBSManagementState => {
  switch (action.type) {
    // Selection actions
    case 'SET_SELECTED_SITE':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedSite: action.payload.site,
        },
        // Clear items when site changes
        data: {
          ...state.data,
          items: [],
        },
      };

    case 'SET_SELECTED_PHASE':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPhase: action.payload.phase,
        },
      };

    // Data loading actions
    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'SET_ITEMS':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
        data: {
          ...state.data,
          items: action.payload.items,
        },
      };

    case 'LOADING_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
        data: {
          ...state.data,
          items: [],
        },
      };

    // Delete dialog actions
    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDeleteDialog: true,
        },
        data: {
          ...state.data,
          itemToDelete: action.payload.item,
        },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDeleteDialog: false,
        },
        data: {
          ...state.data,
          itemToDelete: null,
        },
      };

    case 'CONFIRM_DELETE':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDeleteDialog: false,
        },
        data: {
          ...state.data,
          itemToDelete: null,
        },
      };

    // Filter actions
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload.query,
        },
      };

    case 'SET_SELECTED_STATUS':
      return {
        ...state,
        filters: {
          ...state.filters,
          selectedStatus: action.payload.status,
        },
      };

    case 'TOGGLE_CRITICAL_PATH_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          showCriticalPathOnly: !state.filters.showCriticalPathOnly,
        },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          searchQuery: '',
          selectedStatus: ['all'],
          showCriticalPathOnly: false,
        },
      };

    // Sort actions
    case 'SET_SORT_BY':
      return {
        ...state,
        sort: {
          ...state.sort,
          sortBy: action.payload.sortBy,
        },
      };

    case 'SET_SORT_DIRECTION':
      return {
        ...state,
        sort: {
          ...state.sort,
          sortDirection: action.payload.direction,
        },
      };

    case 'TOGGLE_SORT_DIRECTION':
      return {
        ...state,
        sort: {
          ...state.sort,
          sortDirection: state.sort.sortDirection === 'asc' ? 'desc' : 'asc',
        },
      };

    default:
      return state;
  }
};
