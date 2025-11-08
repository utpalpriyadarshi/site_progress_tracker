import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EquipmentManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equipment Management</Text>
      <Text>Manage equipment and machinery for construction projects</Text>
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

export default EquipmentManagementScreen;