/**
 * Milestone Tracking State Management
 *
 * Consolidates state from multiple sources:
 * - MilestoneTrackingScreen (selectedProjectId, selectedSiteId, snackbar)
 * - useEditProgress hook (14 useState - dialog, form, date pickers)
 *
 * Reduction: 18 useState → 1 useReducer (94% reduction)
 */

import MilestoneModel from '../../../../models/MilestoneModel';
import MilestoneProgressModel from '../../../../models/MilestoneProgressModel';
import { MILESTONE_STATUS } from '../../milestone-tracking/utils/milestoneConstants';

export interface MilestoneTrackingState {
  ui: {
    editDialogVisible: boolean;
    showPlannedStartPicker: boolean;
    showPlannedEndPicker: boolean;
    showActualStartPicker: boolean;
    showActualEndPicker: boolean;
    snackbarVisible: boolean;
    snackbarMessage: string;
    snackbarType: 'success' | 'error';
  };
  selection: {
    selectedProjectId: string;
    selectedSiteId: string;
  };
  dialog: {
    editingMilestone: MilestoneModel | null;
    editingProgress: MilestoneProgressModel | null;
  };
  form: {
    progressPercentage: string;
    status: string;
    notes: string;
    plannedStartDate: Date | undefined;
    plannedEndDate: Date | undefined;
    actualStartDate: Date | undefined;
    actualEndDate: Date | undefined;
  };
  validation: {
    errors: Record<string, string>;
  };
}

export type MilestoneTrackingAction =
  // Selection actions
  | { type: 'SET_SELECTED_PROJECT'; payload: { projectId: string } }
  | { type: 'SET_SELECTED_SITE'; payload: { siteId: string } }

  // Dialog actions
  | {
      type: 'OPEN_EDIT_DIALOG';
      payload: {
        milestone: MilestoneModel;
        progress: MilestoneProgressModel | null;
      };
    }
  | { type: 'CLOSE_EDIT_DIALOG' }

  // Form field updates
  | { type: 'SET_PROGRESS_PERCENTAGE'; payload: { value: string } }
  | { type: 'SET_STATUS'; payload: { status: string } }
  | { type: 'SET_NOTES'; payload: { notes: string } }
  | { type: 'SET_PLANNED_START_DATE'; payload: { date: Date | undefined } }
  | { type: 'SET_PLANNED_END_DATE'; payload: { date: Date | undefined } }
  | { type: 'SET_ACTUAL_START_DATE'; payload: { date: Date | undefined } }
  | { type: 'SET_ACTUAL_END_DATE'; payload: { date: Date | undefined } }

  // Date picker toggles
  | { type: 'SHOW_PLANNED_START_PICKER'; payload: { show: boolean } }
  | { type: 'SHOW_PLANNED_END_PICKER'; payload: { show: boolean } }
  | { type: 'SHOW_ACTUAL_START_PICKER'; payload: { show: boolean } }
  | { type: 'SHOW_ACTUAL_END_PICKER'; payload: { show: boolean } }

  // Snackbar actions
  | { type: 'SHOW_SNACKBAR'; payload: { message: string; type?: 'success' | 'error' } }
  | { type: 'HIDE_SNACKBAR' }

  // Validation
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_VALIDATION' }

  // Quick achievement action
  | { type: 'MARK_AS_ACHIEVED_START' }
  | { type: 'MARK_AS_ACHIEVED_COMPLETE' };

/**
 * Create initial state for milestone tracking
 */
export const createInitialState = (): MilestoneTrackingState => ({
  ui: {
    editDialogVisible: false,
    showPlannedStartPicker: false,
    showPlannedEndPicker: false,
    showActualStartPicker: false,
    showActualEndPicker: false,
    snackbarVisible: false,
    snackbarMessage: '',
    snackbarType: 'success',
  },
  selection: {
    selectedProjectId: '',
    selectedSiteId: '',
  },
  dialog: {
    editingMilestone: null,
    editingProgress: null,
  },
  form: {
    progressPercentage: '0',
    status: MILESTONE_STATUS.NOT_STARTED,
    notes: '',
    plannedStartDate: undefined,
    plannedEndDate: undefined,
    actualStartDate: undefined,
    actualEndDate: undefined,
  },
  validation: {
    errors: {},
  },
});

/**
 * Helper: Reset form to default values
 */
const getDefaultFormState = () => ({
  progressPercentage: '0',
  status: MILESTONE_STATUS.NOT_STARTED,
  notes: '',
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  actualStartDate: undefined,
  actualEndDate: undefined,
});

/**
 * Helper: Populate form from progress record
 */
const populateFormFromProgress = (progress: MilestoneProgressModel) => ({
  progressPercentage: progress.progressPercentage.toString(),
  status: progress.status,
  notes: progress.notes || '',
  plannedStartDate: progress.plannedStartDate ? new Date(progress.plannedStartDate) : undefined,
  plannedEndDate: progress.plannedEndDate ? new Date(progress.plannedEndDate) : undefined,
  actualStartDate: progress.actualStartDate ? new Date(progress.actualStartDate) : undefined,
  actualEndDate: progress.actualEndDate ? new Date(progress.actualEndDate) : undefined,
});

/**
 * Milestone Tracking Reducer
 */
export const milestoneTrackingReducer = (
  state: MilestoneTrackingState,
  action: MilestoneTrackingAction
): MilestoneTrackingState => {
  switch (action.type) {
    // Selection actions
    case 'SET_SELECTED_PROJECT':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedProjectId: action.payload.projectId,
        },
      };

    case 'SET_SELECTED_SITE':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedSiteId: action.payload.siteId,
        },
      };

    // Dialog actions
    case 'OPEN_EDIT_DIALOG': {
      const { milestone, progress } = action.payload;
      const formData = progress ? populateFormFromProgress(progress) : getDefaultFormState();

      return {
        ...state,
        ui: {
          ...state.ui,
          editDialogVisible: true,
        },
        dialog: {
          editingMilestone: milestone,
          editingProgress: progress,
        },
        form: formData,
        validation: {
          errors: {},
        },
      };
    }

    case 'CLOSE_EDIT_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          editDialogVisible: false,
          showPlannedStartPicker: false,
          showPlannedEndPicker: false,
          showActualStartPicker: false,
          showActualEndPicker: false,
        },
      };

    // Form field updates
    case 'SET_PROGRESS_PERCENTAGE':
      return {
        ...state,
        form: {
          ...state.form,
          progressPercentage: action.payload.value,
        },
      };

    case 'SET_STATUS':
      return {
        ...state,
        form: {
          ...state.form,
          status: action.payload.status,
        },
      };

    case 'SET_NOTES':
      return {
        ...state,
        form: {
          ...state.form,
          notes: action.payload.notes,
        },
      };

    case 'SET_PLANNED_START_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          plannedStartDate: action.payload.date,
        },
      };

    case 'SET_PLANNED_END_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          plannedEndDate: action.payload.date,
        },
      };

    case 'SET_ACTUAL_START_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          actualStartDate: action.payload.date,
        },
      };

    case 'SET_ACTUAL_END_DATE':
      return {
        ...state,
        form: {
          ...state.form,
          actualEndDate: action.payload.date,
        },
      };

    // Date picker toggles
    case 'SHOW_PLANNED_START_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showPlannedStartPicker: action.payload.show,
        },
      };

    case 'SHOW_PLANNED_END_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showPlannedEndPicker: action.payload.show,
        },
      };

    case 'SHOW_ACTUAL_START_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showActualStartPicker: action.payload.show,
        },
      };

    case 'SHOW_ACTUAL_END_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showActualEndPicker: action.payload.show,
        },
      };

    // Snackbar actions
    case 'SHOW_SNACKBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          snackbarVisible: true,
          snackbarMessage: action.payload.message,
          snackbarType: action.payload.type || 'success',
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

    // Validation
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validation: {
          errors: {
            ...state.validation.errors,
            [action.payload.field]: action.payload.error,
          },
        },
      };

    case 'CLEAR_VALIDATION':
      return {
        ...state,
        validation: {
          errors: {},
        },
      };

    default:
      return state;
  }
};

/**
 * Validation helper
 */
export const validateMilestoneProgress = (formData: MilestoneTrackingState['form']): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  const percentage = parseFloat(formData.progressPercentage);
  if (isNaN(percentage) || percentage < 0 || percentage > 100) {
    errors.progressPercentage = 'Progress must be between 0 and 100';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
