/**
 * KDTimelineProgressWidget Component
 *
 * Displays a line chart showing cumulative Expected vs Actual progress over time.
 * Uses monthly intervals to track how Key Date weightages accumulate toward project completion.
 *
 * @version 1.0.0
 * @since Phase 7 - Key Date Timeline Progress Analytics
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import type { TimelineDataPoint } from '../hooks/useWidgetData';

// ==================== Types ====================

export interface KDTimelineProgressWidgetProps {
  timelineData: TimelineDataPoint[];
  loading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Component ====================

export const KDTimelineProgressWidget: React.FC<KDTimelineProgressWidgetProps> = ({
  timelineData,
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
    if (!timelineData || timelineData.length === 0) {
      return null;
    }

    // Limit to reasonable number of points for readability (e.g., 12 months)
    const displayData = timelineData.slice(0, 12);

    const expectedData = displayData.map(point => point.expectedProgress);
    const actualData = displayData.map(point => point.actualProgress);

    // Show every other label to prevent overlap
    const labels = displayData.map((point, index) => {
      // Show first, every 2nd month, and last label
      if (index === 0 || index === displayData.length - 1 || index % 2 === 0) {
        return point.label;
      }
      return ''; // Empty string for hidden labels
    });

    return {
      labels,
      datasets: [
        {
          data: expectedData.length > 0 ? expectedData : [0], // Ensure we have data
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for expected
          strokeWidth: 2,
        },
        {
          data: actualData.length > 0 ? actualData : [0], // Ensure we have data
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for actual
          strokeWidth: 2,
        },
      ],
      legend: ['Expected', 'Actual'],
    };
  }, [timelineData]);

  const renderContent = () => {
    if (!chartData) {
      return (
        <EmptyState
          icon="chart-timeline-variant"
          title="No Timeline Data"
          message="Project dates and key dates needed to show progress timeline"
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
          Cumulative progress over time based on Key Date weightages
        </Text>
      </View>
    );
  };

  return (
    <BaseWidget
      title="KD Timeline Progress"
      icon="chart-timeline-variant"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
      accessibilityLabel="Key Date Timeline Progress widget"
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

export default KDTimelineProgressWidget;
