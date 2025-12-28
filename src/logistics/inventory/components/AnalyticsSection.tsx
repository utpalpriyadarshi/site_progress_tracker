import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { InventoryHealth, InventoryItem, ABCCategory } from '../../../services/InventoryOptimizationService';
import { getABCColor, formatCurrencyM } from '../utils';

interface AnalyticsSectionProps {
  inventoryHealth: InventoryHealth | null;
  items: InventoryItem[];
  totalValue: number;
}

/**
 * AnalyticsSection Component
 *
 * Displays comprehensive inventory analytics:
 * - Overall health score and metrics
 * - Carrying costs analysis
 * - ABC category breakdown
 * - Actionable recommendations
 *
 * Extracted from InventoryManagementScreen.tsx Phase 4.
 */
export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  inventoryHealth,
  items,
  totalValue,
}) => {
  if (!inventoryHealth) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Loading analytics...</Text>
      </View>
    );
  }

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getRecommendationColor = (type: string): string => {
    switch (type) {
      case 'reduce':
        return '#ef4444';
      case 'increase':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  return (
    <ScrollView style={styles.scroll}>
      {/* Health Score */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory Health</Text>
        <View style={styles.healthContainer}>
          <View
            style={[
              styles.healthCircle,
              {
                borderColor: getHealthScoreColor(inventoryHealth.overallHealthScore),
              },
            ]}
          >
            <Text
              style={[
                styles.healthValue,
                { color: getHealthScoreColor(inventoryHealth.overallHealthScore) },
              ]}
            >
              {inventoryHealth.overallHealthScore.toFixed(0)}
            </Text>
            <Text style={styles.healthLabel}>Score</Text>
          </View>
          <View style={styles.healthMetrics}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Turnover Rate:</Text>
              <Text style={styles.metricValue}>
                {inventoryHealth.overallTurnoverRate.toFixed(1)}x ({inventoryHealth.turnoverHealth})
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Stockout Risk:</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: inventoryHealth.stockoutRisk > 20 ? '#ef4444' : '#10b981' },
                ]}
              >
                {inventoryHealth.stockoutRisk.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Overstock Risk:</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: inventoryHealth.overstockRisk > 20 ? '#f59e0b' : '#10b981' },
                ]}
              >
                {inventoryHealth.overstockRisk.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Obsolescence:</Text>
              <Text style={styles.metricValue}>
                {inventoryHealth.obsolescenceRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Carrying Costs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carrying Costs</Text>
        <View style={styles.costGrid}>
          <View style={styles.costCard}>
            <Text style={styles.costValue}>
              {formatCurrencyM(inventoryHealth.carryingCost)}
            </Text>
            <Text style={styles.costLabel}>Annual Cost</Text>
          </View>
          <View style={styles.costCard}>
            <Text style={styles.costValue}>{inventoryHealth.carryingCostPercentage}%</Text>
            <Text style={styles.costLabel}>% of Value</Text>
          </View>
        </View>
      </View>

      {/* ABC Analysis Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABC Analysis Summary</Text>
        {(['A', 'B', 'C'] as ABCCategory[]).map(category => {
          const categoryItems = items.filter(item => item.abcCategory === category);
          const categoryValue = categoryItems.reduce((sum, item) => sum + item.totalValue, 0);
          const percentOfTotal = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;

          return (
            <View key={category} style={styles.abcRow}>
              <View
                style={[
                  styles.abcBadge,
                  { backgroundColor: getABCColor(category) },
                ]}
              >
                <Text style={styles.abcBadgeText}>{category}</Text>
              </View>
              <View style={styles.abcDetails}>
                <Text style={styles.abcText}>
                  {categoryItems.length} items • ₹{(categoryValue / 1000).toFixed(0)}K (
                  {percentOfTotal.toFixed(0)}%)
                </Text>
                <View style={styles.abcBar}>
                  <View
                    style={[
                      styles.abcBarFill,
                      {
                        width: `${percentOfTotal}%`,
                        backgroundColor: getABCColor(category),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Recommendations */}
      {inventoryHealth.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {inventoryHealth.recommendations.slice(0, 5).map((rec, index) => (
            <View key={index} style={styles.recommendationCard}>
              <View
                style={[
                  styles.recommendationType,
                  { backgroundColor: getRecommendationColor(rec.type) },
                ]}
              >
                <Text style={styles.recommendationTypeText}>
                  {rec.type.toUpperCase()}
                </Text>
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationMaterial}>{rec.materialName}</Text>
                <Text style={styles.recommendationReason}>{rec.reason}</Text>
                <Text style={styles.recommendationImpact}>{rec.expectedImpact}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  healthContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  healthCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  healthValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  healthLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  healthMetrics: {
    flex: 1,
    gap: 8,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  costGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  costCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  abcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  abcBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abcBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  abcDetails: {
    flex: 1,
  },
  abcText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  },
  abcBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  abcBarFill: {
    height: '100%',
  },
  recommendationCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  recommendationType: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  recommendationTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  recommendationContent: {
    flex: 1,
    gap: 4,
  },
  recommendationMaterial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  recommendationReason: {
    fontSize: 12,
    color: '#6b7280',
  },
  recommendationImpact: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
  },
});
