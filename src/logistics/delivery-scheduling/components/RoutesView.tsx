/**
 * RoutesView Component
 *
 * Displays route optimization information
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteOptimization } from '../../../services/DeliverySchedulingService';
import { getStatusColor } from '../utils/deliveryFormatters';

interface RoutesViewProps {
  routes: RouteOptimization[];
  onRoutePress?: (route: RouteOptimization) => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({ routes, onRoutePress }) => {
  if (routes.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No routes available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {routes.map(route => (
        <TouchableOpacity
          key={route.routeId}
          style={styles.card}
          onPress={() => onRoutePress?.(route)}
          disabled={!onRoutePress}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.routeId}>Route #{route.routeId.split('_')[1]}</Text>
              <Text style={styles.deliveries}>{route.deliveries.length} Deliveries</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(route.status as any) },
              ]}
            >
              <Text style={styles.statusText}>{route.status.toUpperCase()}</Text>
            </View>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{route.totalDistanceKm.toFixed(0)} km</Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{route.totalDurationHours.toFixed(1)} h</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>₹{route.totalCost.toFixed(0)}</Text>
              <Text style={styles.metricLabel}>Cost</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{route.fuelEstimate.toFixed(0)} L</Text>
              <Text style={styles.metricLabel}>Fuel</Text>
            </View>
          </View>

          {/* Optimization Score */}
          <View style={styles.optimization}>
            <View style={styles.optimizationBar}>
              <View
                style={[styles.optimizationFill, { width: `${route.optimizationScore}%` }]}
              />
            </View>
            <Text style={styles.optimizationText}>
              Score: {route.optimizationScore.toFixed(0)}/100 • Savings:{' '}
              {route.savingsPercentage.toFixed(0)}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}
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
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  deliveries: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  optimization: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  optimizationBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  optimizationFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  optimizationText: {
    fontSize: 12,
    color: '#666',
  },
});
