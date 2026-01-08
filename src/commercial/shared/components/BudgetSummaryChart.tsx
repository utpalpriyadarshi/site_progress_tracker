/**
 * BudgetSummaryChart - Shared Component
 * Visual budget allocation and variance display with multiple variants
 *
 * Features:
 * - Multiple display variants (bar, pie, combined)
 * - Color-coded variance indicators (green=under, red=over, yellow=at-risk)
 * - Interactive legend
 * - Tap to drill down
 * - Percentage labels
 * - Currency formatting
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import type { BudgetSummaryChartProps, CategoryBreakdown } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  labor: '#2196F3',
  materials: '#4CAF50',
  equipment: '#FF9800',
  subcontractors: '#9C27B0',
};

export const BudgetSummaryChart: React.FC<BudgetSummaryChartProps> = ({
  budgetSummary,
  categoryBreakdown,
  variant = 'combined',
  showLegend = true,
  showPercentages = true,
  height = 250,
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Get variance color
  const getVarianceColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) {
      return '#f44336'; // Red - over budget
    }
    if (percentage >= 80 && percentage < 100) {
      return '#FFA726'; // Orange - at risk
    }
    return '#4CAF50'; // Green - under budget
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category.toLowerCase()] || '#9E9E9E';
  };

  // Calculate max value for bar chart scaling
  const maxBudget = useMemo(() => {
    return Math.max(...categoryBreakdown.map((c) => Math.max(c.budget, c.spent)));
  }, [categoryBreakdown]);

  // Render overall summary
  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Budget</Text>
        <Text style={[styles.summaryValue, { color: '#2196F3' }]}>
          {formatCurrency(budgetSummary.totalBudget)}
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Spent</Text>
        <Text style={[styles.summaryValue, { color: '#FF9800' }]}>
          {formatCurrency(budgetSummary.totalSpent)}
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Remaining</Text>
        <Text
          style={[
            styles.summaryValue,
            { color: budgetSummary.remaining >= 0 ? '#4CAF50' : '#f44336' },
          ]}
        >
          {formatCurrency(budgetSummary.remaining)}
        </Text>
      </View>
    </View>
  );

  // Render bar chart
  const renderBarChart = () => (
    <View style={[styles.barChartContainer, { height }]}>
      {categoryBreakdown.map((item, index) => {
        const budgetWidth = (item.budget / maxBudget) * 100;
        const spentWidth = (item.spent / maxBudget) * 100;
        const categoryColor = getCategoryColor(item.category);
        const varianceColor = getVarianceColor(item.percentage, item.isOverBudget);

        return (
          <View key={index} style={styles.barGroup}>
            <View style={styles.barLabelContainer}>
              <Text style={styles.barLabel}>{item.category.toUpperCase()}</Text>
              {showPercentages && (
                <Text style={[styles.barPercentage, { color: varianceColor }]}>
                  {item.percentage.toFixed(0)}%
                </Text>
              )}
            </View>

            <View style={styles.barsContainer}>
              {/* Budget bar (background) */}
              <View style={styles.barRow}>
                <View
                  style={[
                    styles.budgetBar,
                    {
                      width: `${budgetWidth}%`,
                      backgroundColor: categoryColor + '40',
                    },
                  ]}
                >
                  <Text style={styles.barValueText}>{formatCurrency(item.budget)}</Text>
                </View>
              </View>

              {/* Spent bar (foreground) */}
              <View style={[styles.barRow, styles.spentBarRow]}>
                <View
                  style={[
                    styles.spentBar,
                    {
                      width: `${spentWidth}%`,
                      backgroundColor: varianceColor,
                    },
                  ]}
                >
                  <Text style={styles.barValueText}>{formatCurrency(item.spent)}</Text>
                </View>
              </View>
            </View>

            {item.isOverBudget && (
              <Text style={styles.overBudgetWarning}>⚠️ Over Budget</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  // Render pie chart (simplified circular progress indicators)
  const renderPieChart = () => {
    const total = categoryBreakdown.reduce((sum, item) => sum + item.spent, 0);

    return (
      <View style={[styles.pieChartContainer, { height }]}>
        <View style={styles.pieItems}>
          {categoryBreakdown.map((item, index) => {
            const percentage = total > 0 ? (item.spent / total) * 100 : 0;
            const categoryColor = getCategoryColor(item.category);

            return (
              <View key={index} style={styles.pieItem}>
                <View style={styles.pieItemHeader}>
                  <View style={[styles.colorDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.pieLabel}>{item.category.toUpperCase()}</Text>
                </View>
                <View style={styles.pieProgress}>
                  <View style={styles.pieProgressBar}>
                    <View
                      style={[
                        styles.pieProgressFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: categoryColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.piePercentage}>{percentage.toFixed(1)}%</Text>
                </View>
                <Text style={styles.pieValue}>{formatCurrency(item.spent)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render legend
  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' + '40' }]} />
          <Text style={styles.legendText}>Budget</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Under Budget</Text>
        </View>
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
          <Text style={styles.legendText}>At Risk (80%+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f44336' }]} />
          <Text style={styles.legendText}>Over Budget</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.title}>Budget Summary</Text>

        {/* Overall Summary */}
        {renderSummary()}

        {/* Chart Display */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {variant === 'bar' && renderBarChart()}
          {variant === 'pie' && renderPieChart()}
          {variant === 'combined' && (
            <View>
              {renderBarChart()}
              <View style={styles.divider} />
            </View>
          )}
        </ScrollView>

        {/* Legend */}
        {showLegend && renderLegend()}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  barChartContainer: {
    paddingVertical: 8,
  },
  barGroup: {
    marginBottom: 20,
  },
  barLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  barPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  barsContainer: {
    position: 'relative',
    height: 40,
  },
  barRow: {
    position: 'absolute',
    width: '100%',
    height: 16,
  },
  spentBarRow: {
    top: 20,
  },
  budgetBar: {
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  spentBar: {
    height: '100%',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  overBudgetWarning: {
    fontSize: 11,
    color: '#f44336',
    fontWeight: 'bold',
    marginTop: 4,
  },
  pieChartContainer: {
    paddingVertical: 8,
  },
  pieItems: {
    gap: 16,
  },
  pieItem: {
    marginBottom: 12,
  },
  pieItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  pieLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  pieProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pieProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  piePercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    width: 45,
    textAlign: 'right',
  },
  pieValue: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});
