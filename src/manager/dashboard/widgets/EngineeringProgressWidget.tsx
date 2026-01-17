/**
 * EngineeringProgressWidget
 *
 * Displays engineering progress including PM200 milestone,
 * DOORS packages, requirements compliance, and RFQ status.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useEngineeringData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Component ====================

export const EngineeringProgressWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useEngineeringData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const message = `Engineering progress updated: PM200 at ${data.pm200Progress}%, ${data.doorsApproved} of ${data.totalDoors} DOORS packages approved, ${data.compliancePercentage}% requirements compliant`;
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

  return (
    <BaseWidget
      title="Engineering Progress"
      icon="cog"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Engineering progress: PM200 at ${data?.pm200Progress || 0}% complete`}
    >
      <View style={styles.container}>
        {/* PM200 Progress */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM200 - Engineering Design
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleMedium" style={styles.progressValue}>
                {data?.pm200Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm200Status || 'not_started')}
                label={getStatusLabel(data?.pm200Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm200Progress || 0) / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* DOORS Packages */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            DOORS Packages ({data?.totalDoors || 0} Total)
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge
              status="success"
              label={`${data?.doorsApproved || 0} Approved`}
              size="small"
            />
            <StatusBadge
              status="info"
              label={`${data?.doorsUnderReview || 0} Review`}
              size="small"
            />
            {(data?.doorsOpenIssues || 0) > 0 && (
              <StatusBadge
                status="warning"
                label={`${data?.doorsOpenIssues} Issues`}
                size="small"
              />
            )}
          </View>
        </View>

        {/* Requirements Compliance */}
        <View style={styles.section}>
          <View style={styles.complianceRow}>
            <Text variant="labelMedium" style={styles.label}>
              Requirements Compliance
            </Text>
            <Text variant="titleMedium" style={styles.complianceValue}>
              {data?.compliancePercentage || 0}%
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.subtext}>
            {data?.compliantRequirements || 0} of {data?.totalRequirements || 0} requirements compliant
          </Text>
        </View>

        {/* RFQ Status */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            RFQ Status ({data?.totalRfqs || 0} Total)
          </Text>
          <View style={styles.rfqGrid}>
            <View style={styles.rfqItem}>
              <Text variant="titleSmall" style={styles.rfqNumber}>
                {data?.rfqsQuotesReceived || 0}
              </Text>
              <Text variant="bodySmall" style={styles.rfqLabel}>
                Quotes
              </Text>
            </View>
            <View style={styles.rfqItem}>
              <Text variant="titleSmall" style={styles.rfqNumber}>
                {data?.rfqsUnderEvaluation || 0}
              </Text>
              <Text variant="bodySmall" style={styles.rfqLabel}>
                Evaluating
              </Text>
            </View>
            <View style={styles.rfqItem}>
              <Text variant="titleSmall" style={[styles.rfqNumber, { color: '#2E7D32' }]}>
                {data?.rfqsAwarded || 0}
              </Text>
              <Text variant="bodySmall" style={styles.rfqLabel}>
                Awarded
              </Text>
            </View>
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
  sectionTitle: {
    color: '#666',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complianceValue: {
    fontWeight: '600',
  },
  subtext: {
    color: '#888',
    marginTop: 4,
  },
  rfqGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rfqItem: {
    alignItems: 'center',
  },
  rfqNumber: {
    fontWeight: '600',
  },
  rfqLabel: {
    color: '#666',
    marginTop: 2,
  },
});

export default EngineeringProgressWidget;
