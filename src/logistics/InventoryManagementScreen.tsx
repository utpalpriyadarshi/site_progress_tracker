import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InventoryManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory Management</Text>
      <Text>Manage inventory levels and stock for construction materials</Text>
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

export default InventoryManagementScreen;