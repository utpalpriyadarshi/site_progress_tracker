import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { ProcessingTimeData } from '../types/dashboard';

export interface ProcessingTimeWidgetProps {
  data: ProcessingTimeData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  testID?: string;
}

/**
 * ProcessingTimeWidget - Displays average processing time metrics
 *
 * Shows:
 * - Average processing days (time from received to reviewed)
 * - Benchmark comparison
 * - Trend indicator (up/down/stable)
 * - Color-coded performance (green <7 days, yellow <14 days, red >=14 days)
 *
 * Target LOC: ~100
 */
export const ProcessingTimeWidget: React.FC<ProcessingTimeWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onPress,
  testID,
}) => {
  const { average, benchmark, trend } = data;

  // Determine color based on average
  const getColor = () => {
    if (average <= 7) return '#4CAF50'; // Green - Excellent
    if (average <= 14) return '#FFA500'; // Orange - Good
    return '#F44336'; // Red - Needs improvement
  };

  const color = getColor();

  const getPerformanceLabel = () => {
    if (average <= 7) return 'Excellent';
    if (average <= 14) return 'Good';
    return 'Slow';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈'; // Getting slower (worse)
      case 'down':
        return '📉'; // Getting faster (better)
      case 'stable':
      default:
        return '➡️'; // Stable
    }
  };

  const getTrendLabel = () => {
    switch (trend) {
      case 'up':
        return 'Increasing';
      case 'down':
        return 'Decreasing';
      case 'stable':
      default:
        return 'Stable';
    }
  };

  const isAboveBenchmark = average > benchmark;

  const renderContent = () => (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Average processing time: ${average} days. Benchmark: ${benchmark} days. Trend: ${getTrendLabel()}. Performance: ${getPerformanceLabel()}`}
    >
      <View style={styles.mainContainer}>
        <View style={styles.valueContainer}>
          <Text style={[styles.averageValue, { color }]}>{average}</Text>
          <Text style={styles.averageLabel}>Days</Text>
        </View>

        <View style={styles.trendContainer}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={styles.trendLabel}>{getTrendLabel()}</Text>
        </View>
      </View>

      <View style={styles.performanceContainer}>
        <View style={[styles.performanceDot, { backgroundColor: color }]} />
        <Text style={[styles.performanceLabel, { color }]}>{getPerformanceLabel()} Performance</Text>
      </View>

      <View style={styles.benchmarkContainer}>
        <View style={styles.benchmarkRow}>
          <Text style={styles.benchmarkLabel}>Benchmark:</Text>
          <Text style={styles.benchmarkValue}>{benchmark} days</Text>
        </View>
        <View style={styles.comparisonRow}>
          <Text style={styles.comparisonLabel}>vs Benchmark:</Text>
          <Text style={[styles.comparisonValue, isAboveBenchmark ? styles.aboveBenchmark : styles.belowBenchmark]}>
            {isAboveBenchmark ? '+' : ''}{average - benchmark} days
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Time from received to reviewed</Text>
      </View>
    </View>
  );

  return (
    <BaseWidget
      id="processing-time"
      title="Processing Time"
      subtitle="Average Review Duration"
      refreshable={!!onRefresh}
      onRefresh={onRefresh}
      loading={loading}
      error={error}
      size="medium"
      onPress={onPress}
      testID={testID}
    >
      {renderContent()}
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueContainer: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  averageLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trendContainer: {
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 32,
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  benchmarkContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  benchmarkLabel: {
    fontSize: 12,
    color: '#666',
  },
  benchmarkValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboveBenchmark: {
    color: '#F44336', // Red - slower than benchmark
  },
  belowBenchmark: {
    color: '#4CAF50', // Green - faster than benchmark
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
