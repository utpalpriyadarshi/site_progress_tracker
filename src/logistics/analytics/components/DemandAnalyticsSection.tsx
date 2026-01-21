/**
 * DemandAnalyticsSection Component
 *
 * Displays demand forecasts, lead time predictions, and consumption patterns
 * Phase 4: Major Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Screen reader labels for analytics data
 * - Proper roles for interactive elements
 * - Text alternatives for visual metrics
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  DemandForecast,
  LeadTimePrediction,
  ConsumptionPattern,
} from '../../../services/PredictiveAnalyticsService';
import { AnalyticsCard } from './AnalyticsCard';
import { Badge } from './Badge';
import { MetricBox } from './MetricBox';
import { TrendIndicator } from './TrendIndicator';

interface DemandAnalyticsSectionProps {
  demandForecasts: DemandForecast[];
  leadTimePredictions: LeadTimePrediction[];
  consumptionPatterns: ConsumptionPattern[];
  onShowDetail: (detail: any, type: string) => void;
}

export const DemandAnalyticsSection: React.FC<DemandAnalyticsSectionProps> = ({
  demandForecasts,
  leadTimePredictions,
  consumptionPatterns,
  onShowDetail,
}) => {
  const getRiskColor = (riskScore: number): string => {
    if (riskScore > 70) return '#FF6B6B';
    if (riskScore > 40) return '#FF9800';
    return '#4CAF50';
  };

  const getPatternColor = (patternType: string): string => {
    switch (patternType) {
      case 'steady':
        return '#4CAF50';
      case 'seasonal':
        return '#2196F3';
      case 'project_based':
        return '#FF9800';
      case 'irregular':
        return '#FF6B6B';
      default:
        return '#999';
    }
  };

  return (
    <View>
      {/* Demand Forecasts */}
      <AnalyticsCard title="Demand Forecasts">
        {demandForecasts.map((forecast, index) => {
          const avgForecast = (
            forecast.forecast.predictions.reduce((s, p) => s + p.predictedValue, 0) /
            forecast.forecast.predictions.length
          ).toFixed(0);

          return (
          <TouchableOpacity
            key={index}
            style={styles.forecastItem}
            onPress={() => onShowDetail(forecast, 'demand')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${forecast.materialName}: current demand ${forecast.currentDemand.toFixed(0)}, average forecast ${avgForecast}, trend ${forecast.forecast.trend.direction}, recommended order ${forecast.recommendedOrderQuantity} ${forecast.unit}`}
            accessibilityHint="Double tap to view forecast details"
          >
            <View style={styles.forecastHeader}>
              <Text style={styles.forecastMaterial}>{forecast.materialName}</Text>
              <Icon name="chevron-right" size={24} color="#666" />
            </View>
            <View style={styles.forecastMetrics}>
              <MetricBox
                label="Current"
                value={forecast.currentDemand.toFixed(0)}
              />
              <MetricBox
                label="Avg Forecast"
                value={(
                  forecast.forecast.predictions.reduce((s, p) => s + p.predictedValue, 0) /
                  forecast.forecast.predictions.length
                ).toFixed(0)}
              />
              <MetricBox label="Trend">
                <TrendIndicator direction={forecast.forecast.trend.direction} />
              </MetricBox>
            </View>
            <Text style={styles.forecastRecommendation}>
              Recommended Order: {forecast.recommendedOrderQuantity} {forecast.unit}
            </Text>
          </TouchableOpacity>
        );
        })}
      </AnalyticsCard>

      {/* Lead Time Predictions */}
      <AnalyticsCard title="Supplier Lead Time Analysis">
        {leadTimePredictions.map((prediction, index) => (
          <TouchableOpacity
            key={index}
            style={styles.predictionItem}
            onPress={() => onShowDetail(prediction, 'leadtime')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${prediction.supplierName}: ${prediction.reliability.toFixed(0)}% reliability, predicted lead time ${prediction.predictedLeadTime} days, historical average ${prediction.historicalLeadTime.average.toFixed(0)} days, risk score ${prediction.riskScore.toFixed(0)}`}
            accessibilityHint="Double tap to view supplier details"
          >
            <View style={styles.predictionHeader}>
              <Text style={styles.predictionSupplier}>{prediction.supplierName}</Text>
              <Badge
                text={`${prediction.reliability.toFixed(0)}% reliable`}
                backgroundColor={
                  prediction.reliability > 80
                    ? '#4CAF50'
                    : prediction.reliability > 60
                    ? '#FF9800'
                    : '#FF6B6B'
                }
              />
            </View>
            <View style={styles.predictionMetrics}>
              <MetricBox
                label="Predicted"
                value={`${prediction.predictedLeadTime} days`}
              />
              <MetricBox
                label="Historical Avg"
                value={`${prediction.historicalLeadTime.average.toFixed(0)} days`}
              />
              <MetricBox
                label="Risk Score"
                value={prediction.riskScore.toFixed(0)}
                valueColor={getRiskColor(prediction.riskScore)}
              />
            </View>
            <Text style={styles.predictionRecommendation}>
              Order {prediction.recommendedOrderAdvance} days in advance
            </Text>
          </TouchableOpacity>
        ))}
      </AnalyticsCard>

      {/* Consumption Patterns */}
      <AnalyticsCard title="Consumption Patterns">
        {consumptionPatterns.map((pattern, index) => (
          <TouchableOpacity
            key={index}
            style={styles.patternItem}
            onPress={() => onShowDetail(pattern, 'consumption')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${pattern.materialName}: average daily consumption ${pattern.averageConsumption.toFixed(1)}, pattern type ${pattern.patternType.replace(/_/g, ' ')}, ${pattern.predictability.toFixed(0)}% predictability`}
            accessibilityHint="Double tap to view consumption details"
          >
            <Text style={styles.patternMaterial}>{pattern.materialName}</Text>
            <View style={styles.patternMetrics}>
              <MetricBox
                label="Avg Daily"
                value={pattern.averageConsumption.toFixed(1)}
              />
              <MetricBox label="Pattern">
                <Badge
                  text={pattern.patternType.replace(/_/g, ' ')}
                  backgroundColor={getPatternColor(pattern.patternType)}
                />
              </MetricBox>
              <MetricBox
                label="Predictability"
                value={`${pattern.predictability.toFixed(0)}%`}
              />
            </View>
          </TouchableOpacity>
        ))}
      </AnalyticsCard>
    </View>
  );
};

const styles = StyleSheet.create({
  forecastItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  forecastMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  forecastRecommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  predictionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionSupplier: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  predictionMetrics: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  predictionRecommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  patternItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  patternMaterial: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  patternMetrics: {
    flexDirection: 'row',
  },
});
