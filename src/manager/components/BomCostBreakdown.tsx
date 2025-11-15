import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BomCalculatorService from '../../services/BomCalculatorService';

/**
 * BomCostBreakdown
 *
 * Simple visual breakdown component for displaying cost categories
 *
 * Features:
 * - Horizontal stacked bar chart
 * - Color-coded categories
 * - Percentage display
 * - Category legend
 */

interface BomCostBreakdownProps {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
}

const BomCostBreakdown: React.FC<BomCostBreakdownProps> = ({
  materialCost,
  laborCost,
  equipmentCost,
  subcontractorCost,
}) => {
  const totalCost = materialCost + laborCost + equipmentCost + subcontractorCost;

  const categories = [
    {
      name: 'Material',
      cost: materialCost,
      color: '#2196F3',
      percentage: totalCost > 0 ? (materialCost / totalCost) * 100 : 0,
    },
    {
      name: 'Labor',
      cost: laborCost,
      color: '#4CAF50',
      percentage: totalCost > 0 ? (laborCost / totalCost) * 100 : 0,
    },
    {
      name: 'Equipment',
      cost: equipmentCost,
      color: '#FF9800',
      percentage: totalCost > 0 ? (equipmentCost / totalCost) * 100 : 0,
    },
    {
      name: 'Subcontractor',
      cost: subcontractorCost,
      color: '#9C27B0',
      percentage: totalCost > 0 ? (subcontractorCost / totalCost) * 100 : 0,
    },
  ].filter((cat) => cat.cost > 0); // Only show categories with cost

  if (totalCost === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No cost data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stacked Bar Chart */}
      <View style={styles.barContainer}>
        {categories.map((cat, index) => (
          <View
            key={cat.name}
            style={[
              styles.barSegment,
              {
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
                borderTopLeftRadius: index === 0 ? 8 : 0,
                borderBottomLeftRadius: index === 0 ? 8 : 0,
                borderTopRightRadius: index === categories.length - 1 ? 8 : 0,
                borderBottomRightRadius: index === categories.length - 1 ? 8 : 0,
              },
            ]}
          >
            {cat.percentage > 10 && (
              <Text style={styles.barLabel}>
                {BomCalculatorService.formatPercentage(cat.percentage, 0)}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {categories.map((cat) => (
          <View key={cat.name} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: cat.color }]} />
            <View style={styles.legendText}>
              <Text style={styles.legendName}>{cat.name}</Text>
              <Text style={styles.legendValue}>
                {BomCalculatorService.formatCurrency(cat.cost)} (
                {BomCalculatorService.formatPercentage(cat.percentage, 1)})
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Cost:</Text>
        <Text style={styles.totalValue}>{BomCalculatorService.formatCurrency(totalCost)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  barContainer: {
    flexDirection: 'row',
    height: 40,
    marginBottom: 16,
    overflow: 'hidden',
  },
  barSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  barLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  legend: {
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 13,
    color: '#666',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default BomCostBreakdown;
