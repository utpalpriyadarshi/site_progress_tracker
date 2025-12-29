/**
 * Item Edit Constants
 *
 * Default values and field configurations for item editing
 */

import { FormData } from '../hooks/useItemForm';

/**
 * Default form data values
 */
export const DEFAULT_FORM_DATA: FormData = {
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
};

/**
 * Default unit of measurement
 */
export const DEFAULT_UNIT = 'Set';

/**
 * Default duration in days
 */
export const DEFAULT_DURATION_DAYS = 30;

/**
 * Minimum duration in days
 */
export const MIN_DURATION_DAYS = 1;

/**
 * Default float days for non-critical path items
 */
export const DEFAULT_FLOAT_DAYS = 0;

/**
 * Available dependency risk levels
 */
export const RISK_LEVELS = ['low', 'medium', 'high'] as const;

/**
 * Default dependency risk level
 */
export const DEFAULT_RISK_LEVEL = 'low';

/**
 * Snackbar display duration (ms)
 */
export const SNACKBAR_DURATION = 3000;

/**
 * Navigation delay after successful save (ms)
 */
export const NAVIGATION_DELAY = 1500;

/**
 * Loading text messages
 */
export const LOADING_MESSAGES = {
  LOADING_ITEM: 'Loading item...',
  SAVING_ITEM: 'Saving...',
  ITEM_NOT_FOUND: 'Item not found',
};

/**
 * Success/Error messages
 */
export const MESSAGES = {
  SUCCESS_UPDATE: 'Item updated successfully',
  ERROR_NO_ITEM_ID: 'Error: No item ID provided',
  ERROR_LOAD_FAILED: 'Failed to load item data',
  ERROR_UPDATE_FAILED: 'Failed to update item. Please try again.',
};

/**
 * Helper text messages
 */
export const HELPER_TEXT = {
  WBS_CODE_READ_ONLY: (level: number) => `WBS codes cannot be changed after creation (Level ${level})`,
  DURATION_AUTO_CALC: 'Duration auto-calculates based on start and end dates',
  LOCKED_BANNER: 'This item is baseline-locked and cannot be edited. You can only view the details.',
};
