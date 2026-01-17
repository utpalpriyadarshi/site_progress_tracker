/**
 * KPIOverviewWidget
 *
 * Displays overall project KPIs: completion %, budget utilization,
 * sites on schedule/delayed, and key project metrics.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useKPIData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const KPIOverviewWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useKPIData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const message = `Project overview updated: ${data.overallCompletion}% complete, ${data.sitesOnSchedule} sites on schedule, ${data.sitesDelayed} delayed`;
      announce(message);
      previousDataRef.current = data;
    }
  }, [data, loading, announce]);

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return theme.colors.primary;
    if (percentage >= 50) return '#F9A825';
    return theme.colors.error;
  };

  return (
    <BaseWidget
      title="Project Overview"
      icon="chart-box"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Project overview: ${data?.overallCompletion || 0}% complete, ${data?.totalSites || 0} sites`}
    >
      <View style={styles.container}>
        {/* Overall Completion */}
        <View style={styles.completionSection}>
          <View style={styles.completionHeader}>
            <Text variant="labelMedium" style={styles.label}>
              Overall Completion
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.completionValue, { color: getCompletionColor(data?.overallCompletion || 0) }]}
            >
              {data?.overallCompletion || 0}%
            </Text>
          </View>
          <ProgressBar
            progress={(data?.overallCompletion || 0) / 100}
            color={getCompletionColor(data?.overallCompletion || 0)}
            style={styles.progressBar}
          />
        </View>

        {/* Budget Utilization */}
        <View style={styles.metricRow}>
          <Text variant="labelMedium" style={styles.label}>
            Budget Utilization
          </Text>
          <Text variant="titleMedium" style={styles.metricValue}>
            {data?.budgetUtilization || 0}%
          </Text>
        </View>

        {/* Site Status Badges */}
        <View style={styles.badgeRow}>
          <StatusBadge
            status="success"
            label={`${data?.sitesOnSchedule || 0} On Schedule`}
            size="small"
          />
          <StatusBadge
            status="warning"
            label={`${data?.sitesDelayed || 0} Delayed`}
            size="small"
            style={styles.badgeSpacing}
          />
        </View>

        {/* Additional Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              Total Sites
            </Text>
            <Text variant="titleMedium" style={styles.metricNumber}>
              {data?.totalSites || 0}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              Hindrances
            </Text>
            <Text variant="titleMedium" style={[styles.metricNumber, (data?.openHindrances || 0) > 0 && { color: theme.colors.error }]}>
              {data?.openHindrances || 0}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              Upcoming
            </Text>
            <Text variant="titleMedium" style={styles.metricNumber}>
              {data?.upcomingMilestones || 0}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text variant="bodySmall" style={styles.metricLabel}>
              Supervisors
            </Text>
            <Text variant="titleMedium" style={styles.metricNumber}>
              {data?.activeSupervisors || 0}
            </Text>
          </View>
        </View>
      </View>
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  completionSection: {
    marginBottom: 4,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#666',
  },
  completionValue: {
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricValue: {
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badgeSpacing: {
    marginLeft: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  metricItem: {
    width: '25%',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricNumber: {
    fontWeight: '600',
  },
});

export default KPIOverviewWidget;
