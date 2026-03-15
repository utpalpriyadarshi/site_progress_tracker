/**
 * ItemEditScreen - Phase 2 Refactor
 *
 * Edit existing WBS items with pre-populated data
 * - Lock WBS code (read-only after creation)
 * - Handle baseline-locked items (read-only mode)
 * - Update existing records (not create)
 * Refactored to use useReducer for state management
 */

import React, { useReducer, useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Appbar,
  Surface,
  Snackbar,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { SpinnerLoading } from '../components/common/LoadingState';

// Components
import {
  LockedBanner,
  WBSCodeDisplay,
  ItemDetailsSection,
  ScheduleSection,
  QuantitySection,
  CriticalPathSection,
  RiskSection,
  KeyDateSection,
  ItemInfoCard,
} from './item-edit/components';

// State management
import {
  itemEditReducer,
  createItemEditInitialState,
  validateItemEditForm,
  calculateProgress,
  type ItemEditFormData,
} from './state/item-form';
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import { logger } from '../services/LoggingService';
import { EmptyState } from '../components/common/EmptyState';
import { useAccessibility } from '../utils/accessibility';
import { usePlanningContext } from './context';

// Utils
import { MESSAGES, SNACKBAR_DURATION, NAVIGATION_DELAY } from './item-edit/utils';
import { COLORS } from '../theme/colors';
import { rollupSiteWBSProgress } from './utils/wbsRollup';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemEdit'>;

const ItemEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const itemId = route.params?.itemId;
  const { announce } = useAccessibility();
  const { projectId } = usePlanningContext();

  // Initialize reducer state
  const [state, dispatch] = useReducer(itemEditReducer, createItemEditInitialState());

  // Snackbar state (keep separate for simplicity)
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Load item data on mount
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        logger.error('[ItemEdit] No item ID provided');
        dispatch({ type: 'LOADING_ERROR' });
        return;
      }

      try {
        dispatch({ type: 'START_LOADING' });
        const loadedItem = await database.collections
          .get('items')
          .find(itemId) as ItemModel;

        dispatch({ type: 'SET_ITEM_DATA', payload: { item: loadedItem } });
      } catch (error) {
        logger.error('[ItemEdit] Error loading item', error as Error);
        dispatch({ type: 'LOADING_ERROR' });
      }
    };

    loadItem();
  }, [itemId]);

  // Handle field updates
  const updateField = useCallback((field: keyof ItemEditFormData, value: any) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } });
  }, []);

  const updateNumericField = useCallback((field: keyof ItemEditFormData, value: string) => {
    dispatch({ type: 'UPDATE_NUMERIC_FIELD', payload: { field, value } });
  }, []);

  // Handle date changes with auto-calculation
  const handleStartDateChange = useCallback((date: Date) => {
    dispatch({ type: 'SET_START_DATE', payload: { date } });
  }, []);

  const handleEndDateChange = useCallback((date: Date) => {
    dispatch({ type: 'SET_END_DATE', payload: { date } });
  }, []);

  const handleDurationChange = useCallback((duration: string) => {
    dispatch({ type: 'SET_DURATION', payload: { duration } });
  }, []);

  // Handle update
  const handleUpdate = useCallback(async () => {
    // Validate form
    const { isValid, errors } = validateItemEditForm(state.form);
    if (!isValid) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: { errors } });
      return;
    }

    if (!state.data.originalItem) {
      return;
    }

    dispatch({ type: 'START_SAVING' });
    try {
      // Calculate status based on completed quantity
      const completedQty = parseFloat(state.form.completedQuantity) || 0;
      const plannedQty = parseFloat(state.form.quantity);
      let itemStatus = 'not_started';

      if (completedQty >= plannedQty) {
        itemStatus = 'completed';
      } else if (completedQty > 0) {
        itemStatus = 'in_progress';
      }

      // Update database record
      await database.write(async () => {
        await state.data.originalItem!.update((i: any) => {
          // Basic fields
          i.name = state.form.name.trim();
          i.categoryId = state.form.categoryId;

          // Quantity and measurements
          i.plannedQuantity = plannedQty;
          i.completedQuantity = completedQty;
          i.unitOfMeasurement = state.form.unit.trim() || 'Set';

          // Status (auto-calculated from progress)
          i.status = itemStatus;

          // Schedule
          i.plannedStartDate = state.form.startDate.getTime();
          i.plannedEndDate = state.form.endDate.getTime();

          // Planning fields (only update if not locked)
          if (!state.ui.isLocked) {
            i.baselineStartDate = state.form.startDate.getTime();
            i.baselineEndDate = state.form.endDate.getTime();
          }

          // Phase and Milestone
          i.projectPhase = state.form.phase;
          i.isMilestone = state.form.isMilestone;

          // Critical Path and Risk
          i.isCriticalPath = state.form.isCriticalPath;
          i.floatDays = state.form.isCriticalPath ? 0 : (parseFloat(state.form.floatDays) || 0);
          i.dependencyRisk = state.form.dependencyRisk;
          i.riskNotes = state.form.riskNotes.trim() || null;

          // Key Date linking (Phase 5c)
          i.keyDateId = state.form.keyDateId || null;
        });
      });

      // Roll up progress to parent and ancestor items
      if (state.data.originalItem!.parentWbsCode) {
        await rollupSiteWBSProgress(state.data.originalItem!.siteId, database);
      }

      dispatch({ type: 'COMPLETE_SAVING' });
      setSnackbarMessage(MESSAGES.SUCCESS_UPDATE);
      setSnackbarType('success');
      setSnackbarVisible(true);
      announce(`${state.form.name} updated successfully`);

      // Navigate back after showing snackbar
      setTimeout(() => {
        navigation.goBack();
      }, NAVIGATION_DELAY);
    } catch (error) {
      logger.error('[ItemEdit] Error updating item', error as Error);
      setSnackbarMessage(MESSAGES.ERROR_UPDATE_FAILED);
      setSnackbarType('error');
      setSnackbarVisible(true);
      dispatch({ type: 'COMPLETE_SAVING' });
    }
  }, [state.form, state.data.originalItem, state.ui.isLocked, navigation]);

  // Loading state
  if (state.ui.loading) {
    return <SpinnerLoading message="Loading item..." />;
  }

  // Item not found
  if (!state.data.originalItem) {
    return (
      <View style={styles.container}>
        <Appbar.Header accessible accessibilityRole="header">
          <Appbar.BackAction
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          />
          <Appbar.Content title="Item Not Found" />
        </Appbar.Header>
        <EmptyState
          icon="file-question-outline"
          title="Item Not Found"
          message="The requested item could not be found"
          helpText="It may have been deleted or moved"
          variant="large"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header accessible accessibilityRole="header">
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Appbar.Content title={state.ui.isLocked ? 'View Item' : 'Edit WBS Item'} />
        {!state.ui.isLocked && (
          <Appbar.Action
            icon="check"
            onPress={handleUpdate}
            disabled={state.ui.saving}
            accessibilityLabel="Save changes"
            accessibilityHint="Updates the WBS item with current details"
          />
        )}
      </Appbar.Header>

      {/* Baseline Locked Warning */}
      <LockedBanner visible={state.ui.isLocked} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          accessible
          accessibilityRole="none"
          accessibilityLabel={state.ui.isLocked ? 'View WBS item details' : 'Edit WBS item form'}
        >
          <Surface style={styles.surface}>
            {/* WBS Code (Read-Only) */}
            <WBSCodeDisplay
              wbsCode={state.data.originalItem.wbsCode}
              wbsLevel={state.data.originalItem.wbsLevel}
            />

            {/* Item Details */}
            <ItemDetailsSection
              name={state.form.name}
              categoryId={state.form.categoryId}
              phase={state.form.phase}
              errors={state.validation.errors}
              isLocked={state.ui.isLocked}
              onNameChange={(text) => updateField('name', text)}
              onCategoryChange={(categoryId) => updateField('categoryId', categoryId)}
              onPhaseChange={(phase) => updateField('phase', phase)}
            />

            {/* Schedule */}
            <ScheduleSection
              startDate={state.form.startDate}
              endDate={state.form.endDate}
              duration={state.form.duration}
              errors={state.validation.errors}
              isLocked={state.ui.isLocked}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onDurationChange={handleDurationChange}
            />

            {/* Quantity & Progress */}
            <QuantitySection
              quantity={state.form.quantity}
              completedQuantity={state.form.completedQuantity}
              unit={state.form.unit}
              errors={state.validation.errors}
              isLocked={state.ui.isLocked}
              onQuantityChange={(value) => updateNumericField('quantity', value)}
              onCompletedQuantityChange={(value) => updateNumericField('completedQuantity', value)}
              onUnitChange={(text) => updateField('unit', text)}
            />

            {/* Critical Path & Milestones */}
            <CriticalPathSection
              isMilestone={state.form.isMilestone}
              isCriticalPath={state.form.isCriticalPath}
              floatDays={state.form.floatDays}
              isLocked={state.ui.isLocked}
              onMilestoneToggle={() => updateField('isMilestone', !state.form.isMilestone)}
              onCriticalPathToggle={() => updateField('isCriticalPath', !state.form.isCriticalPath)}
              onFloatDaysChange={(value) => updateNumericField('floatDays', value)}
            />

            {/* Risk Management */}
            <RiskSection
              dependencyRisk={state.form.dependencyRisk}
              riskNotes={state.form.riskNotes}
              isLocked={state.ui.isLocked}
              onRiskChange={(risk) => updateField('dependencyRisk', risk)}
              onRiskNotesChange={(text) => updateField('riskNotes', text)}
            />

            {/* Key Date Linking */}
            {projectId && (
              <KeyDateSection
                projectId={projectId}
                keyDateId={state.form.keyDateId}
                onKeyDateChange={(keyDateId) => updateField('keyDateId', keyDateId)}
                isLocked={state.ui.isLocked}
              />
            )}

            {/* Item Information */}
            <ItemInfoCard
              item={state.data.originalItem}
              newProgressPercentage={calculateProgress(state.form)}
            />

            {/* Update Button (only if not locked) */}
            {!state.ui.isLocked && (
              <Button
                mode="contained"
                onPress={handleUpdate}
                loading={state.ui.saving}
                disabled={state.ui.saving}
                style={styles.saveButton}
                icon="content-save"
                accessible
                accessibilityRole="button"
                accessibilityLabel="Update item"
                accessibilityHint="Saves changes and returns to the previous screen"
                accessibilityState={{ disabled: state.ui.saving }}
              >
                Update Item
              </Button>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={SNACKBAR_DURATION}
        style={snackbarType === 'success' ? styles.snackbarSuccess : styles.snackbarError}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  surface: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  snackbarSuccess: {
    backgroundColor: COLORS.SUCCESS,
  },
  snackbarError: {
    backgroundColor: COLORS.ERROR,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ItemEditScreenWithBoundary = (props: Props) => (
  <ErrorBoundary name="ItemEditScreen">
    <ItemEditScreen {...props} />
  </ErrorBoundary>
);

export default ItemEditScreenWithBoundary;
