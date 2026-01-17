/**
 * SiteProgressWidget
 *
 * Displays site-by-site progress comparison with hybrid
 * calculation (60% items + 40% milestones).
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useSiteProgressData, SiteProgressItem } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const SiteProgressWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useSiteProgressData();
  const { announce } = useAccessibility();
  const previousLengthRef = useRef(data?.length);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data.length !== previousLengthRef.current) {
      const onTrack = data.filter(s => s.status === 'on_track').length;
      const delayed = data.filter(s => s.status === 'delayed').length;
      const message = `Site progress updated: ${data.length} sites total, ${onTrack} on track, ${delayed} delayed`;
      announce(message);
      previousLengthRef.current = data.length;
    }
  }, [data, loading, announce]);

  const getStatusType = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'on_track':
        return 'success';
      case 'at_risk':
        return 'warning';
      case 'delayed':
        return 'error';
      default:
        return 'success';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'delayed':
        return 'Delayed';
      default:
        return status;
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'delayed') return theme.colors.error;
    if (status === 'at_risk') return '#F9A825';
    if (progress >= 80) return '#2E7D32';
    if (progress >= 50) return theme.colors.primary;
    return '#666';
  };

  const renderSiteItem = ({ item }: { item: SiteProgressItem }) => (
    <View
      style={styles.siteItem}
      accessible
      accessibilityLabel={`${item.siteName}, ${item.overallProgress}% complete, ${getStatusLabel(item.status)}`}
    >
      <View style={styles.siteHeader}>
        <View style={styles.siteInfo}>
          <Text variant="titleSmall" style={styles.siteName} numberOfLines={1}>
            {item.siteName}
          </Text>
          <Text variant="bodySmall" style={styles.supervisor} numberOfLines={1}>
            {item.supervisorName}
          </Text>
        </View>
        <View style={styles.siteRight}>
          <Text
            variant="titleMedium"
            style={[styles.progressText, { color: getProgressColor(item.overallProgress, item.status) }]}
          >
            {item.overallProgress}%
          </Text>
          <StatusBadge
            status={getStatusType(item.status)}
            label={getStatusLabel(item.status)}
            size="small"
          />
        </View>
      </View>
      <ProgressBar
        progress={item.overallProgress / 100}
        color={getProgressColor(item.overallProgress, item.status)}
        style={styles.progressBar}
      />
      <View style={styles.siteMetrics}>
        <Text variant="bodySmall" style={styles.metricText}>
          Items: {item.itemsProgress}%
        </Text>
        <Text variant="bodySmall" style={styles.metricText}>
          Milestones: {item.milestonesProgress}%
        </Text>
        {item.criticalIssues > 0 && (
          <Text variant="bodySmall" style={[styles.metricText, { color: theme.colors.error }]}>
            {item.criticalIssues} Critical
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="bodyMedium" style={styles.emptyText}>
        No sites in this project yet
      </Text>
    </View>
  );

  const renderSummary = () => {
    if (!data || data.length === 0) return null;

    const onTrack = data.filter(s => s.status === 'on_track').length;
    const atRisk = data.filter(s => s.status === 'at_risk').length;
    const delayed = data.filter(s => s.status === 'delayed').length;

    return (
      <View style={styles.summaryRow}>
        <StatusBadge status="success" label={`${onTrack} On Track`} size="small" />
        {atRisk > 0 && (
          <StatusBadge status="warning" label={`${atRisk} At Risk`} size="small" />
        )}
        {delayed > 0 && (
          <StatusBadge status="error" label={`${delayed} Delayed`} size="small" />
        )}
      </View>
    );
  };

  return (
    <BaseWidget
      title="Site Progress"
      icon="map-marker-multiple"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Site progress: ${data?.length || 0} sites`}
    >
      <View style={styles.container}>
        {renderSummary()}
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.siteId}
          renderItem={renderSiteItem}
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
  siteItem: {
    paddingVertical: 8,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  siteInfo: {
    flex: 1,
    marginRight: 8,
  },
  siteName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  supervisor: {
    color: '#666',
  },
  siteRight: {
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
  siteMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricText: {
    color: '#666',
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

export default SiteProgressWidget;
