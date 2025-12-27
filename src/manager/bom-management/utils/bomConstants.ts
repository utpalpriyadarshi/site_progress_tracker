/**
 * BOM Constants
 * Constant values used in BOM management
 */

/**
 * Site categories available for BOMs
 */
export const SITE_CATEGORIES = ['ROCS', 'FOCS', 'RSS', 'AMS', 'TSS', 'ASS', 'Viaduct'];

/**
 * BOM item categories
 */
export const ITEM_CATEGORIES = ['material', 'labor', 'equipment', 'subcontractor'] as const;

/**
 * BOM types
 */
export const BOM_TYPES = ['estimating', 'execution'] as const;

/**
 * BOM status colors and text colors
 */
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#9C27B0', text: '#FFFFFF' },        // Purple
  submitted: { bg: '#2196F3', text: '#FFFFFF' },    // Blue
  won: { bg: '#4CAF50', text: '#FFFFFF' },          // Green
  lost: { bg: '#F44336', text: '#FFFFFF' },         // Red
  baseline: { bg: '#FF9800', text: '#FFFFFF' },     // Orange
  active: { bg: '#4CAF50', text: '#FFFFFF' },       // Green
  closed: { bg: '#616161', text: '#FFFFFF' },       // Gray
};

/**
 * Default BOM status color
 */
export const DEFAULT_STATUS_COLOR = { bg: '#9E9E9E', text: '#FFFFFF' };
