/**
 * FinancialSummaryWidget
 *
 * Displays financial summary including budget overview,
 * profitability metrics, and BOM costs.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, ProgressBar } from 'react-native-paper';
import { BaseWidget } from './BaseWidget';
import { StatusBadge } from './StatusBadge';
import { useFinancialData } from '../hooks';
import { useAccessibility } from '../../../utils/accessibility';

// ==================== Helpers ====================

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

// ==================== Component ====================

export const FinancialSummaryWidget: React.FC = () => {
  const theme = useTheme();
  const { data, loading, error, refresh } = useFinancialData();
  const { announce } = useAccessibility();
  const previousDataRef = useRef(data);

  // Announce data changes for screen readers
  useEffect(() => {
    if (data && !loading && data !== previousDataRef.current) {
      const statusText = data.costStatus === 'over_budget' ? 'over budget' : data.costStatus === 'under_budget' ? 'under budget' : 'on budget';
      const message = `Financial summary updated: Budget ${data.budgetUtilization}% utilized, ${statusText}, ${formatCurrency(data.remainingBudget)} remaining`;
      announce(message);
      previousDataRef.current = data;
    }
  }, [data, loading, announce]);

  const getCostStatusType = (status: string) => {
    switch (status) {
      case 'under_budget':
        return 'success';
      case 'on_budget':
        return 'info';
      case 'over_budget':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCostStatusLabel = (status: string) => {
    switch (status) {
      case 'under_budget':
        return 'Under Budget';
      case 'on_budget':
        return 'On Budget';
      case 'over_budget':
        return 'Over Budget';
      default:
        return status;
    }
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage > 100) return theme.colors.error;
    if (percentage > 90) return '#F9A825';
    return theme.colors.primary;
  };

  return (
    <BaseWidget
      title="Financial Summary"
      icon="currency-usd"
      loading={loading}
      error={error}
      onRefresh={refresh}
      onRetry={refresh}
      accessibilityLabel={`Financial summary: Budget ${data?.budgetUtilization || 0}% utilized`}
    >
      <View style={styles.container}>
        {/* Budget Overview */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetHeader}>
            <Text variant="labelMedium" style={styles.label}>
              Project Budget
            </Text>
            <Text variant="titleMedium" style={styles.budgetValue}>
              {formatCurrency(data?.projectBudget || 0)}
            </Text>
          </View>
          <View style={styles.utilizationRow}>
            <Text variant="bodySmall" style={styles.subLabel}>
              Committed: {formatCurrency(data?.totalCommitted || 0)} ({data?.commitmentPercentage || 0}%)
            </Text>
          </View>
          <ProgressBar
            progress={Math.min((data?.commitmentPercentage || 0) / 100, 1)}
            color={getBudgetColor(data?.commitmentPercentage || 0)}
            style={styles.progressBar}
          />
          <View style={styles.budgetDetails}>
            <View style={styles.budgetItem}>
              <Text variant="bodySmall" style={styles.budgetLabel}>Spent</Text>
              <Text variant="titleSmall" style={styles.budgetAmount}>
                {formatCurrency(data?.totalSpent || 0)}
              </Text>
            </View>
            <View style={styles.budgetItem}>
              <Text variant="bodySmall" style={styles.budgetLabel}>Remaining</Text>
              <Text
                variant="titleSmall"
                style={[
                  styles.budgetAmount,
                  (data?.remainingBudget || 0) < 0 && { color: theme.colors.error }
                ]}
              >
                {formatCurrency(data?.remainingBudget || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusSection}>
          <StatusBadge
            status={getCostStatusType(data?.costStatus || 'on_budget')}
            label={getCostStatusLabel(data?.costStatus || 'on_budget')}
            size="medium"
          />
          {(data?.varianceAmount || 0) !== 0 && (
            <Text
              variant="bodySmall"
              style={[
                styles.varianceText,
                (data?.varianceAmount || 0) < 0 && { color: theme.colors.error }
              ]}
            >
              Variance: {formatCurrency(Math.abs(data?.varianceAmount || 0))}
              {' '}({data?.variancePercentage || 0}%)
            </Text>
          )}
        </View>

        {/* PO Breakdown */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            Purchase Order Value
          </Text>
          <View style={styles.poRow}>
            <View style={styles.poItem}>
              <Text variant="bodySmall" style={styles.poLabel}>Delivered</Text>
              <Text variant="titleSmall" style={[styles.poValue, { color: '#2E7D32' }]}>
                {formatCurrency(data?.poValueDelivered || 0)}
              </Text>
            </View>
            <View style={styles.poItem}>
              <Text variant="bodySmall" style={styles.poLabel}>Pending</Text>
              <Text variant="titleSmall" style={styles.poValue}>
                {formatCurrency(data?.poValuePending || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* BOM Summary */}
        <View style={styles.section}>
          <Text variant="labelMedium" style={styles.sectionTitle}>
            BOM Costs
          </Text>
          <View style={styles.bomRow}>
            <View style={styles.bomItem}>
              <Text variant="titleSmall" style={styles.bomValue}>
                {formatCurrency(data?.totalBomCost || 0)}
              </Text>
              <Text variant="bodySmall" style={styles.bomLabel}>
                Total BOM Cost
              </Text>
            </View>
            <View style={styles.bomItem}>
              <Text variant="titleSmall" style={styles.bomValue}>
                {data?.bomItemsCount || 0}
              </Text>
              <Text variant="bodySmall" style={styles.bomLabel}>
                Items
              </Text>
            </View>
            <View style={styles.bomItem}>
              <Text variant="titleSmall" style={styles.bomValue}>
                {formatCurrency(data?.averageBomItemCost || 0)}
              </Text>
              <Text variant="bodySmall" style={styles.bomLabel}>
                Avg Cost
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
  budgetSection: {
    marginBottom: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: '#666',
  },
  budgetValue: {
    fontWeight: '700',
    color: '#1565C0',
  },
  utilizationRow: {
    marginBottom: 8,
  },
  subLabel: {
    color: '#888',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    flex: 1,
  },
  budgetLabel: {
    color: '#666',
  },
  budgetAmount: {
    fontWeight: '600',
    marginTop: 2,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  varianceText: {
    color: '#666',
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
  poRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  poItem: {
    alignItems: 'center',
  },
  poLabel: {
    color: '#666',
    marginBottom: 2,
  },
  poValue: {
    fontWeight: '600',
  },
  bomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bomItem: {
    alignItems: 'center',
  },
  bomValue: {
    fontWeight: '600',
  },
  bomLabel: {
    color: '#666',
    marginTop: 2,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default FinancialSummaryWidget;
