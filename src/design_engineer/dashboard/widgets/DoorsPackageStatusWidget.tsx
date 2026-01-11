import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { DoorsPackageStatus } from '../types/dashboard';

export interface DoorsPackageStatusWidgetProps {
  data: DoorsPackageStatus;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  testID?: string;
}

/**
 * DoorsPackageStatusWidget - Displays DOORS package status distribution
 *
 * Shows:
 * - Total package count with status distribution
 * - Stacked horizontal bar showing pending/received/reviewed percentages
 * - Color-coded status indicators
 * - Interactive - taps navigate to DOORS package list
 *
 * Target LOC: ~120
 */
export const DoorsPackageStatusWidget: React.FC<DoorsPackageStatusWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onPress,
  testID,
}) => {
  const { pending, received, reviewed, total } = data;

  // Calculate percentages
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
  const receivedPercent = total > 0 ? (received / total) * 100 : 0;
  const reviewedPercent = total > 0 ? (reviewed / total) * 100 : 0;

  const renderStackedBar = () => {
    if (total === 0) {
      return (
        <View style={styles.emptyBar}>
          <Text style={styles.emptyBarText}>No packages</Text>
        </View>
      );
    }

    return (
      <View style={styles.stackedBar}>
        {pending > 0 && (
          <View
            style={[styles.barSegment, styles.pendingSegment, { flex: pendingPercent }]}
            accessible
            accessibilityLabel={`${pending} pending packages, ${pendingPercent.toFixed(0)}%`}
          />
        )}
        {received > 0 && (
          <View
            style={[styles.barSegment, styles.receivedSegment, { flex: receivedPercent }]}
            accessible
            accessibilityLabel={`${received} received packages, ${receivedPercent.toFixed(0)}%`}
          />
        )}
        {reviewed > 0 && (
          <View
            style={[styles.barSegment, styles.reviewedSegment, { flex: reviewedPercent }]}
            accessible
            accessibilityLabel={`${reviewed} reviewed packages, ${reviewedPercent.toFixed(0)}%`}
          />
        )}
      </View>
    );
  };

  const renderContent = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`DOORS Packages: ${total} total. ${pending} pending, ${received} received, ${reviewed} reviewed`}
      accessibilityHint={onPress ? 'Double tap to view full package list' : undefined}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.totalContainer}>
        <Text style={styles.totalValue}>{total}</Text>
        <Text style={styles.totalLabel}>Total Packages</Text>
      </View>

      {renderStackedBar()}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.pendingDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{pending}</Text>
            <Text style={styles.legendLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.receivedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{received}</Text>
            <Text style={styles.legendLabel}>Received</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.reviewedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{reviewed}</Text>
            <Text style={styles.legendLabel}>Reviewed</Text>
          </View>
        </View>
      </View>

      {onPress && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>Tap to view details →</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <BaseWidget
      id="doors-package-status"
      title="DOORS Packages"
      subtitle="Status Distribution"
      refreshable={!!onRefresh}
      onRefresh={onRefresh}
      loading={loading}
      error={error}
      size="medium"
      testID={testID}
    >
      {renderContent()}
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  totalContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  pendingSegment: {
    backgroundColor: '#FFA500',
  },
  receivedSegment: {
    backgroundColor: '#2196F3',
  },
  reviewedSegment: {
    backgroundColor: '#4CAF50',
  },
  emptyBar: {
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyBarText: {
    fontSize: 12,
    color: '#999',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  pendingDot: {
    backgroundColor: '#FFA500',
  },
  receivedDot: {
    backgroundColor: '#2196F3',
  },
  reviewedDot: {
    backgroundColor: '#4CAF50',
  },
  legendTextContainer: {
    flex: 1,
  },
  legendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  legendLabel: {
    fontSize: 11,
    color: '#666',
  },
  tapHint: {
    marginTop: 12,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
