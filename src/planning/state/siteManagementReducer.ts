/**
 * SiteManagementReducer
 *
 * Centralized state management for SiteManagementScreen.
 * Consolidates 21 useState calls into a single useReducer.
 *
 * State structure:
 * - ui: Dialog visibility, snackbar, date pickers
 * - form: Site form fields (name, location, dates, supervisor)
 * - dialog: Currently editing/deleting site references
 *
 * @version 1.0.0
 * @since Phase 2 Code Improvements
 */

import SiteModel from '../../../models/SiteModel';

// ==================== State Types ====================

export interface SiteManagementState {
  ui: {
    dialogVisible: boolean;
    supervisorPickerVisible: boolean;
    designerPickerVisible: boolean;
    deleteDialogVisible: boolean;
    snackbarVisible: boolean;
    snackbarMessage: string;
    snackbarType: 'success' | 'error';
    // Date pickers
    showPlannedStartPicker: boolean;
    showPlannedEndPicker: boolean;
    showActualStartPicker: boolean;
    showActualEndPicker: boolean;
  };
  form: {
    siteName: string;
    siteLocation: string;
    selectedProjectId: string;
    selectedSupervisorId: string | undefined;
    supervisorName: string;
    selectedDesignEngineerId: string | undefined;
    designerName: string;
    // KD assignment (create flow only)
    linkedKDId: string | null;
    kdContribution: string;
    // Dates
    plannedStartDate: Date | undefined;
    plannedEndDate: Date | undefined;
    actualStartDate: Date | undefined;
    actualEndDate: Date | undefined;
  };
  dialog: {
    editingSite: SiteModel | null;
    siteToDelete: SiteModel | null;
  };
}

// ==================== Action Types ====================

export type SiteManagementAction =
  // UI Actions
  | { type: 'OPEN_ADD_DIALOG'; payload: { defaultProjectId: string } }
  | { type: 'OPEN_EDIT_DIALOG'; payload: { site: SiteModel; supervisorName: string; designerName: string } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: { site: SiteModel } }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'SET_SUPERVISOR_PICKER_VISIBLE'; payload: boolean }
  | { type: 'SET_DESIGNER_PICKER_VISIBLE'; payload: boolean }
  // Snackbar Actions
  | { type: 'SHOW_SNACKBAR'; payload: { message: string; type: 'success' | 'error' } }
  | { type: 'HIDE_SNACKBAR' }
  // Form Actions
  | { type: 'SET_SITE_NAME'; payload: string }
  | { type: 'SET_SITE_LOCATION'; payload: string }
  | { type: 'SET_SELECTED_PROJECT_ID'; payload: string }
  | { type: 'SET_SUPERVISOR'; payload: { id: string | undefined; name: string } }
  | { type: 'SET_DESIGNER'; payload: { id: string | undefined; name: string } }
  | { type: 'SET_LINKED_KD'; payload: string | null }
  | { type: 'SET_KD_CONTRIBUTION'; payload: string }
  // Date Actions
  | { type: 'SET_PLANNED_START_DATE'; payload: Date | undefined }
  | { type: 'SET_PLANNED_END_DATE'; payload: Date | undefined }
  | { type: 'SET_ACTUAL_START_DATE'; payload: Date | undefined }
  | { type: 'SET_ACTUAL_END_DATE'; payload: Date | undefined }
  // Date Picker Visibility
  | { type: 'SHOW_PLANNED_START_PICKER'; payload: boolean }
  | { type: 'SHOW_PLANNED_END_PICKER'; payload: boolean }
  | { type: 'SHOW_ACTUAL_START_PICKER'; payload: boolean }
  | { type: 'SHOW_ACTUAL_END_PICKER'; payload: boolean }
  // Reset
  | { type: 'RESET_FORM' };

// ==================== Initial State ====================

export const createInitialState = (): SiteManagementState => ({
  ui: {
    dialogVisible: false,
    supervisorPickerVisible: false,
    designerPickerVisible: false,
    deleteDialogVisible: false,
    snackbarVisible: false,
    snackbarMessage: '',
    snackbarType: 'success',
    showPlannedStartPicker: false,
    showPlannedEndPicker: false,
    showActualStartPicker: false,
    showActualEndPicker: false,
  },
  form: {
    siteName: '',
    siteLocation: '',
    selectedProjectId: '',
    selectedSupervisorId: undefined,
    supervisorName: 'Unassigned',
    selectedDesignEngineerId: undefined,
    designerName: 'Unassigned',
    linkedKDId: null,
    kdContribution: '100',
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    actualStartDate: undefined,
    actualEndDate: undefined,
  },
  dialog: {
    editingSite: null,
    siteToDelete: null,
  },
});

// ==================== Reducer ====================

export function siteManagementReducer(
  state: SiteManagementState,
  action: SiteManagementAction
): SiteManagementState {
  switch (action.type) {
    // ===== UI Actions =====
    case 'OPEN_ADD_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: true,
        },
        form: {
          siteName: '',
          siteLocation: '',
          selectedProjectId: action.payload.defaultProjectId,
          selectedSupervisorId: undefined,
          supervisorName: 'Unassigned',
          selectedDesignEngineerId: undefined,
          designerName: 'Unassigned',
          linkedKDId: null,
          kdContribution: '100',
          plannedStartDate: undefined,
          plannedEndDate: undefined,
          actualStartDate: undefined,
          actualEndDate: undefined,
        },
        dialog: {
          ...state.dialog,
          editingSite: null,
        },
      };

    case 'OPEN_EDIT_DIALOG':
      const site = action.payload.site;
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: true,
        },
        form: {
          siteName: site.name,
          siteLocation: site.location,
          selectedProjectId: site.projectId,
          selectedSupervisorId: site.supervisorId,
          supervisorName: action.payload.supervisorName,
          selectedDesignEngineerId: site.designEngineerId,
          designerName: action.payload.designerName,
          linkedKDId: null,      // KD assignment is edit-only via Key Dates tab
          kdContribution: '100',
          plannedStartDate: site.plannedStartDate ? new Date(site.plannedStartDate) : undefined,
          plannedEndDate: site.plannedEndDate ? new Date(site.plannedEndDate) : undefined,
          actualStartDate: site.actualStartDate ? new Date(site.actualStartDate) : undefined,
          actualEndDate: site.actualEndDate ? new Date(site.actualEndDate) : undefined,
        },
        dialog: {
          ...state.dialog,
          editingSite: site,
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: false,
        },
        form: {
          siteName: '',
          siteLocation: '',
          selectedProjectId: '',
          selectedSupervisorId: undefined,
          supervisorName: 'Unassigned',
          selectedDesignEngineerId: undefined,
          designerName: 'Unassigned',
          linkedKDId: null,
          kdContribution: '100',
          plannedStartDate: undefined,
          plannedEndDate: undefined,
          actualStartDate: undefined,
          actualEndDate: undefined,
        },
        dialog: {
          ...state.dialog,
          editingSite: null,
        },
      };

    case 'OPEN_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          deleteDialogVisible: true,
        },
        dialog: {
          ...state.dialog,
          siteToDelete: action.payload.site,
        },
      };

    case 'CLOSE_DELETE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          deleteDialogVisible: false,
        },
        dialog: {
          ...state.dialog,
          siteToDelete: null,
        },
      };

    case 'SET_SUPERVISOR_PICKER_VISIBLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          supervisorPickerVisible: action.payload,
        },
      };

    case 'SET_DESIGNER_PICKER_VISIBLE':
      return {
        ...state,
        ui: {
          ...state.ui,
          designerPickerVisible: action.payload,
        },
      };

    // ===== Snackbar Actions =====
    case 'SHOW_SNACKBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          snackbarVisible: true,
          snackbarMessage: action.payload.message,
          snackbarType: action.payload.type,
        },
      };

    case 'HIDE_SNACKBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          snackbarVisible: false,
        },
      };

    // ===== Form Actions =====
    case 'SET_SITE_NAME':
      return {
        ...state,
        form: {
          ...state.form,
          siteName: action.payload,
        },
      };

    case 'SET_SITE_LOCATION':
      return {
        ...state,
        form: {
          ...state.form,
          siteLocation: action.payload,
        },
      };

    case 'SET_SELECTED_PROJECT_ID':
      return {
        ...state,
        form: {
          ...state.form,
          selectedProjectId: action.payload,
        },
      };

    case 'SET_SUPERVISOR':
      return {
        ...state,
        form: {
          ...state.form,
          selectedSupervisorId: action.payload.id,
          supervisorName: action.payload.name,
        },
      };

    case 'SET_DESIGNER':
      return {
        ...state,
        form: {
          ...state.form,
          selectedDesignEngineerId: action.payload.id,
          designerName: action.payload.name,
        },
      };

    case 'SET_LINKED_KD':
      return {
        ...state,
        form: {
          ...state.form,
          linkedKDId: action.payload,
          // Reset contribution to 100 when KD changes
          kdContribution: action.payload ? state.form.kdContribution : '100',
        },
      };

    case 'SET_KD_CONTRIBUTION':
      return {
        ...state,
        form: { ...state.form, kdContribution: action.payload },
      };

    // ===== Date Actions =====
    case 'SET_PLANNED_START_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          plannedStartDate: action.payload,
        },
      };

    case 'SET_PLANNED_END_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          plannedEndDate: action.payload,
        },
      };

    case 'SET_ACTUAL_START_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          actualStartDate: action.payload,
        },
      };

    case 'SET_ACTUAL_END_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          actualEndDate: action.payload,
        },
      };

    // ===== Date Picker Visibility =====
    case 'SHOW_PLANNED_START_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showPlannedStartPicker: action.payload,
        },
      };

    case 'SHOW_PLANNED_END_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showPlannedEndPicker: action.payload,
        },
      };

    case 'SHOW_ACTUAL_START_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showActualStartPicker: action.payload,
        },
      };

    case 'SHOW_ACTUAL_END_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showActualEndPicker: action.payload,
        },
      };

    // ===== Reset =====
    case 'RESET_FORM':
      return createInitialState();

    default:
      return state;
  }
}

// ==================== Selectors ====================

export const selectIsEditing = (state: SiteManagementState): boolean =>
  state.dialog.editingSite !== null;

export const selectFormData = (state: SiteManagementState) => state.form;

export const selectUIState = (state: SiteManagementState) => state.ui;

export const selectDialogState = (state: SiteManagementState) => state.dialog;
