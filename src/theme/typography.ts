/**
 * TYPOGRAPHY — shared font size and weight constants.
 *
 * Maps to Paper MD3 text variants. Use these constants in StyleSheet.create()
 * to keep type scale consistent across all roles.
 *
 * Paper MD3 variant → use case guide:
 *   variant="displayLarge/Medium/Small"  → Hero numbers, large KPIs
 *   variant="headlineLarge/Medium/Small" → Screen titles, section headers
 *   variant="titleLarge/Medium/Small"    → Card titles, drawer items
 *   variant="bodyLarge/Medium/Small"     → Body copy, list items
 *   variant="labelLarge/Medium/Small"    → Buttons, chips, captions
 *
 * When you MUST use StyleSheet (e.g. custom native views), use these constants:
 */

export const FONT_SIZE = {
  // Display
  DISPLAY: 57,
  HEADLINE_LG: 32,
  HEADLINE_MD: 28,
  HEADLINE_SM: 24,

  // Title
  TITLE_LG: 22,
  TITLE_MD: 16,
  TITLE_SM: 14,

  // Body
  BODY_LG: 16,
  BODY_MD: 14,
  BODY_SM: 12,

  // Label / Caption
  LABEL_LG: 14,
  LABEL_MD: 12,
  LABEL_SM: 11,
  CAPTION: 10,

  // KPI / numeric emphasis
  KPI_LG: 32,
  KPI_MD: 24,
  KPI_SM: 18,
} as const;

export const FONT_WEIGHT = {
  REGULAR: '400' as const,
  MEDIUM: '500' as const,
  SEMIBOLD: '600' as const,
  BOLD: '700' as const,
};

export const LINE_HEIGHT = {
  TIGHT: 18,
  NORMAL: 22,
  RELAXED: 26,
  LOOSE: 32,
} as const;
