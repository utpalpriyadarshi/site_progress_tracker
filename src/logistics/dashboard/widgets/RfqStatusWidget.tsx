/**
 * RfqStatusWidget
 *
 * Displays RFQ (Request for Quote) status: counts by status,
 * response metrics, and recent RFQs.
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
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useRfqStatusData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';
import { COLORS } from '../../../theme/colors';

// ==================== Helper ====================

function getStatusBadgeType(status: string): 'pending' | 'in_transit' | 'delivered' | 'error' | 'default' {
  switch (status) {
    case 'draft':
      return 'default';
    case 'sent':
    case 'pending':
      return 'pending';
    case 'responded':
    case 'quoted':
      return 'in_transit';
    case 'awarded':
    case 'completed':
      return 'delivered';
    case 'expired':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
}

function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== Component ====================

export const RfqStatusWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useRfqStatusData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      const pendingInfo = data.sentCount > 0 ? `, ${data.sentCount} awaiting response` : '';
      const awardedInfo = data.awardedCount > 0 ? `, ${data.awardedCount} awarded` : '';
      announce(`RFQ status loaded: ${data.totalCount} total RFQs${pendingInfo}${awardedInfo}`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `RFQ status: ${data.totalCount} total, ${data.sentCount} sent, ${data.respondedCount} responded, ${data.awardedCount} awarded`
    : 'RFQ status loading';

  const isEmpty = !loading && !error && (!data || data.totalCount === 0);

  return (
    <BaseWidget
      title="RFQ Status"
      icon="file-document-outline"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'file-document-outline',
        title: 'No RFQs Created',
        message: 'Create your first RFQ to get vendor quotes.',
        actionLabel: 'Create RFQ',
        onAction: () => {
          // Navigate to create RFQ
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Status Flow */}
          <View style={styles.statusFlow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusCircle, { backgroundColor: '#E0E0E0' }]}>
                <Text variant="labelLarge" style={styles.statusCount}>{data.draftCount}</Text>
              </View>
              <Text variant="labelSmall" style={styles.statusLabel}>Draft</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#BDBDBD" />
            <View style={styles.statusItem}>
              <View style={[styles.statusCircle, { backgroundColor: COLORS.WARNING_BG }]}>
                <Text variant="labelLarge" style={[styles.statusCount, { color: '#E65100' }]}>
                  {data.sentCount}
                </Text>
              </View>
              <Text variant="labelSmall" style={styles.statusLabel}>Sent</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#BDBDBD" />
            <View style={styles.statusItem}>
              <View style={[styles.statusCircle, { backgroundColor: COLORS.INFO_BG }]}>
                <Text variant="labelLarge" style={[styles.statusCount, { color: '#1565C0' }]}>
                  {data.respondedCount}
                </Text>
              </View>
              <Text variant="labelSmall" style={styles.statusLabel}>Quoted</Text>
            </View>
            <Icon name="chevron-right" size={16} color="#BDBDBD" />
            <View style={styles.statusItem}>
              <View style={[styles.statusCircle, { backgroundColor: COLORS.SUCCESS_BG }]}>
                <Text variant="labelLarge" style={[styles.statusCount, { color: '#2E7D32' }]}>
                  {data.awardedCount}
                </Text>
              </View>
              <Text variant="labelSmall" style={styles.statusLabel}>Awarded</Text>
            </View>
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>Total RFQs</Text>
              <Text variant="titleMedium" style={styles.metricValue}>{data.totalCount}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>Avg Response</Text>
              <Text variant="titleMedium" style={styles.metricValue}>
                {data.avgResponseTime > 0 ? `${data.avgResponseTime}d` : '-'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text variant="labelSmall" style={styles.metricLabel}>Expired</Text>
              <Text variant="titleMedium" style={[styles.metricValue, data.expiredCount > 0 && { color: COLORS.ERROR }]}>
                {data.expiredCount}
              </Text>
            </View>
          </View>

          {/* Recent RFQs */}
          {data.recentRfqs.length > 0 && (
            <View style={styles.recentSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Recent RFQs
              </Text>
              <View style={styles.rfqList}>
                {data.recentRfqs.slice(0, 3).map((rfq) => (
                  <View key={rfq.id} style={styles.rfqItem}>
                    <View style={styles.rfqInfo}>
                      <Text variant="bodySmall" style={styles.rfqTitle} numberOfLines={1}>
                        {rfq.title}
                      </Text>
                      <Text variant="labelSmall" style={styles.rfqNumber}>
                        {rfq.rfqNumber} | {rfq.vendorCount} vendors
                      </Text>
                    </View>
                    <View style={styles.rfqMeta}>
                      <StatusBadge
                        status={getStatusBadgeType(rfq.status)}
                        label={rfq.status}
                        size="small"
                      />
                      {rfq.dueDate && (
                        <Text variant="labelSmall" style={styles.rfqDue}>
                          Due: {formatDate(rfq.dueDate)}
                        </Text>
                      )}
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
  statusFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusItem: {
    alignItems: 'center',
    gap: 4,
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCount: {
    fontWeight: '700',
  },
  statusLabel: {
    opacity: 0.6,
    fontSize: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  recentSection: {
    paddingTop: 4,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  rfqList: {
    gap: 8,
  },
  rfqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  rfqInfo: {
    flex: 1,
    marginRight: 8,
  },
  rfqTitle: {
    fontWeight: '500',
  },
  rfqNumber: {
    opacity: 0.6,
    marginTop: 2,
  },
  rfqMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rfqDue: {
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

export default RfqStatusWidget;
