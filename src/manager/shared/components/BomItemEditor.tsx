import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * BomItemEditor
 *
 * Fully reusable component for adding/editing BOM items with validation and auto-calculation
 *
 * Features:
 * - Modal dialog interface
 * - Real-time cost calculation (quantity × unitCost = totalCost)
 * - Category/subcategory dropdowns
 * - Unit selection
 * - WBS code input with validation
 * - Phase selection
 * - Input validation with error messages
 * - Auto-formatting for currency
 * - Keyboard-aware scrolling
 *
 * @example
 * ```tsx
 * <BomItemEditor
 *   visible={isVisible}
 *   mode="add"
 *   onSave={(data) => console.log('Saved:', data)}
 *   onCancel={() => setIsVisible(false)}
 *   bomType="estimating"
 * />
 * ```
 */

export interface BomItemData {
  itemCode?: string;
  description: string;
  category: 'material' | 'labor' | 'equipment' | 'subcontractor';
  subCategory?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  wbsCode?: string;
  phase?: string;
  notes?: string;
}

interface BomItemEditorProps {
  visible: boolean;
  mode: 'add' | 'edit';
  initialData?: BomItemData;
  onSave: (data: BomItemData) => void;
  onCancel: () => void;
  bomType?: 'estimating' | 'execution';
  disabledFields?: string[];
}

const CATEGORIES = [
  { label: 'Material', value: 'material' as const },
  { label: 'Labor', value: 'labor' as const },
  { label: 'Equipment', value: 'equipment' as const },
  { label: 'Subcontractor', value: 'subcontractor' as const },
];

const UNITS = ['nos', 'm²', 'm³', 'kg', 'ton', 'hrs', 'ls', 'lot', 'm', 'ft'];

const PHASES = [
  'Foundation',
  'Structure',
  'MEP',
  'Finishing',
  'External Works',
  'Miscellaneous',
];

const BomItemEditor: React.FC<BomItemEditorProps> = ({
  visible,
  mode,
  initialData,
  onSave,
  onCancel,
  bomType,
  disabledFields = [],
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BomItemData['category']>('material');
  const [subCategory, setSubCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('nos');
  const [unitCost, setUnitCost] = useState('0');
  const [wbsCode, setWbsCode] = useState('');
  const [phase, setPhase] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Category dropdown state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);

  // Initialize form with data in edit mode
  useEffect(() => {
    if (visible && mode === 'edit' && initialData) {
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setSubCategory(initialData.subCategory || '');
      setQuantity(initialData.quantity.toString());
      setUnit(initialData.unit);
      setUnitCost(initialData.unitCost.toString());
      setWbsCode(initialData.wbsCode || '');
      setPhase(initialData.phase || '');
      setNotes(initialData.notes || '');
    } else if (visible && mode === 'add') {
      // Reset form for add mode
      setDescription('');
      setCategory('material');
      setSubCategory('');
      setQuantity('1');
      setUnit('nos');
      setUnitCost('0');
      setWbsCode('');
      setPhase('');
      setNotes('');
    }
    setErrors({});
  }, [visible, mode, initialData]);

  const calculateTotalCost = () => {
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    return qty * cost;
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    const cost = parseFloat(unitCost);
    if (isNaN(cost) || cost < 0) {
      newErrors.unitCost = 'Unit cost must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const data: BomItemData = {
      description: description.trim(),
      category,
      subCategory: subCategory.trim() || undefined,
      quantity: parseFloat(quantity),
      unit,
      unitCost: parseFloat(unitCost),
      wbsCode: wbsCode.trim() || undefined,
      phase: phase || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(data);
  };

  const isFieldDisabled = (fieldName: string) => {
    return disabledFields.includes(fieldName);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {mode === 'add' ? 'Add BOM Item' : 'Edit BOM Item'}
              </Text>
              {bomType && (
                <Text style={styles.headerSubtitle}>
                  {bomType === 'estimating' ? 'Estimating BOM' : 'Execution BOM'}
                </Text>
              )}
            </View>

            {/* Form */}
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.description && styles.inputError]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter item description"
                  multiline
                  numberOfLines={2}
                  editable={!isFieldDisabled('description')}
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Category <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => !isFieldDisabled('category') && setShowCategoryDropdown(!showCategoryDropdown)}
                  disabled={isFieldDisabled('category')}
                >
                  <Text style={styles.dropdownText}>
                    {CATEGORIES.find((c) => c.value === category)?.label}
                  </Text>
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenu}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCategory(cat.value);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Row: Quantity and Unit */}
              <View style={styles.row}>
                <View style={[styles.formGroup, styles.flex1]}>
                  <Text style={styles.label}>
                    Quantity <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.quantity && styles.inputError]}
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    editable={!isFieldDisabled('quantity')}
                  />
                  {errors.quantity && (
                    <Text style={styles.errorText}>{errors.quantity}</Text>
                  )}
                </View>

                <View style={[styles.formGroup, styles.flex1]}>
                  <Text style={styles.label}>Unit</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => !isFieldDisabled('unit') && setShowUnitDropdown(!showUnitDropdown)}
                    disabled={isFieldDisabled('unit')}
                  >
                    <Text style={styles.dropdownText}>{unit}</Text>
                  </TouchableOpacity>
                  {showUnitDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll}>
                        {UNITS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setUnit(u);
                              setShowUnitDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Unit Cost */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Unit Cost (₹) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.unitCost && styles.inputError]}
                  value={unitCost}
                  onChangeText={setUnitCost}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  editable={!isFieldDisabled('unitCost')}
                />
                {errors.unitCost && (
                  <Text style={styles.errorText}>{errors.unitCost}</Text>
                )}
              </View>

              {/* Total Cost (Calculated) */}
              <View style={styles.totalCostContainer}>
                <Text style={styles.totalCostLabel}>Total Cost:</Text>
                <Text style={styles.totalCostValue}>
                  {formatCurrency(calculateTotalCost())}
                </Text>
              </View>

              {/* Phase */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phase</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => !isFieldDisabled('phase') && setShowPhaseDropdown(!showPhaseDropdown)}
                  disabled={isFieldDisabled('phase')}
                >
                  <Text style={styles.dropdownText}>{phase || 'Select phase'}</Text>
                </TouchableOpacity>
                {showPhaseDropdown && (
                  <View style={styles.dropdownMenu}>
                    {PHASES.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPhase(p);
                          setShowPhaseDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* WBS Code */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>WBS Code</Text>
                <TextInput
                  style={styles.input}
                  value={wbsCode}
                  onChangeText={setWbsCode}
                  placeholder="e.g., 1.2.3.4"
                  editable={!isFieldDisabled('wbsCode')}
                />
              </View>

              {/* Sub Category */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Sub Category</Text>
                <TextInput
                  style={styles.input}
                  value={subCategory}
                  onChangeText={setSubCategory}
                  placeholder="Optional"
                  editable={!isFieldDisabled('subCategory')}
                />
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                  editable={!isFieldDisabled('notes')}
                />
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {mode === 'add' ? 'Add Item' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  form: {
    padding: 20,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: COLORS.ERROR,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 4,
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.INFO_BG,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.INFO,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BomItemEditor;
