/**
 * KeyDateProgressWidget
 *
 * Displays Key Date progress with dual-track breakdown:
 * Design document progress vs site activity progress.
 *
 * Each card shows:
 *   - KD code + description header
 *   - Overall combined progress bar (colored by status)
 *   - Sub-metrics: Design: X% | Activities: Y%
 *   - For manual/binary mode: single bar with mode label
 *
 * @version 1.0.0
 * @since Manager Phase 3 (Key Date Widget)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useKeyDateProgressData, KDProgressItem } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helpers ====================

type KDBadgeStatus = 'success' | 'info' | 'error' | 'default';

function getStatusBadgeType(status: string): KDBadgeStatus {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'delayed':
      return 'error';
    default:
      return 'default';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'delayed':
      return 'Delayed';
    case 'not_started':
      return 'Not Started';
    default:
      return status;
  }
}

// ==================== Component ====================

export const KeyDateProgressWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useKeyDateProgressData();
  const { announce } = useAccessibility();
  const previousLengthRef = useRef(data?.length);

  useEffect(() => {
    if (data && !loading && data.length !== previousLengthRef.current) {
      const completed = data.filter(kd => kd.status === 'completed').length;
      const delayed = data.filter(kd => kd.status === 'delayed').length;
      announce(
        `Key Date progress updated: ${data.length} key dates, ${completed} completed, ${delayed} delayed`,
      );
      previousLengthRef.current = data.length;
    }
  }, [data, loading, announce]);

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#2E7D32'; // green
      case 'in_progress':
        return theme.colors.primary; // blue
      case 'delayed':
        return theme.colors.error; // red
      default:
        return '#9E9E9E'; // grey
    }
  };

  const renderKDItem = ({ item }: { item: KDProgressItem }) => {
    const progressColor = getProgressColor(item.status);
    const isAutoMode = item.progressMode === 'auto';

    return (
      <View
        style={styles.kdItem}
        accessible
        accessibilityLabel={`${item.code}: ${item.description}, ${item.combinedProgress}% complete, ${getStatusLabel(item.status)}`}
      >
        {/* Header row: code + description | progress % + status badge */}
        <View style={styles.kdHeader}>
          <View style={styles.kdInfo}>
            <Text variant="titleSmall" style={styles.kdCode} numberOfLines={1}>
              {item.code}
            </Text>
            <Text variant="bodySmall" style={styles.kdDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.kdRight}>
            <Text
              variant="titleMedium"
              style={[styles.progressText, { color: progressColor }]}
            >
              {item.combinedProgress}%
            </Text>
            <StatusBadge
              status={getStatusBadgeType(item.status)}
              label={getStatusLabel(item.status)}
              size="small"
            />
          </View>
        </View>

        {/* Overall progress bar */}
        <ProgressBar
          progress={Math.min(1, item.combinedProgress / 100)}
          color={progressColor}
          style={styles.progressBar}
        />

        {/* Sub-metrics row */}
        <View style={styles.metricsRow}>
          {isAutoMode ? (
            <>
              {item.hasDesignDocs && (
                <Text variant="bodySmall" style={styles.metricText}>
                  Design: {item.designProgress}%
                </Text>
              )}
              {item.hasSiteActivities && (
                <Text variant="bodySmall" style={styles.metricText}>
                  Activities: {item.activitiesProgress}%
                </Text>
              )}
              {!item.hasDesignDocs && !item.hasSiteActivities && (
                <Text variant="bodySmall" style={styles.metricMuted}>
                  No linked docs or sites
                </Text>
              )}
            </>
          ) : (
            <Text variant="bodySmall" style={styles.metricMuted}>
              {item.progressMode === 'manual' ? 'Manual' : 'Binary'} mode
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="bodyMedium" style={styles.emptyText}>
        No Key Dates defined for this project
      </Text>
    </View>
  );

  const renderSummary = () => {
    if (!data || data.length === 0) return null;

    const completed = data.filter(kd => kd.status === 'completed').length;
    const inProgress = data.filter(kd => kd.status === 'in_progress').length;
    const delayed = data.filter(kd => kd.status === 'delayed').length;

    return (
      <View style={styles.summaryRow}>
        <StatusBadge status="success" label={`${completed} Completed`} size="small" />
        {inProgress > 0 && (
          <StatusBadge status="info" label={`${inProgress} In Progress`} size="small" />
        )}
        {delayed > 0 && (
          <StatusBadge status="error" label={`${delayed} Delayed`} size="small" />
        )}
      </View>
    );
  };

  return (
    <BaseWidget
      title="Key Date Progress"
      icon="calendar-check-outline"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Key Date progress: ${data?.length ?? 0} key dates`}
    >
      <View style={styles.container}>
        {renderSummary()}
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderKDItem}
          ListEmptyComponent={renderEmpty}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  kdItem: {
    paddingVertical: 8,
  },
  kdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kdInfo: {
    flex: 1,
    marginRight: 8,
  },
  kdCode: {
    fontWeight: '700',
    marginBottom: 2,
  },
  kdDescription: {
    color: '#555',
  },
  kdRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  progressText: {
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metricText: {
    color: '#666',
  },
  metricMuted: {
    color: '#999',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
  },
});

export default KeyDateProgressWidget;
