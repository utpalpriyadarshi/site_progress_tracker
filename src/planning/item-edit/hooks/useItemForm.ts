/**
 * useItemForm Hook
 *
 * Manages form state, validation, and field updates
 */

import { useState, useEffect } from 'react';
import ItemModel from '../../../../models/ItemModel';

export interface FormData {
  name: string;
  categoryId: string;
  phase: string;
  duration: string;
  startDate: Date;
  endDate: Date;
  unit: string;
  quantity: string;
  completedQuantity: string;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: string;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string;
}

const getDefaultFormData = (): FormData => ({
  name: '',
  categoryId: '',
  phase: 'design',
  duration: '',
  startDate: new Date(),
  endDate: new Date(),
  unit: 'Set',
  quantity: '1',
  completedQuantity: '0',
  isMilestone: false,
  isCriticalPath: false,
  floatDays: '0',
  dependencyRisk: 'low',
  riskNotes: '',
});

export const useItemForm = (item: ItemModel | null) => {
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form when item loads
  useEffect(() => {
    if (item) {
      const durationDays = Math.ceil(
        (item.plannedEndDate - item.plannedStartDate) / (1000 * 60 * 60 * 24)
      );

      setFormData({
        name: item.name,
        categoryId: item.categoryId,
        phase: item.projectPhase,
        duration: durationDays.toString(),
        startDate: new Date(item.plannedStartDate),
        endDate: new Date(item.plannedEndDate),
        unit: item.unitOfMeasurement || 'Set',
        quantity: item.plannedQuantity.toString(),
        completedQuantity: item.completedQuantity.toString(),
        isMilestone: item.isMilestone,
        isCriticalPath: item.isCriticalPath,
        floatDays: (item.floatDays || 0).toString(),
        dependencyRisk: item.dependencyRisk || 'low',
        riskNotes: item.riskNotes || '',
      });
    }
  }, [item]);

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

  // Update numeric field with validation (only positive numbers)
  const updateNumericField = (field: keyof FormData, value: string) => {
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

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    const qty = parseFloat(formData.quantity);
    const completedQty = parseFloat(formData.completedQuantity);

    if (qty > 0) {
      return Math.min(100, Math.round((completedQty / qty) * 100));
    }

    return 0;
  };

  return {
    formData,
    errors,
    updateField,
    updateNumericField,
    validateForm,
    getProgressPercentage,
  };
};
