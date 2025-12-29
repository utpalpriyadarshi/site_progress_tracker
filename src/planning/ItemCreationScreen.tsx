/**
 * ItemCreationScreen - Sprint 3
 *
 * Create new WBS items with auto-generated codes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Surface,
  HelperText,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useSnackbar } from '../components/Snackbar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';
import { database } from '../../models/database';
import CategorySelector from './components/CategorySelector';
import { logger } from '../services/LoggingService';
import PhaseSelector from './components/PhaseSelector';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import DatePickerField from './components/DatePickerField';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemCreation' | 'ItemEdit'>;

interface FormData {
  name: string;
  categoryId: string;
  parentWbsCode: string | null;
  phase: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  unit: string;
  quantity: string;
  completedQuantity: string;
  weightage: string;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
}

const ItemCreationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { showSnackbar } = useSnackbar();

  // Get siteId from route params (passed from WBSManagementScreen)
  const siteId = route.params?.siteId || '';
  const parentWbsCode = route.params?.parentWbsCode || null;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    parentWbsCode: parentWbsCode,
    phase: 'design',
    duration: '30',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    unit: 'Set',
    quantity: '1',
    completedQuantity: '0',
    weightage: '0',
    isMilestone: false,
    isCriticalPath: false,
    floatDays: '0',
    dependencyRisk: 'low',
    riskNotes: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generated WBS code (will be calculated)
  const [generatedWbsCode, setGeneratedWbsCode] = useState<string>('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Code generation loading
  const [generatingCode, setGeneratingCode] = useState(false);

  // Generate WBS code when screen loads
  useEffect(() => {
    const generateCode = async () => {
      if (!siteId) return;

      setGeneratingCode(true);
      try {
        let code: string;

        if (parentWbsCode) {
          // Generate child code (static method)
          code = await WBSCodeGenerator.generateChildCode(siteId, parentWbsCode);
        } else {
          // Generate root code (static method)
          code = await WBSCodeGenerator.generateRootCode(siteId);
        }

        setGeneratedWbsCode(code);
      } catch (error) {
        logger.error('[ItemCreation] Error generating WBS code', error as Error);
        showSnackbar('Failed to generate WBS code', 'error');
      } finally {
        setGeneratingCode(false);
      }
    };

    generateCode();
  }, [siteId, parentWbsCode]);

  // Update form field
  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user edits field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Update numeric field with validation
  const updateNumericField = (field: keyof FormData, value: string) => {
    // Only allow positive numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      updateField(field, value);
    }
  };

  // Handle start date change - auto-calculate end date based on duration
  const handleStartDateChange = (date: Date) => {
    const durationDays = parseInt(formData.duration) || 30;
    const endDate = new Date(date.getTime() + durationDays * 24 * 60 * 60 * 1000);
    setFormData(prev => ({ ...prev, startDate: date, endDate }));
  };

  // Handle end date change - auto-calculate duration
  const handleEndDateChange = (date: Date) => {
    const durationMs = date.getTime() - formData.startDate.getTime();
    const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));
    setFormData(prev => ({ ...prev, endDate: date, duration: durationDays.toString() }));
  };

  // Handle duration change - auto-calculate end date
  const handleDurationChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      const durationDays = parseInt(value) || 1;
      const endDate = new Date(formData.startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, duration: value, endDate }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.duration || parseFloat(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Calculate planned dates
      const durationInMs = parseInt(formData.duration) * 24 * 60 * 60 * 1000;
      const plannedStartDate = formData.startDate.getTime();
      const plannedEndDate = formData.endDate.getTime();

      // Calculate WBS level from code
      const wbsLevel = WBSCodeGenerator.calculateLevel(generatedWbsCode);

      // Calculate status based on completed quantity
      const completedQty = parseFloat(formData.completedQuantity) || 0;
      const plannedQty = parseFloat(formData.quantity);
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
          item.name = formData.name.trim();
          item.categoryId = formData.categoryId;
          item.siteId = siteId;

          // Quantity and measurements
          item.plannedQuantity = plannedQty;
          item.completedQuantity = completedQty;
          item.unitOfMeasurement = formData.unit.trim() || 'Set';

          // Schedule
          item.plannedStartDate = plannedStartDate;
          item.plannedEndDate = plannedEndDate;
          item.status = itemStatus; // Auto-calculated from progress
          item.weightage = parseFloat(formData.weightage) || 0;

          // Planning fields
          item.baselineStartDate = plannedStartDate;
          item.baselineEndDate = plannedEndDate;
          item.isBaselineLocked = false;
          item.dependencies = JSON.stringify([]); // Empty dependencies for now

          // WBS Structure
          item.wbsCode = generatedWbsCode;
          item.wbsLevel = wbsLevel;
          item.parentWbsCode = formData.parentWbsCode || null;

          // Phase and Milestone
          item.projectPhase = formData.phase;
          item.isMilestone = formData.isMilestone;
          item.createdByRole = 'planner';

          // Critical Path and Risk
          item.isCriticalPath = formData.isCriticalPath;
          item.floatDays = formData.isCriticalPath ? 0 : (parseFloat(formData.floatDays) || 0);
          item.dependencyRisk = formData.dependencyRisk;
          item.riskNotes = formData.riskNotes.trim() || null;
        });
      });

      // Success - show snackbar and navigate back
      showSnackbar('WBS item created successfully', 'success');

      // Navigate back after a short delay to show snackbar
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      logger.error('[ItemCreation] Error saving item', error as Error);
      showSnackbar('Failed to create item. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                WBS Code (Auto-generated)
              </Text>
              <Surface style={styles.codePreview}>
                {generatingCode ? (
                  <ActivityIndicator size="small" color="#1976D2" />
                ) : (
                  <Text variant="titleMedium" style={styles.codeText}>
                    {generatedWbsCode || 'Generating...'}
                  </Text>
                )}
              </Surface>
              {parentWbsCode && (
                <HelperText type="info">
                  Child of: {parentWbsCode}
                </HelperText>
              )}
              {generatedWbsCode && !parentWbsCode && (
                <HelperText type="info">
                  This will be a root-level item (Level 1)
                </HelperText>
              )}
              {generatedWbsCode && parentWbsCode && (
                <HelperText type="info">
                  This will be a child item (Level {WBSCodeGenerator.calculateLevel(generatedWbsCode)})
                </HelperText>
              )}
            </View>

            {/* Item Name */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Item Details
              </Text>
              <TextInput
                label="Item Name *"
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                mode="outlined"
                error={!!errors.name}
                placeholder="e.g., Power Transformer Installation"
              />
              {errors.name && (
                <HelperText type="error">{errors.name}</HelperText>
              )}
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Category *
              </Text>
              <CategorySelector
                value={formData.categoryId}
                onSelect={(categoryId) => updateField('categoryId', categoryId)}
                error={errors.categoryId}
              />
            </View>

            {/* Phase Selection */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Project Phase *
              </Text>
              <PhaseSelector
                value={formData.phase}
                onSelect={(phase) => updateField('phase', phase as any)}
              />
            </View>

            {/* Schedule Section */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Schedule
              </Text>

              <DatePickerField
                label="Start Date *"
                value={formData.startDate}
                onChange={handleStartDateChange}
                error={errors.startDate}
              />

              <View style={styles.marginTop}>
                <DatePickerField
                  label="End Date *"
                  value={formData.endDate}
                  onChange={handleEndDateChange}
                  minimumDate={formData.startDate}
                  error={errors.endDate}
                />
              </View>

              <TextInput
                label="Duration (days) *"
                value={formData.duration}
                onChangeText={handleDurationChange}
                mode="outlined"
                keyboardType="number-pad"
                error={!!errors.duration}
                style={styles.marginTop}
              />
              {errors.duration && (
                <HelperText type="error">{errors.duration}</HelperText>
              )}
              <HelperText type="info">
                Duration auto-calculates based on start and end dates
              </HelperText>
            </View>

            {/* Quantity Section */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Quantity & Progress
              </Text>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Planned Quantity *"
                    value={formData.quantity}
                    onChangeText={(text) => updateNumericField('quantity', text)}
                    mode="outlined"
                    keyboardType="number-pad"
                    error={!!errors.quantity}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Completed Quantity"
                    value={formData.completedQuantity}
                    onChangeText={(text) => updateNumericField('completedQuantity', text)}
                    mode="outlined"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <TextInput
                label="Unit of Measurement"
                value={formData.unit}
                onChangeText={(text) => updateField('unit', text)}
                mode="outlined"
                placeholder="e.g., Set, Meter, Cubic Meter"
                style={styles.marginTop}
              />

              <TextInput
                label="Weightage (%)"
                value={formData.weightage}
                onChangeText={(text) => updateNumericField('weightage', text)}
                mode="outlined"
                keyboardType="number-pad"
                placeholder="e.g., 10, 15, 20"
                style={styles.marginTop}
              />

              <HelperText type="info">
                Progress: {formData.quantity && parseFloat(formData.quantity) > 0
                  ? Math.min(100, Math.round((parseFloat(formData.completedQuantity) / parseFloat(formData.quantity)) * 100))
                  : 0}%
              </HelperText>
            </View>

            {/* Milestone & Critical Path */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Critical Path & Risk
              </Text>

              <View style={styles.chipContainer}>
                <Chip
                  selected={formData.isMilestone}
                  onPress={() => updateField('isMilestone', !formData.isMilestone)}
                  style={styles.chip}
                  icon={formData.isMilestone ? 'star' : 'star-outline'}
                >
                  Milestone
                </Chip>

                <Chip
                  selected={formData.isCriticalPath}
                  onPress={() => updateField('isCriticalPath', !formData.isCriticalPath)}
                  style={styles.chip}
                  icon={formData.isCriticalPath ? 'alert-circle' : 'alert-circle-outline'}
                >
                  Critical Path
                </Chip>
              </View>

              {!formData.isCriticalPath && (
                <TextInput
                  label="Float Days"
                  value={formData.floatDays}
                  onChangeText={(text) => updateNumericField('floatDays', text)}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={styles.marginTop}
                />
              )}
            </View>

            {/* Risk Management */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Dependency Risk
              </Text>

              <View style={styles.chipContainer}>
                <Chip
                  selected={formData.dependencyRisk === 'low'}
                  onPress={() => updateField('dependencyRisk', 'low')}
                  style={styles.chip}
                >
                  Low
                </Chip>
                <Chip
                  selected={formData.dependencyRisk === 'medium'}
                  onPress={() => updateField('dependencyRisk', 'medium')}
                  style={styles.chip}
                >
                  Medium
                </Chip>
                <Chip
                  selected={formData.dependencyRisk === 'high'}
                  onPress={() => updateField('dependencyRisk', 'high')}
                  style={styles.chip}
                >
                  High
                </Chip>
              </View>

              {formData.dependencyRisk !== 'low' && (
                <TextInput
                  label="Risk Notes"
                  value={formData.riskNotes}
                  onChangeText={(text) => updateField('riskNotes', text)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Describe the risk and mitigation plan"
                  style={styles.marginTop}
                />
              )}
            </View>

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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  codePreview: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#1976D2',
    fontWeight: 'bold',
  },
  placeholderBox: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  currentValue: {
    marginTop: 4,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  marginTop: {
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
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
