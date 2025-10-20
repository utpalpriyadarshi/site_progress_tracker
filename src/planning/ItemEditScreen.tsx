/**
 * ItemEditScreen - Sprint 6
 *
 * Edit existing WBS items with pre-populated data
 * - Lock WBS code (read-only after creation)
 * - Handle baseline-locked items (read-only mode)
 * - Update existing records (not create)
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
  Snackbar,
  Banner,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { database } from '../../models/database';
import ItemModel from '../../models/ItemModel';
import CategorySelector from './components/CategorySelector';
import PhaseSelector from './components/PhaseSelector';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemEdit'>;

interface FormData {
  name: string;
  categoryId: string;
  phase: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  unit: string;
  quantity: string;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
}

const ItemEditScreen: React.FC<Props> = ({ navigation, route }) => {
  const itemId = route.params?.itemId;

  // Item state
  const [item, setItem] = useState<ItemModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    phase: 'design',
    duration: '',
    startDate: new Date(),
    endDate: new Date(),
    unit: 'Set',
    quantity: '1',
    isMilestone: false,
    isCriticalPath: false,
    floatDays: '0',
    dependencyRisk: 'low',
    riskNotes: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Saving state
  const [saving, setSaving] = useState(false);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Load item data on mount
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        setSnackbarMessage('Error: No item ID provided');
        setSnackbarType('error');
        setSnackbarVisible(true);
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);
        const loadedItem = await database.collections
          .get('items')
          .find(itemId) as ItemModel;

        setItem(loadedItem);
        setIsLocked(loadedItem.isBaselineLocked);

        // Pre-populate form fields
        const durationDays = Math.ceil(
          (loadedItem.plannedEndDate - loadedItem.plannedStartDate) / (1000 * 60 * 60 * 24)
        );

        setFormData({
          name: loadedItem.name,
          categoryId: loadedItem.categoryId,
          phase: loadedItem.projectPhase,
          duration: durationDays.toString(),
          startDate: new Date(loadedItem.plannedStartDate),
          endDate: new Date(loadedItem.plannedEndDate),
          unit: loadedItem.unitOfMeasurement || 'Set',
          quantity: loadedItem.plannedQuantity.toString(),
          isMilestone: loadedItem.isMilestone,
          isCriticalPath: loadedItem.isCriticalPath,
          floatDays: (loadedItem.floatDays || 0).toString(),
          dependencyRisk: loadedItem.dependencyRisk || 'low',
          riskNotes: loadedItem.riskNotes || '',
        });
      } catch (error) {
        console.error('Error loading item:', error);
        setSnackbarMessage('Failed to load item data');
        setSnackbarType('error');
        setSnackbarVisible(true);
        setTimeout(() => navigation.goBack(), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId, navigation]);

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

  // Handle update
  const handleUpdate = async () => {
    if (!validateForm() || !item) {
      return;
    }

    setSaving(true);
    try {
      // Calculate dates
      const plannedStartDate = formData.startDate.getTime();
      const plannedEndDate = formData.endDate.getTime();

      // Update database record
      await database.write(async () => {
        await item.update((i: any) => {
          // Basic fields
          i.name = formData.name.trim();
          i.categoryId = formData.categoryId;

          // Quantity and measurements
          i.plannedQuantity = parseFloat(formData.quantity);
          i.unitOfMeasurement = formData.unit.trim() || 'Set';

          // Schedule
          i.plannedStartDate = plannedStartDate;
          i.plannedEndDate = plannedEndDate;

          // Planning fields (only update if not locked)
          if (!isLocked) {
            i.baselineStartDate = plannedStartDate;
            i.baselineEndDate = plannedEndDate;
          }

          // Phase and Milestone
          i.projectPhase = formData.phase;
          i.isMilestone = formData.isMilestone;

          // Critical Path and Risk
          i.isCriticalPath = formData.isCriticalPath;
          i.floatDays = formData.isCriticalPath ? 0 : (parseFloat(formData.floatDays) || 0);
          i.dependencyRisk = formData.dependencyRisk;
          i.riskNotes = formData.riskNotes.trim() || null;
        });
      });

      // Success
      setSnackbarMessage('Item updated successfully');
      setSnackbarType('success');
      setSnackbarVisible(true);

      // Navigate back after showing snackbar
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error updating item:', error);
      setSnackbarMessage('Failed to update item. Please try again.');
      setSnackbarType('error');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
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
      {isLocked && (
        <Banner
          visible={true}
          icon="lock"
          style={styles.banner}
        >
          This item is baseline-locked and cannot be edited. You can only view the details.
        </Banner>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.surface}>
            {/* WBS Code (Read-Only) */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                WBS Code (Read-Only)
              </Text>
              <Surface style={styles.codePreviewReadOnly}>
                <Text variant="titleMedium" style={styles.codeText}>
                  {item.wbsCode}
                </Text>
              </Surface>
              <HelperText type="info">
                WBS codes cannot be changed after creation (Level {item.wbsLevel})
              </HelperText>
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
                disabled={isLocked}
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
                disabled={isLocked}
              />
            </View>

            {/* Phase Selection */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Project Phase *
              </Text>
              <PhaseSelector
                value={formData.phase}
                onSelect={(phase) => updateField('phase', phase)}
                disabled={isLocked}
              />
            </View>

            {/* Duration and Quantity */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Schedule & Quantity
              </Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Duration (days) *"
                    value={formData.duration}
                    onChangeText={(text) => updateNumericField('duration', text)}
                    mode="outlined"
                    keyboardType="number-pad"
                    error={!!errors.duration}
                    disabled={isLocked}
                  />
                  {errors.duration && (
                    <HelperText type="error">{errors.duration}</HelperText>
                  )}
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Quantity *"
                    value={formData.quantity}
                    onChangeText={(text) => updateNumericField('quantity', text)}
                    mode="outlined"
                    keyboardType="number-pad"
                    error={!!errors.quantity}
                    disabled={isLocked}
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
                disabled={isLocked}
              />
            </View>

            {/* Milestone & Critical Path */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Critical Path & Risk
              </Text>

              <View style={styles.chipContainer}>
                <Chip
                  selected={formData.isMilestone}
                  onPress={() => !isLocked && updateField('isMilestone', !formData.isMilestone)}
                  style={styles.chip}
                  icon={formData.isMilestone ? 'star' : 'star-outline'}
                  disabled={isLocked}
                >
                  Milestone
                </Chip>

                <Chip
                  selected={formData.isCriticalPath}
                  onPress={() => !isLocked && updateField('isCriticalPath', !formData.isCriticalPath)}
                  style={styles.chip}
                  icon={formData.isCriticalPath ? 'alert-circle' : 'alert-circle-outline'}
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  onPress={() => !isLocked && updateField('dependencyRisk', 'low')}
                  style={styles.chip}
                  disabled={isLocked}
                >
                  Low
                </Chip>
                <Chip
                  selected={formData.dependencyRisk === 'medium'}
                  onPress={() => !isLocked && updateField('dependencyRisk', 'medium')}
                  style={styles.chip}
                  disabled={isLocked}
                >
                  Medium
                </Chip>
                <Chip
                  selected={formData.dependencyRisk === 'high'}
                  onPress={() => !isLocked && updateField('dependencyRisk', 'high')}
                  style={styles.chip}
                  disabled={isLocked}
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
                  disabled={isLocked}
                />
              )}
            </View>

            {/* Item Metadata (Read-Only Info) */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Item Information
              </Text>
              <Surface style={styles.infoBox}>
                <Text variant="bodySmall" style={styles.infoText}>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Last Modified: {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Status: {item.status.replace('_', ' ').toUpperCase()}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Progress: {item.getProgressPercentage().toFixed(0)}%
                </Text>
              </Surface>
            </View>

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
        duration={3000}
        style={{
          backgroundColor: snackbarType === 'success' ? '#4CAF50' : '#F44336',
        }}
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
  banner: {
    backgroundColor: '#fff3e0',
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
  codePreviewReadOnly: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9e9e9e',
    alignItems: 'center',
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#424242',
    fontWeight: 'bold',
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
  infoBox: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoText: {
    marginVertical: 2,
    color: '#1565C0',
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default ItemEditScreen;
