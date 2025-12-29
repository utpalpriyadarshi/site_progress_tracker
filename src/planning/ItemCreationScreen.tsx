/**
 * ItemCreationScreen - Sprint 3
 *
 * Create new WBS items with auto-generated codes
 */

import React from 'react';
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
} from 'react-native-paper';
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
} from './item-creation/components';
import {
  useWBSCodeGeneration,
  useItemForm,
  useDateCalculations,
  useItemCreation,
} from './item-creation/hooks';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemCreation' | 'ItemEdit'>;

const ItemCreationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { showSnackbar } = useSnackbar();

  // Get siteId from route params (passed from WBSManagementScreen)
  const siteId = 'siteId' in route.params ? route.params.siteId : '';
  const parentWbsCode = 'parentWbsCode' in route.params ? route.params.parentWbsCode || null : null;

  // Custom hooks
  const { generatedWbsCode, generatingCode } = useWBSCodeGeneration({
    siteId,
    parentWbsCode,
    onError: (message) => showSnackbar(message, 'error'),
  });

  const { formData, errors, updateField, updateNumericField, validateForm } = useItemForm({
    parentWbsCode,
  });

  const { handleStartDateChange, handleEndDateChange, handleDurationChange } = useDateCalculations({
    formData,
    updateField,
  });

  const { loading, handleSave } = useItemCreation({
    siteId,
    generatedWbsCode,
    formData,
    validateForm,
    onSuccess: () => {
      showSnackbar('WBS item created successfully', 'success');
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (message) => showSnackbar(message, 'error'),
  });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Create WBS Item" />
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={loading}
        />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.surface}>
            {/* WBS Code Preview */}
            <WBSCodeDisplay
              generatedWbsCode={generatedWbsCode}
              parentWbsCode={parentWbsCode}
              generatingCode={generatingCode}
            />

            {/* Item Name */}
            <ItemDetailsSection
              name={formData.name}
              onNameChange={(text) => updateField('name', text)}
              error={errors.name}
            />

            {/* Category Selection */}
            <CategorySection
              categoryId={formData.categoryId}
              onCategorySelect={(categoryId) => updateField('categoryId', categoryId)}
              error={errors.categoryId}
            />

            {/* Phase Selection */}
            <PhaseSection
              phase={formData.phase}
              onPhaseSelect={(phase) => updateField('phase', phase)}
            />

            {/* Schedule Section */}
            <ScheduleSection
              startDate={formData.startDate}
              endDate={formData.endDate}
              duration={formData.duration}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
              onDurationChange={handleDurationChange}
              errors={{
                startDate: errors.startDate,
                endDate: errors.endDate,
                duration: errors.duration,
              }}
            />

            {/* Quantity Section */}
            <QuantitySection
              quantity={formData.quantity}
              completedQuantity={formData.completedQuantity}
              unit={formData.unit}
              weightage={formData.weightage}
              onQuantityChange={(text) => updateNumericField('quantity', text)}
              onCompletedQuantityChange={(text) => updateNumericField('completedQuantity', text)}
              onUnitChange={(text) => updateField('unit', text)}
              onWeightageChange={(text) => updateNumericField('weightage', text)}
              error={errors.quantity}
            />

            {/* Milestone & Critical Path */}
            <CriticalPathSection
              isMilestone={formData.isMilestone}
              isCriticalPath={formData.isCriticalPath}
              floatDays={formData.floatDays}
              onMilestoneToggle={() => updateField('isMilestone', !formData.isMilestone)}
              onCriticalPathToggle={() => updateField('isCriticalPath', !formData.isCriticalPath)}
              onFloatDaysChange={(text) => updateNumericField('floatDays', text)}
            />

            {/* Risk Management */}
            <RiskSection
              dependencyRisk={formData.dependencyRisk}
              riskNotes={formData.riskNotes}
              onRiskChange={(risk) => updateField('dependencyRisk', risk)}
              onRiskNotesChange={(text) => updateField('riskNotes', text)}
            />

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              icon="content-save"
            >
              Create Item
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
