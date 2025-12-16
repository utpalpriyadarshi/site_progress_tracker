import { InspectionFormData } from '../types';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validate inspection form data before submission
 *
 * @param data - Inspection form data
 * @param selectedSiteId - Selected site ID
 * @returns Validation result with error message if invalid
 */
export function validateInspection(
  data: Partial<InspectionFormData>,
  selectedSiteId?: string | 'all'
): ValidationResult {
  // Check if site is selected
  if (!selectedSiteId || selectedSiteId === 'all') {
    return {
      isValid: false,
      errorMessage: 'Please select a site',
    };
  }

  return { isValid: true };
}

/**
 * Validate follow-up data
 *
 * @param followUpRequired - Whether follow-up is required
 * @param followUpDate - Follow-up date string
 * @returns Validation result with error message if invalid
 */
export function validateFollowUp(
  followUpRequired: boolean,
  followUpDate: string
): ValidationResult {
  if (followUpRequired && !followUpDate) {
    return {
      isValid: false,
      errorMessage: 'Please select a follow-up date',
    };
  }

  return { isValid: true };
}

/**
 * Validate all inspection data
 *
 * Convenience function that runs all validations
 *
 * @param data - Inspection form data
 * @param selectedSiteId - Selected site ID
 * @returns Validation result with error message if any validation fails
 */
export function validateAll(
  data: Partial<InspectionFormData>,
  selectedSiteId?: string | 'all'
): ValidationResult {
  // Validate site selection
  const siteValidation = validateInspection(data, selectedSiteId);
  if (!siteValidation.isValid) {
    return siteValidation;
  }

  // Validate follow-up if required
  if (data.followUpRequired && data.followUpDate !== undefined) {
    const followUpValidation = validateFollowUp(
      data.followUpRequired,
      data.followUpDate
    );
    if (!followUpValidation.isValid) {
      return followUpValidation;
    }
  }

  return { isValid: true };
}
