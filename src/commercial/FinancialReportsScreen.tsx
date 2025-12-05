import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommercial } from './context/CommercialContext';

/**
 * FinancialReportsScreen (v2.11 Phase 5 - Sprint 3 Placeholder)
 *
 * Will display:
 * - Budget variance report
 * - Cost analysis by category
 * - Cash flow projection
 * - Profitability analysis
 * - Date range filtering
 * - Export to PDF/Excel
 *
 * Full implementation in Sprint 7
 */

const FinancialReportsScreen = () => {
  const { projectName } = useCommercial();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Reports</Text>
        {projectName ? (
          <Text style={styles.subtitle}>Project: {projectName}</Text>
        ) : (
          <Text style={styles.warning}>No project assigned</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Financial Reports will display:
          {'\n\n'}
          • Budget Variance Report
          {'\n'}
          • Cost Analysis by Category
          {'\n'}
          • Cash Flow Projection
          {'\n'}
          • Profitability Analysis
          {'\n'}
          • Date Range Filtering
          {'\n'}
          • Export to PDF/Excel
          {'\n\n'}
          (Full implementation in Sprint 7)
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

export default FinancialReportsScreen;
