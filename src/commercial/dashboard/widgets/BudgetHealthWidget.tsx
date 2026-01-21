import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { TrendIndicator } from './TrendIndicator';

/**
 * BudgetHealthWidget Component
 *
 * Displays budget utilization with:
 * - Circular progress indicator
 * - Color-coded status (green/yellow/red based on thresholds)
 * - Tap to navigate to BudgetManagement screen
 * - Trend indicator showing change from last period
 * - Accessible value announcements
 *
 * @example
 * ```tsx
 * <BudgetHealthWidget
 *   totalBudget={500000}
 *   totalSpent={375000}
 *   percentageUsed={75}
 *   previousPeriodPercentage={68}
 *   onPress={() => navigation.navigate('BudgetManagement')}
 * />
 * ```
 */

export interface BudgetHealthWidgetProps {
  /** Total allocated budget */
  totalBudget: number;
  /** Total amount spent */
  totalSpent: number;
  /** Percentage of budget used */
  percentageUsed: number;
  /** Previous period percentage for trend comparison */
  previousPeriodPercentage?: number;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Period label (e.g., "MTD", "YTD") */
  periodLabel?: string;
}

// Thresholds for status colors
const THRESHOLD_GOOD = 70;
const THRESHOLD_WARNING = 90;

type BudgetStatus = 'good' | 'warning' | 'danger';

const getStatusColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'good':
      return '#4CAF50';
    case 'warning':
      return '#FF9800';
    case 'danger':
      return '#ff6b6b';
  }
};

const getStatusLabel = (status: BudgetStatus): string => {
  switch (status) {
    case 'good':
      return 'On Track';
    case 'warning':
      return 'Caution';
    case 'danger':
      return 'Over Budget';
  }
};

export const BudgetHealthWidget: React.FC<BudgetHealthWidgetProps> = ({
  totalBudget,
  totalSpent,
  percentageUsed,
  previousPeriodPercentage,
  onPress,
  loading = false,
  error = null,
  periodLabel,
}) => {
  const { status, remaining, statusColor, statusLabel } = useMemo(() => {
    let budgetStatus: BudgetStatus;
    if (percentageUsed > 100) {
      budgetStatus = 'danger';
    } else if (percentageUsed > THRESHOLD_WARNING) {
      budgetStatus = 'warning';
    } else if (percentageUsed > THRESHOLD_GOOD) {
      budgetStatus = 'warning';
    } else {
      budgetStatus = 'good';
    }

    return {
      status: budgetStatus,
      remaining: totalBudget - totalSpent,
      statusColor: getStatusColor(budgetStatus),
      statusLabel: getStatusLabel(budgetStatus),
    };
  }, [totalBudget, totalSpent, percentageUsed]);

  const isEmpty = totalBudget === 0;

  const accessibilityLabel = useMemo(() => {
    if (isEmpty) return 'Budget health widget, no budget data available';

    const parts = [
      `Budget health: ${statusLabel}`,
      `${percentageUsed.toFixed(1)} percent used`,
      `$${totalSpent.toLocaleString()} spent of $${totalBudget.toLocaleString()} total`,
      remaining >= 0
        ? `$${remaining.toLocaleString()} remaining`
        : `$${Math.abs(remaining).toLocaleString()} over budget`,
    ];
    return parts.join('. ');
  }, [isEmpty, statusLabel, percentageUsed, totalSpent, totalBudget, remaining]);

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Calculate progress for circular indicator (max 100%)
  const progressPercent = Math.min(percentageUsed, 100);
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <BaseWidget
      title="Budget Health"
      subtitle={periodLabel}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No budget data available"
      emptyIcon="💰"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view budget details"
    >
      <View style={styles.content}>
        {/* Circular Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.circularProgress}>
            {/* Background Circle */}
            <View style={[styles.circleBackground, { borderColor: '#f0f0f0' }]} />

            {/* Progress Arc (simplified with border) */}
            <View
              style={[
                styles.circleProgress,
                {
                  borderColor: statusColor,
                  borderTopColor: 'transparent',
                  borderRightColor: progressPercent > 25 ? statusColor : 'transparent',
                  borderBottomColor: progressPercent > 50 ? statusColor : 'transparent',
                  borderLeftColor: progressPercent > 75 ? statusColor : 'transparent',
                  transform: [{ rotate: `${(progressPercent / 100) * 360 - 90}deg` }],
                },
              ]}
            />

            {/* Center Content */}
            <View style={styles.circleCenter}>
              <Text style={[styles.percentageText, { color: statusColor }]}>
                {percentageUsed.toFixed(0)}%
              </Text>
              <Text style={styles.usedLabel}>used</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Budget Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Budget</Text>
            <Text style={styles.detailValue}>{formatCurrency(totalBudget)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Spent</Text>
            <Text style={styles.detailValue}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={[styles.detailRow, styles.remainingRow]}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                styles.remainingValue,
                { color: remaining >= 0 ? '#4CAF50' : '#ff6b6b' },
              ]}
            >
              {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
            </Text>
          </View>

          {/* Trend Indicator */}
          {previousPeriodPercentage !== undefined && (
            <View style={styles.trendContainer}>
              <Text style={styles.trendLabel}>vs. last period</Text>
              <TrendIndicator
                value={percentageUsed}
                previousValue={previousPeriodPercentage}
                format="percentage"
                invertColors // For budget usage, lower is better
                size="small"
              />
            </View>
          )}
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  progressContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  circularProgress: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleBackground: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
  },
  circleProgress: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
  },
  circleCenter: {
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  usedLabel: {
    fontSize: 11,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  remainingRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
    paddingTop: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remainingValue: {
    fontWeight: 'bold',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 11,
    color: '#999',
    marginRight: 6,
  },
});
