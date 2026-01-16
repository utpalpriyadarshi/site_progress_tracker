import React, { useReducer, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Card, Text, Snackbar } from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import MilestoneModel from '../../models/MilestoneModel';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import {
  ProjectSiteSelector,
  MilestoneCard,
  EditProgressDialog,
} from './milestone-tracking/components';
import { useMilestoneData } from './milestone-tracking/hooks';
import {
  milestoneTrackingReducer,
  createMilestoneTrackingInitialState,
  validateMilestoneProgress,
} from './state/milestone-tracking';
import { logger } from '../services/LoggingService';
import { useAccessibility } from '../utils/accessibility';
import { MILESTONE_STATUS } from './milestone-tracking/utils/milestoneConstants';

/**
 * MilestoneTrackingScreen - Phase 2 Refactor
 *
 * Planning coordinator tracks milestone progress across sites.
 * Uses milestone_progress table which has planned dates & progress.
 * Refactored to use useReducer for state management (18 useState → 1 useReducer, 94% reduction)
 */

const MilestoneTrackingScreenComponent = ({
  milestones,
  sites,
  projects,
}: {
  milestones: MilestoneModel[];
  sites: any[];
  projects: any[];
}) => {
  // Initialize reducer state
  const [state, dispatch] = useReducer(
    milestoneTrackingReducer,
    createMilestoneTrackingInitialState()
  );
  const { announce } = useAccessibility();

  // Initialize project selection
  useEffect(() => {
    if (projects.length > 0 && !state.selection.selectedProjectId) {
      dispatch({ type: 'SET_SELECTED_PROJECT', payload: { projectId: projects[0].id } });
    }
  }, [projects, state.selection.selectedProjectId]);

  // Custom hooks (data loading only)
  const {
    milestoneProgress,
    loading,
    getProgressForMilestone,
    refreshProgress,
  } = useMilestoneData(state.selection.selectedProjectId, state.selection.selectedSiteId);

  // Selection handlers
  const handleSelectProject = useCallback((projectId: string) => {
    dispatch({ type: 'SET_SELECTED_PROJECT', payload: { projectId } });
  }, []);

  const handleSelectSite = useCallback((siteId: string) => {
    dispatch({ type: 'SET_SELECTED_SITE', payload: { siteId } });
  }, []);

  // Dialog handlers
  const openEditDialog = useCallback(
    (milestone: MilestoneModel) => {
      const progress = getProgressForMilestone(milestone.id);
      dispatch({
        type: 'OPEN_EDIT_DIALOG',
        payload: { milestone, progress },
      });
    },
    [getProgressForMilestone]
  );

  const closeEditDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_EDIT_DIALOG' });
  }, []);

  // Form field handlers
  const handleChangeProgressPercentage = useCallback((value: string) => {
    dispatch({ type: 'SET_PROGRESS_PERCENTAGE', payload: { value } });
  }, []);

  const handleChangeStatus = useCallback((status: string) => {
    dispatch({ type: 'SET_STATUS', payload: { status } });
  }, []);

  const handleChangeNotes = useCallback((notes: string) => {
    dispatch({ type: 'SET_NOTES', payload: { notes } });
  }, []);

  // Date handlers
  const handleChangePlannedStartDate = useCallback((date: Date | undefined) => {
    dispatch({ type: 'SET_PLANNED_START_DATE', payload: { date } });
  }, []);

  const handleChangePlannedEndDate = useCallback((date: Date | undefined) => {
    dispatch({ type: 'SET_PLANNED_END_DATE', payload: { date } });
  }, []);

  const handleChangeActualStartDate = useCallback((date: Date | undefined) => {
    dispatch({ type: 'SET_ACTUAL_START_DATE', payload: { date } });
  }, []);

  const handleChangeActualEndDate = useCallback((date: Date | undefined) => {
    dispatch({ type: 'SET_ACTUAL_END_DATE', payload: { date } });
  }, []);

  // Date picker handlers
  const handleShowPlannedStartPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SHOW_PLANNED_START_PICKER', payload: { show } });
  }, []);

  const handleShowPlannedEndPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SHOW_PLANNED_END_PICKER', payload: { show } });
  }, []);

  const handleShowActualStartPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SHOW_ACTUAL_START_PICKER', payload: { show } });
  }, []);

  const handleShowActualEndPicker = useCallback((show: boolean) => {
    dispatch({ type: 'SHOW_ACTUAL_END_PICKER', payload: { show } });
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!state.selection.selectedSiteId) {
      Alert.alert('Validation Error', 'Please select a site first');
      return;
    }

    // Validate form
    const { isValid, errors } = validateMilestoneProgress(state.form);
    if (!isValid) {
      Alert.alert('Validation Error', errors.progressPercentage || 'Invalid progress value');
      return;
    }

    const percentage = parseFloat(state.form.progressPercentage);

    try {
      await database.write(async () => {
        if (state.dialog.editingProgress) {
          // Update existing progress
          await state.dialog.editingProgress.update((record: any) => {
            record.progressPercentage = percentage;
            record.status = state.form.status;
            record.notes = state.form.notes;
            record.plannedStartDate = state.form.plannedStartDate?.getTime() || null;
            record.plannedEndDate = state.form.plannedEndDate?.getTime() || null;
            record.actualStartDate = state.form.actualStartDate?.getTime() || null;
            record.actualEndDate = state.form.actualEndDate?.getTime() || null;
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
          });
        } else {
          // Create new progress record
          const progressCollection = database.collections.get('milestone_progress');
          await progressCollection.create((record: any) => {
            record.milestoneId = state.dialog.editingMilestone!.id;
            record.siteId = state.selection.selectedSiteId;
            record.projectId = state.selection.selectedProjectId;
            record.progressPercentage = percentage;
            record.status = state.form.status;
            record.notes = state.form.notes;
            record.plannedStartDate = state.form.plannedStartDate?.getTime() || null;
            record.plannedEndDate = state.form.plannedEndDate?.getTime() || null;
            record.actualStartDate = state.form.actualStartDate?.getTime() || null;
            record.actualEndDate = state.form.actualEndDate?.getTime() || null;
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        }
      });

      dispatch({ type: 'SHOW_SNACKBAR', payload: { message: 'Milestone progress updated successfully' } });
      dispatch({ type: 'CLOSE_EDIT_DIALOG' });
      refreshProgress();
    } catch (error) {
      logger.error('[Milestone] Error saving', error as Error);
      Alert.alert('Error', 'Failed to save milestone progress');
    }
  }, [state, refreshProgress]);

  // Mark as achieved handler
  const handleMarkAsAchieved = useCallback(
    async (milestone: MilestoneModel) => {
      if (!state.selection.selectedSiteId) {
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
              record.siteId = state.selection.selectedSiteId;
              record.projectId = state.selection.selectedProjectId;
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

        dispatch({
          type: 'SHOW_SNACKBAR',
          payload: { message: `${milestone.milestoneName} marked as achieved!` },
        });
        announce(`${milestone.milestoneName} marked as achieved`);
        refreshProgress();
      } catch (error) {
        logger.error('[Milestone] Error marking as achieved', error as Error);
        Alert.alert('Error', 'Failed to mark milestone as achieved');
      }
    },
    [state.selection, getProgressForMilestone, refreshProgress, announce]
  );

  const filteredMilestones = milestones.filter((m) => m.projectId === state.selection.selectedProjectId);

  return (
    <View style={styles.container}>
      {/* Project & Site Selector */}
      <ProjectSiteSelector
        projects={projects}
        sites={sites}
        selectedProjectId={state.selection.selectedProjectId}
        selectedSiteId={state.selection.selectedSiteId}
        onSelectProject={handleSelectProject}
        onSelectSite={handleSelectSite}
      />

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <EmptyState
          icon="flag-checkered"
          title="No Milestones Set"
          message="Track important project dates by creating milestones"
          helpText="Milestones help you track key project deliverables and deadlines"
          variant="default"
        />
      ) : (
        <FlatList
          data={filteredMilestones}
          keyExtractor={(item) => item.id}
          renderItem={({ item: milestone }) => {
            const progress = getProgressForMilestone(milestone.id);
            return (
              <MilestoneCard
                milestone={milestone}
                progress={progress}
                selectedSiteId={state.selection.selectedSiteId}
                onEditProgress={openEditDialog}
                onMarkAsAchieved={handleMarkAsAchieved}
              />
            );
          }}
          style={styles.scrollView}
          contentContainerStyle={styles.listContent}
          accessible
          accessibilityLabel={`Milestones, ${filteredMilestones.length} items`}
        />
      )}

      {/* Edit Progress Dialog */}
      <EditProgressDialog
        visible={state.ui.editDialogVisible}
        milestone={state.dialog.editingMilestone}
        progressPercentage={state.form.progressPercentage}
        status={state.form.status}
        notes={state.form.notes}
        plannedStartDate={state.form.plannedStartDate}
        plannedEndDate={state.form.plannedEndDate}
        actualStartDate={state.form.actualStartDate}
        actualEndDate={state.form.actualEndDate}
        showPlannedStartPicker={state.ui.showPlannedStartPicker}
        showPlannedEndPicker={state.ui.showPlannedEndPicker}
        showActualStartPicker={state.ui.showActualStartPicker}
        showActualEndPicker={state.ui.showActualEndPicker}
        onChangeProgressPercentage={handleChangeProgressPercentage}
        onChangeStatus={handleChangeStatus}
        onChangeNotes={handleChangeNotes}
        onChangePlannedStartDate={handleChangePlannedStartDate}
        onChangePlannedEndDate={handleChangePlannedEndDate}
        onChangeActualStartDate={handleChangeActualStartDate}
        onChangeActualEndDate={handleChangeActualEndDate}
        onShowPlannedStartPicker={handleShowPlannedStartPicker}
        onShowPlannedEndPicker={handleShowPlannedEndPicker}
        onShowActualStartPicker={handleShowActualStartPicker}
        onShowActualEndPicker={handleShowActualEndPicker}
        onSave={handleSave}
        onCancel={closeEditDialog}
      />

      {/* Snackbar */}
      <Snackbar
        visible={state.ui.snackbarVisible}
        onDismiss={() => dispatch({ type: 'HIDE_SNACKBAR' })}
        duration={3000}
        style={styles.snackbar}
      >
        {state.ui.snackbarMessage}
      </Snackbar>
    </View>
  );
};

const enhance = withObservables([], () => ({
  milestones: database.collections.get('milestones').query(Q.where('is_active', true)),
  sites: database.collections.get('sites').query(),
  projects: database.collections.get('projects').query(),
}));

const MilestoneTrackingScreen = enhance(MilestoneTrackingScreenComponent as any);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  snackbar: {
    backgroundColor: '#388E3C',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const MilestoneTrackingScreenWithBoundary = () => (
  <ErrorBoundary name="MilestoneTrackingScreen">
    <MilestoneTrackingScreen />
  </ErrorBoundary>
);

export default MilestoneTrackingScreenWithBoundary;
