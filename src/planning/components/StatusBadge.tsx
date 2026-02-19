/**
 * StatusBadge Component
 *
 * Uniform status badge component for Planning role screens.
 * Follows CLAUDE.md uniformity requirements.
 *
 * CRITICAL STYLING REQUIREMENTS (from CLAUDE.md):
 * - color: 'white' (exact string, not '#FFF' or '#FFFFFF')
 * - fontSize: 12 (consistent across all roles)
 * - fontWeight: 'bold' (always bold for visibility)
 *
 * @see docs/implementation/PLANNING_PHASE3_IMPLEMENTATION_PLAN.md
 * @version 1.1.0
 * @since Planning Phase 3
 * @updated Fixed text clipping by using custom View+Text instead of Chip
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../theme/colors';

interface StatusBadgeProps {
  /**
   * Status value (e.g., 'completed', 'in_progress', 'planned', 'delayed', 'critical', 'on_hold')
   */
  status: string;

  /**
   * Size variant (optional)
   * @default 'medium'
   */
  size?: 'small' | 'medium';

  /**
   * Custom style override (optional)
   */
  style?: ViewStyle;

  /**
   * Accessibility label (optional, auto-generated if not provided)
   */
  accessibilityLabel?: string;
}

/**
 * Get background color for status value
 * Based on standard Planning role status color palette
 */
const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase().trim();

  switch (normalizedStatus) {
    case 'completed':
      return COLORS.SUCCESS; // Green
    case 'in_progress':
    case 'in progress':
      return COLORS.INFO; // Blue
    case 'planned':
    case 'not_started':
    case 'not started':
      return COLORS.DISABLED; // Grey
    case 'delayed':
    case 'overdue':
      return COLORS.ERROR; // Red
    case 'critical':
      return '#FF5722'; // Deep Orange
    case 'on_hold':
    case 'on hold':
    case 'paused':
      return '#FFC107'; // Amber
    case 'pending':
      return COLORS.WARNING; // Orange
    case 'approved':
      return '#8BC34A'; // Light Green
    case 'rejected':
      return '#E91E63'; // Pink
    default:
      return '#757575'; // Dark Grey (fallback)
  }
};

/**
 * Format status label for display
 * Converts snake_case to UPPERCASE with spaces
 */
const formatStatusLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .toUpperCase()
    .trim();
};

/**
 * StatusBadge Component
 *
 * Displays a status badge with consistent styling across all Planning screens.
 * Uses custom View+Text for precise control over text rendering (no clipping).
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  style,
  accessibilityLabel,
}) => {
  const backgroundColor = getStatusColor(status);
  const label = formatStatusLabel(status);
  const badgeStyle = size === 'small' ? styles.badgeSmall : styles.badgeMedium;
  const textStyle = size === 'small' ? styles.textSmall : styles.textMedium;

  return (
    <View
      style={[styles.badgeBase, badgeStyle, { backgroundColor }, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Status: ${label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.textBase, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Base badge style - common to all sizes
  badgeBase: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  // Medium size badge (default)
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 90,
    minHeight: 28,
  },
  // Small size badge
  badgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 70,
    minHeight: 24,
  },
  /**
   * CRITICAL: Status badge text styling
   *
   * These values MUST NOT be changed without updating CLAUDE.md
   * and all other role implementations (Supervisor, etc.)
   *
   * Requirements:
   * - color: 'white' (not '#FFF', '#FFFFFF', or other variants)
   * - fontSize: 12 (consistent size across all roles)
   * - fontWeight: 'bold' (always bold for visibility on colored backgrounds)
   */
  textBase: {
    color: 'white',        // CRITICAL: Always 'white' (exact string)
    fontWeight: 'bold',    // CRITICAL: Always bold
    textAlign: 'center',
  },
  textMedium: {
    fontSize: 12,          // CRITICAL: Consistent font size
  },
  textSmall: {
    fontSize: 11,          // Slightly smaller for small badges
  },
});

export default StatusBadge;
