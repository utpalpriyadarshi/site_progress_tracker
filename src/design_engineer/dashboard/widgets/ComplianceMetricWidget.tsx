import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { ComplianceData } from '../types/dashboard';

export interface ComplianceMetricWidgetProps {
  data: ComplianceData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  testID?: string;
}

/**
 * ComplianceMetricWidget - Displays design compliance metrics
 *
 * Shows:
 * - Compliance rate as percentage (reviewed/total)
 * - Progress circle visualization
 * - Color-coded status (green >80%, yellow >50%, red <50%)
 * - Target comparison
 *
 * Target LOC: ~100
 */
export const ComplianceMetricWidget: React.FC<ComplianceMetricWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onPress,
  testID,
}) => {
  const { rate, target, reviewed, total } = data;

  // Determine color based on rate
  const getColor = () => {
    if (rate >= 80) return '#4CAF50'; // Green
    if (rate >= 50) return '#FFA500'; // Orange
    return '#F44336'; // Red
  };

  const color = getColor();

  const getStatusLabel = () => {
    if (rate >= 80) return 'Excellent';
    if (rate >= 50) return 'Good';
    return 'Needs Attention';
  };

  const renderContent = () => (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Compliance rate: ${rate}%, ${reviewed} of ${total} packages reviewed. Status: ${getStatusLabel()}`}
    >
      <View style={styles.circleContainer}>
        {/* Outer circle (background) */}
        <View style={[styles.circle, styles.circleBackground]}>
          {/* Inner progress circle */}
          <View style={[styles.circle, styles.circleProgress, { borderColor: color }]}>
            <View style={styles.circleCenter}>
              <Text style={[styles.rateValue, { color }]}>{rate}%</Text>
              <Text style={styles.rateLabel}>Compliance</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.statusLabel, { color }]}>{getStatusLabel()}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reviewed:</Text>
          <Text style={styles.detailValue}>{reviewed} / {total}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target:</Text>
          <Text style={[styles.detailValue, rate >= target ? styles.targetMet : styles.targetNotMet]}>
            {target}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <BaseWidget
      id="compliance-metric"
      title="Compliance Rate"
      subtitle="Design Review Progress"
      refreshable={!!onRefresh}
      onRefresh={onRefresh}
      loading={loading}
      error={error}
      size="small"
      onPress={onPress}
      testID={testID}
    >
      {renderContent()}
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    backgroundColor: '#F5F5F5',
  },
  circleProgress: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    backgroundColor: '#FFF',
  },
  circleCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rateLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  targetMet: {
    color: '#4CAF50',
  },
  targetNotMet: {
    color: '#F44336',
  },
});
