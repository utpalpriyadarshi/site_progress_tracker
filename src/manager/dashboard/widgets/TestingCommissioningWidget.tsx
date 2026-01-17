/**
 * TestingCommissioningWidget
 *
 * Displays testing and commissioning progress including PM500/PM600,
 * SAT/FAT inspections, and test results.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useTestingData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const TestingCommissioningWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useTestingData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const message = `Testing and commissioning updated: PM500 at ${data.pm500Progress}%, PM600 at ${data.pm600Progress}%, ${data.testPassRate}% pass rate, ${data.overdueInspections} overdue inspections`;
      announce(message);
      previousDataRef.current = data;
    }
  }, [data, loading, announce]);

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complete';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return '#2E7D32';
    if (rate >= 70) return '#F9A825';
    return theme.colors.error;
  };

  return (
    <BaseWidget
      title="Testing & Commissioning"
      icon="test-tube"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Testing and commissioning: PM500 at ${data?.pm500Progress || 0}%, PM600 at ${data?.pm600Progress || 0}%`}
    >
      <View style={styles.container}>
        {/* PM500 - Testing */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM500 - Testing
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleSmall" style={styles.progressValue}>
                {data?.pm500Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm500Status || 'not_started')}
                label={getStatusLabel(data?.pm500Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm500Progress || 0) / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* PM600 - Commissioning */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM600 - Commissioning
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleSmall" style={styles.progressValue}>
                {data?.pm600Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm600Status || 'not_started')}
                label={getStatusLabel(data?.pm600Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm600Progress || 0) / 100}
            color={theme.colors.secondary}
            style={styles.progressBar}
          />
        </View>

        {/* Test Pass Rate */}
        <View style={styles.section}>
          <View style={styles.passRateRow}>
            <Text variant="labelMedium" style={styles.label}>
              Test Pass Rate
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.passRateValue, { color: getPassRateColor(data?.testPassRate || 0) }]}
            >
              {data?.testPassRate || 0}%
            </Text>
          </View>
        </View>

        {/* Inspection Summary */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Inspections ({data?.totalInspections || 0} Total)
          </Text>
          <View style={styles.inspectionGrid}>
            <View style={styles.inspectionItem}>
              <Text variant="titleSmall" style={[styles.inspectionNumber, { color: '#2E7D32' }]}>
                {data?.inspectionsPassed || 0}
              </Text>
              <Text variant="bodySmall" style={styles.inspectionLabel}>Passed</Text>
            </View>
            <View style={styles.inspectionItem}>
              <Text variant="titleSmall" style={[styles.inspectionNumber, { color: theme.colors.error }]}>
                {data?.inspectionsFailed || 0}
              </Text>
              <Text variant="bodySmall" style={styles.inspectionLabel}>Failed</Text>
            </View>
            <View style={styles.inspectionItem}>
              <Text variant="titleSmall" style={styles.inspectionNumber}>
                {data?.inspectionsPending || 0}
              </Text>
              <Text variant="bodySmall" style={styles.inspectionLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* SAT/FAT Status */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            SAT / FAT Progress
          </Text>
          <View style={styles.satFatGrid}>
            <View style={styles.satFatColumn}>
              <Text variant="bodySmall" style={styles.satFatTitle}>SAT</Text>
              <View style={styles.satFatRow}>
                <StatusBadge
                  status="success"
                  label={`${data?.satCompleted || 0} Done`}
                  size="small"
                />
                <StatusBadge
                  status="default"
                  label={`${data?.satPending || 0} Pending`}
                  size="small"
                />
              </View>
            </View>
            <View style={styles.satFatColumn}>
              <Text variant="bodySmall" style={styles.satFatTitle}>FAT</Text>
              <View style={styles.satFatRow}>
                <StatusBadge
                  status="success"
                  label={`${data?.fatCompleted || 0} Done`}
                  size="small"
                />
                <StatusBadge
                  status="default"
                  label={`${data?.fatPending || 0} Pending`}
                  size="small"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming & Overdue */}
        <View style={styles.alertSection}>
          <View style={styles.badgeRow}>
            {(data?.upcomingInspections || 0) > 0 && (
              <StatusBadge
                status="info"
                label={`${data?.upcomingInspections} Upcoming`}
                size="small"
              />
            )}
            {(data?.overdueInspections || 0) > 0 && (
              <StatusBadge
                status="error"
                label={`${data?.overdueInspections} Overdue`}
                size="small"
              />
            )}
          </View>
        </View>
      </View>
    </BaseWidget>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  milestoneSection: {
    marginBottom: 4,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#666',
    flex: 1,
  },
  progressValue: {
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  passRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passRateValue: {
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#666',
    marginBottom: 8,
  },
  inspectionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  inspectionItem: {
    alignItems: 'center',
  },
  inspectionNumber: {
    fontWeight: '600',
  },
  inspectionLabel: {
    color: '#666',
    marginTop: 2,
  },
  satFatGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  satFatColumn: {
    flex: 1,
  },
  satFatTitle: {
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  satFatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alertSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default TestingCommissioningWidget;
