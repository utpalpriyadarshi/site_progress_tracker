/**
 * OptimizationSection Component
 *
 * Displays optimization recommendations including quick wins, strategic initiatives,
 * transportation and storage optimization
 * Phase 4: Major Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Proper accessibility labels for recommendations
 * - Screen reader descriptions for savings data
 * - Clear labels for optimization strategies
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  CostOptimizationResult,
  TransportationOptimization,
  StorageOptimization,
} from '../../../services/CostOptimizationService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { MetricBox } from './MetricBox';
import { COLORS } from '../../../theme/colors';

interface OptimizationSectionProps {
  costOptimization: CostOptimizationResult | null;
  transportationOpt: TransportationOptimization | null;
  storageOpt: StorageOptimization | null;
}

export const OptimizationSection: React.FC<OptimizationSectionProps> = ({
  costOptimization,
  transportationOpt,
  storageOpt,
}) => {
  const getEffortColor = (effort: string): string => {
    switch (effort) {
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
      {/* Quick Wins */}
      {costOptimization && costOptimization.quickWins.length > 0 && (
        <AnalyticsCard title="Quick Wins (Low Effort, High Impact)">
          {costOptimization.quickWins.map((rec, index) => (
            <View
              key={index}
              style={styles.recommendationItem}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Quick win: ${rec.action}. ${rec.rationale}. Expected savings $${(rec.expectedSavings / 1000).toFixed(0)}K. Timeline: ${rec.timeline}`}
            >
              <View style={styles.recommendationHeader}>
                <Icon name="flash-on" size={20} color="#FFD700" />
                <Text style={styles.recommendationAction}>{rec.action}</Text>
              </View>
              <Text style={styles.recommendationRationale}>{rec.rationale}</Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationSavings}>
                  Savings: ${(rec.expectedSavings / 1000).toFixed(0)}K
                </Text>
                <Text style={styles.recommendationTimeline}>Timeline: {rec.timeline}</Text>
              </View>
            </View>
          ))}
        </AnalyticsCard>
      )}

      {/* Strategic Initiatives */}
      {costOptimization && costOptimization.strategicInitiatives.length > 0 && (
        <AnalyticsCard title="Strategic Initiatives">
          {costOptimization.strategicInitiatives.map((rec, index) => (
            <View
              key={index}
              style={styles.recommendationItem}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Strategic initiative: ${rec.action}. ${rec.rationale}. Expected savings $${(rec.expectedSavings / 1000).toFixed(0)}K. ${rec.effort} effort required`}
            >
              <View style={styles.recommendationHeader}>
                <Icon name="trending-up" size={20} color={COLORS.INFO} />
                <Text style={styles.recommendationAction}>{rec.action}</Text>
              </View>
              <Text style={styles.recommendationRationale}>{rec.rationale}</Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationSavings}>
                  Savings: ${(rec.expectedSavings / 1000).toFixed(0)}K
                </Text>
                <Badge
                  text={`${rec.effort} effort`}
                  backgroundColor={getEffortColor(rec.effort)}
                />
              </View>
            </View>
          ))}
        </AnalyticsCard>
      )}

      {/* Transportation Optimization */}
      {transportationOpt && (
        <AnalyticsCard title="Transportation Optimization">
          <View
            style={styles.optimizationSummary}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Transportation optimization: Current costs $${(transportationOpt.currentCosts / 1000).toFixed(0)}K, Optimized costs $${(transportationOpt.optimizedCosts / 1000).toFixed(0)}K, Potential savings $${(transportationOpt.savings / 1000).toFixed(0)}K or ${transportationOpt.savingsPercentage.toFixed(1)}%`}
          >
            <MetricBox
              label="Current Costs"
              value={`$${(transportationOpt.currentCosts / 1000).toFixed(0)}K`}
            />
            <MetricBox
              label="Optimized Costs"
              value={`$${(transportationOpt.optimizedCosts / 1000).toFixed(0)}K`}
            />
            <MetricBox
              label="Potential Savings"
              value={`$${(transportationOpt.savings / 1000).toFixed(0)}K (${transportationOpt.savingsPercentage.toFixed(1)}%)`}
              valueColor={COLORS.SUCCESS}
            />
          </View>
          {transportationOpt.strategies.map((strategy, index) => (
            <View
              key={index}
              style={styles.strategyItem}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Strategy: ${strategy.strategy}. ${strategy.description}. Savings $${(strategy.savings / 1000).toFixed(0)}K`}
            >
              <Text style={styles.strategyName}>{strategy.strategy}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
              <Text style={styles.strategySavings}>
                Savings: ${(strategy.savings / 1000).toFixed(0)}K
              </Text>
            </View>
          ))}
        </AnalyticsCard>
      )}

      {/* Storage Optimization */}
      {storageOpt && (
        <AnalyticsCard title="Storage Optimization">
          <View
            style={styles.optimizationSummary}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Storage optimization: ${storageOpt.utilizationRate.toFixed(0)}% utilization, Current costs $${(storageOpt.currentCosts / 1000).toFixed(0)}K, Potential savings $${(storageOpt.savings / 1000).toFixed(0)}K`}
          >
            <MetricBox
              label="Utilization"
              value={`${storageOpt.utilizationRate.toFixed(0)}%`}
            />
            <MetricBox
              label="Current Costs"
              value={`$${(storageOpt.currentCosts / 1000).toFixed(0)}K`}
            />
            <MetricBox
              label="Potential Savings"
              value={`$${(storageOpt.savings / 1000).toFixed(0)}K`}
              valueColor={COLORS.SUCCESS}
            />
          </View>
          {storageOpt.opportunities.map((opp, index) => (
            <View
              key={index}
              style={styles.opportunityItem}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Opportunity: ${opp.description}. Savings $${(opp.savings / 1000).toFixed(0)}K`}
            >
              <Text style={styles.opportunityDescription}>{opp.description}</Text>
              <Text style={styles.opportunityValue}>
                Savings: ${(opp.savings / 1000).toFixed(0)}K
              </Text>
            </View>
          ))}
        </AnalyticsCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recommendationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationAction: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    flex: 1,
  },
  recommendationRationale: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationSavings: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  recommendationTimeline: {
    fontSize: 12,
    color: '#999',
  },
  optimizationSummary: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  strategyItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  strategyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  strategySavings: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
  opportunityItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  opportunityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  opportunityValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },
});
