/**
 * ChartAccessibilityProvider Component
 *
 * Provides accessible alternatives for charts:
 * - Hidden data table for screen readers
 * - Summary text description
 * - Key insights announcements
 * - Alternative text for chart images
 *
 * Usage:
 * ```tsx
 * <ChartAccessibilityProvider
 *   chartType="bar"
 *   data={chartData}
 *   title="Monthly Revenue"
 *   description="Revenue trends over the past 6 months"
 * >
 *   <BarChart data={chartData} />
 * </ChartAccessibilityProvider>
 * ```
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'sparkline';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface ChartAccessibilityProviderProps {
  chartType: ChartType;
  data: ChartDataPoint[];
  title: string;
  description?: string;
  valueFormat?: 'currency' | 'percentage' | 'number';
  currency?: string;
  showDataTable?: boolean;
  insights?: string[];
  announceOnMount?: boolean;
  children: React.ReactNode;
}

export const ChartAccessibilityProvider: React.FC<ChartAccessibilityProviderProps> = ({
  chartType,
  data,
  title,
  description,
  valueFormat = 'number',
  currency = 'USD',
  showDataTable = false,
  insights,
  announceOnMount = false,
  children,
}) => {
  const { announce, isScreenReaderEnabled } = useAccessibility();
  const [isScreenReader, setIsScreenReader] = useState(false);

  // Check if screen reader is enabled
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await isScreenReaderEnabled();
      setIsScreenReader(enabled);
    };
    checkScreenReader();

    // Subscribe to screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => setIsScreenReader(enabled)
    );

    return () => {
      subscription.remove();
    };
  }, [isScreenReaderEnabled]);

  // Calculate statistics for the data
  const statistics = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = total / values.length;
    const maxItem = data.find((d) => d.value === max);
    const minItem = data.find((d) => d.value === min);

    return {
      total,
      max,
      min,
      avg,
      maxItem,
      minItem,
      count: data.length,
    };
  }, [data]);

  // Format value based on type
  const formatValue = (value: number): string => {
    switch (valueFormat) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString('en-US');
    }
  };

  // Format value for screen reader (more natural speech)
  const formatValueForSpeech = (value: number): string => {
    switch (valueFormat) {
      case 'currency':
        const formatted = Math.abs(value);
        const prefix = value < 0 ? 'negative ' : '';
        if (formatted >= 100000) {
          return `${prefix}${(formatted / 100000).toFixed(1)} lakhs`;
        }
        return `${prefix}${formatted.toLocaleString()} ${currency === 'INR' ? 'rupees' : 'dollars'}`;
      case 'percentage':
        return `${value.toFixed(1)} percent`;
      default:
        return value.toLocaleString();
    }
  };

  // Generate chart description for screen readers
  const generateChartDescription = (): string => {
    if (!statistics) return `${title}. No data available.`;

    const chartTypeDescription = getChartTypeDescription();
    const dataDescription = generateDataDescription();
    const insightDescription = insights?.length
      ? `Key insights: ${insights.join('. ')}.`
      : '';

    return `${title}. ${chartTypeDescription} ${dataDescription} ${insightDescription}`.trim();
  };

  // Get description for chart type
  const getChartTypeDescription = (): string => {
    switch (chartType) {
      case 'bar':
        return `This is a bar chart showing ${data.length} categories.`;
      case 'line':
        return `This is a line chart showing trends across ${data.length} data points.`;
      case 'pie':
      case 'donut':
        return `This is a ${chartType} chart showing distribution across ${data.length} categories.`;
      case 'area':
        return `This is an area chart showing ${data.length} data points over time.`;
      case 'sparkline':
        return `This is a sparkline showing a trend summary.`;
      default:
        return `This chart shows ${data.length} data points.`;
    }
  };

  // Generate data description
  const generateDataDescription = (): string => {
    if (!statistics) return '';

    const parts: string[] = [];

    // Total for relevant chart types
    if (chartType === 'bar' || chartType === 'pie' || chartType === 'donut') {
      parts.push(`Total value is ${formatValueForSpeech(statistics.total)}.`);
    }

    // Highest and lowest
    if (statistics.maxItem && statistics.minItem) {
      parts.push(
        `Highest is ${statistics.maxItem.label} at ${formatValueForSpeech(statistics.max)}.`
      );
      if (statistics.maxItem.label !== statistics.minItem.label) {
        parts.push(
          `Lowest is ${statistics.minItem.label} at ${formatValueForSpeech(statistics.min)}.`
        );
      }
    }

    // Distribution for pie/donut
    if ((chartType === 'pie' || chartType === 'donut') && statistics.total > 0) {
      const topItems = [...data]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((item) => {
          const pct = ((item.value / statistics.total) * 100).toFixed(0);
          return `${item.label} at ${pct}%`;
        });
      parts.push(`Top categories: ${topItems.join(', ')}.`);
    }

    // Trend for line/area charts
    if (chartType === 'line' || chartType === 'area' || chartType === 'sparkline') {
      const firstValue = data[0]?.value ?? 0;
      const lastValue = data[data.length - 1]?.value ?? 0;
      const trend = lastValue - firstValue;
      const trendPercent = firstValue > 0 ? ((trend / firstValue) * 100).toFixed(1) : 0;

      if (trend > 0) {
        parts.push(`Shows an upward trend, increasing by ${trendPercent}%.`);
      } else if (trend < 0) {
        parts.push(`Shows a downward trend, decreasing by ${Math.abs(Number(trendPercent))}%.`);
      } else {
        parts.push(`Shows a stable trend with no significant change.`);
      }
    }

    return parts.join(' ');
  };

  // Announce chart on mount
  useEffect(() => {
    if (announceOnMount && data.length > 0) {
      const description = generateChartDescription();
      announce(description);
    }
  }, [announceOnMount, data.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render accessible data table (for screen readers)
  const renderAccessibleDataTable = () => {
    if (!isScreenReader && !showDataTable) return null;

    return (
      <View
        style={[styles.dataTable, !showDataTable && styles.srOnly]}
        accessibilityRole="none"
      >
        <Text style={styles.tableCaption}>{title} - Data Table</Text>

        {/* Header Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.headerCell]}>Category</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Value</Text>
          {(chartType === 'pie' || chartType === 'donut') && (
            <Text style={[styles.tableCell, styles.headerCell]}>Percentage</Text>
          )}
        </View>

        {/* Data Rows */}
        {data.map((item, index) => {
          const percentage =
            statistics && statistics.total > 0
              ? ((item.value / statistics.total) * 100).toFixed(1)
              : '0';

          return (
            <View
              key={`${item.label}-${index}`}
              style={styles.tableRow}
              accessibilityLabel={`${item.label}: ${formatValueForSpeech(item.value)}${
                chartType === 'pie' || chartType === 'donut'
                  ? `, ${percentage} percent`
                  : ''
              }`}
            >
              <Text style={styles.tableCell}>{item.label}</Text>
              <Text style={[styles.tableCell, styles.numericCell]}>
                {formatValue(item.value)}
              </Text>
              {(chartType === 'pie' || chartType === 'donut') && (
                <Text style={[styles.tableCell, styles.numericCell]}>{percentage}%</Text>
              )}
            </View>
          );
        })}

        {/* Total Row */}
        {statistics && (chartType === 'bar' || chartType === 'pie' || chartType === 'donut') && (
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.tableCell, styles.totalCell]}>Total</Text>
            <Text style={[styles.tableCell, styles.numericCell, styles.totalCell]}>
              {formatValue(statistics.total)}
            </Text>
            {(chartType === 'pie' || chartType === 'donut') && (
              <Text style={[styles.tableCell, styles.numericCell, styles.totalCell]}>
                100%
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Generate the full accessibility description
  const fullDescription = generateChartDescription();

  return (
    <View style={styles.container}>
      {/* Chart Container with accessibility */}
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={fullDescription}
        accessibilityHint="Contains a chart visualization. Data table available below for detailed values."
      >
        {/* Optional visible description */}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        {/* The actual chart */}
        {children}
      </View>

      {/* Key Insights (if provided) */}
      {insights && insights.length > 0 && (
        <View
          style={styles.insightsContainer}
          accessibilityRole="text"
          accessibilityLabel={`Key insights: ${insights.join('. ')}`}
        >
          <Text style={styles.insightsTitle}>Key Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightBullet}>•</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Accessible Data Table */}
      {renderAccessibleDataTable()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  },
  dataTable: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    fontSize: 13,
    color: '#333',
  },
  headerCell: {
    fontWeight: '600',
    backgroundColor: '#f8f8f8',
    color: '#555',
  },
  numericCell: {
    textAlign: 'right',
  },
  totalRow: {
    backgroundColor: '#f0f7ff',
  },
  totalCell: {
    fontWeight: '600',
    color: '#1976D2',
  },
  insightsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  insightBullet: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
  },
});

export default ChartAccessibilityProvider;
