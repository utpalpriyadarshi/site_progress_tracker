/**
 * DeliveryStatusWidget
 *
 * Displays delivery status: pending, in-transit, completed,
 * and upcoming deliveries list.
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
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useDeliveryStatusData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helper ====================

function formatDate(timestamp: number): string {
  if (!timestamp) return 'TBD';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== Component ====================

export const DeliveryStatusWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useDeliveryStatusData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      const pendingAlert = data.pendingCount > 0
        ? `${data.pendingCount} pending, `
        : '';
      const inTransitAlert = data.inTransitCount > 0
        ? `${data.inTransitCount} in transit, `
        : '';
      announce(`Deliveries loaded: ${pendingAlert}${inTransitAlert}${data.onTimeRate}% on-time rate`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `Delivery status: ${data.pendingCount} pending, ${data.inTransitCount} in transit, ${data.deliveredCount} delivered`
    : 'Delivery status loading';

  const totalDeliveries = data ? (data.pendingCount + data.inTransitCount + data.deliveredCount) : 0;
  const isEmpty = !loading && !error && (!data || totalDeliveries === 0);

  return (
    <BaseWidget
      title="Delivery Status"
      icon="truck-delivery"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'truck-outline',
        title: 'No Deliveries Scheduled',
        message: 'Schedule your first delivery to start tracking.',
        actionLabel: 'Schedule Delivery',
        onAction: () => {
          // Navigate to schedule delivery
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Status Summary */}
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text variant="headlineMedium" style={[styles.statusValue, { color: '#FF9800' }]}>
                {data.pendingCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                Pending
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text variant="headlineMedium" style={[styles.statusValue, { color: '#2196F3' }]}>
                {data.inTransitCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                In Transit
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text variant="headlineMedium" style={[styles.statusValue, { color: '#4CAF50' }]}>
                {data.deliveredCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                Delivered
              </Text>
            </View>
          </View>

          {/* On-Time Rate */}
          <View style={styles.rateSection}>
            <View style={styles.rateHeader}>
              <Text variant="labelMedium" style={styles.rateLabel}>
                On-Time Delivery Rate
              </Text>
              <Text variant="titleMedium" style={[styles.rateValue, {
                color: data.onTimeRate >= 90 ? '#4CAF50' : data.onTimeRate >= 70 ? '#FF9800' : '#F44336'
              }]}>
                {data.onTimeRate}%
              </Text>
            </View>
            <ProgressBar
              progress={data.onTimeRate / 100}
              color={data.onTimeRate >= 90 ? '#4CAF50' : data.onTimeRate >= 70 ? '#FF9800' : '#F44336'}
              style={styles.progressBar}
            />
          </View>

          {/* Upcoming Deliveries */}
          {data.upcomingDeliveries.length > 0 && (
            <View style={styles.upcomingSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Upcoming Deliveries
              </Text>
              <View
                style={styles.deliveryList}
                accessible
                accessibilityRole="list"
                accessibilityLabel={`${data.upcomingDeliveries.length} upcoming deliveries`}
              >
                {data.upcomingDeliveries.slice(0, 3).map((delivery) => (
                  <View
                    key={delivery.id}
                    style={styles.deliveryItem}
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel={`${delivery.description}, from ${delivery.vendor || 'unknown vendor'}, ${delivery.status === 'in_transit' ? 'in transit' : 'pending'}, scheduled for ${formatDate(delivery.scheduledDate)}`}
                    accessibilityHint="Double tap to view delivery details"
                  >
                    <View style={styles.deliveryInfo}>
                      <Text variant="bodySmall" style={styles.deliveryDesc} numberOfLines={1}>
                        {delivery.description}
                      </Text>
                      <Text variant="labelSmall" style={styles.deliveryVendor} numberOfLines={1}>
                        {delivery.vendor || 'Unknown Vendor'}
                      </Text>
                    </View>
                    <View style={styles.deliveryMeta}>
                      <StatusBadge
                        status={delivery.status === 'in_transit' ? 'in_transit' : 'pending'}
                        label={delivery.status === 'in_transit' ? 'In Transit' : 'Pending'}
                        size="small"
                      />
                      <Text variant="labelSmall" style={styles.deliveryDate}>
                        {formatDate(delivery.scheduledDate)}
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontWeight: '700',
  },
  statusLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  rateSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateLabel: {
    opacity: 0.7,
  },
  rateValue: {
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  upcomingSection: {
    paddingTop: 8,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  deliveryList: {
    gap: 8,
  },
  deliveryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  deliveryInfo: {
    flex: 1,
    marginRight: 8,
  },
  deliveryDesc: {
    fontWeight: '500',
  },
  deliveryVendor: {
    opacity: 0.6,
    marginTop: 2,
  },
  deliveryMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  deliveryDate: {
    opacity: 0.6,
  },
});

export default DeliveryStatusWidget;
