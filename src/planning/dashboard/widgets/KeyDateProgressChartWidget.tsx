/**
 * KeyDateProgressChartWidget Component
 *
 * Displays a line chart showing actual vs expected progress for Key Dates over time.
 * Helps planners visualize schedule adherence and identify delays.
 *
 * @version 1.0.0
 * @since Phase 7 - Key Date Progress Analytics
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import type { KDProgressDataPoint } from '../hooks';

// ==================== Types ====================

export interface KeyDateProgressChartWidgetProps {
  keyDates: KDProgressDataPoint[];
  projectStartDate: number | null;
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Helpers ====================

/**
 * Calculate expected progress based on elapsed time
 * Formula: (elapsed days / total days) * 100
 */
const calculateExpectedProgress = (
  targetDate: number,
  startDate: number,
  currentDate: number
): number => {
  if (!targetDate || !startDate) return 0;

  const totalDays = (targetDate - startDate) / (1000 * 60 * 60 * 24);
  const elapsedDays = (currentDate - startDate) / (1000 * 60 * 60 * 24);

  if (totalDays <= 0) return 100;

  const expectedProgress = Math.min((elapsedDays / totalDays) * 100, 100);
  return Math.max(expectedProgress, 0);
};

// ==================== Component ====================

export const KeyDateProgressChartWidget: React.FC<KeyDateProgressChartWidgetProps> = ({
  keyDates,
  projectStartDate,
  loading = false,
  error = null,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!keyDates || keyDates.length === 0 || !projectStartDate) {
      return null;
    }

    // Filter KDs with target dates and sort by sequence
    const validKDs = keyDates
      .filter(kd => kd.targetDate)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .slice(0, 6); // Limit to 6 KDs for readability

    if (validKDs.length === 0) return null;

    const now = Date.now();

    // Calculate expected and actual progress for each KD
    const expectedData = validKDs.map(kd =>
      Math.round(calculateExpectedProgress(kd.targetDate!, projectStartDate, now))
    );
    const actualData = validKDs.map(kd => Math.round(kd.progress));

    // Labels (KD codes)
    const labels = validKDs.map(kd => kd.code);

    return {
      labels,
      datasets: [
        {
          data: expectedData,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for expected
          strokeWidth: 2,
        },
        {
          data: actualData,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for actual
          strokeWidth: 2,
        },
      ],
      legend: ['Expected', 'Actual'],
    };
  }, [keyDates, projectStartDate]);

  const renderContent = () => {
    if (!chartData) {
      return (
        <EmptyState
          icon="chart-line"
          title="No Progress Data"
          message="Add key dates with target dates to see progress tracking"
          variant="compact"
          actionText="Go to Key Dates"
          onAction={onPress}
        />
      );
    }

    return (
      <View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text variant="bodySmall">Expected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text variant="bodySmall">Actual</Text>
          </View>
        </View>

        <LineChart
          data={chartData}
          width={screenWidth - 64} // Accounting for widget padding
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
            propsForBackgroundLines: {
              strokeDasharray: '', // solid background lines
              stroke: '#e0e0e0',
              strokeWidth: 1,
            },
          }}
          bezier
          style={styles.chart}
          yAxisSuffix="%"
          yAxisInterval={1}
          fromZero
          segments={4}
        />

        <Text variant="bodySmall" style={styles.helpText}>
          Track how Key Dates are progressing compared to planned timeline
        </Text>
      </View>
    );
  };

  return (
    <BaseWidget
      title="KD Progress Tracking"
      icon="chart-line"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel="Key Date Progress Chart widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 8,
  },
});

export default KeyDateProgressChartWidget;
