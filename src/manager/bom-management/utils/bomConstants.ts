import { COLORS } from '../../../theme/colors';
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
  draft: { bg: COLORS.STATUS_EVALUATED, text: '#FFFFFF' },        // Purple
  submitted: { bg: COLORS.INFO, text: '#FFFFFF' },    // Blue
  won: { bg: COLORS.SUCCESS, text: '#FFFFFF' },          // Green
  lost: { bg: COLORS.ERROR, text: '#FFFFFF' },         // Red
  baseline: { bg: COLORS.WARNING, text: '#FFFFFF' },     // Orange
  active: { bg: COLORS.SUCCESS, text: '#FFFFFF' },       // Green
  closed: { bg: '#616161', text: '#FFFFFF' },       // Gray
};

/**
 * Default BOM status color
 */
export const DEFAULT_STATUS_COLOR = { bg: COLORS.DISABLED, text: '#FFFFFF' };
