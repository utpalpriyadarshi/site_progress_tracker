/**
 * Item Edit Validation
 *
 * Validation rules and error messages for item editing
 */

import { FormData } from '../hooks/useItemForm';

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  NAME_REQUIRED: 'Item name is required',
  CATEGORY_REQUIRED: 'Category is required',
  DURATION_REQUIRED: 'Duration must be greater than 0',
  QUANTITY_REQUIRED: 'Quantity must be greater than 0',
  INVALID_NUMBER: 'Must be a valid positive number',
  START_DATE_REQUIRED: 'Start date is required',
  END_DATE_REQUIRED: 'End date is required',
  END_DATE_BEFORE_START: 'End date must be after start date',
};

/**
 * Validate item name
 */
export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return VALIDATION_ERRORS.NAME_REQUIRED;
  }
  return null;
};

/**
 * Validate category ID
 */
export const validateCategory = (categoryId: string): string | null => {
  if (!categoryId) {
    return VALIDATION_ERRORS.CATEGORY_REQUIRED;
  }
  return null;
};

/**
 * Validate duration
 */
export const validateDuration = (duration: string): string | null => {
  if (!duration || parseFloat(duration) <= 0) {
    return VALIDATION_ERRORS.DURATION_REQUIRED;
  }
  return null;
};

/**
 * Validate quantity
 */
export const validateQuantity = (quantity: string): string | null => {
  if (!quantity || parseFloat(quantity) <= 0) {
    return VALIDATION_ERRORS.QUANTITY_REQUIRED;
  }
  return null;
};

/**
 * Validate that value is a positive number
 */
export const validatePositiveNumber = (value: string): boolean => {
  if (value === '') return true; // Allow empty for optional fields
  return /^\d+$/.test(value);
};

/**
 * Validate dates
 */
export const validateDates = (startDate: Date, endDate: Date): string | null => {
  if (endDate.getTime() <= startDate.getTime()) {
    return VALIDATION_ERRORS.END_DATE_BEFORE_START;
  }
  return null;
};

/**
 * Validate entire form
 * Returns object with field errors
 */
export const validateFormData = (formData: FormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Validate name
  const nameError = validateName(formData.name);
  if (nameError) errors.name = nameError;

  // Validate category
  const categoryError = validateCategory(formData.categoryId);
  if (categoryError) errors.categoryId = categoryError;

  // Validate duration
  const durationError = validateDuration(formData.duration);
  if (durationError) errors.duration = durationError;

  // Validate quantity
  const quantityError = validateQuantity(formData.quantity);
  if (quantityError) errors.quantity = quantityError;

  // Validate dates
  const dateError = validateDates(formData.startDate, formData.endDate);
  if (dateError) errors.endDate = dateError;

  return errors;
};

/**
 * Check if form has any errors
 */
export const hasFormErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};
