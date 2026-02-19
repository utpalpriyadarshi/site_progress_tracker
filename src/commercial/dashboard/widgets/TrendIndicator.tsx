import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * TrendIndicator Component
 *
 * Shows trend direction with percentage change:
 * - Up arrow (green) for positive trends
 * - Down arrow (red) for negative trends
 * - Neutral indicator for no change
 * - Accessibility announcements for screen readers
 *
 * @example
 * ```tsx
 * // Standard trend (up is good)
 * <TrendIndicator value={15000} previousValue={12000} format="currency" />
 *
 * // Inverted trend (down is good, e.g., costs)
 * <TrendIndicator value={8000} previousValue={10000} format="currency" invertColors />
 * ```
 */

export type TrendFormat = 'percentage' | 'currency' | 'number';

export interface TrendIndicatorProps {
  /** Current value */
  value: number;
  /** Previous period value for comparison */
  previousValue: number;
  /** Format for displaying the change */
  format?: TrendFormat;
  /** Invert colors (for costs where down is good) */
  invertColors?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional styles */
  style?: ViewStyle;
  /** Show the actual change value alongside percentage */
  showChangeValue?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  previousValue,
  format = 'percentage',
  invertColors = false,
  size = 'medium',
  style,
  showChangeValue = false,
}) => {
  const { percentChange, absoluteChange, direction, isNeutral } = useMemo(() => {
    const change = value - previousValue;
    const percent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    // Consider changes less than 0.1% as neutral
    const neutral = Math.abs(percent) < 0.1;
    const dir = neutral ? 'neutral' : change > 0 ? 'up' : 'down';

    return {
      percentChange: percent,
      absoluteChange: change,
      direction: dir,
      isNeutral: neutral,
    };
  }, [value, previousValue]);

  const isPositive = direction === 'up';
  const isNegative = direction === 'down';

  // Determine color based on direction and invertColors
  const getColor = () => {
    if (isNeutral) return '#999';

    if (invertColors) {
      // For costs: down is green, up is red
      return isPositive ? '#ff6b6b' : COLORS.SUCCESS;
    }
    // Standard: up is green, down is red
    return isPositive ? COLORS.SUCCESS : '#ff6b6b';
  };

  const getArrow = () => {
    if (isNeutral) return '→';
    return isPositive ? '↑' : '↓';
  };

  const formatValue = (val: number): string => {
    const absVal = Math.abs(val);
    switch (format) {
      case 'currency':
        return `$${absVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${absVal.toFixed(1)}%`;
      case 'number':
      default:
        return absVal.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
  };

  const getAccessibilityLabel = (): string => {
    if (isNeutral) {
      return 'No significant change from previous period';
    }

    const directionText = isPositive ? 'increased' : 'decreased';
    const percentText = `${Math.abs(percentChange).toFixed(1)} percent`;
    const goodBad = invertColors
      ? isPositive
        ? 'which is unfavorable'
        : 'which is favorable'
      : isPositive
        ? 'which is favorable'
        : 'which is unfavorable';

    return `${directionText} by ${percentText} ${goodBad}`;
  };

  const sizeStyles = {
    small: { arrow: 12, text: 11 },
    medium: { arrow: 14, text: 13 },
    large: { arrow: 18, text: 16 },
  };

  const currentSize = sizeStyles[size];
  const color = getColor();

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityRole="text"
    >
      <Text style={[styles.arrow, { color, fontSize: currentSize.arrow }]}>
        {getArrow()}
      </Text>
      <Text style={[styles.percentText, { color, fontSize: currentSize.text }]}>
        {Math.abs(percentChange).toFixed(1)}%
      </Text>
      {showChangeValue && !isNeutral && (
        <Text style={[styles.changeValue, { color, fontSize: currentSize.text - 2 }]}>
          ({isPositive ? '+' : '-'}{formatValue(absoluteChange)})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontWeight: 'bold',
    marginRight: 2,
  },
  percentText: {
    fontWeight: '600',
  },
  changeValue: {
    marginLeft: 4,
    opacity: 0.8,
  },
});
