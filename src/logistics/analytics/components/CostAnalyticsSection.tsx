/**
 * CostAnalyticsSection Component
 *
 * Displays cost breakdown, cost trends, and procurement bundle opportunities
 * Phase 4: Major Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Text alternatives for cost visualization bars
 * - Proper accessibility labels for interactive elements
 * - Screen reader descriptions for financial data
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  CostOptimizationResult,
  ProcurementBundle,
} from '../../../services/CostOptimizationService';
import { CostTrendAnalysis } from '../../../services/PredictiveAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { MetricBox } from './MetricBox';
import { TrendIndicator } from './TrendIndicator';
import { COLORS } from '../../../theme/colors';

interface CostAnalyticsSectionProps {
  costOptimization: CostOptimizationResult | null;
  costTrends: CostTrendAnalysis[];
  procurementBundles: ProcurementBundle[];
  onShowDetail: (detail: any, type: string) => void;
}

export const CostAnalyticsSection: React.FC<CostAnalyticsSectionProps> = ({
  costOptimization,
  costTrends,
  procurementBundles,
  onShowDetail,
}) => {
  const getVolatilityColor = (volatility: string): string => {
    switch (volatility) {
      case 'low':
        return COLORS.SUCCESS;
      case 'medium':
        return COLORS.WARNING;
      case 'high':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  return (
    <View>
      {/* Cost Breakdown */}
      {costOptimization && (
        <AnalyticsCard title="Cost Breakdown">
          <View
            style={styles.costBreakdown}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Cost breakdown: Materials ${costOptimization.currentCosts.costPercentages.materials}% at $${(costOptimization.currentCosts.materialCosts / 1000).toFixed(0)}K, Transportation ${costOptimization.currentCosts.costPercentages.transportation}% at $${(costOptimization.currentCosts.transportationCosts / 1000).toFixed(0)}K, Storage ${costOptimization.currentCosts.costPercentages.storage}% at $${(costOptimization.currentCosts.storageCosts / 1000).toFixed(0)}K`}
          >
            <View style={styles.costItem} accessible={false}>
              <Text style={styles.costLabel}>Materials</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.materials}%`,
                      backgroundColor: COLORS.INFO,
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.materialCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.materials}%)
              </Text>
            </View>
            <View style={styles.costItem} accessible={false}>
              <Text style={styles.costLabel}>Transportation</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.transportation}%`,
                      backgroundColor: COLORS.WARNING,
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.transportationCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.transportation}%)
              </Text>
            </View>
            <View style={styles.costItem} accessible={false}>
              <Text style={styles.costLabel}>Storage</Text>
              <View style={styles.costBar}>
                <View
                  style={[
                    styles.costBarFill,
                    {
                      width: `${costOptimization.currentCosts.costPercentages.storage}%`,
                      backgroundColor: COLORS.SUCCESS,
                    },
                  ]}
                />
              </View>
              <Text style={styles.costValue}>
                ${(costOptimization.currentCosts.storageCosts / 1000).toFixed(0)}K (
                {costOptimization.currentCosts.costPercentages.storage}%)
              </Text>
            </View>
          </View>
        </AnalyticsCard>
      )}

      {/* Cost Trends */}
      <AnalyticsCard title="Cost Trend Analysis">
        {costTrends.map((trend, index) => (
          <TouchableOpacity
            key={index}
            style={styles.trendItem}
            onPress={() => onShowDetail(trend, 'cost')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${trend.materialName}: current cost $${trend.currentCost.toFixed(0)}, ${trend.volatility} volatility, trend ${trend.trend.direction} ${Math.abs(trend.trend.growthRate).toFixed(1)}%, budget impact ${trend.budgetImpact.projectedCostIncrease > 0 ? 'increase' : 'decrease'} ${Math.abs(trend.budgetImpact.projectedCostIncrease).toFixed(1)}%`}
            accessibilityHint="Double tap to view cost trend details"
          >
            <View style={styles.trendHeader}>
              <Text style={styles.trendMaterial}>{trend.materialName}</Text>
              <Badge
                text={`${trend.volatility} volatility`}
                backgroundColor={getVolatilityColor(trend.volatility)}
              />
            </View>
            <View style={styles.trendMetrics}>
              <MetricBox label="Current" value={`$${trend.currentCost.toFixed(0)}`} />
              <MetricBox label="Trend">
                <TrendIndicator
                  direction={trend.trend.direction}
                  value={trend.trend.growthRate}
                  showValue
                />
              </MetricBox>
              <MetricBox
                label="Budget Impact"
                value={`${trend.budgetImpact.projectedCostIncrease > 0 ? '+' : ''}${trend.budgetImpact.projectedCostIncrease.toFixed(1)}%`}
                valueColor={trend.budgetImpact.projectedCostIncrease > 0 ? '#FF6B6B' : COLORS.SUCCESS}
              />
            </View>
          </TouchableOpacity>
        ))}
      </AnalyticsCard>

      {/* Procurement Bundles */}
      {procurementBundles.length > 0 && (
        <AnalyticsCard title="Procurement Bundle Opportunities">
          {procurementBundles.map((bundle, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bundleItem}
              onPress={() => onShowDetail(bundle, 'bundle')}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${bundle.name}: potential savings $${(bundle.savings / 1000).toFixed(1)}K, ${bundle.savingsPercentage.toFixed(1)}%, ${bundle.materials.length} materials, ${bundle.materials.reduce((sum, m) => sum + m.quantity, 0)} total units${bundle.feasible ? ', marked as feasible' : ''}`}
              accessibilityHint="Double tap to view bundle details"
            >
              <View style={styles.bundleHeader}>
                <Text style={styles.bundleName}>{bundle.name}</Text>
                <Text style={styles.bundleSavings}>
                  Save ${(bundle.savings / 1000).toFixed(1)}K ({bundle.savingsPercentage.toFixed(1)}%)
                </Text>
              </View>
              <Text style={styles.bundleMaterials}>
                {bundle.materials.length} materials • {bundle.materials.reduce((sum, m) => sum + m.quantity, 0)} total units
              </Text>
              {bundle.feasible && (
                <Badge text="Feasible" variant="success" style={{ marginTop: 8 }} />
              )}
            </TouchableOpacity>
          ))}
        </AnalyticsCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  costBreakdown: {
    marginTop: 8,
  },
  costItem: {
    marginBottom: 16,
  },
  costLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  costBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  costBarFill: {
    height: '100%',
  },
  costValue: {
    fontSize: 12,
    color: '#212121',
  },
  trendItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  trendMetrics: {
    flexDirection: 'row',
  },
  bundleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  bundleSavings: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  bundleMaterials: {
    fontSize: 12,
    color: '#666',
  },
});
