import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { TrendIndicator } from './TrendIndicator';

/**
 * CashFlowWidget Component
 *
 * Displays cash flow information with:
 * - Mini sparkline chart for cash flow trend
 * - Current balance with inflow/outflow breakdown
 * - Tap to navigate to FinancialReports screen
 * - Screen reader chart description
 *
 * @example
 * ```tsx
 * <CashFlowWidget
 *   inflow={150000}
 *   outflow={120000}
 *   netCashFlow={30000}
 *   previousNetCashFlow={25000}
 *   trendData={[10000, 15000, 12000, 20000, 18000, 30000]}
 *   onPress={() => navigation.navigate('FinancialReports')}
 * />
 * ```
 */

export interface CashFlowWidgetProps {
  /** Total inflow (revenue/payments received) */
  inflow: number;
  /** Total outflow (costs/payments made) */
  outflow: number;
  /** Net cash flow (inflow - outflow) */
  netCashFlow: number;
  /** Previous period net cash flow for trend */
  previousNetCashFlow?: number;
  /** Trend data points for sparkline (last N periods) */
  trendData?: number[];
  /** Handler for widget tap */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Period label */
  periodLabel?: string;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({
  inflow,
  outflow,
  netCashFlow,
  previousNetCashFlow,
  trendData = [],
  onPress,
  loading = false,
  error = null,
  periodLabel,
}) => {
  const isEmpty = inflow === 0 && outflow === 0;
  const isPositive = netCashFlow >= 0;

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `$${(absValue / 1000).toFixed(0)}K`;
    }
    return `$${absValue.toLocaleString()}`;
  };

  // Calculate sparkline points
  const sparklinePoints = useMemo(() => {
    if (trendData.length < 2) return null;

    const width = 100;
    const height = 30;
    const padding = 2;

    const min = Math.min(...trendData);
    const max = Math.max(...trendData);
    const range = max - min || 1;

    const points = trendData.map((value, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return { x, y, value };
    });

    return points;
  }, [trendData]);

  // Generate chart description for screen readers
  const chartDescription = useMemo(() => {
    if (!trendData.length) return '';

    const trend =
      trendData.length >= 2
        ? trendData[trendData.length - 1] > trendData[0]
          ? 'upward'
          : trendData[trendData.length - 1] < trendData[0]
            ? 'downward'
            : 'stable'
        : 'stable';

    return `Cash flow trend is ${trend} over the last ${trendData.length} periods`;
  }, [trendData]);

  const accessibilityLabel = useMemo(() => {
    const parts = [
      `Cash flow widget`,
      `Net cash flow: ${isPositive ? '' : 'negative '}${formatCurrency(netCashFlow)}`,
      `Inflow: ${formatCurrency(inflow)}`,
      `Outflow: ${formatCurrency(outflow)}`,
      chartDescription,
    ];
    return parts.filter(Boolean).join('. ');
  }, [netCashFlow, inflow, outflow, isPositive, chartDescription]);

  // Render simple sparkline using View components
  const renderSparkline = () => {
    if (!sparklinePoints || sparklinePoints.length < 2) {
      return (
        <View style={styles.noChartContainer}>
          <Text style={styles.noChartText}>No trend data</Text>
        </View>
      );
    }

    const lastPoint = sparklinePoints[sparklinePoints.length - 1];
    const isUpTrend = lastPoint.value >= sparklinePoints[0].value;

    return (
      <View
        style={styles.sparklineContainer}
        accessibilityLabel={chartDescription}
        accessibilityRole="image"
      >
        {/* Simple bar representation of trend */}
        <View style={styles.barsContainer}>
          {sparklinePoints.map((point, index) => {
            const maxHeight = 30;
            const minVal = Math.min(...trendData);
            const maxVal = Math.max(...trendData);
            const range = maxVal - minVal || 1;
            const barHeight = Math.max(4, ((point.value - minVal) / range) * maxHeight);

            return (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor:
                      index === sparklinePoints.length - 1
                        ? isUpTrend
                          ? '#4CAF50'
                          : '#ff6b6b'
                        : '#E0E0E0',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <BaseWidget
      title="Cash Flow"
      subtitle={periodLabel}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No cash flow data"
      emptyIcon="💵"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view financial reports"
    >
      <View style={styles.content}>
        {/* Net Cash Flow */}
        <View style={styles.netSection}>
          <Text style={styles.netLabel}>Net Cash Flow</Text>
          <View style={styles.netValueRow}>
            <Text style={[styles.netValue, { color: isPositive ? '#4CAF50' : '#ff6b6b' }]}>
              {isPositive ? '' : '-'}
              {formatCurrency(netCashFlow)}
            </Text>
            {previousNetCashFlow !== undefined && (
              <TrendIndicator
                value={netCashFlow}
                previousValue={previousNetCashFlow}
                format="currency"
                size="small"
                style={styles.trendIndicator}
              />
            )}
          </View>
        </View>

        {/* Sparkline */}
        {renderSparkline()}

        {/* Inflow/Outflow Breakdown */}
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.indicator, styles.inflowIndicator]} />
              <Text style={styles.breakdownLabel}>Inflow</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(inflow)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.indicator, styles.outflowIndicator]} />
              <Text style={styles.breakdownLabel}>Outflow</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(outflow)}</Text>
          </View>
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {},
  netSection: {
    marginBottom: 12,
  },
  netLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  netValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  trendIndicator: {
    marginLeft: 12,
  },
  sparklineContainer: {
    height: 40,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 30,
  },
  bar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
    minHeight: 4,
  },
  noChartContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 16,
  },
  noChartText: {
    fontSize: 11,
    color: '#999',
  },
  breakdownContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  inflowIndicator: {
    backgroundColor: '#4CAF50',
  },
  outflowIndicator: {
    backgroundColor: '#ff6b6b',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
