/**
 * Validation utilities for DOORS Package and Design RFQ management
 */

/**
 * Validates a DOORS ID format.
 * Expected format: DOORS-{CAT}-{...}-{NNN} (at least 4 segments, starts with DOORS-, ends with digits)
 * Examples: DOORS-TSS-AUX-001, DOORS-TSS-AUX-TRF-001
 */
export const validateDoorsId = (id: string): { valid: boolean; message?: string } => {
  if (!id || !id.trim()) {
    return { valid: false, message: 'DOORS ID is required' };
  }

  const trimmed = id.trim();
  const segments = trimmed.split('-');

  if (segments.length < 4) {
    return { valid: false, message: 'DOORS ID must have at least 4 segments (e.g., DOORS-TSS-AUX-001)' };
  }

  if (segments[0] !== 'DOORS') {
    return { valid: false, message: 'DOORS ID must start with "DOORS-"' };
  }

  const lastSegment = segments[segments.length - 1];
  if (!/^\d+$/.test(lastSegment)) {
    return { valid: false, message: 'DOORS ID must end with a numeric sequence (e.g., 001)' };
  }

  return { valid: true };
};

/**
 * Validates an RFQ title.
 * Must be 5-100 characters.
 */
export const validateRfqTitle = (title: string): { valid: boolean; message?: string } => {
  if (!title || !title.trim()) {
    return { valid: false, message: 'RFQ title is required' };
  }

  const trimmed = title.trim();

  if (trimmed.length < 5) {
    return { valid: false, message: 'RFQ title must be at least 5 characters' };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'RFQ title must be 100 characters or fewer' };
  }

  return { valid: true };
};

/**
 * Validates requirements count.
 * Must be 1-500.
 */
export const validateRequirementsCount = (count: number): { valid: boolean; message?: string } => {
  if (isNaN(count) || !Number.isInteger(count)) {
    return { valid: false, message: 'Requirements count must be a whole number' };
  }

  if (count < 1 || count > 500) {
    return { valid: false, message: 'Requirements count must be between 1 and 500' };
  }

  return { valid: true };
};

/**
 * Maps raw errors to user-friendly messages.
 */
export const getErrorMessage = (error: unknown, context: string): string => {
  const errorStr = error instanceof Error ? error.message : String(error);
  const lower = errorStr.toLowerCase();

  if (lower.includes('not found') || lower.includes('404')) {
    return `The ${context} could not be found. It may have been deleted.`;
  }

  if (lower.includes('duplicate') || lower.includes('unique') || lower.includes('already exists')) {
    return `A ${context} with this identifier already exists.`;
  }

  if (lower.includes('network') || lower.includes('timeout') || lower.includes('fetch')) {
    return `Network error while saving ${context}. Please check your connection and try again.`;
  }

  if (lower.includes('permission') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return `You don't have permission to modify this ${context}.`;
  }

  return `Failed to save ${context}. Please try again.`;
};
