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
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

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
  style?: any;

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
      return '#4CAF50'; // Green
    case 'in_progress':
    case 'in progress':
      return '#2196F3'; // Blue
    case 'planned':
    case 'not_started':
    case 'not started':
      return '#9E9E9E'; // Grey
    case 'delayed':
    case 'overdue':
      return '#F44336'; // Red
    case 'critical':
      return '#FF5722'; // Deep Orange
    case 'on_hold':
    case 'on hold':
    case 'paused':
      return '#FFC107'; // Amber
    case 'pending':
      return '#FF9800'; // Orange
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
 * Displays a status badge with consistent styling across all Planning screens
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'medium',
  style,
  accessibilityLabel,
}) => {
  const backgroundColor = getStatusColor(status);
  const label = formatStatusLabel(status);
  const chipStyle = size === 'small' ? styles.chipSmall : styles.chipMedium;

  return (
    <Chip
      mode="flat"
      style={[chipStyle, { backgroundColor }, style]}
      textStyle={styles.statusChipText}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Status: ${label}`}
      accessibilityRole="text"
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chipMedium: {
    height: 28,
    minWidth: 80,
  },
  chipSmall: {
    height: 24,
    minWidth: 60,
  },
  /**
   * CRITICAL: Status chip text styling
   *
   * These values MUST NOT be changed without updating CLAUDE.md
   * and all other role implementations (Supervisor, etc.)
   *
   * Requirements:
   * - color: 'white' (not '#FFF', '#FFFFFF', or other variants)
   * - fontSize: 12 (consistent size across all roles)
   * - fontWeight: 'bold' (always bold for visibility on colored backgrounds)
   */
  statusChipText: {
    color: 'white',        // CRITICAL: Always 'white' (exact string)
    fontSize: 12,          // CRITICAL: Consistent font size
    fontWeight: 'bold',    // CRITICAL: Always bold
  },
});

export default StatusBadge;
