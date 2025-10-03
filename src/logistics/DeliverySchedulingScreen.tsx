import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DeliverySchedulingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Scheduling</Text>
      <Text>Schedule and track deliveries of materials and equipment</Text>
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

export default DeliverySchedulingScreen;