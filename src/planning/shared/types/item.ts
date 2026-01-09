/**
 * Shared Item-related types for Planning components
 */

import { DependencyRisk, ProjectPhase } from '../../../../models/ItemModel';

/**
 * Form data structure for item creation and editing
 */
export interface ItemFormData {
  name: string;
  categoryId: string;
  parentWbsCode: string | null;
  phase: ProjectPhase;
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
  dependencyRisk: DependencyRisk | '';
  riskNotes: string;
}

/**
 * Props for ItemFormFields component
 */
export interface ItemFormFieldsProps {
  formData: ItemFormData;
  onFieldChange: (field: keyof ItemFormData, value: any) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  categoryMenuVisible?: boolean;
  phaseMenuVisible?: boolean;
  onToggleCategoryMenu?: () => void;
  onTogglePhaseMenu?: () => void;
  showDatePicker?: boolean;
  datePickerMode?: 'start' | 'end' | null;
  onOpenDatePicker?: (mode: 'start' | 'end') => void;
  onCloseDatePicker?: () => void;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  generatedWbsCode?: string;
  readOnly?: boolean;
  variant?: 'create' | 'edit';
}
