import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { RfqStatusData } from '../types/dashboard';
import { COLORS } from '../../../theme/colors';

export interface RfqStatusWidgetProps {
  data: RfqStatusData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  testID?: string;
}

/**
 * RfqStatusWidget - Displays Design RFQ status distribution
 *
 * Shows:
 * - Total RFQ count with status breakdown
 * - Visual status distribution (donut-style representation)
 * - Color-coded status indicators
 * - Interactive - taps navigate to RFQ list
 *
 * Target LOC: ~120
 */
export const RfqStatusWidget: React.FC<RfqStatusWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onPress,
  testID,
}) => {
  const { draft, issued, awarded, total } = data;

  // Calculate percentages
  const draftPercent = total > 0 ? (draft / total) * 100 : 0;
  const issuedPercent = total > 0 ? (issued / total) * 100 : 0;
  const awardedPercent = total > 0 ? (awarded / total) * 100 : 0;

  const renderDonutSegments = () => {
    if (total === 0) {
      return (
        <View style={styles.emptyDonut}>
          <Text style={styles.emptyDonutText}>No RFQs</Text>
        </View>
      );
    }

    return (
      <View style={styles.donutContainer}>
        <View style={styles.donutRing}>
          {/* Simplified donut representation using horizontal bars */}
          {draft > 0 && (
            <View style={[styles.donutSegment, styles.draftSegment, { height: `${draftPercent}%` }]} />
          )}
          {issued > 0 && (
            <View style={[styles.donutSegment, styles.issuedSegment, { height: `${issuedPercent}%` }]} />
          )}
          {awarded > 0 && (
            <View style={[styles.donutSegment, styles.awardedSegment, { height: `${awardedPercent}%` }]} />
          )}
        </View>
        <View style={styles.donutCenter}>
          <Text style={styles.donutCenterValue}>{total}</Text>
          <Text style={styles.donutCenterLabel}>RFQs</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Design RFQs: ${total} total. ${draft} draft, ${issued} issued, ${awarded} awarded`}
      accessibilityHint={onPress ? 'Double tap to view full RFQ list' : undefined}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderDonutSegments()}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.draftDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{draft}</Text>
            <Text style={styles.legendLabel}>Draft</Text>
            <Text style={styles.legendPercent}>{draftPercent.toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.issuedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{issued}</Text>
            <Text style={styles.legendLabel}>Issued</Text>
            <Text style={styles.legendPercent}>{issuedPercent.toFixed(0)}%</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.awardedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{awarded}</Text>
            <Text style={styles.legendLabel}>Awarded</Text>
            <Text style={styles.legendPercent}>{awardedPercent.toFixed(0)}%</Text>
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
      id="rfq-status"
      title="Design RFQs"
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
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    height: 120,
    position: 'relative',
  },
  donutRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 20,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  donutSegment: {
    width: '100%',
  },
  draftSegment: {
    backgroundColor: COLORS.DISABLED,
  },
  issuedSegment: {
    backgroundColor: COLORS.INFO,
  },
  awardedSegment: {
    backgroundColor: COLORS.SUCCESS,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  donutCenterLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyDonut: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 16,
  },
  emptyDonutText: {
    fontSize: 14,
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
  draftDot: {
    backgroundColor: COLORS.DISABLED,
  },
  issuedDot: {
    backgroundColor: COLORS.INFO,
  },
  awardedDot: {
    backgroundColor: COLORS.SUCCESS,
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
  legendPercent: {
    fontSize: 10,
    color: '#999',
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
