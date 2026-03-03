import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { TrendIndicator } from './TrendIndicator';
import {
  InteractiveChart,
  ChartDataPoint,
  ChartRenderProps,
  TooltipRenderProps,
  chartOptionMenus,
  OptionsMenuItem,
} from './InteractiveChart';
import { COLORS } from '../../../theme/colors';
import { formatCurrencySmart } from '../../../utils/currencyFormatter';

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
  /** Labels for each trend data point (e.g., month names) */
  trendLabels?: string[];
  /** Handler for widget tap */
  onPress?: () => void;
  /** Handler for trend data point tap */
  onTrendPointPress?: (value: number, index: number) => void;
  /** Handler for export data action from options menu */
  onExportData?: () => void;
  /** Enable interactive chart features */
  interactive?: boolean;
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
  trendLabels,
  onPress,
  onTrendPointPress,
  onExportData,
  interactive = true,
  loading = false,
  error = null,
  periodLabel,
}) => {
  const isEmpty = inflow === 0 && outflow === 0;
  const isPositive = netCashFlow >= 0;
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

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
      `Net cash flow: ${isPositive ? '' : 'negative '}${formatCurrencySmart(netCashFlow)}`,
      `Inflow: ${formatCurrencySmart(inflow)}`,
      `Outflow: ${formatCurrencySmart(outflow)}`,
      chartDescription,
    ];
    return parts.filter(Boolean).join('. ');
  }, [netCashFlow, inflow, outflow, isPositive, chartDescription]);

  // Default period labels if not provided
  const defaultLabels = useMemo(() => {
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    return trendLabels || labels.slice(0, trendData.length);
  }, [trendLabels, trendData.length]);

  // Convert trend data to ChartDataPoint format for InteractiveChart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return trendData.map((value, index) => ({
      id: `trend-${index}`,
      label: defaultLabels[index] || `Period ${index + 1}`,
      value,
      metadata: {
        index,
        isLastPoint: index === trendData.length - 1,
      },
    }));
  }, [trendData, defaultLabels]);

  // Handle trend point selection
  const handleTrendPointPress = useCallback(
    (item: ChartDataPoint, index: number) => {
      setSelectedBarIndex(index);
      onTrendPointPress?.(item.value, index);
    },
    [onTrendPointPress]
  );

  // Options menu items for long press
  const optionsMenuItems: OptionsMenuItem[] = useMemo(() => {
    const items: OptionsMenuItem[] = [
      chartOptionMenus.viewDetails(() => {
        // View details action
      }),
    ];
    if (onExportData) {
      items.push(chartOptionMenus.exportData(onExportData));
    }
    return items;
  }, [onExportData]);

  // Render interactive sparkline chart
  const renderInteractiveChart = useCallback(
    ({ data, selectedIndex }: ChartRenderProps<ChartDataPoint>) => {
      const maxHeight = 30;
      const minVal = Math.min(...trendData);
      const maxVal = Math.max(...trendData);
      const range = maxVal - minVal || 1;
      const lastPointIndex = data.length - 1;
      const isUpTrend = data.length >= 2 && data[lastPointIndex].value >= data[0].value;

      return (
        <View style={styles.barsContainer}>
          {data.map((point, index) => {
            const barHeight = Math.max(4, ((point.value - minVal) / range) * maxHeight);
            const isSelected = selectedIndex === index;
            const isLastPoint = index === lastPointIndex;

            const barColor = isSelected
              ? '#007AFF'
              : isLastPoint
                ? isUpTrend
                  ? COLORS.SUCCESS
                  : '#ff6b6b'
                : '#E0E0E0';

            return (
              <TouchableOpacity
                key={point.id}
                onPress={(event) => {
                  handleTrendPointPress(point, index);
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${point.label}: ${formatCurrencySmart(point.value)}`}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: barColor,
                      opacity: isSelected ? 1 : 0.85,
                      transform: isSelected ? [{ scaleY: 1.1 }] : [],
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      );
    },
    [trendData, handleTrendPointPress]
  );

  // Render tooltip content
  const renderTooltip = useCallback(
    ({ item, onClose }: TooltipRenderProps) => (
      <View style={styles.tooltipContent}>
        <View style={styles.tooltipHeader}>
          <Text style={styles.tooltipLabel}>{item.label}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.tooltipClose}>×</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.tooltipValue, { color: item.value >= 0 ? COLORS.SUCCESS : '#ff6b6b' }]}>
          {item.value >= 0 ? '' : '-'}{formatCurrencySmart(item.value)}
        </Text>
      </View>
    ),
    []
  );

  // Render simple sparkline using View components (non-interactive fallback)
  const renderSparkline = () => {
    if (!sparklinePoints || sparklinePoints.length < 2) {
      return (
        <View style={styles.noChartContainer}>
          <Text style={styles.noChartText}>No trend data</Text>
        </View>
      );
    }

    // Use interactive chart when enabled
    if (interactive && chartData.length >= 2) {
      return (
        <View style={styles.sparklineContainer}>
          <InteractiveChart
            data={chartData}
            renderChart={renderInteractiveChart}
            renderTooltip={renderTooltip}
            onDataPointPress={handleTrendPointPress}
            optionsMenuItems={optionsMenuItems}
            enableZoom={false}
            enablePan={false}
            height={40}
            accessibilityLabel={chartDescription}
            formatValueForAccessibility={(v) => formatCurrencySmart(v)}
            showAccessibleDataTable={false}
          />
        </View>
      );
    }

    // Fallback to simple non-interactive sparkline
    const lastPoint = sparklinePoints[sparklinePoints.length - 1];
    const isUpTrend = lastPoint.value >= sparklinePoints[0].value;

    return (
      <View
        style={styles.sparklineContainer}
        accessibilityLabel={chartDescription}
        accessibilityRole="image"
      >
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
                          ? COLORS.SUCCESS
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
            <Text style={[styles.netValue, { color: isPositive ? COLORS.SUCCESS : '#ff6b6b' }]}>
              {isPositive ? '' : '-'}
              {formatCurrencySmart(netCashFlow)}
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
            <Text style={styles.breakdownValue}>{formatCurrencySmart(inflow)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <View style={[styles.indicator, styles.outflowIndicator]} />
              <Text style={styles.breakdownLabel}>Outflow</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrencySmart(outflow)}</Text>
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
    backgroundColor: COLORS.SUCCESS,
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
  // Tooltip styles for interactive chart
  tooltipContent: {
    minWidth: 120,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  tooltipClose: {
    fontSize: 20,
    color: '#999',
    paddingLeft: 8,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
