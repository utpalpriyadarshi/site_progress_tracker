import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../hooks/useSnackbar';
import BomCalculatorService from '../../services/BomCalculatorService';
import { COLORS } from '../../theme/colors';

/**
 * BomItemEditor
 *
 * Modal component for adding/editing BOM items with auto-calculations
 *
 * Features:
 * - Real-time cost calculation (quantity × unitCost = totalCost)
 * - Category selection
 * - WBS code input
 * - Phase selection
 * - Input validation
 * - Auto-formatting for currency
 */

interface BomItemEditorProps {
  mode: 'add' | 'edit';
  initialData?: {
    itemCode: string;
    description: string;
    category: 'material' | 'labor' | 'equipment' | 'subcontractor';
    subCategory?: string;
    quantity: number;
    unit: string;
    unitCost: number;
    wbsCode?: string;
    phase?: string;
    notes?: string;
  };
  onSave: (data: {
    itemCode: string;
    description: string;
    category: 'material' | 'labor' | 'equipment' | 'subcontractor';
    subCategory?: string;
    quantity: number;
    unit: string;
    unitCost: number;
    wbsCode?: string;
    phase?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

const BomItemEditor: React.FC<BomItemEditorProps> = ({
  mode,
  initialData,
  onSave,
  onCancel,
}) => {
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [itemCode, setItemCode] = useState(initialData?.itemCode || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<'material' | 'labor' | 'equipment' | 'subcontractor'>(
    initialData?.category || 'material'
  );
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [quantity, setQuantity] = useState(initialData?.quantity.toString() || '0');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [unitCost, setUnitCost] = useState(initialData?.unitCost.toString() || '0');
  const [wbsCode, setWbsCode] = useState(initialData?.wbsCode || '');
  const [phase, setPhase] = useState(initialData?.phase || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [totalCost, setTotalCost] = useState(0);

  // Auto-calculate total cost when quantity or unit cost changes
  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    const validation = BomCalculatorService.validateItemCost(qty, cost);

    if (validation.isValid) {
      setTotalCost(validation.totalCost);
    } else {
      setTotalCost(0);
    }
  }, [quantity, unitCost]);

  const handleSave = () => {
    // Validation
    if (!itemCode.trim()) {
      showSnackbar('Please enter an item code');
      return;
    }
    if (!description.trim()) {
      showSnackbar('Please enter a description');
      return;
    }
    if (!unit.trim()) {
      showSnackbar('Please enter a unit of measurement');
      return;
    }

    const qty = parseFloat(quantity);
    const cost = parseFloat(unitCost);

    if (isNaN(qty) || qty < 0) {
      showSnackbar('Please enter a valid quantity (greater than or equal to 0)');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      showSnackbar('Please enter a valid unit cost (greater than or equal to 0)');
      return;
    }

    // Save data
    onSave({
      itemCode: itemCode.trim(),
      description: description.trim(),
      category,
      subCategory: subCategory.trim() || undefined,
      quantity: qty,
      unit: unit.trim(),
      unitCost: cost,
      wbsCode: wbsCode.trim() || undefined,
      phase: phase.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const categories = [
    { value: 'material', label: 'Material', icon: '🧱' },
    { value: 'labor', label: 'Labor', icon: '👷' },
    { value: 'equipment', label: 'Equipment', icon: '🚜' },
    { value: 'subcontractor', label: 'Subcontractor', icon: '🏗️' },
  ];

  const commonUnits = ['nos', 'm', 'm2', 'm3', 'kg', 'ton', 'hrs', 'days', 'set', 'lot'];
  const commonPhases = ['Foundation', 'Structure', 'Finishing', 'MEP', 'Landscaping'];

  return (
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{mode === 'add' ? 'Add BOM Item' : 'Edit BOM Item'}</Text>

      {/* Item Code */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Item Code <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={itemCode}
          onChangeText={setItemCode}
          placeholder="e.g., MAT-001, LAB-002"
          placeholderTextColor="#999"
        />
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Category <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryButton,
                category === cat.value && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat.value as any)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  category === cat.value && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sub-category */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Sub-category</Text>
        <TextInput
          style={styles.input}
          value={subCategory}
          onChangeText={setSubCategory}
          placeholder="e.g., concrete, steel, electrical"
          placeholderTextColor="#999"
        />
      </View>

      {/* Quantity and Unit */}
      <View style={styles.rowGroup}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>
            Quantity <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>
            Unit <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={unit}
            onChangeText={setUnit}
            placeholder="e.g., m3, kg, hrs"
            placeholderTextColor="#999"
          />
          <View style={styles.quickUnits}>
            {commonUnits.slice(0, 5).map((u) => (
              <TouchableOpacity
                key={u}
                style={styles.quickUnit}
                onPress={() => setUnit(u)}
              >
                <Text style={styles.quickUnitText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Unit Cost and Total Cost */}
      <View style={styles.rowGroup}>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>
            Unit Cost (₹) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={unitCost}
            onChangeText={setUnitCost}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.formGroupHalf}>
          <Text style={styles.label}>Total Cost (₹)</Text>
          <View style={styles.totalCostContainer}>
            <Text style={styles.totalCostValue}>
              {BomCalculatorService.formatCurrency(totalCost)}
            </Text>
            <Text style={styles.totalCostFormula}>
              {quantity} × {unitCost}
            </Text>
          </View>
        </View>
      </View>

      {/* WBS Code */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>WBS Code</Text>
        <TextInput
          style={styles.input}
          value={wbsCode}
          onChangeText={setWbsCode}
          placeholder="e.g., 1.2.3.4"
          placeholderTextColor="#999"
        />
      </View>

      {/* Phase */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phase</Text>
        <TextInput
          style={styles.input}
          value={phase}
          onChangeText={setPhase}
          placeholder="e.g., Foundation, Structure"
          placeholderTextColor="#999"
        />
        <View style={styles.quickPhases}>
          {commonPhases.map((p) => (
            <TouchableOpacity
              key={p}
              style={styles.quickPhase}
              onPress={() => setPhase(p)}
            >
              <Text style={styles.quickPhaseText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes or comments"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {mode === 'add' ? 'Add Item' : 'Update Item'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    <Snackbar {...snackbarProps} duration={3000} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: COLORS.ERROR,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    borderColor: COLORS.INFO,
    backgroundColor: COLORS.INFO_BG,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
  },
  categoryLabelActive: {
    color: COLORS.INFO,
    fontWeight: '600',
  },
  quickUnits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  quickUnit: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickUnitText: {
    fontSize: 11,
    color: '#666',
  },
  quickPhases: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickPhase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickPhaseText: {
    fontSize: 12,
    color: '#666',
  },
  totalCostContainer: {
    backgroundColor: COLORS.INFO_BG,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.INFO,
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.INFO,
    marginBottom: 4,
  },
  totalCostFormula: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.INFO,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BomItemEditor;
