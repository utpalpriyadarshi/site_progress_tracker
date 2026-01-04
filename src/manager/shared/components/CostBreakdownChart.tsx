import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * CostBreakdownChart
 *
 * Visual cost breakdown component with horizontal stacked bar and legend
 *
 * Features:
 * - Horizontal stacked bar chart
 * - Color-coded categories
 * - Percentage display
 * - Budget comparison (actual vs. planned)
 * - Interactive legend
 * - Touchable category segments
 * - Variance indicators
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <CostBreakdownChart
 *   data={{
 *     material: 500000,
 *     labor: 300000,
 *     equipment: 150000,
 *     subcontractor: 50000,
 *   }}
 *   totalBudget={1200000}
 *   showPercentages={true}
 *   showLegend={true}
 *   onCategoryPress={(category) => console.log('Pressed:', category)}
 * />
 * ```
 */

export interface CostBreakdownData {
  material: number;
  labor: number;
  equipment: number;
  subcontractor: number;
}

interface CostBreakdownChartProps {
  data: CostBreakdownData;
  totalBudget?: number;
  showPercentages?: boolean;
  showLegend?: boolean;
  height?: number;
  compact?: boolean;
  onCategoryPress?: (category: string) => void;
}

interface CategoryConfig {
  key: keyof CostBreakdownData;
  label: string;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'material', label: 'Material', color: '#2196F3' },
  { key: 'labor', label: 'Labor', color: '#4CAF50' },
  { key: 'equipment', label: 'Equipment', color: '#FF9800' },
  { key: 'subcontractor', label: 'Subcontractor', color: '#9C27B0' },
];

const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  data,
  totalBudget,
  showPercentages = true,
  showLegend = true,
  height = 40,
  compact = false,
  onCategoryPress,
}) => {
  const totalCost = data.material + data.labor + data.equipment + data.subcontractor;

  const formatCurrency = (value: number) => {
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculatePercentage = (value: number) => {
    if (totalCost === 0) return 0;
    return (value / totalCost) * 100;
  };

  const getBudgetVariance = () => {
    if (!totalBudget) return null;
    const variance = totalCost - totalBudget;
    const variancePercent = (variance / totalBudget) * 100;
    return {
      amount: variance,
      percent: variancePercent,
      isOver: variance > 0,
    };
  };

  const variance = getBudgetVariance();

  const handleCategoryPress = (category: string) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    }
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Header with Total and Variance */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Total Cost</Text>
          <Text style={styles.headerValue}>{formatCurrency(totalCost)}</Text>
        </View>
        {totalBudget && variance && (
          <View style={styles.varianceContainer}>
            <Text style={styles.varianceLabel}>
              {variance.isOver ? 'Over Budget' : 'Under Budget'}
            </Text>
            <Text
              style={[
                styles.varianceValue,
                variance.isOver ? styles.varianceOver : styles.varianceUnder,
              ]}
            >
              {variance.isOver ? '+' : ''}
              {formatCurrency(Math.abs(variance.amount))} ({formatPercentage(Math.abs(variance.percent))})
            </Text>
          </View>
        )}
      </View>

      {/* Stacked Bar Chart */}
      <View style={[styles.barContainer, { height }]}>
        {CATEGORIES.map((category) => {
          const value = data[category.key];
          const percentage = calculatePercentage(value);

          // Only show segment if percentage > 0.5% to avoid clutter
          if (percentage < 0.5) return null;

          return (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.barSegment,
                { flex: percentage, backgroundColor: category.color },
              ]}
              onPress={() => handleCategoryPress(category.key)}
              activeOpacity={onCategoryPress ? 0.7 : 1}
              disabled={!onCategoryPress}
            >
              {showPercentages && percentage > 3 && (
                <Text style={styles.segmentLabel}>{formatPercentage(percentage)}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Budget Reference Line */}
      {totalBudget && (
        <View style={styles.budgetLineContainer}>
          <View style={styles.budgetLine} />
          <Text style={styles.budgetLabel}>Budget: {formatCurrency(totalBudget)}</Text>
        </View>
      )}

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          {CATEGORIES.map((category) => {
            const value = data[category.key];
            const percentage = calculatePercentage(value);

            return (
              <TouchableOpacity
                key={category.key}
                style={styles.legendItem}
                onPress={() => handleCategoryPress(category.key)}
                activeOpacity={onCategoryPress ? 0.7 : 1}
                disabled={!onCategoryPress}
              >
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <View style={styles.legendTextContainer}>
                  <Text style={styles.legendLabel}>{category.label}</Text>
                  <Text style={styles.legendValue}>
                    {formatCurrency(value)} ({formatPercentage(percentage)})
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerCompact: {
    padding: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  headerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  varianceContainer: {
    alignItems: 'flex-end',
  },
  varianceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  varianceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  varianceOver: {
    color: '#F44336',
  },
  varianceUnder: {
    color: '#4CAF50',
  },
  barContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 4,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  budgetLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  budgetLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#000',
    borderStyle: 'dashed',
    marginRight: 8,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  legend: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 13,
    color: '#666',
  },
});

export default CostBreakdownChart;
