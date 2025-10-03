import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MaterialTrackingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Material Tracking</Text>
      <Text>Track materials and supplies for construction projects</Text>
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

export default MaterialTrackingScreen;