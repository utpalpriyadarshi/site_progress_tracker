import { useReducer, useCallback } from 'react';
import { Platform } from 'react-native';
import { database } from '../../../../models/database';
import ProjectModel from '../../../../models/ProjectModel';
import { logger } from '../../../services/LoggingService';
import {
  validateProjectForm,
  createDefaultMilestones,
} from '../utils';
import {
  projectManagementReducer,
  createInitialState,
  ProjectFormData,
} from '../../state/project-management';

interface UseProjectFormProps {
  currentUserId?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataReload: () => void;
}

export const useProjectForm = ({
  currentUserId,
  onSuccess,
  onError,
  onDataReload,
}: UseProjectFormProps) => {
  const [state, dispatch] = useReducer(projectManagementReducer, undefined, createInitialState);

  const openCreateModal = useCallback(() => {
    dispatch({ type: 'OPEN_CREATE_MODAL' });
  }, []);

  const openEditModal = useCallback((project: ProjectModel) => {
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: { project } });
  }, []);

  const handleSave = useCallback(async () => {
    const { form, data } = state;
    const { editingProject } = data;

    // Validation
    const validation = validateProjectForm(form);
    if (!validation.isValid) {
      dispatch({ type: 'CLOSE_MODAL' });
      onError(validation.error || 'Validation failed');
      return;
    }

    const budget = parseFloat(form.budget);

    try {
      let newProjectId: string | null = null;

      await database.write(async () => {
        if (editingProject) {
          // Update existing project
          await editingProject.update((project: any) => {
            project.name = form.name;
            project.client = form.client;
            project.startDate = form.startDate.getTime();
            project.endDate = form.endDate.getTime();
            project.status = form.status;
            project.budget = budget;
          });
        } else {
          // Create new project
          const newProject = await database.collections.get('projects').create((project: any) => {
            project.name = form.name;
            project.client = form.client;
            project.startDate = form.startDate.getTime();
            project.endDate = form.endDate.getTime();
            project.status = form.status;
            project.budget = budget;
          });
          newProjectId = newProject.id;
        }
      });

      // Create default milestones for new projects
      if (newProjectId && currentUserId) {
        await database.write(async () => {
          await createDefaultMilestones(newProjectId!, currentUserId);
        });
      }

      dispatch({ type: 'CLOSE_MODAL' });
      onDataReload();
      onSuccess(
        editingProject ? 'Project updated successfully' : 'Project created successfully'
      );
    } catch (error) {
      logger.error('Error saving project:', error as Error);
      onError('Failed to save project');
    }
  }, [state, currentUserId, onError, onDataReload, onSuccess]);

  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      // On iOS, keep picker open
      // On Android, it auto-closes
    } else {
      dispatch({ type: 'HIDE_START_DATE_PICKER' });
    }
    if (selectedDate) {
      dispatch({ type: 'SET_START_DATE', payload: { date: selectedDate } });
    }
  }, []);

  const handleEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      // On iOS, keep picker open
      // On Android, it auto-closes
    } else {
      dispatch({ type: 'HIDE_END_DATE_PICKER' });
    }
    if (selectedDate) {
      dispatch({ type: 'SET_END_DATE', payload: { date: selectedDate } });
    }
  }, []);

  const updateFormData = useCallback((data: Partial<ProjectFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  return {
    // UI state
    modalVisible: state.ui.modalVisible,
    setModalVisible: useCallback((visible: boolean) => {
      if (!visible) {
        dispatch({ type: 'CLOSE_MODAL' });
      }
    }, []),
    showStartDatePicker: state.ui.showStartDatePicker,
    setShowStartDatePicker: useCallback((visible: boolean) => {
      if (visible) {
        dispatch({ type: 'SHOW_START_DATE_PICKER' });
      } else {
        dispatch({ type: 'HIDE_START_DATE_PICKER' });
      }
    }, []),
    showEndDatePicker: state.ui.showEndDatePicker,
    setShowEndDatePicker: useCallback((visible: boolean) => {
      if (visible) {
        dispatch({ type: 'SHOW_END_DATE_PICKER' });
      } else {
        dispatch({ type: 'HIDE_END_DATE_PICKER' });
      }
    }, []),

    // Data state
    editingProject: state.data.editingProject,

    // Form state
    formData: state.form,
    updateFormData,

    // Actions
    openCreateModal,
    openEditModal,
    handleSave,
    handleStartDateChange,
    handleEndDateChange,
  };
};
