/**
 * KeyDateManagementScreen
 *
 * Main screen for managing contract key dates.
 * Displays key dates list with filtering, search, and CRUD operations.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import React, { useReducer, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import {
  Appbar,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import KeyDateModel, { KeyDateCategory, KeyDateStatus } from '../../../models/KeyDateModel';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { EmptyState } from '../../components/common/EmptyState';
import { usePlanningContext } from '../context';
import { KeyDateCard } from './components';
import {
  keyDateReducer,
  createKeyDateInitialState,
  selectIsEditing,
  selectHasActiveFilters,
  validateKeyDateForm,
  validateProgressForm,
} from './state';
import {
  KEY_DATE_CATEGORY_COLORS,
  getCategoryOptions,
  getStatusOptions,
} from './utils/keyDateConstants';
import { logger } from '../../services/LoggingService';

// ==================== Component Props ====================

interface KeyDateManagementInputProps {
  projectId: string;
}

interface KeyDateManagementObservedProps {
  keyDates: KeyDateModel[];
}

type KeyDateManagementProps = KeyDateManagementInputProps & KeyDateManagementObservedProps;

// ==================== Main Component ====================

const KeyDateManagementScreenComponent: React.FC<KeyDateManagementProps> = ({
  keyDates,
  projectId,
}) => {
  const [state, dispatch] = useReducer(keyDateReducer, undefined, createKeyDateInitialState);
  const isEditing = selectIsEditing(state);
  const hasActiveFilters = selectHasActiveFilters(state);

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

  // Group key dates by category for section headers
  const groupedKeyDates = useMemo(() => {
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

  const handleOpenAdd = useCallback(() => {
    dispatch({ type: 'OPEN_ADD_DIALOG' });
  }, []);

  const handleEdit = useCallback((keyDate: KeyDateModel) => {
    dispatch({ type: 'OPEN_EDIT_DIALOG', payload: { keyDate } });
  }, []);

  const handleUpdateProgress = useCallback((keyDate: KeyDateModel) => {
    dispatch({ type: 'OPEN_PROGRESS_DIALOG', payload: { keyDate } });
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_EDIT_DIALOG' });
  }, []);

  const handleCloseProgressDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_PROGRESS_DIALOG' });
  }, []);

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
            record.dependencies = state.form.dependencies || null;
            record.createdBy = 'planner';
            record.createdAt = Date.now();
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
  }, [state.form, state.dialog.editingKeyDate, projectId, handleCloseEditDialog]);

  // Save Progress Update
  const handleSaveProgress = useCallback(async () => {
    const { isValid, errors } = validateProgressForm(state.progressForm);
    if (!isValid) {
      const errorMessage = Object.values(errors).join('\n');
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: errorMessage, type: 'error' },
      });
      return;
    }

    if (!state.dialog.editingKeyDate) return;

    try {
      await database.write(async () => {
        await state.dialog.editingKeyDate!.update((record: any) => {
          record.progressPercentage = parseFloat(state.progressForm.progressPercentage);
          record.status = state.progressForm.status;
          record.actualDate = state.progressForm.actualDate?.getTime() || null;
          record.updatedAt = Date.now();
        });
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Progress updated successfully', type: 'success' },
      });
      handleCloseProgressDialog();
    } catch (error) {
      logger.error('Error updating progress', error as Error, {
        component: 'KeyDateManagementScreen',
        action: 'handleSaveProgress',
      });
      dispatch({
        type: 'SHOW_SNACKBAR',
        payload: { message: 'Failed to update progress', type: 'error' },
      });
    }
  }, [state.progressForm, state.dialog.editingKeyDate, handleCloseProgressDialog]);

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

  // ==================== Render ====================

  const renderKeyDateItem = useCallback(
    ({ item }: { item: KeyDateModel }) => (
      <KeyDateCard
        keyDate={item}
        onEdit={handleEdit}
        onUpdateProgress={handleUpdateProgress}
      />
    ),
    [handleEdit, handleUpdateProgress]
  );

  const categoryOptions = getCategoryOptions();
  const statusOptions = getStatusOptions();

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
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
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
                onChangeText={(text) => dispatch({ type: 'SET_FORM_TARGET_DAYS', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                label="Sequence Order"
                value={state.form.sequenceOrder}
                onChangeText={(text) => dispatch({ type: 'SET_FORM_SEQUENCE', payload: text })}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

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
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={handleCloseEditDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Progress Update Dialog */}
        <Dialog
          visible={state.ui.progressDialogVisible}
          onDismiss={handleCloseProgressDialog}
        >
          <Dialog.Title>Update Progress</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.progressDialogSubtitle}>
              {state.dialog.editingKeyDate?.code}: {state.dialog.editingKeyDate?.description}
            </Text>

            <TextInput
              label="Progress (%)"
              value={state.progressForm.progressPercentage}
              onChangeText={(text) => dispatch({ type: 'SET_PROGRESS_PERCENTAGE', payload: text })}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Status:</Text>
            <View style={styles.statusChips}>
              {statusOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  mode={state.progressForm.status === opt.value ? 'flat' : 'outlined'}
                  selected={state.progressForm.status === opt.value}
                  onPress={() => dispatch({ type: 'SET_PROGRESS_STATUS', payload: opt.value })}
                  style={styles.statusChip}
                  compact
                >
                  {opt.label}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseProgressDialog}>Cancel</Button>
            <Button onPress={handleSaveProgress} mode="contained">
              Save
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
            <Button onPress={handleConfirmDelete} textColor="#F44336">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
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
  dialogScrollArea: {
    paddingHorizontal: 0,
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
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  progressDialogSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    marginTop: 4,
  },
  errorSnackbar: {
    backgroundColor: '#D32F2F',
  },
  successSnackbar: {
    backgroundColor: '#388E3C',
  },
});

// ==================== Export ====================

const KeyDateManagementScreenWithBoundary: React.FC = () => (
  <ErrorBoundary name="KeyDateManagementScreen">
    <KeyDateManagementScreen />
  </ErrorBoundary>
);

export default KeyDateManagementScreenWithBoundary;
