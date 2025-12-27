import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const ResourceAllocationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resource Allocation</Text>
      <Text>Allocate resources for different construction tasks</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ResourceAllocationScreenWithBoundary = () => (
  <ErrorBoundary name="ResourceAllocationScreen">
    <ResourceAllocationScreen />
  </ErrorBoundary>
);

export default ResourceAllocationScreenWithBoundary;