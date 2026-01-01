import { useState } from 'react';
import { Platform } from 'react-native';
import { database } from '../../../../models/database';
import ProjectModel from '../../../../models/ProjectModel';
import { logger } from '../../../services/LoggingService';
import {
  ProjectFormData,
  validateProjectForm,
  createDefaultMilestones,
} from '../utils';

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
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client: '',
    startDate: new Date(),
    endDate: new Date(),
    status: 'active',
    budget: '0',
  });

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      client: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
      budget: '0',
    });
    setModalVisible(true);
  };

  const openEditModal = (project: ProjectModel) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      status: project.status as any,
      budget: project.budget.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    const validation = validateProjectForm(formData);
    if (!validation.isValid) {
      setModalVisible(false);
      onError(validation.error || 'Validation failed');
      return;
    }

    const budget = parseFloat(formData.budget);

    try {
      let newProjectId: string | null = null;

      await database.write(async () => {
        if (editingProject) {
          // Update existing project
          await editingProject.update((project: any) => {
            project.name = formData.name;
            project.client = formData.client;
            project.startDate = formData.startDate.getTime();
            project.endDate = formData.endDate.getTime();
            project.status = formData.status;
            project.budget = budget;
          });
        } else {
          // Create new project
          const newProject = await database.collections.get('projects').create((project: any) => {
            project.name = formData.name;
            project.client = formData.client;
            project.startDate = formData.startDate.getTime();
            project.endDate = formData.endDate.getTime();
            project.status = formData.status;
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

      setModalVisible(false);
      onDataReload();
      onSuccess(
        editingProject ? 'Project updated successfully' : 'Project created successfully'
      );
    } catch (error) {
      logger.error('Error saving project:', error);
      onError('Failed to save project');
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, startDate: selectedDate });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, endDate: selectedDate });
    }
  };

  const updateFormData = (data: Partial<ProjectFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return {
    modalVisible,
    setModalVisible,
    editingProject,
    formData,
    updateFormData,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    openCreateModal,
    openEditModal,
    handleSave,
    handleStartDateChange,
    handleEndDateChange,
  };
};
