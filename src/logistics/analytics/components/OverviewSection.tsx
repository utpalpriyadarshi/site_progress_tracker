/**
 * OverviewSection Component
 *
 * Displays analytics overview with health score, insights, risks, and opportunities
 * Phase 4: Major Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Proper accessibility labels for health score and metrics
 * - Screen reader descriptions for risks and opportunities
 * - Clear labels for all data visualizations
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnalyticsSummary } from '../../../services/PredictiveAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { HealthScoreCircle } from './HealthScoreCircle';
import { InsightItem } from './InsightItem';
import { COLORS } from '../../../theme/colors';

interface OverviewSectionProps {
  analyticsSummary: AnalyticsSummary | null;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ analyticsSummary }) => {
  if (!analyticsSummary) {
    return null;
  }

  const getHealthColor = (rating: string): string => {
    switch (rating) {
      case 'excellent':
        return COLORS.SUCCESS;
      case 'good':
        return '#8BC34A';
      case 'fair':
        return COLORS.WARNING;
      case 'poor':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical':
        return COLORS.ERROR;
      case 'high':
        return COLORS.WARNING;
      case 'medium':
        return COLORS.INFO;
      case 'low':
        return COLORS.SUCCESS;
      default:
        return '#999';
    }
  };

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
      {/* Health Score */}
      <AnalyticsCard title="Logistics Health Score">
        <View
          style={styles.healthScoreContainer}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Logistics health score: ${analyticsSummary.healthScore} out of 100, rated ${analyticsSummary.healthRating}. Forecast accuracy ${analyticsSummary.metrics.forecastAccuracy.toFixed(0)}%, Cost stability ${analyticsSummary.metrics.costStability.toFixed(0)}%, Supply reliability ${analyticsSummary.metrics.supplyReliability.toFixed(0)}%`}
        >
          <HealthScoreCircle
            score={analyticsSummary.healthScore}
            color={getHealthColor(analyticsSummary.healthRating)}
          />
          <View style={styles.healthMetrics}>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Forecast Accuracy</Text>
              <Text style={styles.healthMetricValue}>
                {analyticsSummary.metrics.forecastAccuracy.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Cost Stability</Text>
              <Text style={styles.healthMetricValue}>
                {analyticsSummary.metrics.costStability.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.healthMetric}>
              <Text style={styles.healthMetricLabel}>Supply Reliability</Text>
              <Text style={styles.healthMetricValue}>
                {analyticsSummary.metrics.supplyReliability.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
        <Badge
          text={analyticsSummary.healthRating.toUpperCase()}
          backgroundColor={getHealthColor(analyticsSummary.healthRating)}
        />
      </AnalyticsCard>

      {/* Key Insights */}
      {analyticsSummary.insights.length > 0 && (
        <AnalyticsCard title="Key Insights">
          {analyticsSummary.insights.slice(0, 3).map((insight, index) => (
            <InsightItem
              key={index}
              title={insight.title}
              description={insight.description}
              recommendation={insight.recommendation}
              severity={insight.severity}
            />
          ))}
        </AnalyticsCard>
      )}

      {/* Risks */}
      {analyticsSummary.risks.length > 0 && (
        <AnalyticsCard title="Risk Alerts">
          {analyticsSummary.risks.map((risk, index) => (
            <View
              key={index}
              style={styles.riskItem}
              accessible
              accessibilityRole="alert"
              accessibilityLabel={`Risk alert: ${risk.riskType.replace(/_/g, ' ')}, ${risk.impact} impact. ${risk.description}. Mitigation: ${risk.mitigation}. Timeline: ${risk.timeline}`}
            >
              <View style={styles.riskHeader}>
                <Icon name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.riskType}>
                  {risk.riskType.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Badge
                  text={risk.impact}
                  backgroundColor={getImpactColor(risk.impact)}
                />
              </View>
              <Text style={styles.riskDescription}>{risk.description}</Text>
              <Text style={styles.riskMitigation}>Mitigation: {risk.mitigation}</Text>
              <Text style={styles.riskTimeline}>Timeline: {risk.timeline}</Text>
            </View>
          ))}
        </AnalyticsCard>
      )}

      {/* Opportunities */}
      {analyticsSummary.opportunities.length > 0 && (
        <AnalyticsCard title="Cost Savings Opportunities">
          {analyticsSummary.opportunities.map((opp, index) => (
            <View
              key={index}
              style={styles.opportunityItem}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Cost savings opportunity: $${(opp.value / 1000).toFixed(0)}K potential. ${opp.description}. Timeline: ${opp.timeline}. ${opp.effort} effort required`}
            >
              <View style={styles.opportunityHeader}>
                <Icon name="trending-up" size={20} color={COLORS.SUCCESS} />
                <Text style={styles.opportunityValue}>
                  ${(opp.value / 1000).toFixed(0)}K
                </Text>
              </View>
              <Text style={styles.opportunityDescription}>{opp.description}</Text>
              <View style={styles.opportunityFooter}>
                <Text style={styles.opportunityTimeline}>{opp.timeline}</Text>
                <Badge
                  text={`${opp.effort} effort`}
                  backgroundColor={getEffortColor(opp.effort)}
                />
              </View>
            </View>
          ))}
        </AnalyticsCard>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthMetrics: {
    flex: 1,
    marginLeft: 16,
  },
  healthMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthMetricLabel: {
    fontSize: 13,
    color: '#666',
  },
  healthMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
  },
  riskItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    flex: 1,
  },
  riskDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  riskMitigation: {
    fontSize: 12,
    color: COLORS.INFO,
    marginBottom: 2,
  },
  riskTimeline: {
    fontSize: 12,
    color: '#999',
  },
  opportunityItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  opportunityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.SUCCESS,
    marginLeft: 8,
  },
  opportunityDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opportunityTimeline: {
    fontSize: 12,
    color: '#999',
  },
});
