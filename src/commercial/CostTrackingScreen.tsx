import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCommercial } from './context/CommercialContext';

/**
 * CostTrackingScreen (v2.11 Phase 5 - Sprint 3 Placeholder)
 *
 * Will display:
 * - Actual costs incurred on the project
 * - Cost categories (Labor, Materials, Equipment, Subcontractors, Overhead)
 * - Cost comparison against budget
 * - Add/Edit/Delete cost entries
 * - Cost trend analysis
 *
 * Full implementation in Sprint 5
 */

const CostTrackingScreen = () => {
  const { projectName } = useCommercial();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cost Tracking</Text>
        {projectName ? (
          <Text style={styles.subtitle}>Project: {projectName}</Text>
        ) : (
          <Text style={styles.warning}>No project assigned</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Cost Tracking will display:
          {'\n\n'}
          • Actual cost entries
          {'\n'}
          • Cost categories filter
          {'\n'}
          • Cost vs Budget comparison
          {'\n'}
          • Add/Edit/Delete cost entries
          {'\n'}
          • Cost trend analysis over time
          {'\n\n'}
          (Full implementation in Sprint 5)
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

export default CostTrackingScreen;
