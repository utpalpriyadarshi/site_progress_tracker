/**
 * DOORS Package Management State Management
 *
 * Consolidates state from multiple hooks and local state:
 * - useDoorsPackages (packages, sites, loading)
 * - useDoorsPackageFilters (searchQuery, filterStatus, filterCategory, filteredPackages)
 * - Local state (dialog visibility, filter menu, form fields)
 *
 * Reduction: 13 useState → 1 useReducer (92% reduction)
 */

import { DoorsPackage, Site } from '../../types/DoorsPackageTypes';

/**
 * Form data for creating/editing DOORS package
 */
export interface PackageFormData {
  doorsId: string;
  siteId: string;
  equipmentType: string;
  materialType: string;
  category: string;
  totalRequirements: string;
}

/**
 * Main state interface
 */
export interface DoorsPackageManagementState {
  ui: {
    loading: boolean;
    dialogVisible: boolean;
    filterMenuVisible: boolean;
    editingPackageId: string | null;
    copyDialogVisible: boolean;
  };
  data: {
    packages: DoorsPackage[];
    sites: Site[];
    filteredPackages: DoorsPackage[];
  };
  filters: {
    searchQuery: string;
    status: string | null;
    category: string | null;
  };
  form: PackageFormData;
}

/**
 * Action types
 */
export type DoorsPackageManagementAction =
  // Loading
  | { type: 'START_LOADING' }
  | { type: 'COMPLETE_LOADING' }

  // Data operations
  | { type: 'SET_PACKAGES'; payload: { packages: DoorsPackage[] } }
  | { type: 'SET_SITES'; payload: { sites: Site[] } }
  | { type: 'ADD_PACKAGE'; payload: { package: DoorsPackage } }
  | { type: 'ADD_PACKAGES'; payload: { packages: DoorsPackage[] } }
  | { type: 'UPDATE_PACKAGE'; payload: { package: DoorsPackage } }
  | { type: 'DELETE_PACKAGE'; payload: { packageId: string } }

  // Dialog management
  | { type: 'OPEN_DIALOG'; payload?: { editingPackageId?: string } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'OPEN_COPY_DIALOG' }
  | { type: 'CLOSE_COPY_DIALOG' }

  // Filter menu management
  | { type: 'OPEN_FILTER_MENU' }
  | { type: 'CLOSE_FILTER_MENU' }

  // Form management
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof PackageFormData; value: string } }
  | { type: 'SET_FORM'; payload: Partial<PackageFormData> }
  | { type: 'RESET_FORM' }

  // Filter management
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_FILTER_STATUS'; payload: { status: string | null } }
  | { type: 'SET_FILTER_CATEGORY'; payload: { category: string | null } }
  | { type: 'APPLY_FILTERS' };

/**
 * Create initial state
 */
export const createInitialState = (): DoorsPackageManagementState => ({
  ui: {
    loading: true,
    dialogVisible: false,
    filterMenuVisible: false,
    editingPackageId: null,
    copyDialogVisible: false,
  },
  data: {
    packages: [],
    sites: [],
    filteredPackages: [],
  },
  filters: {
    searchQuery: '',
    status: null,
    category: null,
  },
  form: {
    doorsId: '',
    siteId: '',
    equipmentType: '',
    materialType: '',
    category: '',
    totalRequirements: '100',
  },
});

/**
 * Apply filters to packages
 */
const applyFiltersToPackages = (
  packages: DoorsPackage[],
  searchQuery: string,
  status: string | null,
  category: string | null
): DoorsPackage[] => {
  let filtered = [...packages];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (pkg) =>
        pkg.doorsId.toLowerCase().includes(query) ||
        pkg.equipmentType.toLowerCase().includes(query) ||
        (pkg.materialType && pkg.materialType.toLowerCase().includes(query)) ||
        (pkg.siteName && pkg.siteName.toLowerCase().includes(query))
    );
  }

  // Apply status filter
  if (status) {
    filtered = filtered.filter((pkg) => pkg.status === status);
  }

  // Apply category filter
  if (category) {
    filtered = filtered.filter((pkg) => pkg.category === category);
  }

  return filtered;
};

/**
 * DOORS Package Management Reducer
 */
export const doorsPackageManagementReducer = (
  state: DoorsPackageManagementState,
  action: DoorsPackageManagementAction
): DoorsPackageManagementState => {
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
    case 'SET_PACKAGES': {
      const filteredPackages = applyFiltersToPackages(
        action.payload.packages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          packages: action.payload.packages,
          filteredPackages,
        },
      };
    }

    case 'SET_SITES':
      return {
        ...state,
        data: {
          ...state.data,
          sites: action.payload.sites,
        },
      };

    case 'ADD_PACKAGE': {
      const newPackages = [...state.data.packages, action.payload.package];
      const filteredPackages = applyFiltersToPackages(
        newPackages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          packages: newPackages,
          filteredPackages,
        },
      };
    }

    case 'ADD_PACKAGES': {
      const newPackages = [...state.data.packages, ...action.payload.packages];
      const filteredPackages = applyFiltersToPackages(
        newPackages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          packages: newPackages,
          filteredPackages,
        },
      };
    }

    case 'UPDATE_PACKAGE': {
      const updatedPackages = state.data.packages.map((pkg) =>
        pkg.id === action.payload.package.id ? action.payload.package : pkg
      );
      const filteredPackages = applyFiltersToPackages(
        updatedPackages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          packages: updatedPackages,
          filteredPackages,
        },
      };
    }

    case 'DELETE_PACKAGE': {
      const remainingPackages = state.data.packages.filter(
        (pkg) => pkg.id !== action.payload.packageId
      );
      const filteredPackages = applyFiltersToPackages(
        remainingPackages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          packages: remainingPackages,
          filteredPackages,
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
          editingPackageId: action.payload?.editingPackageId || null,
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: false,
          editingPackageId: null,
        },
        form: createInitialState().form,
      };

    case 'OPEN_COPY_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          copyDialogVisible: true,
        },
      };

    case 'CLOSE_COPY_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          copyDialogVisible: false,
        },
      };

    // Filter menu management
    case 'OPEN_FILTER_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          filterMenuVisible: true,
        },
      };

    case 'CLOSE_FILTER_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          filterMenuVisible: false,
        },
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
      const filteredPackages = applyFiltersToPackages(
        state.data.packages,
        action.payload.query,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload.query,
        },
        data: {
          ...state.data,
          filteredPackages,
        },
      };
    }

    case 'SET_FILTER_STATUS': {
      const filteredPackages = applyFiltersToPackages(
        state.data.packages,
        state.filters.searchQuery,
        action.payload.status,
        state.filters.category
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          status: action.payload.status,
        },
        data: {
          ...state.data,
          filteredPackages,
        },
      };
    }

    case 'SET_FILTER_CATEGORY': {
      const filteredPackages = applyFiltersToPackages(
        state.data.packages,
        state.filters.searchQuery,
        state.filters.status,
        action.payload.category
      );
      return {
        ...state,
        filters: {
          ...state.filters,
          category: action.payload.category,
        },
        data: {
          ...state.data,
          filteredPackages,
        },
      };
    }

    case 'APPLY_FILTERS': {
      const filteredPackages = applyFiltersToPackages(
        state.data.packages,
        state.filters.searchQuery,
        state.filters.status,
        state.filters.category
      );
      return {
        ...state,
        data: {
          ...state.data,
          filteredPackages,
        },
      };
    }

    default:
      return state;
  }
};
