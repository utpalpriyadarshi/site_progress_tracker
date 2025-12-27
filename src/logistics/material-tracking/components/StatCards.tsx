import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface StatCardsProps {
  stats: {
    total: number;
    critical: number;
    shortageCount: number;
    sufficient: number;
    procurementPending: number;
  };
}

/**
 * StatCards Component
 *
 * Displays summary statistics in horizontal scrollable cards:
 * - Total Items
 * - Critical Items
 * - Shortages
 * - Sufficient Stock
 * - Procurement Pending
 *
 * Extracted from MaterialTrackingScreen for reusability.
 */
export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {/* Total Items Card */}
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total Items</Text>
      </View>

      {/* Critical Items Card */}
      <View style={[styles.statCard, styles.statCardCritical]}>
        <Text style={styles.statValue}>{stats.critical}</Text>
        <Text style={styles.statLabel}>Critical</Text>
      </View>

      {/* Shortages Card */}
      <View style={[styles.statCard, styles.statCardWarning]}>
        <Text style={styles.statValue}>{stats.shortageCount}</Text>
        <Text style={styles.statLabel}>Shortages</Text>
      </View>

      {/* Sufficient Stock Card */}
      <View style={[styles.statCard, styles.statCardSuccess]}>
        <Text style={styles.statValue}>{stats.sufficient}</Text>
        <Text style={styles.statLabel}>Sufficient</Text>
      </View>

      {/* Procurement Pending Card */}
      <View style={[styles.statCard, styles.statCardInfo]}>
        <Text style={styles.statValue}>{stats.procurementPending}</Text>
        <Text style={styles.statLabel}>To Procure</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  statCard: {
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    alignItems: 'center',
  },
  statCardCritical: {
    backgroundColor: '#FFEBEE',
  },
  statCardWarning: {
    backgroundColor: '#FFF3E0',
  },
  statCardSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statCardInfo: {
    backgroundColor: '#E3F2FD',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
