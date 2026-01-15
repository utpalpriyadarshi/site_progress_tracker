import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';

const ResourcePlanningScreen = () => {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="none"
      accessibilityLabel="Resource Planning screen"
    >
      <EmptyState
        icon="account-hard-hat"
        title="Resource Planning"
        message="Plan and allocate resources for construction activities"
        helpText="Manage labor, equipment, and materials for your projects"
        variant="large"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ResourcePlanningScreenWithBoundary = () => (
  <ErrorBoundary name="ResourcePlanningScreen">
    <ResourcePlanningScreen />
  </ErrorBoundary>
);

export default ResourcePlanningScreenWithBoundary;