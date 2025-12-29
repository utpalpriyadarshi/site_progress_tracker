import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Portal,
  Dialog,
  Text,
  Chip,
  Snackbar,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import MilestoneModel from '../../models/MilestoneModel';
import MilestoneProgressModel from '../../models/MilestoneProgressModel';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

/**
 * MilestoneTrackingScreen (v2.11 Phase 4)
 *
 * Planning coordinator tracks milestone progress across sites.
 * Uses milestone_progress table which has planned dates & progress.
 */

interface MilestoneWithProgress {
  milestone: MilestoneModel;
  progress: MilestoneProgressModel[];
}

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
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgressModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit dialog state
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editingProgress, setEditingProgress] = useState<MilestoneProgressModel | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneModel | null>(null);
  const [progressPercentage, setProgressPercentage] = useState('0');
  const [status, setStatus] = useState('not_started');
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

  // Snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadMilestoneProgress();
    }
  }, [selectedProjectId, selectedSiteId]);

  const loadMilestoneProgress = async () => {
    try {
      setLoading(true);
      const progressCollection = database.collections.get<MilestoneProgressModel>('milestone_progress');

      let query = progressCollection.query(Q.where('project_id', selectedProjectId));

      if (selectedSiteId) {
        query = progressCollection.query(
          Q.where('project_id', selectedProjectId),
          Q.where('site_id', selectedSiteId)
        );
      }

      const progressData = await query.fetch();
      setMilestoneProgress(progressData);
    } catch (error) {
      logger.error('[Milestone] Error loading progress', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForMilestone = (milestoneId: string): MilestoneProgressModel | null => {
    return milestoneProgress.find(p => p.milestoneId === milestoneId) || null;
  };

  const openEditDialog = async (milestone: MilestoneModel) => {
    setEditingMilestone(milestone);
    const progress = getProgressForMilestone(milestone.id);

    if (progress) {
      setEditingProgress(progress);
      setProgressPercentage(progress.progressPercentage.toString());
      setStatus(progress.status);
      setNotes(progress.notes || '');
      setPlannedStartDate(progress.plannedStartDate ? new Date(progress.plannedStartDate) : undefined);
      setPlannedEndDate(progress.plannedEndDate ? new Date(progress.plannedEndDate) : undefined);
      setActualStartDate(progress.actualStartDate ? new Date(progress.actualStartDate) : undefined);
      setActualEndDate(progress.actualEndDate ? new Date(progress.actualEndDate) : undefined);
    } else {
      setEditingProgress(null);
      setProgressPercentage('0');
      setStatus('not_started');
      setNotes('');
      setPlannedStartDate(undefined);
      setPlannedEndDate(undefined);
      setActualStartDate(undefined);
      setActualEndDate(undefined);
    }

    setEditDialogVisible(true);
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

      setSnackbarMessage('Milestone progress updated successfully');
      setSnackbarVisible(true);
      setEditDialogVisible(false);
      loadMilestoneProgress();
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
            record.status = 'completed';
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
            record.status = 'completed';
            record.actualEndDate = Date.now();
            record.updatedBy = 'planner';
            record.updatedAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        }
      });

      setSnackbarMessage(`${milestone.milestoneName} marked as achieved!`);
      setSnackbarVisible(true);
      loadMilestoneProgress();
    } catch (error) {
      logger.error('[Milestone] Error marking as achieved', error as Error);
      Alert.alert('Error', 'Failed to mark milestone as achieved');
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'on_hold':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const filteredSites = sites.filter(s => s.projectId === selectedProjectId);

  return (
    <View style={styles.container}>
      {/* Project & Site Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <Title>Select Project & Site</Title>

          {/* Project Selector */}
          <Text style={styles.label}>Project:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {projects.map((project) => (
              <Chip
                key={project.id}
                mode={selectedProjectId === project.id ? 'flat' : 'outlined'}
                selected={selectedProjectId === project.id}
                onPress={() => setSelectedProjectId(project.id)}
                style={styles.chip}
              >
                {project.name}
              </Chip>
            ))}
          </ScrollView>

          {/* Site Selector */}
          <Text style={styles.label}>Site:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            <Chip
              mode={selectedSiteId === '' ? 'flat' : 'outlined'}
              selected={selectedSiteId === ''}
              onPress={() => setSelectedSiteId('')}
              style={styles.chip}
            >
              All Sites
            </Chip>
            {filteredSites.map((site) => (
              <Chip
                key={site.id}
                mode={selectedSiteId === site.id ? 'flat' : 'outlined'}
                selected={selectedSiteId === site.id}
                onPress={() => setSelectedSiteId(site.id)}
                style={styles.chip}
              >
                {site.name}
              </Chip>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Milestones List */}
      <ScrollView style={styles.scrollView}>
        {milestones.filter(m => m.projectId === selectedProjectId).map((milestone) => {
          const progress = getProgressForMilestone(milestone.id);
          const progressValue = progress ? progress.progressPercentage / 100 : 0;
          const statusValue = progress?.status || 'not_started';

          return (
            <Card key={milestone.id} style={styles.milestoneCard}>
              <Card.Content>
                <View style={styles.milestoneHeader}>
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneCode}>{milestone.milestoneCode}</Text>
                    <Text style={styles.milestoneName}>{milestone.milestoneName}</Text>
                    {milestone.description && (
                      <Text style={styles.description}>{milestone.description}</Text>
                    )}
                  </View>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: getStatusColor(statusValue) }]}
                    textStyle={styles.statusChipText}
                  >
                    {statusValue.toUpperCase().replace('_', ' ')}
                  </Chip>
                </View>

                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>
                    Progress: {Math.round(progressValue * 100)}%
                  </Text>
                  <ProgressBar
                    progress={progressValue}
                    color={getStatusColor(statusValue)}
                    style={styles.progressBar}
                  />
                </View>

                {progress && (
                  <View style={styles.datesSection}>
                    {progress.plannedStartDate && (
                      <Text style={styles.dateText}>
                        📅 Planned: {new Date(progress.plannedStartDate).toLocaleDateString()} -
                        {progress.plannedEndDate ? new Date(progress.plannedEndDate).toLocaleDateString() : 'TBD'}
                      </Text>
                    )}
                    {progress.actualStartDate && (
                      <Text style={styles.dateText}>
                        ✅ Actual: {new Date(progress.actualStartDate).toLocaleDateString()} -
                        {progress.actualEndDate ? new Date(progress.actualEndDate).toLocaleDateString() : 'In Progress'}
                      </Text>
                    )}
                    {progress.notes && (
                      <Text style={styles.notesText}>📝 {progress.notes}</Text>
                    )}
                  </View>
                )}

                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    onPress={() => openEditDialog(milestone)}
                    style={styles.actionButton}
                    disabled={!selectedSiteId}
                  >
                    Edit Progress
                  </Button>
                  {statusValue !== 'completed' && (
                    <Button
                      mode="contained"
                      onPress={() => handleMarkAsAchieved(milestone)}
                      style={styles.actionButton}
                      disabled={!selectedSiteId}
                    >
                      Mark Achieved
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        })}

        {milestones.filter(m => m.projectId === selectedProjectId).length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No milestones found for this project</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Edit Progress Dialog */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>
            {editingMilestone?.milestoneCode} - {editingMilestone?.milestoneName}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Dialog.Content>
                {/* Progress Percentage */}
                <TextInput
                  label="Progress (%)"
                  value={progressPercentage}
                  onChangeText={setProgressPercentage}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />

                {/* Status */}
                <Text style={styles.label}>Status:</Text>
                <View style={styles.statusSelector}>
                  {['not_started', 'in_progress', 'completed', 'on_hold'].map((statusOption) => (
                    <Chip
                      key={statusOption}
                      mode={status === statusOption ? 'flat' : 'outlined'}
                      selected={status === statusOption}
                      onPress={() => setStatus(statusOption)}
                      style={styles.statusSelectorChip}
                    >
                      {statusOption.replace('_', ' ').toUpperCase()}
                    </Chip>
                  ))}
                </View>

                {/* Planned Dates */}
                <Text style={styles.sectionTitle}>Planned Dates</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Start:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowPlannedStartPicker(true)}
                    style={styles.dateButton}
                  >
                    {plannedStartDate ? plannedStartDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {plannedStartDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => setPlannedStartDate(undefined)}
                    />
                  )}
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>End:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowPlannedEndPicker(true)}
                    style={styles.dateButton}
                  >
                    {plannedEndDate ? plannedEndDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {plannedEndDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => setPlannedEndDate(undefined)}
                    />
                  )}
                </View>

                {/* Actual Dates */}
                <Text style={styles.sectionTitle}>Actual Dates</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Start:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowActualStartPicker(true)}
                    style={styles.dateButton}
                  >
                    {actualStartDate ? actualStartDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {actualStartDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => setActualStartDate(undefined)}
                    />
                  )}
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>End:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => setShowActualEndPicker(true)}
                    style={styles.dateButton}
                  >
                    {actualEndDate ? actualEndDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {actualEndDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => setActualEndDate(undefined)}
                    />
                  )}
                </View>

                {/* Notes */}
                <TextInput
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </Dialog.Content>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {showPlannedStartPicker && (
        <DateTimePicker
          value={plannedStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPlannedStartPicker(Platform.OS === 'ios');
            if (selectedDate) setPlannedStartDate(selectedDate);
          }}
        />
      )}
      {showPlannedEndPicker && (
        <DateTimePicker
          value={plannedEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPlannedEndPicker(Platform.OS === 'ios');
            if (selectedDate) setPlannedEndDate(selectedDate);
          }}
        />
      )}
      {showActualStartPicker && (
        <DateTimePicker
          value={actualStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowActualStartPicker(Platform.OS === 'ios');
            if (selectedDate) setActualStartDate(selectedDate);
          }}
        />
      )}
      {showActualEndPicker && (
        <DateTimePicker
          value={actualEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowActualEndPicker(Platform.OS === 'ios');
            if (selectedDate) setActualEndDate(selectedDate);
          }}
        />
      )}

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
  selectorCard: {
    margin: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  milestoneCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  datesSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 12,
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statusSelectorChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    width: 60,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginRight: 4,
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
