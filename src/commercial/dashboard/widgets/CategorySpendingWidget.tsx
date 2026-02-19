import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { BaseWidget } from './BaseWidget';
import { CATEGORY_COLORS, getCategoryLabel, getCategoryColor } from '../utils/dashboardConstants';
import { OptionsMenuItem, chartOptionMenus } from './InteractiveChart';
import { COLORS } from '../../../theme/colors';

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
  /** Handler for category long press (to show options menu) */
  onCategoryLongPress?: (category: CategorySpendingData) => void;
  /** Handler for export category data */
  onExportCategory?: (category: string) => void;
  /** Handler for hide category from chart */
  onHideCategory?: (category: string) => void;
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
  onCategoryLongPress,
  onExportCategory,
  onHideCategory,
  loading = false,
  error = null,
  periodLabel,
}) => {
  // State for options menu
  const [optionsMenu, setOptionsMenu] = useState<{
    visible: boolean;
    category: CategorySpendingData | null;
  }>({
    visible: false,
    category: null,
  });

  // Handle long press on category
  const handleCategoryLongPress = useCallback(
    (data: CategorySpendingData) => {
      if (data.category === 'others') return; // Don't show menu for aggregated "Others"

      setOptionsMenu({
        visible: true,
        category: data,
      });
      onCategoryLongPress?.(data);
    },
    [onCategoryLongPress]
  );

  // Close options menu
  const closeOptionsMenu = useCallback(() => {
    setOptionsMenu({
      visible: false,
      category: null,
    });
  }, []);

  // Options menu items for category
  const getOptionsMenuItems = useCallback(
    (category: CategorySpendingData): OptionsMenuItem[] => {
      const items: OptionsMenuItem[] = [
        chartOptionMenus.filterByThis(() => {
          closeOptionsMenu();
          onCategoryPress?.(category.category);
        }),
        chartOptionMenus.viewDetails(() => {
          closeOptionsMenu();
          onCategoryPress?.(category.category);
        }),
      ];

      if (onExportCategory) {
        items.push(
          chartOptionMenus.exportData(() => {
            closeOptionsMenu();
            onExportCategory(category.category);
          })
        );
      }

      if (onHideCategory) {
        items.push(
          chartOptionMenus.hideFromChart(() => {
            closeOptionsMenu();
            onHideCategory(category.category);
          })
        );
      }

      return items;
    },
    [onCategoryPress, onExportCategory, onHideCategory, closeOptionsMenu]
  );
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
          onLongPress={() => handleCategoryLongPress(data)}
          delayLongPress={500}
          accessibilityRole="button"
          accessibilityLabel={`${label}, spent ${formatCurrency(spent)}${budget > 0 ? ` of ${formatCurrency(budget)} budget` : ''}. Tap to filter costs. Long press for options.`}
          accessibilityHint="Double tap to filter, long press for more options"
        >
          {content}
        </TouchableOpacity>
      );
    }

    return <View key={category}>{content}</View>;
  };

  // Render options menu modal
  const renderOptionsMenu = () => {
    if (!optionsMenu.category) return null;

    const menuItems = getOptionsMenuItems(optionsMenu.category);
    const categoryLabel = getCategoryLabel(optionsMenu.category.category);

    return (
      <Modal
        visible={optionsMenu.visible}
        transparent
        animationType="slide"
        onRequestClose={closeOptionsMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeOptionsMenu}>
          <View style={styles.optionsMenuContainer}>
            <View style={styles.optionsMenu}>
              {/* Header */}
              <View style={styles.optionsMenuHeader}>
                <View
                  style={[
                    styles.optionsMenuColorDot,
                    { backgroundColor: getCategoryColor(optionsMenu.category.category) },
                  ]}
                />
                <View style={styles.optionsMenuHeaderText}>
                  <Text style={styles.optionsMenuTitle}>{categoryLabel}</Text>
                  <Text style={styles.optionsMenuSubtitle}>
                    {formatCurrency(optionsMenu.category.spent)}
                    {optionsMenu.category.budget > 0 &&
                      ` / ${formatCurrency(optionsMenu.category.budget)}`}
                  </Text>
                </View>
              </View>

              {/* Menu Items */}
              <ScrollView style={styles.optionsMenuItems}>
                {menuItems.map((menuItem) => (
                  <TouchableOpacity
                    key={menuItem.id}
                    style={styles.optionsMenuItem}
                    onPress={menuItem.onPress}
                    accessibilityRole="menuitem"
                    accessibilityLabel={menuItem.label}
                  >
                    {menuItem.icon && (
                      <Text style={styles.optionsMenuItemIcon}>{menuItem.icon}</Text>
                    )}
                    <Text
                      style={[
                        styles.optionsMenuItemLabel,
                        menuItem.destructive && styles.optionsMenuItemDestructive,
                      ]}
                    >
                      {menuItem.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.optionsMenuCancel}
                onPress={closeOptionsMenu}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.optionsMenuCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };

  return (
    <>
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
        accessibilityHint="Tap to view cost tracking. Long press on a category for more options."
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

      {/* Options Menu Modal */}
      {renderOptionsMenu()}
    </>
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
    backgroundColor: COLORS.INFO,
  },
  legendBudget: {
    backgroundColor: '#e0e0e0',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  // Options menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  optionsMenuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '60%',
  },
  optionsMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  optionsMenuColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  optionsMenuHeaderText: {
    flex: 1,
  },
  optionsMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  optionsMenuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  optionsMenuItems: {
    maxHeight: 300,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionsMenuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionsMenuItemLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionsMenuItemDestructive: {
    color: '#ff3b30',
  },
  optionsMenuCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  optionsMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
