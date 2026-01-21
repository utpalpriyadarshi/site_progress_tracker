import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

/**
 * PeriodSelector Component
 *
 * Allows switching between time periods:
 * - MTD (Month to Date)
 * - QTD (Quarter to Date)
 * - YTD (Year to Date)
 * - Custom date range
 *
 * @example
 * ```tsx
 * const [period, setPeriod] = useState<Period>('mtd');
 *
 * <PeriodSelector
 *   selectedPeriod={period}
 *   onPeriodChange={setPeriod}
 * />
 * ```
 */

export type Period = 'mtd' | 'qtd' | 'ytd' | 'custom';

export interface PeriodOption {
  key: Period;
  label: string;
  shortLabel: string;
}

export interface PeriodSelectorProps {
  /** Currently selected period */
  selectedPeriod: Period;
  /** Callback when period changes */
  onPeriodChange: (period: Period) => void;
  /** Whether to show custom period option */
  showCustom?: boolean;
  /** Callback when custom period is selected (to open date picker) */
  onCustomPress?: () => void;
  /** Custom date range label (when custom is selected) */
  customLabel?: string;
  /** Size variant */
  size?: 'compact' | 'regular';
  /** Additional styles */
  style?: ViewStyle;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'mtd', label: 'Month to Date', shortLabel: 'MTD' },
  { key: 'qtd', label: 'Quarter to Date', shortLabel: 'QTD' },
  { key: 'ytd', label: 'Year to Date', shortLabel: 'YTD' },
  { key: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  showCustom = true,
  onCustomPress,
  customLabel,
  size = 'regular',
  style,
}) => {
  const options = showCustom
    ? PERIOD_OPTIONS
    : PERIOD_OPTIONS.filter((opt) => opt.key !== 'custom');

  const handlePeriodPress = (period: Period) => {
    if (period === 'custom' && onCustomPress) {
      onCustomPress();
    }
    onPeriodChange(period);
  };

  const isCompact = size === 'compact';

  return (
    <View
      style={[styles.container, isCompact && styles.containerCompact, style]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Select time period"
    >
      {options.map((option) => {
        const isSelected = selectedPeriod === option.key;
        const displayLabel =
          option.key === 'custom' && customLabel ? customLabel : option.shortLabel;

        return (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.option,
              isCompact && styles.optionCompact,
              isSelected && styles.optionSelected,
            ]}
            onPress={() => handlePeriodPress(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            accessibilityHint={`Select ${option.label}`}
          >
            <Text
              style={[
                styles.optionText,
                isCompact && styles.optionTextCompact,
                isSelected && styles.optionTextSelected,
              ]}
            >
              {displayLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/**
 * Helper function to calculate date range for a period
 */
export const getPeriodDateRange = (
  period: Period,
  customStart?: Date,
  customEnd?: Date
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = now;
  let startDate: Date;

  switch (period) {
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { startDate: customStart, endDate: customEnd };
      }
      // Default to last 30 days if no custom range provided
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate };
};

/**
 * Helper function to format period label
 */
export const formatPeriodLabel = (period: Period, startDate?: Date, endDate?: Date): string => {
  const option = PERIOD_OPTIONS.find((opt) => opt.key === period);

  if (period === 'custom' && startDate && endDate) {
    const formatDate = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  return option?.label || 'Month to Date';
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  containerCompact: {
    padding: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  optionSelected: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  optionTextCompact: {
    fontSize: 11,
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
