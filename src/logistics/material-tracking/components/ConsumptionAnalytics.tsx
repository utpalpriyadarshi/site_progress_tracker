import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ConsumptionData } from '../../../services/MaterialProcurementService';
import { COLORS } from '../../../theme/colors';

interface ConsumptionAnalyticsProps {
  consumptionData: Map<string, ConsumptionData>;
  maxItems?: number;
}

/**
 * ConsumptionAnalytics Component
 *
 * Displays consumption analytics for materials with:
 * - Daily, weekly, and monthly consumption rates
 * - Trend indicators with color coding
 * - Forecasted demand for 7 and 30 days
 * - Limited to maxItems (default: 10)
 *
 * Extracted from MaterialTrackingScreen Phase 4.
 */
export const ConsumptionAnalytics: React.FC<ConsumptionAnalyticsProps> = ({
  consumptionData,
  maxItems = 10,
}) => {
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return COLORS.WARNING;
      case 'decreasing': return COLORS.SUCCESS;
      default: return COLORS.INFO;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↑';
      case 'decreasing': return '↓';
      default: return '→';
    }
  };

  const entries = Array.from(consumptionData.entries()).slice(0, maxItems);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Consumption Analytics</Text>

      {entries.map(([materialId, data]) => (
        <View key={materialId} style={styles.card}>
          <Text style={styles.materialName}>{data.materialName}</Text>

          <View style={styles.ratesRow}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Daily Rate</Text>
              <Text style={styles.rateValue}>
                {data.dailyConsumptionRate.toFixed(1)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Weekly Rate</Text>
              <Text style={styles.rateValue}>
                {data.weeklyConsumptionRate.toFixed(1)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Monthly Rate</Text>
              <Text style={styles.rateValue}>
                {data.monthlyConsumptionRate.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.trendSection}>
            <Text style={styles.trendLabel}>Trend:</Text>
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: getTrendColor(data.trend) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.trendText,
                  { color: getTrendColor(data.trend) },
                ]}
              >
                {getTrendIcon(data.trend)} {data.trend.toUpperCase()}
                ({data.trendPercentage > 0 ? '+' : ''}{data.trendPercentage.toFixed(1)}%)
              </Text>
            </View>
          </View>

          <View style={styles.forecastSection}>
            <Text style={styles.forecastLabel}>Forecasted Demand:</Text>
            <Text style={styles.forecastValue}>
              7 days: {data.forecastedDemand7Days.toFixed(1)} |
              30 days: {data.forecastedDemand30Days.toFixed(1)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  ratesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  forecastSection: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
  },
  forecastLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
