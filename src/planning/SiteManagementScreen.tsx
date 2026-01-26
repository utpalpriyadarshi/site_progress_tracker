/**
 * SiteManagementScreen
 *
 * Manages construction sites for the assigned project.
 * Refactored to use useReducer for state management (21 useState → 1 useReducer).
 *
 * @version 2.0.0
 * @since Phase 2 Code Improvements
 */

import React, { useReducer, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Portal,
  Dialog,
  List,
  IconButton,
  Text,
  Chip,
  Snackbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../models/SiteModel';
import UserModel from '../../models/UserModel';
import ProjectModel from '../../models/ProjectModel';
import SupervisorAssignmentPicker from './components/SupervisorAssignmentPicker';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { usePlanningContext } from './context';
import {
  siteManagementReducer,
  createInitialState,
  selectIsEditing,
} from './state/siteManagementReducer';

// ==================== Types ====================

interface SiteManagementInputProps {
  projectId: string;
}

interface SiteManagementObservedProps {
  sites: SiteModel[];
  projects: ProjectModel[];
}

type SiteManagementScreenProps = SiteManagementInputProps & SiteManagementObservedProps;

// ==================== Component ====================

const SiteManagementScreenComponent: React.FC<SiteManagementScreenProps> = ({
  sites,
  projects,
}) => {
  // Single useReducer replaces 21 useState calls
  const [state, dispatch] = useReducer(siteManagementReducer, undefined, createInitialState);

  // Destructure for cleaner access
  const { ui, form, dialog } = state;
  const isEditing = selectIsEditing(state);

  // ==================== Dialog Handlers ====================

  const openAddDialog = useCallback(() => {
    dispatch({
      type: 'OPEN_ADD_DIALOG',
      payload: { defaultProjectId: projects[0]?.id || '' },
    });
  }, [projects]);

  const openEditDialog = useCallback(async (site: SiteModel) => {
    // Load supervisor name
    let supervisorName = 'Unassigned';
    if (site.supervisorId) {
      try {
        const supervisor = await database.collections
          .get('users')
          .find(site.supervisorId) as UserModel;
        supervisorName = supervisor.fullName;
      } catch (error) {
        supervisorName = 'Unassigned';
      }
    }

    dispatch({
      type: 'OPEN_EDIT_DIALOG',
      payload: { site, supervisorName },
    });
  }, []);

  const closeDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_DIALOG' });
  }, []);

  const openDeleteDialog = useCallback((site: SiteModel) => {
    dispatch({ type: 'OPEN_DELETE_DIALOG', payload: { site } });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_DELETE_DIALOG' });
  }, []);

  // ==================== Supervisor Handler ====================

  const handleSupervisorSelect = useCallback(async (supervisorId?: string) => {
    let supervisorName = 'Unassigned';

    if (supervisorId) {
      try {
        const supervisor = await database.collections
          .get('users')
          .find(supervisorId) as UserModel;
        supervisorName = supervisor.fullName;
      } catch (error) {
        supervisorName = 'Unassigned';
      }
    }

    dispatch({
      type: 'SET_SUPERVISOR',
      payload: { id: supervisorId, name: supervisorName },
    });
  }, []);

  // ==================== Save Handler ====================

  const handleSave = useCallback(async () => {
    if (!form.siteName.trim() || !form.siteLocation.trim()) {
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Please fill in all required fields', type: 'error' },
      });
      return;
    }

    try {
      await database.write(async () => {
        if (dialog.editingSite) {
          // Update existing site
          await dialog.editingSite.update((site: any) => {
            site.name = form.siteName.trim();
            site.location = form.siteLocation.trim();
            site.projectId = form.selectedProjectId;
            site.supervisorId = form.selectedSupervisorId || null;
            site.plannedStartDate = form.plannedStartDate?.getTime() || null;
            site.plannedEndDate = form.plannedEndDate?.getTime() || null;
            site.actualStartDate = form.actualStartDate?.getTime() || null;
            site.actualEndDate = form.actualEndDate?.getTime() || null;
          });
          dispatch({
            type: 'SHOW_SNACKBAR',
            payload: { message: 'Site updated successfully', type: 'success' },
          });
        } else {
          // Create new site
          await database.collections.get('sites').create((site: any) => {
            site.name = form.siteName.trim();
            site.location = form.siteLocation.trim();
            site.projectId = form.selectedProjectId;
            site.supervisorId = form.selectedSupervisorId || null;
            site.plannedStartDate = form.plannedStartDate?.getTime() || null;
            site.plannedEndDate = form.plannedEndDate?.getTime() || null;
            site.actualStartDate = form.actualStartDate?.getTime() || null;
            site.actualEndDate = form.actualEndDate?.getTime() || null;
          });
          dispatch({
            type: 'SHOW_SNACKBAR',
            payload: { message: 'Site created successfully', type: 'success' },
          });
        }
      });
      closeDialog();
    } catch (error) {
      logger.error('Error saving site', error as Error, {
        component: 'SiteManagementScreen',
        action: 'handleSave',
        editMode: isEditing ? 'update' : 'create',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to save site: ' + (error as Error).message, type: 'error' },
      });
    }
  }, [form, dialog.editingSite, isEditing, closeDialog]);

  // ==================== Delete Handler ====================

  const handleDelete = useCallback(async () => {
    if (!dialog.siteToDelete) return;

    try {
      await database.write(async () => {
        await dialog.siteToDelete!.markAsDeleted();
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Site deleted successfully', type: 'success' },
      });
      closeDeleteDialog();
    } catch (error) {
      logger.error('Error deleting site', error as Error, {
        component: 'SiteManagementScreen',
        action: 'handleDelete',
        siteId: dialog.siteToDelete?.id,
        siteName: dialog.siteToDelete?.name,
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to delete site: ' + (error as Error).message, type: 'error' },
      });
    }
  }, [dialog.siteToDelete, closeDeleteDialog]);

  // ==================== Date Picker Handlers ====================

  const handlePlannedStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    dispatch({ type: 'SHOW_PLANNED_START_PICKER', payload: Platform.OS === 'ios' });
    if (selectedDate) {
      dispatch({ type: 'SET_PLANNED_START_DATE', payload: selectedDate });
    }
  }, []);

  const handlePlannedEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    dispatch({ type: 'SHOW_PLANNED_END_PICKER', payload: Platform.OS === 'ios' });
    if (selectedDate) {
      dispatch({ type: 'SET_PLANNED_END_DATE', payload: selectedDate });
    }
  }, []);

  const handleActualStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    dispatch({ type: 'SHOW_ACTUAL_START_PICKER', payload: Platform.OS === 'ios' });
    if (selectedDate) {
      dispatch({ type: 'SET_ACTUAL_START_DATE', payload: selectedDate });
    }
  }, []);

  const handleActualEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    dispatch({ type: 'SHOW_ACTUAL_END_PICKER', payload: Platform.OS === 'ios' });
    if (selectedDate) {
      dispatch({ type: 'SET_ACTUAL_END_DATE', payload: selectedDate });
    }
  }, []);

  // ==================== Render ====================

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="contained"
          icon="plus"
          onPress={openAddDialog}
          style={styles.addButton}
          accessible
          accessibilityLabel="Add new site"
          accessibilityRole="button"
          accessibilityHint="Opens form to create a new construction site"
        >
          Add Site
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        accessible
        accessibilityLabel={`Sites list, ${sites.length} sites`}
      >
        {sites.length === 0 ? (
          <EmptyState
            icon="office-building-outline"
            title="No Sites Configured"
            message="Create your first site to start planning construction activities"
            actionText="Add Site"
            onAction={openAddDialog}
            variant="default"
          />
        ) : (
          sites.map((site) => {
            const project = projects.find((p) => p.id === site.projectId);

            return (
              <Card key={site.id} style={styles.siteCard}>
                <Card.Content>
                  <View style={styles.siteHeader}>
                    <View style={styles.siteInfo}>
                      <Text style={styles.siteName}>{site.name}</Text>
                      <Text style={styles.siteLocation}>📍 {site.location}</Text>
                      {project && (
                        <Text style={styles.projectName}>
                          Project: {project.name}
                        </Text>
                      )}
                      <View style={styles.supervisorChip}>
                        <Chip
                          icon={site.supervisorId ? 'account-check' : 'account-alert'}
                          mode="outlined"
                          compact
                          style={site.supervisorId ? styles.assignedChip : styles.unassignedChip}
                        >
                          {site.supervisorId ? 'Assigned' : 'Unassigned'}
                        </Chip>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditDialog(site)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#FF3B30"
                        onPress={() => openDeleteDialog(site)}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Site Dialog */}
      <Portal>
        <Dialog visible={ui.dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>
            {isEditing ? 'Edit Site' : 'Add New Site'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Site Name *"
              value={form.siteName}
              onChangeText={(text) => dispatch({ type: 'SET_SITE_NAME', payload: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Location *"
              value={form.siteLocation}
              onChangeText={(text) => dispatch({ type: 'SET_SITE_LOCATION', payload: text })}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />

            {projects.length > 0 && (
              <View style={styles.projectSelector}>
                <Text style={styles.label}>Select Project:</Text>
                <ScrollView style={styles.projectList}>
                  {projects.map((project) => (
                    <List.Item
                      key={project.id}
                      title={project.name}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={
                            form.selectedProjectId === project.id
                              ? 'radiobox-marked'
                              : 'radiobox-blank'
                          }
                        />
                      )}
                      onPress={() => dispatch({ type: 'SET_SELECTED_PROJECT_ID', payload: project.id })}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Supervisor Assignment */}
            <View style={styles.supervisorSection}>
              <Text style={styles.label}>Assign Supervisor:</Text>
              <Button
                mode="outlined"
                icon="account"
                onPress={() => dispatch({ type: 'SET_SUPERVISOR_PICKER_VISIBLE', payload: true })}
                style={styles.supervisorButton}
              >
                {form.supervisorName}
              </Button>
            </View>

            {/* Date Fields */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Schedule Dates</Text>

              {/* Planned Start Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Planned Start:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => dispatch({ type: 'SHOW_PLANNED_START_PICKER', payload: true })}
                  style={styles.dateButton}
                >
                  {form.plannedStartDate ? form.plannedStartDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {form.plannedStartDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => dispatch({ type: 'SET_PLANNED_START_DATE', payload: undefined })}
                  />
                )}
              </View>

              {/* Planned End Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Planned End:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => dispatch({ type: 'SHOW_PLANNED_END_PICKER', payload: true })}
                  style={styles.dateButton}
                >
                  {form.plannedEndDate ? form.plannedEndDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {form.plannedEndDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => dispatch({ type: 'SET_PLANNED_END_DATE', payload: undefined })}
                  />
                )}
              </View>

              {/* Actual Start Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Actual Start:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => dispatch({ type: 'SHOW_ACTUAL_START_PICKER', payload: true })}
                  style={styles.dateButton}
                >
                  {form.actualStartDate ? form.actualStartDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {form.actualStartDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => dispatch({ type: 'SET_ACTUAL_START_DATE', payload: undefined })}
                  />
                )}
              </View>

              {/* Actual End Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Actual End:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => dispatch({ type: 'SHOW_ACTUAL_END_PICKER', payload: true })}
                  style={styles.dateButton}
                >
                  {form.actualEndDate ? form.actualEndDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {form.actualEndDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => dispatch({ type: 'SET_ACTUAL_END_DATE', payload: undefined })}
                  />
                )}
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleSave}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={ui.deleteDialogVisible}
          onDismiss={closeDeleteDialog}
        >
          <Dialog.Title>Delete Site</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{dialog.siteToDelete?.name}"? This will
              also delete all associated items and data.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDeleteDialog}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#FF3B30">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {ui.showPlannedStartPicker && (
        <DateTimePicker
          value={form.plannedStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePlannedStartDateChange}
        />
      )}
      {ui.showPlannedEndPicker && (
        <DateTimePicker
          value={form.plannedEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePlannedEndDateChange}
        />
      )}
      {ui.showActualStartPicker && (
        <DateTimePicker
          value={form.actualStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleActualStartDateChange}
        />
      )}
      {ui.showActualEndPicker && (
        <DateTimePicker
          value={form.actualEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleActualEndDateChange}
        />
      )}

      {/* Supervisor Assignment Picker */}
      <SupervisorAssignmentPicker
        visible={ui.supervisorPickerVisible}
        selectedSupervisorId={form.selectedSupervisorId}
        onDismiss={() => dispatch({ type: 'SET_SUPERVISOR_PICKER_VISIBLE', payload: false })}
        onSelect={handleSupervisorSelect}
      />

      {/* Snackbar for notifications - wrapped in Portal to appear above dialogs */}
      <Portal>
        <Snackbar
          visible={ui.snackbarVisible}
          onDismiss={() => dispatch({ type: 'HIDE_SNACKBAR' })}
          duration={3000}
          style={ui.snackbarType === 'error' ? styles.errorSnackbar : styles.successSnackbar}
        >
          {ui.snackbarMessage}
        </Snackbar>
      </Portal>
    </View>
  );
};

// Enhance component with WatermelonDB observables - filter by assigned project
const enhance = withObservables(
  ['projectId'],
  ({ projectId }: SiteManagementInputProps) => ({
    sites: database.collections
      .get<SiteModel>('sites')
      .query(Q.where('project_id', projectId)), // Only show sites for assigned project
    projects: database.collections.get<ProjectModel>('projects').query(),
  })
);

// Type assertion: withObservables transforms observable queries to resolved arrays
const EnhancedSiteManagementScreen = enhance(
  SiteManagementScreenComponent as React.ComponentType<SiteManagementInputProps>
);

// Wrapper component that provides projectId from context
const SiteManagementScreen = () => {
  const { projectId } = usePlanningContext();

  if (!projectId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <EmptyState
          icon="folder-alert-outline"
          title="No Project Assigned"
          message="Please contact your administrator to assign a project to your account."
          variant="large"
        />
      </View>
    );
  }

  return <EnhancedSiteManagementScreen projectId={projectId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  addButton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  siteCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  siteLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  supervisorChip: {
    marginTop: 4,
    flexDirection: 'row',
  },
  assignedChip: {
    backgroundColor: '#E8F5E9',
  },
  unassignedChip: {
    backgroundColor: '#FFF3E0',
  },
  actions: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 12,
  },
  projectSelector: {
    marginTop: 8,
    marginBottom: 12,
  },
  projectList: {
    maxHeight: 150,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supervisorSection: {
    marginTop: 8,
  },
  supervisorButton: {
    marginTop: 4,
  },
  dateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    width: 100,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginRight: 4,
  },
  errorSnackbar: {
    backgroundColor: '#D32F2F',
  },
  successSnackbar: {
    backgroundColor: '#388E3C',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const SiteManagementScreenWithBoundary = () => (
  <ErrorBoundary name="SiteManagementScreen">
    <SiteManagementScreen />
  </ErrorBoundary>
);

export default SiteManagementScreenWithBoundary;
