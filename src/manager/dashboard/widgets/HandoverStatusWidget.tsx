/**
 * HandoverStatusWidget
 *
 * Displays handover status including PM700 progress,
 * documentation completion, and punch list items.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useHandoverData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const HandoverStatusWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useHandoverData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const message = `Handover status updated: PM700 at ${data.pm700Progress}%, ${data.documentationProgress}% documentation complete, ${data.punchListOpen} open punch list items, ${data.sitesReadyForHandover} sites ready for handover`;
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#2E7D32';
    if (progress >= 50) return theme.colors.primary;
    return '#F9A825';
  };

  return (
    <BaseWidget
      title="Handover Status"
      icon="clipboard-check"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Handover status: PM700 at ${data?.pm700Progress || 0}%, overall ${data?.handoverProgress || 0}% complete`}
    >
      <View style={styles.container}>
        {/* PM700 - Handover */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM700 - Handover
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleSmall" style={styles.progressValue}>
                {data?.pm700Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm700Status || 'not_started')}
                label={getStatusLabel(data?.pm700Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm700Progress || 0) / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* Overall Handover Progress */}
        <View style={styles.overallSection}>
          <View style={styles.overallHeader}>
            <Text variant="labelMedium" style={styles.label}>
              Overall Handover Progress
            </Text>
            <Text
              variant="headlineMedium"
              style={[styles.overallValue, { color: getProgressColor(data?.handoverProgress || 0) }]}
            >
              {data?.handoverProgress || 0}%
            </Text>
          </View>
          <ProgressBar
            progress={(data?.handoverProgress || 0) / 100}
            color={getProgressColor(data?.handoverProgress || 0)}
            style={styles.progressBarLarge}
          />
        </View>

        {/* Documentation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="labelMedium" style={styles.sectionTitle}>
              Documentation ({data?.totalDocuments || 0} Total)
            </Text>
            <Text variant="titleSmall" style={styles.docProgress}>
              {data?.documentationProgress || 0}%
            </Text>
          </View>
          <View style={styles.docGrid}>
            <View style={styles.docItem}>
              <Text variant="titleSmall" style={[styles.docNumber, { color: '#2E7D32' }]}>
                {data?.documentsApproved || 0}
              </Text>
              <Text variant="bodySmall" style={styles.docLabel}>Approved</Text>
            </View>
            <View style={styles.docItem}>
              <Text variant="titleSmall" style={[styles.docNumber, { color: '#1565C0' }]}>
                {data?.documentsUnderReview || 0}
              </Text>
              <Text variant="bodySmall" style={styles.docLabel}>Review</Text>
            </View>
            <View style={styles.docItem}>
              <Text variant="titleSmall" style={styles.docNumber}>
                {data?.documentsPending || 0}
              </Text>
              <Text variant="bodySmall" style={styles.docLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Punch List */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Punch List Items ({data?.totalPunchListItems || 0} Total)
          </Text>
          <View style={styles.punchGrid}>
            <View style={styles.punchItem}>
              <Text variant="titleSmall" style={[styles.punchNumber, { color: theme.colors.error }]}>
                {data?.punchListOpen || 0}
              </Text>
              <Text variant="bodySmall" style={styles.punchLabel}>Open</Text>
            </View>
            <View style={styles.punchItem}>
              <Text variant="titleSmall" style={[styles.punchNumber, { color: '#F9A825' }]}>
                {data?.punchListInProgress || 0}
              </Text>
              <Text variant="bodySmall" style={styles.punchLabel}>In Progress</Text>
            </View>
            <View style={styles.punchItem}>
              <Text variant="titleSmall" style={[styles.punchNumber, { color: '#2E7D32' }]}>
                {data?.punchListClosed || 0}
              </Text>
              <Text variant="bodySmall" style={styles.punchLabel}>Closed</Text>
            </View>
          </View>
          {(data?.punchListCritical || 0) > 0 && (
            <View style={styles.criticalAlert}>
              <StatusBadge
                status="error"
                label={`${data?.punchListCritical} Critical Items`}
                size="small"
              />
            </View>
          )}
        </View>

        {/* Sites Readiness */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Site Readiness
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge
              status="success"
              label={`${data?.sitesReadyForHandover || 0} Ready`}
              size="small"
            />
            <StatusBadge
              status="info"
              label={`${data?.sitesAwaitingHandover || 0} Awaiting`}
              size="small"
            />
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
  overallSection: {
    marginTop: 4,
  },
  overallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallValue: {
    fontWeight: '700',
  },
  progressBarLarge: {
    height: 8,
    borderRadius: 4,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#666',
  },
  docProgress: {
    fontWeight: '600',
    color: '#1565C0',
  },
  docGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  docItem: {
    alignItems: 'center',
  },
  docNumber: {
    fontWeight: '600',
  },
  docLabel: {
    color: '#666',
    marginTop: 2,
  },
  punchGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  punchItem: {
    alignItems: 'center',
  },
  punchNumber: {
    fontWeight: '600',
  },
  punchLabel: {
    color: '#666',
    marginTop: 2,
    fontSize: 11,
  },
  criticalAlert: {
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default HandoverStatusWidget;
