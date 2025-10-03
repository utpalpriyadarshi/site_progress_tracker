import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SiteInspectionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Site Inspection</Text>
      <Text>Perform and track site inspections and safety checks</Text>
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

export default SiteInspectionScreen;