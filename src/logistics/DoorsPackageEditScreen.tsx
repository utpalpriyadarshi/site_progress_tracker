import React, { useReducer, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggingService';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../models/database';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { useAuth } from '../auth/AuthContext';
import DoorsEditService, { PackageEditData } from '../services/DoorsEditService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// DOORS Package state management
import { doorsPackageFormReducer, initialDoorsPackageFormState } from './doors-package/state';
import { COLORS } from '../theme/colors';

/**
 * DOORS Package Edit Screen
 *
 * Allows editing of DOORS package details with validation and permission checks
 * Phase 3: Activity 4 - DOORS Advanced Features
 */

interface DoorsPackageEditScreenProps {
  route: {
    params: {
      packageId: string;
    };
  };
  navigation: any;
}

const DoorsPackageEditScreen: React.FC<DoorsPackageEditScreenProps> = ({ route, navigation }) => {
  const { user, currentRole } = useAuth();
  const { packageId } = route.params;

  // Centralized state management with useReducer (replaces 13 useState hooks)
  const [state, dispatch] = useReducer(doorsPackageFormReducer, initialDoorsPackageFormState);

  const loadPackage = useCallback(async () => {
    try {
      dispatch({ type: 'START_LOADING' });
      const doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const pkg = await doorsPackagesCollection.find(packageId);

      // Load package data with all form fields at once
      dispatch({
        type: 'LOAD_PACKAGE_DATA',
        payload: {
          doorsPackage: pkg,
          formData: {
            equipmentName: pkg.equipmentName,
            category: pkg.category,
            equipmentType: pkg.equipmentType,
            status: pkg.status,
            priority: pkg.priority,
            quantity: pkg.quantity.toString(),
            unit: pkg.unit,
            specificationRef: pkg.specificationRef || '',
            drawingRef: pkg.drawingRef || '',
          },
        },
      });
    } catch (error) {
      logger.error('[DoorsPackageEdit] Error loading package:', error as Error);
      Alert.alert('Error', 'Failed to load package details');
      navigation.goBack();
    } finally {
      dispatch({ type: 'STOP_LOADING' });
    }
  }, [packageId, navigation]);

  // Load package data on mount
  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  const handleSave = async () => {
    if (!state.data.doorsPackage || !user) return;

    try {
      dispatch({ type: 'START_SAVING' });
      dispatch({ type: 'CLEAR_ERRORS' });

      // Validate quantity before parsing
      const quantityNum = parseFloat(state.form.quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        Alert.alert('Validation Error', 'Quantity must be a number greater than 0');
        return;
      }

      // Prepare updates
      const updates: PackageEditData = {
        equipmentName: state.form.equipmentName,
        category: state.form.category,
        equipmentType: state.form.equipmentType,
        status: state.form.status,
        priority: state.form.priority,
        quantity: quantityNum,
        unit: state.form.unit,
        specificationRef: state.form.specificationRef || undefined,
        drawingRef: state.form.drawingRef || undefined,
      };

      logger.info('[DoorsPackageEdit] Saving updates:', updates);

      // Call edit service
      await DoorsEditService.updatePackage(
        packageId,
        updates,
        user.userId,
        currentRole || ''
      );

      Alert.alert('Success', 'Package updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      logger.error('[DoorsPackageEdit] Error saving package:', error);

      // Handle validation errors
      if (error.message && error.message.includes('Validation failed')) {
        Alert.alert('Validation Error', error.message);
      } else if (error.message && error.message.includes("don't have permission")) {
        Alert.alert('Permission Denied', error.message);
      } else {
        Alert.alert('Error', 'Failed to save package. Please try again.');
      }
    } finally {
      dispatch({ type: 'STOP_SAVING' });
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (state.ui.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading package...</Text>
      </View>
    );
  }

  if (!state.data.doorsPackage) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Package not found</Text>
      </View>
    );
  }

  // Check if user can edit
  const canEdit = DoorsEditService.canEditPackage(currentRole || '', state.data.doorsPackage.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Package</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, (!canEdit || state.ui.saving) && styles.saveButtonDisabled]}
          disabled={!canEdit || state.ui.saving}
        >
          {state.ui.saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Permission warning */}
      {!canEdit && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ You don't have permission to edit this package. Status: {state.data.doorsPackage.status}
          </Text>
        </View>
      )}

      {/* Form */}
      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
        {/* Package ID (Read-only) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>DOORS ID</Text>
          <Text style={styles.readOnlyValue}>{state.data.doorsPackage.doorsId}</Text>
        </View>

        {/* Equipment Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Equipment Name *</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={state.form.equipmentName}
            onChangeText={(text) => dispatch({ type: 'SET_EQUIPMENT_NAME', payload: text })}
            placeholder="e.g., Auxiliary Transformer 1000kVA"
            editable={canEdit}
          />
          {state.validation.errors.equipmentName && (
            <Text style={styles.errorText}>{state.validation.errors.equipmentName}</Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pillContainer}>
            {['OHE', 'TSS', 'SCADA', 'Cables', 'Hardware', 'Consumables'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pill,
                  state.form.category === cat && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && dispatch({ type: 'SET_CATEGORY', payload: cat })}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, state.form.category === cat && styles.pillTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Equipment Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Equipment Type *</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={state.form.equipmentType}
            onChangeText={(text) => dispatch({ type: 'SET_EQUIPMENT_TYPE', payload: text })}
            placeholder="e.g., Transformer, Switchgear, Cable"
            editable={canEdit}
          />
        </View>

        {/* Status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Status *</Text>
          <View style={styles.pillContainer}>
            {['draft', 'under_review', 'approved', 'closed'].map((stat) => (
              <TouchableOpacity
                key={stat}
                style={[
                  styles.pill,
                  state.form.status === stat && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && dispatch({ type: 'SET_STATUS', payload: stat })}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, state.form.status === stat && styles.pillTextSelected]}>
                  {stat.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority *</Text>
          <View style={styles.pillContainer}>
            {['high', 'medium', 'low'].map((pri) => (
              <TouchableOpacity
                key={pri}
                style={[
                  styles.pill,
                  state.form.priority === pri && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && dispatch({ type: 'SET_PRIORITY', payload: pri })}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, state.form.priority === pri && styles.pillTextSelected]}>
                  {pri.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quantity & Unit */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputDisabled]}
              value={state.form.quantity}
              onChangeText={(text) => dispatch({ type: 'SET_QUANTITY', payload: text })}
              placeholder="e.g., 5"
              keyboardType="numeric"
              editable={canEdit}
            />
          </View>
          <View style={styles.spacer} />
          <View style={[styles.fieldGroup, styles.flex1]}>
            <Text style={styles.label}>Unit *</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputDisabled]}
              value={state.form.unit}
              onChangeText={(text) => dispatch({ type: 'SET_UNIT', payload: text })}
              placeholder="e.g., nos"
              editable={canEdit}
            />
          </View>
        </View>

        {/* Specification Reference */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Specification Reference</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={state.form.specificationRef}
            onChangeText={(text) => dispatch({ type: 'SET_SPECIFICATION_REF', payload: text })}
            placeholder="e.g., IEC 60076-1"
            editable={canEdit}
          />
        </View>

        {/* Drawing Reference */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Drawing Reference</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={state.form.drawingRef}
            onChangeText={(text) => dispatch({ type: 'SET_DRAWING_REF', payload: text })}
            placeholder="e.g., DRW-TSS-001"
            editable={canEdit}
          />
        </View>

        {/* Compliance Info (Read-only) */}
        <View style={styles.complianceSection}>
          <Text style={styles.sectionTitle}>Compliance Summary</Text>
          <View style={styles.complianceGrid}>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Total Requirements</Text>
              <Text style={styles.complianceValue}>{state.data.doorsPackage.totalRequirements}</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Compliant</Text>
              <Text style={styles.complianceValue}>{state.data.doorsPackage.compliantRequirements}</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Compliance %</Text>
              <Text style={[
                styles.complianceValue,
                state.data.doorsPackage.compliancePercentage >= 80 ? styles.complianceHigh : styles.complianceLow
              ]}>
                {state.data.doorsPackage.compliancePercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.complianceNote}>
            Note: Compliance values are calculated from requirements and cannot be edited directly.
          </Text>
        </View>

        {/* Audit Info */}
        {state.data.doorsPackage.lastModifiedAt && (
          <View style={styles.auditSection}>
            <Text style={styles.auditTitle}>Last Modified</Text>
            <Text style={styles.auditText}>
              {new Date(state.data.doorsPackage.lastModifiedAt).toLocaleString()}
            </Text>
            {state.data.doorsPackage.modifiedById && (
              <Text style={styles.auditText}>By: {state.data.doorsPackage.modifiedById}</Text>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFEAA7',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  pillTextSelected: {
    color: '#FFF',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  complianceSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  complianceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  complianceItem: {
    alignItems: 'center',
  },
  complianceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  complianceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  complianceHigh: {
    color: COLORS.SUCCESS,
  },
  complianceLow: {
    color: COLORS.WARNING,
  },
  complianceNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  auditSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  auditText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 20,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const DoorsPackageEditScreenWithBoundary = (props: DoorsPackageEditScreenProps) => (
  <ErrorBoundary name="Logistics - DoorsPackageEditScreen">
    <DoorsPackageEditScreen {...props} />
  </ErrorBoundary>
);

export default DoorsPackageEditScreenWithBoundary;
