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
  PRIMARY:           '#673AB7',   // Main purple — headers, FABs, selected state
  PRIMARY_DARK:      '#4527A0',   // Darker purple — pressed states, borders
  PRIMARY_LIGHT:     '#E8D5F2',   // Light purple — chip backgrounds, highlights

  // ── Semantic ───────────────────────────────────────────────────────────────
  SUCCESS:           '#4CAF50',   // Green — approved, awarded, completed
  SUCCESS_BG:        '#E8F5E9',   // Light green — qualified badge background
  WARNING:           '#FF9800',   // Orange — under review, pending, quotes received
  WARNING_BG:        '#FFF3E0',   // Light orange — warning badge background
  ERROR:             '#F44336',   // Red — error, cancelled, disqualified
  ERROR_BG:          '#FFEBEE',   // Light red — error badge background
  INFO:              '#2196F3',   // Blue — issued, info, links
  INFO_BG:           '#E3F2FD',   // Light blue — info badge background

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
  DISABLED:          '#9E9E9E',   // Grey — disabled, inactive, draft state

  // ── Status palette (RFQ · DOORS · Documents · Milestones) ─────────────────
  STATUS_DRAFT:      '#9E9E9E',   // Grey — draft state
  STATUS_ISSUED:     '#2196F3',   // Blue — issued
  STATUS_RECEIVED:   '#FF9800',   // Orange — received/pending review
  STATUS_EVALUATED:  '#9C27B0',   // Purple — evaluated/scored
  STATUS_AWARDED:    '#4CAF50',   // Green — awarded
  STATUS_APPROVED:   '#4CAF50',   // Green — approved
  STATUS_CANCELLED:  '#F44336',   // Red — cancelled
  STATUS_CLOSED:     '#607D8B',   // Blue-grey — archived/closed
  STATUS_ACTIVE:     '#2196F3',   // Blue — active
} as const;

export type ColorKey = keyof typeof COLORS;
