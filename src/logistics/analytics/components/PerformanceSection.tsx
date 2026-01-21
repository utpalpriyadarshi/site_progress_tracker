/**
 * PerformanceSection Component
 *
 * Displays performance benchmarking metrics
 * Phase 4: Major Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Text alternatives for performance bars
 * - Proper accessibility labels for benchmark items
 * - Screen reader descriptions for percentile data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PerformanceBenchmark } from '../../../services/PredictiveAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { MetricBox } from './MetricBox';

interface PerformanceSectionProps {
  performanceBenchmarks: PerformanceBenchmark[];
  onShowDetail: (detail: any, type: string) => void;
}

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({
  performanceBenchmarks,
  onShowDetail,
}) => {
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'average':
        return '#FF9800';
      case 'below_average':
        return '#FF6B6B';
      case 'poor':
        return '#F44336';
      default:
        return '#999';
    }
  };

  return (
    <View>
      <AnalyticsCard title="Performance Benchmarking">
        {performanceBenchmarks.map((benchmark, index) => (
          <TouchableOpacity
            key={index}
            style={styles.benchmarkItem}
            onPress={() => onShowDetail(benchmark, 'benchmark')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${benchmark.metric.replace(/_/g, ' ')}: ${benchmark.rating} rating, current value ${benchmark.currentValue.toFixed(1)} ${benchmark.unit}, industry average ${benchmark.industryAverage.toFixed(1)} ${benchmark.unit}, best in class ${benchmark.industryBest.toFixed(1)} ${benchmark.unit}, ${benchmark.percentile}th percentile`}
            accessibilityHint="Double tap to view benchmark details"
          >
            <View style={styles.benchmarkHeader}>
              <Text style={styles.benchmarkMetric}>
                {benchmark.metric.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <Badge
                text={benchmark.rating}
                backgroundColor={getRatingColor(benchmark.rating)}
              />
            </View>
            <View style={styles.benchmarkMetrics}>
              <MetricBox
                label="Current"
                value={`${benchmark.currentValue.toFixed(1)} ${benchmark.unit}`}
              />
              <MetricBox
                label="Industry Avg"
                value={`${benchmark.industryAverage.toFixed(1)} ${benchmark.unit}`}
              />
              <MetricBox
                label="Best in Class"
                value={`${benchmark.industryBest.toFixed(1)} ${benchmark.unit}`}
              />
            </View>
            <View
              style={styles.benchmarkBar}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Performance at ${benchmark.percentile}th percentile`}
              accessibilityValue={{ min: 0, max: 100, now: benchmark.percentile }}
            >
              <View
                style={[
                  styles.benchmarkBarFill,
                  {
                    width: `${benchmark.percentile}%`,
                    backgroundColor: getRatingColor(benchmark.rating),
                  },
                ]}
              />
              <Text style={styles.benchmarkPercentile}>
                {benchmark.percentile}th percentile
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </AnalyticsCard>
    </View>
  );
};

const styles = StyleSheet.create({
  benchmarkItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benchmarkMetric: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  benchmarkMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  benchmarkBar: {
    position: 'relative',
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
  },
  benchmarkBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 12,
  },
  benchmarkPercentile: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    zIndex: 1,
  },
});
