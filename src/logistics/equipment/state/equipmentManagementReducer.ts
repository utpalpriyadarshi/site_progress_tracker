/**
 * Equipment Management State Reducer
 *
 * Manages complex state for Equipment Management Screen
 * Replaces 12 useState hooks with a single useReducer
 *
 * State managed:
 * - UI state (loading, view mode, filters, modal visibility)
 * - Data state (equipment, maintenance, allocations, certifications)
 */

// ==================== Type Imports ====================

import {
  Equipment,
  MaintenanceRecord,
  EquipmentAllocation,
  OperatorCertification,
  MaintenanceSchedule,
  EquipmentStatus,
} from '../../../services/EquipmentManagementService';

// ==================== Local Types ====================

export type ViewMode = 'overview' | 'maintenance' | 'allocation' | 'performance';
export type StatusFilter = 'all' | EquipmentStatus;

export interface CertificationAlert {
  operatorId: string;
  operatorName: string;
  daysUntilExpiry: number;
  status: string;
}

// ==================== State Interface ====================

export interface EquipmentManagementState {
  // UI state
  ui: {
    loading: boolean;
    viewMode: ViewMode;
    statusFilter: StatusFilter;
    searchQuery: string;
    showDetailsModal: boolean;
  };

  // Data state
  data: {
    equipment: Equipment[];
    maintenanceRecords: MaintenanceRecord[];
    allocations: EquipmentAllocation[];
    certifications: OperatorCertification[];
    maintenanceSchedule: MaintenanceSchedule[];
    certificationAlerts: CertificationAlert[];
  };

  // Modal state
  modal: {
    selectedEquipment: Equipment | null;
  };
}

// ==================== Action Types ====================

export type EquipmentManagementAction =
  // UI actions
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_STATUS_FILTER'; payload: StatusFilter }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SHOW_DETAILS_MODAL' }
  | { type: 'HIDE_DETAILS_MODAL' }

  // Data actions
  | { type: 'SET_EQUIPMENT'; payload: Equipment[] }
  | { type: 'SET_MAINTENANCE_RECORDS'; payload: MaintenanceRecord[] }
  | { type: 'SET_ALLOCATIONS'; payload: EquipmentAllocation[] }
  | { type: 'SET_CERTIFICATIONS'; payload: OperatorCertification[] }
  | { type: 'SET_MAINTENANCE_SCHEDULE'; payload: MaintenanceSchedule[] }
  | { type: 'SET_CERTIFICATION_ALERTS'; payload: CertificationAlert[] }
  | {
      type: 'LOAD_ALL_EQUIPMENT_DATA';
      payload: {
        equipment: Equipment[];
        maintenanceRecords: MaintenanceRecord[];
        allocations: EquipmentAllocation[];
        certifications: OperatorCertification[];
        maintenanceSchedule: MaintenanceSchedule[];
        certificationAlerts: CertificationAlert[];
      };
    }

  // Modal actions
  | { type: 'SELECT_EQUIPMENT'; payload: Equipment }
  | { type: 'CLEAR_SELECTED_EQUIPMENT' }

  // Reset action
  | { type: 'RESET_STATE' };

// ==================== Initial State ====================

export const initialEquipmentManagementState: EquipmentManagementState = {
  ui: {
    loading: false,
    viewMode: 'overview',
    statusFilter: 'all',
    searchQuery: '',
    showDetailsModal: false,
  },
  data: {
    equipment: [],
    maintenanceRecords: [],
    allocations: [],
    certifications: [],
    maintenanceSchedule: [],
    certificationAlerts: [],
  },
  modal: {
    selectedEquipment: null,
  },
};

// ==================== Reducer Function ====================

export const equipmentManagementReducer = (
  state: EquipmentManagementState,
  action: EquipmentManagementAction
): EquipmentManagementState => {
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

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload,
        },
      };

    case 'SET_STATUS_FILTER':
      return {
        ...state,
        ui: {
          ...state.ui,
          statusFilter: action.payload,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        ui: {
          ...state.ui,
          searchQuery: action.payload,
        },
      };

    case 'SHOW_DETAILS_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDetailsModal: true,
        },
      };

    case 'HIDE_DETAILS_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          showDetailsModal: false,
        },
      };

    // ==================== Data Actions ====================

    case 'SET_EQUIPMENT':
      return {
        ...state,
        data: {
          ...state.data,
          equipment: action.payload,
        },
      };

    case 'SET_MAINTENANCE_RECORDS':
      return {
        ...state,
        data: {
          ...state.data,
          maintenanceRecords: action.payload,
        },
      };

    case 'SET_ALLOCATIONS':
      return {
        ...state,
        data: {
          ...state.data,
          allocations: action.payload,
        },
      };

    case 'SET_CERTIFICATIONS':
      return {
        ...state,
        data: {
          ...state.data,
          certifications: action.payload,
        },
      };

    case 'SET_MAINTENANCE_SCHEDULE':
      return {
        ...state,
        data: {
          ...state.data,
          maintenanceSchedule: action.payload,
        },
      };

    case 'SET_CERTIFICATION_ALERTS':
      return {
        ...state,
        data: {
          ...state.data,
          certificationAlerts: action.payload,
        },
      };

    case 'LOAD_ALL_EQUIPMENT_DATA':
      return {
        ...state,
        data: {
          equipment: action.payload.equipment,
          maintenanceRecords: action.payload.maintenanceRecords,
          allocations: action.payload.allocations,
          certifications: action.payload.certifications,
          maintenanceSchedule: action.payload.maintenanceSchedule,
          certificationAlerts: action.payload.certificationAlerts,
        },
      };

    // ==================== Modal Actions ====================

    case 'SELECT_EQUIPMENT':
      return {
        ...state,
        modal: {
          selectedEquipment: action.payload,
        },
      };

    case 'CLEAR_SELECTED_EQUIPMENT':
      return {
        ...state,
        modal: {
          selectedEquipment: null,
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_STATE':
      return initialEquipmentManagementState;

    // ==================== Default ====================

    default:
      return state;
  }
};
