/**
 * ItemCreationScreen - Sprint 3 - Phase 2 Refactor
 *
 * Create new WBS items with auto-generated codes
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
  Button,
  Appbar,
  Surface,
  Text,
} from 'react-native-paper';
import SiteModel from '../../models/SiteModel';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { useSnackbar } from '../components/Snackbar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  WBSCodeDisplay,
  ItemDetailsSection,
  CategorySection,
  PhaseSection,
  ScheduleSection,
  QuantitySection,
  CriticalPathSection,
  RiskSection,
  KeyDateSection,
} from './item-creation/components';
import {
  itemCreationReducer,
  createItemCreationInitialState,
  validateItemForm,
  type ItemFormData,
} from './state/item-form';
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';
import { database } from '../../models/database';
import { logger } from '../services/LoggingService';
import { useAccessibility } from '../utils/accessibility';
import { usePlanningContext } from './context';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemCreation' | 'ItemEdit'>;

const ItemCreationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { showSnackbar } = useSnackbar();
  const { announce } = useAccessibility();
  const { projectId } = usePlanningContext();

  // Get siteId from route params (passed from WBSManagementScreen)
  // Use optional chaining to safely access params (may be undefined when navigating from drawer)
  const routeSiteId = route.params?.siteId ?? '';
  const parentWbsCode = route.params?.parentWbsCode ?? null;

  // Local state for site selection when navigating from drawer (no siteId in params)
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);

  // Use route siteId if provided, otherwise use selected site from dropdown
  const siteId = routeSiteId || selectedSite?.id || '';

  // Initialize reducer state
  const [state, dispatch] = useReducer(
    itemCreationReducer,
    createItemCreationInitialState(parentWbsCode)
  );

  // Generate WBS code on mount or when dependencies change
  useEffect(() => {
    const generateWbsCode = async () => {
      if (!siteId) return;

      dispatch({ type: 'START_WBS_GENERATION' });
      try {
        let code: string;
        if (parentWbsCode) {
          code = await WBSCodeGenerator.generateChildCode(siteId, parentWbsCode);
        } else {
          code = await WBSCodeGenerator.generateRootCode(siteId);
        }
        dispatch({ type: 'SET_WBS_CODE', payload: { code } });
      } catch (error) {
        logger.error('[ItemCreation] Error generating WBS code', error as Error);
        showSnackbar('Failed to generate WBS code', 'error');
        dispatch({ type: 'WBS_GENERATION_COMPLETE' });
      }
    };

    generateWbsCode();
  }, [siteId, parentWbsCode, showSnackbar]);

  // Handle field updates
  const updateField = useCallback((field: keyof ItemFormData, value: any) => {
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } });
  }, []);

  const updateNumericField = useCallback((field: keyof ItemFormData, value: string) => {
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

  // Handle save
  const handleSave = useCallback(async () => {
    // Validate form
    const { isValid, errors } = validateItemForm(state.form);
    if (!isValid) {
      dispatch({ type: 'SET_VALIDATION_ERRORS', payload: { errors } });
      return;
    }

    dispatch({ type: 'START_SAVING' });
    try {
      // Calculate planned dates
      const plannedStartDate = state.form.startDate.getTime();
      const plannedEndDate = state.form.endDate.getTime();

      // Calculate WBS level from code
      const wbsLevel = WBSCodeGenerator.calculateLevel(state.wbs.generatedCode);

      // Calculate status based on completed quantity
      const completedQty = parseFloat(state.form.completedQuantity) || 0;
      const plannedQty = parseFloat(state.form.quantity);
      let itemStatus = 'not_started';

      if (completedQty >= plannedQty) {
        itemStatus = 'completed';
      } else if (completedQty > 0) {
        itemStatus = 'in_progress';
      }

      // Save to database
      await database.write(async () => {
        await database.collections.get('items').create((item: any) => {
          // Basic fields
          item.name = state.form.name.trim();
          item.categoryId = state.form.categoryId;
          item.siteId = siteId;

          // Quantity and measurements
          item.plannedQuantity = plannedQty;
          item.completedQuantity = completedQty;
          item.unitOfMeasurement = state.form.unit.trim() || 'Set';

          // Schedule
          item.plannedStartDate = plannedStartDate;
          item.plannedEndDate = plannedEndDate;
          item.status = itemStatus;
          item.weightage = parseFloat(state.form.weightage) || 0;

          // Planning fields
          item.baselineStartDate = plannedStartDate;
          item.baselineEndDate = plannedEndDate;
          item.isBaselineLocked = false;
          item.dependencies = JSON.stringify([]);

          // WBS Structure
          item.wbsCode = state.wbs.generatedCode;
          item.wbsLevel = wbsLevel;
          item.parentWbsCode = state.form.parentWbsCode || null;

          // Phase and Milestone
          item.projectPhase = state.form.phase;
          item.isMilestone = state.form.isMilestone;
          item.createdByRole = 'planner';

          // Critical Path and Risk
          item.isCriticalPath = state.form.isCriticalPath;
          item.floatDays = state.form.isCriticalPath ? 0 : (parseFloat(state.form.floatDays) || 0);
          item.dependencyRisk = state.form.dependencyRisk;
          item.riskNotes = state.form.riskNotes.trim() || null;

          // Key Date linking (Phase 5c)
          item.keyDateId = state.form.keyDateId || null;
        });
      });

      dispatch({ type: 'COMPLETE_SAVING' });
      showSnackbar('WBS item created successfully', 'success');
      announce(`WBS item ${state.form.name} created successfully`);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      logger.error('[ItemCreation] Error saving item', error as Error);
      showSnackbar('Failed to create item. Please try again.', 'error');
      dispatch({ type: 'COMPLETE_SAVING' });
    }
  }, [state.form, state.wbs.generatedCode, siteId, showSnackbar, navigation]);

  return (
    <View style={styles.container}>
      <Appbar.Header accessible accessibilityRole="header">
        <Appbar.BackAction
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <Appbar.Content title="Create WBS Item" />
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={state.ui.saving}
          accessibilityLabel="Save item"
          accessibilityHint="Creates the WBS item with current details"
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          accessible
          accessibilityRole="none"
          accessibilityLabel="Create WBS item form"
        >
          <Surface style={styles.surface}>
            {/* Site Selector - shown when navigating from drawer without siteId */}
            {!routeSiteId && (
              <View style={styles.siteSelectionSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Select Site
                </Text>
                <SimpleSiteSelector
                  selectedSite={selectedSite}
                  onSiteChange={setSelectedSite}
                />
                {!selectedSite && (
                  <Text variant="bodySmall" style={styles.helperText}>
                    Please select a site before creating an item
                  </Text>
                )}
              </View>
            )}

            {/* WBS Code Preview */}
            <WBSCodeDisplay
              generatedWbsCode={state.wbs.generatedCode}
              parentWbsCode={parentWbsCode}
              generatingCode={state.wbs.generating}
            />

            {/* Item Name */}
            <ItemDetailsSection
              name={state.form.name}
              onNameChange={(text) => updateField('name', text)}
              error={state.validation.errors.name}
            />

            {/* Category Selection */}
            <CategorySection
              categoryId={state.form.categoryId}
              onCategorySelect={(categoryId) => updateField('categoryId', categoryId)}
              error={state.validation.errors.categoryId}
            />

            {/* Phase Selection */}
            <PhaseSection
              phase={state.form.phase}
              onPhaseSelect={(phase) => updateField('phase', phase)}
            />

            {/* Key Date Linking */}
            {projectId && (
              <KeyDateSection
                projectId={projectId}
                keyDateId={state.form.keyDateId}
                onKeyDateChange={(keyDateId) => updateField('keyDateId', keyDateId)}
              />
            )}

            {/* Schedule Section */}
            <ScheduleSection
              startDate={state.form.startDate}
              endDate={state.form.endDate}
              duration={state.form.duration}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onDurationChange={handleDurationChange}
              errors={{
                startDate: state.validation.errors.startDate,
                endDate: state.validation.errors.endDate,
                duration: state.validation.errors.duration,
              }}
            />

            {/* Quantity Section */}
            <QuantitySection
              quantity={state.form.quantity}
              completedQuantity={state.form.completedQuantity}
              unit={state.form.unit}
              weightage={state.form.weightage}
              onQuantityChange={(text) => updateNumericField('quantity', text)}
              onCompletedQuantityChange={(text) => updateNumericField('completedQuantity', text)}
              onUnitChange={(text) => updateField('unit', text)}
              onWeightageChange={(text) => updateNumericField('weightage', text)}
              error={state.validation.errors.quantity}
            />

            {/* Milestone & Critical Path */}
            <CriticalPathSection
              isMilestone={state.form.isMilestone}
              isCriticalPath={state.form.isCriticalPath}
              floatDays={state.form.floatDays}
              onMilestoneToggle={() => updateField('isMilestone', !state.form.isMilestone)}
              onCriticalPathToggle={() => updateField('isCriticalPath', !state.form.isCriticalPath)}
              onFloatDaysChange={(text) => updateNumericField('floatDays', text)}
            />

            {/* Risk Management */}
            <RiskSection
              dependencyRisk={state.form.dependencyRisk}
              riskNotes={state.form.riskNotes}
              onRiskChange={(risk) => updateField('dependencyRisk', risk)}
              onRiskNotesChange={(text) => updateField('riskNotes', text)}
            />

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSave}
              loading={state.ui.saving}
              disabled={state.ui.saving || !siteId}
              style={styles.saveButton}
              icon="content-save"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Create item"
              accessibilityHint={!siteId ? "Select a site first" : "Creates the WBS item and returns to the previous screen"}
              accessibilityState={{ disabled: state.ui.saving || !siteId }}
            >
              {!siteId ? 'Select Site First' : 'Create Item'}
            </Button>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  surface: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  siteSelectionSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    color: '#F44336',
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ItemCreationScreenWithBoundary = (props: Props) => (
  <ErrorBoundary name="ItemCreationScreen">
    <ItemCreationScreen {...props} />
  </ErrorBoundary>
);

export default ItemCreationScreenWithBoundary;
