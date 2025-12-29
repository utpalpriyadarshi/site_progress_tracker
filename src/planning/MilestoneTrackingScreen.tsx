import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Snackbar } from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import MilestoneModel from '../../models/MilestoneModel';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  ProjectSiteSelector,
  MilestoneCard,
  EditProgressDialog,
} from './milestone-tracking/components';
import { useMilestoneData, useEditProgress } from './milestone-tracking/hooks';

/**
 * MilestoneTrackingScreen (v2.11 Phase 4)
 *
 * Planning coordinator tracks milestone progress across sites.
 * Uses milestone_progress table which has planned dates & progress.
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
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Initialize project selection
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Custom hooks
  const {
    milestoneProgress,
    loading,
    getProgressForMilestone,
    refreshProgress,
  } = useMilestoneData(selectedProjectId, selectedSiteId);

  const editProgressHook = useEditProgress({
    selectedProjectId,
    selectedSiteId,
    getProgressForMilestone,
    onSuccess: (message) => {
      setSnackbarMessage(message);
      setSnackbarVisible(true);
    },
    onRefresh: refreshProgress,
  });

  const filteredMilestones = milestones.filter(m => m.projectId === selectedProjectId);

  return (
    <View style={styles.container}>
      {/* Project & Site Selector */}
      <ProjectSiteSelector
        projects={projects}
        sites={sites}
        selectedProjectId={selectedProjectId}
        selectedSiteId={selectedSiteId}
        onSelectProject={setSelectedProjectId}
        onSelectSite={setSelectedSiteId}
      />

      {/* Milestones List */}
      <ScrollView style={styles.scrollView}>
        {filteredMilestones.map((milestone) => {
          const progress = getProgressForMilestone(milestone.id);

          return (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              progress={progress}
              selectedSiteId={selectedSiteId}
              onEditProgress={editProgressHook.openEditDialog}
              onMarkAsAchieved={editProgressHook.handleMarkAsAchieved}
            />
          );
        })}

        {filteredMilestones.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No milestones found for this project</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Edit Progress Dialog */}
      <EditProgressDialog
        visible={editProgressHook.editDialogVisible}
        milestone={editProgressHook.editingMilestone}
        progressPercentage={editProgressHook.progressPercentage}
        status={editProgressHook.status}
        notes={editProgressHook.notes}
        plannedStartDate={editProgressHook.plannedStartDate}
        plannedEndDate={editProgressHook.plannedEndDate}
        actualStartDate={editProgressHook.actualStartDate}
        actualEndDate={editProgressHook.actualEndDate}
        showPlannedStartPicker={editProgressHook.showPlannedStartPicker}
        showPlannedEndPicker={editProgressHook.showPlannedEndPicker}
        showActualStartPicker={editProgressHook.showActualStartPicker}
        showActualEndPicker={editProgressHook.showActualEndPicker}
        onChangeProgressPercentage={editProgressHook.setProgressPercentage}
        onChangeStatus={editProgressHook.setStatus}
        onChangeNotes={editProgressHook.setNotes}
        onChangePlannedStartDate={editProgressHook.setPlannedStartDate}
        onChangePlannedEndDate={editProgressHook.setPlannedEndDate}
        onChangeActualStartDate={editProgressHook.setActualStartDate}
        onChangeActualEndDate={editProgressHook.setActualEndDate}
        onShowPlannedStartPicker={editProgressHook.setShowPlannedStartPicker}
        onShowPlannedEndPicker={editProgressHook.setShowPlannedEndPicker}
        onShowActualStartPicker={editProgressHook.setShowActualStartPicker}
        onShowActualEndPicker={editProgressHook.setShowActualEndPicker}
        onSave={editProgressHook.handleSave}
        onCancel={editProgressHook.closeEditDialog}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
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
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
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
