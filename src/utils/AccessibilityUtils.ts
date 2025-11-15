/**
 * Accessibility Utilities
 *
 * Provides accessibility helpers for screen readers, keyboard navigation,
 * and WCAG compliance.
 *
 * Week 9 - Performance & Polish
 */

// ============================================================================
// ARIA Labels
// ============================================================================

/**
 * Generate accessible label for status badges
 */
export function getStatusAccessibilityLabel(status: string, context?: string): string {
  const statusLabels: Record<string, string> = {
    pending: 'Pending status',
    in_progress: 'In progress',
    completed: 'Completed',
    approved: 'Approved',
    rejected: 'Rejected',
    critical: 'Critical priority',
    high: 'High priority',
    medium: 'Medium priority',
    low: 'Low priority',
    on_time: 'On time',
    at_risk: 'At risk',
    delayed: 'Delayed',
    overdue: 'Overdue',
  };

  const label = statusLabels[status.toLowerCase()] || status;
  return context ? `${context}: ${label}` : label;
}

/**
 * Generate accessible label for progress indicators
 */
export function getProgressAccessibilityLabel(
  current: number,
  total: number,
  label?: string
): string {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const baseLabel = label || 'Progress';
  return `${baseLabel}: ${current} of ${total}, ${percentage} percent complete`;
}

/**
 * Generate accessible label for dates
 */
export function getDateAccessibilityLabel(date: Date | string, context?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return context ? `${context}: ${formatted}` : formatted;
}

/**
 * Generate accessible label for currency
 */
export function getCurrencyAccessibilityLabel(
  amount: number,
  currency: string = 'USD',
  context?: string
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  return context ? `${context}: ${formatted}` : formatted;
}

/**
 * Generate accessible label for quantity
 */
export function getQuantityAccessibilityLabel(
  quantity: number,
  unit: string,
  itemName?: string
): string {
  const unitLabel = quantity === 1 ? unit : `${unit}s`;
  const baseLabel = `${quantity} ${unitLabel}`;

  return itemName ? `${itemName}: ${baseLabel}` : baseLabel;
}

// ============================================================================
// Color Contrast Utilities
// ============================================================================

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 */
export function getRelativeLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;

  const [rs, gs, bs] = [r, g, b].map(c => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 */
export function meetsWCAGAA(foreground: string, background: string, largeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color contrast meets WCAG AAA standards
 */
export function meetsWCAGAAA(foreground: string, background: string, largeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get text color (black or white) based on background for best contrast
 */
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);

  if (!rgb) {
    return '#000000';
  }

  const luminance = getRelativeLuminance(rgb);
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Generate keyboard hint for screen readers
 */
export function getKeyboardHint(action: string): string {
  const hints: Record<string, string> = {
    tap: 'Double tap to activate',
    select: 'Double tap to select',
    edit: 'Double tap to edit',
    delete: 'Double tap to delete',
    expand: 'Double tap to expand',
    collapse: 'Double tap to collapse',
    navigate: 'Double tap to navigate',
    open: 'Double tap to open',
    close: 'Double tap to close',
    submit: 'Double tap to submit',
    cancel: 'Double tap to cancel',
  };

  return hints[action.toLowerCase()] || 'Double tap to activate';
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Focus priorities for navigation
 */
export enum FocusPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Get accessibility importance level
 */
export function getAccessibilityImportance(
  priority: FocusPriority
): 'no-hide-descendants' | 'yes' | 'no' | 'auto' {
  switch (priority) {
    case FocusPriority.CRITICAL:
      return 'yes';
    case FocusPriority.HIGH:
      return 'yes';
    case FocusPriority.MEDIUM:
      return 'auto';
    case FocusPriority.LOW:
      return 'no';
    default:
      return 'auto';
  }
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

/**
 * Format list for screen reader
 */
export function formatListForScreenReader(items: string[], connector: string = 'and'): string {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} ${connector} ${items[1]}`;
  }

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);

  return `${otherItems.join(', ')}, ${connector} ${lastItem}`;
}

/**
 * Generate announcement for data update
 */
export function getDataUpdateAnnouncement(
  itemType: string,
  action: 'added' | 'updated' | 'deleted',
  count: number = 1
): string {
  const itemLabel = count === 1 ? itemType : `${itemType}s`;

  switch (action) {
    case 'added':
      return `${count} ${itemLabel} added`;
    case 'updated':
      return `${count} ${itemLabel} updated`;
    case 'deleted':
      return `${count} ${itemLabel} deleted`;
    default:
      return `${count} ${itemLabel} changed`;
  }
}

/**
 * Generate announcement for loading state
 */
export function getLoadingAnnouncement(
  isLoading: boolean,
  context?: string
): string {
  const prefix = context || 'Content';
  return isLoading ? `${prefix} loading` : `${prefix} loaded`;
}

/**
 * Generate announcement for error state
 */
export function getErrorAnnouncement(
  error: string | Error,
  context?: string
): string {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return context ? `Error in ${context}: ${errorMessage}` : `Error: ${errorMessage}`;
}

// ============================================================================
// Form Accessibility
// ============================================================================

/**
 * Generate accessible label for form field
 */
export function getFormFieldLabel(
  fieldName: string,
  required: boolean = false,
  error?: string
): {
  label: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
} {
  const baseLabel = fieldName.replace(/([A-Z])/g, ' $1').trim();
  const formattedLabel = baseLabel.charAt(0).toUpperCase() + baseLabel.slice(1);

  let accessibilityLabel = formattedLabel;
  if (required) {
    accessibilityLabel += ', required';
  }

  let accessibilityHint: string | undefined;
  if (error) {
    accessibilityHint = `Error: ${error}`;
  }

  return {
    label: formattedLabel + (required ? ' *' : ''),
    accessibilityLabel,
    accessibilityHint,
  };
}

/**
 * Generate accessible validation message
 */
export function getValidationMessage(
  fieldName: string,
  validationType: 'required' | 'invalid' | 'min' | 'max' | 'pattern',
  value?: any
): string {
  const messages: Record<string, string> = {
    required: `${fieldName} is required`,
    invalid: `${fieldName} is invalid`,
    min: `${fieldName} must be at least ${value}`,
    max: `${fieldName} must be at most ${value}`,
    pattern: `${fieldName} format is incorrect`,
  };

  return messages[validationType] || `${fieldName} validation failed`;
}

// ============================================================================
// Table Accessibility
// ============================================================================

/**
 * Generate accessible table cell description
 */
export function getTableCellAccessibilityLabel(
  value: any,
  columnName: string,
  rowIndex?: number
): string {
  let label = `${columnName}: ${value}`;

  if (rowIndex !== undefined) {
    label = `Row ${rowIndex + 1}, ${label}`;
  }

  return label;
}

/**
 * Generate accessible table summary
 */
export function getTableSummary(
  totalRows: number,
  totalColumns: number,
  title?: string
): string {
  const baseLabel = `Table with ${totalRows} rows and ${totalColumns} columns`;
  return title ? `${title}, ${baseLabel}` : baseLabel;
}

// ============================================================================
// Navigation Accessibility
// ============================================================================

/**
 * Generate accessible navigation announcement
 */
export function getNavigationAnnouncement(
  screenName: string,
  position?: { current: number; total: number }
): string {
  let announcement = `Navigated to ${screenName}`;

  if (position) {
    announcement += `, screen ${position.current} of ${position.total}`;
  }

  return announcement;
}

/**
 * Generate accessible breadcrumb
 */
export function getBreadcrumbAccessibilityLabel(
  items: string[],
  currentIndex: number
): string {
  const path = items.slice(0, currentIndex + 1).join(', then ');
  return `Navigation path: ${path}`;
}

// ============================================================================
// Alert Accessibility
// ============================================================================

/**
 * Generate accessible alert message
 */
export function getAlertAccessibilityLabel(
  severity: 'info' | 'success' | 'warning' | 'error',
  message: string
): string {
  const severityLabels = {
    info: 'Information',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  };

  return `${severityLabels[severity]}: ${message}`;
}

// ============================================================================
// Export
// ============================================================================

export default {
  getStatusAccessibilityLabel,
  getProgressAccessibilityLabel,
  getDateAccessibilityLabel,
  getCurrencyAccessibilityLabel,
  getQuantityAccessibilityLabel,
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getContrastTextColor,
  getKeyboardHint,
  getAccessibilityImportance,
  formatListForScreenReader,
  getDataUpdateAnnouncement,
  getLoadingAnnouncement,
  getErrorAnnouncement,
  getFormFieldLabel,
  getValidationMessage,
  getTableCellAccessibilityLabel,
  getTableSummary,
  getNavigationAnnouncement,
  getBreadcrumbAccessibilityLabel,
  getAlertAccessibilityLabel,
  FocusPriority,
};
