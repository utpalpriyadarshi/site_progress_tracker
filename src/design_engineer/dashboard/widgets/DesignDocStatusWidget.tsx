import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import type { DesignDocStatusData } from '../types/dashboard';
import { COLORS } from '../../../theme/colors';

export interface DesignDocStatusWidgetProps {
  data: DesignDocStatusData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => Promise<void>;
  onPress?: () => void;
  testID?: string;
}

export const DesignDocStatusWidget: React.FC<DesignDocStatusWidgetProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh,
  onPress,
  testID,
}) => {
  const { draft, submitted, approved, rejected, total } = data;

  const draftPercent = total > 0 ? (draft / total) * 100 : 0;
  const submittedPercent = total > 0 ? (submitted / total) * 100 : 0;
  const approvedPercent = total > 0 ? (approved / total) * 100 : 0;
  const rejectedPercent = total > 0 ? (rejected / total) * 100 : 0;

  const renderStackedBar = () => {
    if (total === 0) {
      return (
        <View style={styles.emptyBar}>
          <Text style={styles.emptyBarText}>No documents</Text>
        </View>
      );
    }

    return (
      <View style={styles.stackedBar}>
        {draft > 0 && (
          <View
            style={[styles.barSegment, styles.draftSegment, { flex: draftPercent }]}
            accessible
            accessibilityLabel={`${draft} draft documents, ${draftPercent.toFixed(0)}%`}
          />
        )}
        {submitted > 0 && (
          <View
            style={[styles.barSegment, styles.submittedSegment, { flex: submittedPercent }]}
            accessible
            accessibilityLabel={`${submitted} submitted documents, ${submittedPercent.toFixed(0)}%`}
          />
        )}
        {approved > 0 && (
          <View
            style={[styles.barSegment, styles.approvedSegment, { flex: approvedPercent }]}
            accessible
            accessibilityLabel={`${approved} approved documents, ${approvedPercent.toFixed(0)}%`}
          />
        )}
        {rejected > 0 && (
          <View
            style={[styles.barSegment, styles.rejectedSegment, { flex: rejectedPercent }]}
            accessible
            accessibilityLabel={`${rejected} rejected documents, ${rejectedPercent.toFixed(0)}%`}
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
      accessibilityLabel={`Design Documents: ${total} total. ${draft} draft, ${submitted} submitted, ${approved} approved, ${rejected} rejected`}
      accessibilityHint={onPress ? 'Double tap to view full document list' : undefined}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.totalContainer}>
        <Text style={styles.totalValue}>{total}</Text>
        <Text style={styles.totalLabel}>Total Documents</Text>
      </View>

      {renderStackedBar()}

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.draftDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{draft}</Text>
            <Text style={styles.legendLabel}>Draft</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.submittedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{submitted}</Text>
            <Text style={styles.legendLabel}>Submitted</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.approvedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{approved}</Text>
            <Text style={styles.legendLabel}>Approved</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.rejectedDot]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendValue}>{rejected}</Text>
            <Text style={styles.legendLabel}>Rejected</Text>
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
      id="design-doc-status"
      title="Design Documents"
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
  draftSegment: {
    backgroundColor: COLORS.DISABLED,
  },
  submittedSegment: {
    backgroundColor: COLORS.INFO,
  },
  approvedSegment: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectedSegment: {
    backgroundColor: COLORS.ERROR,
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
  draftDot: {
    backgroundColor: COLORS.DISABLED,
  },
  submittedDot: {
    backgroundColor: COLORS.INFO,
  },
  approvedDot: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectedDot: {
    backgroundColor: COLORS.ERROR,
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
