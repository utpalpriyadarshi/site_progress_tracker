/**
 * EquipmentMaterialsWidget
 *
 * Displays equipment and materials progress including PM300/PM400,
 * purchase orders status, and delivery tracking.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useEquipmentMaterialsData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helpers ====================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

// ==================== Component ====================

export const EquipmentMaterialsWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useEquipmentMaterialsData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const message = `Equipment and materials updated: PM300 at ${data.pm300Progress}%, PM400 at ${data.pm400Progress}%, ${data.totalPOs} purchase orders, ${data.delayedDeliveries} delayed deliveries`;
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
      title="Equipment & Materials"
      icon="package-variant"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Equipment and materials: PM300 at ${data?.pm300Progress || 0}%, PM400 at ${data?.pm400Progress || 0}%`}
    >
      <View style={styles.container}>
        {/* PM300 - Procurement */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM300 - Procurement
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleSmall" style={styles.progressValue}>
                {data?.pm300Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm300Status || 'not_started')}
                label={getStatusLabel(data?.pm300Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm300Progress || 0) / 100}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {/* PM400 - Manufacturing */}
        <View style={styles.milestoneSection}>
          <View style={styles.milestoneHeader}>
            <Text variant="labelMedium" style={styles.label}>
              PM400 - Manufacturing
            </Text>
            <View style={styles.milestoneRight}>
              <Text variant="titleSmall" style={styles.progressValue}>
                {data?.pm400Progress || 0}%
              </Text>
              <StatusBadge
                status={getStatusBadgeType(data?.pm400Status || 'not_started')}
                label={getStatusLabel(data?.pm400Status || 'not_started')}
                size="small"
              />
            </View>
          </View>
          <ProgressBar
            progress={(data?.pm400Progress || 0) / 100}
            color={theme.colors.secondary}
            style={styles.progressBar}
          />
        </View>

        {/* Purchase Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="labelMedium" style={styles.sectionTitle}>
              Purchase Orders ({data?.totalPOs || 0})
            </Text>
            <Text variant="titleSmall" style={styles.totalValue}>
              {formatCurrency(data?.totalPOValue || 0)}
            </Text>
          </View>
          <View style={styles.poGrid}>
            <View style={styles.poItem}>
              <Text variant="titleSmall" style={styles.poNumber}>
                {data?.posDraft || 0}
              </Text>
              <Text variant="bodySmall" style={styles.poLabel}>Draft</Text>
            </View>
            <View style={styles.poItem}>
              <Text variant="titleSmall" style={styles.poNumber}>
                {data?.posIssued || 0}
              </Text>
              <Text variant="bodySmall" style={styles.poLabel}>Issued</Text>
            </View>
            <View style={styles.poItem}>
              <Text variant="titleSmall" style={styles.poNumber}>
                {data?.posInProgress || 0}
              </Text>
              <Text variant="bodySmall" style={styles.poLabel}>In Prog</Text>
            </View>
            <View style={styles.poItem}>
              <Text variant="titleSmall" style={[styles.poNumber, { color: '#2E7D32' }]}>
                {data?.posDelivered || 0}
              </Text>
              <Text variant="bodySmall" style={styles.poLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Delivery Status */}
        <View style={styles.deliverySection}>
          <View style={styles.badgeRow}>
            <StatusBadge
              status="info"
              label={`${data?.upcomingDeliveries || 0} Upcoming`}
              size="small"
            />
            {(data?.delayedDeliveries || 0) > 0 && (
              <StatusBadge
                status="error"
                label={`${data?.delayedDeliveries} Delayed`}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#666',
  },
  totalValue: {
    fontWeight: '600',
    color: '#1565C0',
  },
  poGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  poItem: {
    alignItems: 'center',
  },
  poNumber: {
    fontWeight: '600',
  },
  poLabel: {
    color: '#666',
    marginTop: 2,
    fontSize: 11,
  },
  deliverySection: {
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

export default EquipmentMaterialsWidget;
