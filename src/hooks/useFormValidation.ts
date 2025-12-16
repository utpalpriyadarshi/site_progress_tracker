/**
 * useFormValidation Hook
 *
 * Generic form validation logic for all forms across the app
 * Provides reusable validation rules and error management
 *
 * Features:
 * - Multiple validation rules (required, minLength, maxLength, pattern, custom)
 * - Field-level validation
 * - Form-level validation
 * - Error state management
 * - Type-safe validation schema
 *
 * @example
 * ```typescript
 * const { errors, validate, validateAll, clearErrors } = useFormValidation({
 *   title: { required: true, minLength: 3 },
 *   description: { required: true, minLength: 10 },
 *   quantity: {
 *     required: true,
 *     custom: (val) => Number(val) < 0 ? 'Must be positive' : null
 *   }
 * });
 *
 * // Validate single field
 * const isValid = validate('title', titleValue);
 *
 * // Validate entire form
 * const allValid = validateAll({ title, description, quantity });
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.1
 */

import { useState, useCallback } from 'react';

// ==================== Types ====================

/**
 * Validation rule configuration for a field
 */
export interface ValidationRule<T = any> {
  /** Field is required */
  required?: boolean;

  /** Minimum length for string values */
  minLength?: number;

  /** Maximum length for string values */
  maxLength?: number;

  /** Minimum value for numeric values */
  min?: number;

  /** Maximum value for numeric values */
  max?: number;

  /** Regular expression pattern to match */
  pattern?: RegExp;

  /** Custom validation function */
  custom?: (value: T) => string | null;

  /** Custom error messages */
  messages?: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
}

/**
 * Validation schema - maps field names to validation rules
 */
export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

/**
 * Validation errors - maps field names to error messages
 */
export type ValidationErrors<T extends Record<string, any>> = Partial<
  Record<keyof T, string>
>;

// ==================== Hook ====================

/**
 * useFormValidation Hook
 *
 * @param schema - Validation schema defining rules for each field
 * @returns Validation functions and error state
 */
export const useFormValidation = <T extends Record<string, any>>(
  schema: ValidationSchema<T>
) => {
  const [errors, setErrors] = useState<ValidationErrors<T>>({});

  /**
   * Get default error message for a rule
   */
  const getDefaultMessage = useCallback(
    (
      field: keyof T,
      rule: keyof ValidationRule,
      ruleValue?: any
    ): string => {
      const fieldName = String(field);

      switch (rule) {
        case 'required':
          return `${fieldName} is required`;
        case 'minLength':
          return `${fieldName} must be at least ${ruleValue} characters`;
        case 'maxLength':
          return `${fieldName} must be at most ${ruleValue} characters`;
        case 'min':
          return `${fieldName} must be at least ${ruleValue}`;
        case 'max':
          return `${fieldName} must be at most ${ruleValue}`;
        case 'pattern':
          return `${fieldName} has invalid format`;
        default:
          return `${fieldName} is invalid`;
      }
    },
    []
  );

  /**
   * Validate a single field
   *
   * @param field - Field name to validate
   * @param value - Field value to validate
   * @returns true if valid, false if invalid
   */
  const validate = useCallback(
    (field: keyof T, value: T[keyof T]): boolean => {
      const rules = schema[field];
      if (!rules) return true;

      // Check required
      if (rules.required) {
        const isEmpty =
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          const errorMsg =
            rules.messages?.required ||
            getDefaultMessage(field, 'required');
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // If field is empty and not required, it's valid
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty && !rules.required) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }

      const stringValue = String(value);
      const numericValue = Number(value);

      // Check minLength
      if (rules.minLength !== undefined) {
        if (stringValue.length < rules.minLength) {
          const errorMsg =
            rules.messages?.minLength ||
            getDefaultMessage(field, 'minLength', rules.minLength);
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // Check maxLength
      if (rules.maxLength !== undefined) {
        if (stringValue.length > rules.maxLength) {
          const errorMsg =
            rules.messages?.maxLength ||
            getDefaultMessage(field, 'maxLength', rules.maxLength);
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // Check min (numeric)
      if (rules.min !== undefined) {
        if (isNaN(numericValue) || numericValue < rules.min) {
          const errorMsg =
            rules.messages?.min ||
            getDefaultMessage(field, 'min', rules.min);
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // Check max (numeric)
      if (rules.max !== undefined) {
        if (isNaN(numericValue) || numericValue > rules.max) {
          const errorMsg =
            rules.messages?.max ||
            getDefaultMessage(field, 'max', rules.max);
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // Check pattern
      if (rules.pattern) {
        if (!rules.pattern.test(stringValue)) {
          const errorMsg =
            rules.messages?.pattern ||
            getDefaultMessage(field, 'pattern');
          setErrors(prev => ({ ...prev, [field]: errorMsg }));
          return false;
        }
      }

      // Check custom validation
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
          setErrors(prev => ({ ...prev, [field]: customError }));
          return false;
        }
      }

      // All validations passed - clear error for this field
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });

      return true;
    },
    [schema, getDefaultMessage]
  );

  /**
   * Validate all fields in the form
   *
   * @param values - Object containing all form values
   * @returns true if all fields are valid, false if any field is invalid
   */
  const validateAll = useCallback(
    (values: T): boolean => {
      let isValid = true;
      const fieldNames = Object.keys(schema) as Array<keyof T>;

      for (const field of fieldNames) {
        const fieldValid = validate(field, values[field]);
        if (!fieldValid) {
          isValid = false;
        }
      }

      return isValid;
    },
    [schema, validate]
  );

  /**
   * Clear all validation errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Set custom error for a field
   */
  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  /**
   * Check if a specific field has an error
   */
  const hasError = useCallback(
    (field: keyof T): boolean => {
      return !!errors[field];
    },
    [errors]
  );

  /**
   * Get error message for a specific field
   */
  const getError = useCallback(
    (field: keyof T): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback((): boolean => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  return {
    /** Current validation errors */
    errors,

    /** Validate a single field */
    validate,

    /** Validate all fields */
    validateAll,

    /** Clear all errors */
    clearErrors,

    /** Clear error for specific field */
    clearError,

    /** Set custom error for field */
    setError,

    /** Check if field has error */
    hasError,

    /** Get error message for field */
    getError,

    /** Check if form has any errors */
    hasErrors,
  };
};

// ==================== Common Validation Patterns ====================

/**
 * Common validation patterns for reuse
 */
export const ValidationPatterns = {
  /** Email pattern */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** Phone number (10 digits) */
  phone: /^\d{10}$/,

  /** Phone number with country code */
  phoneWithCode: /^\+?\d{10,15}$/,

  /** Alphanumeric only */
  alphanumeric: /^[a-zA-Z0-9]+$/,

  /** Alphanumeric with spaces */
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,

  /** Numbers only */
  numeric: /^\d+$/,

  /** Decimal numbers */
  decimal: /^\d+\.?\d*$/,

  /** Positive numbers */
  positiveNumber: /^[1-9]\d*$/,

  /** URL pattern */
  url: /^https?:\/\/.+/,

  /** Date (YYYY-MM-DD) */
  date: /^\d{4}-\d{2}-\d{2}$/,

  /** Time (HH:MM) */
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
};

/**
 * Common validation rules for reuse
 */
export const CommonValidations = {
  /** Required text field */
  requiredText: (minLength = 1): ValidationRule<string> => ({
    required: true,
    minLength,
    messages: {
      required: 'This field is required',
      minLength: `Must be at least ${minLength} characters`,
    },
  }),

  /** Required number field */
  requiredNumber: (min?: number, max?: number): ValidationRule<number> => ({
    required: true,
    min,
    max,
    messages: {
      required: 'This field is required',
      min: min !== undefined ? `Must be at least ${min}` : undefined,
      max: max !== undefined ? `Must be at most ${max}` : undefined,
    },
  }),

  /** Optional text field with length limits */
  optionalText: (
    minLength?: number,
    maxLength?: number
  ): ValidationRule<string> => ({
    minLength,
    maxLength,
    messages: {
      minLength:
        minLength !== undefined
          ? `Must be at least ${minLength} characters`
          : undefined,
      maxLength:
        maxLength !== undefined
          ? `Must be at most ${maxLength} characters`
          : undefined,
    },
  }),

  /** Email validation */
  email: (): ValidationRule<string> => ({
    required: true,
    pattern: ValidationPatterns.email,
    messages: {
      required: 'Email is required',
      pattern: 'Invalid email format',
    },
  }),

  /** Phone number validation */
  phone: (): ValidationRule<string> => ({
    required: true,
    pattern: ValidationPatterns.phone,
    messages: {
      required: 'Phone number is required',
      pattern: 'Invalid phone number (10 digits)',
    },
  }),

  /** Positive number validation */
  positiveNumber: (): ValidationRule<number> => ({
    required: true,
    min: 0,
    custom: val => {
      if (isNaN(Number(val))) return 'Must be a valid number';
      if (Number(val) < 0) return 'Must be a positive number';
      return null;
    },
    messages: {
      required: 'This field is required',
    },
  }),
};
