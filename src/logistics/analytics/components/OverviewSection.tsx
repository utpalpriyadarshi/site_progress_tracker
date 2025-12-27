/**
 * OverviewSection Component
 *
 * Displays analytics overview with health score, insights, risks, and opportunities
 * Phase 4: Major Components
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AnalyticsSummary } from '../../../services/PredictiveAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { HealthScoreCircle } from './HealthScoreCircle';
import { InsightItem } from './InsightItem';

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
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#2196F3';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getEffortColor = (effort: string): string => {
    switch (effort) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
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
        <View style={styles.healthScoreContainer}>
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
            <View key={index} style={styles.riskItem}>
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
            <View key={index} style={styles.opportunityItem}>
              <View style={styles.opportunityHeader}>
                <Icon name="trending-up" size={20} color="#4CAF50" />
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
    color: '#2196F3',
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
    color: '#4CAF50',
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
