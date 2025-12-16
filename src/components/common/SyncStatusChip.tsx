/**
 * SyncStatusChip Component
 *
 * Displays sync status with color-coded visual indicator
 * Used across screens to show pending/synced/error states
 *
 * Features:
 * - Color-coded status indicators
 * - Icon support
 * - Optional tap action
 * - Compact size
 * - Consistent styling
 *
 * @example
 * ```tsx
 * <SyncStatusChip
 *   status="pending"
 *   onPress={() => showSyncDetails()}
 * />
 *
 * <SyncStatusChip
 *   status="synced"
 *   count={5}
 *   label="Synced"
 * />
 * ```
 *
 * @version 1.0 - Phase 2, Task 2.2.4
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

// ==================== Types ====================

/**
 * Sync status types
 */
export type SyncStatusType = 'pending' | 'synced' | 'error' | 'syncing';

export interface SyncStatusChipProps {
  /** Current sync status */
  status: SyncStatusType;

  /** Optional callback when chip is pressed */
  onPress?: () => void;

  /** Optional count to display */
  count?: number;

  /** Custom label (overrides default status text) */
  label?: string;

  /** Show compact version (icon only) */
  compact?: boolean;
}

// ==================== Status Configuration ====================

const STATUS_CONFIG: Record<
  SyncStatusType,
  {
    icon: string;
    color: string;
    textColor: string;
    defaultLabel: string;
  }
> = {
  pending: {
    icon: 'clock-outline',
    color: '#FF9800',
    textColor: '#F57C00',
    defaultLabel: 'Pending',
  },
  synced: {
    icon: 'check-circle',
    color: '#4CAF50',
    textColor: '#388E3C',
    defaultLabel: 'Synced',
  },
  error: {
    icon: 'alert-circle',
    color: '#F44336',
    textColor: '#D32F2F',
    defaultLabel: 'Error',
  },
  syncing: {
    icon: 'sync',
    color: '#2196F3',
    textColor: '#1976D2',
    defaultLabel: 'Syncing',
  },
};

// ==================== Component ====================

/**
 * SyncStatusChip Component
 */
export const SyncStatusChip: React.FC<SyncStatusChipProps> = ({
  status,
  onPress,
  count,
  label,
  compact = false,
}) => {
  const config = STATUS_CONFIG[status];

  // Build label text
  const displayLabel = compact
    ? ''
    : label || (count !== undefined ? `${count} ${config.defaultLabel}` : config.defaultLabel);

  return (
    <Chip
      icon={config.icon}
      mode="outlined"
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: config.color,
          backgroundColor: `${config.color}28`, // 28 = ~15% opacity in hex (improved outdoor readability)
        },
      ]}
      textStyle={[styles.text, { color: config.textColor }]}
      compact={compact}
    >
      {displayLabel}
    </Chip>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
