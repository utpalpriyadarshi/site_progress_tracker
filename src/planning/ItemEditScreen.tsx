/**
 * ItemEditScreen - Refactored Sprint 6
 *
 * Edit existing WBS items with pre-populated data
 * - Lock WBS code (read-only after creation)
 * - Handle baseline-locked items (read-only mode)
 * - Update existing records (not create)
 */

import React, { useState } from 'react';
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
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Components
import {
  LockedBanner,
  WBSCodeDisplay,
  ItemDetailsSection,
  ScheduleSection,
  QuantitySection,
  CriticalPathSection,
  RiskSection,
  ItemInfoCard,
} from './item-edit/components';

// Hooks
import { useItemEdit, useItemForm, useDateCalculations } from './item-edit/hooks';

// Utils
import { MESSAGES, SNACKBAR_DURATION, NAVIGATION_DELAY } from './item-edit/utils';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemEdit'>;

const ItemEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const itemId = route.params?.itemId;

  // Item data and operations
  const { item, loading, isLocked, saving, saveItem } = useItemEdit(itemId);

  // Form state and validation
  const {
    formData,
    errors,
    updateField,
    updateNumericField,
    validateForm,
    getProgressPercentage,
  } = useItemForm(item);

  // Date calculations
  const {
    handleStartDateChange,
    handleEndDateChange,
    handleDurationChange,
  } = useDateCalculations();

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Handle update
  const handleUpdate = async () => {
    if (!validateForm() || !item) {
      return;
    }

    try {
      await saveItem({
        name: formData.name,
        categoryId: formData.categoryId,
        phase: formData.phase,
        plannedQuantity: parseFloat(formData.quantity),
        completedQuantity: parseFloat(formData.completedQuantity) || 0,
        unitOfMeasurement: formData.unit,
        plannedStartDate: formData.startDate.getTime(),
        plannedEndDate: formData.endDate.getTime(),
        isMilestone: formData.isMilestone,
        isCriticalPath: formData.isCriticalPath,
        floatDays: formData.isCriticalPath ? 0 : (parseFloat(formData.floatDays) || 0),
        dependencyRisk: formData.dependencyRisk,
        riskNotes: formData.riskNotes.trim() || null,
      });

      // Success
      setSnackbarMessage(MESSAGES.SUCCESS_UPDATE);
      setSnackbarType('success');
      setSnackbarVisible(true);

      // Navigate back after showing snackbar
      setTimeout(() => {
        navigation.goBack();
      }, NAVIGATION_DELAY);
    } catch (error) {
      setSnackbarMessage(MESSAGES.ERROR_UPDATE_FAILED);
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading item...</Text>
      </View>
    );
  }

  // Item not found
  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Item not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isLocked ? 'View Item' : 'Edit WBS Item'} />
        {!isLocked && (
          <Appbar.Action
            icon="check"
            onPress={handleUpdate}
            disabled={saving}
          />
        )}
      </Appbar.Header>

      {/* Baseline Locked Warning */}
      <LockedBanner visible={isLocked} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.surface}>
            {/* WBS Code (Read-Only) */}
            <WBSCodeDisplay wbsCode={item.wbsCode} wbsLevel={item.wbsLevel} />

            {/* Item Details */}
            <ItemDetailsSection
              name={formData.name}
              categoryId={formData.categoryId}
              phase={formData.phase}
              errors={errors}
              isLocked={isLocked}
              onNameChange={(text) => updateField('name', text)}
              onCategoryChange={(categoryId) => updateField('categoryId', categoryId)}
              onPhaseChange={(phase) => updateField('phase', phase)}
            />

            {/* Schedule */}
            <ScheduleSection
              startDate={formData.startDate}
              endDate={formData.endDate}
              duration={formData.duration}
              errors={errors}
              isLocked={isLocked}
              onStartDateChange={(date) => handleStartDateChange(date, formData, updateField)}
              onEndDateChange={(date) => handleEndDateChange(date, formData, updateField)}
              onDurationChange={(value) => handleDurationChange(value, formData, updateField)}
            />

            {/* Quantity & Progress */}
            <QuantitySection
              quantity={formData.quantity}
              completedQuantity={formData.completedQuantity}
              unit={formData.unit}
              errors={errors}
              isLocked={isLocked}
              onQuantityChange={(value) => updateNumericField('quantity', value)}
              onCompletedQuantityChange={(value) => updateNumericField('completedQuantity', value)}
              onUnitChange={(text) => updateField('unit', text)}
            />

            {/* Critical Path & Milestones */}
            <CriticalPathSection
              isMilestone={formData.isMilestone}
              isCriticalPath={formData.isCriticalPath}
              floatDays={formData.floatDays}
              isLocked={isLocked}
              onMilestoneToggle={() => updateField('isMilestone', !formData.isMilestone)}
              onCriticalPathToggle={() => updateField('isCriticalPath', !formData.isCriticalPath)}
              onFloatDaysChange={(value) => updateNumericField('floatDays', value)}
            />

            {/* Risk Management */}
            <RiskSection
              dependencyRisk={formData.dependencyRisk}
              riskNotes={formData.riskNotes}
              isLocked={isLocked}
              onRiskChange={(risk) => updateField('dependencyRisk', risk)}
              onRiskNotesChange={(text) => updateField('riskNotes', text)}
            />

            {/* Item Information */}
            <ItemInfoCard
              item={item}
              newProgressPercentage={getProgressPercentage()}
            />

            {/* Update Button (only if not locked) */}
            {!isLocked && (
              <Button
                mode="contained"
                onPress={handleUpdate}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
                icon="content-save"
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
    backgroundColor: '#4CAF50',
  },
  snackbarError: {
    backgroundColor: '#F44336',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ItemEditScreenWithBoundary = (props: Props) => (
  <ErrorBoundary name="ItemEditScreen">
    <ItemEditScreen {...props} />
  </ErrorBoundary>
);

export default ItemEditScreenWithBoundary;
