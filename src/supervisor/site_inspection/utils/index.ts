/**
 * Site Inspection Utilities
 * Barrel export for validation and formatting utilities
 */

export {
  validateInspection,
  validateFollowUp,
  validateAll,
} from './inspectionValidation';

export type { ValidationResult } from './inspectionValidation';

export {
  getInspectionTypeColor,
  getRatingColor,
  formatDate,
  formatShortDate,
  formatTime,
  getInspectionTypeLabel,
  getRatingLabel,
} from './inspectionFormatters';
