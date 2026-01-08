import ProjectModel from '../../../../models/ProjectModel';
import type { ProjectFormData } from '../../project-management/utils/projectValidation';

/**
 * Project Form Data interface
 * Re-export from utils for consistency
 */
export type { ProjectFormData };

/**
 * Project Management State interface
 *
 * Consolidates all state for project management:
 * - UI state (modal, date pickers)
 * - Data state (editing project)
 * - Form state (all form fields)
 */
export interface ProjectManagementState {
  ui: {
    modalVisible: boolean;
    showStartDatePicker: boolean;
    showEndDatePicker: boolean;
  };
  data: {
    editingProject: ProjectModel | null;
  };
  form: ProjectFormData;
}

/**
 * Project Management Actions
 *
 * Discriminated union of all possible actions for project management
 */
export type ProjectManagementAction =
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'OPEN_EDIT_MODAL'; payload: { project: ProjectModel } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof ProjectFormData; value: any } }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<ProjectFormData> }
  | { type: 'SHOW_START_DATE_PICKER' }
  | { type: 'HIDE_START_DATE_PICKER' }
  | { type: 'SHOW_END_DATE_PICKER' }
  | { type: 'HIDE_END_DATE_PICKER' }
  | { type: 'SET_START_DATE'; payload: { date: Date } }
  | { type: 'SET_END_DATE'; payload: { date: Date } }
  | { type: 'RESET_FORM' };

/**
 * Initial state factory
 * Creates the initial state with default values
 */
export const createInitialState = (): ProjectManagementState => ({
  ui: {
    modalVisible: false,
    showStartDatePicker: false,
    showEndDatePicker: false,
  },
  data: {
    editingProject: null,
  },
  form: {
    name: '',
    client: '',
    startDate: new Date(),
    endDate: new Date(),
    status: 'active',
    budget: '0',
  },
});

/**
 * Project Management Reducer
 *
 * Handles all state transitions for project management
 * Follows the pattern from Manager/Logistics/Commercial reducers
 */
export const projectManagementReducer = (
  state: ProjectManagementState,
  action: ProjectManagementAction
): ProjectManagementState => {
  switch (action.type) {
    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: true,
        },
        data: {
          ...state.data,
          editingProject: null,
        },
        form: {
          name: '',
          client: '',
          startDate: new Date(),
          endDate: new Date(),
          status: 'active',
          budget: '0',
        },
      };

    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: true,
        },
        data: {
          ...state.data,
          editingProject: action.payload.project,
        },
        form: {
          name: action.payload.project.name,
          client: action.payload.project.client,
          startDate: new Date(action.payload.project.startDate),
          endDate: new Date(action.payload.project.endDate),
          status: action.payload.project.status as any,
          budget: action.payload.project.budget.toString(),
        },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modalVisible: false,
          showStartDatePicker: false,
          showEndDatePicker: false,
        },
      };

    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };

    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        form: {
          ...state.form,
          ...action.payload,
        },
      };

    case 'SHOW_START_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showStartDatePicker: true,
          showEndDatePicker: false, // Close end date picker when opening start date picker
        },
      };

    case 'HIDE_START_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showStartDatePicker: false,
        },
      };

    case 'SHOW_END_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showEndDatePicker: true,
          showStartDatePicker: false, // Close start date picker when opening end date picker
        },
      };

    case 'HIDE_END_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showEndDatePicker: false,
        },
      };

    case 'SET_START_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          startDate: action.payload.date,
        },
      };

    case 'SET_END_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          endDate: action.payload.date,
        },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: {
          name: '',
          client: '',
          startDate: new Date(),
          endDate: new Date(),
          status: 'active',
          budget: '0',
        },
      };

    default:
      return state;
  }
};
