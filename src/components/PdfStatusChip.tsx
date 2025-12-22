import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { PdfGenerationStatus } from '../../models/DailyReportModel';

interface PdfStatusChipProps {
  status: PdfGenerationStatus;
  attempts?: number;
  onRetry?: () => void;
  size?: 'small' | 'medium';
}

export const PdfStatusChip: React.FC<PdfStatusChipProps> = ({
  status,
  attempts = 0,
  onRetry,
  size = 'small',
}) => {
  const theme = useTheme();

  const getChipProps = () => {
    // Use shorter labels for small chips to prevent clipping
    const isSmall = size === 'small';

    switch (status) {
      case 'pending':
        return {
          icon: 'clock-outline',
          color: theme.colors.tertiary,
          label: isSmall ? 'Pending' : 'PDF Pending',
          textColor: theme.colors.onTertiary,
        };
      case 'generating':
        return {
          icon: 'file-cog-outline',
          color: theme.colors.primary,
          label: isSmall ? 'Gen...' : 'Generating...',
          textColor: theme.colors.onPrimary,
        };
      case 'completed':
        return {
          icon: 'check-circle-outline',
          color: theme.colors.primaryContainer,
          label: isSmall ? 'Ready' : 'PDF Ready',
          textColor: theme.colors.onPrimaryContainer,
        };
      case 'failed':
        return {
          icon: 'alert-circle-outline',
          color: theme.colors.errorContainer,
          label: attempts >= 3
            ? (isSmall ? 'Failed' : 'PDF Failed')
            : `${attempts}/3`,
          textColor: theme.colors.onErrorContainer,
          onPress: attempts < 3 && onRetry ? onRetry : undefined,
        };
      case 'skipped':
        return {
          icon: 'cancel',
          color: theme.colors.surfaceVariant,
          label: isSmall ? 'Skip' : 'PDF Skipped',
          textColor: theme.colors.onSurfaceVariant,
        };
      default:
        return {
          icon: 'help-circle-outline',
          color: theme.colors.surfaceVariant,
          label: '?',
          textColor: theme.colors.onSurfaceVariant,
        };
    }
  };

  const chipProps = getChipProps();

  return (
    <Chip
      icon={chipProps.icon}
      mode="flat"
      style={[
        styles.chip,
        { backgroundColor: chipProps.color },
        size === 'small' && styles.chipSmall,
      ]}
      textStyle={[
        styles.chipText,
        { color: chipProps.textColor },
        size === 'small' && styles.chipTextSmall,
      ]}
      onPress={chipProps.onPress}
    >
      {chipProps.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 32,
    minWidth: 100,
  },
  chipSmall: {
    height: 32, // Match synced chip height
    minWidth: 90,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  chipTextSmall: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
});
