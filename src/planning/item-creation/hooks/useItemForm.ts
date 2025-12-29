import { useState } from 'react';

export interface FormData {
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

interface UseItemFormProps {
  parentWbsCode: string | null;
}

export const useItemForm = ({ parentWbsCode }: UseItemFormProps) => {
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

  return {
    formData,
    errors,
    updateField,
    updateNumericField,
    validateForm,
  };
};
