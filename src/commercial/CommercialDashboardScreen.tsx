import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommercial } from './context/CommercialContext';

/**
 * CommercialDashboardScreen (v2.11 Phase 5 - Sprint 3 Placeholder)
 *
 * Will display:
 * - Project budget summary
 * - Total costs vs budget
 * - Pending invoices
 * - Cash flow projection
 * - Budget variance analysis
 *
 * Full implementation in Sprint 8
 */

const CommercialDashboardScreen = () => {
  const { projectName } = useCommercial();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commercial Dashboard</Text>
        {projectName ? (
          <Text style={styles.subtitle}>Project: {projectName}</Text>
        ) : (
          <Text style={styles.warning}>No project assigned</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Dashboard will display:
          {'\n\n'}
          • Project Budget Summary
          {'\n'}
          • Total Costs vs Budget
          {'\n'}
          • Pending Invoices
          {'\n'}
          • Cash Flow Projection
          {'\n'}
          • Budget Variance Analysis
          {'\n\n'}
          (Full implementation in Sprint 8)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  warning: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  placeholder: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
});

export default CommercialDashboardScreen;
