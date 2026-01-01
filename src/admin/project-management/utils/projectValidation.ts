import { ProjectStatus } from './projectConstants';

export interface ProjectFormData {
  name: string;
  client: string;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus | 'active' | 'completed' | 'on_hold' | 'cancelled';
  budget: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate project form data
 */
export const validateProjectForm = (formData: ProjectFormData): ValidationResult => {
  if (!formData.name.trim()) {
    return { isValid: false, error: 'Project name is required' };
  }

  if (!formData.client.trim()) {
    return { isValid: false, error: 'Client name is required' };
  }

  const budget = parseFloat(formData.budget);
  if (isNaN(budget) || budget < 0) {
    return { isValid: false, error: 'Please enter a valid budget' };
  }

  return { isValid: true };
};
