/**
 * DoorsPackageWidget
 *
 * Displays DOORS package status: package counts by status,
 * requirements fulfillment, and recent packages.
 *
 * WCAG 2.1 AA Accessibility:
 * - Screen reader announcements on data load
 * - Proper accessibility labels and roles
 * - Semantic structure for screen readers
 *
 * @version 1.1.0
 * @since Logistics Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useDoorsPackageData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helper ====================

function getStatusBadgeType(status: string): 'pending' | 'in_transit' | 'delivered' | 'default' {
  switch (status) {
    case 'draft':
      return 'pending';
    case 'in_progress':
    case 'pending':
    case 'review':
      return 'in_transit';
    case 'completed':
    case 'approved':
      return 'delivered';
    default:
      return 'default';
  }
}

// ==================== Component ====================

export const DoorsPackageWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useDoorsPackageData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  const requirementsFulfillmentRate = data && data.requirementsTotal > 0
    ? Math.round((data.requirementsFulfilled / data.requirementsTotal) * 100)
    : 100;

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      announce(`DOORS packages loaded: ${data.totalPackages} total packages, ${data.completedCount} completed, ${requirementsFulfillmentRate}% requirements fulfilled`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, requirementsFulfillmentRate, announce]);

  const accessibilityLabel = data
    ? `DOORS packages: ${data.totalPackages} total, ${data.completedCount} completed, ${data.inProgressCount} in progress`
    : 'DOORS packages loading';

  const isEmpty = !loading && !error && (!data || data.totalPackages === 0);

  return (
    <BaseWidget
      title="DOORS Packages"
      icon="door"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'door-open',
        title: 'No DOORS Packages',
        message: 'Create your first DOORS package to start.',
        actionLabel: 'Create Package',
        onAction: () => {
          // Navigate to create package
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Summary Row */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: '#9E9E9E' }]}>
                {data.draftCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Draft
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: '#2196F3' }]}>
                {data.inProgressCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                In Progress
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text variant="headlineMedium" style={[styles.summaryValue, { color: '#4CAF50' }]}>
                {data.completedCount}
              </Text>
              <Text variant="labelSmall" style={styles.summaryLabel}>
                Completed
              </Text>
            </View>
          </View>

          {/* Requirements Fulfillment */}
          <View style={styles.fulfillmentSection}>
            <View style={styles.fulfillmentHeader}>
              <Text variant="labelMedium" style={styles.fulfillmentLabel}>
                Requirements ({data.requirementsFulfilled}/{data.requirementsTotal})
              </Text>
              <Text variant="titleMedium" style={[styles.fulfillmentValue, {
                color: requirementsFulfillmentRate >= 80 ? '#4CAF50' : requirementsFulfillmentRate >= 50 ? '#FF9800' : '#F44336'
              }]}>
                {requirementsFulfillmentRate}%
              </Text>
            </View>
            <ProgressBar
              progress={requirementsFulfillmentRate / 100}
              color={requirementsFulfillmentRate >= 80 ? '#4CAF50' : requirementsFulfillmentRate >= 50 ? '#FF9800' : '#F44336'}
              style={styles.progressBar}
            />
          </View>

          {/* Recent Packages */}
          {data.recentPackages.length > 0 && (
            <View style={styles.recentSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Recent Packages
              </Text>
              <View style={styles.packagesList}>
                {data.recentPackages.slice(0, 3).map((pkg) => (
                  <View key={pkg.id} style={styles.packageItem}>
                    <View style={styles.packageInfo}>
                      <Text variant="bodySmall" style={styles.packageNumber}>
                        {pkg.packageNumber}
                      </Text>
                      <Text variant="labelSmall" style={styles.packageDesc} numberOfLines={1}>
                        {pkg.description}
                      </Text>
                    </View>
                    <View style={styles.packageMeta}>
                      <StatusBadge
                        status={getStatusBadgeType(pkg.status)}
                        label={pkg.status.replace(/_/g, ' ')}
                        size="small"
                      />
                      <Text variant="labelSmall" style={styles.requirementsCount}>
                        {pkg.requirementsCount} req
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      )}
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
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontWeight: '700',
  },
  summaryLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  fulfillmentSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  fulfillmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fulfillmentLabel: {
    opacity: 0.7,
  },
  fulfillmentValue: {
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  recentSection: {
    paddingTop: 4,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  packagesList: {
    gap: 8,
  },
  packageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  packageInfo: {
    flex: 1,
    marginRight: 8,
  },
  packageNumber: {
    fontWeight: '600',
  },
  packageDesc: {
    opacity: 0.6,
    marginTop: 2,
  },
  packageMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  requirementsCount: {
    opacity: 0.6,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  emptyText: {
    opacity: 0.6,
  },
});

export default DoorsPackageWidget;
