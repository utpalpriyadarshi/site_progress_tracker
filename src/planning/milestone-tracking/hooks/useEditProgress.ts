/**
 * Hook for managing milestone progress editing
 *
 * Refactored to use useReducer for consolidated state management
 * @version 2.0.0
 */

import { useReducer } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../../models/database';
import MilestoneModel from '../../../../models/MilestoneModel';
import MilestoneProgressModel from '../../../../models/MilestoneProgressModel';
import { useAuth } from '../../../auth/AuthContext';
import { logger } from '../../../services/LoggingService';
import { MILESTONE_STATUS } from '../utils/milestoneConstants';

// ==================== Types ====================

interface UseEditProgressProps {
  selectedProjectId: string;
  selectedSiteId: string;
  getProgressForMilestone: (milestoneId: string) => MilestoneProgressModel | null;
  onSuccess: (message: string) => void;
  onRefresh: () => void;
}

/**
 * Form state consolidating all form fields and UI state
 */
interface FormState {
  // Dialog state
  editDialogVisible: boolean;
  editingProgress: MilestoneProgressModel | null;
  editingMilestone: MilestoneModel | null;

  // Form data
  progressPercentage: string;
  status: string;
  notes: string;
  plannedStartDate: Date | undefined;
  plannedEndDate: Date | undefined;
  actualStartDate: Date | undefined;
  actualEndDate: Date | undefined;

  // Date picker visibility
  showPlannedStartPicker: boolean;
  showPlannedEndPicker: boolean;
  showActualStartPicker: boolean;
  showActualEndPicker: boolean;
}

/**
 * Form actions for reducer
 */
type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'LOAD_PROGRESS'; progress: MilestoneProgressModel; milestone: MilestoneModel }
  | { type: 'RESET_FORM'; milestone: MilestoneModel }
  | { type: 'TOGGLE_PICKER'; picker: 'plannedStart' | 'plannedEnd' | 'actualStart' | 'actualEnd' }
  | { type: 'CLOSE_DIALOG' };

// ==================== Initial State ====================

const initialFormState: FormState = {
  editDialogVisible: false,
  editingProgress: null,
  editingMilestone: null,
  progressPercentage: '0',
  status: MILESTONE_STATUS.NOT_STARTED,
  notes: '',
  plannedStartDate: undefined,
  plannedEndDate: undefined,
  actualStartDate: undefined,
  actualEndDate: undefined,
  showPlannedStartPicker: false,
  showPlannedEndPicker: false,
  showActualStartPicker: false,
  showActualEndPicker: false,
};

// ==================== Reducer ====================

/**
 * Form state reducer
 * Handles all state updates in a centralized, predictable way
 */
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'LOAD_PROGRESS':
      return {
        ...state,
        editDialogVisible: true,
        editingProgress: action.progress,
        editingMilestone: action.milestone,
        progressPercentage: action.progress.progressPercentage.toString(),
        status: action.progress.status,
        notes: action.progress.notes || '',
        plannedStartDate: action.progress.plannedStartDate
          ? new Date(action.progress.plannedStartDate)
          : undefined,
        plannedEndDate: action.progress.plannedEndDate
          ? new Date(action.progress.plannedEndDate)
          : undefined,
        actualStartDate: action.progress.actualStartDate
          ? new Date(action.progress.actualStartDate)
          : undefined,
        actualEndDate: action.progress.actualEndDate
          ? new Date(action.progress.actualEndDate)
          : undefined,
      };

    case 'RESET_FORM':
      return {
        ...initialFormState,
        editDialogVisible: true,
        editingMilestone: action.milestone,
      };

    case 'TOGGLE_PICKER':
      const pickerMap = {
        plannedStart: 'showPlannedStartPicker',
        plannedEnd: 'showPlannedEndPicker',
        actualStart: 'showActualStartPicker',
        actualEnd: 'showActualEndPicker',
      } as const;
      const pickerField = pickerMap[action.picker];
      return { ...state, [pickerField]: !state[pickerField] };

    case 'CLOSE_DIALOG':
      return { ...state, editDialogVisible: false };

    default:
      return state;
  }
}

// ==================== Hook ====================

export const useEditProgress = ({
  selectedProjectId,
  selectedSiteId,
  getProgressForMilestone,
  onSuccess,
  onRefresh,
}: UseEditProgressProps) => {
  const { user } = useAuth();

  // Consolidated state management with useReducer
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  // Destructure state for convenience
  const {
    editDialogVisible,
    editingProgress,
    editingMilestone,
    progressPercentage,
    status,
    notes,
    plannedStartDate,
    plannedEndDate,
    actualStartDate,
    actualEndDate,
    showPlannedStartPicker,
    showPlannedEndPicker,
    showActualStartPicker,
    showActualEndPicker,
  } = state;

  const openEditDialog = async (milestone: MilestoneModel) => {
    const progress = getProgressForMilestone(milestone.id);

    if (progress) {
      // Load existing progress data
      dispatch({ type: 'LOAD_PROGRESS', progress, milestone });
    } else {
      // Reset form for new progress entry
      dispatch({ type: 'RESET_FORM', milestone });
    }
  };

  const closeEditDialog = () => {
    dispatch({ type: 'CLOSE_DIALOG' });
  };

  const handleSave = async () => {
    if (!selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a site first');
      return;
    }

    const percentage = parseFloat(progressPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      Alert.alert('Validation Error', 'Progress must be between 0 and 100');
      return;
    }

    try {
      await database.write(async () => {
        if (editingProgress) {
          // Update existing progress
          await editingProgress.update((record: any) => {
            record.progressPercentage = percentage;
            record.status = status;
            record.notes = notes;
            record.plannedStartDate = plannedStartDate?.getTime() || null;
            record.plannedEndDate = plannedEndDate?.getTime() || null;
            record.actualStartDate = actualStartDate?.getTime() || null;
            record.actualEndDate = actualEndDate?.getTime() || null;
            record.updatedBy = user?.userId || user?.username || 'unknown';
            record.updatedAt = Date.now();
          });
        } else {
          // Create new progress record
          const progressCollection = database.collections.get('milestone_progress');
          await progressCollection.create((record: any) => {
            record.milestoneId = editingMilestone!.id;
            record.siteId = selectedSiteId;
            record.projectId = selectedProjectId;
            record.progressPercentage = percentage;
            record.status = status;
            record.notes = notes;
            record.plannedStartDate = plannedStartDate?.getTime() || null;
            record.plannedEndDate = plannedEndDate?.getTime() || null;
            record.actualStartDate = actualStartDate?.getTime() || null;
            record.actualEndDate = actualEndDate?.getTime() || null;
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        }
      });

      onSuccess('Milestone progress updated successfully');
      dispatch({ type: 'CLOSE_DIALOG' });
      onRefresh();
    } catch (error) {
      logger.error('[Milestone] Error saving', error as Error);
      Alert.alert('Error', 'Failed to save milestone progress');
    }
  };

  const handleMarkAsAchieved = async (milestone: MilestoneModel) => {
    if (!selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a site first');
      return;
    }

    const progress = getProgressForMilestone(milestone.id);

    try {
      await database.write(async () => {
        if (progress) {
          await progress.update((record: any) => {
            record.progressPercentage = 100;
            record.status = MILESTONE_STATUS.COMPLETED;
            record.actualEndDate = Date.now();
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
          });
        } else {
          const progressCollection = database.collections.get('milestone_progress');
          await progressCollection.create((record: any) => {
            record.milestoneId = milestone.id;
            record.siteId = selectedSiteId;
            record.projectId = selectedProjectId;
            record.progressPercentage = 100;
            record.status = MILESTONE_STATUS.COMPLETED;
            record.actualEndDate = Date.now();
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        }
      });

      onSuccess(`${milestone.milestoneName} marked as achieved!`);
      onRefresh();
    } catch (error) {
      logger.error('[Milestone] Error marking as achieved', error as Error);
      Alert.alert('Error', 'Failed to mark milestone as achieved');
    }
  };

  // Create setter functions that dispatch actions
  const setProgressPercentage = (value: string) =>
    dispatch({ type: 'SET_FIELD', field: 'progressPercentage', value });
  const setStatus = (value: string) =>
    dispatch({ type: 'SET_FIELD', field: 'status', value });
  const setNotes = (value: string) =>
    dispatch({ type: 'SET_FIELD', field: 'notes', value });
  const setPlannedStartDate = (value: Date | undefined) =>
    dispatch({ type: 'SET_FIELD', field: 'plannedStartDate', value });
  const setPlannedEndDate = (value: Date | undefined) =>
    dispatch({ type: 'SET_FIELD', field: 'plannedEndDate', value });
  const setActualStartDate = (value: Date | undefined) =>
    dispatch({ type: 'SET_FIELD', field: 'actualStartDate', value });
  const setActualEndDate = (value: Date | undefined) =>
    dispatch({ type: 'SET_FIELD', field: 'actualEndDate', value });

  const setShowPlannedStartPicker = (value: boolean) =>
    dispatch({ type: 'SET_FIELD', field: 'showPlannedStartPicker', value });
  const setShowPlannedEndPicker = (value: boolean) =>
    dispatch({ type: 'SET_FIELD', field: 'showPlannedEndPicker', value });
  const setShowActualStartPicker = (value: boolean) =>
    dispatch({ type: 'SET_FIELD', field: 'showActualStartPicker', value });
  const setShowActualEndPicker = (value: boolean) =>
    dispatch({ type: 'SET_FIELD', field: 'showActualEndPicker', value });

  return {
    // Dialog state
    editDialogVisible,
    editingMilestone,

    // Form state
    progressPercentage,
    setProgressPercentage,
    status,
    setStatus,
    notes,
    setNotes,
    plannedStartDate,
    setPlannedStartDate,
    plannedEndDate,
    setPlannedEndDate,
    actualStartDate,
    setActualStartDate,
    actualEndDate,
    setActualEndDate,

    // Date picker state
    showPlannedStartPicker,
    setShowPlannedStartPicker,
    showPlannedEndPicker,
    setShowPlannedEndPicker,
    showActualStartPicker,
    setShowActualStartPicker,
    showActualEndPicker,
    setShowActualEndPicker,

    // Actions
    openEditDialog,
    closeEditDialog,
    handleSave,
    handleMarkAsAchieved,
  };
};
