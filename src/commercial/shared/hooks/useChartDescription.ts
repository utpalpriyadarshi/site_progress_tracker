/**
 * useChartDescription - Custom hook for generating accessible chart descriptions
 *
 * Generates human-readable descriptions for different chart types that can be
 * announced by screen readers. Supports various data formats and chart types.
 *
 * Usage:
 * ```ts
 * const { description, summary, dataPoints } = useChartDescription({
 *   chartType: 'bar',
 *   data: chartData,
 *   title: 'Monthly Revenue',
 *   valueFormat: 'currency',
 * });
 *
 * // Use in accessibility label
 * <View accessibilityLabel={description}>
 *   <BarChart data={chartData} />
 * </View>
 * ```
 */

import { useMemo } from 'react';

export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'sparkline' | 'progress';

export type ValueFormat = 'currency' | 'percentage' | 'number' | 'custom';

export interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
  color?: string;
}

export interface UseChartDescriptionOptions {
  chartType: ChartType;
  data: ChartDataPoint[];
  title: string;
  subtitle?: string;
  valueFormat?: ValueFormat;
  currency?: string;
  customFormatter?: (value: number) => string;
  maxValue?: number;
  targetValue?: number;
  locale?: string;
}

export interface ChartStatistics {
  total: number;
  average: number;
  max: number;
  min: number;
  maxItem: ChartDataPoint | null;
  minItem: ChartDataPoint | null;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ChartDescriptionResult {
  /** Full accessible description for screen readers */
  description: string;
  /** Short summary (1-2 sentences) */
  summary: string;
  /** Individual data point descriptions */
  dataPoints: string[];
  /** Chart statistics */
  statistics: ChartStatistics | null;
  /** Key insights based on data analysis */
  insights: string[];
  /** Formatted values for each data point */
  formattedValues: { label: string; formatted: string }[];
}

export const useChartDescription = ({
  chartType,
  data,
  title,
  subtitle,
  valueFormat = 'number',
  currency = 'USD',
  customFormatter,
  maxValue,
  targetValue,
  locale = 'en-US',
}: UseChartDescriptionOptions): ChartDescriptionResult => {
  // Calculate statistics
  const statistics = useMemo<ChartStatistics | null>(() => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxItem = data.find((d) => d.value === max) || null;
    const minItem = data.find((d) => d.value === min) || null;

    // Calculate trend (comparing first half to second half)
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length
        : 0;
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length
        : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (firstHalfAvg > 0) {
      trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (trendPercentage > 5) trend = 'up';
      else if (trendPercentage < -5) trend = 'down';
    }

    return {
      total,
      average,
      max,
      min,
      maxItem,
      minItem,
      trend,
      trendPercentage: Math.abs(trendPercentage),
    };
  }, [data]);

  // Format value for display
  const formatValue = useMemo(() => {
    return (value: number): string => {
      if (customFormatter) return customFormatter(value);

      switch (valueFormat) {
        case 'currency':
          // Use lakhs format for INR
          if (currency === 'INR' && Math.abs(value) >= 100000) {
            const lakhs = value / 100000;
            return `${lakhs.toFixed(2)} L`;
          }
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value);
        case 'percentage':
          return `${value.toFixed(1)}%`;
        default:
          return value.toLocaleString(locale);
      }
    };
  }, [valueFormat, currency, customFormatter, locale]);

  // Format value for speech (more natural)
  const formatValueForSpeech = useMemo(() => {
    return (value: number): string => {
      if (customFormatter) return customFormatter(value);

      switch (valueFormat) {
        case 'currency':
          const absValue = Math.abs(value);
          const prefix = value < 0 ? 'negative ' : '';

          if (currency === 'INR') {
            if (absValue >= 10000000) {
              return `${prefix}${(absValue / 10000000).toFixed(2)} crore rupees`;
            }
            if (absValue >= 100000) {
              return `${prefix}${(absValue / 100000).toFixed(2)} lakh rupees`;
            }
            return `${prefix}${absValue.toLocaleString(locale)} rupees`;
          }

          if (absValue >= 1000000) {
            return `${prefix}${(absValue / 1000000).toFixed(1)} million dollars`;
          }
          if (absValue >= 1000) {
            return `${prefix}${(absValue / 1000).toFixed(1)} thousand dollars`;
          }
          return `${prefix}${absValue.toLocaleString(locale)} dollars`;

        case 'percentage':
          return `${value.toFixed(1)} percent`;

        default:
          return value.toLocaleString(locale);
      }
    };
  }, [valueFormat, currency, customFormatter, locale]);

  // Generate formatted values
  const formattedValues = useMemo(() => {
    return data.map((d) => ({
      label: d.label,
      formatted: formatValue(d.value),
    }));
  }, [data, formatValue]);

  // Generate data point descriptions
  const dataPoints = useMemo(() => {
    return data.map((d) => {
      let desc = `${d.label}: ${formatValueForSpeech(d.value)}`;

      // Add comparison to previous value if available
      if (d.previousValue !== undefined) {
        const change = d.value - d.previousValue;
        const changePercent =
          d.previousValue > 0 ? ((change / d.previousValue) * 100).toFixed(1) : 0;

        if (change > 0) {
          desc += `, up ${changePercent} percent from previous`;
        } else if (change < 0) {
          desc += `, down ${Math.abs(Number(changePercent))} percent from previous`;
        } else {
          desc += `, unchanged from previous`;
        }
      }

      return desc;
    });
  }, [data, formatValueForSpeech]);

  // Generate insights
  const insights = useMemo<string[]>(() => {
    if (!statistics || data.length === 0) return [];

    const insightsList: string[] = [];

    // Highest/lowest insight
    if (statistics.maxItem && statistics.minItem) {
      insightsList.push(
        `${statistics.maxItem.label} has the highest value at ${formatValueForSpeech(statistics.max)}`
      );

      if (statistics.maxItem.label !== statistics.minItem.label && data.length > 2) {
        insightsList.push(
          `${statistics.minItem.label} has the lowest value at ${formatValueForSpeech(statistics.min)}`
        );
      }
    }

    // Trend insight
    if (statistics.trend !== 'stable' && data.length >= 4) {
      const trendDirection = statistics.trend === 'up' ? 'upward' : 'downward';
      insightsList.push(
        `Overall trend is ${trendDirection}, changing by ${statistics.trendPercentage.toFixed(1)} percent`
      );
    }

    // Target comparison
    if (targetValue !== undefined && statistics.total > 0) {
      const targetDiff = statistics.total - targetValue;
      const targetPercent = ((statistics.total / targetValue) * 100).toFixed(0);

      if (targetDiff >= 0) {
        insightsList.push(`Exceeds target by ${formatValueForSpeech(targetDiff)}, at ${targetPercent}% of target`);
      } else {
        insightsList.push(
          `Below target by ${formatValueForSpeech(Math.abs(targetDiff))}, at ${targetPercent}% of target`
        );
      }
    }

    // Distribution insight for pie/donut
    if ((chartType === 'pie' || chartType === 'donut') && statistics.total > 0) {
      const topItem = statistics.maxItem;
      if (topItem) {
        const topPercent = ((topItem.value / statistics.total) * 100).toFixed(0);
        if (Number(topPercent) > 40) {
          insightsList.push(`${topItem.label} dominates at ${topPercent}% of total`);
        }
      }
    }

    // Progress insight
    if (chartType === 'progress' && maxValue) {
      const currentValue = data[0]?.value || 0;
      const progressPercent = ((currentValue / maxValue) * 100).toFixed(0);
      insightsList.push(`Progress is at ${progressPercent}% of maximum`);
    }

    return insightsList;
  }, [statistics, data, chartType, formatValueForSpeech, targetValue, maxValue]);

  // Generate summary
  const summary = useMemo(() => {
    if (data.length === 0) return `${title}. No data available.`;

    if (!statistics) return `${title}.`;

    const parts: string[] = [`${title}.`];

    if (subtitle) {
      parts.push(subtitle);
    }

    // Add chart type context
    switch (chartType) {
      case 'bar':
        parts.push(`Bar chart showing ${data.length} categories.`);
        parts.push(`Total is ${formatValueForSpeech(statistics.total)}.`);
        break;
      case 'line':
      case 'area':
        parts.push(`${chartType === 'line' ? 'Line' : 'Area'} chart with ${data.length} data points.`);
        if (statistics.trend !== 'stable') {
          parts.push(
            `Trend is ${statistics.trend === 'up' ? 'upward' : 'downward'}.`
          );
        }
        break;
      case 'pie':
      case 'donut':
        parts.push(`${chartType === 'pie' ? 'Pie' : 'Donut'} chart showing distribution.`);
        parts.push(`Total is ${formatValueForSpeech(statistics.total)}.`);
        break;
      case 'sparkline':
        parts.push(`Sparkline showing trend.`);
        break;
      case 'progress':
        if (maxValue) {
          const percent = ((data[0]?.value || 0) / maxValue) * 100;
          parts.push(`Progress at ${percent.toFixed(0)}%.`);
        }
        break;
    }

    return parts.join(' ');
  }, [title, subtitle, chartType, data.length, statistics, formatValueForSpeech, maxValue]);

  // Generate full description
  const description = useMemo(() => {
    if (data.length === 0) {
      return `${title}. No data available.`;
    }

    const parts: string[] = [summary];

    // Add highest/lowest
    if (statistics?.maxItem && statistics?.minItem) {
      parts.push(
        `Highest: ${statistics.maxItem.label} at ${formatValueForSpeech(statistics.max)}.`
      );
      if (statistics.maxItem.label !== statistics.minItem.label) {
        parts.push(
          `Lowest: ${statistics.minItem.label} at ${formatValueForSpeech(statistics.min)}.`
        );
      }
    }

    // Add key insights
    if (insights.length > 0) {
      parts.push(`Key insight: ${insights[0]}.`);
    }

    return parts.join(' ');
  }, [summary, statistics, formatValueForSpeech, insights, title, data.length]);

  return {
    description,
    summary,
    dataPoints,
    statistics,
    insights,
    formattedValues,
  };
};

export default useChartDescription;
