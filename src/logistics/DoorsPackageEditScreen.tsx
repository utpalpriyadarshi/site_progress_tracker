import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const { packageId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doorsPackage, setDoorsPackage] = useState<DoorsPackageModel | null>(null);

  // Form state
  const [equipmentName, setEquipmentName] = useState('');
  const [category, setCategory] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [specificationRef, setSpecificationRef] = useState('');
  const [drawingRef, setDrawingRef] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load package data
  useEffect(() => {
    loadPackage();
  }, [packageId]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const doorsPackagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const pkg = await doorsPackagesCollection.find(packageId);

      setDoorsPackage(pkg);
      setEquipmentName(pkg.equipmentName);
      setCategory(pkg.category);
      setEquipmentType(pkg.equipmentType);
      setStatus(pkg.status);
      setPriority(pkg.priority);
      setQuantity(pkg.quantity.toString());
      setUnit(pkg.unit);
      setSpecificationRef(pkg.specificationRef || '');
      setDrawingRef(pkg.drawingRef || '');
    } catch (error) {
      console.error('[DoorsPackageEdit] Error loading package:', error);
      Alert.alert('Error', 'Failed to load package details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!doorsPackage || !user) return;

    try {
      setSaving(true);
      setErrors({});

      // Validate quantity before parsing
      const quantityNum = parseFloat(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        Alert.alert('Validation Error', 'Quantity must be a number greater than 0');
        return;
      }

      // Prepare updates
      const updates: PackageEditData = {
        equipmentName,
        category,
        equipmentType,
        status,
        priority,
        quantity: quantityNum,
        unit,
        specificationRef: specificationRef || undefined,
        drawingRef: drawingRef || undefined,
      };

      console.log('[DoorsPackageEdit] Saving updates:', updates);

      // Call edit service
      await DoorsEditService.updatePackage(
        packageId,
        updates,
        user.id,
        user.role
      );

      Alert.alert('Success', 'Package updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('[DoorsPackageEdit] Error saving package:', error);

      // Handle validation errors
      if (error.message && error.message.includes('Validation failed')) {
        Alert.alert('Validation Error', error.message);
      } else if (error.message && error.message.includes("don't have permission")) {
        Alert.alert('Permission Denied', error.message);
      } else {
        Alert.alert('Error', 'Failed to save package. Please try again.');
      }
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading package...</Text>
      </View>
    );
  }

  if (!doorsPackage) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Package not found</Text>
      </View>
    );
  }

  // Check if user can edit
  const canEdit = DoorsEditService.canEditPackage(user?.role || '', doorsPackage.status);

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
          style={[styles.saveButton, (!canEdit || saving) && styles.saveButtonDisabled]}
          disabled={!canEdit || saving}
        >
          {saving ? (
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
            ⚠️ You don't have permission to edit this package. Status: {doorsPackage.status}
          </Text>
        </View>
      )}

      {/* Form */}
      <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
        {/* Package ID (Read-only) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>DOORS ID</Text>
          <Text style={styles.readOnlyValue}>{doorsPackage.doorsId}</Text>
        </View>

        {/* Equipment Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Equipment Name *</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={equipmentName}
            onChangeText={setEquipmentName}
            placeholder="e.g., Auxiliary Transformer 1000kVA"
            editable={canEdit}
          />
          {errors.equipmentName && (
            <Text style={styles.errorText}>{errors.equipmentName}</Text>
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
                  category === cat && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && setCategory(cat)}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, category === cat && styles.pillTextSelected]}>
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
            value={equipmentType}
            onChangeText={setEquipmentType}
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
                  status === stat && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && setStatus(stat)}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, status === stat && styles.pillTextSelected]}>
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
                  priority === pri && styles.pillSelected,
                  !canEdit && styles.pillDisabled,
                ]}
                onPress={() => canEdit && setPriority(pri)}
                disabled={!canEdit}
              >
                <Text style={[styles.pillText, priority === pri && styles.pillTextSelected]}>
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
              value={quantity}
              onChangeText={setQuantity}
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
              value={unit}
              onChangeText={setUnit}
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
            value={specificationRef}
            onChangeText={setSpecificationRef}
            placeholder="e.g., IEC 60076-1"
            editable={canEdit}
          />
        </View>

        {/* Drawing Reference */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Drawing Reference</Text>
          <TextInput
            style={[styles.input, !canEdit && styles.inputDisabled]}
            value={drawingRef}
            onChangeText={setDrawingRef}
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
              <Text style={styles.complianceValue}>{doorsPackage.totalRequirements}</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Compliant</Text>
              <Text style={styles.complianceValue}>{doorsPackage.compliantRequirements}</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceLabel}>Compliance %</Text>
              <Text style={[
                styles.complianceValue,
                doorsPackage.compliancePercentage >= 80 ? styles.complianceHigh : styles.complianceLow
              ]}>
                {doorsPackage.compliancePercentage.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.complianceNote}>
            Note: Compliance values are calculated from requirements and cannot be edited directly.
          </Text>
        </View>

        {/* Audit Info */}
        {doorsPackage.lastModifiedAt && (
          <View style={styles.auditSection}>
            <Text style={styles.auditTitle}>Last Modified</Text>
            <Text style={styles.auditText}>
              {new Date(doorsPackage.lastModifiedAt).toLocaleString()}
            </Text>
            {doorsPackage.modifiedById && (
              <Text style={styles.auditText}>By: {doorsPackage.modifiedById}</Text>
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
    color: '#4CAF50',
  },
  complianceLow: {
    color: '#FF9800',
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
const DoorsPackageEditScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - DoorsPackageEditScreen">
    <DoorsPackageEditScreen />
  </ErrorBoundary>
);

export default DoorsPackageEditScreenWithBoundary;
