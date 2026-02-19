/**
 * COLORS — single source of truth for all colour values in the app.
 *
 * Usage:
 *   import { COLORS } from '../theme/colors';   // adjust path depth as needed
 *
 * Migration note:
 *   Phase 1 (this file): brand + semantic + status colours replaced.
 *   Phase 2 (future): text, surface, border greys (#333, #666, #F5F5F5 etc.)
 */

export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  PRIMARY:           COLORS.PRIMARY,   // Main purple — headers, FABs, selected state
  PRIMARY_DARK:      COLORS.PRIMARY_DARK,   // Darker purple — pressed states, borders
  PRIMARY_LIGHT:     COLORS.PRIMARY_LIGHT,   // Light purple — chip backgrounds, highlights

  // ── Semantic ───────────────────────────────────────────────────────────────
  SUCCESS:           COLORS.SUCCESS,   // Green — approved, awarded, completed
  SUCCESS_BG:        COLORS.SUCCESS_BG,   // Light green — qualified badge background
  WARNING:           COLORS.WARNING,   // Orange — under review, pending, quotes received
  WARNING_BG:        COLORS.WARNING_BG,   // Light orange — warning badge background
  ERROR:             COLORS.ERROR,   // Red — error, cancelled, disqualified
  ERROR_BG:          COLORS.ERROR_BG,   // Light red — error badge background
  INFO:              COLORS.INFO,   // Blue — issued, info, links
  INFO_BG:           COLORS.INFO_BG,   // Light blue — info badge background

  // ── Text (Phase 2 migration target) ───────────────────────────────────────
  TEXT_PRIMARY:      '#333333',
  TEXT_SECONDARY:    '#666666',
  TEXT_TERTIARY:     '#999999',
  TEXT_DISABLED:     '#BDBDBD',

  // ── Surface & Layout (Phase 2 migration target) ───────────────────────────
  BACKGROUND:        '#F5F5F5',
  SURFACE:           '#FFFFFF',
  BORDER:            '#E0E0E0',
  DIVIDER:           '#EEEEEE',

  // ── Disabled / Neutral ─────────────────────────────────────────────────────
  DISABLED:          COLORS.DISABLED,   // Grey — disabled, inactive, draft state

  // ── Status palette (RFQ · DOORS · Documents · Milestones) ─────────────────
  STATUS_DRAFT:      COLORS.DISABLED,   // Same as DISABLED — use either
  STATUS_ISSUED:     COLORS.INFO,   // Same as INFO
  STATUS_RECEIVED:   COLORS.WARNING,   // Same as WARNING
  STATUS_EVALUATED:  COLORS.STATUS_EVALUATED,   // Purple — evaluated/scored
  STATUS_AWARDED:    COLORS.SUCCESS,   // Same as SUCCESS
  STATUS_APPROVED:   COLORS.SUCCESS,   // Same as SUCCESS
  STATUS_CANCELLED:  COLORS.ERROR,   // Same as ERROR
  STATUS_CLOSED:     COLORS.STATUS_CLOSED,   // Blue-grey — archived/closed
  STATUS_ACTIVE:     COLORS.INFO,   // Same as INFO
} as const;

export type ColorKey = keyof typeof COLORS;
