/**
 * ItemFormFields - Shared form fields component for ItemCreation and ItemEdit screens
 *
 * This component consolidates all form sections from both screens to eliminate
 * code duplication (~200 LOC saved) and provide a single source of truth for item forms.
 *
 * @example
 * ```tsx
 * <ItemFormFields
 *   formData={state.form}
 *   onFieldChange={handleFieldChange}
 *   errors={state.validation.errors}
 *   touched={state.validation.touched}
 *   onStartDateChange={handleStartDateChange}
 *   onEndDateChange={handleEndDateChange}
 *   variant="create"
 * />
 * ```
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText, Chip, Surface, ActivityIndicator } from 'react-native-paper';
import CategorySelector from '../../components/CategorySelector';
import PhaseSelector from '../../components/PhaseSelector';
import DatePickerField from '../../components/DatePickerField';
import { WBSCodeGenerator } from '../../../../services/planning/WBSCodeGenerator';
import { ItemFormFieldsProps } from '../types';
import { ProjectPhase, DependencyRisk } from '../../../../models/ItemModel';

/**
 * Shared form fields for item creation and editing
 */
export const ItemFormFields: React.FC<ItemFormFieldsProps> = ({
  formData,
  onFieldChange,
  errors = {},
  touched = {},
  generatedWbsCode,
  onStartDateChange,
  onEndDateChange,
  readOnly = false,
  variant = 'create',
}) => {
  // Calculate progress percentage
  const progress = formData.quantity && parseFloat(formData.quantity) > 0
    ? Math.min(100, Math.round((parseFloat(formData.completedQuantity) / parseFloat(formData.quantity)) * 100))
    : 0;

  // Determine if field has error and was touched
  const getFieldError = (field: string) => {
    return touched[field] && errors[field] ? errors[field] : undefined;
  };

  return (
    <View>
      {/* WBS Code Display */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          WBS Code {variant === 'create' && '(Auto-generated)'}
        </Text>
        <Surface style={styles.codePreview}>
          {variant === 'create' && !generatedWbsCode ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <Text variant="titleMedium" style={styles.codeText}>
              {generatedWbsCode || formData.parentWbsCode || 'Generating...'}
            </Text>
          )}
        </Surface>
        {formData.parentWbsCode && (
          <HelperText type="info">
            Child of: {formData.parentWbsCode}
          </HelperText>
        )}
        {variant === 'create' && generatedWbsCode && !formData.parentWbsCode && (
          <HelperText type="info">
            This will be a root-level item (Level 1)
          </HelperText>
        )}
        {variant === 'create' && generatedWbsCode && formData.parentWbsCode && (
          <HelperText type="info">
            This will be a child item (Level {WBSCodeGenerator.calculateLevel(generatedWbsCode)})
          </HelperText>
        )}
      </View>

      {/* Item Details Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Item Details
        </Text>
        <TextInput
          label="Item Name *"
          value={formData.name}
          onChangeText={(text) => onFieldChange('name', text)}
          mode="outlined"
          error={!!getFieldError('name')}
          placeholder="e.g., Power Transformer Installation"
          editable={!readOnly}
        />
        {getFieldError('name') && (
          <HelperText type="error">{getFieldError('name')}</HelperText>
        )}
      </View>

      {/* Category Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Category *
        </Text>
        <CategorySelector
          value={formData.categoryId}
          onSelect={(categoryId) => onFieldChange('categoryId', categoryId)}
          error={getFieldError('categoryId')}
        />
      </View>

      {/* Phase Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Project Phase *
        </Text>
        <PhaseSelector
          value={formData.phase as ProjectPhase}
          onSelect={(phase) => onFieldChange('phase', phase)}
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
          onChange={onStartDateChange}
          error={getFieldError('startDate')}
        />

        <View style={styles.marginTop}>
          <DatePickerField
            label="End Date *"
            value={formData.endDate}
            onChange={onEndDateChange}
            minimumDate={formData.startDate}
            error={getFieldError('endDate')}
          />
        </View>

        <TextInput
          label="Duration (days) *"
          value={formData.duration}
          onChangeText={(value) => onFieldChange('duration', value)}
          mode="outlined"
          keyboardType="number-pad"
          error={!!getFieldError('duration')}
          style={styles.marginTop}
          editable={!readOnly}
        />
        {getFieldError('duration') && (
          <HelperText type="error">{getFieldError('duration')}</HelperText>
        )}
        <HelperText type="info">
          Duration auto-calculates based on start and end dates
        </HelperText>
      </View>

      {/* Quantity & Progress Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Quantity & Progress
        </Text>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              label="Planned Quantity *"
              value={formData.quantity}
              onChangeText={(value) => onFieldChange('quantity', value)}
              mode="outlined"
              keyboardType="number-pad"
              error={!!getFieldError('quantity')}
              editable={!readOnly}
            />
          </View>
          <View style={styles.halfWidth}>
            <TextInput
              label="Completed Quantity"
              value={formData.completedQuantity}
              onChangeText={(value) => onFieldChange('completedQuantity', value)}
              mode="outlined"
              keyboardType="number-pad"
              editable={!readOnly}
            />
          </View>
        </View>

        <TextInput
          label="Unit of Measurement"
          value={formData.unit}
          onChangeText={(text) => onFieldChange('unit', text)}
          mode="outlined"
          placeholder="e.g., Set, Meter, Cubic Meter"
          style={styles.marginTop}
          editable={!readOnly}
        />

        <TextInput
          label="Weightage (%)"
          value={formData.weightage}
          onChangeText={(value) => onFieldChange('weightage', value)}
          mode="outlined"
          keyboardType="number-pad"
          placeholder="e.g., 10, 15, 20"
          style={styles.marginTop}
          editable={!readOnly}
        />

        <HelperText type="info">
          Progress: {progress}%
        </HelperText>
      </View>

      {/* Critical Path & Milestone Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Critical Path & Milestones
        </Text>

        <View style={styles.chipContainer}>
          <Chip
            selected={formData.isMilestone}
            onPress={() => !readOnly && onFieldChange('isMilestone', !formData.isMilestone)}
            style={styles.chip}
            icon={formData.isMilestone ? 'star' : 'star-outline'}
            disabled={readOnly}
          >
            Milestone
          </Chip>

          <Chip
            selected={formData.isCriticalPath}
            onPress={() => !readOnly && onFieldChange('isCriticalPath', !formData.isCriticalPath)}
            style={styles.chip}
            icon={formData.isCriticalPath ? 'alert-circle' : 'alert-circle-outline'}
            disabled={readOnly}
          >
            Critical Path
          </Chip>
        </View>

        {!formData.isCriticalPath && (
          <TextInput
            label="Float Days"
            value={formData.floatDays}
            onChangeText={(value) => onFieldChange('floatDays', value)}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.marginTop}
            editable={!readOnly}
          />
        )}
      </View>

      {/* Dependency Risk Section */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          Dependency Risk
        </Text>

        <View style={styles.chipContainer}>
          <Chip
            selected={formData.dependencyRisk === 'low'}
            onPress={() => !readOnly && onFieldChange('dependencyRisk', 'low')}
            style={styles.chip}
            disabled={readOnly}
          >
            Low
          </Chip>
          <Chip
            selected={formData.dependencyRisk === 'medium'}
            onPress={() => !readOnly && onFieldChange('dependencyRisk', 'medium')}
            style={styles.chip}
            disabled={readOnly}
          >
            Medium
          </Chip>
          <Chip
            selected={formData.dependencyRisk === 'high'}
            onPress={() => !readOnly && onFieldChange('dependencyRisk', 'high')}
            style={styles.chip}
            disabled={readOnly}
          >
            High
          </Chip>
        </View>

        {formData.dependencyRisk && formData.dependencyRisk !== 'low' && (
          <TextInput
            label="Risk Notes"
            value={formData.riskNotes}
            onChangeText={(text) => onFieldChange('riskNotes', text)}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Describe the risk and mitigation plan"
            style={styles.marginTop}
            editable={!readOnly}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
