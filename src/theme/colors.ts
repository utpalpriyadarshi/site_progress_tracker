/**
 * COLORS — single source of truth for all colour values in the app.
 *
 * Usage:
 *   import { COLORS } from '../theme/colors';   // adjust path depth as needed
 *
 * All StyleSheet values must use COLORS constants — no hardcoded hex anywhere.
 * Migration status tracked in UI_UX_UNIFORMITY_PLAN.md (ISSUE-12/13).
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

  // ── Text ──────────────────────────────────────────────────────────────────
  TEXT_PRIMARY:      '#333333',
  TEXT_SECONDARY:    '#666666',
  TEXT_TERTIARY:     '#999999',
  TEXT_DISABLED:     '#BDBDBD',

  // ── Surface & Layout ──────────────────────────────────────────────────────
  BACKGROUND:        '#F5F5F5',
  SURFACE:           '#FFFFFF',
  BORDER:            '#E0E0E0',
  DIVIDER:           '#EEEEEE',

  // ── Disabled / Neutral ─────────────────────────────────────────────────────
  DISABLED:          '#9E9E9E',   // Grey — disabled, inactive, draft state

  // ── Extended palette (replaces iOS/Tailwind one-offs) ─────────────────────
  // Use these instead of #007AFF, #1976D2, #3B82F6 — one blue for secondary actions
  BLUE_SECONDARY:    '#1976D2',
  // Use instead of #10B981, #34C759 — one accent green for healthy/good status
  GREEN_ACCENT:      '#10B981',
  GREEN_ACCENT_BG:   '#D1FAE5',
  // Use instead of #F59E0B, #FF9500 — one amber for caution/at-risk
  AMBER_CAUTION:     '#F59E0B',
  AMBER_CAUTION_BG:  '#FEF3C7',
  // Use instead of #00BCD4 — cyan for info/active indicators
  CYAN_INFO:         '#00BCD4',
  CYAN_INFO_BG:      '#E0F7FA',
  // Use instead of #8B5CF6 — violet for category chips / priority
  PURPLE_ACCENT:     '#8B5CF6',
  PURPLE_ACCENT_BG:  '#EDE9FE',
  // Blue-grey for archived/closed states
  BLUE_GREY:         '#607D8B',
  BLUE_GREY_BG:      '#ECEFF1',

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
