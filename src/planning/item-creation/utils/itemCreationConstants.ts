/**
 * Default values for item creation form
 */
export const DEFAULT_FORM_VALUES = {
  PHASE: 'design' as const,
  DURATION_DAYS: 30,
  UNIT: 'Set',
  QUANTITY: '1',
  COMPLETED_QUANTITY: '0',
  WEIGHTAGE: '0',
  FLOAT_DAYS: '0',
  DEPENDENCY_RISK: 'low' as const,
};

/**
 * Form field labels
 */
export const FIELD_LABELS = {
  WBS_CODE: 'WBS Code (Auto-generated)',
  ITEM_DETAILS: 'Item Details',
  ITEM_NAME: 'Item Name *',
  CATEGORY: 'Category *',
  PHASE: 'Project Phase *',
  SCHEDULE: 'Schedule',
  START_DATE: 'Start Date *',
  END_DATE: 'End Date *',
  DURATION: 'Duration (days) *',
  QUANTITY_PROGRESS: 'Quantity & Progress',
  PLANNED_QUANTITY: 'Planned Quantity *',
  COMPLETED_QUANTITY: 'Completed Quantity',
  UNIT: 'Unit of Measurement',
  WEIGHTAGE: 'Weightage (%)',
  CRITICAL_PATH_RISK: 'Critical Path & Risk',
  FLOAT_DAYS: 'Float Days',
  DEPENDENCY_RISK: 'Dependency Risk',
  RISK_NOTES: 'Risk Notes',
};

/**
 * Validation error messages
 */
export const ERROR_MESSAGES = {
  NAME_REQUIRED: 'Item name is required',
  CATEGORY_REQUIRED: 'Category is required',
  DURATION_INVALID: 'Duration must be greater than 0',
  QUANTITY_INVALID: 'Quantity must be greater than 0',
};

/**
 * Success/Error messages
 */
export const MESSAGES = {
  CREATE_SUCCESS: 'WBS item created successfully',
  CREATE_ERROR: 'Failed to create item. Please try again.',
  CODE_GENERATION_ERROR: 'Failed to generate WBS code',
};

/**
 * Helper text
 */
export const HELPER_TEXT = {
  DURATION_AUTO_CALC: 'Duration auto-calculates based on start and end dates',
  ROOT_LEVEL: 'This will be a root-level item (Level 1)',
  CHILD_LEVEL: (level: number) => `This will be a child item (Level ${level})`,
  CHILD_OF: (code: string) => `Child of: ${code}`,
  RISK_PLACEHOLDER: 'Describe the risk and mitigation plan',
};
