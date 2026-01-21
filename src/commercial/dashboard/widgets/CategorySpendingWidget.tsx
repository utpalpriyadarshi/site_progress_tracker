import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { CATEGORY_COLORS, getCategoryLabel, getCategoryColor } from '../utils/dashboardConstants';

/**
 * CategorySpendingWidget Component
 *
 * Displays spending breakdown by category with:
 * - Horizontal bar chart by category
 * - Top 5 categories with "Others" aggregation
 * - Budget vs actual comparison
 * - Tap on category to filter CostTracking
 * - Accessible chart description
 *
 * @example
 * ```tsx
 * <CategorySpendingWidget
 *   categories={[
 *     { category: 'labor', budget: 100000, spent: 80000 },
 *     { category: 'material', budget: 150000, spent: 140000 },
 *   ]}
 *   onPress={() => navigation.navigate('CostTracking')}
 *   onCategoryPress={(cat) => navigation.navigate('CostTracking', { filter: cat })}
 * />
 * ```
 */

export interface CategorySpendingData {
  /** Category identifier */
  category: string;
  /** Budgeted amount for category */
  budget: number;
  /** Actual spent amount */
  spent: number;
}

export interface CategorySpendingWidgetProps {
  /** Category spending data */
  categories: CategorySpendingData[];
  /** Maximum categories to show (rest aggregated as "Others") */
  maxCategories?: number;
  /** Handler for widget tap */
  onPress?: () => void;
  /** Handler for category tap (to filter by category) */
  onCategoryPress?: (category: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Period label */
  periodLabel?: string;
}

export const CategorySpendingWidget: React.FC<CategorySpendingWidgetProps> = ({
  categories,
  maxCategories = 5,
  onPress,
  onCategoryPress,
  loading = false,
  error = null,
  periodLabel,
}) => {
  // Process categories: sort by spent amount, aggregate "Others"
  const { displayCategories, totalSpent, maxSpent } = useMemo(() => {
    if (!categories.length) {
      return { displayCategories: [], totalSpent: 0, maxSpent: 0 };
    }

    // Sort by spent amount (descending)
    const sorted = [...categories].sort((a, b) => b.spent - a.spent);

    let display: CategorySpendingData[];
    if (sorted.length > maxCategories) {
      // Take top N-1 and aggregate rest as "Others"
      const topCategories = sorted.slice(0, maxCategories - 1);
      const others = sorted.slice(maxCategories - 1);

      const othersAggregated: CategorySpendingData = {
        category: 'others',
        budget: others.reduce((sum, c) => sum + c.budget, 0),
        spent: others.reduce((sum, c) => sum + c.spent, 0),
      };

      display = [...topCategories, othersAggregated];
    } else {
      display = sorted;
    }

    const total = display.reduce((sum, c) => sum + c.spent, 0);
    const max = Math.max(...display.map((c) => Math.max(c.spent, c.budget)));

    return {
      displayCategories: display,
      totalSpent: total,
      maxSpent: max,
    };
  }, [categories, maxCategories]);

  const isEmpty = categories.length === 0 || totalSpent === 0;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const accessibilityLabel = useMemo(() => {
    if (isEmpty) return 'Category spending widget, no spending data';

    const parts = [`Spending by category, total ${formatCurrency(totalSpent)}`];
    displayCategories.forEach((cat) => {
      const label = getCategoryLabel(cat.category);
      const percentage = ((cat.spent / totalSpent) * 100).toFixed(0);
      const status = cat.spent > cat.budget ? 'over budget' : 'within budget';
      parts.push(`${label}: ${formatCurrency(cat.spent)}, ${percentage} percent, ${status}`);
    });

    return parts.join('. ');
  }, [isEmpty, totalSpent, displayCategories]);

  const renderCategoryBar = (data: CategorySpendingData, index: number) => {
    const { category, budget, spent } = data;
    const label = getCategoryLabel(category);
    const color = getCategoryColor(category);
    const isOverBudget = spent > budget;
    const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;

    // Calculate bar widths relative to max value
    const spentWidth = maxSpent > 0 ? (spent / maxSpent) * 100 : 0;
    const budgetWidth = maxSpent > 0 ? (budget / maxSpent) * 100 : 0;

    const isClickable = onCategoryPress && category !== 'others';

    const content = (
      <View style={styles.categoryItem}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryLabelRow}>
            <View style={[styles.categoryDot, { backgroundColor: color }]} />
            <Text style={styles.categoryLabel}>{label}</Text>
            <Text style={styles.categoryPercentage}>{percentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={[styles.spentValue, isOverBudget && styles.overBudgetValue]}>
              {formatCurrency(spent)}
            </Text>
            {budget > 0 && (
              <Text style={styles.budgetValue}>/ {formatCurrency(budget)}</Text>
            )}
          </View>
        </View>

        {/* Bar Visualization */}
        <View style={styles.barContainer}>
          {/* Budget bar (background) */}
          {budget > 0 && (
            <View
              style={[
                styles.budgetBar,
                { width: `${budgetWidth}%` },
              ]}
            />
          )}
          {/* Spent bar (foreground) */}
          <View
            style={[
              styles.spentBar,
              {
                width: `${spentWidth}%`,
                backgroundColor: isOverBudget ? '#ff6b6b' : color,
              },
            ]}
          />
        </View>

        {/* Over budget indicator */}
        {isOverBudget && (
          <Text style={styles.overBudgetText}>
            +{formatCurrency(spent - budget)} over budget
          </Text>
        )}
      </View>
    );

    if (isClickable) {
      return (
        <TouchableOpacity
          key={category}
          onPress={() => onCategoryPress(category)}
          accessibilityRole="button"
          accessibilityLabel={`${label}, spent ${formatCurrency(spent)}${budget > 0 ? ` of ${formatCurrency(budget)} budget` : ''}. Tap to filter costs.`}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return <View key={category}>{content}</View>;
  };

  return (
    <BaseWidget
      title="Spending by Category"
      subtitle={periodLabel}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="No spending data recorded"
      emptyIcon="📊"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view cost tracking"
      headerRight={
        totalSpent > 0 ? (
          <Text style={styles.totalSpent}>{formatCurrency(totalSpent)}</Text>
        ) : null
      }
    >
      <View style={styles.content}>
        {displayCategories.map((cat, index) => renderCategoryBar(cat, index))}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, styles.legendSpent]} />
            <Text style={styles.legendText}>Actual</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, styles.legendBudget]} />
            <Text style={styles.legendText}>Budget</Text>
          </View>
        </View>
      </View>
    </BaseWidget>
  );
};

const styles = StyleSheet.create({
  content: {},
  totalSpent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 11,
    color: '#999',
    marginLeft: 6,
  },
  categoryValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  overBudgetValue: {
    color: '#ff6b6b',
  },
  budgetValue: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  barContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  budgetBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  spentBar: {
    height: '100%',
    borderRadius: 4,
  },
  overBudgetText: {
    fontSize: 10,
    color: '#ff6b6b',
    marginTop: 4,
    textAlign: 'right',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendBar: {
    width: 16,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendSpent: {
    backgroundColor: '#2196F3',
  },
  legendBudget: {
    backgroundColor: '#e0e0e0',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});
