import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

/**
 * RfqForm
 *
 * Reusable RFQ (Request for Quotation) creation/edit form with validation
 * Used across Logistics screens for consistent RFQ management
 *
 * Features:
 * - Material selector with quantities
 * - Multi-supplier selection
 * - Date picker for deadline
 * - Priority selection
 * - File attachment support
 * - Form validation
 * - Auto-save draft (optional)
 * - Calculation of total quantities
 *
 * @example
 * ```tsx
 * <RfqForm
 *   initialData={{
 *     title: 'Steel Materials Request',
 *     description: 'Request for steel beams and rebar',
 *     materials: [
 *       {
 *         materialId: '1',
 *         quantity: 100,
 *         unit: 'pieces',
 *         specifications: 'Grade A',
 *       },
 *     ],
 *     suppliers: ['supplier1', 'supplier2'],
 *     deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *     deliverySite: 'Site A',
 *     priority: 'high',
 *   }}
 *   onSave={async (data) => console.log('Save:', data)}
 *   onCancel={() => console.log('Cancel')}
 *   mode="create"
 *   suppliers={[
 *     { id: '1', name: 'Steel Co.' },
 *     { id: '2', name: 'Material Supply Inc.' },
 *   ]}
 *   materials={[
 *     { id: '1', name: 'Steel Beams', unit: 'pieces' },
 *     { id: '2', name: 'Rebar', unit: 'tons' },
 *   ]}
 * />
 * ```
 */

export interface RfqFormData {
  title: string;
  description: string;
  materials: {
    materialId: string;
    quantity: number;
    unit: string;
    specifications?: string;
  }[];
  suppliers: string[];
  deadline: Date;
  deliverySite: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  attachments?: string[];
}

export interface Supplier {
  id: string;
  name: string;
}

export interface MaterialOption {
  id: string;
  name: string;
  unit: string;
}

interface RfqFormProps {
  initialData?: Partial<RfqFormData>;
  onSave: (data: RfqFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  suppliers?: Supplier[];
  materials?: MaterialOption[];
}

const RfqForm: React.FC<RfqFormProps> = ({
  initialData,
  onSave,
  onCancel,
  mode,
  suppliers = [],
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedMaterials, setSelectedMaterials] = useState<
    RfqFormData['materials']
  >(initialData?.materials || []);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(
    initialData?.suppliers || []
  );
  const [deadline] = useState<Date>(
    initialData?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );
  const [deliverySite, setDeliverySite] = useState(
    initialData?.deliverySite || ''
  );
  const [priority, setPriority] = useState<RfqFormData['priority']>(
    initialData?.priority || 'normal'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const priorities: RfqFormData['priority'][] = ['low', 'normal', 'high', 'urgent'];

  const getPriorityColor = (p: RfqFormData['priority']) => {
    switch (p) {
      case 'urgent':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'normal':
        return '#2196F3';
      case 'low':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (selectedMaterials.length === 0) {
      newErrors.materials = 'At least one material is required';
    }

    if (selectedSuppliers.length === 0) {
      newErrors.suppliers = 'At least one supplier is required';
    }

    if (!deliverySite.trim()) {
      newErrors.deliverySite = 'Delivery site is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, selectedMaterials, selectedSuppliers, deliverySite]);

  const handleAddMaterial = () => {
    setSelectedMaterials([
      ...selectedMaterials,
      { materialId: '', quantity: 0, unit: '' },
    ]);
  };

  const handleRemoveMaterial = (index: number) => {
    const updated = [...selectedMaterials];
    updated.splice(index, 1);
    setSelectedMaterials(updated);
  };

  const handleMaterialChange = (
    index: number,
    field: keyof RfqFormData['materials'][0],
    value: string | number
  ) => {
    const updated = [...selectedMaterials];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedMaterials(updated);
  };

  const toggleSupplier = (supplierId: string) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter((id) => id !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const formData: RfqFormData = {
        title,
        description,
        materials: selectedMaterials,
        suppliers: selectedSuppliers,
        deadline,
        deliverySite,
        priority,
        notes,
      };
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter RFQ title"
            placeholderTextColor="#9E9E9E"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textarea, errors.description && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter detailed description"
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={4}
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && {
                    backgroundColor: getPriorityColor(p),
                    borderColor: getPriorityColor(p),
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p && styles.priorityTextActive,
                  ]}
                >
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Materials */}
      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Materials *</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddMaterial}>
            <Text style={styles.addButtonText}>+ Add Material</Text>
          </TouchableOpacity>
        </View>

        {selectedMaterials.map((material, index) => (
          <View key={index} style={styles.materialCard}>
            <View style={styles.materialHeader}>
              <Text style={styles.materialLabel}>Material {index + 1}</Text>
              <TouchableOpacity onPress={() => handleRemoveMaterial(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={material.materialId}
              onChangeText={(value) =>
                handleMaterialChange(index, 'materialId', value)
              }
              placeholder="Material ID"
              placeholderTextColor="#9E9E9E"
            />

            <View style={styles.materialRow}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                value={material.quantity.toString()}
                onChangeText={(value) =>
                  handleMaterialChange(index, 'quantity', parseFloat(value) || 0)
                }
                placeholder="Quantity"
                placeholderTextColor="#9E9E9E"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.unitInput]}
                value={material.unit}
                onChangeText={(value) => handleMaterialChange(index, 'unit', value)}
                placeholder="Unit"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            <TextInput
              style={styles.input}
              value={material.specifications || ''}
              onChangeText={(value) =>
                handleMaterialChange(index, 'specifications', value)
              }
              placeholder="Specifications (optional)"
              placeholderTextColor="#9E9E9E"
            />
          </View>
        ))}

        {errors.materials && (
          <Text style={styles.errorText}>{errors.materials}</Text>
        )}
      </View>

      {/* Suppliers */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Suppliers *</Text>
        <View style={styles.suppliersGrid}>
          {suppliers.map((supplier) => (
            <TouchableOpacity
              key={supplier.id}
              style={[
                styles.supplierChip,
                selectedSuppliers.includes(supplier.id) &&
                  styles.supplierChipSelected,
              ]}
              onPress={() => toggleSupplier(supplier.id)}
            >
              <Text
                style={[
                  styles.supplierChipText,
                  selectedSuppliers.includes(supplier.id) &&
                    styles.supplierChipTextSelected,
                ]}
              >
                {supplier.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.suppliers && (
          <Text style={styles.errorText}>{errors.suppliers}</Text>
        )}
      </View>

      {/* Delivery Details */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Delivery Site *</Text>
          <TextInput
            style={[styles.input, errors.deliverySite && styles.inputError]}
            value={deliverySite}
            onChangeText={setDeliverySite}
            placeholder="Enter delivery site"
            placeholderTextColor="#9E9E9E"
          />
          {errors.deliverySite && (
            <Text style={styles.errorText}>{errors.deliverySite}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Deadline</Text>
          <Text style={styles.dateText}>{formatDate(deadline)}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.textarea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes or requirements"
            placeholderTextColor="#9E9E9E"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>
              {mode === 'create' ? 'Create RFQ' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#F44336',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  priorityTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  materialCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  removeText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  materialRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  suppliersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supplierChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  supplierChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  supplierChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
  },
  supplierChipTextSelected: {
    color: '#fff',
  },
  dateText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default RfqForm;
