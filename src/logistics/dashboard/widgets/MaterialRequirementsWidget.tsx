/**
 * MaterialRequirementsWidget
 *
 * Displays material requirements from BOM: fulfillment status,
 * shortages, and critical items list.
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
import { useMaterialRequirementsData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';
import { COLORS } from '../../../theme/colors';

// ==================== Component ====================

export const MaterialRequirementsWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useMaterialRequirementsData();
  const { announce } = useAccessibility();
  const hasAnnouncedRef = useRef(false);

  // Announce data changes to screen reader
  useEffect(() => {
    if (!loading && data && !hasAnnouncedRef.current) {
      const shortageAlert = data.shortageCount > 0
        ? `, ${data.shortageCount} material shortages detected`
        : ', no shortages';
      announce(`Material requirements loaded: ${data.fulfillmentRate}% fulfilled${shortageAlert}`);
      hasAnnouncedRef.current = true;
    }
    if (loading) {
      hasAnnouncedRef.current = false;
    }
  }, [loading, data, announce]);

  const accessibilityLabel = data
    ? `Material requirements: ${data.fulfillmentRate}% fulfilled, ${data.shortageCount} shortages`
    : 'Material requirements loading';

  const totalRequirements = data ? (data.fulfilledCount + data.partialCount + data.shortageCount) : 0;
  const isEmpty = !loading && !error && (!data || totalRequirements === 0);

  return (
    <BaseWidget
      title="Material Requirements"
      icon="clipboard-check-outline"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={{
        icon: 'clipboard-text-outline',
        title: 'No BOM Requirements',
        message: 'Link materials to BOM to track requirements.',
        actionLabel: 'Link BOM',
        onAction: () => {
          // Navigate to link BOM
        },
      }}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={accessibilityLabel}
    >
      {data && (
        <View style={styles.container}>
          {/* Fulfillment Rate */}
          <View style={styles.rateSection}>
            <View style={styles.rateHeader}>
              <Text variant="labelMedium" style={styles.rateLabel}>
                BOM Fulfillment
              </Text>
              <Text variant="headlineMedium" style={[styles.rateValue, {
                color: data.fulfillmentRate >= 90 ? COLORS.SUCCESS : data.fulfillmentRate >= 70 ? COLORS.WARNING : COLORS.ERROR
              }]}>
                {data.fulfillmentRate}%
              </Text>
            </View>
            <ProgressBar
              progress={data.fulfillmentRate / 100}
              color={data.fulfillmentRate >= 90 ? COLORS.SUCCESS : data.fulfillmentRate >= 70 ? COLORS.WARNING : COLORS.ERROR}
              style={styles.progressBar}
            />
          </View>

          {/* Status Summary */}
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Icon name="check-circle" size={20} color={COLORS.SUCCESS} />
              <Text variant="bodyMedium" style={styles.statusValue}>
                {data.fulfilledCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                Fulfilled
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="progress-clock" size={20} color={COLORS.WARNING} />
              <Text variant="bodyMedium" style={styles.statusValue}>
                {data.partialCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                Partial
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="alert-circle" size={20} color={COLORS.ERROR} />
              <Text variant="bodyMedium" style={styles.statusValue}>
                {data.shortageCount}
              </Text>
              <Text variant="labelSmall" style={styles.statusLabel}>
                Shortage
              </Text>
            </View>
          </View>

          {/* Critical Shortages */}
          {data.criticalShortages.length > 0 && (
            <View style={styles.shortagesSection}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Critical Shortages
              </Text>
              <View style={styles.shortagesList}>
                {data.criticalShortages.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.shortageItem}>
                    <View style={styles.shortageInfo}>
                      <Text variant="bodySmall" style={styles.materialName} numberOfLines={1}>
                        {item.materialName}
                      </Text>
                      <Text variant="labelSmall" style={styles.shortageDetails}>
                        Need {item.requiredQuantity} {item.unit}, have {item.availableQuantity}
                      </Text>
                    </View>
                    <StatusBadge
                      status="error"
                      label={`-${item.shortfall}`}
                      size="small"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty state for no shortages */}
          {data.criticalShortages.length === 0 && data.shortageCount === 0 && (
            <View style={styles.noShortages}>
              <Icon name="check-circle-outline" size={24} color={COLORS.SUCCESS} />
              <Text variant="bodySmall" style={styles.noShortagesText}>
                All materials are adequately stocked
              </Text>
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
  rateSection: {
    marginBottom: 4,
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
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusItem: {
    alignItems: 'center',
    gap: 2,
  },
  statusValue: {
    fontWeight: '600',
  },
  statusLabel: {
    opacity: 0.6,
    fontSize: 10,
  },
  shortagesSection: {
    paddingTop: 4,
  },
  sectionLabel: {
    opacity: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  shortagesList: {
    gap: 8,
  },
  shortageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING_BG,
    padding: 8,
    borderRadius: 8,
  },
  shortageInfo: {
    flex: 1,
    marginRight: 8,
  },
  materialName: {
    fontWeight: '500',
  },
  shortageDetails: {
    opacity: 0.7,
    marginTop: 2,
  },
  noShortages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.SUCCESS_BG,
    borderRadius: 8,
  },
  noShortagesText: {
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },
});

export default MaterialRequirementsWidget;
