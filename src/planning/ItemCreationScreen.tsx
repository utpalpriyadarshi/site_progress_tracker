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
  Alert,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { WBSCodeGenerator } from '../../services/planning/WBSCodeGenerator';
import { database } from '../../models/database';

type Props = NativeStackScreenProps<PlanningStackParamList, 'ItemCreation'>;

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
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
}

const ItemCreationScreen: React.FC<Props> = ({ navigation, route }) => {
  // Get siteId from route params (passed from WBSManagementScreen)
  const siteId = route.params?.siteId || '';
  const parentWbsCode = route.params?.parentWbsCode || null;

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    categoryId: '',
    parentWbsCode: parentWbsCode,
    phase: 'design',
    duration: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
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
        console.error('Error generating WBS code:', error);
        Alert.alert('Error', 'Failed to generate WBS code');
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

  // Handle save (to be implemented)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Generate WBS code
      // TODO: Save to database
      // TODO: Navigate back
      console.log('Saving item...', formData);
    } catch (error) {
      console.error('Error saving item:', error);
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

            {/* Category Selection (placeholder for now) */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Category *
              </Text>
              <Surface style={styles.placeholderBox}>
                <Text variant="bodyMedium">
                  Category Selector (To be implemented)
                </Text>
              </Surface>
              {errors.categoryId && (
                <HelperText type="error">{errors.categoryId}</HelperText>
              )}
            </View>

            {/* Phase Selection */}
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>
                Project Phase *
              </Text>
              <Surface style={styles.placeholderBox}>
                <Text variant="bodyMedium">
                  Phase Selector (To be implemented)
                </Text>
                <Text variant="bodySmall" style={styles.currentValue}>
                  Current: {formData.phase}
                </Text>
              </Surface>
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

export default ItemCreationScreen;
