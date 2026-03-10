/**
 * SiteManagementScreen
 *
 * Manages construction sites for the assigned project.
 * Refactored to use useReducer for state management (21 useState → 1 useReducer).
 *
 * @version 2.0.0
 * @since Phase 2 Code Improvements
 */

import React, { useReducer, useCallback, useState, useEffect } from 'react';
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
import KeyDateSiteModel from '../../models/KeyDateSiteModel';
import KeyDateModel from '../../models/KeyDateModel';
import TeamMemberPicker from './components/TeamMemberPicker';
import KeyDateSelector from './key-dates/components/KeyDateSelector';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { usePlanningContext } from './context';
import {
  siteManagementReducer,
  createInitialState,
  selectIsEditing,
} from './state/siteManagementReducer';
import { COLORS } from '../theme/colors';

// ==================== Types ====================

interface SiteManagementInputProps {
  projectId: string;
}

interface SiteManagementObservedProps {
  sites: SiteModel[];
  projects: ProjectModel[];
}

type SiteManagementScreenProps = SiteManagementInputProps & SiteManagementObservedProps;

// ==================== SiteCard Sub-Component ====================

interface SiteCardProps {
  site: SiteModel;
  project?: ProjectModel;
  onEdit: (site: SiteModel) => void;
  onDelete: (site: SiteModel) => void;
  onDuplicate: (site: SiteModel) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ site, project, onEdit, onDelete, onDuplicate }) => {
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [designerName, setDesignerName] = useState<string | null>(null);
  const [linkedKDs, setLinkedKDs] = useState<Array<{ id: string; code: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Load supervisor name
        let supName: string | null = null;
        if (site.supervisorId) {
          try {
            const sup = await database.collections.get('users').find(site.supervisorId) as UserModel;
            supName = sup.fullName;
          } catch { supName = null; }
        }

        // Load designer name
        let desName: string | null = null;
        if (site.designEngineerId) {
          try {
            const des = await database.collections.get('users').find(site.designEngineerId) as UserModel;
            desName = des.fullName;
          } catch { desName = null; }
        }

        // Load linked key dates via key_date_sites junction
        const kdSites = await database.collections
          .get<KeyDateSiteModel>('key_date_sites')
          .query(Q.where('site_id', site.id))
          .fetch();

        let kds: Array<{ id: string; code: string }> = [];
        if (kdSites.length > 0) {
          const kdIds = kdSites.map(kds => kds.keyDateId);
          const keyDates = await database.collections
            .get<KeyDateModel>('key_dates')
            .query(Q.where('id', Q.oneOf(kdIds)))
            .fetch();
          kds = keyDates
            .map(kd => ({ id: kd.id, code: kd.code }))
            .sort((a, b) => a.code.localeCompare(b.code));
        }

        if (!cancelled) {
          setSupervisorName(supName);
          setDesignerName(desName);
          setLinkedKDs(kds);
        }
      } catch { /* silently ignore */ }
    };
    load();
    return () => { cancelled = true; };
  }, [site.id, site.supervisorId, site.designEngineerId]);

  return (
    <Card mode="elevated" style={styles.siteCard}>
      <Card.Content>
        <View style={styles.siteHeader}>
          <View style={styles.siteInfo}>
            <Text style={styles.siteName}>{site.name}</Text>
            <Text style={styles.siteLocation}>📍 {site.location}</Text>
            {project && (
              <Text style={styles.projectName}>Project: {project.name}</Text>
            )}

            {/* All chips in one wrapping row: supervisor, designer, then linked KDs */}
            <View style={styles.chipsRow}>
              <Chip
                icon={site.supervisorId ? 'account-hard-hat' : 'account-alert'}
                mode="outlined"
                compact
                style={site.supervisorId ? styles.supervisorAssignedChip : styles.unassignedChip}
                textStyle={styles.chipText}
              >
                {site.supervisorId ? (supervisorName ?? 'Supervisor') : 'No Supv'}
              </Chip>
              <Chip
                icon={site.designEngineerId ? 'account-edit' : 'account-alert'}
                mode="outlined"
                compact
                style={site.designEngineerId ? styles.designerAssignedChip : styles.unassignedChip}
                textStyle={styles.chipText}
              >
                {site.designEngineerId ? (designerName ?? 'Designer') : 'No Dsgn'}
              </Chip>
              {linkedKDs.map(kd => (
                <Chip
                  key={kd.id}
                  compact
                  mode="flat"
                  style={styles.kdChip}
                  textStyle={styles.kdChipText}
                >
                  {kd.code}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <IconButton
              icon="content-copy"
              size={20}
              onPress={() => onDuplicate(site)}
              accessibilityLabel="Duplicate site"
            />
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(site)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#FF3B30"
              onPress={() => onDelete(site)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

// ==================== Component ====================

const SiteManagementScreenComponent: React.FC<SiteManagementScreenProps> = ({
  sites,
  projects,
  projectId,
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

    // Load designer name
    let designerName = 'Unassigned';
    if (site.designEngineerId) {
      try {
        const designer = await database.collections
          .get('users')
          .find(site.designEngineerId) as UserModel;
        designerName = designer.fullName;
      } catch (error) {
        designerName = 'Unassigned';
      }
    }

    // Auto-populate plannedEndDate from associated Key Date if not set
    if (!site.plannedEndDate) {
      try {
        const kdSites = await database.collections
          .get<KeyDateSiteModel>('key_date_sites')
          .query(Q.where('site_id', site.id))
          .fetch();

        if (kdSites.length > 0) {
          // Find the latest target date from all associated KDs
          let latestTargetDate: number | null = null;
          for (const kdSite of kdSites) {
            const kd = await database.collections
              .get<KeyDateModel>('key_dates')
              .find(kdSite.keyDateId);
            if (kd.targetDate && (!latestTargetDate || kd.targetDate > latestTargetDate)) {
              latestTargetDate = kd.targetDate;
            }
          }

          // Persist to DB and update the site reference for the dialog
          if (latestTargetDate) {
            await database.write(async () => {
              await site.update((s: any) => {
                s.plannedEndDate = latestTargetDate;
              });
            });
          }
        }
      } catch (error) {
        logger.error('Error auto-populating site date from KD', error as Error, {
          component: 'SiteManagementScreen',
          action: 'openEditDialog',
        });
      }
    }

    dispatch({
      type: 'OPEN_EDIT_DIALOG',
      payload: { site, supervisorName, designerName },
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

  // ==================== Designer Handler ====================

  const handleDesignerSelect = useCallback(async (designerId?: string) => {
    let designerName = 'Unassigned';

    if (designerId) {
      try {
        const designer = await database.collections
          .get('users')
          .find(designerId) as UserModel;
        designerName = designer.fullName;
      } catch (error) {
        designerName = 'Unassigned';
      }
    }

    dispatch({
      type: 'SET_DESIGNER',
      payload: { id: designerId, name: designerName },
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
            site.designEngineerId = form.selectedDesignEngineerId || null;
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
          const newSite = await database.collections.get('sites').create((site: any) => {
            site.name = form.siteName.trim();
            site.location = form.siteLocation.trim();
            site.projectId = form.selectedProjectId;
            site.supervisorId = form.selectedSupervisorId || null;
            site.designEngineerId = form.selectedDesignEngineerId || null;
            site.plannedStartDate = form.plannedStartDate?.getTime() || null;
            site.plannedEndDate = form.plannedEndDate?.getTime() || null;
            site.actualStartDate = form.actualStartDate?.getTime() || null;
            site.actualEndDate = form.actualEndDate?.getTime() || null;
          });

          // If a KD was selected, create the key_date_sites link in the same transaction
          if (form.linkedKDId) {
            const contribution = Math.min(100, Math.max(0, parseInt(form.kdContribution, 10) || 100));
            await database.collections.get('key_date_sites').create((record: any) => {
              record.keyDateId = form.linkedKDId;
              record.siteId = (newSite as any).id;
              record.contributionPercentage = contribution;
              record.progressPercentage = 0;
              record.status = 'not_started';
              record.updatedAt = Date.now();
              record.appSyncStatus = 'pending';
              record.version = 1;
            });
          }

          dispatch({
            type: 'SHOW_SNACKBAR',
            payload: {
              message: form.linkedKDId
                ? `Site created and linked to Key Date (${form.kdContribution}% contribution)`
                : 'Site created successfully',
              type: 'success',
            },
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

  // ==================== Duplicate Handler ====================

  const handleDuplicate = useCallback(async (site: SiteModel) => {
    try {
      await database.write(async () => {
        await database.collections.get('sites').create((record: any) => {
          record.name = site.name + ' (Copy)';
          record.location = site.location;
          record.projectId = projectId;
          record.supervisorId = null;
          record.plannedStartDate = null;
          record.plannedEndDate = null;
          record.actualStartDate = null;
          record.actualEndDate = null;
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: `Duplicated "${site.name}" successfully`, type: 'success' },
      });
    } catch (error) {
      logger.error('Error duplicating site', error as Error, {
        component: 'SiteManagementScreen',
        action: 'handleDuplicate',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to duplicate site', type: 'error' },
      });
    }
  }, [projectId]);

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
              <SiteCard
                key={site.id}
                site={site}
                project={project}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                onDuplicate={handleDuplicate}
              />
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Site Dialog */}
      <Portal>
        <Dialog visible={ui.dialogVisible} onDismiss={closeDialog} style={styles.editDialog}>
          <Dialog.Title>
            {isEditing ? 'Edit Site' : 'Add New Site'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
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
                  <ScrollView style={styles.projectList} nestedScrollEnabled>
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

              {/* Team Member Assignment */}
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

              {/* Designer Assignment */}
              <View style={styles.supervisorSection}>
                <Text style={styles.label}>Assign Designer:</Text>
                <Button
                  mode="outlined"
                  icon="account-hard-hat"
                  onPress={() => dispatch({ type: 'SET_DESIGNER_PICKER_VISIBLE', payload: true })}
                  style={styles.supervisorButton}
                >
                  {form.designerName}
                </Button>
              </View>

              {/* Key Date Assignment — only shown when creating a new site */}
              {!isEditing && form.selectedProjectId ? (
                <View style={styles.kdSection}>
                  <Text style={styles.sectionTitle}>Link to Key Date</Text>
                  <Text style={styles.kdHelperText}>
                    Optionally assign this site to a Key Date for progress tracking
                  </Text>
                  <KeyDateSelector
                    projectId={form.selectedProjectId}
                    selectedKeyDateId={form.linkedKDId}
                    onSelect={(kdId: string | null) => dispatch({ type: 'SET_LINKED_KD', payload: kdId })}
                    label=""
                  />
                  {form.linkedKDId && (
                    <View style={styles.contributionRow}>
                      <Text style={styles.dateLabel}>Contribution %:</Text>
                      <TextInput
                        value={form.kdContribution}
                        onChangeText={(text) => dispatch({ type: 'SET_KD_CONTRIBUTION', payload: text })}
                        keyboardType="number-pad"
                        mode="outlined"
                        style={styles.contributionInput}
                        dense
                        right={<TextInput.Affix text="%" />}
                      />
                    </View>
                  )}
                </View>
              ) : null}

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
            </ScrollView>
          </Dialog.ScrollArea>
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

      {/* Team Member Assignment Picker */}
      <TeamMemberPicker
        visible={ui.supervisorPickerVisible}
        selectedUserId={form.selectedSupervisorId}
        projectId={projectId}
        roleFilter="Supervisor"
        title="Assign Supervisor"
        onDismiss={() => dispatch({ type: 'SET_SUPERVISOR_PICKER_VISIBLE', payload: false })}
        onSelect={handleSupervisorSelect}
      />

      {/* Designer Assignment Picker */}
      <TeamMemberPicker
        visible={ui.designerPickerVisible}
        selectedUserId={form.selectedDesignEngineerId}
        projectId={projectId}
        roleFilter="DesignEngineer"
        title="Assign Design Engineer"
        onDismiss={() => dispatch({ type: 'SET_DESIGNER_PICKER_VISIBLE', payload: false })}
        onSelect={handleDesignerSelect}
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
    projects: database.collections.get<ProjectModel>('projects').query(Q.where('id', projectId)),
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingBottom: 4,
  },
  supervisorAssignedChip: {
    backgroundColor: COLORS.SUCCESS_BG,
  },
  designerAssignedChip: {
    backgroundColor: '#E3F2FD', // light blue
  },
  unassignedChip: {
    backgroundColor: COLORS.WARNING_BG,
  },
  chipText: {
    fontSize: 11,
  },
  kdChip: {
    backgroundColor: '#EDE7F6', // light purple
  },
  kdChipText: {
    fontSize: 10,
    color: '#5E35B1',
    fontWeight: '600',
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
  kdSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  kdHelperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  contributionInput: {
    flex: 1,
    marginLeft: 8,
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
  editDialog: {
    maxHeight: '80%',
  },
  scrollArea: {
    paddingHorizontal: 24,
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
