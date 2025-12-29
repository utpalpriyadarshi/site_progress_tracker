/**
 * Hook for managing milestone progress editing
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../../models/database';
import MilestoneModel from '../../../../models/MilestoneModel';
import MilestoneProgressModel from '../../../../models/MilestoneProgressModel';
import { logger } from '../../../services/LoggingService';
import { MILESTONE_STATUS } from '../utils/milestoneConstants';

interface UseEditProgressProps {
  selectedProjectId: string;
  selectedSiteId: string;
  getProgressForMilestone: (milestoneId: string) => MilestoneProgressModel | null;
  onSuccess: (message: string) => void;
  onRefresh: () => void;
}

export const useEditProgress = ({
  selectedProjectId,
  selectedSiteId,
  getProgressForMilestone,
  onSuccess,
  onRefresh,
}: UseEditProgressProps) => {
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingProgress, setEditingProgress] = useState<MilestoneProgressModel | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneModel | null>(null);
  const [progressPercentage, setProgressPercentage] = useState('0');
  const [status, setStatus] = useState<string>(MILESTONE_STATUS.NOT_STARTED);
  const [notes, setNotes] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(undefined);
  const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(undefined);
  const [actualStartDate, setActualStartDate] = useState<Date | undefined>(undefined);
  const [actualEndDate, setActualEndDate] = useState<Date | undefined>(undefined);

  // Date pickers
  const [showPlannedStartPicker, setShowPlannedStartPicker] = useState(false);
  const [showPlannedEndPicker, setShowPlannedEndPicker] = useState(false);
  const [showActualStartPicker, setShowActualStartPicker] = useState(false);
  const [showActualEndPicker, setShowActualEndPicker] = useState(false);

  const openEditDialog = async (milestone: MilestoneModel) => {
    setEditingMilestone(milestone);
    const progress = getProgressForMilestone(milestone.id);

    if (progress) {
      setEditingProgress(progress);
      setProgressPercentage(progress.progressPercentage.toString());
      setStatus(progress.status as any);
      setNotes(progress.notes || '');
      setPlannedStartDate(progress.plannedStartDate ? new Date(progress.plannedStartDate) : undefined);
      setPlannedEndDate(progress.plannedEndDate ? new Date(progress.plannedEndDate) : undefined);
      setActualStartDate(progress.actualStartDate ? new Date(progress.actualStartDate) : undefined);
      setActualEndDate(progress.actualEndDate ? new Date(progress.actualEndDate) : undefined);
    } else {
      setEditingProgress(null);
      setProgressPercentage('0');
      setStatus(MILESTONE_STATUS.NOT_STARTED);
      setNotes('');
      setPlannedStartDate(undefined);
      setPlannedEndDate(undefined);
      setActualStartDate(undefined);
      setActualEndDate(undefined);
    }

    setEditDialogVisible(true);
  };

  const closeEditDialog = () => {
    setEditDialogVisible(false);
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
            record.updatedBy = 'planner'; // TODO: Get from auth context
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
      setEditDialogVisible(false);
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
