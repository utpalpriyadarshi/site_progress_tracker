/**
 * PerformanceView Component
 *
 * Displays delivery performance analytics and metrics
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  DeliveryPerformance,
  DeliveryException,
} from '../../../services/DeliverySchedulingService';
import { getPriorityColor } from '../utils/deliveryFormatters';

interface PerformanceViewProps {
  performance: DeliveryPerformance | null;
  exceptions: DeliveryException[];
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({
  performance,
  exceptions,
}) => {
  if (!performance) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No performance data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {/* On-Time Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>On-Time Performance</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.onTimePercentage.toFixed(1)}%</Text>
            <Text style={styles.label}>On-Time Rate</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.value, { color: '#10b981' }]}>
              {performance.onTimeDeliveries}
            </Text>
            <Text style={styles.label}>On-Time</Text>
          </View>
          <View style={styles.card}>
            <Text style={[styles.value, { color: '#ef4444' }]}>
              {performance.lateDeliveries}
            </Text>
            <Text style={styles.label}>Late</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.averageDelayHours.toFixed(1)} h</Text>
            <Text style={styles.label}>Avg Delay</Text>
          </View>
        </View>
      </View>

      {/* Cost Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Analysis</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.value}>₹{performance.totalCost.toFixed(0)}</Text>
            <Text style={styles.label}>Total Cost</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>₹{performance.averageCostPerDelivery.toFixed(0)}</Text>
            <Text style={styles.label}>Avg/Delivery</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>₹{performance.costPerKm.toFixed(1)}</Text>
            <Text style={styles.label}>Cost/km</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.utilizationRate.toFixed(0)}%</Text>
            <Text style={styles.label}>Utilization</Text>
          </View>
        </View>
      </View>

      {/* Efficiency Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Efficiency Metrics</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.averageDistanceKm.toFixed(0)} km</Text>
            <Text style={styles.label}>Avg Distance</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.averageDurationHours.toFixed(1)} h</Text>
            <Text style={styles.label}>Avg Duration</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.damageRate.toFixed(1)}%</Text>
            <Text style={styles.label}>Damage Rate</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.value}>{performance.customerSatisfaction.toFixed(0)}</Text>
            <Text style={styles.label}>Satisfaction</Text>
          </View>
        </View>
      </View>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Exceptions ({exceptions.length})</Text>
          {exceptions.slice(0, 5).map(exception => (
            <View key={exception.id} style={styles.exceptionCard}>
              <View
                style={[
                  styles.exceptionBadge,
                  { backgroundColor: getPriorityColor(exception.severity as any) },
                ]}
              >
                <Text style={styles.exceptionBadgeText}>
                  {exception.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.exceptionContent}>
                <Text style={styles.exceptionType}>
                  {exception.type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.exceptionDescription}>{exception.description}</Text>
                {exception.resolution && (
                  <Text style={styles.exceptionResolution}>✓ {exception.resolution}</Text>
                )}
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
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '48%',
    margin: '1%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  exceptionCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  exceptionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    height: 24,
  },
  exceptionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  exceptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  exceptionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  exceptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exceptionResolution: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
  },
});
