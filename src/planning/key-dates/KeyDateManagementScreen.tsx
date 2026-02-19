/**
 * KeyDateManagementScreen
 *
 * Main screen for managing contract key dates.
 * Displays key dates list with filtering, search, and CRUD operations.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import React, { useReducer, useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Switch,
} from 'react-native';
import {
  Button,
  Portal,
  Dialog,
  TextInput,
  Text,
  Searchbar,
  Snackbar,
  Menu,
  Chip,
  SegmentedButtons,
  Divider,
  FAB,
} from 'react-native-paper';
import { database } from '../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import KeyDateModel, { KeyDateStatus } from '../../../models/KeyDateModel';
import ProjectModel from '../../../models/ProjectModel';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { EmptyState } from '../../components/common/EmptyState';
import { usePlanningContext } from '../context';
import { KeyDateCard, KeyDateSiteManager } from './components';
import { useTargetDateCalculation } from './hooks';
import {
  keyDateReducer,
  createKeyDateInitialState,
  selectIsEditing,
  selectHasActiveFilters,
  validateKeyDateForm,
} from './state';
import {
  KEY_DATE_CATEGORY_COLORS,
  getCategoryOptions,
} from './utils/keyDateConstants';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

// ==================== Component Props ====================

interface KeyDateManagementInputProps {
  projectId: string;
}

interface KeyDateManagementObservedProps {
  keyDates: KeyDateModel[];
  project: ProjectModel;
}

type KeyDateManagementProps = KeyDateManagementInputProps & KeyDateManagementObservedProps;

// ==================== Main Component ====================

const KeyDateManagementScreenComponent: React.FC<KeyDateManagementProps> = ({
  keyDates,
  projectId,
  project,
}) => {
  const [state, dispatch] = useReducer(keyDateReducer, undefined, createKeyDateInitialState);
  const isEditing = selectIsEditing(state);
  const hasActiveFilters = selectHasActiveFilters(state);

  // Hook for auto-calculating targetDate from targetDays
  const { handleTargetDaysChange } = useTargetDateCalculation({
    projectStartDate: project?.startDate || null,
    dispatch,
  });

  // State for site manager dialog
  const [siteManagerVisible, setSiteManagerVisible] = useState(false);
  const [siteManagerKeyDate, setSiteManagerKeyDate] = useState<KeyDateModel | null>(null);

  // Calculate total weightage
  const totalWeightage = useMemo(() => {
    return keyDates.reduce((sum, kd) => sum + (kd.weightage || 0), 0);
  }, [keyDates]);

  // Memoized filtered key dates
  const filteredKeyDates = useMemo(() => {
    let result = keyDates;

    // Filter by search query
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      result = result.filter(
        (kd) =>
          kd.code.toLowerCase().includes(query) ||
          kd.description.toLowerCase().includes(query) ||
          kd.categoryName.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (state.filters.categoryFilter !== 'all') {
      result = result.filter((kd) => kd.category === state.filters.categoryFilter);
    }

    // Filter by status
    if (state.filters.statusFilter !== 'all') {
      result = result.filter((kd) => kd.status === state.filters.statusFilter);
    }

    // Sort by sequence order
    return result.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [keyDates, state.filters]);

  // Group key dates by category for section headers (prepared for future SectionList view)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _groupedKeyDates = useMemo(() => {
    const groups: Record<string, KeyDateModel[]> = {};
    filteredKeyDates.forEach((kd) => {
      const key = kd.category;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(kd);
    });
    return groups;
  }, [filteredKeyDates]);

  // ==================== Handlers ====================

  // Calculate next sequence order for new key dates
  const getNextSequenceOrder = useCallback(() => {
    if (keyDates.length === 0) return 1;
    return Math.max(...keyDates.map(kd => kd.sequenceOrder)) + 1;
  }, [keyDates]);

  const handleOpenAdd = useCallback(() => {
    dispatch({ type: 'OPEN_ADD_DIALOG' });
    // Set auto-incremented sequence order
    dispatch({ type: 'SET_FORM_SEQUENCE', payload: getNextSequenceOrder().toString() });
  }, [getNextSequenceOrder]);

  const handleEdit = useCallback((keyDate: KeyDateModel) => {
    dispatch({ type: 'OPEN_EDIT_DIALOG', payload: { keyDate } });
  }, []);

  const handleManageSites = useCallback((keyDate: KeyDateModel) => {
    setSiteManagerKeyDate(keyDate);
    setSiteManagerVisible(true);
  }, []);

  const handleCloseSiteManager = useCallback(() => {
    setSiteManagerVisible(false);
    setSiteManagerKeyDate(null);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_EDIT_DIALOG' });
  }, []);

  // Handler for delete action
  const handleDelete = useCallback((keyDate: KeyDateModel) => {
    dispatch({ type: 'OPEN_DELETE_DIALOG', payload: { keyDate } });
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_DELETE_DIALOG' });
  }, []);

  // Save Key Date
  const handleSave = useCallback(async () => {
    const { isValid, errors } = validateKeyDateForm(state.form);
    if (!isValid) {
      const errorMessage = Object.values(errors).join('\n');
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: errorMessage, type: 'error' },
      });
      return;
    }

    // Validate total weightage doesn't exceed 100%
    const newWeightage = parseFloat(state.form.weightage) || 0;
    let currentTotalWeightage = totalWeightage;

    // If editing, subtract the old weightage from total
    if (state.dialog.editingKeyDate) {
      currentTotalWeightage -= (state.dialog.editingKeyDate.weightage || 0);
    }

    // Add the new weightage
    const projectedTotal = currentTotalWeightage + newWeightage;

    if (projectedTotal > 100) {
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: {
          message: `Total weightage cannot exceed 100%. Current total: ${currentTotalWeightage.toFixed(2)}%, Adding: ${newWeightage.toFixed(2)}%, Would be: ${projectedTotal.toFixed(2)}%`,
          type: 'error'
        },
      });
      return;
    }

    try {
      await database.write(async () => {
        if (state.dialog.editingKeyDate) {
          // Update existing
          await state.dialog.editingKeyDate.update((record: any) => {
            record.code = state.form.code.trim();
            record.category = state.form.category;
            record.categoryName = state.form.categoryName.trim();
            record.description = state.form.description.trim();
            record.targetDays = parseInt(state.form.targetDays, 10);
            record.targetDate = state.form.targetDate?.getTime() || null;
            record.status = state.form.status;
            record.progressPercentage = parseFloat(state.form.progressPercentage);
            record.delayDamagesInitial = parseFloat(state.form.delayDamagesInitial);
            record.delayDamagesExtended = parseFloat(state.form.delayDamagesExtended);
            record.delayDamagesSpecial = state.form.delayDamagesSpecial || null;
            record.sequenceOrder = parseInt(state.form.sequenceOrder, 10);
            record.weightage = parseFloat(state.form.weightage) || 0;
            record.designWeightage = parseFloat(state.form.designWeightage) || 0;
            record.progressMode = state.form.progressMode || 'auto';
            record.dependencies = state.form.dependencies || null;
            record.updatedAt = Date.now();
          });
          dispatch({
            type: 'SHOW_SNACKBAR',
            payload: { message: 'Key date updated successfully', type: 'success' },
          });
        } else {
          // Create new
          await database.collections.get('key_dates').create((record: any) => {
            record.code = state.form.code.trim();
            record.category = state.form.category;
            record.categoryName = state.form.categoryName.trim();
            record.description = state.form.description.trim();
            record.targetDays = parseInt(state.form.targetDays, 10);
            record.targetDate = state.form.targetDate?.getTime() || null;
            record.status = state.form.status;
            record.progressPercentage = parseFloat(state.form.progressPercentage) || 0;
            record.delayDamagesInitial = parseFloat(state.form.delayDamagesInitial) || 1;
            record.delayDamagesExtended = parseFloat(state.form.delayDamagesExtended) || 10;
            record.delayDamagesSpecial = state.form.delayDamagesSpecial || null;
            record.projectId = projectId;
            record.sequenceOrder = parseInt(state.form.sequenceOrder, 10) || 1;
            record.weightage = parseFloat(state.form.weightage) || 0;
            record.designWeightage = parseFloat(state.form.designWeightage) || 0;
            record.progressMode = state.form.progressMode || 'auto';
            record.dependencies = state.form.dependencies || null;
            record.createdBy = 'planner';
            record.updatedAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
          dispatch({
            type: 'SHOW_SNACKBAR',
            payload: { message: 'Key date created successfully', type: 'success' },
          });
        }
      });
      handleCloseEditDialog();
    } catch (error) {
      logger.error('Error saving key date', error as Error, {
        component: 'KeyDateManagementScreen',
        action: 'handleSave',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to save key date', type: 'error' },
      });
    }
  }, [state.form, state.dialog.editingKeyDate, projectId, handleCloseEditDialog, totalWeightage]);

  // Confirm Delete
  const handleConfirmDelete = useCallback(async () => {
    if (!state.dialog.keyDateToDelete) return;

    try {
      await database.write(async () => {
        await state.dialog.keyDateToDelete!.markAsDeleted();
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Key date deleted successfully', type: 'success' },
      });
      handleCloseDeleteDialog();
    } catch (error) {
      logger.error('Error deleting key date', error as Error, {
        component: 'KeyDateManagementScreen',
        action: 'handleConfirmDelete',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to delete key date', type: 'error' },
      });
    }
  }, [state.dialog.keyDateToDelete, handleCloseDeleteDialog]);

  // ==================== Duplicate Handler ====================

  const handleDuplicate = useCallback(async (keyDate: KeyDateModel) => {
    try {
      const nextSeq = getNextSequenceOrder();
      await database.write(async () => {
        await database.collections.get('key_dates').create((record: any) => {
          record.code = keyDate.code + '-copy';
          record.category = keyDate.category;
          record.categoryName = keyDate.categoryName;
          record.description = keyDate.description;
          record.targetDays = keyDate.targetDays;
          record.targetDate = keyDate.targetDate || null;
          record.delayDamagesInitial = keyDate.delayDamagesInitial;
          record.delayDamagesExtended = keyDate.delayDamagesExtended;
          record.delayDamagesSpecial = keyDate.delayDamagesSpecial || null;
          record.sequenceOrder = nextSeq;
          record.weightage = keyDate.weightage || 0;
          record.designWeightage = keyDate.designWeightage || 0;
          record.progressMode = keyDate.progressMode || 'auto';
          record.dependencies = keyDate.dependencies || null;
          record.projectId = projectId;
          record.status = 'not_started';
          record.progressPercentage = 0;
          record.actualDate = null;
          record.createdBy = 'planner';
          record.updatedAt = Date.now();
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: `Duplicated "${keyDate.code}" successfully`, type: 'success' },
      });
    } catch (error) {
      logger.error('Error duplicating key date', error as Error, {
        component: 'KeyDateManagementScreen',
        action: 'handleDuplicate',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to duplicate key date', type: 'error' },
      });
    }
  }, [projectId, getNextSequenceOrder]);

  // ==================== Render ====================

  const renderKeyDateItem = useCallback(
    ({ item }: { item: KeyDateModel }) => (
      <KeyDateCard
        keyDate={item}
        onEdit={handleEdit}
        onManageSites={handleManageSites}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleManageSites, handleDuplicate, handleDelete]
  );

  const categoryOptions = getCategoryOptions();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search key dates..."
          onChangeText={(text) => dispatch({ type: 'SET_SEARCH_QUERY', payload: text })}
          value={state.filters.searchQuery}
          style={styles.searchbar}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Category:</Text>
          <Menu
            visible={state.ui.filterMenuVisible}
            onDismiss={() => dispatch({ type: 'TOGGLE_FILTER_MENU' })}
            anchor={
              <Chip
                mode="outlined"
                onPress={() => dispatch({ type: 'TOGGLE_FILTER_MENU' })}
                style={styles.filterChip}
              >
                {state.filters.categoryFilter === 'all'
                  ? 'All Categories'
                  : state.filters.categoryFilter}
              </Chip>
            }
          >
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_CATEGORY_FILTER', payload: 'all' });
                dispatch({ type: 'TOGGLE_FILTER_MENU' });
              }}
              title="All Categories"
            />
            <Divider />
            {categoryOptions.map((cat) => (
              <Menu.Item
                key={cat.value}
                onPress={() => {
                  dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat.value });
                  dispatch({ type: 'TOGGLE_FILTER_MENU' });
                }}
                title={`${cat.value} - ${cat.label}`}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.statusFilterRow}>
          <SegmentedButtons
            value={state.filters.statusFilter}
            onValueChange={(value) =>
              dispatch({ type: 'SET_STATUS_FILTER', payload: value as KeyDateStatus | 'all' })
            }
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'not_started', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'delayed', label: 'Delayed' },
            ]}
            style={styles.segmentedButtons}
            density="small"
          />
        </View>

        {hasActiveFilters && (
          <Button
            mode="text"
            onPress={() => dispatch({ type: 'CLEAR_FILTERS' })}
            compact
          >
            Clear Filters
          </Button>
        )}
      </View>

      {/* Total Weightage Display */}
      <View style={[
        styles.totalWeightageContainer,
        totalWeightage > 100 && styles.totalWeightageError,
        totalWeightage === 100 && styles.totalWeightageComplete
      ]}>
        <View style={styles.totalWeightageRow}>
          <Text style={styles.totalWeightageLabel}>Total Weightage:</Text>
          <Text style={[
            styles.totalWeightageValue,
            totalWeightage > 100 && styles.totalWeightageValueError,
            totalWeightage === 100 && styles.totalWeightageValueComplete
          ]}>
            {totalWeightage.toFixed(2)}%
          </Text>
        </View>
        {totalWeightage > 100 && (
          <Text style={styles.totalWeightageWarning}>
            ⚠️ Total exceeds 100%! Please adjust weightages.
          </Text>
        )}
        {totalWeightage === 100 && (
          <Text style={styles.totalWeightageSuccess}>
            ✓ Total weightage is exactly 100%
          </Text>
        )}
      </View>

      {/* Key Dates List */}
      {filteredKeyDates.length === 0 ? (
        <EmptyState
          icon="calendar-check"
          title="No Key Dates Found"
          message={
            hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Create your first key date to track contract milestones'
          }
          actionText={hasActiveFilters ? undefined : 'Add Key Date'}
          onAction={hasActiveFilters ? undefined : handleOpenAdd}
          variant="default"
        />
      ) : (
        <FlatList
          data={filteredKeyDates}
          keyExtractor={(item) => item.id}
          renderItem={renderKeyDateItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleOpenAdd}
        accessibilityLabel="Add new key date"
      />

      {/* Edit/Add Dialog */}
      <Portal>
        <Dialog
          visible={state.ui.editDialogVisible}
          onDismiss={handleCloseEditDialog}
          style={styles.dialog}
        >
          <Dialog.Title>
            {isEditing ? 'Edit Key Date' : 'Add Key Date'}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <ScrollView style={styles.dialogScrollView} showsVerticalScrollIndicator>
              <View style={styles.formContainer}>
              <TextInput
                label="Code *"
                value={state.form.code}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_CODE', payload: text })}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., KD-G-01"
              />

              <View style={styles.categoryRow}>
                <Text style={styles.fieldLabel}>Category:</Text>
                <View style={styles.categoryChips}>
                  {categoryOptions.map((cat) => (
                    <Chip
                      key={cat.value}
                      mode={state.form.category === cat.value ? 'flat' : 'outlined'}
                      selected={state.form.category === cat.value}
                      onPress={() => {
                        dispatch({ type: 'SET_FORM_CATEGORY', payload: cat.value });
                        dispatch({ type: 'SET_FORM_CATEGORY_NAME', payload: cat.label });
                      }}
                      style={[
                        styles.categoryChip,
                        state.form.category === cat.value && {
                          backgroundColor: KEY_DATE_CATEGORY_COLORS[cat.value],
                        },
                      ]}
                      textStyle={
                        state.form.category === cat.value
                          ? { color: 'white' }
                          : undefined
                      }
                      compact
                    >
                      {cat.value}
                    </Chip>
                  ))}
                </View>
              </View>

              <TextInput
                label="Category Name"
                value={state.form.categoryName}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_CATEGORY_NAME', payload: text })}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., General, Design"
              />

              <TextInput
                label="Description *"
                value={state.form.description}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_DESCRIPTION', payload: text })}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />

              <TextInput
                label="Target Days (from commencement) *"
                value={state.form.targetDays}
                onChangeText={handleTargetDaysChange}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              {/* Calculated Target Date Display */}
              {state.form.targetDate && (
                <View style={styles.targetDateDisplay}>
                  <Text style={styles.targetDateLabel}>Calculated Target Date:</Text>
                  <Text style={styles.targetDateValue}>
                    {state.form.targetDate.toLocaleDateString()}
                  </Text>
                </View>
              )}

              <TextInput
                label="Sequence Order"
                value={state.form.sequenceOrder}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_SEQUENCE', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                label="Weightage %"
                value={state.form.weightage}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_WEIGHTAGE', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g., 10 (used for project progress rollup)"
              />

              {/* Progress Mode Selector */}
              <Text style={styles.fieldLabel}>Progress Mode:</Text>
              <SegmentedButtons
                value={state.form.progressMode}
                onValueChange={(value) =>
                  dispatch({ type: 'SET_FORM_PROGRESS_MODE', payload: value as any })
                }
                buttons={[
                  { value: 'auto', label: 'Auto' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'binary', label: 'Binary' },
                ]}
                style={styles.progressModeButtons}
                density="small"
              />

              {/* Manual: show editable Progress % */}
              {state.form.progressMode === 'manual' && (
                <TextInput
                  label="Progress %"
                  value={state.form.progressPercentage}
                  onChangeText={(text) => dispatch({ type: 'SET_FORM_PROGRESS', payload: text })}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0-100"
                />
              )}

              {/* Binary: show Done/Not Done toggle */}
              {state.form.progressMode === 'binary' && (
                <View style={styles.binaryToggleRow}>
                  <Text style={styles.binaryLabel}>
                    {state.form.progressPercentage === '100' ? 'Done' : 'Not Done'}
                  </Text>
                  <Switch
                    value={state.form.progressPercentage === '100'}
                    onValueChange={(done) =>
                      dispatch({ type: 'SET_FORM_PROGRESS', payload: done ? '100' : '0' })
                    }
                  />
                </View>
              )}

              {/* Design Weightage only shown for auto mode */}
              {state.form.progressMode === 'auto' && (
                <TextInput
                  label="Design Weightage %"
                  value={state.form.designWeightage}
                  onChangeText={(text) => dispatch({ type: 'SET_FORM_DESIGN_WEIGHTAGE', payload: text })}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0-100 (% of KD progress from design docs)"
                />
              )}

              <Divider style={styles.divider} />
              <Text style={styles.sectionTitle}>Delay Damages</Text>

              <TextInput
                label="Initial Rate (Days 1-28)"
                value={state.form.delayDamagesInitial}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_DAMAGES_INITIAL', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                label="Extended Rate (Day 29+)"
                value={state.form.delayDamagesExtended}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_DAMAGES_EXTENDED', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                label="Special Damages (optional)"
                value={state.form.delayDamagesSpecial}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_DAMAGES_SPECIAL', payload: text })}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., 0.1% of Contract Price"
              />
            </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseEditDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={state.ui.deleteDialogVisible}
          onDismiss={handleCloseDeleteDialog}
        >
          <Dialog.Title>Delete Key Date</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{state.dialog.keyDateToDelete?.code}"?
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDeleteDialog}>Cancel</Button>
            <Button onPress={handleConfirmDelete} textColor={COLORS.ERROR}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Site Manager Dialog */}
        {siteManagerKeyDate && (
          <KeyDateSiteManager
            visible={siteManagerVisible}
            keyDate={siteManagerKeyDate}
            projectId={projectId}
            onDismiss={handleCloseSiteManager}
          />
        )}
      </Portal>

      {/* Snackbar - wrapped in Portal to appear above dialogs */}
      <Portal>
        <Snackbar
          visible={state.ui.snackbarVisible}
          onDismiss={() => dispatch({ type: 'HIDE_SNACKBAR' })}
          duration={3000}
          style={
            state.ui.snackbarType === 'error'
              ? styles.errorSnackbar
              : styles.successSnackbar
          }
        >
          {state.ui.snackbarMessage}
        </Snackbar>
      </Portal>

    </View>
  );
};

// ==================== WatermelonDB Enhancement ====================

const enhance = withObservables(
  ['projectId'],
  ({ projectId }: KeyDateManagementInputProps) => ({
    keyDates: database.collections
      .get<KeyDateModel>('key_dates')
      .query(Q.where('project_id', projectId))
      .observe(),
    project: database.collections
      .get<ProjectModel>('projects')
      .findAndObserve(projectId),
  })
);

const EnhancedKeyDateManagementScreen = enhance(
  KeyDateManagementScreenComponent as React.ComponentType<KeyDateManagementInputProps>
);

// ==================== Wrapper with Context ====================

const KeyDateManagementScreen: React.FC = () => {
  const { projectId } = usePlanningContext();

  if (!projectId) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="folder-alert-outline"
          title="No Project Assigned"
          message="Please contact your administrator to assign a project to your account."
          variant="large"
        />
      </View>
    );
  }

  return <EnhancedKeyDateManagementScreen projectId={projectId} />;
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#666',
  },
  filterChip: {
    marginRight: 8,
  },
  statusFilterRow: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: 0,
    maxHeight: 450,
  },
  dialogScrollView: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginRight: 4,
  },
  progressModeButtons: {
    marginBottom: 12,
  },
  binaryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  binaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  targetDateDisplay: {
    backgroundColor: COLORS.SUCCESS_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetDateLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  targetDateValue: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: 'bold',
  },
  errorSnackbar: {
    backgroundColor: '#D32F2F',
  },
  successSnackbar: {
    backgroundColor: '#388E3C',
  },
  totalWeightageContainer: {
    backgroundColor: COLORS.INFO_BG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  totalWeightageError: {
    backgroundColor: COLORS.ERROR_BG,
    borderBottomColor: '#FFCDD2',
  },
  totalWeightageComplete: {
    backgroundColor: COLORS.SUCCESS_BG,
    borderBottomColor: '#C8E6C9',
  },
  totalWeightageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalWeightageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  totalWeightageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  totalWeightageValueError: {
    color: '#C62828',
  },
  totalWeightageValueComplete: {
    color: '#2E7D32',
  },
  totalWeightageWarning: {
    fontSize: 12,
    color: '#C62828',
    marginTop: 4,
    fontWeight: '500',
  },
  totalWeightageSuccess: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '500',
  },
});

// ==================== Export ====================

const KeyDateManagementScreenWithBoundary: React.FC = () => (
  <ErrorBoundary name="KeyDateManagementScreen">
    <KeyDateManagementScreen />
  </ErrorBoundary>
);

export default KeyDateManagementScreenWithBoundary;
